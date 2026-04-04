// Simple in-memory cache: slug → { url, fetchedAt }
const cache = new Map<string, { url: string | null; fetchedAt: number }>()
const TTL = 1000 * 60 * 60 * 24 // 24 hours

const HEADERS = { 'User-Agent': 'VoterIQ/1.0 (civic education app)' }

export async function getWikipediaPhotoUrl(wikiSlug: string): Promise<string | null> {
  const cached = cache.get(wikiSlug)
  if (cached && Date.now() - cached.fetchedAt < TTL) return cached.url

  try {
    // Primary: REST summary API (fast, returns thumbnail if article has a lead image)
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiSlug)}`,
      { headers: HEADERS, signal: AbortSignal.timeout(6000) }
    )
    if (res.ok) {
      const summary = await res.json() as any
      if (summary?.thumbnail?.source) {
        cache.set(wikiSlug, { url: summary.thumbnail.source, fetchedAt: Date.now() })
        return summary.thumbnail.source
      }
    }

    // Fallback: MediaWiki pageimages API — finds images the REST API misses
    const params = new URLSearchParams({
      action: 'query',
      titles: wikiSlug.replace(/_/g, ' '),
      prop: 'pageimages',
      format: 'json',
      pithumbsize: '200',
      pilicense: 'any',
    })
    const mwRes = await fetch(
      `https://en.wikipedia.org/w/api.php?${params}`,
      { headers: HEADERS, signal: AbortSignal.timeout(6000) }
    )
    if (mwRes.ok) {
      const mw = await mwRes.json() as any
      const pages = mw?.query?.pages ?? {}
      const page = Object.values(pages)[0] as any
      const url: string | null = page?.thumbnail?.source ?? null
      cache.set(wikiSlug, { url, fetchedAt: Date.now() })
      return url
    }
  } catch {
    // ignore
  }

  cache.set(wikiSlug, { url: null, fetchedAt: Date.now() })
  return null
}
