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

  const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) ?? []
  app.register(cors, {
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
  })

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production')
  }
  app.register(jwt, { secret: jwtSecret ?? 'dev-secret-change-before-deploying' })
  app.register(rateLimit, { max: 100, timeWindow: '1 minute' })

  app.get('/health', async () => ({ status: 'ok' }))

  app.register(ballotRoutes)
  app.register(candidateRoutes)
  app.register(aiRoutes)
  app.register(registrationRoutes)
  app.register(authRoutes)

  return app
}
