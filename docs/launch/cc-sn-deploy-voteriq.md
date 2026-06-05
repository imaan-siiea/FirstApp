# VoterIQ — cc-sn deployment runbook (our infra)

**Target:** Coolify on **VM 103 (coolify-siiea)** · **Domain:** voteriq.app (Cloudflare) · **Owner:** cc-sn
**Date:** 2026-06-05 · Adapts `docs/devops-setup.md` to the SIIEA cluster's actual networking.

> **Key infra difference from the generic devops doc:** our cluster is **not** publicly exposed. We do
> NOT point `A` records at a server IP or use Coolify Auto-SSL/Let's Encrypt. Instead, like every other
> SIIEA app (app.cstorecomply.com, coolify-siiea.siiea.ai, the vaults), we publish via a **Cloudflare
> Tunnel** — TLS terminates at the Cloudflare edge, the tunnel forwards to the Coolify service. So
> "DNS → server IP + Auto-SSL" in the generic doc becomes "CF Tunnel hostname → Coolify app."

## Decisions (Imran, 2026-06-05)

- Domain **voteriq.app** (matches repo — zero config changes).
- Host on **coolify-siiea VM 103**.
- API keys: cc-sn registers the self-serve ones (Groq, Mapbox, OpenStates); **Imran** supplies the two
  account-bound ones (Google Civic = his Google Cloud project; Ballotpedia = email-approved). cc-sn
  stores all in Vault + injects into Coolify.
- Contact email **imaan@siiea.ai** everywhere (done in repo: legal/ + docs/, 15 refs). ⚠ see mailbox dep below.

## ⚠ Hard dependency: imaan@siiea.ai must be a LIVE inbox

siiea.ai mail was deferred (only faspro.ai mail is live). `imaan@siiea.ai` is now (a) the public
privacy/support contact AND (b) the address that will receive **API-key signup verification emails**
(Groq/Mapbox/OpenStates) and store correspondence. So it must actually receive mail before we register
keys or submit to stores. Options: provision `imaan@siiea.ai` on Stalwart (CT 722) or forward it to a
working Gmail. **This gates the API-key registration step.**

## Secrets — Vault paths (cc-sn owns)

`secret/voteriq/db` (DB_PASSWORD) · `secret/voteriq/jwt` (JWT_SECRET) ·
`secret/voteriq/api` (GOOGLE_CIVIC_API_KEY, GROQ_API_KEY, MAPBOX_ACCESS_TOKEN, OPENSTATES_API_KEY, BALLOTPEDIA_API_KEY) ·
`secret/voteriq/maps-android` (GOOGLE_MAPS_ANDROID_API_KEY — for EAS, not Coolify) ·
`secret/voteriq/play-service-account` (JSON for `eas submit`).
Generate: `JWT_SECRET=openssl rand -hex 64`, `DB_PASSWORD=openssl rand -hex 32`. Coolify env writes go
through the value-stripping filter (per the env-echo-leak postmortem).

## Execution order

1. **CF DNS/Tunnel** (pull CF token from Vault `secret/providers/cloudflare/*`): confirm `voteriq.app`
   zone is in our account; add tunnel ingress hostnames `api.voteriq.app` → Coolify API service:3000,
   and `voteriq.app` → the static legal site. Proxied (orange-cloud); CF edge TLS.
2. **Coolify project `voteriq` on VM 103** → Docker Compose resource from `imaan-siiea/FirstApp`
   (private-deploy-key), compose path `backend/docker-compose.yml`. Set `custom_network_aliases` if any
   L1↔L2 wiring later (none now).
3. **Env vars** in Coolify (from Vault): NODE_ENV=production, PORT=3000, DB_PASSWORD, JWT_SECRET,
   CORS_ORIGIN=https://api.voteriq.app, + the 5 API keys. (Deploy can go green on /health before the
   data-endpoint keys are in; data endpoints 503 until keys present.)
4. **Deploy** → first build runs `npm ci && build`; then **`db:push`** once (9 tables) via Coolify
   exec or a one-off. Verify `https://api.voteriq.app/health` → `{"status":"ok"}`, then a real ballot
   lookup once GOOGLE_CIVIC_API_KEY is set.
5. **Legal static site** for `voteriq.app`: serve `legal/privacy-policy.html` at **/privacy** and
   `legal/terms-of-service.html` at **/terms** (rename to `privacy/index.html` + `terms/index.html`, or
   a caddy/nginx rewrite). Coolify static resource or a tiny caddy container. Confirm both load over
   HTTPS before store submission (Play validates the privacy URL).
6. **GitHub CI secrets** on `imaan-siiea/FirstApp` → Settings → Actions: `COOLIFY_WEBHOOK_URL` +
   `COOLIFY_TOKEN` (exact names per `deploy-backend.yml`), `EXPO_TOKEN`. Push to `main` (backend/\*\*) then
   auto-deploys.
7. **Wazuh agent** on the VoterIQ app/CT for observability (our standard).

## cc-sn store-side prep (not Coolify)

- **Google Maps Android key:** create in Imran's Google Cloud, restrict to package `ai.siiea.voteriq` +
  the EAS signing SHA-1 (`eas credentials`), set as EAS env `GOOGLE_MAPS_ANDROID_API_KEY`. → Vault.
- **Play service-account JSON** → `mobile/google-service-account.json` (gitignored) for `eas submit`.

## Imran-owned (from LAUNCH.md)

`eas login` + `eas init` → projectId into `app.config.js`; EAS production AAB build; Play Console listing

- Data Safety + AAB upload; feature graphic (1024×500) + 2–8 screenshots; later Apple enrollment ($99).

## Open items before "go"

- [ ] imaan@siiea.ai live inbox (gates key registration + store contact).
- [ ] Imran: Google Civic key (his GCP) + Ballotpedia approval email.
- [ ] Confirm voteriq.app zone is in the SIIEA Cloudflare account.
- [ ] Decide: push the email-edit + this runbook to `imaan-siiea/FirstApp` (his repo) or keep local until reviewed.
