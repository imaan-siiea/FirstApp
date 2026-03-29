import got from 'got'
import { cacheGet, cacheSet } from '../cache'

const BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places'
const TOKEN = process.env.MAPBOX_ACCESS_TOKEN ?? ''

export interface NearbyPlace {
  name: string
  address: string
  coordinates: [number, number]
}

export async function findNearestRegistrationSites(
  address: string,
  _stateCode: string,
): Promise<NearbyPlace[]> {
  const cacheKey = `mapbox:sites:${address.toLowerCase().replace(/\s+/g, '-')}`
  const cached = await cacheGet<NearbyPlace[]>(cacheKey)
  if (cached) return cached

  const geoRes = await got(`${BASE_URL}/${encodeURIComponent(address)}.json`, {
    searchParams: { access_token: TOKEN, limit: 1 },
  }).json<any>()

  const [lng, lat] = geoRes.features?.[0]?.center ?? [0, 0]
  if (!lng && !lat) return []

  const searchRes = await got(`${BASE_URL}/election office.json`, {
    searchParams: { access_token: TOKEN, proximity: `${lng},${lat}`, limit: 5, country: 'us' },
  }).json<any>()

  const sites: NearbyPlace[] = (searchRes.features ?? []).map((f: any) => ({
    name: f.text,
    address: f.place_name,
    coordinates: f.center as [number, number],
  }))

  await cacheSet(cacheKey, sites, 60 * 60 * 24 * 7)
  return sites
}
