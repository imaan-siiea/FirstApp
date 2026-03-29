import got from 'got'
import { cacheGet, cacheSet } from '../cache'

const BASE_URL = 'https://ballotpedia.org/w/api.php'
const CACHE_TTL = 60 * 60 * 6 // 6 hours

export interface BallotpediaCandidate {
  name: string
  pageid: number
  extract: string
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

// Alias used in candidates service
export { getCandidateBio as getBallotpediaCandidate }
