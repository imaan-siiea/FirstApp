import type { FastifyInstance } from 'fastify'
import { getBallotForAddress } from '../services/civicApi'

export async function ballotRoutes(app: FastifyInstance) {
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
