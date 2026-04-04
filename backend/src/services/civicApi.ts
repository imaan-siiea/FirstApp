import got from 'got'
import { cacheGet, cacheSet } from '../cache'

const BASE_URL = 'https://www.googleapis.com/civicinfo/v2'
const API_KEY = process.env.GOOGLE_CIVIC_API_KEY ?? ''
const CACHE_TTL = 60 * 60 * 24 // 24 hours

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
  electionName?: string
  electionDay?: string
}

export interface ElectionSummary {
  id: string
  name: string
  electionDay: string
  ocdDivisionId: string
  stateCode: string | null // 'TX', 'CA', etc. — null means national
}

function extractStateCode(ocdDivisionId: string): string | null {
  const match = ocdDivisionId.match(/\/state:([a-z]{2})/)
  return match ? match[1].toUpperCase() : null
}

export async function getUpcomingElections(): Promise<ElectionSummary[]> {
  const cacheKey = 'civic:elections'
  const cached = await cacheGet<ElectionSummary[]>(cacheKey)
  if (cached) return cached

  const response = await got(`${BASE_URL}/elections`, {
    searchParams: { key: API_KEY },
  }).json<any>()

  const now = new Date()
  const twoYearsAgo = new Date(now)
  twoYearsAgo.setFullYear(now.getFullYear() - 2)
  const oneYearAhead = new Date(now)
  oneYearAhead.setFullYear(now.getFullYear() + 1)

  const elections: ElectionSummary[] = (response.elections ?? [])
    .filter((e: any) => {
      if (e.id === '2000') return false // exclude test election
      const d = new Date(e.electionDay)
      return d >= twoYearsAgo && d <= oneYearAhead
    })
    .map((e: any) => ({
      id: e.id,
      name: e.name,
      electionDay: e.electionDay,
      ocdDivisionId: e.ocdDivisionId ?? '',
      stateCode: extractStateCode(e.ocdDivisionId ?? ''),
    }))
    .sort((a: ElectionSummary, b: ElectionSummary) => a.electionDay.localeCompare(b.electionDay))

  await cacheSet(cacheKey, elections, 60 * 60 * 6) // 6 hour cache
  return elections
}

export async function getBallotForAddress(address: string): Promise<CivicBallot> {
  const cacheKey = `civic:ballot:${address.toLowerCase().replace(/\s+/g, '-')}`
  const cached = await cacheGet<CivicBallot>(cacheKey)
  if (cached) return cached

  // Try each upcoming real election until we find one with contests for this address
  const elections = await getUpcomingElections()

  for (const election of elections) {
    try {
      const response = await got(`${BASE_URL}/voterinfo`, {
        searchParams: { key: API_KEY, address, electionId: election.id },
      }).json<any>()

      const contests: CivicContest[] = response.contests ?? []
      if (contests.length === 0) continue // No contests for this address in this election

      const ballot: CivicBallot = {
        normalizedAddress: response.normalizedInput
          ? `${response.normalizedInput.line1}, ${response.normalizedInput.city}, ${response.normalizedInput.state}`
          : address,
        contests,
        pollingLocations: response.pollingLocations ?? [],
        electionName: election.name,
        electionDay: election.electionDay,
      }

      await cacheSet(cacheKey, ballot, CACHE_TTL)
      return ballot
    } catch {
      continue // This election has no data for the address — try next
    }
  }

  // No upcoming elections found for this address — return empty ballot
  const empty: CivicBallot = {
    normalizedAddress: address,
    contests: [],
    pollingLocations: [],
    electionName: undefined,
    electionDay: undefined,
  }
  await cacheSet(cacheKey, empty, 60 * 60 * 2) // Short cache for empty results
  return empty
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
