import got from 'got'
import { cacheGet, cacheSet } from '../cache'

const BASE_URL = 'https://v3.openstates.org'
const API_KEY = process.env.OPENSTATES_API_KEY ?? ''
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
    searchParams: {
      jurisdiction: `ocd-jurisdiction/country:us/state:${state.toLowerCase()}/government`,
      per_page: 200,
    },
  }).json<{ results: OpenStatesPerson[] }>()

  await cacheSet(cacheKey, response.results, CACHE_TTL)
  return response.results
}
