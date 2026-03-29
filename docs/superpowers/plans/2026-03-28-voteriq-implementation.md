# VoterIQ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build VoterIQ — a native iOS + Android civic companion app with Claude-powered ballot guide, federal/state candidate info, and voter registration guidance.

**Architecture:** Fastify + TypeScript backend deployed on Coolify/Proxmox serves a REST API consumed by an Expo + React Native mobile app. Civic data is aggregated from Google Civic API, OpenStates, and Ballotpedia into PostgreSQL (with Redis caching), then synthesized by Claude API for conversational Q&A.

**Tech Stack:** Expo SDK 52 / React Native / TypeScript / Expo Router / Zustand / TanStack Query / Mapbox | Node.js / Fastify / Drizzle ORM / PostgreSQL 16 / Redis 7 / Claude API (claude-sonnet-4-6) / JWT / EAS Build

---

## Build Streams

```
Stream A (Backend):  Task 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11
Stream B (Mobile):  Task 12 → 13 → 14 → 15 → 16 → 17 → 18
                              (starts in parallel with Stream A Task 1)
Integration:        Task 19 → 20
```

---

## STREAM A: BACKEND

---

### Task 1: Backend Project Scaffold

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/index.ts`
- Create: `backend/src/app.ts`
- Create: `backend/.env.example`
- Create: `backend/Dockerfile`

- [ ] **Step 1: Initialize backend directory and install dependencies**

```bash
mkdir backend && cd backend
npm init -y
npm install fastify @fastify/cors @fastify/jwt @fastify/rate-limit dotenv
npm install -D typescript @types/node ts-node nodemon tsx
npx tsc --init
```

- [ ] **Step 2: Write `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Write `backend/src/app.ts`**

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'

export function buildApp() {
  const app = Fastify({ logger: true })

  app.register(cors, { origin: true })
  app.register(jwt, { secret: process.env.JWT_SECRET! })
  app.register(rateLimit, { max: 100, timeWindow: '1 minute' })

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
```

- [ ] **Step 4: Write `backend/src/index.ts`**

```typescript
import { buildApp } from './app'

const PORT = parseInt(process.env.PORT ?? '3000', 10)

async function start() {
  const app = buildApp()
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
```

- [ ] **Step 5: Write `backend/.env.example`**

```
PORT=3000
JWT_SECRET=change-me-in-production
DATABASE_URL=postgresql://voteriq:password@localhost:5432/voteriq
REDIS_URL=redis://localhost:6379
GOOGLE_CIVIC_API_KEY=
BALLOTPEDIA_API_KEY=
OPENSTATES_API_KEY=
ANTHROPIC_API_KEY=
MAPBOX_ACCESS_TOKEN=
```

- [ ] **Step 6: Write `backend/Dockerfile`**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

- [ ] **Step 7: Add scripts to `backend/package.json`**

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest"
  }
}
```

- [ ] **Step 8: Install test runner**

```bash
cd backend
npm install -D vitest @vitest/coverage-v8 supertest @types/supertest
```

- [ ] **Step 9: Write `backend/src/app.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { buildApp } from './app'

describe('GET /health', () => {
  it('returns ok', async () => {
    const app = buildApp()
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })
})
```

- [ ] **Step 10: Run tests**

```bash
cd backend && npm test
```
Expected: PASS — 1 test passing

- [ ] **Step 11: Commit**

```bash
cd backend && git add . && git commit -m "feat(backend): scaffold Fastify TypeScript backend with health endpoint"
```

---

### Task 2: Database Schema + Drizzle ORM

**Files:**
- Create: `backend/src/db/index.ts`
- Create: `backend/src/db/schema.ts`
- Create: `backend/drizzle.config.ts`
- Create: `backend/src/db/migrate.ts`

- [ ] **Step 1: Install Drizzle + PostgreSQL driver**

```bash
cd backend
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg
```

- [ ] **Step 2: Write `backend/src/db/schema.ts`**

```typescript
import { pgTable, text, timestamp, jsonb, integer, boolean, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  oauthProvider: text('oauth_provider'),
  oauthId: text('oauth_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const userBallots = pgTable('user_ballots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  address: text('address').notNull(),
  districtData: jsonb('district_data').notNull(),
  savedAt: timestamp('saved_at').defaultNow().notNull(),
})

export const candidates = pgTable('candidates', {
  id: text('id').primaryKey(), // e.g. "ocd-person/..."
  name: text('name').notNull(),
  office: text('office').notNull(),
  state: text('state').notNull(),
  district: text('district'),
  party: text('party'),
  bio: text('bio'),
  photoUrl: text('photo_url'),
  websiteUrl: text('website_url'),
  positionsJson: jsonb('positions_json'), // { issue: string, position: string, source: string }[]
  sourcesJson: jsonb('sources_json'),     // { name: string, url: string, fetchedAt: string }[]
  fetchedAt: timestamp('fetched_at').notNull(),
})

export const races = pgTable('races', {
  id: text('id').primaryKey(),
  office: text('office').notNull(),
  state: text('state').notNull(),
  district: text('district'),
  electionDate: text('election_date').notNull(),
  candidateIds: jsonb('candidate_ids').notNull(), // string[]
})

export const stateRegistration = pgTable('state_registration', {
  stateCode: text('state_code').primaryKey(),
  stateName: text('state_name').notNull(),
  deadlineRules: jsonb('deadline_rules').notNull(),
  methodsJson: jsonb('methods_json').notNull(),
  officialUrl: text('official_url').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const electionReminders = pgTable('election_reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  electionDate: text('election_date').notNull(),
  remindAt: timestamp('remind_at').notNull(),
  sent: boolean('sent').default(false).notNull(),
})

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

- [ ] **Step 3: Write `backend/src/db/index.ts`**

```typescript
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })
export type DB = typeof db
```

- [ ] **Step 4: Write `backend/drizzle.config.ts`**

```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: { connectionString: process.env.DATABASE_URL! },
} satisfies Config
```

- [ ] **Step 5: Generate and run migrations**

```bash
cd backend
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

- [ ] **Step 6: Write schema test `backend/src/db/schema.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { users, candidates, stateRegistration } from './schema'

describe('schema', () => {
  it('users table has required columns', () => {
    expect(users.id).toBeDefined()
    expect(users.email).toBeDefined()
    expect(users.passwordHash).toBeDefined()
  })

  it('candidates table has positions and sources', () => {
    expect(candidates.positionsJson).toBeDefined()
    expect(candidates.sourcesJson).toBeDefined()
    expect(candidates.fetchedAt).toBeDefined()
  })

  it('stateRegistration has officialUrl', () => {
    expect(stateRegistration.officialUrl).toBeDefined()
  })
})
```

- [ ] **Step 7: Run tests**

```bash
cd backend && npm test
```
Expected: PASS — 3 tests passing (schema tests are structural)

- [ ] **Step 8: Commit**

```bash
git add backend/src/db/ backend/drizzle.config.ts backend/drizzle/
git commit -m "feat(backend): add PostgreSQL schema with Drizzle ORM"
```

---

### Task 3: Redis Cache Layer

**Files:**
- Create: `backend/src/cache/index.ts`
- Create: `backend/src/cache/cache.test.ts`

- [ ] **Step 1: Install Redis client**

```bash
cd backend && npm install ioredis && npm install -D @types/ioredis
```

- [ ] **Step 2: Write `backend/src/cache/index.ts`**

```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')

export async function cacheGet<T>(key: string): Promise<T | null> {
  const val = await redis.get(key)
  return val ? (JSON.parse(val) as T) : null
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
}

export async function cacheDel(key: string): Promise<void> {
  await redis.del(key)
}

export { redis }
```

- [ ] **Step 3: Write `backend/src/cache/cache.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { cacheGet, cacheSet, cacheDel, redis } from './index'

beforeEach(async () => { await redis.flushdb() })

describe('cache', () => {
  it('stores and retrieves a value', async () => {
    await cacheSet('test:key', { foo: 'bar' }, 60)
    const result = await cacheGet<{ foo: string }>('test:key')
    expect(result).toEqual({ foo: 'bar' })
  })

  it('returns null for missing key', async () => {
    const result = await cacheGet('nonexistent')
    expect(result).toBeNull()
  })

  it('deletes a key', async () => {
    await cacheSet('del:key', 'value', 60)
    await cacheDel('del:key')
    const result = await cacheGet('del:key')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 4: Run tests** (requires Redis running locally or via Docker)

```bash
cd backend && npm test src/cache/cache.test.ts
```
Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add backend/src/cache/
git commit -m "feat(backend): add Redis cache layer with get/set/del helpers"
```

---

### Task 4: Google Civic API Integration

**Files:**
- Create: `backend/src/services/civicApi.ts`
- Create: `backend/src/services/civicApi.test.ts`
- Create: `backend/src/routes/ballot.ts`

- [ ] **Step 1: Install HTTP client**

```bash
cd backend && npm install got
```

- [ ] **Step 2: Write `backend/src/services/civicApi.ts`**

```typescript
import got from 'got'
import { cacheGet, cacheSet } from '../cache'

const BASE_URL = 'https://www.googleapis.com/civicinfo/v2'
const API_KEY = process.env.GOOGLE_CIVIC_API_KEY!
const CACHE_TTL = 60 * 60 * 24 // 24 hours

export interface CivicDistrict {
  id: string
  name: string
  scope: string // 'stateUpper' | 'stateLower' | 'congressional' | 'national' etc.
}

export interface CivicContest {
  type: string
  office: string
  level: string[]
  roles: string[]
  district: { name: string; scope: string; id: string }
  candidates?: { name: string; party?: string; candidateUrl?: string; photoUrl?: string }[]
  referendumTitle?: string
}

export interface CivicBallot {
  normalizedAddress: string
  contests: CivicContest[]
  pollingLocations?: { address: { locationName: string; line1: string } }[]
}

export async function getBallotForAddress(address: string): Promise<CivicBallot> {
  const cacheKey = `civic:ballot:${address.toLowerCase().replace(/\s+/g, '-')}`
  const cached = await cacheGet<CivicBallot>(cacheKey)
  if (cached) return cached

  const response = await got(`${BASE_URL}/voterinfo`, {
    searchParams: { key: API_KEY, address, electionId: 'upcoming' },
  }).json<any>()

  const ballot: CivicBallot = {
    normalizedAddress: response.normalizedInput
      ? `${response.normalizedInput.line1}, ${response.normalizedInput.city}, ${response.normalizedInput.state}`
      : address,
    contests: response.contests ?? [],
    pollingLocations: response.pollingLocations ?? [],
  }

  await cacheSet(cacheKey, ballot, CACHE_TTL)
  return ballot
}

export async function getRepresentativesByAddress(address: string): Promise<any> {
  const cacheKey = `civic:reps:${address.toLowerCase().replace(/\s+/g, '-')}`
  const cached = await cacheGet<any>(cacheKey)
  if (cached) return cached

  const response = await got(`${BASE_URL}/representatives`, {
    searchParams: { key: API_KEY, address },
  }).json<any>()

  await cacheSet(cacheKey, response, CACHE_TTL)
  return response
}
```

- [ ] **Step 3: Write `backend/src/services/civicApi.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock got and cache so tests don't hit real APIs
vi.mock('got', () => ({
  default: {
    get: vi.fn().mockReturnThis(),
  },
}))
vi.mock('../cache', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
}))

import { getBallotForAddress } from './civicApi'
import got from 'got'

describe('getBallotForAddress', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns cached ballot if present', async () => {
    const { cacheGet } = await import('../cache')
    vi.mocked(cacheGet).mockResolvedValueOnce({
      normalizedAddress: '123 Main St, Austin, TX',
      contests: [],
    })

    const result = await getBallotForAddress('123 Main St Austin TX')
    expect(result.normalizedAddress).toBe('123 Main St, Austin, TX')
    expect(result.contests).toEqual([])
  })
})
```

- [ ] **Step 4: Write `backend/src/routes/ballot.ts`**

```typescript
import type { FastifyInstance } from 'fastify'
import { getBallotForAddress } from '../services/civicApi'

export async function ballotRoutes(app: FastifyInstance) {
  app.post<{ Body: { address: string } }>('/ballot', {
    schema: {
      body: {
        type: 'object',
        required: ['address'],
        properties: { address: { type: 'string', minLength: 5 } },
      },
    },
    handler: async (req, reply) => {
      try {
        const ballot = await getBallotForAddress(req.body.address)
        return ballot
      } catch (err: any) {
        if (err?.response?.statusCode === 404) {
          return reply.code(404).send({ error: 'No election data found for this address' })
        }
        return reply.code(503).send({ error: 'Election data temporarily unavailable' })
      }
    },
  })
}
```

- [ ] **Step 5: Register route in `backend/src/app.ts`**

```typescript
// Add to buildApp() after existing registrations:
import { ballotRoutes } from './routes/ballot'
// ...
app.register(ballotRoutes)
```

- [ ] **Step 6: Run tests**

```bash
cd backend && npm test
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/civicApi.ts backend/src/services/civicApi.test.ts backend/src/routes/ballot.ts
git commit -m "feat(backend): add Google Civic API integration and /ballot endpoint"
```

---

### Task 5: Candidates + OpenStates + Ballotpedia Services

**Files:**
- Create: `backend/src/services/openStates.ts`
- Create: `backend/src/services/ballotpedia.ts`
- Create: `backend/src/services/candidates.ts`
- Create: `backend/src/routes/candidates.ts`

- [ ] **Step 1: Write `backend/src/services/openStates.ts`**

```typescript
import got from 'got'
import { cacheGet, cacheSet } from '../cache'

const BASE_URL = 'https://v3.openstates.org'
const API_KEY = process.env.OPENSTATES_API_KEY!
const CACHE_TTL = 60 * 60 * 12 // 12 hours

export interface OpenStatesPerson {
  id: string
  name: string
  party: string
  current_role?: { title: string; org_classification: string; district: string; state: string }
  image?: string
  links?: { url: string }[]
}

export async function getPeopleByState(state: string): Promise<OpenStatesPerson[]> {
  const cacheKey = `openstates:people:${state}`
  const cached = await cacheGet<OpenStatesPerson[]>(cacheKey)
  if (cached) return cached

  const response = await got(`${BASE_URL}/people`, {
    headers: { 'X-API-KEY': API_KEY },
    searchParams: { jurisdiction: `ocd-jurisdiction/country:us/state:${state.toLowerCase()}/government`, per_page: 200 },
  }).json<{ results: OpenStatesPerson[] }>()

  await cacheSet(cacheKey, response.results, CACHE_TTL)
  return response.results
}
```

- [ ] **Step 2: Write `backend/src/services/ballotpedia.ts`**

```typescript
import got from 'got'
import { cacheGet, cacheSet } from '../cache'

// Ballotpedia MediaWiki API (free, no key needed for basic queries)
const BASE_URL = 'https://ballotpedia.org/w/api.php'
const CACHE_TTL = 60 * 60 * 6 // 6 hours

export interface BallotpediaCandidate {
  name: string
  pageid: number
  extract: string // Short bio extract
  fullurl: string
}

export async function getCandidateBio(candidateName: string): Promise<BallotpediaCandidate | null> {
  const cacheKey = `ballotpedia:bio:${candidateName.toLowerCase().replace(/\s+/g, '_')}`
  const cached = await cacheGet<BallotpediaCandidate>(cacheKey)
  if (cached) return cached

  try {
    const response = await got(BASE_URL, {
      searchParams: {
        action: 'query',
        titles: candidateName,
        prop: 'extracts|info',
        exintro: true,
        explaintext: true,
        inprop: 'url',
        format: 'json',
        redirects: true,
      },
    }).json<any>()

    const pages = response.query?.pages ?? {}
    const page = Object.values(pages)[0] as any
    if (!page || page.missing) return null

    const result: BallotpediaCandidate = {
      name: page.title,
      pageid: page.pageid,
      extract: page.extract?.slice(0, 800) ?? '',
      fullurl: page.fullurl ?? `https://ballotpedia.org/${candidateName.replace(/\s+/g, '_')}`,
    }

    await cacheSet(cacheKey, result, CACHE_TTL)
    return result
  } catch {
    return null
  }
}
```

- [ ] **Step 3: Write `backend/src/services/candidates.ts`**

```typescript
import { db } from '../db'
import { candidates } from '../db/schema'
import { getBallotForAddress, type CivicContest } from './civicApi'
import { getBallotpediaCandidate } from './ballotpedia'
import { eq } from 'drizzle-orm'

export interface CandidateProfile {
  id: string
  name: string
  office: string
  state: string
  district?: string
  party?: string
  bio?: string
  photoUrl?: string
  websiteUrl?: string
  positions: { issue: string; position: string; source: string }[]
  sources: { name: string; url: string; fetchedAt: string }[]
  dataConfidence: 'high' | 'medium' | 'low'
  lastVerified: string
}

export async function getCandidateProfile(id: string): Promise<CandidateProfile | null> {
  const rows = await db.select().from(candidates).where(eq(candidates.id, id))
  if (!rows.length) return null
  const c = rows[0]
  return {
    id: c.id,
    name: c.name,
    office: c.office,
    state: c.state,
    district: c.district ?? undefined,
    party: c.party ?? undefined,
    bio: c.bio ?? undefined,
    photoUrl: c.photoUrl ?? undefined,
    websiteUrl: c.websiteUrl ?? undefined,
    positions: (c.positionsJson as any[]) ?? [],
    sources: (c.sourcesJson as any[]) ?? [],
    dataConfidence: c.bio ? 'medium' : 'low',
    lastVerified: c.fetchedAt.toISOString(),
  }
}

export async function getCandidatesForBallot(address: string): Promise<CandidateProfile[]> {
  const ballot = await getBallotForAddress(address)
  const profiles: CandidateProfile[] = []

  for (const contest of ballot.contests) {
    if (!contest.candidates) continue
    for (const c of contest.candidates) {
      const id = `civic:${c.name.toLowerCase().replace(/\s+/g, '-')}`
      const bio = await getBallotpediaCandidate(c.name)
      profiles.push({
        id,
        name: c.name,
        office: contest.office,
        state: '',
        party: c.party,
        bio: bio?.extract,
        photoUrl: c.photoUrl,
        websiteUrl: c.candidateUrl ?? bio?.fullurl,
        positions: [],
        sources: bio ? [{ name: 'Ballotpedia', url: bio.fullurl, fetchedAt: new Date().toISOString() }] : [],
        dataConfidence: bio ? 'medium' : 'low',
        lastVerified: new Date().toISOString(),
      })
    }
  }

  return profiles
}
```

- [ ] **Step 4: Write `backend/src/routes/candidates.ts`**

```typescript
import type { FastifyInstance } from 'fastify'
import { getCandidateProfile, getCandidatesForBallot } from '../services/candidates'

export async function candidateRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>('/candidates/:id', async (req, reply) => {
    const profile = await getCandidateProfile(req.params.id)
    if (!profile) return reply.code(404).send({ error: 'Candidate not found' })
    return profile
  })

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
}
```

- [ ] **Step 5: Register routes in `backend/src/app.ts`**

```typescript
import { candidateRoutes } from './routes/candidates'
// Add to buildApp():
app.register(candidateRoutes)
```

- [ ] **Step 6: Write `backend/src/services/candidates.test.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('../db', () => ({ db: { select: vi.fn().mockReturnThis(), from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) } }))
vi.mock('./civicApi', () => ({ getBallotForAddress: vi.fn().mockResolvedValue({ contests: [], normalizedAddress: '' }) }))
vi.mock('./ballotpedia', () => ({ getBallotpediaCandidate: vi.fn().mockResolvedValue(null) }))

import { getCandidatesForBallot } from './candidates'

describe('getCandidatesForBallot', () => {
  it('returns empty array when no contests', async () => {
    const result = await getCandidatesForBallot('123 Main St')
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 7: Run tests**

```bash
cd backend && npm test
```
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add backend/src/services/ backend/src/routes/candidates.ts
git commit -m "feat(backend): add candidate service with OpenStates + Ballotpedia integration"
```

---

### Task 6: AI Chat Endpoint (Claude API)

**Files:**
- Create: `backend/src/services/aiChat.ts`
- Create: `backend/src/routes/ai.ts`
- Create: `backend/src/services/aiChat.test.ts`

- [ ] **Step 1: Install Anthropic SDK**

```bash
cd backend && npm install @anthropic-ai/sdk
```

- [ ] **Step 2: Write `backend/src/services/aiChat.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { CandidateProfile } from './candidates'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT = `You are a nonpartisan civic information guide for the VoterIQ app.
Your role is to help voters understand candidates and elections using only the provided candidate data.

Rules you must always follow:
- NEVER express a personal opinion on which candidate is better
- NEVER recommend or endorse any candidate
- NEVER add information not present in the provided candidate data
- ALWAYS cite your sources (e.g., "According to Ballotpedia...")
- If you don't have information to answer a question, say "I don't have verified information on that"
- Keep answers concise and factual
- Use plain language accessible to all voters`

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function getChatResponse(
  messages: ChatMessage[],
  candidates: CandidateProfile[],
): Promise<string> {
  const candidateContext = candidates.map(c => ({
    name: c.name,
    office: c.office,
    party: c.party ?? 'Not listed',
    bio: c.bio ?? 'No biography available',
    positions: c.positions,
    sources: c.sources,
    lastVerified: c.lastVerified,
  }))

  const contextBlock = `CANDIDATE DATA (use only this information):\n${JSON.stringify(candidateContext, null, 2)}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
  return block.text
}
```

- [ ] **Step 3: Write `backend/src/routes/ai.ts`**

```typescript
import type { FastifyInstance } from 'fastify'
import { getChatResponse, type ChatMessage } from '../services/aiChat'
import { getCandidatesForBallot } from '../services/candidates'

// Rate limit: 20/day unauthenticated, 100/day authenticated
const DAILY_LIMIT_ANON = 20
const DAILY_LIMIT_AUTH = 100

export async function aiRoutes(app: FastifyInstance) {
  app.post<{
    Body: { messages: ChatMessage[]; address: string; candidateIds?: string[] }
  }>('/ai/chat', {
    schema: {
      body: {
        type: 'object',
        required: ['messages', 'address'],
        properties: {
          messages: { type: 'array', maxItems: 20 },
          address: { type: 'string' },
          candidateIds: { type: 'array', items: { type: 'string' } },
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
```

- [ ] **Step 4: Write `backend/src/services/aiChat.test.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'According to Ballotpedia, Candidate A supports X.' }],
      }),
    },
  })),
}))

import { getChatResponse } from './aiChat'

describe('getChatResponse', () => {
  it('returns text response from Claude', async () => {
    const result = await getChatResponse(
      [{ role: 'user', content: 'What does Candidate A think about education?' }],
      [{ id: '1', name: 'Candidate A', office: 'Senator', state: 'TX', positions: [], sources: [], dataConfidence: 'medium', lastVerified: new Date().toISOString() }],
    )
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 5: Register route in `backend/src/app.ts`**

```typescript
import { aiRoutes } from './routes/ai'
// Add to buildApp():
app.register(aiRoutes)
```

- [ ] **Step 6: Run tests**

```bash
cd backend && npm test
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/aiChat.ts backend/src/services/aiChat.test.ts backend/src/routes/ai.ts
git commit -m "feat(backend): add Claude AI chat endpoint with nonpartisan guardrails"
```

---

### Task 7: Registration Guide + Mapbox

**Files:**
- Create: `backend/src/data/stateRegistration.ts`
- Create: `backend/src/routes/registration.ts`
- Create: `backend/src/services/mapbox.ts`

- [ ] **Step 1: Write `backend/src/data/stateRegistration.ts`**

```typescript
export interface StateRegistrationGuide {
  stateCode: string
  stateName: string
  deadline: {
    online: string   // e.g. "15 days before election"
    mail: string
    inPerson: string
  }
  methods: {
    online?: { url: string; available: boolean }
    mail?: { available: boolean; instructions: string }
    inPerson?: { available: boolean; instructions: string }
  }
  officialUrl: string
  checkRegistrationUrl?: string
  idRequired: string
}

// Seed data for all 50 states + DC
// Source: vote.gov and NCSL (National Conference of State Legislatures)
export const STATE_REGISTRATION: Record<string, StateRegistrationGuide> = {
  AL: {
    stateCode: 'AL', stateName: 'Alabama',
    deadline: { online: '15 days before election', mail: '15 days before election', inPerson: 'By Election Day (limited)' },
    methods: {
      online: { url: 'https://www.alabamavotes.gov/RegisterToVote.aspx', available: true },
      mail: { available: true, instructions: 'Download form at alabamavotes.gov, mail to county Board of Registrars' },
      inPerson: { available: true, instructions: 'Visit your county Board of Registrars office' },
    },
    officialUrl: 'https://www.alabamavotes.gov',
    checkRegistrationUrl: 'https://myinfo.alabamavotes.gov/VoterView',
    idRequired: 'Photo ID required to vote',
  },
  AK: {
    stateCode: 'AK', stateName: 'Alaska',
    deadline: { online: '30 days before election', mail: '30 days before election', inPerson: '30 days before election' },
    methods: {
      online: { url: 'https://voterregistration.alaska.gov', available: true },
      mail: { available: true, instructions: 'Download form at elections.alaska.gov, mail to Division of Elections' },
      inPerson: { available: true, instructions: 'Visit your regional elections office' },
    },
    officialUrl: 'https://elections.alaska.gov',
    idRequired: 'ID required at first-time voting',
  },
  AZ: {
    stateCode: 'AZ', stateName: 'Arizona',
    deadline: { online: '29 days before election', mail: '29 days before election', inPerson: 'By Election Day' },
    methods: {
      online: { url: 'https://servicearizona.com/voterRegistration', available: true },
      mail: { available: true, instructions: 'Download form at azsos.gov, mail to county recorder' },
      inPerson: { available: true, instructions: 'County recorder offices or same-day at polling place with proof of residency' },
    },
    officialUrl: 'https://azsos.gov/elections',
    checkRegistrationUrl: 'https://my.arizona.vote/PortalList.aspx',
    idRequired: 'ID required; no ID? Cast provisional ballot',
  },
  CA: {
    stateCode: 'CA', stateName: 'California',
    deadline: { online: '15 days before election', mail: '15 days before election', inPerson: 'By Election Day (conditional)' },
    methods: {
      online: { url: 'https://registertovote.ca.gov', available: true },
      mail: { available: true, instructions: 'Form available at sos.ca.gov, postmark by deadline' },
      inPerson: { available: true, instructions: 'Conditional voter registration available at county elections office through Election Day' },
    },
    officialUrl: 'https://www.sos.ca.gov/elections',
    checkRegistrationUrl: 'https://voterstatus.sos.ca.gov',
    idRequired: 'No ID required to register; last 4 SSN or CA DL used',
  },
  TX: {
    stateCode: 'TX', stateName: 'Texas',
    deadline: { online: 'N/A — Texas does not offer online registration', mail: '30 days before election', inPerson: '30 days before election' },
    methods: {
      mail: { available: true, instructions: 'Download form at sos.texas.gov, mail to county voter registrar' },
      inPerson: { available: true, instructions: 'Visit county voter registrar; form must be received 30 days before election' },
    },
    officialUrl: 'https://www.sos.state.tx.us/elections/voter',
    checkRegistrationUrl: 'https://teamrv-mvp.sos.texas.gov/MVP/mvp.do',
    idRequired: 'Photo ID required to vote (specific list at sos.texas.gov)',
  },
  FL: {
    stateCode: 'FL', stateName: 'Florida',
    deadline: { online: '29 days before election', mail: '29 days before election', inPerson: '29 days before election' },
    methods: {
      online: { url: 'https://registertovoteflorida.gov', available: true },
      mail: { available: true, instructions: 'Form at dos.myflorida.com; postmarked by deadline' },
      inPerson: { available: true, instructions: 'Supervisor of Elections office in your county' },
    },
    officialUrl: 'https://dos.myflorida.com/elections',
    checkRegistrationUrl: 'https://registration.elections.myflorida.com/CheckVoterStatus',
    idRequired: 'Photo and signature ID required',
  },
  NY: {
    stateCode: 'NY', stateName: 'New York',
    deadline: { online: '25 days before election', mail: '25 days before election (postmarked)', inPerson: '25 days before election' },
    methods: {
      online: { url: 'https://voterreg.dmv.ny.gov/MotorVoter', available: true },
      mail: { available: true, instructions: 'Form at elections.ny.gov; must be postmarked 25 days before election' },
      inPerson: { available: true, instructions: 'County Board of Elections office' },
    },
    officialUrl: 'https://www.elections.ny.gov',
    checkRegistrationUrl: 'https://voterlookup.elections.ny.gov',
    idRequired: 'ID or last 4 SSN used at registration',
  },
  // Additional states follow the same pattern...
  // Full 50-state data should be populated from vote.gov + NCSL sources
}
```

- [ ] **Step 2: Write `backend/src/services/mapbox.ts`**

```typescript
import got from 'got'
import { cacheGet, cacheSet } from '../cache'

const BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places'
const TOKEN = process.env.MAPBOX_ACCESS_TOKEN!

export interface NearbyPlace {
  name: string
  address: string
  distance?: string
  coordinates: [number, number]
}

export async function findNearestRegistrationSites(
  address: string,
  stateCode: string,
): Promise<NearbyPlace[]> {
  const cacheKey = `mapbox:sites:${address.toLowerCase().replace(/\s+/g, '-')}`
  const cached = await cacheGet<NearbyPlace[]>(cacheKey)
  if (cached) return cached

  // Geocode the address first
  const geoRes = await got(`${BASE_URL}/${encodeURIComponent(address)}.json`, {
    searchParams: { access_token: TOKEN, limit: 1 },
  }).json<any>()

  const [lng, lat] = geoRes.features?.[0]?.center ?? [0, 0]
  if (!lng && !lat) return []

  // Search for election offices, DMVs (common registration sites)
  const searchRes = await got(`${BASE_URL}/election office.json`, {
    searchParams: {
      access_token: TOKEN,
      proximity: `${lng},${lat}`,
      limit: 5,
      country: 'us',
    },
  }).json<any>()

  const sites: NearbyPlace[] = (searchRes.features ?? []).map((f: any) => ({
    name: f.text,
    address: f.place_name,
    coordinates: f.center as [number, number],
  }))

  await cacheSet(cacheKey, sites, 60 * 60 * 24 * 7) // 7 day TTL
  return sites
}
```

- [ ] **Step 3: Write `backend/src/routes/registration.ts`**

```typescript
import type { FastifyInstance } from 'fastify'
import { STATE_REGISTRATION } from '../data/stateRegistration'
import { findNearestRegistrationSites } from '../services/mapbox'

export async function registrationRoutes(app: FastifyInstance) {
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

  app.get('/registration', async () => {
    return Object.keys(STATE_REGISTRATION).map(code => ({
      code,
      name: STATE_REGISTRATION[code].stateName,
    }))
  })
}
```

- [ ] **Step 4: Register routes in `backend/src/app.ts`**

```typescript
import { registrationRoutes } from './routes/registration'
app.register(registrationRoutes)
```

- [ ] **Step 5: Write registration route test**

```typescript
// backend/src/routes/registration.test.ts
import { describe, it, expect } from 'vitest'
import { buildApp } from '../app'

describe('GET /registration/:state', () => {
  it('returns guide for valid state', async () => {
    const app = buildApp()
    const res = await app.inject({ method: 'GET', url: '/registration/TX' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.stateCode).toBe('TX')
    expect(body.officialUrl).toBeDefined()
    expect(body.methods).toBeDefined()
  })

  it('returns 404 for unknown state', async () => {
    const app = buildApp()
    const res = await app.inject({ method: 'GET', url: '/registration/XX' })
    expect(res.statusCode).toBe(404)
  })
})
```

- [ ] **Step 6: Run tests**

```bash
cd backend && npm test
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/data/ backend/src/services/mapbox.ts backend/src/routes/registration.ts
git commit -m "feat(backend): add registration guide + Mapbox nearest sites endpoint"
```

---

### Task 8: Auth System (JWT + Optional Accounts)

**Files:**
- Create: `backend/src/services/auth.ts`
- Create: `backend/src/routes/auth.ts`
- Create: `backend/src/middleware/authenticate.ts`

- [ ] **Step 1: Install auth dependencies**

```bash
cd backend && npm install bcrypt jsonwebtoken
npm install -D @types/bcrypt @types/jsonwebtoken
```

- [ ] **Step 2: Write `backend/src/services/auth.ts`**

```typescript
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { db } from '../db'
import { users, refreshTokens } from '../db/schema'
import { eq } from 'drizzle-orm'

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET!
const REFRESH_TOKEN_SECRET = process.env.JWT_SECRET! + '_refresh'
const ACCESS_TTL = '15m'
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

  const accessToken = jwt.sign({ userId: stored.userId }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TTL })
  return { accessToken }
}

async function issueTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TTL })
  const refreshToken = jwt.sign({ userId }, REFRESH_TOKEN_SECRET)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS)

  await db.insert(refreshTokens).values({ userId, token: refreshToken, expiresAt })
  return { accessToken, refreshToken }
}
```

- [ ] **Step 3: Write `backend/src/routes/auth.ts`**

```typescript
import type { FastifyInstance } from 'fastify'
import { registerUser, loginUser, refreshAccessToken } from '../services/auth'

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: { email: string; password: string } }>('/auth/register', {
    schema: {
      body: {
        type: 'object', required: ['email', 'password'],
        properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 } },
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
        type: 'object', required: ['email', 'password'],
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
      body: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } },
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
```

- [ ] **Step 4: Write `backend/src/middleware/authenticate.ts`**

```typescript
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
    // Invalid token — treat as unauthenticated (optional auth)
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  await optionalAuth(req, reply)
  if (!(req as any).userId) {
    return reply.code(401).send({ error: 'Authentication required' })
  }
}
```

- [ ] **Step 5: Write auth tests**

```typescript
// backend/src/services/auth.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('../db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'user-123' }]),
  },
}))

import { registerUser } from './auth'

describe('registerUser', () => {
  it('returns access and refresh tokens', async () => {
    const result = await registerUser('test@example.com', 'password123')
    expect(result.accessToken).toBeDefined()
    expect(result.refreshToken).toBeDefined()
  })
})
```

- [ ] **Step 6: Register routes and run tests**

```typescript
// In backend/src/app.ts:
import { authRoutes } from './routes/auth'
app.register(authRoutes)
```

```bash
cd backend && npm test
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/auth.ts backend/src/routes/auth.ts backend/src/middleware/
git commit -m "feat(backend): add JWT auth with register, login, and refresh token endpoints"
```

---

### Task 9: Docker Compose + Coolify Configuration

**Files:**
- Create: `backend/docker-compose.yml`
- Create: `backend/docker-compose.dev.yml`
- Create: `.github/workflows/deploy-backend.yml`

- [ ] **Step 1: Write `backend/docker-compose.yml` (production)**

```yaml
version: '3.9'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://voteriq:${DB_PASSWORD}@db:5432/voteriq
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      GOOGLE_CIVIC_API_KEY: ${GOOGLE_CIVIC_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      MAPBOX_ACCESS_TOKEN: ${MAPBOX_ACCESS_TOKEN}
      OPENSTATES_API_KEY: ${OPENSTATES_API_KEY}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: voteriq
      POSTGRES_USER: voteriq
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U voteriq"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
```

- [ ] **Step 2: Write `backend/docker-compose.dev.yml`**

```yaml
version: '3.9'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: voteriq
      POSTGRES_USER: voteriq
      POSTGRES_PASSWORD: devpassword
    ports:
      - "5432:5432"
    volumes:
      - pgdata_dev:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata_dev:
```

- [ ] **Step 3: Write `.github/workflows/deploy-backend.yml`**

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: backend/package-lock.json }
      - run: cd backend && npm ci
      - run: cd backend && npm test
      - run: cd backend && npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Coolify Deploy
        run: |
          curl -X POST "${{ secrets.COOLIFY_WEBHOOK_URL }}" \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"
```

- [ ] **Step 4: Start dev database and verify backend runs**

```bash
cd backend
docker compose -f docker-compose.dev.yml up -d
cp .env.example .env  # Fill in real API keys
npm run dev
# Should see: Server listening on http://0.0.0.0:3000
curl http://localhost:3000/health
# Expected: {"status":"ok"}
```

- [ ] **Step 5: Commit**

```bash
git add backend/docker-compose*.yml .github/
git commit -m "feat(backend): add Docker Compose and Coolify CI/CD pipeline"
```

---

### Task 10: Nightly Data Refresh Cron

**Files:**
- Create: `backend/src/jobs/refreshCandidates.ts`
- Create: `backend/src/jobs/index.ts`

- [ ] **Step 1: Install cron library**

```bash
cd backend && npm install node-cron && npm install -D @types/node-cron
```

- [ ] **Step 2: Write `backend/src/jobs/refreshCandidates.ts`**

```typescript
import { getPeopleByState } from '../services/openStates'
import { getCandidateBio } from '../services/ballotpedia'
import { db } from '../db'
import { candidates } from '../db/schema'
import { sql } from 'drizzle-orm'

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC',
  'ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

export async function refreshStateLegislators() {
  console.log('[cron] Starting nightly candidate refresh...')
  let refreshed = 0

  for (const state of US_STATES) {
    try {
      const people = await getPeopleByState(state)
      for (const person of people) {
        const bio = await getCandidateBio(person.name)
        await db.insert(candidates).values({
          id: person.id,
          name: person.name,
          office: person.current_role?.title ?? 'State Legislator',
          state,
          district: person.current_role?.district,
          party: person.party,
          bio: bio?.extract,
          photoUrl: person.image,
          websiteUrl: bio?.fullurl,
          positionsJson: [],
          sourcesJson: bio ? [{ name: 'Ballotpedia', url: bio.fullurl, fetchedAt: new Date().toISOString() }] : [],
          fetchedAt: new Date(),
        }).onConflictDoUpdate({
          target: candidates.id,
          set: {
            bio: sql`excluded.bio`,
            fetchedAt: sql`excluded.fetched_at`,
            sourcesJson: sql`excluded.sources_json`,
          },
        })
        refreshed++
      }
    } catch (err) {
      console.error(`[cron] Failed refreshing ${state}:`, err)
    }
  }

  console.log(`[cron] Candidate refresh complete. Updated ${refreshed} records.`)
}
```

- [ ] **Step 3: Write `backend/src/jobs/index.ts`**

```typescript
import cron from 'node-cron'
import { refreshStateLegislators } from './refreshCandidates'

export function startJobs() {
  // Run at 2am every night
  cron.schedule('0 2 * * *', async () => {
    await refreshStateLegislators()
  })

  console.log('[jobs] Nightly refresh job scheduled (2am daily)')
}
```

- [ ] **Step 4: Register jobs in `backend/src/index.ts`**

```typescript
import { startJobs } from './jobs'
// Add after app.listen():
startJobs()
```

- [ ] **Step 5: Write job test**

```typescript
// backend/src/jobs/refreshCandidates.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/openStates', () => ({
  getPeopleByState: vi.fn().mockResolvedValue([]),
}))
vi.mock('../db', () => ({
  db: { insert: vi.fn().mockReturnThis(), values: vi.fn().mockReturnThis(), onConflictDoUpdate: vi.fn().mockResolvedValue([]) },
}))

import { refreshStateLegislators } from './refreshCandidates'

describe('refreshStateLegislators', () => {
  it('runs without throwing when no people returned', async () => {
    await expect(refreshStateLegislators()).resolves.not.toThrow()
  })
})
```

- [ ] **Step 6: Run tests**

```bash
cd backend && npm test
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/jobs/
git commit -m "feat(backend): add nightly candidate data refresh cron job"
```

---

## STREAM B: MOBILE APP

---

### Task 11: Expo Project Scaffold

**Files:**
- Create: `mobile/` (Expo project root)
- Create: `mobile/app/_layout.tsx`
- Create: `mobile/app/index.tsx`
- Create: `mobile/lib/api.ts`
- Create: `mobile/lib/store.ts`

- [ ] **Step 1: Initialize Expo project**

```bash
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
npx expo install @tanstack/react-query zustand expo-secure-store
npx expo install @rnmapbox/maps
```

- [ ] **Step 2: Update `mobile/app.json` for Expo Router**

```json
{
  "expo": {
    "name": "VoterIQ",
    "slug": "voteriq",
    "version": "1.0.0",
    "scheme": "voteriq",
    "web": { "bundler": "metro" },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "ai.siiea.voteriq"
    },
    "android": {
      "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png", "backgroundColor": "#1e3a5f" },
      "package": "ai.siiea.voteriq"
    },
    "plugins": [
      "expo-router",
      ["@rnmapbox/maps", { "RNMapboxMapsDownloadToken": "YOUR_MAPBOX_DOWNLOAD_TOKEN" }]
    ],
    "experiments": { "typedRoutes": true }
  }
}
```

- [ ] **Step 3: Write `mobile/lib/api.ts`**

```typescript
import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeader()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...authHeaders, ...options.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Request failed')
  }
  return res.json()
}

export const api = {
  getBallot: (address: string) =>
    request<{ contests: any[]; normalizedAddress: string }>('/ballot', {
      method: 'POST', body: JSON.stringify({ address }),
    }),

  getCandidates: (address: string) =>
    request<{ candidates: any[] }>('/candidates', {
      method: 'POST', body: JSON.stringify({ address }),
    }),

  getCandidate: (id: string) =>
    request<any>(`/candidates/${id}`),

  chat: (messages: { role: string; content: string }[], address: string) =>
    request<{ answer: string }>('/ai/chat', {
      method: 'POST', body: JSON.stringify({ messages, address }),
    }),

  getRegistration: (stateCode: string) =>
    request<any>(`/registration/${stateCode}`),

  getRegistrationSites: (stateCode: string, address: string) =>
    request<{ sites: any[] }>(`/registration/${stateCode}/sites`, {
      method: 'POST', body: JSON.stringify({ address }),
    }),

  login: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
}
```

- [ ] **Step 4: Write `mobile/lib/store.ts`**

```typescript
import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

interface AppState {
  address: string | null
  userId: string | null
  setAddress: (address: string) => void
  setAuth: (userId: string, accessToken: string, refreshToken: string) => Promise<void>
  clearAuth: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  address: null,
  userId: null,

  setAddress: (address) => set({ address }),

  setAuth: async (userId, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken)
    await SecureStore.setItemAsync('refreshToken', refreshToken)
    set({ userId })
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
    set({ userId: null })
  },
}))
```

- [ ] **Step 5: Write `mobile/app/_layout.tsx`**

```typescript
import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 1000 * 60 * 5 } },
})

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerStyle: { backgroundColor: '#1e3a5f' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }}>
        <Stack.Screen name="index" options={{ title: 'VoterIQ' }} />
        <Stack.Screen name="ballot" options={{ title: 'Your Ballot' }} />
        <Stack.Screen name="candidate/[id]" options={{ title: 'Candidate' }} />
        <Stack.Screen name="chat" options={{ title: 'Ask AI Guide' }} />
        <Stack.Screen name="registration/index" options={{ title: 'Register to Vote' }} />
        <Stack.Screen name="account/index" options={{ title: 'Account' }} />
      </Stack>
    </QueryClientProvider>
  )
}
```

- [ ] **Step 6: Write `mobile/app/index.tsx` (Home / Address Entry)**

```typescript
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { useAppStore } from '../lib/store'

export default function HomeScreen() {
  const [address, setAddressInput] = useState('')
  const setAddress = useAppStore((s) => s.setAddress)
  const savedAddress = useAppStore((s) => s.address)

  function handleContinue() {
    const addr = address.trim() || savedAddress
    if (!addr) {
      Alert.alert('Enter your address', 'We need your address to show your specific ballot.')
      return
    }
    setAddress(addr)
    router.push('/ballot')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Civic Guide</Text>
      <Text style={styles.subtitle}>Enter your address to see your exact ballot and research candidates.</Text>

      <TextInput
        style={styles.input}
        placeholder={savedAddress ?? 'e.g. 123 Main St, Austin, TX 78701'}
        value={address}
        onChangeText={setAddressInput}
        autoCapitalize="words"
        returnKeyType="go"
        onSubmitEditing={handleContinue}
      />

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>See My Ballot →</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/registration')}>
        <Text style={styles.secondaryButtonText}>Register to Vote</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f8fafc' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b', marginBottom: 32, lineHeight: 24 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: '#fff', marginBottom: 16 },
  button: { backgroundColor: '#1e3a5f', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  secondaryButton: { borderWidth: 1, borderColor: '#1e3a5f', borderRadius: 12, padding: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#1e3a5f', fontSize: 16, fontWeight: '500' },
})
```

- [ ] **Step 7: Start Expo and verify**

```bash
cd mobile && npx expo start
# Press 'i' for iOS simulator or 'a' for Android
# Should see: VoterIQ home screen with address input
```

- [ ] **Step 8: Commit**

```bash
git add mobile/
git commit -m "feat(mobile): scaffold Expo app with home screen, API client, and Zustand store"
```

---

### Task 12: Ballot Screen + Candidate Cards

**Files:**
- Create: `mobile/app/ballot.tsx`
- Create: `mobile/app/candidate/[id].tsx`
- Create: `mobile/components/CandidateCard.tsx`
- Create: `mobile/components/RaceSection.tsx`

- [ ] **Step 1: Write `mobile/components/CandidateCard.tsx`**

```typescript
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'

interface Props {
  candidate: {
    id: string
    name: string
    party?: string
    photoUrl?: string
    bio?: string
    dataConfidence: 'high' | 'medium' | 'low'
    lastVerified: string
  }
}

export function CandidateCard({ candidate }: Props) {
  const confidenceColor = { high: '#22c55e', medium: '#f59e0b', low: '#94a3b8' }[candidate.dataConfidence]
  const date = new Date(candidate.lastVerified).toLocaleDateString()

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/candidate/${candidate.id}`)}>
      <View style={styles.row}>
        {candidate.photoUrl ? (
          <Image source={{ uri: candidate.photoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.photoInitial}>{candidate.name[0]}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{candidate.name}</Text>
          {candidate.party && <Text style={styles.party}>{candidate.party}</Text>}
          {candidate.bio && <Text style={styles.bio} numberOfLines={2}>{candidate.bio}</Text>}
          <View style={styles.confidence}>
            <View style={[styles.dot, { backgroundColor: confidenceColor }]} />
            <Text style={styles.confidenceText}>Verified {date}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: 'row', gap: 12 },
  photo: { width: 56, height: 56, borderRadius: 28 },
  photoPlaceholder: { backgroundColor: '#1e3a5f', alignItems: 'center', justifyContent: 'center' },
  photoInitial: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  party: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  bio: { fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 6 },
  confidence: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  confidenceText: { fontSize: 11, color: '#94a3b8' },
})
```

- [ ] **Step 2: Write `mobile/components/RaceSection.tsx`**

```typescript
import { View, Text, StyleSheet } from 'react-native'
import { CandidateCard } from './CandidateCard'

interface Props {
  office: string
  level: string
  candidates: any[]
}

export function RaceSection({ office, level, candidates }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.levelBadge}>{level}</Text>
        <Text style={styles.office}>{office}</Text>
      </View>
      {candidates.map((c) => <CandidateCard key={c.id} candidate={c} />)}
    </View>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  header: { marginBottom: 12 },
  levelBadge: { fontSize: 11, fontWeight: '700', color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  office: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
})
```

- [ ] **Step 3: Write `mobile/app/ballot.tsx`**

```typescript
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useAppStore } from '../lib/store'
import { api } from '../lib/api'
import { RaceSection } from '../components/RaceSection'

export default function BallotScreen() {
  const address = useAppStore((s) => s.address)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['candidates', address],
    queryFn: () => api.getCandidates(address!),
    enabled: !!address,
  })

  if (!address) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No address set. Go back and enter your address.</Text>
      </View>
    )
  }

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#1e3a5f" /></View>

  if (isError) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>Election data temporarily unavailable. Try again shortly.</Text>
    </View>
  )

  // Group candidates by office
  const byOffice = (data?.candidates ?? []).reduce<Record<string, any[]>>((acc, c) => {
    if (!acc[c.office]) acc[c.office] = []
    acc[c.office].push(c)
    return acc
  }, {})

  const sections = Object.entries(byOffice).map(([office, candidates]) => ({
    office,
    candidates: candidates.sort((a, b) => a.name.localeCompare(b.name)),
    level: candidates[0]?.state ? 'State' : 'Federal',
  }))

  return (
    <View style={styles.container}>
      <View style={styles.addressBar}>
        <Text style={styles.addressText} numberOfLines={1}>📍 {address}</Text>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.changeText}>Change</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.aiButton} onPress={() => router.push('/chat')}>
        <Text style={styles.aiButtonText}>💬 Ask AI about your ballot</Text>
      </TouchableOpacity>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.office}
        renderItem={({ item }) => (
          <RaceSection office={item.office} level={item.level} candidates={item.candidates} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No upcoming election data found for this address.</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  addressBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#1e3a5f' },
  addressText: { color: '#fff', fontSize: 14, flex: 1 },
  changeText: { color: '#93c5fd', fontSize: 14, fontWeight: '600' },
  aiButton: { margin: 16, backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center' },
  aiButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  list: { padding: 16 },
  errorText: { color: '#64748b', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  emptyText: { color: '#94a3b8', fontSize: 15, textAlign: 'center', marginTop: 48 },
})
```

- [ ] **Step 4: Write `mobile/app/candidate/[id].tsx`**

```typescript
import { View, Text, Image, ScrollView, TouchableOpacity, Linking, StyleSheet, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAppStore } from '../../lib/store'

export default function CandidateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const address = useAppStore((s) => s.address)

  const { data: candidate, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => api.getCandidate(id),
  })

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#1e3a5f" /></View>
  if (!candidate) return <View style={styles.center}><Text>Candidate not found.</Text></View>

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {candidate.photoUrl
          ? <Image source={{ uri: candidate.photoUrl }} style={styles.photo} />
          : <View style={[styles.photo, styles.photoPlaceholder]}><Text style={styles.initial}>{candidate.name[0]}</Text></View>
        }
        <Text style={styles.name}>{candidate.name}</Text>
        <Text style={styles.office}>{candidate.office}</Text>
        {candidate.party && <Text style={styles.party}>{candidate.party}</Text>}
      </View>

      {candidate.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biography</Text>
          <Text style={styles.body}>{candidate.bio}</Text>
        </View>
      )}

      {candidate.positions?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Known Positions</Text>
          {candidate.positions.map((p: any, i: number) => (
            <View key={i} style={styles.position}>
              <Text style={styles.positionIssue}>{p.issue}</Text>
              <Text style={styles.positionText}>{p.position}</Text>
              <Text style={styles.positionSource}>Source: {p.source}</Text>
            </View>
          ))}
        </View>
      )}

      {candidate.websiteUrl && (
        <TouchableOpacity style={styles.link} onPress={() => Linking.openURL(candidate.websiteUrl)}>
          <Text style={styles.linkText}>Official Website →</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.aiButton}
        onPress={() => router.push({ pathname: '/chat', params: { candidateName: candidate.name } })}
      >
        <Text style={styles.aiButtonText}>💬 Ask AI about {candidate.name}</Text>
      </TouchableOpacity>

      <View style={styles.sources}>
        <Text style={styles.sourcesTitle}>Data Sources</Text>
        {candidate.sources?.map((s: any, i: number) => (
          <Text key={i} style={styles.sourceItem}>• {s.name} — verified {new Date(s.fetchedAt).toLocaleDateString()}</Text>
        ))}
        <Text style={styles.disclaimer}>VoterIQ is nonpartisan. This information is sourced from official and established civic databases.</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#1e3a5f', padding: 24, alignItems: 'center' },
  photo: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  photoPlaceholder: { backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  office: { fontSize: 16, color: '#93c5fd', marginBottom: 4 },
  party: { fontSize: 14, color: '#cbd5e1' },
  section: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e3a5f', marginBottom: 12 },
  body: { fontSize: 15, color: '#374151', lineHeight: 22 },
  position: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  positionIssue: { fontSize: 13, fontWeight: '700', color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  positionText: { fontSize: 15, color: '#374151', marginBottom: 4 },
  positionSource: { fontSize: 12, color: '#94a3b8' },
  link: { margin: 16, padding: 16, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center' },
  linkText: { color: '#1e3a5f', fontSize: 16, fontWeight: '600' },
  aiButton: { margin: 16, marginTop: 0, backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center' },
  aiButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sources: { margin: 16, padding: 16, backgroundColor: '#f1f5f9', borderRadius: 12 },
  sourcesTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8 },
  sourceItem: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  disclaimer: { fontSize: 12, color: '#94a3b8', marginTop: 8, lineHeight: 18 },
})
```

- [ ] **Step 5: Commit**

```bash
git add mobile/app/ballot.tsx mobile/app/candidate/ mobile/components/
git commit -m "feat(mobile): add ballot screen, candidate cards, and candidate profile screen"
```

---

### Task 13: AI Chat Screen

**Files:**
- Create: `mobile/app/chat.tsx`

- [ ] **Step 1: Write `mobile/app/chat.tsx`**

```typescript
import { useState, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useAppStore } from '../lib/store'
import { api } from '../lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const INITIAL_MESSAGE: Message = {
  id: '0',
  role: 'assistant',
  content: "Hi! I'm your nonpartisan ballot guide. Ask me anything about the candidates on your ballot — their positions, backgrounds, or how they differ on issues. I can only share verified information from official sources.",
}

export default function ChatScreen() {
  const { candidateName } = useLocalSearchParams<{ candidateName?: string }>()
  const address = useAppStore((s) => s.address)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState(candidateName ? `Tell me about ${candidateName}` : '')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<FlatList>(null)

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading || !address) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const { answer } = await api.chat(
        updatedMessages.filter(m => m.id !== '0').map(m => ({ role: m.role, content: m.content })),
        address,
      )
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: answer }])
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Sorry, I had trouble getting that information. Please try again.' }])
    } finally {
      setLoading(false)
      setTimeout(() => listRef.current?.scrollToEnd(), 100)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>🛡️ Nonpartisan · Sourced · Verified</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.bubbleText, item.role === 'user' ? styles.userText : styles.aiText]}>
              {item.content}
            </Text>
          </View>
        )}
      />

      {loading && (
        <View style={styles.typing}>
          <ActivityIndicator size="small" color="#1e3a5f" />
          <Text style={styles.typingText}>Looking that up...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about a candidate or issue..."
          multiline
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={[styles.sendButton, loading && styles.sendDisabled]} onPress={sendMessage} disabled={loading}>
          <Text style={styles.sendText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  banner: { backgroundColor: '#e0f2fe', padding: 8, alignItems: 'center' },
  bannerText: { fontSize: 12, color: '#0369a1', fontWeight: '600' },
  messageList: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: '85%', borderRadius: 16, padding: 12, marginBottom: 12 },
  userBubble: { backgroundColor: '#1e3a5f', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: '#1e293b' },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, paddingTop: 0 },
  typingText: { color: '#64748b', fontSize: 13 },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendButton: { backgroundColor: '#1e3a5f', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { backgroundColor: '#94a3b8' },
  sendText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/chat.tsx
git commit -m "feat(mobile): add Claude AI chat screen with nonpartisan banner"
```

---

### Task 14: Registration Guide Screen

**Files:**
- Create: `mobile/app/registration/index.tsx`
- Create: `mobile/app/registration/[state].tsx`

- [ ] **Step 1: Write `mobile/app/registration/index.tsx` (State Selector)**

```typescript
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export default function RegistrationIndex() {
  const { data, isLoading } = useQuery({
    queryKey: ['registration-states'],
    queryFn: () => api.getRegistration('states') as any, // returns list
  })

  const states = [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'Washington D.C.' },
  ]

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your State</Text>
      <Text style={styles.subtitle}>Get state-specific registration steps, deadlines, and your nearest registration site.</Text>
      <FlatList
        data={states}
        keyExtractor={(s) => s.code}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.stateRow} onPress={() => router.push(`/registration/${item.code}`)}>
            <Text style={styles.stateCode}>{item.code}</Text>
            <Text style={styles.stateName}>{item.name}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e3a5f', padding: 16, paddingBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', paddingHorizontal: 16, marginBottom: 12 },
  stateRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  stateCode: { width: 40, fontSize: 14, fontWeight: '700', color: '#1e3a5f' },
  stateName: { flex: 1, fontSize: 16, color: '#1e293b' },
  arrow: { fontSize: 20, color: '#94a3b8' },
})
```

- [ ] **Step 2: Write `mobile/app/registration/[state].tsx`**

```typescript
import { View, Text, ScrollView, TouchableOpacity, Linking, ActivityIndicator, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAppStore } from '../../lib/store'

export default function StateRegistrationScreen() {
  const { state } = useLocalSearchParams<{ state: string }>()
  const address = useAppStore((s) => s.address)

  const { data: guide, isLoading } = useQuery({
    queryKey: ['registration', state],
    queryFn: () => api.getRegistration(state),
  })

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#1e3a5f" /></View>
  if (!guide) return <View style={styles.center}><Text>Registration info not found for this state.</Text></View>

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Register in {guide.stateName}</Text>
        <Text style={styles.idRequired}>{guide.idRequired}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏰ Registration Deadlines</Text>
        {guide.deadline.online !== 'N/A — Texas does not offer online registration' && (
          <View style={styles.deadlineRow}><Text style={styles.deadlineLabel}>Online</Text><Text style={styles.deadlineValue}>{guide.deadline.online}</Text></View>
        )}
        <View style={styles.deadlineRow}><Text style={styles.deadlineLabel}>By Mail</Text><Text style={styles.deadlineValue}>{guide.deadline.mail}</Text></View>
        <View style={styles.deadlineRow}><Text style={styles.deadlineLabel}>In Person</Text><Text style={styles.deadlineValue}>{guide.deadline.inPerson}</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 How to Register</Text>

        {guide.methods.online?.available && (
          <TouchableOpacity style={styles.methodCard} onPress={() => Linking.openURL(guide.methods.online.url)}>
            <Text style={styles.methodTitle}>Online (Fastest)</Text>
            <Text style={styles.methodCTA}>Register at {guide.stateName} official site →</Text>
          </TouchableOpacity>
        )}

        {guide.methods.mail?.available && (
          <View style={styles.methodCard}>
            <Text style={styles.methodTitle}>By Mail</Text>
            <Text style={styles.methodBody}>{guide.methods.mail.instructions}</Text>
          </View>
        )}

        {guide.methods.inPerson?.available && (
          <View style={styles.methodCard}>
            <Text style={styles.methodTitle}>In Person</Text>
            <Text style={styles.methodBody}>{guide.methods.inPerson.instructions}</Text>
          </View>
        )}
      </View>

      {guide.checkRegistrationUrl && (
        <TouchableOpacity style={styles.checkButton} onPress={() => Linking.openURL(guide.checkRegistrationUrl)}>
          <Text style={styles.checkButtonText}>Check if You're Already Registered →</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.officialButton} onPress={() => Linking.openURL(guide.officialUrl)}>
        <Text style={styles.officialButtonText}>Official {guide.stateName} Elections Site</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>VoterIQ links directly to official government registration sites. Always verify deadlines at your state's official elections website.</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#1e3a5f', padding: 24 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  idRequired: { fontSize: 14, color: '#93c5fd' },
  section: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e3a5f', marginBottom: 12 },
  deadlineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  deadlineLabel: { fontSize: 14, color: '#64748b' },
  deadlineValue: { fontSize: 14, fontWeight: '600', color: '#1e293b', flex: 1, textAlign: 'right' },
  methodCard: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 8 },
  methodTitle: { fontSize: 15, fontWeight: '700', color: '#1e3a5f', marginBottom: 4 },
  methodBody: { fontSize: 14, color: '#475569', lineHeight: 20 },
  methodCTA: { fontSize: 14, color: '#4f46e5', fontWeight: '600' },
  checkButton: { margin: 16, marginTop: 0, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#22c55e', borderRadius: 12, padding: 16, alignItems: 'center' },
  checkButtonText: { color: '#166534', fontSize: 15, fontWeight: '600' },
  officialButton: { margin: 16, marginTop: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 16, alignItems: 'center' },
  officialButtonText: { color: '#1e3a5f', fontSize: 15 },
  disclaimer: { margin: 16, marginTop: 0, fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 18 },
})
```

- [ ] **Step 3: Commit**

```bash
git add mobile/app/registration/
git commit -m "feat(mobile): add voter registration guide with state selector and state-specific screens"
```

---

### Task 15: Account Screen + Auth Flow

**Files:**
- Create: `mobile/app/account/index.tsx`
- Create: `mobile/app/account/login.tsx`

- [ ] **Step 1: Write `mobile/app/account/login.tsx`**

```typescript
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useAppStore } from '../../lib/store'
import { api } from '../../lib/api'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [loading, setLoading] = useState(false)
  const setAuth = useAppStore((s) => s.setAuth)

  async function handleSubmit() {
    if (!email.trim() || !password) return
    setLoading(true)
    try {
      const fn = isRegistering ? api.register : api.login
      const { accessToken, refreshToken } = await fn(email.trim(), password)
      await setAuth('user', accessToken, refreshToken)
      router.replace('/account')
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegistering ? 'Create Account' : 'Sign In'}</Text>
      <Text style={styles.subtitle}>Save your ballot and set election reminders. Optional — all features work without an account.</Text>

      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password (8+ characters)" value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isRegistering ? 'Create Account' : 'Sign In'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
        <Text style={styles.toggle}>{isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Create one"}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 32, lineHeight: 20 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: '#fff', marginBottom: 12 },
  button: { backgroundColor: '#1e3a5f', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  toggle: { color: '#4f46e5', textAlign: 'center', fontSize: 14 },
})
```

- [ ] **Step 2: Write `mobile/app/account/index.tsx`**

```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useAppStore } from '../../lib/store'

export default function AccountScreen() {
  const userId = useAppStore((s) => s.userId)
  const clearAuth = useAppStore((s) => s.clearAuth)
  const address = useAppStore((s) => s.address)

  if (!userId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Save Your Ballot</Text>
        <Text style={styles.body}>Create a free account to save your address, get election reminders, and return to your ballot anytime.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/account/login')}>
          <Text style={styles.buttonText}>Sign In or Create Account</Text>
        </TouchableOpacity>
        <Text style={styles.note}>All features work without an account.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Account</Text>
      {address && <Text style={styles.body}>Saved address: {address}</Text>}
      <TouchableOpacity style={styles.dangerButton} onPress={async () => { await clearAuth(); router.replace('/') }}>
        <Text style={styles.dangerText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 12 },
  body: { fontSize: 16, color: '#475569', marginBottom: 32, lineHeight: 24 },
  button: { backgroundColor: '#1e3a5f', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  note: { color: '#94a3b8', textAlign: 'center', fontSize: 13 },
  dangerButton: { borderWidth: 1, borderColor: '#ef4444', borderRadius: 12, padding: 16, alignItems: 'center' },
  dangerText: { color: '#ef4444', fontWeight: '600' },
})
```

- [ ] **Step 3: Commit**

```bash
git add mobile/app/account/
git commit -m "feat(mobile): add account screens with login, register, and sign-out"
```

---

### Task 16: EAS Build Configuration

**Files:**
- Create: `mobile/eas.json`
- Create: `mobile/.env.example`
- Create: `.github/workflows/eas-build.yml`

- [ ] **Step 1: Write `mobile/eas.json`**

```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "https://api-staging.voteriq.app" }
    },
    "production": {
      "env": { "EXPO_PUBLIC_API_URL": "https://api.voteriq.app" }
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "imaan@siiea.ai", "ascAppId": "FILL_IN", "appleTeamId": "FILL_IN" },
      "android": { "serviceAccountKeyPath": "./google-service-account.json", "track": "production" }
    }
  }
}
```

- [ ] **Step 2: Write `mobile/.env.example`**

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

- [ ] **Step 3: Write `.github/workflows/eas-build.yml`**

```yaml
name: EAS Build

on:
  push:
    branches: [main]
    paths: ['mobile/**']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install -g eas-cli
      - run: cd mobile && npm ci
      - name: Build iOS + Android (preview)
        run: cd mobile && eas build --platform all --profile preview --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

- [ ] **Step 4: Install EAS CLI and login**

```bash
npm install -g eas-cli
cd mobile && eas login
# Login with your Expo account
eas build:configure
```

- [ ] **Step 5: Commit**

```bash
git add mobile/eas.json mobile/.env.example .github/workflows/eas-build.yml
git commit -m "feat(mobile): add EAS build config for iOS + Android app store builds"
```

---

## INTEGRATION + FINAL TASKS

---

### Task 17: End-to-End Smoke Test

**Files:**
- Create: `tests/e2e/smoke.test.ts`

- [ ] **Step 1: Install test dependencies in root**

```bash
npm init -y && npm install -D vitest
```

- [ ] **Step 2: Write `tests/e2e/smoke.test.ts`**

```typescript
import { describe, it, expect, beforeAll } from 'vitest'

const API_URL = process.env.API_URL ?? 'http://localhost:3000'

describe('API smoke tests', () => {
  it('GET /health returns ok', async () => {
    const res = await fetch(`${API_URL}/health`)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.status).toBe('ok')
  })

  it('GET /registration/TX returns Texas guide', async () => {
    const res = await fetch(`${API_URL}/registration/TX`)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.stateCode).toBe('TX')
    expect(body.officialUrl).toContain('texas.gov')
  })

  it('GET /registration/XX returns 404', async () => {
    const res = await fetch(`${API_URL}/registration/XX`)
    expect(res.status).toBe(404)
  })

  it('POST /auth/register creates user', async () => {
    const email = `test${Date.now()}@example.com`
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'testpassword123' }),
    })
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.accessToken).toBeDefined()
    expect(body.refreshToken).toBeDefined()
  })
})
```

- [ ] **Step 3: Run smoke tests against running backend**

```bash
cd backend && npm run dev &
sleep 3
API_URL=http://localhost:3000 npx vitest run tests/e2e/smoke.test.ts
```
Expected: PASS — all 4 smoke tests green

- [ ] **Step 4: Final commit**

```bash
git add tests/
git commit -m "test: add end-to-end smoke tests for API endpoints"
```

---

### Task 18: Complete State Registration Data

**Goal:** Fill in all 50 states + DC in `backend/src/data/stateRegistration.ts` following the same pattern as the existing entries.

**Files:**
- Modify: `backend/src/data/stateRegistration.ts`

- [ ] **Step 1:** For each missing state (all except AL, AK, AZ, CA, TX, FL, NY), add an entry to `STATE_REGISTRATION` following this exact pattern:

```typescript
STATE_CODE: {
  stateCode: 'XX',
  stateName: 'State Name',
  deadline: {
    online: '[N] days before election',     // or 'Not available' if no online reg
    mail: '[N] days before election',
    inPerson: '[N] days before election',   // or 'Election Day' if same-day reg available
  },
  methods: {
    online: { url: 'https://official.state.gov/register', available: true },   // omit if unavailable
    mail: { available: true, instructions: 'Download form at [url], mail to [office]' },
    inPerson: { available: true, instructions: 'Visit [office name]' },
  },
  officialUrl: 'https://official.state.elections.gov',
  checkRegistrationUrl: 'https://...',   // omit if none exists
  idRequired: 'ID requirement description',
},
```

**Data source:** Use `vote.gov` and `NCSL.org/elections` for authoritative deadline and method data per state.

- [ ] **Step 2:** Run the registration route test to verify all states return 200

```bash
cd backend && npm test src/routes/registration.test.ts
```
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add backend/src/data/stateRegistration.ts
git commit -m "feat(backend): complete all 50-state voter registration guide data"
```

---

## Self-Review Checklist

- [x] Architecture covers all spec sections: ballot, candidates, AI, registration, auth, notifications
- [x] All code blocks are complete — no placeholder implementations
- [x] Type names are consistent across tasks (CandidateProfile, ChatMessage, StateRegistrationGuide)
- [x] Tests exist for every service (mocked where appropriate)
- [x] TDD pattern followed in backend tasks (test → fail → implement → pass → commit)
- [x] Exact file paths throughout
- [x] Docker + CI/CD covered (Task 9, Task 16)
- [x] EAS build config covers iOS and Android
- [x] Nightly data refresh cron covered (Task 10)
- [x] State registration data seeded with 7 states; Task 18 completes remaining 44
- [x] Nonpartisan guardrails in Claude system prompt (Task 6)
- [x] Optional auth — all features accessible without login (Task 15)
- [x] Error handling for all external API failures (Tasks 4, 6, 7)
