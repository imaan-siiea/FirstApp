# VoterIQ — Civic Companion App

## Project Overview

A personalized civic companion app that shows voters their exact ballot, provides AI-powered candidate information (local/state/national), guides voter registration, and points to nearest registration sites.

**Core differentiator:** Claude API conversational layer over aggregated civic data. Not a database — a ballot guide you can talk to.

## Infrastructure

- **Hosting:** Self-hosted Coolify on Proxmox
- **Team:** Complete DevOps team in place
- **Deployment:** Containerized, Coolify-managed

## Recommended Tech Stack (pending design approval)

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes + tRPC |
| Database | PostgreSQL |
| Cache | Redis |
| AI Layer | Claude API (claude-sonnet-4-6) |
| Maps/Geo | Mapbox GL JS |
| Auth | NextAuth.js (optional) |
| Deploy | Coolify on Proxmox |

## Key Design Principles

1. **Ballot-first UX:** Show the user their exact ballot before anything else — then registration
2. **Local races are the hard problem:** Federal data is easy; city council/school board data is fragmented and needs special handling
3. **Conversational over directory:** Users ask questions; AI synthesizes answers from sourced data
4. **Trust signals matter:** Every data point needs source attribution and freshness timestamp
5. **SMS as first-class feature:** Reach low-app users via SMS pathway

## Data Sources (planned)

- Google Civic Information API (federal + state elections)
- OpenStates API (state legislative data)
- Ballotpedia (candidate encyclopedia)
- VoteSmart (candidate positions)
- AI web crawler for local races (where APIs don't exist)

## SIIEA Analysis Summary (2026-03-28)

- Observer identified: local data gap, partisan perception risk, maintenance burden
- Minds convergence: ballot-first → registration-second reverses standard flow
- Counterfactual insights: SMS pathway, post-election accountability tracker, civic org white-label
- Frontier play: Claude API as the persistent differentiator as model improves

## Working Agreements

- Run ideas through SIIEA skill chain (observer → minds → brainstorming) before implementation
- Use subagent-driven-development for parallel implementation tasks
- All candidate data must include: source, freshness date, confidence tier
- Maintain strict editorial neutrality policy
