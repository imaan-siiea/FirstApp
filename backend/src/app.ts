import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import { ballotRoutes } from './routes/ballot'
import { candidateRoutes } from './routes/candidates'
import { aiRoutes } from './routes/ai'
import { registrationRoutes } from './routes/registration'
import { authRoutes } from './routes/auth'

export function buildApp() {
  const app = Fastify({ logger: true })

  app.register(cors, { origin: true })
  app.register(jwt, { secret: process.env.JWT_SECRET ?? 'dev-secret' })
  app.register(rateLimit, { max: 100, timeWindow: '1 minute' })

  app.get('/health', async () => ({ status: 'ok' }))

  app.register(ballotRoutes)
  app.register(candidateRoutes)
  app.register(aiRoutes)
  app.register(registrationRoutes)
  app.register(authRoutes)

  return app
}
