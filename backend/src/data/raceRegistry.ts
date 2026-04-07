/**
 * 2026 election race registry.
 *
 * electionDate = next upcoming election for this race (primary if not yet passed,
 * otherwise general). Refresh frequency is calculated from days until this date.
 *
 * highProfile = competitive / nationally watched race — always refreshed frequently
 * regardless of how far out the election is.
 */

export interface Race {
  stateCode: string
  office: string
  electionDate: string   // ISO date — next upcoming primary or general
  highProfile: boolean
}

// 2h / 24h / 7d thresholds
const TWO_HOURS  = 2  * 60 * 60 * 1000
const ONE_DAY    = 24 * 60 * 60 * 1000
const ONE_WEEK   = 7  * 24 * 60 * 60 * 1000

export function getRefreshIntervalMs(race: Race): number {
  const daysUntil = (new Date(race.electionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (race.highProfile || daysUntil <= 30)  return TWO_HOURS
  if (daysUntil <= 90)                       return ONE_DAY
  return ONE_WEEK
}

// ─── Class 2 Senate races (up in 2026) ───────────────────────────────────────
// primaryDate used when primary is upcoming; otherwise general (Nov 3 2026)

const SENATE_RACES: Race[] = [
  // Competitive / high-profile
  { stateCode: 'WI', office: 'U.S. Senate', electionDate: '2026-08-11', highProfile: true  }, // Baldwin, primary Aug 11
  { stateCode: 'GA', office: 'U.S. Senate', electionDate: '2026-05-19', highProfile: true  }, // Ossoff, primary May 19
  { stateCode: 'NV', office: 'U.S. Senate', electionDate: '2026-06-09', highProfile: true  }, // Cortez Masto, primary Jun 9
  { stateCode: 'IL', office: 'U.S. Senate', electionDate: '2026-11-03', highProfile: true  }, // Durbin retiring — open seat
  { stateCode: 'NC', office: 'U.S. Senate', electionDate: '2026-05-05', highProfile: true  }, // Tillis, primary May 5
  { stateCode: 'NH', office: 'U.S. Senate', electionDate: '2026-09-08', highProfile: true  }, // Shaheen, primary Sep 8
  { stateCode: 'OR', office: 'U.S. Senate', electionDate: '2026-05-19', highProfile: true  }, // Wyden retiring — open seat
  { stateCode: 'TX', office: 'U.S. Senate', electionDate: '2026-11-03', highProfile: true  }, // Cornyn — big state
  { stateCode: 'ME', office: 'U.S. Senate', electionDate: '2026-06-09', highProfile: true  }, // Collins, primary Jun 9

  // Lean/safe but notable
  { stateCode: 'KY', office: 'U.S. Senate', electionDate: '2026-05-19', highProfile: false }, // Paul / Barr primary May 19
  { stateCode: 'CO', office: 'U.S. Senate', electionDate: '2026-06-30', highProfile: false }, // Bennet
  { stateCode: 'NJ', office: 'U.S. Senate', electionDate: '2026-06-02', highProfile: false }, // Booker
  { stateCode: 'VA', office: 'U.S. Senate', electionDate: '2026-06-09', highProfile: false }, // Warner
  { stateCode: 'NY', office: 'U.S. Senate', electionDate: '2026-06-23', highProfile: false }, // Schumer
  { stateCode: 'SC', office: 'U.S. Senate', electionDate: '2026-06-09', highProfile: false }, // Scott
  { stateCode: 'AK', office: 'U.S. Senate', electionDate: '2026-08-25', highProfile: false }, // Sullivan
  { stateCode: 'AR', office: 'U.S. Senate', electionDate: '2026-05-19', highProfile: false }, // Boozman
  { stateCode: 'IA', office: 'U.S. Senate', electionDate: '2026-06-02', highProfile: false }, // Grassley
  { stateCode: 'ID', office: 'U.S. Senate', electionDate: '2026-05-19', highProfile: false }, // Risch
  { stateCode: 'KS', office: 'U.S. Senate', electionDate: '2026-08-04', highProfile: false }, // Moran
  { stateCode: 'LA', office: 'U.S. Senate', electionDate: '2026-11-03', highProfile: false }, // Cassidy (jungle primary)
  { stateCode: 'NM', office: 'U.S. Senate', electionDate: '2026-06-02', highProfile: false }, // Heinrich
  { stateCode: 'OK', office: 'U.S. Senate', electionDate: '2026-06-30', highProfile: false }, // Lankford
  { stateCode: 'SD', office: 'U.S. Senate', electionDate: '2026-06-02', highProfile: false }, // Rounds
  { stateCode: 'TN', office: 'U.S. Senate', electionDate: '2026-08-06', highProfile: false }, // Blackburn
  { stateCode: 'UT', office: 'U.S. Senate', electionDate: '2026-06-30', highProfile: false }, // Lee
]

// ─── High-profile 2026 Governor races ────────────────────────────────────────

const GOVERNOR_RACES: Race[] = [
  { stateCode: 'GA', office: 'Governor', electionDate: '2026-05-19', highProfile: true  }, // Kemp term-limited — open
  { stateCode: 'FL', office: 'Governor', electionDate: '2026-08-18', highProfile: true  }, // DeSantis term-limited — open
  { stateCode: 'PA', office: 'Governor', electionDate: '2026-05-19', highProfile: true  }, // Shapiro likely running
  { stateCode: 'MI', office: 'Governor', electionDate: '2026-08-04', highProfile: true  }, // Whitmer
  { stateCode: 'WI', office: 'Governor', electionDate: '2026-08-11', highProfile: true  }, // Evers
  { stateCode: 'NV', office: 'Governor', electionDate: '2026-06-09', highProfile: true  }, // Lombardo
  { stateCode: 'AZ', office: 'Governor', electionDate: '2026-08-04', highProfile: true  }, // Hobbs
  { stateCode: 'NC', office: 'Governor', electionDate: '2026-05-05', highProfile: false }, // Cooper term-limited — open
  { stateCode: 'OH', office: 'Governor', electionDate: '2026-05-05', highProfile: false }, // DeWine
  { stateCode: 'TX', office: 'Governor', electionDate: '2026-03-03', highProfile: false }, // Abbott — primary likely passed
  { stateCode: 'CO', office: 'Governor', electionDate: '2026-06-30', highProfile: false }, // Polis term-limited
  { stateCode: 'IL', office: 'Governor', electionDate: '2026-03-17', highProfile: false }, // Pritzker — primary likely passed
  { stateCode: 'NY', office: 'Governor', electionDate: '2026-06-23', highProfile: false }, // Hochul
  { stateCode: 'MA', office: 'Governor', electionDate: '2026-09-15', highProfile: false }, // Healey
  { stateCode: 'OR', office: 'Governor', electionDate: '2026-05-19', highProfile: false }, // Kotek
]

export const ALL_RACES: Race[] = [...SENATE_RACES, ...GOVERNOR_RACES]

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getRacesForState(stateCode: string): Race[] {
  return ALL_RACES.filter(r => r.stateCode === stateCode.toUpperCase())
}

/**
 * Returns the shortest refresh interval across all races for a state.
 * States with no registered race get a weekly refresh (they'll still respond
 * on-demand — this just controls pre-warming).
 */
export function getStateRefreshIntervalMs(stateCode: string): number {
  const races = getRacesForState(stateCode)
  if (races.length === 0) return ONE_WEEK
  return Math.min(...races.map(getRefreshIntervalMs))
}

/** Every US state code — used to pre-warm polling cache for all 50 states. */
export const ALL_STATE_CODES: string[] = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

/**
 * Returns all unique state codes that have registered races,
 * deduplicated and sorted.
 */
export function getAllRaceStateCodes(): string[] {
  return [...new Set(ALL_RACES.map(r => r.stateCode))].sort()
}
