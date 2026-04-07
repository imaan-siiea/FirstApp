# VoterIQ v2.2 Design Spec — Electoral Map + Follow Alerts

## Overview

Two new features: (1) an interactive electoral college map replacing the current react-native-maps polygon hack, and (2) a follow/alert system where users get push notifications when followed politicians, states, or parties appear in election news.

---

## Feature 1: Interactive Electoral College Map

### Problem

The current `UsMap` component uses `react-native-maps` with invisible bounding-box polygons and text markers — a hack that can't shade actual state shapes. States are colored grey with abbreviation labels; no competitive ratings are shown.

### Solution

Replace `mobile/components/UsMap.tsx` with `mobile/components/ElectoralMap.tsx` — a `WebView` rendering inline D3.js + TopoJSON HTML. The D3 `geoAlbersUsa` projection produces real geographic state outlines shaded by 2026 competitive rating.

### Props interface (unchanged from UsMap)

```typescript
interface ElectoralMapProps {
  selectedState: string | null
  onSelectState: (code: string | null) => void
}
```

### Data

- **TopoJSON**: loaded from CDN (`cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json`) — app requires internet already
- **Colors**: hardcoded static map based on 2024 results / 2026 outlook:
  - `#991b1b` Safe R — AL AK AR ID IN KS KY LA MO MS MT ND NE OK SC SD TN TX UT WV WY
  - `#ef4444` Lean R — AZ FL GA IA NC OH
  - `#7c3aed` Toss-Up — MI NV NH PA WI
  - `#3b82f6` Lean D — CO ME MN NM OR VA
  - `#1d4ed8` Safe D — CA CT DE HI IL MA MD NJ NY RI VT WA

### Communication (WebView ↔ React Native)

- State tap → `window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'selectState', code: 'TX' | null }))`
- Clear from outside → `injectJavaScript('window.resetSelection(); true;')`

### Changes

- `mobile/components/ElectoralMap.tsx` — new (replaces UsMap.tsx)
- `mobile/components/UsMap.tsx` — deleted
- `mobile/app/polls.tsx` — import ElectoralMap instead of UsMap

---

## Feature 2: Follow Alerts + Push Notifications

### Architecture

**Who can follow**: any logged-in user (auth already exists: JWT + bcrypt + SecureStore)

**What can be followed**: `politician` (by name), `state` (by 2-letter code), `party` (by name e.g. "Republican")

**Where bells appear**: `FederalRow` (US Senators, Governor) and `RepRow` (state legislators) in `polls.tsx`

**Notification trigger**: after fetching fresh election news for a state (cache miss), scan article titles+descriptions for followed entity names → push to subscribed users via Expo Push API

### DB additions

```typescript
// follows table
follows {
  id: uuid PK
  userId: uuid FK → users.id
  entityType: text   // 'politician' | 'state' | 'party'
  entityId: text     // state code, party name, or politician name (normalized)
  entityName: text   // display name
  createdAt: timestamp
}

// push_tokens table
push_tokens {
  id: uuid PK
  userId: uuid FK → users.id
  token: text UNIQUE   // "ExponentPushToken[xxx]"
  platform: text       // 'ios' | 'android'
  updatedAt: timestamp
}
```

### Backend routes

```
POST   /push-token          { token, platform }        → saves/updates token   [auth required]
GET    /follows             → [{ id, entityType, entityId, entityName }]        [auth required]
POST   /follows             { entityType, entityId, entityName }                [auth required]
DELETE /follows/:entityId   → 204                                               [auth required]
```

Auth: `Authorization: Bearer <accessToken>` — verified via `jwt.verify` in each handler.

### Notification delivery

- Expo Push API: `POST https://exp.push.host/--/api/v2/push/send`
- Payload: `[{ to, title, body, sound: 'default' }]`
- Dedup: in-memory `Set<string>` of `${userId}:${articleUrl}` — clears on restart (acceptable: max 1 re-notify per deploy)

### Notification trigger hook

In `backend/src/routes/news.ts`, after `getStateNewsWithFallback` returns articles:
```typescript
checkAndNotifyFollows(stateCode, articles).catch(err => app.log.warn(err))  // fire-and-forget
```

`checkAndNotifyFollows` (in `notifications.ts`):
1. Load all follows where `entityType='state' AND entityId=stateCode` OR `entityType='politician'`
2. For each new article (not in dedup set), check if entity name appears in title+description
3. Load push tokens for matched users
4. POST to Expo Push API
5. Add article URL to dedup set

### Mobile changes

- Install: `expo-notifications`, `react-native-webview`
- `mobile/lib/api.ts` — add `follows.*` methods + `registerPushToken`
- `mobile/hooks/useFollows.ts` — fetches follows list, exposes `isFollowing(entityId)` and `toggleFollow(entity)` with optimistic updates
- `mobile/app/polls.tsx` — bell icon on `FederalRow` + `RepRow`; unauthenticated users see login prompt on bell tap
- `mobile/app/account/index.tsx` — register push token on app start when logged in
- `mobile/app/alerts.tsx` — "My Alerts" screen listing all follows with unfollow buttons
- `mobile/app/index.tsx` — add "My Alerts" to FEATURE_CARDS

---

## File Map

### New files
| File | Purpose |
|------|---------|
| `mobile/components/ElectoralMap.tsx` | D3 WebView map |
| `mobile/hooks/useFollows.ts` | follows state + toggle |
| `mobile/app/alerts.tsx` | My Alerts screen |
| `backend/src/routes/follows.ts` | follows CRUD |
| `backend/src/services/notifications.ts` | Expo push sender |

### Modified files
| File | Change |
|------|--------|
| `backend/src/db/schema.ts` | +follows, +push_tokens tables |
| `backend/src/app.ts` | register follows routes |
| `backend/src/routes/news.ts` | trigger notifications after fresh fetch |
| `mobile/lib/api.ts` | +follows methods, +registerPushToken |
| `mobile/app/polls.tsx` | use ElectoralMap, add bell icons |
| `mobile/app/account/index.tsx` | register push token |
| `mobile/app/index.tsx` | add My Alerts card |
| `mobile/app/_layout.tsx` | register alerts screen |

### Deleted files
| File | Reason |
|------|--------|
| `mobile/components/UsMap.tsx` | replaced by ElectoralMap |
