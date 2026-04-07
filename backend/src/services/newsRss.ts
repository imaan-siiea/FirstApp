/**
 * RSS news service — fetches election news from major outlets.
 * Fetches all feeds in parallel, caches globally for 30 min,
 * then filters per-state from the cache (no per-state fetching).
 */

import got from 'got'
import { STATE_POLITICIANS } from '../data/statePoliticians'

export interface NewsArticle {
  title: string
  url: string
  source: string
  description: string
  publishedAt: string
  isAnalysis?: boolean  // true for AI-generated briefing items
}

const FEEDS = [
  { name: 'Politico',  url: 'https://rss.politico.com/congress.xml' },
  { name: 'The Hill',  url: 'https://thehill.com/homenews/senate/feed/' },
  { name: 'The Hill',  url: 'https://thehill.com/homenews/campaign/feed/' },
  { name: 'The Hill',  url: 'https://thehill.com/homenews/house/feed/' },
  { name: 'NBC News',  url: 'https://feeds.nbcnews.com/nbcnews/public/politics' },
  { name: 'CBS News',  url: 'https://www.cbsnews.com/latest/rss/politics' },
  { name: 'ABC News',  url: 'https://abcnews.go.com/abcnews/politicsheadlines' },
  { name: 'Roll Call', url: 'https://rollcall.com/feed/' },
]

const CACHE_TTL = 1000 * 60 * 30 // 30 minutes

const STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',
  IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
  ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
  MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',
  OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
}

// ─── RSS parsing ──────────────────────────────────────────────────────────────

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`,
    'i'
  )
  const m = xml.match(re)
  return m ? m[1].trim() : ''
}

function extractLink(item: string): string {
  const direct = item.match(/<link>([^<]+)<\/link>/)
  if (direct) return direct[1].trim()
  const attr = item.match(/<link[^>]+href="([^"]+)"/)
  if (attr) return attr[1].trim()
  const guid = item.match(/<guid[^>]*>([^<]+)<\/guid>/)
  return guid ? guid[1].trim() : ''
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '')
}

function parseRss(xml: string, sourceName: string): NewsArticle[] {
  const articles: NewsArticle[] = []
  const itemRe = /<item>([\s\S]*?)<\/item>/g
  let match
  while ((match = itemRe.exec(xml)) !== null) {
    const item = match[1]
    const title = decodeEntities(extractTag(item, 'title'))
    const url   = extractLink(item)
    const desc  = decodeEntities(extractTag(item, 'description'))
      .replace(/<[^>]+>/g, '')
      .slice(0, 220)
    const publishedAt = extractTag(item, 'pubDate')
    if (title && url) {
      articles.push({ title, url, source: sourceName, description: desc, publishedAt })
    }
  }
  return articles
}

// ─── Global RSS cache ─────────────────────────────────────────────────────────

let articleCache: { articles: NewsArticle[]; builtAt: number } | null = null
let buildPromise: Promise<void> | null = null

// ─── Per-state Google News cache ──────────────────────────────────────────────

const googleNewsCache = new Map<string, { articles: NewsArticle[]; builtAt: number }>()
const GOOGLE_CACHE_TTL = 1000 * 60 * 60 * 2 // 2 hours

async function getGoogleNewsForState(stateCode: string, stateName: string): Promise<NewsArticle[]> {
  const code = stateCode.toUpperCase()
  const cached = googleNewsCache.get(code)
  if (cached && Date.now() - cached.builtAt < GOOGLE_CACHE_TTL) return cached.articles

  const query = encodeURIComponent(`${stateName} 2026 election`)
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`
  try {
    const res = await got(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VoterIQ/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      timeout: { request: 12_000 },
      retry: { limit: 1 },
    })
    const articles = parseRss(res.body, 'Google News')
    googleNewsCache.set(code, { articles, builtAt: Date.now() })
    console.log(`[news] Google News for ${code}: ${articles.length} articles`)
    return articles
  } catch (err: any) {
    console.error(`[news] Google News error for ${code}:`, err?.message)
    return []
  }
}

async function buildCache(): Promise<void> {
  const all: NewsArticle[] = []

  await Promise.allSettled(
    FEEDS.map(async feed => {
      try {
        const res = await got(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; VoterIQ/1.0)',
            Accept: 'application/rss+xml, application/xml, text/xml',
          },
          timeout: { request: 10_000 },
          retry: { limit: 1 },
        })
        all.push(...parseRss(res.body, feed.name))
      } catch (err: any) {
        console.error(`[news] feed error ${feed.url}:`, err?.message)
      }
    })
  )

  // Deduplicate by URL
  const seen = new Set<string>()
  const deduped = all.filter(a => {
    if (!a.url.startsWith('http') || seen.has(a.url)) return false
    seen.add(a.url)
    return true
  })

  articleCache = { articles: deduped, builtAt: Date.now() }
  console.log(`[news] cache built: ${deduped.length} articles`)
}

async function ensureFresh(): Promise<void> {
  const stale = !articleCache || Date.now() - articleCache.builtAt > CACHE_TTL
  if (!stale) return
  if (!buildPromise) {
    buildPromise = buildCache().finally(() => { buildPromise = null })
  }
  await buildPromise
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getStateElectionNews(stateCode: string): Promise<NewsArticle[]> {
  await ensureFresh()
  const code = stateCode.toUpperCase()
  const stateName = STATE_NAMES[code]
  if (!stateName || !articleCache) return []

  const stateLower = stateName.toLowerCase()
  const politicians = (STATE_POLITICIANS[code] ?? []).map(p => p.toLowerCase())

  return articleCache.articles
    .filter(a => {
      const haystack = `${a.title} ${a.description}`.toLowerCase()
      if (haystack.includes(stateLower)) return true
      return politicians.some(p => haystack.includes(p))
    })
    .slice(0, 7)
}

/**
 * Guarantees exactly 4 real articles + 1 AI briefing item for every state.
 * Real articles come from the global RSS cache first; if fewer than 4 are found,
 * the gap is filled from a per-state Google News RSS search.
 * One AI-generated briefing item is always appended regardless of real-article count.
 */
export async function getStateNewsWithFallback(
  stateCode: string,
  generateBriefing: (stateCode: string, stateName: string, count: number) => Promise<NewsArticle[]>,
): Promise<NewsArticle[]> {
  const code = stateCode.toUpperCase()
  const stateName = STATE_NAMES[code]
  if (!stateName) return []

  // Step 1: RSS global cache articles (up to 4)
  const rssArticles = await getStateElectionNews(code)
  const real: NewsArticle[] = rssArticles.slice(0, 4)

  // Step 2: Pad to 4 real articles using Google News if needed
  if (real.length < 4) {
    const googleArticles = await getGoogleNewsForState(code, stateName)
    const seen = new Set(real.map(a => a.url))
    const fresh = googleArticles.filter(a => a.url && a.url.startsWith('http') && !seen.has(a.url))
    real.push(...fresh.slice(0, 4 - real.length))
  }

  // Step 3: Always append exactly 1 AI briefing item
  try {
    const [aiItem] = await generateBriefing(code, stateName, 1)
    if (aiItem) real.push(aiItem)
  } catch (err: any) {
    console.warn(`[news] AI briefing failed for ${code}:`, err?.message)
  }

  return real.slice(0, 7)
}

/** Force a cache rebuild regardless of TTL — called by the scheduled job. */
export async function refreshNewsCache(): Promise<void> {
  articleCache = null
  buildPromise = null
  await ensureFresh()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cache = articleCache as any
  console.log(`[news] scheduled refresh complete: ${cache?.articles?.length ?? 0} articles`)
}

export async function getLatestElectionNews(): Promise<NewsArticle[]> {
  await ensureFresh()
  return (articleCache?.articles ?? []).slice(0, 8)
}

/**
 * Returns a compact string of recent headlines + descriptions for a state,
 * formatted for injection into an AI polling prompt.
 * Returns empty string if no articles found (caller should handle gracefully).
 */
export async function getNewsContextForPolling(stateCode: string): Promise<string> {
  const articles = await getStateElectionNews(stateCode)
  if (articles.length === 0) return ''

  const lines = articles.map(a => {
    const desc = a.description ? ` — "${a.description.slice(0, 180)}"` : ''
    return `- [${a.source}] ${a.title}${desc}`
  })

  return `RECENT NEWS FOR THIS STATE (published ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}):\n${lines.join('\n')}`
}
