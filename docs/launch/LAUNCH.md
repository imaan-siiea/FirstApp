# VoterIQ — Launch Runbook (Google Play first, App Store next)

**Owner key:** `[DONE]` already handled in code · `[CC-SN]` DevOps/infra (deploys on our servers) ·
`[IMRAN]` needs your account/decision · `[CLAUDE]` I can do on request

Last updated: 2026-06-04

---

## 0. Where we are right now

The app is **technically build-ready**. Verified locally on 2026-06-04:

- ✅ Backend typechecks clean, all tests pass (`backend`)
- ✅ Mobile typechecks clean; **production Android JS bundle exports successfully**
- ✅ Fixed a real CI blocker: lockfile was out of sync → `npm ci` (what EAS/CI runs) failed wanting
  `react-dom@19.2.7` vs pinned `react@19.1.0`. Pinned `react-dom@19.1.0`. `npm ci` now passes.
- ✅ Mobile launch config hardened: `app.config.js` with `versionCode`, blocked location permissions,
  notifications plugin, Google Maps key slot, iOS encryption-exempt flags.
- ✅ Removed unused `showsUserLocation` from the polling map → app uses **no device location**, which
  keeps the privacy/Data-Safety story clean.

**The gap between "builds locally" and "live on Google Play" is the checklist below.** None of it is
deep engineering; it's accounts, keys, infra deploy, assets, and store paperwork.

---

## 1. Critical path (what blocks what)

```
                 ┌────────────────────────────────────────────┐
   [CC-SN]       │ A. Deploy backend → https://api.voteriq.app │
                 └───────────────────────┬────────────────────┘
                                         │ app is non-functional without this
   [IMRAN]   B. Expo login + `eas init`  │   (Google rejects non-working apps)
       │                                 │
       ▼                                 ▼
   [IMRAN/CLAUDE] C. Google Maps Android key ──► D. EAS production build (AAB)
                                                          │
   [CLAUDE] E. Privacy policy live + store copy + Data Safety (drafts DONE)
                                                          │
                                                          ▼
                                          F. Create app in Play Console,
                                             fill listing + Data Safety,
                                             upload AAB → review → LAUNCH
```

**Hard blockers for review:** (A) live backend, (C) Maps key or map looks broken, (E) privacy URL.

---

## 2. Backend deploy  `[CC-SN]`

The mobile production build points at `https://api.voteriq.app`. That API must be live, healthy,
and reachable before store review. Full instructions already exist in
[`docs/devops-setup.md`](../devops-setup.md) (updated for the cc-sn handoff). Summary:

1. Point DNS: `api.voteriq.app` → Coolify server IP. (Also set up `voteriq.app` for the legal pages — see §5.)
2. In Coolify, deploy `backend/docker-compose.yml`; set env vars (see devops doc §3c / §8).
3. Obtain the API keys (all have free tiers): Google Civic, Groq, Mapbox, OpenStates, Ballotpedia.
4. Generate `JWT_SECRET` and `DB_PASSWORD` (`openssl rand`).
5. Run DB migration once: `npm run db:push`.
6. Enable Coolify Auto-SSL (Let's Encrypt) for `api.voteriq.app`.
7. Verify: `curl https://api.voteriq.app/health` → `{"status":"ok"}`.

**Acceptance:** health check green, and a ballot lookup returns real data:
```bash
curl -X POST https://api.voteriq.app/ballot -H 'Content-Type: application/json' \
  -d '{"address":"1600 Pennsylvania Ave NW, Washington DC 20500"}'
```

---

## 3. Link the app to EAS  `[IMRAN]` (5 minutes)

EAS isn't linked yet (no project id; not logged in). From `mobile/`:

```bash
eas login                 # your Expo account
eas init                  # creates the EAS project, prints a projectId
```

Then **hardcode the printed projectId** into `app.config.js` (`extra.eas.projectId`) so
non-interactive CI/EAS builds work, OR set `EAS_PROJECT_ID` as an EAS env var. (Right now it reads
`process.env.EAS_PROJECT_ID`.) `[CLAUDE]` can paste the id in once you have it.

---

## 4. Google Maps Android API key  `[IMRAN]` + `[CC-SN]`

The polling-place map renders via the native **Google Maps SDK on Android** — it needs a key or the
map is blank (and Play reviewers will see a broken screen).

1. Google Cloud Console → enable **Maps SDK for Android**.
2. Create an API key, **restrict it** to Android apps with:
   - package name `app.voteriq`
   - the signing SHA-1 from `eas credentials` (EAS-managed upload/app-signing key)
3. Provide it to the build as an EAS env var named `GOOGLE_MAPS_ANDROID_API_KEY` (project-level EAS
   environment variable / secret). `app.config.js` already reads it.

> If maps aren't worth blocking launch on, the alternative is to swap the polling map for the
> existing official-state-URL list + a static fallback. Flag me if you want that path instead.

---

## 5. Host the legal pages  `[CC-SN]` (content `[DONE]`)

Privacy policy is **legally required** by Google and references real data collection.
Files are ready in [`legal/`](../../legal/):

- `legal/privacy-policy.html` → publish at **`https://voteriq.app/privacy`**
- `legal/terms-of-service.html` → publish at **`https://voteriq.app/terms`**

Any static host works (Coolify static site, Caddy/Nginx on the same box, Netlify, etc.). The links
inside reference `/privacy` and `/terms`, so keep those paths. **Confirm the URL is live before
submitting** — Play validates it.

Also: make sure `imaan@siiea.ai` is a real monitored inbox — it's the contact used in the legal
files and the store listing.

---

## 6. Build the production AAB  `[IMRAN]` runs / `[DONE]` config

Once §2–§4 are set:

```bash
cd mobile
eas build --platform android --profile production
```

This produces an **`.aab`** (Android App Bundle) signed with EAS-managed keys. `eas.json` already
has the production profile pointing `EXPO_PUBLIC_API_URL=https://api.voteriq.app`. First build will
prompt to generate the Android keystore — let EAS manage it.

---

## 7. Store assets  `[IMRAN]` / `[CLAUDE]` can help

From [`docs/launch/google-play-store-listing.md`](google-play-store-listing.md):

- ✅ App icon — branded VoterIQ mark generated (`mobile/assets/icon.png` @1024, `store-assets/google/play-store-icon-512.png` @512); in-app adaptive/splash/favicon regenerated too
- ✅ **Feature graphic 1024×500** — `store-assets/google/feature-graphic-1024x500.png` (editable SVG sources in `store-assets/source/`)
- ✅ **Phone screenshots (5)** — designed framed mockups in `store-assets/google/phone-screenshots/`
  (home, ballot, candidate, AI chat, register; faithful to the real screens, neutral sample data).
  Optionally swap in real device captures once the backend is live. Tablet shots skipped (optional).

---

## 8. Create the app + submit in Play Console  `[IMRAN]`

Account is **verified** ✅, so we can go straight to a listing.

1. Play Console → **Create app** (name: VoterIQ, type: App, Free, default lang en-US).
2. **Main store listing** → paste copy from `google-play-store-listing.md` + upload assets.
3. **App content** → complete:
   - **Privacy policy** URL: `https://voteriq.app/privacy`
   - **Data safety** → enter answers from `google-play-data-safety.md`
   - **Content rating** questionnaire → expect Everyone/PEGI 3
   - **Target audience** → 18+ (or 13+); not child-directed
   - **Government apps / elections** declaration if prompted (see §10 risk note)
   - News app declaration: if you pick the News category, complete the news-app form
   - Ads: **No ads**
4. Upload the AAB. Recommended first path: **Internal testing** track → smoke-test the live build →
   then promote to **Production**. (`eas.json` is set to the `production` track; you can change to
   `internal` for the first upload, or upload manually.)
5. Submit for review.

**Submit via EAS (alternative to manual upload):**
```bash
eas submit --platform android --profile production
# requires mobile/google-service-account.json (Play Console → API access → service account)
```
`[CC-SN]` should create the Play service-account JSON and drop it at
`mobile/google-service-account.json` (it's gitignored).

---

## 9. After Google: Apple App Store  `[LATER]`

The app is already configured for iOS (`bundleIdentifier app.voteriq`, encryption-exempt flags
set). When ready:

1. `[IMRAN]` Apple Developer Program enrollment ($99/yr) — **start early, enrollment can take days**.
2. Fill `eas.json` → `submit.production.ios`: `ascAppId` (App Store Connect app id) and
   `appleTeamId` (currently `FILL_IN_*` placeholders).
3. `eas build --platform ios --profile production` → `eas submit --platform ios`.
4. App Store has its own privacy "nutrition labels" — reuse the Data Safety mapping; the same data
   types apply.
5. Note: the polling map uses Apple Maps on iOS (no Google key needed there).

---

## 10. Risks & watch-items

- **Election/government content scrutiny.** Google reviews civic/election apps carefully. Our
  defenses: explicit nonpartisan framing, no claim of government affiliation, source attribution,
  and a clear "informational, verify with your election office" disclaimer (now in Terms). If Google
  asks for an elections/government declaration or eligibility info, answer honestly as a nonpartisan
  informational tool.
- **Functional-on-review.** Reviewers will run the app. The backend **must** be live and a sane test
  address must return data, or it gets rejected as non-functional.
- **Maps blank on Android** if the Maps key is missing/misrestricted → looks broken to reviewers.
- **Data deletion.** Data Safety claims users can request deletion. Today that's a manual email flow.
  Before any real scale, add a self-serve delete (in-app button or `DELETE /account` endpoint).
  `[CLAUDE]` can build this.
- **Closed-testing rule.** Verified accounts usually skip the 20-tester/14-day requirement that hits
  brand-new *personal* accounts — but if Console shows that gate, budget ~2 weeks of closed testing.

---

## 11. Quick status board

| Item | Owner | Status |
|------|-------|--------|
| Code build-readiness (typecheck, bundle, `npm ci`) | — | `[DONE]` ✅ |
| Mobile launch config (`app.config.js`, permissions, versionCode) | — | `[DONE]` ✅ |
| Privacy policy + Terms (content) | CLAUDE | `[DONE]` ✅ |
| Data Safety answers + content rating | CLAUDE | `[DONE]` ✅ (entry pending account) |
| Store listing copy | CLAUDE | `[DONE]` ✅ |
| App icon + feature graphic (brand assets) | CLAUDE | `[DONE]` ✅ |
| Backend deployed @ api.voteriq.app | CC-SN | ⬜ |
| Legal pages hosted @ voteriq.app | CC-SN | ⬜ |
| Expo login + `eas init` (projectId) | IMRAN | ⬜ |
| Google Maps Android key | IMRAN/CC-SN | ⬜ |
| Phone screenshots (2–8) | IMRAN | ⬜ |
| EAS production AAB build | IMRAN | ⬜ |
| Play Console: listing + Data Safety + upload | IMRAN | ⬜ |
| Apple enrollment ($99) — start early | IMRAN | ⬜ (Phase 2) |
