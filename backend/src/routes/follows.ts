import type { FastifyInstance, FastifyRequest } from 'fastify'
import jwt from 'jsonwebtoken'
import { db } from '../db'
import { follows, pushTokens } from '../db/schema'
import { eq, and, inArray } from 'drizzle-orm'

function getUserId(req: FastifyRequest): string {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) throw new Error('Unauthorized')
  const token = auth.slice(7)
  const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
  return payload.userId
}

export async function followsRoutes(app: FastifyInstance) {
  // POST /push-token — register Expo push token
  app.post<{ Body: { token: string; platform: string } }>('/push-token', {
    schema: {
      body: {
        type: 'object',
        required: ['token', 'platform'],
        properties: {
          token: { type: 'string' },
          platform: { type: 'string', enum: ['ios', 'android'] },
        },
      },
    },
    handler: async (req, reply) => {
      try {
        const userId = getUserId(req)
        await db
          .insert(pushTokens)
          .values({ userId, token: req.body.token, platform: req.body.platform })
          .onConflictDoUpdate({
            target: pushTokens.token,
            set: { userId, updatedAt: new Date() },
          })
        return reply.code(204).send()
      } catch (err: any) {
        if (err.message === 'Unauthorized') return reply.code(401).send({ error: 'Unauthorized' })
        return reply.code(500).send({ error: 'Failed to save token' })
      }
    },
  })

  // GET /follows — list all follows for current user
  app.get('/follows', {
    handler: async (req, reply) => {
      try {
        const userId = getUserId(req)
        const rows = await db.select().from(follows).where(eq(follows.userId, userId))
        return rows.map(r => ({
          id: r.id,
          entityType: r.entityType,
          entityId: r.entityId,
          entityName: r.entityName,
          createdAt: r.createdAt,
        }))
      } catch (err: any) {
        if (err.message === 'Unauthorized') return reply.code(401).send({ error: 'Unauthorized' })
        return reply.code(500).send({ error: 'Failed to fetch follows' })
      }
    },
  })

  // POST /follows — add a follow
  app.post<{ Body: { entityType: string; entityId: string; entityName: string } }>('/follows', {
    schema: {
      body: {
        type: 'object',
        required: ['entityType', 'entityId', 'entityName'],
        properties: {
          entityType: { type: 'string', enum: ['politician', 'state', 'party'] },
          entityId: { type: 'string' },
          entityName: { type: 'string' },
        },
      },
    },
    handler: async (req, reply) => {
      try {
        const userId = getUserId(req)
        const { entityType, entityId, entityName } = req.body
        const existing = await db
          .select()
          .from(follows)
          .where(and(eq(follows.userId, userId), eq(follows.entityId, entityId.toLowerCase())))
        if (existing.length) return reply.code(409).send({ error: 'Already following' })
        const [row] = await db
          .insert(follows)
          .values({ userId, entityType, entityId: entityId.toLowerCase(), entityName })
          .returning()
        return reply.code(201).send(row)
      } catch (err: any) {
        if (err.message === 'Unauthorized') return reply.code(401).send({ error: 'Unauthorized' })
        return reply.code(500).send({ error: 'Failed to add follow' })
      }
    },
  })

  // DELETE /follows/:entityId — unfollow
  app.delete<{ Params: { entityId: string } }>('/follows/:entityId', {
    handler: async (req, reply) => {
      try {
        const userId = getUserId(req)
        await db
          .delete(follows)
          .where(and(eq(follows.userId, userId), eq(follows.entityId, req.params.entityId.toLowerCase())))
        return reply.code(204).send()
      } catch (err: any) {
        if (err.message === 'Unauthorized') return reply.code(401).send({ error: 'Unauthorized' })
        return reply.code(500).send({ error: 'Failed to unfollow' })
      }
    },
  })
}
