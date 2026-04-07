import { cacheGet } from '../cache'
import { getRepresentativesByState, getDailyRequestCount } from '../services/openStates'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

// Runs in the background at startup — pre-warms states not yet in cache.
// Fetches one state every 3 seconds so the entire warm-up takes ~2.5 min and
// stays well within the 200 req/day cap (50 states × ~4 avg pages = ~200 calls).
export async function warmUpLegislatorsCache(): Promise<void> {
  const uncached: string[] = []

  for (const state of US_STATES) {
    const key = `openstates:reps:${state.toLowerCase()}`
    const hit = await cacheGet<unknown[]>(key)
    if (!hit) uncached.push(state)
  }

  if (uncached.length === 0) {
    console.log('[warm-up] All 50 state legislator caches are already populated — nothing to do')
    return
  }

  console.log(`[warm-up] Pre-warming ${uncached.length} uncached states in the background…`)

  for (const state of uncached) {
    const { used, limit } = getDailyRequestCount()
    if (used >= limit) {
      console.warn(`[warm-up] Daily cap reached (${used}/${limit}) — remaining states will warm on first user access`)
      break
    }

    try {
      await getRepresentativesByState(state)
      console.log(`[warm-up] ✓ ${state} (${getDailyRequestCount().used}/${limit} requests today)`)
    } catch {
      console.warn(`[warm-up] ✗ ${state} — skipping`)
    }

    // 3-second pause between states to avoid bursting
    await new Promise(r => setTimeout(r, 3000))
  }

  console.log('[warm-up] Legislator cache warm-up complete')
}
