import { describe, it, expect } from 'vitest'
import { users, candidates, stateRegistration } from './schema'

describe('schema', () => {
  it('users table has required columns', () => {
    expect(users.id).toBeDefined()
    expect(users.email).toBeDefined()
    expect(users.passwordHash).toBeDefined()
  })

  it('candidates table has positions and sources', () => {
    expect(candidates.positionsJson).toBeDefined()
    expect(candidates.sourcesJson).toBeDefined()
    expect(candidates.fetchedAt).toBeDefined()
  })

  it('stateRegistration has officialUrl', () => {
    expect(stateRegistration.officialUrl).toBeDefined()
  })
})
