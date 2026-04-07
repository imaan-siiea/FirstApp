/**
 * In-memory polling cache with per-state TTLs.
 * TTL is determined by how close the next election is (from raceRegistry).
 * States not in the registry still get cached for 1 week.
 */

import type { PollingOutlook } from './aiChat'
import { getStateRefreshIntervalMs } from '../data/raceRegistry'

interface CacheEntry {
  data: PollingOutlook
  cachedAt: number
  ttlMs: number
}

const cache = new Map<string, CacheEntry>()

export function getPollingCached(stateCode: string): PollingOutlook | null {
  const entry = cache.get(stateCode.toUpperCase())
  if (!entry) return null
  if (Date.now() - entry.cachedAt > entry.ttlMs) return null
  return entry.data
}

export function setPollingCached(stateCode: string, data: PollingOutlook): void {
  const code = stateCode.toUpperCase()
  cache.set(code, {
    data,
    cachedAt: Date.now(),
    ttlMs: getStateRefreshIntervalMs(code),
  })
}

/** Returns state codes whose cache has expired and need a refresh. */
export function getStaleStateCodes(): string[] {
  const stale: string[] = []
  for (const [code, entry] of cache.entries()) {
    if (Date.now() - entry.cachedAt > entry.ttlMs) {
      stale.push(code)
    }
  }
  return stale
}

export function getCacheStats(): { code: string; ageMinutes: number; ttlHours: number; stale: boolean }[] {
  return [...cache.entries()].map(([code, entry]) => {
    const ageMs = Date.now() - entry.cachedAt
    return {
      code,
      ageMinutes: Math.round(ageMs / 60_000),
      ttlHours: Math.round(entry.ttlMs / 3_600_000),
      stale: ageMs > entry.ttlMs,
    }
  })
}
