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
