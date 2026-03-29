import type { FastifyInstance } from 'fastify'
import { getCandidatesForBallot, getCandidateById } from '../services/candidates'

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

  app.get<{ Params: { id: string }; Querystring: { address: string } }>('/candidates/:id', {
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      querystring: { type: 'object', required: ['address'], properties: { address: { type: 'string' } } },
    },
    handler: async (req, reply) => {
      try {
        const candidate = await getCandidateById(req.params.id, req.query.address)
        if (!candidate) return reply.code(404).send({ error: 'Candidate not found' })
        return candidate
      } catch {
        return reply.code(503).send({ error: 'Candidate data temporarily unavailable' })
      }
    },
  })
}
