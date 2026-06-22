import 'dotenv/config'
import { buildApp } from './app'
import { startJobs } from './jobs'
import { warmUpLegislatorsCache } from './jobs/warmUpLegislators'

// Catch unhandled errors to prevent silent crashes
process.on('unhandledRejection', (reason) => {
  console.error('[fatal] Unhandled promise rejection:', reason)
})

process.on('uncaughtException', (err) => {
  console.error('[fatal] Uncaught exception:', err)
  process.exit(1)
})

const PORT = parseInt(process.env.PORT ?? '3000', 10)

async function start() {
  const app = buildApp()
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    startJobs()
    // Fire-and-forget: pre-warms all 50 state legislator caches over ~2.5 min
    warmUpLegislatorsCache().catch(err => console.error('[warm-up] Unexpected error:', err))
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
