import type { FastifyInstance } from 'fastify'
import { getBallotForAddress, getUpcomingElections } from '../services/civicApi'

export async function ballotRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { state?: string } }>('/elections', {
    handler: async (req) => {
      const elections = await getUpcomingElections()
      const { state } = req.query
      if (state) {
        const code = state.toUpperCase()
        return { elections: elections.filter(e => e.stateCode === code || e.stateCode === null) }
      }
      return { elections }
    },
  })

  app.post<{ Body: { address: string } }>('/ballot', {
    schema: {
      body: {
        type: 'object',
        required: ['address'],
        properties: { address: { type: 'string', minLength: 5 } },
      },
    },
    handler: async (req, reply) => {
      try {
        const ballot = await getBallotForAddress(req.body.address)
        return ballot
      } catch (err: any) {
        if (err?.response?.statusCode === 404) {
          return reply.code(404).send({ error: 'No election data found for this address' })
        }
        return reply.code(503).send({ error: 'Election data temporarily unavailable' })
      }
    },
  })
}
