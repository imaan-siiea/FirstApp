import type { FastifyInstance } from 'fastify'
import { getCandidatesForBallot } from '../services/candidates'

export async function candidateRoutes(app: FastifyInstance) {
  app.post<{ Body: { address: string } }>('/candidates', {
    schema: {
      body: {
        type: 'object',
        required: ['address'],
        properties: { address: { type: 'string' } },
      },
    },
    handler: async (req, reply) => {
      try {
        const candidates = await getCandidatesForBallot(req.body.address)
        return { candidates }
      } catch {
        return reply.code(503).send({ error: 'Candidate data temporarily unavailable' })
      }
    },
  })
}
