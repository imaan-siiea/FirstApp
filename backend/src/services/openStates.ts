import { cacheGet, cacheSet } from '../cache'

const BASE_URL = 'https://v3.openstates.org'
const API_KEY = process.env.OPENSTATES_API_KEY ?? ''
const CACHE_TTL = 60 * 60 * 12 // 12 hours

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
  if (!API_KEY) return [] // no key — fails silently

  const code = stateCode.toLowerCase()
  const cacheKey = `openstates:reps:${code}`
  const cached = await cacheGet<StateRepresentative[]>(cacheKey)
  if (cached) return cached

  const results: StateRepresentative[] = []

  for (const chamber of ['upper', 'lower']) {
    try {
      // Use native fetch — got v14 URL-encodes slashes/colons in jurisdiction causing 400s
      // per_page max is 50 per OpenStates API
      const url = `${BASE_URL}/people?jurisdiction=ocd-jurisdiction/country:us/state:${code}/government&org_classification=${chamber}&per_page=50`
      const res = await fetch(url, { headers: { 'X-API-KEY': API_KEY } })
      if (res.status === 429) {
        // Rate limited — wait 6 seconds and retry once
        await new Promise(r => setTimeout(r, 6000))
        const retry = await fetch(url, { headers: { 'X-API-KEY': API_KEY } })
        if (!retry.ok) continue
        const retryData = await retry.json() as any
        for (const p of retryData.results ?? []) {
          const role = p.current_role
          if (!role) continue
          results.push({
            id: p.id, name: p.name,
            party: typeof p.party === 'string' ? p.party : (p.party?.[0]?.name ?? 'Unknown'),
            title: chamber === 'upper' ? 'Senator' : 'Representative',
            chamber, district: role.district ?? '',
            imageUrl: p.image ?? null, profileUrl: (p.links ?? [])[0]?.url ?? null, email: null,
          })
        }
        continue
      }
      if (!res.ok) continue
      const response = await res.json() as any

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
    } catch {
      continue // one chamber failing shouldn't break the other
    }
  }

  results.sort((a, b) => {
    if (a.chamber !== b.chamber) return a.chamber === 'upper' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  await cacheSet(cacheKey, results, CACHE_TTL)
  return results
}
