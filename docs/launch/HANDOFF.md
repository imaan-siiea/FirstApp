# VoterIQ — Launch Handoff

**Date:** 2026-06-04 · **Prepared by:** Claude (session) · **For:** Imran + cc-sn (DevOps)

This is the single starting point for getting VoterIQ live on **Google Play first, App Store next**.
It summarizes the current state and points to the detailed docs. Read this, then open
[`LAUNCH.md`](LAUNCH.md).

---

## TL;DR

The app is **technically build-ready** and verified locally. What remains is **infra deploy,
accounts, keys, and store paperwork** — not engineering. Critical blocker: the backend must be live
at `https://api.voteriq.app` before Google reviews the app (they run it during review).

---

## Current state (verified 2026-06-04)

- ✅ Backend: typechecks clean, all tests pass
- ✅ Mobile: typechecks clean, **production Android bundle exports successfully**
- ✅ `npm ci` now passes (was broken — see fixes below)
- ✅ Mobile launch config hardened (`app.config.js`); legal pages, Data Safety, and store copy drafted

## Engineering fixes landed this session

| Fix | Why it mattered |
|-----|-----------------|
| Pinned `react-dom@19.1.0` | Committed lockfile was out of sync; `npm ci` (CI/EAS) **failed** wanting `react-dom@19.2.7` vs `react@19.1.0`. EAS build would have failed. |
| 3 TypeScript errors fixed | `_layout.tsx` deprecated nav prop; `CompareTab.tsx` implicit `any`s. |
| `app.json` → `app.config.js` | Added `versionCode`, notifications plugin, **Google Maps Android key slot**, iOS encryption-exempt flags, blocked location permissions. |
| Removed `showsUserLocation` from polling map | App now uses **no device location** → clean privacy/Data-Safety story. |
| `.gitignore` += `*-service-account.json` | Prevents leaking the Play signing key. |

## New documents (all in repo)

| Doc | Purpose | Owner to action |
|-----|---------|-----------------|
| [`docs/launch/LAUNCH.md`](LAUNCH.md) | End-to-end Google-first runbook + dependency graph + status board | everyone |
| [`docs/launch/google-play-data-safety.md`](google-play-data-safety.md) | Exact Data Safety + content-rating answers | Imran (Play Console) |
| [`docs/launch/google-play-store-listing.md`](google-play-store-listing.md) | Title/short/full description + asset specs | Imran (Play Console) |
| [`legal/privacy-policy.html`](../../legal/privacy-policy.html) | Required privacy policy → `voteriq.app/privacy` | cc-sn (host) |
| [`legal/terms-of-service.html`](../../legal/terms-of-service.html) | Terms → `voteriq.app/terms` | cc-sn (host) |
| [`docs/devops-setup.md`](../devops-setup.md) | Backend deploy guide (updated for cc-sn handoff) | cc-sn |

---

## Immediate next actions

**cc-sn (DevOps):**
1. Deploy backend → `https://api.voteriq.app` ([`devops-setup.md`](../devops-setup.md)) — DNS, Coolify, 5 API keys, `db:push`, SSL, health check.
2. Host `legal/` pages on `voteriq.app/privacy` + `/terms` (devops doc §7b).
3. Create the Play service-account JSON → `mobile/google-service-account.json` (devops doc §7).
4. Create + restrict the Google Maps Android key; set as EAS env var (devops doc §2 note / LAUNCH §4).

**Imran:**
1. `eas login` + `eas init` in `mobile/`, then put the printed projectId in `app.config.js` (or ask Claude).
2. `eas build -p android --profile production` once backend + Maps key are ready.
3. Feature graphic (1024×500) + 2–8 phone screenshots (Claude can help generate the graphic).
4. Play Console: create app → paste listing + Data Safety → upload AAB → submit.

**Phase 2 (Apple):** start Apple Developer enrollment ($99/yr) early; fill iOS IDs in `eas.json`.

---

## Watch-items
- Backend **must** be live for Google review (non-functional apps are rejected).
- Maps key must be present + correctly restricted, or the Android map renders blank.
- Data Safety claims deletion-on-request; that's a manual email flow today — add a self-serve delete before scale (Claude can build).
- Confirm `imaan@siiea.ai` is a monitored inbox (contact used in legal pages + listing).
