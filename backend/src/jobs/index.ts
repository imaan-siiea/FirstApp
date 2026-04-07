import cron from 'node-cron'
import { execFile } from 'child_process'
import { join } from 'path'
import { refreshStateLegislators } from './refreshCandidates'
import { refreshNewsCache } from '../services/newsRss'
import { refreshDueRaces } from './refreshPolling'

const CT = { timezone: 'America/Chicago' }

function runDumpScript() {
  const script = join(__dirname, '../../scripts/dumpStateLegislators.ts')
  const child = execFile('npx', ['tsx', script], { env: process.env })
  child.stdout?.on('data', d => process.stdout.write(`[dump] ${d}`))
  child.stderr?.on('data', d => process.stderr.write(`[dump] ${d}`))
  child.on('exit', code => console.log(`[dump] Exited with code ${code}`))
}

export function startJobs() {
  // Nightly legislator static-file dump at 12:10am CT (10 min after daily limit resets)
  cron.schedule('10 0 * * *', () => {
    console.log('[cron] Running nightly OpenStates dump...')
    runDumpScript()
  }, CT)

  // Nightly DB candidate refresh at 2am CT (after dump completes)
  cron.schedule('0 2 * * *', async () => {
    await refreshStateLegislators()
  }, CT)

  // Every 2 hours, 9am–5pm CT: refresh news feeds first, then poll races that are due
  cron.schedule('0 9,11,13,15,17 * * *', async () => {
    await refreshNewsCache()
    await refreshDueRaces()
  }, CT)

  console.log('[jobs] Scheduled: nightly legislators (2am CT) · news + polling refresh (9am–5pm CT every 2h)')
}
