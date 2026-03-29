import type { FastifyInstance } from 'fastify'
import { getChatResponse, type ChatMessage } from '../services/aiChat'
import { getCandidatesForBallot } from '../services/candidates'

export async function aiRoutes(app: FastifyInstance) {
  app.post<{ Body: { messages: ChatMessage[]; address: string } }>('/ai/chat', {
    schema: {
      body: {
        type: 'object',
        required: ['messages', 'address'],
        properties: {
          messages: { type: 'array', maxItems: 20 },
          address: { type: 'string' },
        },
      },
    },
    handler: async (req, reply) => {
      try {
        const candidates = await getCandidatesForBallot(req.body.address)
        const answer = await getChatResponse(req.body.messages, candidates)
        return { answer, model: 'claude-sonnet-4-6' }
      } catch (err: any) {
        if (err?.status === 529) {
          return reply.code(503).send({ error: 'AI guide temporarily unavailable' })
        }
        return reply.code(500).send({ error: 'Failed to get AI response' })
      }
    },
  })
}
