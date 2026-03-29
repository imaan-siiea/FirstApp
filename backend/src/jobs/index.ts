import cron from 'node-cron'
import { refreshStateLegislators } from './refreshCandidates'

export function startJobs() {
  // Run at 2am every night
  cron.schedule('0 2 * * *', async () => {
    await refreshStateLegislators()
  })

  console.log('[jobs] Nightly refresh job scheduled (2am daily)')
}
