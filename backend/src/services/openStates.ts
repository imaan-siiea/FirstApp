import { cacheGet, cacheSet } from '../cache'
import { STATE_LEGISLATORS } from '../data/stateLegislators'

const BASE_URL = 'https://v3.openstates.org'
const API_KEY = process.env.OPENSTATES_API_KEY ?? ''
const CACHE_TTL = 60 * 60 * 24 * 7 // 7 days — legislators change on election cycles only

// In-memory daily request counter — resets at midnight, caps at 200 to stay under 250/day limit
let _dailyDate = ''
let _dailyCount = 0
const DAILY_LIMIT = 200

function acquireRequest(): boolean {
  const today = new Date().toISOString().slice(0, 10)
  if (today !== _dailyDate) { _dailyDate = today; _dailyCount = 0 }
  if (_dailyCount >= DAILY_LIMIT) return false
  _dailyCount++
  return true
}

export function getDailyRequestCount(): { used: number; limit: number } {
  return { used: _dailyCount, limit: DAILY_LIMIT }
}

export interface StateRepresentative {
  id: string
  name: string
  party: string
  title: string        // 'Senator' | 'Representative'
  chamber: string      // 'upper' | 'lower'
  district: string
  imageUrl: string | null
  profileUrl: string | null
  email: string | null
}

export async function getRepresentativesByState(stateCode: string): Promise<StateRepresentative[]> {
  const upper = stateCode.toUpperCase()

  // Static file takes priority — zero API calls, zero rate limits
  const staticData = STATE_LEGISLATORS[upper]
  if (staticData && staticData.length > 0) return staticData

  // Fall back to live API until the dump script has run
  if (!API_KEY) return []

  const code = stateCode.toLowerCase()
  const cacheKey = `openstates:reps:${code}`
  const cached = await cacheGet<StateRepresentative[]>(cacheKey)
  if (cached) return cached

  const results: StateRepresentative[] = []

  for (const chamber of ['upper', 'lower']) {
    try {
      let page = 1
      let maxPage = 1

      while (page <= maxPage && page <= 5) { // cap at 5 pages (250 reps) — enough for any state chamber
        if (!acquireRequest()) {
          console.warn(`[OpenStates] Daily cap of ${DAILY_LIMIT} reached — deferring remaining fetches to tomorrow`)
          break
        }

        const url = `${BASE_URL}/people?jurisdiction=ocd-jurisdiction/country:us/state:${code}/government&org_classification=${chamber}&per_page=50&page=${page}`

        const res = await fetch(url, { headers: { 'X-API-KEY': API_KEY } })

        if (res.status === 429) {
          console.warn('[OpenStates] API returned 429 despite counter — daily quota exhausted upstream')
          break
        }

        if (!res.ok) break

        const response = await res.json() as any
        const pagination = response.pagination ?? {}
        maxPage = pagination.max_page ?? 1

        for (const p of response.results ?? []) {
          const role = p.current_role
          if (!role) continue
          results.push({
            id: p.id,
            name: p.name,
            party: typeof p.party === 'string' ? p.party : (p.party?.[0]?.name ?? 'Unknown'),
            title: chamber === 'upper' ? 'Senator' : 'Representative',
            chamber,
            district: role.district ?? '',
            imageUrl: p.image ?? null,
            profileUrl: (p.links ?? [])[0]?.url ?? null,
            email: null,
          })
        }

        page++
      }
    } catch {
      continue // one chamber failing shouldn't break the other
    }
  }

  results.sort((a, b) => {
    if (a.chamber !== b.chamber) return a.chamber === 'upper' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  // Only cache non-empty results — don't persist rate-limit/error empty responses
  if (results.length > 0) {
    await cacheSet(cacheKey, results, CACHE_TTL)
  }
  return results
}
