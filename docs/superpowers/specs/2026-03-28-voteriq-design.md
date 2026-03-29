# VoterIQ — Design Specification
**Date:** 2026-03-28
**Status:** Approved
**Version:** 1.0

---

## Overview

VoterIQ is a native mobile civic companion app (iOS + Android) that helps voters understand their ballot, research candidates, and navigate voter registration. The core differentiator is a Claude-powered conversational ballot guide — users can ask natural-language questions about candidates and get sourced, synthesized answers rather than browsing a raw database.

**v1 Scope:** Federal + state elections only (US). No local races. No web app.

---

## User Flows

### Primary Flow: Ballot Guide
1. User opens app → enters home address (or uses saved address if signed in)
2. App computes their electoral districts (via Google Civic API)
3. App displays their exact ballot: all federal + state races relevant to their address
4. User taps a race → sees candidate cards with sourced position summaries
5. User opens AI Chat → asks questions about candidates in plain language
6. Claude responds with synthesized, cited answers from Ballotpedia + OpenStates data

### Secondary Flow: Registration Guide
1. User taps "Register to Vote" from home or ballot screen
2. Selects their state
3. App displays: registration deadline, eligibility requirements, available methods (online/mail/in-person), direct link to official state registration site
4. Mapbox integration shows nearest in-person registration location with hours

### Optional Flow: Accounts
- User can create an account (email/password or social login via OAuth)
- Saves: home address, ballot selections, election reminders
- Not required to access any feature

---

## Architecture

### Mobile App (Expo + React Native + TypeScript)
- **Navigation:** Expo Router (file-based, native stack)
- **State:** Zustand (lightweight, no boilerplate)
- **Data fetching:** TanStack Query (caching, background refresh)
- **Auth:** Expo SecureStore + JWT tokens
- **Maps:** Mapbox React Native SDK
- **Push notifications:** Expo Notifications (election reminders)
- **Build + deployment:** EAS Build → App Store + Google Play

### Backend API (Node.js + Fastify + TypeScript)
Deployed on Coolify/Proxmox as a Docker container.

**Endpoints:**

| Route | Purpose |
|-------|---------|
| `POST /ballot` | Address → districts → race list |
| `GET /candidates/:id` | Candidate profile + positions |
| `GET /races/:id` | Race details + all candidates |
| `POST /ai/chat` | Claude API proxy + context injection |
| `GET /registration/:state` | State-specific registration guide |
| `GET /registration/:state/sites` | Nearest registration sites via Mapbox |
| `POST /auth/register` | Create account |
| `POST /auth/login` | Login → JWT |
| `POST /auth/refresh` | Refresh token |
| `GET /user/ballot` | Saved ballot for authenticated user |
| `POST /user/reminders` | Set election reminder |

### Database (PostgreSQL)

**Tables:**
- `users` — id, email, password_hash, created_at
- `user_ballots` — user_id, address, district_data, saved_at
- `candidates` — id, name, office, state, party, bio, positions_json, sources_json, fetched_at
- `races` — id, office, state, district, election_date
- `state_registration` — state_code, deadline_rules, methods_json, official_url, updated_at
- `election_reminders` — user_id, election_date, remind_at, sent

**Caching (Redis):**
- Google Civic API responses: 24h TTL
- Ballotpedia candidate data: 6h TTL
- OpenStates data: 12h TTL
- Registration guide data: 7d TTL

### Data Pipeline

**Sources and usage:**

| Source | Data | Refresh |
|--------|------|---------|
| Google Civic Information API | District lookup, ballot composition, polling places | On-demand (per address query) |
| OpenStates API | State legislators, voting records, committee memberships | Nightly cron |
| Ballotpedia | Candidate bios, campaign positions, endorsements | Nightly cron |
| Mapbox Geocoding API | Address → lat/lng → nearest registration sites | On-demand |
| Claude API (claude-sonnet-4-6) | Conversational Q&A synthesis | On-demand (per chat message) |

**Data confidence tiers:**
- **Tier 1 (High):** Official government APIs (Google Civic, OpenStates)
- **Tier 2 (Medium):** Curated civic databases (Ballotpedia)
- **Tier 3 (AI-synthesized):** Claude summaries of Tier 1+2 data — always shown with source citations

Every candidate data point displayed in the app shows: source name + last-verified date.

### AI Layer (Claude Integration)

**Context injection pattern:** When a user asks a question in AI Chat, the backend:
1. Identifies which race/candidates the conversation is about (from session context)
2. Fetches structured candidate data from PostgreSQL
3. Constructs a system prompt: `You are a nonpartisan civic guide. Answer questions about the following candidates using only the provided data. Always cite your sources. Never express a personal opinion or recommendation. Data: [candidate JSON]`
4. Forwards user message + context to `claude-sonnet-4-6`
5. Returns response with source citations

**Guardrails:**
- System prompt enforces nonpartisan stance
- Claude is not given access to external search — only the pre-fetched, verified candidate data
- Rate limit: 20 AI chat messages per user per day (unauthenticated), 100/day (authenticated)

### Auth (Optional Accounts)

- Email/password with bcrypt hashing
- JWT access tokens (15min expiry) + refresh tokens (30 days, stored in PostgreSQL)
- OAuth providers: Google, Apple (required for App Store)
- All features accessible without auth — auth only required for saving ballot + reminders

### Error Handling

- Google Civic API unavailable → show graceful "district lookup unavailable" message, let user browse by state manually
- Ballotpedia/OpenStates data missing → show candidate name + office with "detailed info not yet available" notice
- Claude API unavailable → disable AI Chat tab, show "AI guide temporarily unavailable" banner
- Network offline → TanStack Query serves cached data where available; shows offline indicator

### Notifications

- Expo Push Notifications for election reminders
- User sets reminder N days before election date
- Backend cron job sends push at 9am user's local time on reminder date

---

## Screen Map

```
App
├── Onboarding (first launch only)
│   ├── Welcome
│   ├── Address Entry
│   └── Optional Sign Up
├── Home
│   ├── Your Ballot (race list)
│   └── Quick links: Registration, Reminders
├── Ballot
│   ├── Race List (grouped by: Federal / State)
│   └── Race Detail
│       ├── Candidate Cards
│       ├── Candidate Profile
│       └── AI Chat
├── Registration
│   ├── State Selector
│   ├── State Guide (deadline, methods, link)
│   └── Nearest Sites Map
├── Account (optional)
│   ├── Login / Sign Up
│   ├── Saved Ballot
│   └── Reminders
└── Settings
    ├── Update Address
    ├── Notifications
    └── About / Neutrality Policy
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Mobile | Expo SDK 52+ / React Native / TypeScript |
| Navigation | Expo Router |
| State | Zustand |
| Data fetching | TanStack Query |
| Maps | Mapbox React Native SDK |
| Backend | Node.js + Fastify + TypeScript |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| AI | Claude API (claude-sonnet-4-6) |
| Auth | JWT + bcrypt + OAuth (Google, Apple) |
| Push | Expo Notifications |
| App builds | EAS Build + EAS Submit |
| Deployment | Coolify on Proxmox (Docker) |
| CI/CD | GitHub Actions + Coolify webhooks |

---

## Non-Goals (v1)

- Local races (city council, school board, judges)
- Web app
- In-app voter registration (only linking to official sites)
- Candidate self-registration or data editing
- Social features (sharing, comparing with friends)
- Post-election accountability tracking (v2)
- SMS pathway (v2)
- White-label for civic orgs (v2)

---

## Editorial Neutrality Policy

- All candidate data is sourced from official or established nonpartisan sources
- Claude is explicitly instructed not to recommend, endorse, or rank candidates
- Candidates within a race are displayed in alphabetical order by default
- Data disputes: users can flag inaccurate data; flagged items are reviewed within 48h and corrected or removed
- No paid placement or sponsored candidate profiles

---

## Open Questions (pre-build)

1. **API keys:** Google Civic API free tier limits (2,500 req/day) — need to assess if paid tier is required at launch volume
2. **App Store:** Apple requires Apple Sign In if any other OAuth is offered — confirmed above (Apple + Google OAuth)
3. **Legal review:** Voter registration assistance language per state — recommended before launch
4. **Ballotpedia API:** Confirm API access terms and rate limits before building data pipeline
