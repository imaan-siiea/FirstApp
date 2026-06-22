# Google Play — Data Safety Form Answers (VoterIQ)

This is the exact set of answers to enter in **Play Console → App content → Data safety**.
It is derived from what the code actually collects (verified against `backend/src/db/schema.ts`,
the auth/follows/push-token routes, and the mobile `lib/` + screens). Keep this in sync if data
handling changes.

> **Privacy policy URL to enter:** `https://voteriq.app/privacy`

---

## Section 1 — Data collection & security (overview answers)

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all user data encrypted in transit? | **Yes** (HTTPS/TLS for all API traffic; auth tokens stored with `expo-secure-store`) |
| Do you provide a way for users to request that their data is deleted? | **Yes** — account deletion on request via `imaan@siiea.ai` (see note in Launch runbook about wiring an in-app/endpoint delete before scale) |

---

## Section 2 — Data types collected

For **every** type below: **Collected = Yes, Shared = Yes** (shared with the third-party APIs that
power functionality — Google Civic, Mapbox, Groq, Expo), **Processed ephemerally = No**,
**Required or optional = Optional** (the app is usable without an account/address in places),
**Purpose = App functionality** (and *Account management* where noted). **None** are collected for
advertising or marketing.

### Location
| Field | Value |
|---|---|
| Data type | **Approximate location** |
| Collected | Yes · Shared | Yes |
| Detail | The user **types a street address** (not device GPS). Used to resolve districts/ballot/polling place. Shared with Google Civic + Mapbox for functionality. |
| Note | The app requests **no** device location permission — `ACCESS_FINE/COARSE_LOCATION` are explicitly blocked in `app.config.js`. Declare this as user-provided approximate location, **not** precise device location. |

### Personal info
| Field | Value |
|---|---|
| Email address | Collected: Yes · Shared: No · Purpose: App functionality, Account management |
| Names | **Not collected** |
| User IDs | Collected: Yes (account user id) · Shared: No · Purpose: App functionality, Account management |
| Address | Covered under Approximate location above (user-entered) |

### Messages
| Field | Value |
|---|---|
| Other in-app messages | Collected: Yes · Shared: Yes (to AI provider Groq) · Purpose: App functionality |
| Detail | AI ballot-guide chat text the user types, sent to the AI provider to generate answers. |

### App activity
| Field | Value |
|---|---|
| Other user-generated content / actions | Collected: Yes · Shared: No · Purpose: App functionality |
| Detail | Follows (politicians/states/parties) and election reminder opt-ins. |

### Device or other IDs
| Field | Value |
|---|---|
| Device or other IDs | Collected: Yes · Shared: Yes (Expo push service) · Purpose: App functionality |
| Detail | Expo push notification token + platform, only if the user enables notifications. |

### App info and performance (logs)
| Field | Value |
|---|---|
| Crash logs / Diagnostics | Collected: Yes (basic server request logs) · Shared: No · Purpose: App functionality (security, debugging) |

---

## Section 3 — Security practices to check

- ☑ Data is encrypted in transit
- ☑ Users can request data deletion
- ☑ Committed to Play Families Policy? **No** (not a child-directed app)
- ☑ Independent security review? **No** (leave unchecked unless one is done)

---

## What VoterIQ explicitly does NOT collect (leave unchecked)

- ✗ Precise/device GPS location
- ✗ Financial info, payment info
- ✗ Health, fitness
- ✗ Photos, videos, audio, files
- ✗ Contacts, calendar
- ✗ Browsing history, search history (outside the app)
- ✗ Advertising ID / data for advertising or marketing
- ✗ Any data sold to third parties

---

## Content rating questionnaire (separate from Data Safety)

Expected outcome: **Everyone / PEGI 3** — VoterIQ has no violence, sexual content, profanity,
gambling, or user-to-user open communication. Answer the IARC questionnaire honestly:
- Violence / scary content: No
- Sexual content: No
- Profanity: No
- Controlled substances: No
- Gambling: No
- User interaction / shares location / personal info shared with others: **No** (follows are private
  to the user; there is no social/UGC sharing surface)
- The app references real-world politics/elections — this is informational and does not raise the
  rating.
