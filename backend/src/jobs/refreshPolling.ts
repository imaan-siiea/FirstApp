/**
 * Smart polling refresh job.
 *
 * Runs every 2 hours. For each state in the race registry, checks whether
 * its cached polling data has expired based on its race-specific TTL:
 *
 *   highProfile or ≤ 30 days out  → 2-hour TTL
 *   31–90 days out                 → 24-hour TTL
 *   91+ days out                   → 7-day TTL
 *
 * States that are due get refreshed sequentially (to stay within Groq
 * rate limits), with a 3-second pause between calls.
 */

import { getPollingOutlook } from '../services/aiChat'
import { getPollingCached, setPollingCached } from '../services/pollingCache'
import { ALL_STATE_CODES } from '../data/raceRegistry'

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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function refreshDueRaces(): Promise<void> {
  // All 50 states — TTL per state is determined by its race proximity
  const due = ALL_STATE_CODES.filter(code => getPollingCached(code) === null)

  if (due.length === 0) {
    console.log('[polling-refresh] All states up to date — nothing to refresh')
    return
  }

  console.log(`[polling-refresh] Refreshing ${due.length} states: ${due.join(', ')}`)

  let refreshed = 0
  let failed = 0

  for (const code of due) {
    const stateName = STATE_NAMES[code]
    if (!stateName) continue

    try {
      const data = await getPollingOutlook(code, stateName)
      setPollingCached(code, data)
      refreshed++
      console.log(`[polling-refresh] ✓ ${code} (${stateName})`)
    } catch (err: any) {
      failed++
      console.error(`[polling-refresh] ✗ ${code}: ${err?.message}`)
    }

    // Pace the calls — Groq allows ~30 req/min on free tier
    await sleep(3_000)
  }

  console.log(`[polling-refresh] Done — ${refreshed} refreshed, ${failed} failed`)
}
