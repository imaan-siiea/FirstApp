# VoterIQ — DevOps Deployment Tasks (2026-06-23)

**Purpose:** Single, current task list for the DevOps (cc-sn) team to get VoterIQ live.
Supersedes the state in [`DEPLOY-STATE-2026-06-06.md`](DEPLOY-STATE-2026-06-06.md) where they conflict.
For the full end-to-end picture see [`LAUNCH.md`](LAUNCH.md); backend specifics in
[`../devops-setup.md`](../devops-setup.md).

**Owner key:** `[CC-SN]` DevOps/infra · `[IMRAN]` account/decision · `[TEAMMATE]` Play Console publisher · `[DONE]` complete

---

## 0. TL;DR — what's left

The **mobile app is built and ready**. The remaining work is **infrastructure**, and it is the
critical path to launch. The single hard blocker is: **the backend is not deployed**, so the app is
non-functional and Google would reject it. Everything DevOps owns is below.

```
[CC-SN] Deploy backend → https://api.voteriq.app   ←★ THE blocker (app dead without it)
[CC-SN] DNS + CF Tunnel for voteriq.app / api.voteriq.app
[CC-SN] Host legal pages → voteriq.app/privacy + /terms   ←★ Google requires the privacy URL
[CC-SN] GitHub Actions secrets (auto-deploy)
[CC-SN] Play service-account JSON (for `eas submit`)
[CC-SN] Wazuh agent on the app container
```

---

## 1. What changed this session (so you're current)

- ✅ **EAS project linked** — `@imaan12345s-team/voteriq`, projectId `d0bacb3a-7935-4939-a575-3d50acf74a93`, hardcoded in `mobile/app.config.js`.
- ✅ **Production Android `.aab` built** — [build 39dd8445](https://expo.dev/accounts/imaan12345s-team/projects/voteriq/builds/39dd8445-26fd-464f-a0ef-e488a5f8834b), v1.0.0 / versionCode 1, EAS-managed signing keystore.
- ✅ **Google Maps removed from the app.** The polling-place screen now uses the official per-state
  finder links + Vote.org fallback (free). **Consequences for DevOps:**
  - **No `GOOGLE_MAPS_ANDROID_API_KEY` needed** anywhere. The old LAUNCH §4 / Maps-key task is **dropped**. No Google Cloud / billing required.
  - The mobile app **no longer calls** the backend `/polling-places` endpoint. The route can stay (harmless) or be removed later — not a blocker. (`api.getPollingPlaces` in `mobile/lib/api.ts` is now unused.)
- ✅ `eas.json` set to `appVersionSource: local`; `autoIncrement` removed (incompatible with dynamic config).

---

## 2. Deploy the backend  `[CC-SN]`  ★ critical path

The production app points at `https://api.voteriq.app` (baked into the build via `eas.json`
`EXPO_PUBLIC_API_URL`). It must be live, healthy, and reachable before store review.

**Stack:** `backend/docker-compose.yml` + `backend/Dockerfile` (Node/Fastify + Postgres + Redis).

**Required environment variables** (verified against `backend/src` `process.env` usage):

| Var | Notes |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | Postgres connection string (compose builds from `DB_PASSWORD`) |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | `openssl rand -hex 32` — in Vault `secret/voteriq/jwt` |
| `CORS_ORIGIN` | `https://api.voteriq.app` |
| `GOOGLE_CIVIC_API_KEY` | Vault `secret/voteriq/api` (live-validated) |
| `OPENSTATES_API_KEY` | Vault `secret/voteriq/api` (live-validated) |
| `GROQ_API_KEY` | Vault `secret/voteriq/api` (`gsk_…`; backend uses groq-sdk) |

> Mapbox / Ballotpedia are **not** required (geocoding uses free Nominatim; Ballotpedia is
> enrichment-only and degrades gracefully if absent).

**Steps:**
1. Coolify project `voteriq` on the Coolify host (VM 103 = 10.10.30.103 per prior state) → Docker Compose resource from this repo (private deploy key), compose path `backend/docker-compose.yml`.
2. Set the env vars above (pull from Vault).
3. Deploy → `npm ci && build`, then run the DB migration **once**: `npm run db:push` (creates the tables).
4. Enable Auto-SSL for `api.voteriq.app`.

**Acceptance:**
```bash
curl https://api.voteriq.app/health          # → {"status":"ok"}
curl -X POST https://api.voteriq.app/ballot -H 'Content-Type: application/json' \
  -d '{"address":"1600 Pennsylvania Ave NW, Washington DC 20500"}'   # → real ballot data
```

---

## 3. DNS + Cloudflare Tunnel  `[CC-SN]`

`voteriq.app` is in our Cloudflare account (zone active). As of 2026-06-23 it **does not resolve**
publicly yet (`api.voteriq.app` and `voteriq.app` both return no DNS answer). Wire up:

1. CF Tunnel ingress: `api.voteriq.app` → Coolify backend service `:3000`; `voteriq.app` → legal static site.
2. DNS CNAMEs (proxied) via the CF API (`secret/providers/cloudflare/siiea_complete`).

**Acceptance:** both hostnames resolve and serve over HTTPS.

---

## 4. Host the legal pages  `[CC-SN]`  ★ required for Google

Google **will not approve** the app without a working privacy-policy URL. Content is ready in
[`../../legal/`](../../legal/):

- `legal/privacy-policy.html` → **`https://voteriq.app/privacy`**
- `legal/terms-of-service.html` → **`https://voteriq.app/terms`**

Any static host (Coolify static site / Caddy / Nginx). Keep the exact `/privacy` and `/terms` paths.

**Acceptance:** both URLs load over HTTPS. Also confirm `imaan@siiea.ai` is a **monitored inbox** (it's the public privacy/contact address).

---

## 5. GitHub Actions secrets  `[CC-SN]`

`.github/workflows/deploy-backend.yml` references these repo secrets — set them in
GitHub → Settings → Secrets and variables → Actions:

- `COOLIFY_WEBHOOK_URL`
- `COOLIFY_TOKEN`
- `EXPO_TOKEN` (for CI EAS builds)

---

## 6. Play service-account JSON  `[CC-SN]` (enables `eas submit`)

For automated store submission, create a Play Console service account → download the JSON →
drop it at `mobile/google-service-account.json` (gitignored). Then `eas submit -p android --profile production` works. Optional if the teammate uploads the `.aab` manually.

---

## 7. Security  `[CC-SN]`

- Wazuh agent on the app container.
- Confirm no secrets in env logs; Vault is the source of truth.

---

## 8. Not DevOps — tracked here for completeness

- `[TEAMMATE]` Play Console: create app, paste listing ([`google-play-store-listing.md`](google-play-store-listing.md)) + Data Safety ([`google-play-data-safety.md`](google-play-data-safety.md)), upload the `.aab`, submit. Account is verified.
- `[IMRAN]` / `[CLAUDE]` `.aab` is built — rebuild on request (e.g. after version bumps). One command, ~15 min.
- `[LATER]` Apple: enrollment ($99/yr), fill iOS IDs in `eas.json`, build/submit. iOS uses Apple Maps (the removed Google dep never applied there).

---

## 9. Status board

| Item | Owner | Status |
|------|-------|--------|
| Mobile code build-ready (typecheck, tests, bundle) | — | `[DONE]` ✅ |
| EAS linked + production `.aab` built | IMRAN/CLAUDE | `[DONE]` ✅ |
| Google Maps removed (no key/billing needed) | CLAUDE | `[DONE]` ✅ |
| Privacy/Terms + Data Safety + listing (content) | CLAUDE | `[DONE]` ✅ |
| **Backend deployed @ api.voteriq.app** | CC-SN | ⬜ ★ |
| **DNS + CF Tunnel (voteriq.app resolves)** | CC-SN | ⬜ ★ |
| **Legal pages hosted @ voteriq.app/privacy + /terms** | CC-SN | ⬜ ★ |
| GitHub Actions secrets | CC-SN | ⬜ |
| Play service-account JSON | CC-SN | ⬜ |
| Wazuh agent | CC-SN | ⬜ |
| Play Console submission | TEAMMATE | ⬜ |
