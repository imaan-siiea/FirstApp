import { getRepresentativesByState } from '../services/openStates'
import { getCandidateBio } from '../services/ballotpedia'
import { db } from '../db'
import { candidates } from '../db/schema'
import { sql } from 'drizzle-orm'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

export async function refreshStateLegislators() {
  console.log('[cron] Starting nightly candidate refresh...')
  let refreshed = 0

  for (const state of US_STATES) {
    try {
      const people = await getRepresentativesByState(state)
      for (const person of people) {
        const bio = await getCandidateBio(person.name)
        await db
          .insert(candidates)
          .values({
            id: person.id,
            name: person.name,
            office: person.title ?? 'State Legislator',
            state,
            district: person.district,
            party: person.party,
            bio: bio?.extract,
            photoUrl: person.imageUrl,
            websiteUrl: bio?.fullurl,
            positionsJson: [],
            sourcesJson: bio
              ? [{ name: 'Ballotpedia', url: bio.fullurl, fetchedAt: new Date().toISOString() }]
              : [],
            fetchedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: candidates.id,
            set: {
              bio: sql`excluded.bio`,
              fetchedAt: sql`excluded.fetched_at`,
              sourcesJson: sql`excluded.sources_json`,
            },
          })
        refreshed++
      }
    } catch (err) {
      console.error(`[cron] Failed refreshing ${state}:`, err)
    }
  }

  console.log(`[cron] Candidate refresh complete. Updated ${refreshed} records.`)
}
