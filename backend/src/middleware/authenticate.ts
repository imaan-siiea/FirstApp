import type { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

export async function optionalAuth(req: FastifyRequest, _reply: FastifyReply) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return

  try {
    const token = header.slice(7)
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    ;(req as any).userId = payload.userId
  } catch {
    // Invalid token — treat as unauthenticated
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  await optionalAuth(req, reply)
  if (!(req as any).userId) {
    return reply.code(401).send({ error: 'Authentication required' })
  }
}
