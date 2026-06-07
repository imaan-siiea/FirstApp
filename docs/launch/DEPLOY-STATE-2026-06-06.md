# VoterIQ deploy state — gates closed, ready for Coolify build (2026-06-06, cc-sn)

All blocking gates verified GREEN. Backend deploy is unblocked; remaining work is the
Coolify build + CF Tunnel + verify (cc-sn-owned) then the Play submission (Imran-owned).

## Confirmed facts (don't re-verify)
- Repo: `github.com/imaan-siiea/FirstApp`, `main`, pushed + in sync.
- Coolify host: **VM 103 coolify-siiea-ai = 10.10.30.103** (pve2, VLAN 30).
- Vault: up/unsealed. AppRole login works (role-id + stored secret-id on KINGSTON `/secrets/vault-admin-*`).
- **Keys LIVE-validated + stored** in `secret/voteriq/api`: GOOGLE_CIVIC_API_KEY (HTTP200/5 elections),
  OPENSTATES_API_KEY (HTTP200), GROQ_API_KEY (HTTP200/16 models). `secret/voteriq/db` + `/jwt` already exist.
  - NOTE the "grok" key is a **Groq** key (`gsk_`) — correct, backend uses groq-sdk.
- `voteriq.app` is in **our** Cloudflare account (siiea_complete token, zone **active**). NS maya/houston.
- CF token: `secret/providers/cloudflare/siiea_complete` (field `token`). Coolify token: `secret/providers/coolify/api_token`.
- Mapbox NOT needed (geocoding = free Nominatim). Ballotpedia empty = enrichment-only degrade.
- Local `backend/.env` (gitignored, chmod 600) has all 3 keys for local runs.

## Remaining cc-sn steps (execute fresh; runbook = docs/launch/cc-sn-deploy-voteriq.md)
1. CF Tunnel: add ingress `api.voteriq.app` → Coolify API svc :3000, `voteriq.app` → legal static.
   Proxied. DNS CNAMEs via CF API (siiea_complete). (Reuse siiea-cf-tunnel skill.)
2. Coolify project `voteriq` on 10.10.30.103: Docker Compose resource from the repo (private deploy key),
   compose path `backend/docker-compose.yml`.
3. Env in Coolify (from Vault, value-stripping filter): NODE_ENV=production, PORT=3000, DB_PASSWORD (secret/voteriq/db),
   JWT_SECRET (secret/voteriq/jwt), CORS_ORIGIN=https://api.voteriq.app + the 5 api keys (mapbox/ballotpedia may be blank).
4. Deploy → `npm ci && build` → run **`db:push`** once (9 tables). Verify `https://api.voteriq.app/health` → ok,
   then a real ballot lookup (Civic key live).
5. Legal static site: serve legal/privacy-policy.html at /privacy, terms-of-service.html at /terms over HTTPS.
6. GitHub Actions secrets (deploy-backend.yml): COOLIFY_WEBHOOK_URL, COOLIFY_TOKEN, EXPO_TOKEN.
7. Wazuh agent on the app CT.

## Imran-owned (cannot be done autonomously)
- **imaan@siiea.ai live inbox** — gates store contact + the public privacy contact. (siiea.ai mail now partially
  live on Stalwart CT722 per noreply-vault@; provisioning imaan@ is likely possible — verify.)
- EAS: `eas login`/`eas init` → projectId into app.config.js; production AAB build.
- Play Console: listing, Data Safety form, AAB upload, feature graphic 1024×500 + 2–8 screenshots.
- Google Maps Android key (his GCP, restrict to ai.siiea.voteriq + EAS SHA-1) → EAS env + Vault.
- Play service-account JSON → mobile/google-service-account.json (gitignored) for `eas submit`.
- Ballotpedia key (email-approved) — optional, enrichment only.
