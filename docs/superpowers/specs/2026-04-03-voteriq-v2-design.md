# VoterIQ v2 — Candidate Enrichment, Profile Redesign & Production Launch

**Date:** 2026-04-03
**Status:** Approved for implementation

---

## Overview

Three parallel workstreams to take VoterIQ from local test to live production app with real, in-depth candidate data:

1. **Candidate profile redesign** — Option B layout with real photos, party colors, positions, and Compare tab
2. **Data enrichment pipeline** — real photos from Congress.gov, bios + positions from Ballotpedia and VoteSmart
3. **How to Vote guide** — new screen explaining the voting process step by step
4. **Production launch** — Coolify deployment, GitHub remote, SSL, domain

---

## 1. Candidate Profile Redesign

### Layout (Option B — approved)

- **Gradient header** (navy `#1e3a5f` → `#2d5a8e`) at fixed height
- **Photo** overlaps header into white body, left-aligned, circular, 88px, bordered
- **Name, office, party badge** sit to the right of where photo overflows
- **Party badge color:**
  - Democrat → `#2563eb` (blue)
  - Republican → `#dc2626` (red)
  - Independent / other → `#7c3aed` (purple)
  - Unknown → `#64748b` (gray)
- **Four tabs:** Overview · Positions · Compare · Ask AI

### Tab: Overview
- Short biography (from Ballotpedia)
- Top 3 issue tags (pills)
- Website link
- Source attribution + freshness date

### Tab: Positions
- Issue-by-issue list: icon + issue name + position statement + source + year
- Issues: Healthcare, Economy, Education, Immigration, Environment, Veterans, Gun Policy, Foreign Policy (show only what's available)
- Source displayed per-item (VoteSmart / Ballotpedia / official website)

### Tab: Compare
- Picker to select a second candidate from the same ballot
- Side-by-side columns for each shared issue
- Left = current candidate, Right = selected opponent
- Issues with no data for either candidate are hidden
- Strictly nonpartisan — no color coding on positions, only on party badges

### Tab: Ask AI
- Navigates to `/chat` screen pre-loaded with candidate context
- First message auto-filled: "Tell me about [Name]'s stance on the issues"

---

## 2. Data Enrichment Pipeline

### Photo Source
- **Primary:** `https://bioguide.congress.gov/photo/{BIOGUIDE_ID}.jpg` — official Congress.gov photos for all federal officials
- **Fallback:** Ballotpedia candidate image URL (from their API/scrape)
- **Final fallback:** Initials avatar (current behavior)
- Bioguide ID mapping: derive from Google Civic API `candidateId` field, or fuzzy-match by name + office

### Biography Source
- Ballotpedia MediaWiki API (already integrated) — `extract` field
- Cache 24 hours per candidate

### Positions Source
- **VoteSmart API** (`votesmart.org/API`) — free for civic/educational use
  - Endpoint: `/Rating.getCandidateRating` + `/Votes.getByOfficial`
  - Requires separate API key (`VOTESMART_API_KEY`)
- **Fallback:** AI-extracted positions from Ballotpedia bio text via Groq
  - Prompt: "Extract this candidate's known policy positions as JSON: {bio}"
  - Label these as `confidence: 'ai-inferred'` not `confidence: 'sourced'`
- Positions stored in Redis cache, 6-hour TTL

### Backend Service: `candidateEnrichment.ts`
- `getPhotoUrl(name, office, state)` → Congress.gov lookup → Ballotpedia fallback
- `getPositions(name, office, state)` → VoteSmart → AI extraction fallback
- Both called in parallel when building `CandidateProfile`

---

## 3. How to Vote Guide

### New screen: `mobile/app/how-to-vote.tsx`

A simple, scroll-based guide. No API calls needed — static content with state-specific links.

**Structure:**
1. **Header** — "How to Vote in [State]" (derived from user's stored address)
2. **Step 1 — Check Registration** — link to state's voter registration lookup
3. **Step 2 — Find Your Polling Place** — link to state's polling place finder
4. **Step 3 — What to Bring** — bullet list (ID requirements vary by state — pulled from `stateRegistration` data already in backend)
5. **Step 4 — Election Day** — date of next election (from Google Civic API election data)
6. **Step 5 — Absentee / Mail-in** — link to state's absentee info page
7. **AI Help button** — "Ask AI any voting question" → chat screen

### Navigation
- Accessible from Home screen (new "How to Vote" button)
- Also accessible from ballot screen header

---

## 4. Production Launch

### Prerequisites (user must complete before deploy)
- GitHub repository created and code pushed
- Domain DNS pointed to Coolify server (`api.voteriq.app`)
- All environment variables set in Coolify (see `docs/devops-setup.md`)
- `VOTESMART_API_KEY` added once obtained

### Launch sequence
1. Create GitHub repo, push code
2. Add GitHub secrets (`COOLIFY_WEBHOOK_URL`, `COOLIFY_WEBHOOK_TOKEN`, `EXPO_TOKEN`)
3. Configure Coolify resource pointing to `backend/docker-compose.yml`
4. Run database migrations via Coolify build command
5. Verify health endpoint
6. Configure Expo EAS project for production builds
7. Submit to TestFlight (iOS internal test) before App Store

### Mobile API URL for production
`mobile/.env` → `EXPO_PUBLIC_API_URL=https://api.voteriq.app`

---

## Non-Goals (v2)

- Push notifications (future v3)
- Candidate comparison across different races
- Ballot measure / referendum deep dives
- Historical voting records

---

## Data Confidence Tiers

| Tier | Label | Meaning |
|------|-------|---------|
| `high` | Official | From Congress.gov or official candidate site |
| `medium` | Sourced | From VoteSmart or Ballotpedia with citation |
| `low` | AI-inferred | Extracted by AI from bio text — clearly labeled |

Every position displayed in the app must show its tier and source.
