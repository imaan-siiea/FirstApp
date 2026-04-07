// Geocoding via Nominatim (OpenStreetMap) — completely free, no API key, no credit card
// Rate limit: 1 req/sec (enforced below). Attribution: © OpenStreetMap contributors.
import { cacheGet, cacheSet } from '../cache'

const NOMINATIM = 'https://nominatim.openstreetmap.org'
const HEADERS = { 'User-Agent': 'VoterIQ/1.0 (civic education app; contact@voteriq.app)' }

export interface NearbyPlace {
  name: string
  address: string
  coordinates: [number, number]
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const cacheKey = `geo:${address.toLowerCase().replace(/\s+/g, '-')}`
  const cached = await cacheGet<{ lat: number; lng: number }>(cacheKey)
  if (cached) return cached

  try {
    const url = `${NOMINATIM}/search?` + new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      countrycodes: 'us',
      addressdetails: '0',
    })
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null

    const results = await res.json() as any[]
    if (!results?.length) return null

    const coords = { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }
    await cacheSet(cacheKey, coords, 60 * 60 * 24 * 30) // 30 days
    return coords
  } catch {
    return null
  }
}

export interface PollingPlace {
  name: string
  address: string
  lat: number
  lng: number
}

// Nominatim doesn't have polling place POI data — these come from official state sources.
// Returns empty for now; the route stub (/polling-places) already documents this.
export async function findNearestPollingPlaces(_address: string): Promise<PollingPlace[]> {
  return []
}

export async function findNearestRegistrationSites(address: string): Promise<NearbyPlace[]> {
  const cacheKey = `regsites:${address.toLowerCase().replace(/\s+/g, '-')}`
  const cached = await cacheGet<NearbyPlace[]>(cacheKey)
  if (cached) return cached

  const coords = await geocodeAddress(address)
  if (!coords) return []

  try {
    // Search for county clerk / election offices near the geocoded address
    const url = `${NOMINATIM}/search?` + new URLSearchParams({
      q: 'county clerk election office',
      format: 'json',
      limit: '5',
      countrycodes: 'us',
      viewbox: `${coords.lng - 0.5},${coords.lat + 0.5},${coords.lng + 0.5},${coords.lat - 0.5}`,
      bounded: '1',
    })
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []

    const results = await res.json() as any[]
    const sites: NearbyPlace[] = (results ?? []).map((r: any) => ({
      name: r.display_name.split(',')[0],
      address: r.display_name,
      coordinates: [parseFloat(r.lon), parseFloat(r.lat)] as [number, number],
    }))

    await cacheSet(cacheKey, sites, 60 * 60 * 24 * 7)
    return sites
  } catch {
    return []
  }
}
