import type { FastifyInstance } from 'fastify'
import { registerUser, loginUser, refreshAccessToken } from '../services/auth'

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: { email: string; password: string } }>('/auth/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
    },
    handler: async (req, reply) => {
      try {
        const tokens = await registerUser(req.body.email, req.body.password)
        return reply.code(201).send(tokens)
      } catch (err: any) {
        if (err.message === 'Email already registered') return reply.code(409).send({ error: err.message })
        return reply.code(500).send({ error: 'Registration failed' })
      }
    },
  })

  app.post<{ Body: { email: string; password: string } }>('/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: { email: { type: 'string' }, password: { type: 'string' } },
      },
    },
    handler: async (req, reply) => {
      try {
        const tokens = await loginUser(req.body.email, req.body.password)
        return tokens
      } catch {
        return reply.code(401).send({ error: 'Invalid credentials' })
      }
    },
  })

  app.post<{ Body: { refreshToken: string } }>('/auth/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: { refreshToken: { type: 'string' } },
      },
    },
    handler: async (req, reply) => {
      try {
        const result = await refreshAccessToken(req.body.refreshToken)
        return result
      } catch {
        return reply.code(401).send({ error: 'Invalid or expired refresh token' })
      }
    },
  })
}
