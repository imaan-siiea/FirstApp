# VoterIQ v2.2 Implementation Plan — Electoral Map + Follow Alerts

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive D3 geographic electoral map and a push-notification follow system for politicians/states/parties.

**Architecture:** WebView-based D3 map replaces react-native-maps polygon hack; follows stored in Postgres with JWT-auth CRUD routes; Expo Push API delivers notifications when followed entities appear in fresh news.

**Tech Stack:** Fastify + Drizzle/Postgres (backend), Expo 54 + react-native-webview + expo-notifications (mobile), Expo Push API (push delivery)

---

## Task 1: DB Schema — follows + push_tokens tables

**Files:**
- Modify: `backend/src/db/schema.ts`

- [ ] **Step 1: Add follows and push_tokens tables to schema**

Open `backend/src/db/schema.ts` and add after the `refreshTokens` table:

```typescript
export const follows = pgTable('follows', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  entityType: text('entity_type').notNull(), // 'politician' | 'state' | 'party'
  entityId: text('entity_id').notNull(),     // state code, party name, or politician name (lowercased)
  entityName: text('entity_name').notNull(), // display name
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const pushTokens = pgTable('push_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  platform: text('platform').notNull(), // 'ios' | 'android'
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

- [ ] **Step 2: Push schema to database**

```bash
cd /home/imran/Documents/Imaan\ Ali\ Folder/FirstApp/backend
npx drizzle-kit push
```

Expected: "Changes applied" with follows and push_tokens tables created.

- [ ] **Step 3: Commit**

```bash
cd /home/imran/Documents/Imaan\ Ali\ Folder/FirstApp
git add backend/src/db/schema.ts
git commit -m "feat(db): add follows and push_tokens tables"
```

---

## Task 2: Backend follows routes

**Files:**
- Create: `backend/src/routes/follows.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Create follows route file**

Create `backend/src/routes/follows.ts`:

```typescript
import type { FastifyInstance, FastifyRequest } from 'fastify'
import jwt from 'jsonwebtoken'
import { db } from '../db'
import { follows, pushTokens } from '../db/schema'
import { eq, and } from 'drizzle-orm'

const JWT_SECRET = () => process.env.JWT_SECRET!

function getUserId(req: FastifyRequest): string {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) throw new Error('Unauthorized')
  const token = auth.slice(7)
  const payload = jwt.verify(token, JWT_SECRET()) as { userId: string }
  return payload.userId
}

export async function followsRoutes(app: FastifyInstance) {
  // POST /push-token — register Expo push token
  app.post<{ Body: { token: string; platform: string } }>('/push-token', {
    schema: {
      body: {
        type: 'object',
        required: ['token', 'platform'],
        properties: {
          token: { type: 'string' },
          platform: { type: 'string', enum: ['ios', 'android'] },
        },
      },
    },
    handler: async (req, reply) => {
      try {
        const userId = getUserId(req)
        await db
          .insert(pushTokens)
          .values({ userId, token: req.body.token, platform: req.body.platform })
          .onConflictDoUpdate({
            target: pushTokens.token,
            set: { userId, updatedAt: new Date() },
          })
        return reply.code(204).send()
      } catch (err: any) {
        if (err.message === 'Unauthorized') return reply.code(401).send({ error: 'Unauthorized' })
        return reply.code(500).send({ error: 'Failed to save token' })
      }
    },
  })

  // GET /follows — list all follows for current user
  app.get('/follows', {
    handler: async (req, reply) => {
      try {
        const userId = getUserId(req)
        const rows = await db.select().from(follows).where(eq(follows.userId, userId))
        return rows.map(r => ({
          id: r.id,
          entityType: r.entityType,
          entityId: r.entityId,
          entityName: r.entityName,
          createdAt: r.createdAt,
        }))
      } catch (err: any) {
        if (err.message === 'Unauthorized') return reply.code(401).send({ error: 'Unauthorized' })
        return reply.code(500).send({ error: 'Failed to fetch follows' })
      }
    },
  })

  // POST /follows — add a follow
  app.post<{ Body: { entityType: string; entityId: string; entityName: string } }>('/follows', {
    schema: {
      body: {
        type: 'object',
        required: ['entityType', 'entityId', 'entityName'],
        properties: {
          entityType: { type: 'string', enum: ['politician', 'state', 'party'] },
          entityId: { type: 'string' },
          entityName: { type: 'string' },
        },
      },
    },
    handler: async (req, reply) => {
      try {
        const userId = getUserId(req)
        const { entityType, entityId, entityName } = req.body
        // Ignore duplicate (user already follows this entity)
        const existing = await db
          .select()
          .from(follows)
          .where(and(eq(follows.userId, userId), eq(follows.entityId, entityId.toLowerCase())))
        if (existing.length) return reply.code(409).send({ error: 'Already following' })
        const [row] = await db
          .insert(follows)
          .values({ userId, entityType, entityId: entityId.toLowerCase(), entityName })
          .returning()
        return reply.code(201).send(row)
      } catch (err: any) {
        if (err.message === 'Unauthorized') return reply.code(401).send({ error: 'Unauthorized' })
        return reply.code(500).send({ error: 'Failed to add follow' })
      }
    },
  })

  // DELETE /follows/:entityId — unfollow
  app.delete<{ Params: { entityId: string } }>('/follows/:entityId', {
    handler: async (req, reply) => {
      try {
        const userId = getUserId(req)
        await db
          .delete(follows)
          .where(and(eq(follows.userId, userId), eq(follows.entityId, req.params.entityId.toLowerCase())))
        return reply.code(204).send()
      } catch (err: any) {
        if (err.message === 'Unauthorized') return reply.code(401).send({ error: 'Unauthorized' })
        return reply.code(500).send({ error: 'Failed to unfollow' })
      }
    },
  })
}
```

- [ ] **Step 2: Register follows routes in app.ts**

In `backend/src/app.ts`, import and register `followsRoutes`. Find where other routes are registered (e.g., near `authRoutes`, `newsRoutes`) and add:

```typescript
import { followsRoutes } from './routes/follows'
// ...inside buildApp(), alongside other route registrations:
app.register(followsRoutes)
```

- [ ] **Step 3: Commit**

```bash
cd /home/imran/Documents/Imaan\ Ali\ Folder/FirstApp
git add backend/src/routes/follows.ts backend/src/app.ts
git commit -m "feat(backend): add follows and push-token routes"
```

---

## Task 3: Notification service

**Files:**
- Create: `backend/src/services/notifications.ts`

- [ ] **Step 1: Create notification service**

Create `backend/src/services/notifications.ts`:

```typescript
import { db } from '../db'
import { follows, pushTokens } from '../db/schema'
import { eq, or, and, inArray } from 'drizzle-orm'
import type { NewsArticle } from './newsRss'

// Dedup: never notify the same user for the same article twice (in-memory, resets on restart)
const sentKeys = new Set<string>() // `${userId}:${articleUrl}`

export async function checkAndNotifyFollows(
  stateCode: string,
  articles: NewsArticle[],
): Promise<void> {
  if (!articles.length) return

  // Load all follows: state follows for this state + all politician/party follows
  const allFollows = await db.select().from(follows).where(
    or(
      and(eq(follows.entityType, 'state'), eq(follows.entityId, stateCode.toLowerCase())),
      eq(follows.entityType, 'politician'),
      eq(follows.entityType, 'party'),
    ),
  )
  if (!allFollows.length) return

  const notifications: { userId: string; title: string; body: string; articleUrl: string }[] = []

  for (const article of articles) {
    const content = `${article.title} ${article.description ?? ''}`.toLowerCase()

    for (const follow of allFollows) {
      const key = `${follow.userId}:${article.url}`
      if (sentKeys.has(key)) continue

      let matched = false
      if (follow.entityType === 'state') {
        matched = true // state followers get all news from that state
      } else {
        // politician or party: check name appears in article
        matched = content.includes(follow.entityId)
      }

      if (matched) {
        notifications.push({
          userId: follow.userId,
          title: follow.entityType === 'state'
            ? `📰 ${follow.entityName} Election News`
            : `🔔 ${follow.entityName} in the news`,
          body: article.title,
          articleUrl: article.url,
        })
      }
    }
  }

  if (!notifications.length) return

  // Load push tokens for all affected users
  const userIds = [...new Set(notifications.map(n => n.userId))]
  const tokens = await db.select().from(pushTokens).where(inArray(pushTokens.userId, userIds))
  const tokensByUser = new Map(tokens.map(t => [t.userId, t.token]))

  const pushMessages: object[] = []
  for (const notif of notifications) {
    const token = tokensByUser.get(notif.userId)
    if (!token) continue
    sentKeys.add(`${notif.userId}:${notif.articleUrl}`)
    pushMessages.push({
      to: token,
      title: notif.title,
      body: notif.body,
      sound: 'default',
      data: { articleUrl: notif.articleUrl },
    })
  }

  if (!pushMessages.length) return

  // Send to Expo Push API (free, no key required)
  await fetch('https://exp.push.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(pushMessages),
  })
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/imran/Documents/Imaan\ Ali\ Folder/FirstApp
git add backend/src/services/notifications.ts
git commit -m "feat(backend): add Expo push notification service"
```

---

## Task 4: Wire notification trigger into news route

**Files:**
- Modify: `backend/src/routes/news.ts`

- [ ] **Step 1: Import and call checkAndNotifyFollows after news fetch**

In `backend/src/routes/news.ts`, add the import at the top:

```typescript
import { checkAndNotifyFollows } from '../services/notifications'
```

In the `/news/elections` handler, after `const articles = await getStateNewsWithFallback(...)`, add:

```typescript
// Fire-and-forget: notify followers of new articles (don't block the response)
checkAndNotifyFollows(code, articles).catch(err => app.log.warn('[notifications]', err?.message))
```

Full updated handler:

```typescript
handler: async (req, reply) => {
  try {
    const code = req.query.state.toUpperCase()
    const name = STATE_NAMES[code]
    if (!name) return reply.code(400).send({ error: 'Unknown state code' })
    const articles = await getStateNewsWithFallback(code, generateStateBriefing)
    checkAndNotifyFollows(code, articles).catch(err => app.log.warn('[notifications]', err?.message))
    return { state: code, stateName: name, articles }
  } catch (err) {
    app.log.error(err)
    return reply.code(503).send({ error: 'News unavailable' })
  }
},
```

- [ ] **Step 2: Commit**

```bash
cd /home/imran/Documents/Imaan\ Ali\ Folder/FirstApp
git add backend/src/routes/news.ts
git commit -m "feat(backend): trigger push notifications after news fetch"
```

---

## Task 5: ElectoralMap component

**Files:**
- Create: `mobile/components/ElectoralMap.tsx`
- Delete: `mobile/components/UsMap.tsx`

- [ ] **Step 1: Install react-native-webview**

```bash
cd /home/imran/Documents/Imaan\ Ali\ Folder/FirstApp/mobile
npx expo install react-native-webview
```

Expected: package added to package.json and expo config updated.

- [ ] **Step 2: Create ElectoralMap.tsx**

Create `mobile/components/ElectoralMap.tsx`:

```typescript
import { useRef, useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'

interface ElectoralMapProps {
  selectedState: string | null
  onSelectState: (code: string | null) => void
}

// FIPS code → state abbreviation (us-atlas TopoJSON uses FIPS numeric IDs)
const FIPS_TO_CODE: Record<number, string> = {
  1:'AL',2:'AK',4:'AZ',5:'AR',6:'CA',8:'CO',9:'CT',10:'DE',12:'FL',13:'GA',
  15:'HI',16:'ID',17:'IL',18:'IN',19:'IA',20:'KS',21:'KY',22:'LA',23:'ME',
  24:'MD',25:'MA',26:'MI',27:'MN',28:'MS',29:'MO',30:'MT',31:'NE',32:'NV',
  33:'NH',34:'NJ',35:'NM',36:'NY',37:'NC',38:'ND',39:'OH',40:'OK',41:'OR',
  42:'PA',44:'RI',45:'SC',46:'SD',47:'TN',48:'TX',49:'UT',50:'VT',51:'VA',
  53:'WA',54:'WV',55:'WI',56:'WY',
}

// 2026 competitiveness colors
const STATE_COLORS: Record<string, string> = {
  // Safe Republican
  AL:'#991b1b',AK:'#991b1b',AR:'#991b1b',ID:'#991b1b',IN:'#991b1b',KS:'#991b1b',
  KY:'#991b1b',LA:'#991b1b',MO:'#991b1b',MS:'#991b1b',MT:'#991b1b',ND:'#991b1b',
  NE:'#991b1b',OK:'#991b1b',SC:'#991b1b',SD:'#991b1b',TN:'#991b1b',TX:'#991b1b',
  UT:'#991b1b',WV:'#991b1b',WY:'#991b1b',
  // Lean/Likely Republican
  AZ:'#ef4444',FL:'#ef4444',GA:'#ef4444',IA:'#ef4444',NC:'#ef4444',OH:'#ef4444',
  // Toss-Up
  MI:'#7c3aed',NV:'#7c3aed',NH:'#7c3aed',PA:'#7c3aed',WI:'#7c3aed',
  // Lean/Likely Democratic
  CO:'#3b82f6',ME:'#3b82f6',MN:'#3b82f6',NM:'#3b82f6',OR:'#3b82f6',VA:'#3b82f6',
  // Safe Democratic
  CA:'#1d4ed8',CT:'#1d4ed8',DE:'#1d4ed8',HI:'#1d4ed8',IL:'#1d4ed8',MA:'#1d4ed8',
  MD:'#1d4ed8',NJ:'#1d4ed8',NY:'#1d4ed8',RI:'#1d4ed8',VT:'#1d4ed8',WA:'#1d4ed8',
}

const FIPS_TO_NAME: Record<number, string> = {
  1:'Alabama',2:'Alaska',4:'Arizona',5:'Arkansas',6:'California',8:'Colorado',
  9:'Connecticut',10:'Delaware',12:'Florida',13:'Georgia',15:'Hawaii',16:'Idaho',
  17:'Illinois',18:'Indiana',19:'Iowa',20:'Kansas',21:'Kentucky',22:'Louisiana',
  23:'Maine',24:'Maryland',25:'Massachusetts',26:'Michigan',27:'Minnesota',
  28:'Mississippi',29:'Missouri',30:'Montana',31:'Nebraska',32:'Nevada',
  33:'New Hampshire',34:'New Jersey',35:'New Mexico',36:'New York',
  37:'North Carolina',38:'North Dakota',39:'Ohio',40:'Oklahoma',41:'Oregon',
  42:'Pennsylvania',44:'Rhode Island',45:'South Carolina',46:'South Dakota',
  47:'Tennessee',48:'Texas',49:'Utah',50:'Vermont',51:'Virginia',
  53:'Washington',54:'West Virginia',55:'Wisconsin',56:'Wyoming',
}

function buildMapHtml(stateColors: Record<string, string>, fipsToCode: Record<number, string>, fipsToName: Record<number, string>): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #0f172a; }
  svg { display: block; width: 100%; height: 100%; }
  .state { cursor: pointer; stroke: #0f172a; stroke-width: 0.7; }
  .state.selected { stroke: #f8fafc; stroke-width: 2.5; filter: brightness(1.2); }
  .legend {
    position: fixed; bottom: 6px; left: 0; right: 0;
    display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; padding: 0 8px;
  }
  .legend-item { display: flex; align-items: center; gap: 3px; }
  .legend-dot { width: 9px; height: 9px; border-radius: 2px; }
  .legend-label { font-size: 9px; color: #94a3b8; font-weight: 600; font-family: -apple-system, sans-serif; }
  .badge {
    position: fixed; top: 8px; left: 50%; transform: translateX(-50%);
    background: rgba(15,23,42,0.9); color: #f8fafc;
    padding: 4px 12px; border-radius: 20px;
    font-size: 12px; font-weight: 700; font-family: -apple-system, sans-serif;
    display: none; white-space: nowrap;
  }
</style>
</head>
<body>
<div id="map" style="width:100%;height:100%"></div>
<div class="legend">
  <div class="legend-item"><div class="legend-dot" style="background:#991b1b"></div><span class="legend-label">Safe R</span></div>
  <div class="legend-item"><div class="legend-dot" style="background:#ef4444"></div><span class="legend-label">Lean R</span></div>
  <div class="legend-item"><div class="legend-dot" style="background:#7c3aed"></div><span class="legend-label">Toss-Up</span></div>
  <div class="legend-item"><div class="legend-dot" style="background:#3b82f6"></div><span class="legend-label">Lean D</span></div>
  <div class="legend-item"><div class="legend-dot" style="background:#1d4ed8"></div><span class="legend-label">Safe D</span></div>
</div>
<div class="badge" id="badge"></div>
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js"></script>
<script>
const FIPS_TO_CODE = ${JSON.stringify(fipsToCode)};
const FIPS_TO_NAME = ${JSON.stringify(fipsToName)};
const STATE_COLORS = ${JSON.stringify(stateColors)};

let selectedCode = null;
const badge = document.getElementById('badge');

function setSelected(code) {
  selectedCode = code;
  svg.selectAll('.state').classed('selected', d => FIPS_TO_CODE[+d.id] === code);
  if (code) {
    badge.textContent = FIPS_TO_NAME[+Object.keys(FIPS_TO_CODE).find(k => FIPS_TO_CODE[+k] === code)] || code;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

const w = document.getElementById('map').offsetWidth || window.innerWidth;
const h = document.getElementById('map').offsetHeight || window.innerHeight;
const svg = d3.select('#map').append('svg').attr('viewBox', \`0 0 \${w} \${h}\`).attr('width', '100%').attr('height', '100%');
const projection = d3.geoAlbersUsa().fitSize([w, h - 24], { type: 'Sphere' });
const path = d3.geoPath().projection(projection);

fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
  .then(r => r.json())
  .then(us => {
    const states = topojson.feature(us, us.objects.states);
    svg.selectAll('.state')
      .data(states.features)
      .join('path')
      .attr('class', 'state')
      .attr('d', path)
      .attr('fill', d => STATE_COLORS[FIPS_TO_CODE[+d.id]] || '#334155')
      .on('click', (event, d) => {
        const code = FIPS_TO_CODE[+d.id];
        if (!code) return;
        const next = selectedCode === code ? null : code;
        setSelected(next);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'selectState', code: next }));
        }
      });
  });

window.resetSelection = function() { setSelected(null); };
window.selectState = function(code) { setSelected(code); };
</script>
</body>
</html>`
}

const MAP_HTML = buildMapHtml(STATE_COLORS, FIPS_TO_CODE, FIPS_TO_NAME)

export function ElectoralMap({ selectedState, onSelectState }: ElectoralMapProps) {
  const webViewRef = useRef<WebView>(null)

  useEffect(() => {
    if (!selectedState) {
      webViewRef.current?.injectJavaScript('window.resetSelection && window.resetSelection(); true;')
    } else {
      webViewRef.current?.injectJavaScript(`window.selectState && window.selectState(${JSON.stringify(selectedState)}); true;`)
    }
  }, [selectedState])

  function handleMessage(event: { nativeEvent: { data: string } }) {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data.type === 'selectState') onSelectState(data.code)
    } catch {}
  }

  return (
    <View style={styles.wrapper}>
      <WebView
        ref={webViewRef}
        source={{ html: MAP_HTML }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 4 },
  map: { height: 220, width: '100%', backgroundColor: '#0f172a' },
})
```

- [ ] **Step 3: Delete UsMap.tsx**

```bash
rm /home/imran/Documents/Imaan\ Ali\ Folder/FirstApp/mobile/components/UsMap.tsx
```

- [ ] **Step 4: Commit**

```bash
cd /home/imran/Documents/Imaan\ Ali\ Folder/FirstApp
git add mobile/components/ElectoralMap.tsx mobile/package.json
git rm mobile/components/UsMap.tsx
git commit -m "feat(mobile): replace UsMap with interactive D3 electoral map (WebView)"
```

---

## Task 6: Update polls.tsx to use ElectoralMap

**Files:**
- Modify: `mobile/app/polls.tsx`

- [ ] **Step 1: Swap UsMap import for ElectoralMap**

In `mobile/app/polls.tsx`, find:

```typescript
import { UsMap } from '../components/UsMap'
```

Replace with:

```typescript
import { ElectoralMap } from '../components/ElectoralMap'
```

- [ ] **Step 2: Swap component usage**

In polls.tsx, find all instances of `<UsMap` and replace with `<ElectoralMap`. The props are identical (`selectedState` and `onSelectState`), so no other changes needed.

- [ ] **Step 3: Verify the app builds**

```bash
cd /home/imran/Documents/Imaan\ Ali\ Folder/FirstApp/mobile
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to ElectoralMap or UsMap.

- [ ] **Step 4: Commit**

```bash
cd /home/imran/Documents/Imaan\ Ali\ Folder/FirstApp
git add mobile/app/polls.tsx
git commit -m "feat(mobile): use ElectoralMap in polls screen"
```

---

## Task 7: Mobile API methods + useFollows hook

**Files:**
- Modify: `mobile/lib/api.ts`
- Create: `mobile/hooks/useFollows.ts`

- [ ] **Step 1: Add follows API methods to api.ts**

In `mobile/lib/api.ts`, add these methods to the `api` object:

```typescript
  // Push token registration
  registerPushToken: (token: string, platform: 'ios' | 'android') =>
    request<void>('/push-token', {
      method: 'POST', body: JSON.stringify({ token, platform }),
    }),

  // Follows
  getFollows: () =>
    request<{ id: string; entityType: string; entityId: string; entityName: string; createdAt: string }[]>('/follows'),

  addFollow: (entityType: string, entityId: string, entityName: string) =>
    request<{ id: string }>('/follows', {
      method: 'POST', body: JSON.stringify({ entityType, entityId, entityName }),
    }),

  removeFollow: (entityId: string) =>
    request<void>(`/follows/${encodeURIComponent(entityId)}`, { method: 'DELETE' }),
```

- [ ] **Step 2: Create hooks directory and useFollows hook**

Create `mobile/hooks/useFollows.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../lib/store'
import { api } from '../lib/api'

export interface Follow {
  id: string
  entityType: string
  entityId: string
  entityName: string
}

export function useFollows() {
  const userId = useAppStore((s) => s.userId)
  const [follows, setFollows] = useState<Follow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) { setFollows([]); return }
    setLoading(true)
    api.getFollows()
      .then(setFollows)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  const isFollowing = useCallback(
    (entityId: string) => follows.some(f => f.entityId === entityId.toLowerCase()),
    [follows],
  )

  const toggleFollow = useCallback(async (
    entityType: 'politician' | 'state' | 'party',
    entityId: string,
    entityName: string,
  ) => {
    if (!userId) return false // caller should prompt login

    const alreadyFollowing = follows.some(f => f.entityId === entityId.toLowerCase())

    // Optimistic update
    if (alreadyFollowing) {
      setFollows(prev => prev.filter(f => f.entityId !== entityId.toLowerCase()))
      api.removeFollow(entityId).catch(() => {
        // Rollback on failure
        setFollows(prev => [...prev, { id: '', entityType, entityId: entityId.toLowerCase(), entityName }])
      })
    } else {
      const optimistic: Follow = { id: 'pending', entityType, entityId: entityId.toLowerCase(), entityName }
      setFollows(prev => [...prev, optimistic])
      api.addFollow(entityType, entityId, entityName)
        .then(result => {
          setFollows(prev => prev.map(f => f.id === 'pending' ? { ...f, id: result.id } : f))
        })
        .catch(() => {
          setFollows(prev => prev.filter(f => f.id !== 'pending'))
        })
    }

    return !alreadyFollowing
  }, [userId, follows])

  return { follows, loading, isFollowing, toggleFollow }
}
```

- [ ] **Step 3: Commit**

```bash
cd /home/imran/Documents/Imaan\ Ali\ Folder/FirstApp
git add mobile/lib/api.ts mobile/hooks/useFollows.ts
git commit -m "feat(mobile): add follows API methods and useFollows hook"
```

---

## Task 8: Bell icons on FederalRow + RepRow + push token registration

**Files:**
- Modify: `mobile/app/polls.tsx`
- Modify: `mobile/app/account/index.tsx`

- [ ] **Step 1: Install expo-notifications**

```bash
cd /home/imran/Documents/Imaan\ Ali\ Folder/FirstApp/mobile
npx expo install expo-notifications
```

- [ ] **Step 2: Add bell icon to FederalRow in polls.tsx**

In `mobile/app/polls.tsx`, import `useFollows` and `Alert` (if not already imported), and update the `FederalRow` component to show a bell icon.

Add the import near the top:

```typescript
import { useFollows } from '../hooks/useFollows'
import { Alert } from 'react-native'  // ensure Alert is imported
```

Update `FederalRow` to accept and use follows:

```typescript
function FederalRow({
  official, chamber, stateCode, isFollowing, onToggleFollow,
}: {
  official: { name: string; party: string; imageUrl: string | null; upIn2026?: boolean }
  chamber: string
  stateCode: string
  isFollowing: boolean
  onToggleFollow: () => void
}) {
  const partyColor = PARTY_COLORS[official.party] ?? '#1e3a5f'
  // ... existing navigation code ...

  return (
    <TouchableOpacity style={styles.federalRow} onPress={handlePress} activeOpacity={0.75}>
      {/* existing photo/avatar code */}
      <View style={styles.federalInfo}>
        {/* existing name/party code */}
        <View style={styles.federalMetaRow}>
          {/* existing up-in-2026 badge if applicable */}
        </View>
      </View>
      {/* Bell icon */}
      <TouchableOpacity onPress={onToggleFollow} style={styles.bellBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.bellIcon}>{isFollowing ? '🔔' : '🔕'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}
```

In `StateView` (or wherever `FederalRow` is used), wire up `useFollows`:

```typescript
function StateView({ stateCode, stateName }: { stateCode: string; stateName: string }) {
  const { isFollowing, toggleFollow } = useFollows()
  const userId = useAppStore((s) => s.userId)

  function handleBellPress(entityType: 'politician' | 'state' | 'party', entityId: string, entityName: string) {
    if (!userId) {
      Alert.alert('Sign in required', 'Create a free account to follow politicians and get alerts.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/account/login') },
      ])
      return
    }
    toggleFollow(entityType, entityId, entityName)
  }

  // ... rest of StateView ...
  // Pass to FederalRow:
  // isFollowing={isFollowing(official.name)}
  // onToggleFollow={() => handleBellPress('politician', official.name, official.name)}
}
```

Do the same for `RepRow` — add `isFollowing` and `onToggleFollow` props, and a bell `TouchableOpacity` on the right side:

```typescript
function RepRow({
  rep, isFollowing, onToggleFollow,
}: {
  rep: { name: string; party: string; district: string; imageUrl?: string | null }
  isFollowing: boolean
  onToggleFollow: () => void
}) {
  // ... existing code ...
  return (
    <TouchableOpacity style={styles.repRow} onPress={handlePress} activeOpacity={0.75}>
      {/* existing content */}
      <TouchableOpacity onPress={onToggleFollow} style={styles.bellBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.bellIcon}>{isFollowing ? '🔔' : '🔕'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}
```

Add these styles to StyleSheet.create:

```typescript
bellBtn: { padding: 4, marginLeft: 4 },
bellIcon: { fontSize: 18 },
```

- [ ] **Step 3: Register push token on login in account/index.tsx**

Read `mobile/app/account/index.tsx`. Add push token registration after login:

At the top of the file, add imports:

```typescript
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { api } from '../../lib/api'
```

Add a `registerPushToken` function and call it in `useEffect` when `userId` is set:

```typescript
async function registerPushToken() {
  try {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return
    const token = await Notifications.getExpoPushTokenAsync()
    const platform = Platform.OS === 'ios' ? 'ios' : 'android'
    await api.registerPushToken(token.data, platform)
  } catch {
    // Push token registration is best-effort
  }
}

useEffect(() => {
  if (userId) registerPushToken()
}, [userId])
```

- [ ] **Step 4: TypeScript check**

```bash
cd /home/imran/Documents/Imaan\ Ali\ Folder/FirstApp/mobile
npx tsc --noEmit 2>&1 | head -40
```

Fix any type errors before committing.

- [ ] **Step 5: Commit**

```bash
cd /home/imran/Documents/Imaan\ Ali\ Folder/FirstApp
git add mobile/app/polls.tsx mobile/app/account/index.tsx mobile/package.json
git commit -m "feat(mobile): add bell follow icons and push token registration"
```

---

## Task 9: My Alerts screen + home screen card

**Files:**
- Create: `mobile/app/alerts.tsx`
- Modify: `mobile/app/index.tsx`
- Modify: `mobile/app/_layout.tsx`

- [ ] **Step 1: Create alerts.tsx**

Create `mobile/app/alerts.tsx`:

```typescript
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useFollows } from '../hooks/useFollows'
import { useAppStore } from '../lib/store'

const TYPE_ICONS: Record<string, string> = {
  politician: '👤',
  state: '🗺️',
  party: '🏛️',
}

export default function AlertsScreen() {
  const userId = useAppStore((s) => s.userId)
  const { follows, loading, toggleFollow } = useFollows()

  if (!userId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Alerts</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>Sign in to use alerts</Text>
          <Text style={styles.emptyBody}>Follow politicians, states, and parties to get notified when they appear in election news.</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/account/login')}>
            <Text style={styles.loginBtnText}>Sign In / Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Alerts</Text>
        <Text style={styles.headerSub}>{follows.length} following</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1e3a5f" />
        </View>
      ) : follows.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔕</Text>
          <Text style={styles.emptyTitle}>No alerts yet</Text>
          <Text style={styles.emptyBody}>
            Tap the 🔕 bell icon next to any politician in the Election Center to start following them.
          </Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/polls')}>
            <Text style={styles.loginBtnText}>Browse Election Center</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionLabel}>YOU'RE FOLLOWING</Text>
          {follows.map(follow => (
            <View key={follow.id} style={styles.followRow}>
              <Text style={styles.followIcon}>{TYPE_ICONS[follow.entityType] ?? '⚡'}</Text>
              <View style={styles.followInfo}>
                <Text style={styles.followName}>{follow.entityName}</Text>
                <Text style={styles.followType}>{follow.entityType}</Text>
              </View>
              <TouchableOpacity
                style={styles.unfollowBtn}
                onPress={() => toggleFollow(follow.entityType as any, follow.entityId, follow.entityName)}
              >
                <Text style={styles.unfollowText}>Unfollow</Text>
              </TouchableOpacity>
            </View>
          ))}
          <Text style={styles.note}>
            You'll get a notification when these appear in election news.
          </Text>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#1e3a5f', padding: 20, paddingTop: 52 },
  backBtn: { marginBottom: 10 },
  backText: { color: '#93c5fd', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 2 },
  headerSub: { fontSize: 13, color: '#93c5fd' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e3a5f', marginBottom: 8, textAlign: 'center' },
  emptyBody: { fontSize: 14, color: '#64748b', lineHeight: 21, textAlign: 'center', marginBottom: 24 },
  loginBtn: { backgroundColor: '#1e3a5f', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 48 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 12 },
  followRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  followIcon: { fontSize: 24, marginRight: 12 },
  followInfo: { flex: 1 },
  followName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  followType: { fontSize: 12, color: '#64748b', textTransform: 'capitalize', marginTop: 2 },
  unfollowBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
  unfollowText: { fontSize: 12, fontWeight: '600', color: '#dc2626' },
  note: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 16, lineHeight: 18 },
})
```

- [ ] **Step 2: Register alerts screen in _layout.tsx**

In `mobile/app/_layout.tsx`, add the alerts screen to the Stack:

```typescript
<Stack.Screen name="alerts" options={{ headerShown: false }} />
```

- [ ] **Step 3: Add My Alerts to home screen**

In `mobile/app/index.tsx`, add to the `FEATURE_CARDS` array:

```typescript
{ icon: '🔔', label: 'My Alerts', sub: 'Follow politicians & get news alerts', route: '/alerts' as const, accent: '#b45309' },
```

- [ ] **Step 4: TypeScript check**

```bash
cd /home/imran/Documents/Imaan\ Ali\ Folder/FirstApp/mobile
npx tsc --noEmit 2>&1 | head -40
```

Fix any errors.

- [ ] **Step 5: Commit**

```bash
cd /home/imran/Documents/Imaan\ Ali\ Folder/FirstApp
git add mobile/app/alerts.tsx mobile/app/_layout.tsx mobile/app/index.tsx
git commit -m "feat(mobile): add My Alerts screen and home screen card"
```
