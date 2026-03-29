import type { FastifyInstance } from 'fastify'
import { STATE_REGISTRATION } from '../data/stateRegistration'
import { findNearestRegistrationSites } from '../services/mapbox'

export async function registrationRoutes(app: FastifyInstance) {
  app.get('/registration', async () => {
    return Object.keys(STATE_REGISTRATION).map(code => ({
      code,
      name: STATE_REGISTRATION[code].stateName,
    }))
  })

  app.get<{ Params: { state: string } }>('/registration/:state', async (req, reply) => {
    const guide = STATE_REGISTRATION[req.params.state.toUpperCase()]
    if (!guide) return reply.code(404).send({ error: 'State not found' })
    return guide
  })

  app.post<{ Params: { state: string }; Body: { address: string } }>(
    '/registration/:state/sites',
    {
      schema: {
        body: { type: 'object', required: ['address'], properties: { address: { type: 'string' } } },
      },
      handler: async (req, reply) => {
        try {
          const sites = await findNearestRegistrationSites(req.body.address, req.params.state)
          return { sites }
        } catch {
          return reply.code(503).send({ error: 'Location service temporarily unavailable' })
        }
      },
    },
  )
}
