# Google Play — Store Listing Copy (VoterIQ)

Paste these into **Play Console → Grow → Store presence → Main store listing**.
Character limits noted; all copy below is within limit.

---

## App name  (max 30 chars)
```
VoterIQ: Your Ballot Guide
```
*(26 chars)*

## Short description  (max 80 chars)
```
See your ballot, learn the candidates, and ask questions. Free & nonpartisan.
```
*(77 chars)*

## Full description  (max 4000 chars)
```
VoterIQ is your free, nonpartisan companion for every election. Enter your address and see the exact ballot you'll vote on — then actually understand it.

Most voters show up to races they've never heard of. VoterIQ fixes that. It's not a database you have to dig through — it's a ballot guide you can talk to.

WHAT YOU CAN DO

• See your real ballot
Type your address and get the specific federal, state, and local races and candidates on your ballot — not a generic list.

• Ask the AI ballot guide
Have a question about a race, a candidate, or what an office actually does? Ask in plain language and get a clear, sourced answer. It's like having a knowledgeable friend who read everything.

• Get to know the candidates
Browse profiles with bios, parties, positions on the issues, and source links. Compare candidates for the same office side by side.

• Know your representatives
See who currently represents you at the federal and state level, including senators and your governor.

• Find your polling place
Get a map and a direct link to your official state polling-place and registration tools.

• Register and never miss a date
Step-by-step registration guidance for your state, plus reminders so you don't miss a deadline or an election.

• Follow what matters
Follow politicians, states, or parties and get alerts on what's relevant to you.

BUILT ON TRUST

• Nonpartisan by design — VoterIQ doesn't endorse candidates or parties.
• Every data point links back to its source.
• No ads. No selling your data. No tracking you across the internet.
• The app never accesses your device's GPS — you just type the address you want to look up.

VoterIQ aggregates information from official and public civic data sources. It's an informational tool — always confirm registration, deadlines, and polling details with your official state or local election office.

Free to use. Made for voters who want to walk in informed.
```

---

## Listing metadata

| Field | Value |
|---|---|
| **App category** | Choose **News & Magazines** *(or **Education**)* — civic-info apps fit either; News & Magazines is the closest match for an election guide |
| **Tags** | voting, elections, civic, ballot, candidates |
| **Contact email** | `imaan@siiea.ai` |
| **Contact website** | `https://voteriq.app` |
| **Privacy policy** | `https://voteriq.app/privacy` |

---

## Graphic assets needed (Play requirements)

| Asset | Spec | Status |
|---|---|---|
| App icon | 512×512 PNG, 32-bit | ✅ **done** — `store-assets/google/play-store-icon-512.png` (and `mobile/assets/icon.png` @1024 in-app) |
| Feature graphic | **1024×500 PNG/JPG** (required) | ✅ **done** — `store-assets/google/feature-graphic-1024x500.png` |
| Phone screenshots | 2–8 images, 16:9 or 9:16, min 320px, max 3840px | ❌ **needs capture** — see runbook (home → ballot → candidate → AI chat → polling map → registration) |
| 7" / 10" tablet screenshots | Optional | ⚪ optional (app supports tablets; nice-to-have) |

> **Brand assets generated 2026-06-07.** VoterIQ mark = ballot-bubble ring + bold check flicking
> into a gold star (nonpartisan), on deep-navy `#1e3a5f`. Editable SVG sources live in
> `store-assets/source/`. In-app icons (`mobile/assets/icon.png`, `adaptive-icon.png`,
> `splash-icon.png`, `favicon.png`) were regenerated from the same mark.

> **Screenshot tip:** capture against the live `api.voteriq.app` backend so real ballot/candidate
> data shows. Suggested 6 shots: (1) home/address entry, (2) ballot list, (3) candidate profile,
> (4) AI ballot guide chat, (5) electoral map, (6) registration guide. A simple device frame +
> one-line caption per shot lifts conversion noticeably.

---

## Notes / decisions to confirm
- **Contact email**: `imaan@siiea.ai` is referenced in the listing and legal pages — make sure it's
  a real, monitored inbox.
- **Category**: pick News & Magazines vs Education before submitting.
- Listing copy is intentionally nonpartisan and avoids any claim of government affiliation (Play
  reviews election/government apps strictly — see the runbook's review-risk section).
