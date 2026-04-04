import got from 'got'
import { cacheGet, cacheSet } from '../cache'

const GEOCODE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places'
const TOKEN = process.env.MAPBOX_ACCESS_TOKEN ?? ''

export interface NearbyPlace {
  name: string
  address: string
  coordinates: [number, number]
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!TOKEN) return null

  const cacheKey = `mapbox:geo:${address.toLowerCase().replace(/\s+/g, '-')}`
  const cached = await cacheGet<{ lat: number; lng: number }>(cacheKey)
  if (cached) return cached

  try {
    const res = await got(`${GEOCODE_URL}/${encodeURIComponent(address)}.json`, {
      searchParams: { access_token: TOKEN, limit: 1, country: 'us' },
    }).json<any>()

    const center = res.features?.[0]?.center
    if (!center) return null

    const coords = { lat: center[1], lng: center[0] }
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

export async function findNearestPollingPlaces(address: string): Promise<PollingPlace[]> {
  if (!TOKEN) return []

  const cacheKey = `mapbox:polling:${address.toLowerCase().replace(/\s+/g, '-')}`
  const cached = await cacheGet<PollingPlace[]>(cacheKey)
  if (cached) return cached

  const coords = await geocodeAddress(address)
  if (!coords) return []

  try {
    const res = await got(`${GEOCODE_URL}/polling place.json`, {
      searchParams: {
        access_token: TOKEN,
        proximity: `${coords.lng},${coords.lat}`,
        limit: 5,
        country: 'us',
        types: 'poi',
      },
    }).json<any>()

    const places: PollingPlace[] = (res.features ?? []).map((f: any) => ({
      name: f.text,
      address: f.place_name,
      lat: f.center[1],
      lng: f.center[0],
    }))

    await cacheSet(cacheKey, places, 60 * 60 * 24)
    return places
  } catch {
    return []
  }
}

export async function findNearestRegistrationSites(address: string): Promise<NearbyPlace[]> {
  if (!TOKEN) return []

  const cacheKey = `mapbox:regsites:${address.toLowerCase().replace(/\s+/g, '-')}`
  const cached = await cacheGet<NearbyPlace[]>(cacheKey)
  if (cached) return cached

  const coords = await geocodeAddress(address)
  if (!coords) return []

  try {
    const res = await got(`${GEOCODE_URL}/election office.json`, {
      searchParams: {
        access_token: TOKEN,
        proximity: `${coords.lng},${coords.lat}`,
        limit: 5,
        country: 'us',
      },
    }).json<any>()

    const sites: NearbyPlace[] = (res.features ?? []).map((f: any) => ({
      name: f.text,
      address: f.place_name,
      coordinates: f.center as [number, number],
    }))

    await cacheSet(cacheKey, sites, 60 * 60 * 24 * 7)
    return sites
  } catch {
    return []
  }
}
