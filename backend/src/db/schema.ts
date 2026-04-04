import { pgTable, text, timestamp, jsonb, boolean, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  oauthProvider: text('oauth_provider'),
  oauthId: text('oauth_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const userBallots = pgTable('user_ballots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  address: text('address').notNull(),
  districtData: jsonb('district_data').notNull(),
  savedAt: timestamp('saved_at').defaultNow().notNull(),
})

export const candidates = pgTable('candidates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  office: text('office').notNull(),
  state: text('state').notNull(),
  district: text('district'),
  party: text('party'),
  bio: text('bio'),
  photoUrl: text('photo_url'),
  websiteUrl: text('website_url'),
  positionsJson: jsonb('positions_json'),
  sourcesJson: jsonb('sources_json'),
  fetchedAt: timestamp('fetched_at').notNull(),
})

export const races = pgTable('races', {
  id: text('id').primaryKey(),
  office: text('office').notNull(),
  state: text('state').notNull(),
  district: text('district'),
  electionDate: text('election_date').notNull(),
  candidateIds: jsonb('candidate_ids').notNull(),
})

export const stateRegistration = pgTable('state_registration', {
  stateCode: text('state_code').primaryKey(),
  stateName: text('state_name').notNull(),
  deadlineRules: jsonb('deadline_rules').notNull(),
  methodsJson: jsonb('methods_json').notNull(),
  officialUrl: text('official_url').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const electionReminders = pgTable('election_reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  electionDate: text('election_date').notNull(),
  remindAt: timestamp('remind_at').notNull(),
  sent: boolean('sent').default(false).notNull(),
})

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const follows = pgTable('follows', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  entityType: text('entity_type').notNull(), // 'politician' | 'state' | 'party'
  entityId: text('entity_id').notNull(),     // lowercased name or state code
  entityName: text('entity_name').notNull(), // display name
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const pushTokens = pgTable('push_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  platform: text('platform').notNull(), // 'ios' | 'android'
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
