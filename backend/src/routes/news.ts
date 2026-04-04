import type { FastifyInstance } from 'fastify'
import { getStateNewsWithFallback, getLatestElectionNews } from '../services/newsRss'
import { generateStateBriefing } from '../services/aiChat'
import { checkAndNotifyFollows } from '../services/notifications'

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

export async function newsRoutes(app: FastifyInstance) {
  // GET /news/elections?state=XX  — state-filtered news
  app.get<{ Querystring: { state: string } }>('/news/elections', {
    schema: {
      querystring: {
        type: 'object',
        required: ['state'],
        properties: { state: { type: 'string', minLength: 2, maxLength: 2 } },
      },
    },
    config: { rateLimit: { max: 120, timeWindow: '1 minute' } },
    handler: async (req, reply) => {
      try {
        const code = req.query.state.toUpperCase()
        const name = STATE_NAMES[code]
        if (!name) return reply.code(400).send({ error: 'Unknown state code' })
        const articles = await getStateNewsWithFallback(code, generateStateBriefing)
        // Fire-and-forget: push notifications to followers (doesn't block response)
        checkAndNotifyFollows(code, articles).catch(err => app.log.warn('[notifications]', err?.message))
        return { state: code, stateName: name, articles }
      } catch (err) {
        app.log.error(err)
        return reply.code(503).send({ error: 'News unavailable' })
      }
    },
  })

  // GET /news/latest — general latest political news (used when no state selected)
  app.get('/news/latest', {
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    handler: async (_req, reply) => {
      try {
        const articles = await getLatestElectionNews()
        return { articles }
      } catch (err) {
        app.log.error(err)
        return reply.code(503).send({ error: 'News unavailable' })
      }
    },
  })
}
