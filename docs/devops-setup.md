# VoterIQ — DevOps Setup Guide

**Project:** VoterIQ — Civic Information Mobile App
**Backend:** Fastify + TypeScript API
**Database:** PostgreSQL 16
**Cache:** Redis 7
**Deployment:** Coolify (self-hosted on Proxmox)
**Mobile:** Expo + React Native (deployed via EAS Build → App Store / Google Play)
**DevOps owner:** **cc-sn** — runs DevOps and deploys on our servers. Items tagged **[CC-SN]** below are yours.

> **Launch context:** This doc covers standing up the **backend + supporting infra**. The end-to-end
> store-launch plan (Google Play first, App Store next) lives in
> [`docs/launch/LAUNCH.md`](launch/LAUNCH.md). The backend deploy here is the critical-path
> dependency for store review — the mobile app is non-functional until `https://api.voteriq.app` is
> live, and Google rejects non-working apps.

---

## Overview

This document is everything cc-sn needs to get VoterIQ running in production. Read the whole thing before starting — the order matters.

```
GitHub Repo → GitHub Actions CI → Coolify Webhook → Docker Compose → Live API
                                                   ↓
                                         PostgreSQL 16 + Redis 7
```

---

## 1. Prerequisites

### On the Proxmox / Coolify Server

Install these before anything else:

```bash
# Docker Engine (not Docker Desktop)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose plugin (v2)
sudo apt-get install docker-compose-plugin

# Verify
docker --version          # Docker 24.x or higher
docker compose version    # Docker Compose version v2.x
```

### Domain Setup

Point your DNS before deploying (SSL cert generation depends on it):

| Record | Type | Value |
|--------|------|-------|
| `api.voteriq.app` | A | Your Coolify server public IP |
| `voteriq.app` | A | Your Coolify server public IP (if serving a web view) |

---

## 2. Required API Keys

You must obtain ALL of these before the backend will work. None are optional for production.

| Service | Key Name | Where to Get It | Free Tier |
|---------|----------|-----------------|-----------|
| Google Civic Information API | `GOOGLE_CIVIC_API_KEY` | [console.cloud.google.com](https://console.cloud.google.com) → Enable "Google Civic Information API" | 2,500 req/day free |
| Groq (AI chat) | `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) | Free (generous limits) |
| Mapbox (geocoding) | `MAPBOX_ACCESS_TOKEN` | [account.mapbox.com](https://account.mapbox.com) → Access Tokens | 50,000 req/month free |
| Google Maps Android SDK | `GOOGLE_MAPS_ANDROID_API_KEY` | [console.cloud.google.com](https://console.cloud.google.com) → enable "Maps SDK for Android" | Free (with quota) |
| OpenStates (state legislators) | `OPENSTATES_API_KEY` | [openstates.org/accounts/profile](https://openstates.org/accounts/profile) | Free with registration |
| Ballotpedia | `BALLOTPEDIA_API_KEY` | Email api@ballotpedia.org — request research/civic use | Free for civic apps |
| Expo (app builds) | `EXPO_TOKEN` | [expo.dev](https://expo.dev) → Account → Access Tokens | Free |
| Apple Developer | — | [developer.apple.com](https://developer.apple.com) | $99/year |
| Google Play | — | [play.google.com/console](https://play.google.com/console) | $25 one-time |

**Note on Ballotpedia:** Email them explaining VoterIQ is a nonpartisan civic app. They typically grant free API access for civic/educational use within a few days.

**Note on the Google Maps key:** Unlike the others, `GOOGLE_MAPS_ANDROID_API_KEY` is a **mobile build-time** key, not a backend env var. It is injected by EAS at build time (see `mobile/app.config.js`) — set it as a project-level EAS environment variable, and **restrict the key** in Google Cloud to package `app.voteriq` + the EAS signing SHA-1. It does **not** go in Coolify. See [`docs/launch/LAUNCH.md`](launch/LAUNCH.md) §4.

---

## 3. Coolify Setup

### 3a. Install Coolify

If not already installed on your Proxmox VM:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Access the Coolify dashboard at `http://<your-server-ip>:8000`.

### 3b. Create a New Project

1. In Coolify: **Projects → New Project → "voteriq"**
2. Add a **new resource → Docker Compose**
3. Point it to your GitHub repository (see Section 5 for GitHub setup)
4. Set the **compose file path** to: `backend/docker-compose.yml`

### 3c. Configure Environment Variables in Coolify

In your Coolify resource settings → **Environment Variables**, add each of the following:

```env
NODE_ENV=production
PORT=3000

# Database
DB_PASSWORD=<generate a strong random password — e.g. openssl rand -hex 32>

# Security
JWT_SECRET=<generate: openssl rand -hex 64>
CORS_ORIGIN=https://api.voteriq.app

# API Keys
GOOGLE_CIVIC_API_KEY=<your key>
GROQ_API_KEY=<your key>
MAPBOX_ACCESS_TOKEN=<your key>
OPENSTATES_API_KEY=<your key>
BALLOTPEDIA_API_KEY=<your key>
```

**Generate secure secrets on your server:**
```bash
# JWT_SECRET
openssl rand -hex 64

# DB_PASSWORD
openssl rand -hex 32
```

### 3d. SSL / HTTPS

Coolify handles Let's Encrypt certificates automatically when your DNS is pointed correctly.

1. In Coolify resource settings → **Domains**: set `https://api.voteriq.app`
2. Enable **"Auto SSL"** (Let's Encrypt)
3. Coolify will provision the cert on first deploy

---

## 4. Database Migration

The database schema must be applied before the API will work. Migrations are run manually once on first deploy, then automatically on each deploy via the Coolify build command.

### First-time setup:

```bash
# SSH into your server
ssh user@your-server

# Navigate to backend
cd /path/to/voteriq/backend

# Copy env file
cp .env.example .env
# Edit .env and fill in your values
nano .env

# Start just the database (not the API yet)
docker compose -f docker-compose.dev.yml up -d db

# Install deps and run migrations
npm install
npm run db:push

# Verify tables were created
docker exec -it <postgres-container-id> psql -U voteriq -d voteriq -c "\dt"
```

You should see these tables (per `backend/src/db/schema.ts`):
- `users`
- `user_ballots`
- `candidates`
- `races`
- `state_registration`
- `election_reminders`
- `refresh_tokens`
- `follows`
- `push_tokens`

### Ongoing migrations (after schema changes):

```bash
# Generate a new migration file
npm run db:generate

# Apply it
npm run db:migrate
```

---

## 5. GitHub Repository Setup

### 5a. Create the Repository

```bash
# On the developer's machine (inside the FirstApp directory):
git remote add origin https://github.com/<your-org>/voteriq.git
git branch -M main
git push -u origin main
```

### 5b. Add GitHub Secrets

Go to **GitHub → Repository → Settings → Secrets and variables → Actions** and add:

| Secret Name | Value |
|-------------|-------|
| `COOLIFY_WEBHOOK_URL` | From Coolify: your resource → Deployments → Webhook URL |
| `COOLIFY_TOKEN` | From Coolify: same webhook settings page (must match `deploy-backend.yml`) |
| `EXPO_TOKEN` | Your Expo access token (for mobile builds) |

> **Secret-name check:** `.github/workflows/deploy-backend.yml` reads `secrets.COOLIFY_TOKEN` (not `COOLIFY_WEBHOOK_TOKEN`). Use exactly `COOLIFY_TOKEN` or the deploy step will send an empty auth header.

### 5c. GitHub Actions Workflows

Two workflows are already configured in `.github/workflows/`:

- **`deploy-backend.yml`** — triggers on push to `main` (changes in `backend/`) → calls Coolify webhook
- **`eas-build.yml`** — triggers on push to `main` (changes in `mobile/`) → builds iOS + Android via EAS

No changes needed. Just add the secrets above and push to `main`.

---

## 6. Coolify Deployment Trigger

Once GitHub secrets are set:

```bash
git add -A
git commit -m "chore: initial production deployment"
git push origin main
```

GitHub Actions will:
1. Detect changes in `backend/`
2. Ping the Coolify webhook
3. Coolify will pull the latest code and run `docker compose up --build`

Watch the deployment in **Coolify → Deployments** tab.

---

## 7. Mobile App Deployment (EAS Build)

### First time only:

```bash
cd mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project (creates eas.json if missing)
eas build:configure
```

### Build and submit to stores:

```bash
# Build for both platforms
eas build --platform all --profile production

# Submit to App Store (requires Apple Developer account)
eas submit --platform ios

# Submit to Google Play (requires Play Console account)
eas submit --platform android
```

EAS Build is also triggered automatically by GitHub Actions on every push to `main` (preview builds for internal testing).

### Required for store submission:
- **iOS:** Apple Developer Program membership ($99/year), App ID, provisioning profiles — EAS handles this automatically with `eas credentials`
- **Android:** Google Play Console account ($25 one-time), upload key — EAS handles this automatically

### Play submission service account `[CC-SN]`

To let `eas submit --platform android` upload builds, create a Google Play service account and drop
its JSON key at `mobile/google-service-account.json` (gitignored; referenced by `mobile/eas.json`):

1. Play Console → **Setup → API access** → create/link a Google Cloud service account.
2. Grant it the **Release** permission for the VoterIQ app.
3. Download the JSON key → save as `mobile/google-service-account.json` (never commit it).

---

## 7b. Hosting the legal pages (voteriq.app) `[CC-SN]`

Google **requires** a public privacy-policy URL, and the app links to Terms. The pages are written
and ready in the repo at [`legal/`](../legal/):

| File | Publish at | Required by |
|------|-----------|-------------|
| `legal/privacy-policy.html` | `https://voteriq.app/privacy` | Google Play (hard requirement) + App Store |
| `legal/terms-of-service.html` | `https://voteriq.app/terms` | Store best practice; linked from privacy page |

Any static host works (Coolify static resource, Nginx/Caddy on the same box, or a static CDN). Keep
the exact paths `/privacy` and `/terms` — they are referenced inside the pages and in the store
listing. **Point `voteriq.app` DNS to the host and confirm both URLs load over HTTPS before store
submission** (Play validates the privacy URL during review).

Also ensure the contact aliases used in the pages — `imaan@siiea.ai` and `imaan@siiea.ai` — are
real, monitored inboxes (or update the files first).

---

## 8. Environment File Reference

Full reference for `backend/.env` (production):

```env
# Server
NODE_ENV=production
PORT=3000

# Database (Docker internal hostname is "db")
DATABASE_URL=postgresql://voteriq:<DB_PASSWORD>@db:5432/voteriq

# Cache (Docker internal hostname is "redis")
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=<64-char hex string — generated with openssl rand -hex 64>
CORS_ORIGIN=https://api.voteriq.app

# Google Civic Information API
GOOGLE_CIVIC_API_KEY=<your key>

# AI (Groq — free tier, model: llama-3.3-70b-versatile)
GROQ_API_KEY=<your key>

# Maps
MAPBOX_ACCESS_TOKEN=<your key>

# State legislators
OPENSTATES_API_KEY=<your key>

# Candidate bios
BALLOTPEDIA_API_KEY=<your key>
```

Mobile `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://api.voteriq.app
```

---

## 9. Health Check & Verification

After deployment, verify everything is running:

```bash
# API health
curl https://api.voteriq.app/health
# Expected: {"status":"ok"}

# Test ballot lookup (requires Google Civic API key to be set)
curl -X POST https://api.voteriq.app/ballot \
  -H "Content-Type: application/json" \
  -d '{"address": "1600 Pennsylvania Ave NW, Washington DC 20500"}'

# Test registration info
curl https://api.voteriq.app/registration/CA
```

---

## 10. Monitoring & Logs

### View API logs in Coolify:
Coolify → Your Resource → **Logs** tab (real-time streaming)

### View logs via Docker:
```bash
# On server
docker compose logs -f api        # API logs
docker compose logs -f db         # Postgres logs
docker compose logs -f redis      # Redis logs
```

### Common issues:

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| API returns 503 on ballot endpoint | `GOOGLE_CIVIC_API_KEY` missing or wrong | Check env vars in Coolify |
| API returns 503 on AI chat | `GROQ_API_KEY` missing | Check env vars in Coolify |
| API crashes on startup | `JWT_SECRET` not set in production | Add to Coolify env vars |
| DB connection refused | Migrations not run | Run `npm run db:push` |
| CORS errors from mobile | `CORS_ORIGIN` not set | Add your domain to env vars |

---

## 11. Coolify Auto-Deploy Configuration

In Coolify → Your Resource → **Settings**:

- **Build Command:** `cd backend && npm ci && npm run build && npm run db:migrate`
- **Start Command:** (handled by Docker Compose)
- **Watch Paths:** `backend/**`
- **Auto Deploy:** Enabled (triggered by webhook)

---

## Summary Checklist

Before going live, confirm:

- [ ] Docker + Docker Compose installed on server
- [ ] DNS A records pointing to server IP (`api.voteriq.app` **and** `voteriq.app`)
- [ ] Coolify installed and accessible
- [ ] All 5 backend API keys obtained and added to Coolify env vars (Google Civic, Groq, Mapbox, OpenStates, Ballotpedia)
- [ ] `JWT_SECRET` and `DB_PASSWORD` generated (strong, random)
- [ ] Database migrations run (`npm run db:push`) → 9 tables present
- [ ] GitHub repository created and secrets added (note: `COOLIFY_TOKEN`, not `COOLIFY_WEBHOOK_TOKEN`)
- [ ] GitHub Actions workflows verified (push to main triggers deploy)
- [ ] SSL certificate provisioned by Coolify (api + root domain)
- [ ] Health check returns `{"status":"ok"}` and ballot lookup returns real data
- [ ] **Legal pages live** at `voteriq.app/privacy` and `voteriq.app/terms` (§7b)
- [ ] **Google Maps Android key** created, restricted, set as EAS env var (§2 note)
- [ ] **Play service-account JSON** at `mobile/google-service-account.json` (§7)
- [ ] Expo project configured for EAS Build (`eas init` → projectId in `app.config.js`)
- [ ] Apple Developer / Google Play accounts ready for store submission

> Full store-launch sequence and ownership: [`docs/launch/LAUNCH.md`](launch/LAUNCH.md).
