import type { FastifyInstance } from 'fastify'
import { getChatResponse, getCountyElectionsSummary, getRepProfile, getStateTrends, getPollingOutlook, type ChatMessage, type RepContext } from '../services/aiChat'
import { getCandidatesForBallot } from '../services/candidates'
import { getPollingCached, setPollingCached } from '../services/pollingCache'

const STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',
  IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
  ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
  MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',
  OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
}

export async function aiRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { state: string } }>('/ai/county-elections', {
    schema: {
      querystring: {
        type: 'object',
        required: ['state'],
        properties: { state: { type: 'string', minLength: 2, maxLength: 2 } },
      },
    },
    config: { rateLimit: { max: 30, timeWindow: '1 day', keyGenerator: (req: any) => req.ip } },
    handler: async (req, reply) => {
      try {
        const code = req.query.state.toUpperCase()
        const name = STATE_NAMES[code]
        if (!name) return reply.code(400).send({ error: 'Unknown state code' })
        const summary = await getCountyElectionsSummary(code, name)
        return { state: code, stateName: name, summary, source: 'AI-generated' }
      } catch {
        return reply.code(503).send({ error: 'AI unavailable' })
      }
    },
  })

  app.get<{ Querystring: { name: string; state: string; chamber: string; party: string } }>('/ai/rep-profile', {
    schema: {
      querystring: {
        type: 'object',
        required: ['name', 'state', 'chamber', 'party'],
        properties: {
          name: { type: 'string' },
          state: { type: 'string' },
          chamber: { type: 'string' },
          party: { type: 'string' },
        },
      },
    },
    config: { rateLimit: { max: 60, timeWindow: '1 day', keyGenerator: (req: any) => req.ip } },
    handler: async (req, reply) => {
      try {
        const { name, state, chamber, party } = req.query
        const profile = await getRepProfile(name, state, chamber, party)
        return profile
      } catch {
        return reply.code(503).send({ error: 'AI unavailable' })
      }
    },
  })

  app.get<{ Querystring: { state: string } }>('/ai/state-trends', {
    schema: {
      querystring: {
        type: 'object',
        required: ['state'],
        properties: { state: { type: 'string', minLength: 2, maxLength: 2 } },
      },
    },
    config: { rateLimit: { max: 30, timeWindow: '1 day', keyGenerator: (req: any) => req.ip } },
    handler: async (req, reply) => {
      try {
        const code = req.query.state.toUpperCase()
        const name = STATE_NAMES[code]
        if (!name) return reply.code(400).send({ error: 'Unknown state code' })
        const trends = await getStateTrends(code, name)
        return { state: code, stateName: name, trends }
      } catch {
        return reply.code(503).send({ error: 'AI unavailable' })
      }
    },
  })

  app.get<{ Querystring: { state: string } }>('/ai/polling', {
    schema: {
      querystring: {
        type: 'object',
        required: ['state'],
        properties: { state: { type: 'string', minLength: 2, maxLength: 2 } },
      },
    },
    config: { rateLimit: { max: 20, timeWindow: '1 day', keyGenerator: (req: any) => req.ip } },
    handler: async (req, reply) => {
      try {
        const code = req.query.state.toUpperCase()
        const name = STATE_NAMES[code]
        if (!name) return reply.code(400).send({ error: 'Unknown state code' })

        // Serve from cache if fresh — background job keeps it warm
        const cached = getPollingCached(code)
        if (cached) return { state: code, stateName: name, ...cached }

        // Cache miss — generate fresh and store
        const polling = await getPollingOutlook(code, name)
        setPollingCached(code, polling)
        return { state: code, stateName: name, ...polling }
      } catch {
        return reply.code(503).send({ error: 'AI unavailable' })
      }
    },
  })

  app.post<{ Body: { messages: ChatMessage[]; address: string; repContext?: RepContext } }>('/ai/chat', {
    schema: {
      body: {
        type: 'object',
        required: ['messages', 'address'],
        properties: {
          messages: { type: 'array', maxItems: 20 },
          address: { type: 'string' },
          repContext: { type: 'object', nullable: true },
        },
      },
    },
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 day',
        keyGenerator: (req: any) => req.ip,
      },
    },
    handler: async (req, reply) => {
      try {
        const candidates = req.body.address
          ? await getCandidatesForBallot(req.body.address).catch(() => [])
          : []
        const answer = await getChatResponse(req.body.messages, candidates, req.body.repContext ?? null)
        return { answer, model: 'llama-3.3-70b-versatile' }
      } catch {
        return reply.code(503).send({ error: 'AI guide temporarily unavailable' })
      }
    },
  })
}
