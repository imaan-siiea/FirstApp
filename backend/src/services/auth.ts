import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { db } from '../db'
import { users, refreshTokens } from '../db/schema'
import { eq } from 'drizzle-orm'

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET!
const REFRESH_TTL_DAYS = 30

export async function registerUser(email: string, password: string) {
  const existing = await db.select().from(users).where(eq(users.email, email))
  if (existing.length) throw new Error('Email already registered')

  const passwordHash = await bcrypt.hash(password, 12)
  const [user] = await db.insert(users).values({ email, passwordHash }).returning()
  return issueTokens(user.id)
}

export async function loginUser(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (!user || !user.passwordHash) throw new Error('Invalid credentials')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new Error('Invalid credentials')

  return issueTokens(user.id)
}

export async function refreshAccessToken(token: string) {
  const [stored] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token))
  if (!stored || stored.expiresAt < new Date()) throw new Error('Invalid refresh token')

  const accessToken = jwt.sign({ userId: stored.userId }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' })
  return { accessToken }
}

async function issueTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' })
  const refreshToken = jwt.sign({ userId }, ACCESS_TOKEN_SECRET + '_refresh')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS)

  await db.insert(refreshTokens).values({ userId, token: refreshToken, expiresAt })
  return { accessToken, refreshToken }
}
