import { describe, it, expect, beforeAll } from 'vitest'
import { buildApp } from './app'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret'
})

describe('GET /health', () => {
  it('returns ok', async () => {
    const app = buildApp()
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })
})
