import { buildApp } from './app'
import { startJobs } from './jobs'

const PORT = parseInt(process.env.PORT ?? '3000', 10)

async function start() {
  const app = buildApp()
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    startJobs()
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
