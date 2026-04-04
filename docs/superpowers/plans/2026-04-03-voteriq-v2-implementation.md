# VoterIQ v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich candidate profiles with real photos, sourced positions, and a Compare tab; add a How to Vote guide screen; and ship to production on Coolify.

**Architecture:** Backend gains a `candidateEnrichment.ts` service that fetches Congress.gov photos and AI-extracted positions in parallel, extending `CandidateProfile`. Mobile replaces the single candidate screen with a 4-tab layout (Overview / Positions / Compare / Ask AI). How to Vote is a static screen driven by existing `stateRegistration` backend data.

**Tech Stack:** Fastify + TypeScript (backend) · Expo Router + React Native (mobile) · Congress.gov Bioguide API (photos) · Groq llama-3.3-70b (AI position extraction fallback) · Existing Redis cache · Coolify + Docker Compose (production)

---

## File Map

### Backend — new/modified files
| File | Action | Purpose |
|------|--------|---------|
| `backend/src/services/candidateEnrichment.ts` | **Create** | Photo lookup (Congress.gov → Ballotpedia fallback) + position extraction (AI fallback) |
| `backend/src/services/candidates.ts` | **Modify** | Call enrichment service; extend `CandidateProfile` type with `confidenceTier` per position |
| `backend/src/routes/candidates.ts` | **Modify** | Add `GET /candidates/by-office` endpoint for Compare tab |
| `backend/.env.example` | **Modify** | Add `VOTESMART_API_KEY` placeholder |

### Mobile — new/modified files
| File | Action | Purpose |
|------|--------|---------|
| `mobile/app/candidate/[id].tsx` | **Rewrite** | Option B layout: gradient header, photo overlap, 4 tabs |
| `mobile/components/PartyBadge.tsx` | **Create** | Party-colored badge component (Democrat/Republican/Independent/Unknown) |
| `mobile/components/PositionRow.tsx` | **Create** | Icon + issue + position + source row used in Positions tab |
| `mobile/components/CompareTab.tsx` | **Create** | Side-by-side candidate comparison, same-office picker |
| `mobile/app/how-to-vote.tsx` | **Create** | How to Vote guide screen |
| `mobile/app/index.tsx` | **Modify** | Add "How to Vote" button |
| `mobile/app/ballot.tsx` | **Modify** | Add "How to Vote" link in header |
| `mobile/lib/api.ts` | **Modify** | Add `getCandidatesByOffice(office, address)` call |

---

## Task 1: Extend CandidateProfile type and add enrichment service skeleton

**Files:**
- Create: `backend/src/services/candidateEnrichment.ts`
- Modify: `backend/src/services/candidates.ts`

- [ ] **Step 1: Update `CandidateProfile` interface in `candidates.ts`**

Replace the existing `positions` type and add `confidenceTier`:

```typescript
// In backend/src/services/candidates.ts — update the interface
export interface CandidatePosition {
  issue: string
  position: string
  source: string
  year: string
  confidence: 'high' | 'medium' | 'low'
}

export interface CandidateProfile {
  id: string
  name: string
  office: string
  state: string
  district?: string
  party?: string
  bio?: string
  photoUrl?: string
  websiteUrl?: string
  positions: CandidatePosition[]
  sources: { name: string; url: string; fetchedAt: string }[]
  dataConfidence: 'high' | 'medium' | 'low'
  lastVerified: string
}
```

- [ ] **Step 2: Create `candidateEnrichment.ts` with photo lookup**

Create `backend/src/services/candidateEnrichment.ts`:

```typescript
import got from 'got'
import { cacheGet, cacheSet } from '../cache'

const PHOTO_CACHE_TTL = 60 * 60 * 24 * 7 // 7 days — photos rarely change

// Congress.gov Bioguide photo URL pattern
function bioguidPhotoUrl(bioguidId: string): string {
  return `https://bioguide.congress.gov/photo/${bioguidId}.jpg`
}

// Fuzzy match a candidate name to a Bioguide ID using the Congress.gov members API
async function lookupBioguidId(name: string): Promise<string | null> {
  const cacheKey = `bioguide:lookup:${name.toLowerCase().replace(/\s+/g, '-')}`
  const cached = await cacheGet<string>(cacheKey)
  if (cached) return cached

  try {
    const [last, ...firstParts] = name.trim().split(' ').reverse()
    const first = firstParts.reverse().join(' ')
    const response = await got('https://api.congress.gov/v3/member', {
      searchParams: {
        format: 'json',
        limit: 5,
        // No auth key needed for basic search
      },
    }).json<any>()
    // Search by name match in results
    const members: any[] = response.members ?? []
    const match = members.find((m: any) => {
      const fullName = `${m.name ?? ''}`.toLowerCase()
      return fullName.includes(last.toLowerCase()) && fullName.includes(first.toLowerCase())
    })
    if (!match?.bioguideId) return null
    await cacheSet(cacheKey, match.bioguideId, PHOTO_CACHE_TTL)
    return match.bioguideId
  } catch {
    return null
  }
}

export async function getEnrichedPhotoUrl(
  name: string,
  currentPhotoUrl?: string,
): Promise<string | undefined> {
  // If Google Civic already gave us a photo, use it
  if (currentPhotoUrl) return currentPhotoUrl

  const cacheKey = `enrich:photo:${name.toLowerCase().replace(/\s+/g, '-')}`
  const cached = await cacheGet<string>(cacheKey)
  if (cached) return cached === 'none' ? undefined : cached

  // Try Congress.gov Bioguide
  const bioguidId = await lookupBioguidId(name)
  if (bioguidId) {
    const url = bioguidPhotoUrl(bioguidId)
    try {
      // Verify the photo exists
      await got.head(url)
      await cacheSet(cacheKey, url, PHOTO_CACHE_TTL)
      return url
    } catch {
      // Photo not found for this ID
    }
  }

  // No photo found — cache the miss to avoid repeated lookups
  await cacheSet(cacheKey, 'none', 60 * 60 * 6)
  return undefined
}

export async function getAiExtractedPositions(
  name: string,
  office: string,
  bio: string,
): Promise<import('./candidates').CandidatePosition[]> {
  if (!bio || bio.length < 50) return []

  const cacheKey = `enrich:positions:${name.toLowerCase().replace(/\s+/g, '-')}`
  const cached = await cacheGet<import('./candidates').CandidatePosition[]>(cacheKey)
  if (cached) return cached

  try {
    const { default: Groq } = await import('groq-sdk')
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? 'placeholder' })

    const prompt = `Extract policy positions for ${name} (${office}) from this biography.
Return a JSON array (max 6 items). Each item: {"issue": string, "position": string, "year": string}.
Use only information explicitly stated in the bio. If nothing policy-related is mentioned, return [].
Issues to look for: Healthcare, Economy, Education, Immigration, Environment, Veterans, Gun Policy, Foreign Policy.

Biography:
${bio.slice(0, 1000)}`

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.choices[0]?.message?.content ?? '[]'
    // Extract JSON from response (model may wrap in markdown)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const raw: { issue: string; position: string; year?: string }[] = JSON.parse(jsonMatch[0])
    const positions: import('./candidates').CandidatePosition[] = raw.slice(0, 6).map(p => ({
      issue: p.issue,
      position: p.position,
      source: 'Ballotpedia (AI-extracted)',
      year: p.year ?? new Date().getFullYear().toString(),
      confidence: 'low' as const,
    }))

    await cacheSet(cacheKey, positions, 60 * 60 * 6)
    return positions
  } catch {
    return []
  }
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/candidateEnrichment.ts backend/src/services/candidates.ts
git commit -m "feat(backend): add candidateEnrichment service and extend CandidatePosition type"
```

---

## Task 2: Wire enrichment into candidate pipeline

**Files:**
- Modify: `backend/src/services/candidates.ts`

- [ ] **Step 1: Update `getCandidatesForBallot` to call enrichment in parallel**

Replace the existing `getCandidatesForBallot` function body in `backend/src/services/candidates.ts`:

```typescript
import { getBallotForAddress } from './civicApi'
import { getBallotpediaCandidate } from './ballotpedia'
import { getEnrichedPhotoUrl, getAiExtractedPositions } from './candidateEnrichment'

export async function getCandidatesForBallot(address: string): Promise<CandidateProfile[]> {
  const ballot = await getBallotForAddress(address)
  const allCandidates: {
    name: string; party?: string; candidateUrl?: string; photoUrl?: string; office: string; district: any
  }[] = []

  for (const contest of ballot.contests) {
    if (!contest.candidates) continue
    for (const c of contest.candidates) {
      allCandidates.push({ ...c, office: contest.office, district: contest.district })
    }
  }

  // Fetch bio + enriched photo + positions all in parallel per candidate
  const enriched = await Promise.all(
    allCandidates.map(async (c) => {
      const [bio, photoUrl, positions] = await Promise.all([
        getBallotpediaCandidate(c.name).catch(() => null),
        getEnrichedPhotoUrl(c.name, c.photoUrl).catch(() => c.photoUrl),
        Promise.resolve([] as CandidatePosition[]), // positions filled below after bio resolves
      ])

      const aiPositions = bio?.extract
        ? await getAiExtractedPositions(c.name, c.office, bio.extract).catch(() => [])
        : []

      const id = `civic:${c.name.toLowerCase().replace(/\s+/g, '-')}`
      return {
        id,
        name: c.name,
        office: c.office,
        state: c.district?.id?.split('/')[2] ?? '',
        party: c.party,
        bio: bio?.extract,
        photoUrl,
        websiteUrl: c.candidateUrl ?? bio?.fullurl,
        positions: aiPositions,
        sources: bio
          ? [{ name: 'Ballotpedia', url: bio.fullurl, fetchedAt: new Date().toISOString() }]
          : [],
        dataConfidence: bio ? ('medium' as const) : ('low' as const),
        lastVerified: new Date().toISOString(),
      } satisfies CandidateProfile
    })
  )

  return enriched
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Test the endpoint returns positions**

```bash
curl -s -X POST http://localhost:3000/candidates \
  -H "Content-Type: application/json" \
  -d '{"address": "100 Main St, Richmond, VA 23220"}' | python3 -m json.tool | head -c 1500
```

Expected: JSON with `candidates` array. Each candidate has `positions` array (may be empty if bio is thin) and `photoUrl` populated where found.

- [ ] **Step 4: Add `GET /candidates/by-office` for Compare tab**

In `backend/src/routes/candidates.ts`, add after existing routes:

```typescript
  app.get<{ Querystring: { office: string; address: string } }>('/candidates/by-office', {
    schema: {
      querystring: {
        type: 'object',
        required: ['office', 'address'],
        properties: {
          office: { type: 'string' },
          address: { type: 'string' },
        },
      },
    },
    handler: async (req, reply) => {
      try {
        const all = await getCandidatesForBallot(req.query.address)
        const forOffice = all.filter(c =>
          c.office.toLowerCase() === req.query.office.toLowerCase()
        )
        return { candidates: forOffice }
      } catch {
        return reply.code(503).send({ error: 'Candidate data temporarily unavailable' })
      }
    },
  })
```

- [ ] **Step 5: Add `getCandidatesByOffice` to mobile API client**

In `mobile/lib/api.ts`, add to the `api` object:

```typescript
  getCandidatesByOffice: (office: string, address: string) =>
    request<{ candidates: any[] }>(`/candidates/by-office?office=${encodeURIComponent(office)}&address=${encodeURIComponent(address)}`),
```

- [ ] **Step 6: TypeScript check + commit**

```bash
cd backend && npx tsc --noEmit
git add backend/src/services/candidates.ts backend/src/routes/candidates.ts mobile/lib/api.ts
git commit -m "feat(backend): wire enrichment pipeline; add by-office endpoint for Compare tab"
```

---

## Task 3: PartyBadge and PositionRow components

**Files:**
- Create: `mobile/components/PartyBadge.tsx`
- Create: `mobile/components/PositionRow.tsx`

- [ ] **Step 1: Create `PartyBadge.tsx`**

Create `mobile/components/PartyBadge.tsx`:

```typescript
import { View, Text, StyleSheet } from 'react-native'

const PARTY_COLORS: Record<string, string> = {
  democrat: '#2563eb',
  democratic: '#2563eb',
  republican: '#dc2626',
  independent: '#7c3aed',
  libertarian: '#f59e0b',
  green: '#16a34a',
}

function getPartyColor(party?: string): string {
  if (!party) return '#64748b'
  return PARTY_COLORS[party.toLowerCase()] ?? '#64748b'
}

interface Props {
  party?: string
}

export function PartyBadge({ party }: Props) {
  const color = getPartyColor(party)
  const label = party ?? 'Unknown'
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  text: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
})
```

- [ ] **Step 2: Create `PositionRow.tsx`**

Create `mobile/components/PositionRow.tsx`:

```typescript
import { View, Text, StyleSheet } from 'react-native'

const ISSUE_ICONS: Record<string, string> = {
  healthcare: '🏥',
  economy: '💼',
  education: '🎓',
  immigration: '🌎',
  environment: '🌿',
  veterans: '🎖️',
  'gun policy': '⚖️',
  'foreign policy': '🌐',
}

function getIcon(issue: string): string {
  return ISSUE_ICONS[issue.toLowerCase()] ?? '📋'
}

interface Position {
  issue: string
  position: string
  source: string
  year: string
  confidence: 'high' | 'medium' | 'low'
}

interface Props {
  position: Position
}

export function PositionRow({ position }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.icon}>{getIcon(position.issue)}</Text>
      <View style={styles.content}>
        <Text style={styles.issue}>{position.issue}</Text>
        <Text style={styles.text}>{position.position}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.source}>{position.source} · {position.year}</Text>
          {position.confidence === 'low' && (
            <Text style={styles.aiLabel}> · AI-inferred</Text>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  icon: { fontSize: 18, width: 24, textAlign: 'center', marginTop: 1 },
  content: { flex: 1 },
  issue: { fontSize: 12, fontWeight: '700', color: '#1e3a5f', marginBottom: 2 },
  text: { fontSize: 13, color: '#374151', lineHeight: 18 },
  metaRow: { flexDirection: 'row', marginTop: 3 },
  source: { fontSize: 11, color: '#94a3b8' },
  aiLabel: { fontSize: 11, color: '#f59e0b', fontStyle: 'italic' },
})
```

- [ ] **Step 3: Commit**

```bash
git add mobile/components/PartyBadge.tsx mobile/components/PositionRow.tsx
git commit -m "feat(mobile): add PartyBadge and PositionRow components"
```

---

## Task 4: CompareTab component

**Files:**
- Create: `mobile/components/CompareTab.tsx`

- [ ] **Step 1: Create `CompareTab.tsx`**

Create `mobile/components/CompareTab.tsx`:

```typescript
import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { PartyBadge } from './PartyBadge'

interface Position {
  issue: string
  position: string
  source: string
  year: string
  confidence: 'high' | 'medium' | 'low'
}

interface Candidate {
  id: string
  name: string
  office: string
  party?: string
  positions: Position[]
}

interface Props {
  currentCandidate: Candidate
  address: string
}

export function CompareTab({ currentCandidate, address }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['candidates-by-office', currentCandidate.office, address],
    queryFn: () => api.getCandidatesByOffice(currentCandidate.office, address),
  })

  const opponents = (data?.candidates ?? []).filter(c => c.id !== currentCandidate.id)
  const selected = opponents.find(c => c.id === selectedId)

  // Get all issues that appear in either candidate's positions
  const sharedIssues = selected
    ? Array.from(new Set([
        ...currentCandidate.positions.map(p => p.issue),
        ...selected.positions.map(p => p.issue),
      ])).filter(issue =>
        currentCandidate.positions.some(p => p.issue === issue) ||
        selected.positions.some(p => p.issue === issue)
      )
    : []

  if (isLoading) return (
    <View style={styles.center}><ActivityIndicator color="#1e3a5f" /></View>
  )

  if (opponents.length === 0) return (
    <View style={styles.center}>
      <Text style={styles.emptyText}>No other candidates found for {currentCandidate.office}.</Text>
    </View>
  )

  return (
    <ScrollView style={styles.container}>
      {/* Opponent picker */}
      <Text style={styles.pickerLabel}>Compare with:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
        {opponents.map(opp => (
          <TouchableOpacity
            key={opp.id}
            style={[styles.pickerChip, selectedId === opp.id && styles.pickerChipActive]}
            onPress={() => setSelectedId(opp.id === selectedId ? null : opp.id)}
          >
            <Text style={[styles.pickerChipText, selectedId === opp.id && styles.pickerChipTextActive]}>
              {opp.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selected && (
        <>
          {/* Column headers */}
          <View style={styles.headerRow}>
            <View style={styles.col}>
              <Text style={styles.colName} numberOfLines={1}>{currentCandidate.name}</Text>
              <PartyBadge party={currentCandidate.party} />
            </View>
            <View style={styles.divider} />
            <View style={styles.col}>
              <Text style={styles.colName} numberOfLines={1}>{selected.name}</Text>
              <PartyBadge party={selected.party} />
            </View>
          </View>

          {/* Shared issues */}
          {sharedIssues.length === 0 ? (
            <Text style={styles.emptyText}>No shared position data available for comparison.</Text>
          ) : (
            sharedIssues.map(issue => {
              const leftPos = currentCandidate.positions.find(p => p.issue === issue)
              const rightPos = selected.positions.find(p => p.issue === issue)
              return (
                <View key={issue} style={styles.issueBlock}>
                  <Text style={styles.issueTitle}>{issue}</Text>
                  <View style={styles.issueRow}>
                    <Text style={styles.issueText}>
                      {leftPos ? leftPos.position : '—'}
                    </Text>
                    <View style={styles.divider} />
                    <Text style={styles.issueText}>
                      {rightPos ? rightPos.position : '—'}
                    </Text>
                  </View>
                </View>
              )
            })
          )}

          <Text style={styles.disclaimer}>
            VoterIQ is nonpartisan. Positions sourced from Ballotpedia and VoteSmart.
          </Text>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: 200 },
  emptyText: { color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  pickerLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', margin: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  pickerRow: { paddingHorizontal: 16, marginBottom: 16 },
  pickerChip: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, backgroundColor: '#fff' },
  pickerChipActive: { backgroundColor: '#1e3a5f', borderColor: '#1e3a5f' },
  pickerChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  pickerChipTextActive: { color: '#fff' },
  headerRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, alignItems: 'flex-start' },
  col: { flex: 1 },
  colName: { fontSize: 13, fontWeight: '700', color: '#1e3a5f' },
  divider: { width: 1, backgroundColor: '#e2e8f0', marginHorizontal: 12, alignSelf: 'stretch' },
  issueBlock: { paddingHorizontal: 16, marginBottom: 12 },
  issueTitle: { fontSize: 11, fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  issueRow: { flexDirection: 'row', alignItems: 'flex-start' },
  issueText: { flex: 1, fontSize: 12, color: '#374151', lineHeight: 18 },
  disclaimer: { fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: 16, lineHeight: 16 },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/components/CompareTab.tsx
git commit -m "feat(mobile): add CompareTab component with same-office candidate picker"
```

---

## Task 5: Rebuild candidate profile screen (Option B layout)

**Files:**
- Rewrite: `mobile/app/candidate/[id].tsx`

- [ ] **Step 1: Rewrite the candidate profile screen**

Replace the entire contents of `mobile/app/candidate/[id].tsx`:

```typescript
import { useState } from 'react'
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  Linking, StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '../../lib/store'
import { api } from '../../lib/api'
import { PartyBadge } from '../../components/PartyBadge'
import { PositionRow } from '../../components/PositionRow'
import { CompareTab } from '../../components/CompareTab'

const TABS = ['Overview', 'Positions', 'Compare', 'Ask AI'] as const
type Tab = typeof TABS[number]

const HEADER_HEIGHT = 120

export default function CandidateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const address = useAppStore((s) => s.address)
  const [activeTab, setActiveTab] = useState<Tab>('Overview')

  const { data: candidate, isLoading } = useQuery({
    queryKey: ['candidate', id, address],
    queryFn: () => api.getCandidate(id, address ?? ''),
    enabled: !!address,
  })

  if (isLoading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#1e3a5f" /></View>
  )
  if (!candidate) return (
    <View style={styles.center}><Text style={styles.errorText}>Candidate not found.</Text></View>
  )

  function handleAskAI() {
    router.push({
      pathname: '/chat',
      params: { candidateName: candidate.name },
    })
  }

  return (
    <View style={styles.container}>
      {/* Gradient header */}
      <View style={styles.header} />

      {/* Photo — overlaps header */}
      <View style={styles.photoWrap}>
        {candidate.photoUrl ? (
          <Image source={{ uri: candidate.photoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.initial}>{candidate.name[0]}</Text>
          </View>
        )}
      </View>

      {/* Name row — sits beside photo overflow */}
      <View style={styles.nameArea}>
        <Text style={styles.name} numberOfLines={1}>{candidate.name}</Text>
        <Text style={styles.office}>{candidate.office}{candidate.state ? ` · ${candidate.state.toUpperCase()}` : ''}</Text>
        <PartyBadge party={candidate.party} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => tab === 'Ask AI' ? handleAskAI() : setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && tab !== 'Ask AI' && styles.tabTextActive]}>
              {tab}
            </Text>
            {activeTab === tab && tab !== 'Ask AI' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {candidate.bio ? (
            <>
              <Text style={styles.sectionTitle}>Biography</Text>
              <Text style={styles.bio}>{candidate.bio}</Text>
            </>
          ) : (
            <Text style={styles.emptyText}>No biography available for this candidate.</Text>
          )}

          {candidate.websiteUrl && (
            <TouchableOpacity
              style={styles.link}
              onPress={() => Linking.openURL(candidate.websiteUrl)}
            >
              <Text style={styles.linkText}>🌐 Official Website</Text>
            </TouchableOpacity>
          )}

          <View style={styles.sourceBox}>
            <Text style={styles.sourceTitle}>Sources</Text>
            {candidate.sources?.map((s: any, i: number) => (
              <Text key={i} style={styles.sourceItem}>• {s.name} — {new Date(s.fetchedAt).toLocaleDateString()}</Text>
            ))}
            <Text style={styles.disclaimer}>VoterIQ is nonpartisan. Information sourced from official civic databases.</Text>
          </View>
        </ScrollView>
      )}

      {activeTab === 'Positions' && (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {candidate.positions?.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Policy Positions</Text>
              {candidate.positions.map((p: any, i: number) => (
                <PositionRow key={i} position={p} />
              ))}
            </>
          ) : (
            <Text style={styles.emptyText}>No position data available. Try asking the AI.</Text>
          )}
          <TouchableOpacity style={styles.aiButton} onPress={handleAskAI}>
            <Text style={styles.aiButtonText}>💬 Ask AI about {candidate.name}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {activeTab === 'Compare' && address && (
        <CompareTab currentCandidate={candidate} address={address} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#64748b', fontSize: 16 },

  header: {
    height: HEADER_HEIGHT,
    backgroundColor: '#1e3a5f',
  },

  photoWrap: {
    position: 'absolute',
    top: HEADER_HEIGHT - 44,
    left: 18,
    zIndex: 10,
  },
  photo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: '#f8fafc',
  },
  photoPlaceholder: {
    backgroundColor: '#2d5a8e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: '#fff', fontSize: 32, fontWeight: 'bold' },

  nameArea: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingLeft: 122,
    paddingRight: 16,
    backgroundColor: '#f8fafc',
    minHeight: 56,
  },
  name: { fontSize: 17, fontWeight: '800', color: '#0f172a', lineHeight: 22 },
  office: { fontSize: 12, color: '#64748b', marginTop: 2 },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, position: 'relative' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  tabTextActive: { color: '#4f46e5' },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: '#4f46e5',
    borderRadius: 1,
  },

  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 32 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4f46e5',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  bio: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 16 },
  emptyText: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 32, lineHeight: 20 },

  link: { marginBottom: 16, padding: 14, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center' },
  linkText: { color: '#1e3a5f', fontSize: 14, fontWeight: '600' },

  aiButton: { backgroundColor: '#4f46e5', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  aiButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  sourceBox: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 14, marginTop: 8 },
  sourceTitle: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' },
  sourceItem: { fontSize: 12, color: '#64748b', marginBottom: 3 },
  disclaimer: { fontSize: 11, color: '#94a3b8', marginTop: 8, lineHeight: 16 },
})
```

- [ ] **Step 2: Update `api.getCandidate` to pass address**

In `mobile/lib/api.ts`, update the `getCandidate` call (it needs `address` as a query param for the backend):

```typescript
  getCandidate: (id: string, address: string) =>
    request<any>(`/candidates/${encodeURIComponent(id)}?address=${encodeURIComponent(address)}`),
```

- [ ] **Step 3: Reload the app in Expo Go and tap a candidate**

The candidate screen should now show:
- Gradient header (navy blue)
- Round photo overlapping into white area below
- Name and party badge (colored) to the right of photo
- Four tabs: Overview / Positions / Compare / Ask AI

- [ ] **Step 4: Commit**

```bash
git add mobile/app/candidate/[id].tsx mobile/lib/api.ts
git commit -m "feat(mobile): rebuild candidate profile with Option B layout and 4 tabs"
```

---

## Task 6: How to Vote screen

**Files:**
- Create: `mobile/app/how-to-vote.tsx`
- Modify: `mobile/app/index.tsx`
- Modify: `mobile/app/ballot.tsx`

- [ ] **Step 1: Create `how-to-vote.tsx`**

Create `mobile/app/how-to-vote.tsx`:

```typescript
import { ScrollView, View, Text, TouchableOpacity, Linking, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '../lib/store'
import { api } from '../lib/api'

interface Step {
  number: string
  title: string
  body: string
  link?: { label: string; url: string }
}

export default function HowToVoteScreen() {
  const address = useAppStore((s) => s.address)
  // Derive state code from address (e.g. "Austin, TX 78701" → "TX")
  const stateCode = address?.match(/\b([A-Z]{2})\b/)?.[1] ?? null

  const { data: regInfo, isLoading } = useQuery({
    queryKey: ['registration', stateCode],
    queryFn: () => api.getRegistration(stateCode!),
    enabled: !!stateCode,
  })

  const stateName = regInfo?.stateName ?? stateCode ?? 'Your State'

  const steps: Step[] = [
    {
      number: '1',
      title: 'Check Your Registration',
      body: `Make sure you're registered to vote in ${stateName}. Registration deadlines vary — check your status now so you're not caught off guard.`,
      link: regInfo?.checkRegistrationUrl
        ? { label: `Check Registration in ${stateName}`, url: regInfo.checkRegistrationUrl }
        : regInfo?.officialUrl
        ? { label: `${stateName} Voter Info`, url: regInfo.officialUrl }
        : undefined,
    },
    {
      number: '2',
      title: 'Find Your Polling Place',
      body: 'Your polling place is assigned by your registered address. Find it before Election Day so you know exactly where to go.',
      link: regInfo?.methods?.online?.url
        ? { label: `Find Polling Place in ${stateName}`, url: regInfo.methods.online.url }
        : undefined,
    },
    {
      number: '3',
      title: 'Know What to Bring',
      body: regInfo?.idRequired
        ? `In ${stateName}: ${regInfo.idRequired}`
        : 'ID requirements vary by state. Check your state\'s requirements before heading to the polls.',
    },
    {
      number: '4',
      title: 'Research Your Ballot',
      body: 'Use VoterIQ to review every candidate and measure on your ballot before you vote. A prepared voter is an informed voter.',
    },
    {
      number: '5',
      title: 'Vote Early or By Mail',
      body: `${stateName} offers absentee and early voting options. You don't have to vote on Election Day.`,
      link: regInfo?.methods?.mail
        ? { label: `Absentee Voting in ${stateName}`, url: regInfo.officialUrl }
        : undefined,
    },
    {
      number: '6',
      title: 'On Election Day',
      body: 'Polls are typically open 7am–8pm (varies by state). If you\'re in line when polls close, you have the right to vote. Bring your ID, your polling place address, and your ballot research.',
    },
  ]

  if (isLoading) return <View style={styles.center}><ActivityIndicator color="#1e3a5f" /></View>

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>How to Vote</Text>
        <Text style={styles.headerSubtitle}>in {stateName}</Text>
      </View>

      {steps.map((step) => (
        <View key={step.number} style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{step.number}</Text>
          </View>
          <View style={styles.stepBody}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepText}>{step.body}</Text>
            {step.link && (
              <TouchableOpacity onPress={() => Linking.openURL(step.link!.url)}>
                <Text style={styles.stepLink}>{step.link.label} →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.aiButton}
        onPress={() => router.push('/chat')}
      >
        <Text style={styles.aiButtonText}>💬 Ask AI Any Voting Question</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        VoterIQ is nonpartisan. Links go to official government sources.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  headerBox: {
    backgroundColor: '#1e3a5f',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 16, color: '#93c5fd', marginTop: 4 },

  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  stepNumberText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  stepText: { fontSize: 13, color: '#475569', lineHeight: 19 },
  stepLink: { fontSize: 13, color: '#4f46e5', fontWeight: '600', marginTop: 8 },

  aiButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  aiButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disclaimer: { fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 16 },
})
```

- [ ] **Step 2: Add "How to Vote" button to Home screen**

In `mobile/app/index.tsx`, add a third button after the "Register to Vote" button:

```typescript
      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/how-to-vote')}>
        <Text style={styles.secondaryButtonText}>How to Vote →</Text>
      </TouchableOpacity>
```

- [ ] **Step 3: Add How to Vote link to ballot screen header**

In `mobile/app/ballot.tsx`, add to the `addressBar` view after the "Change" button:

```typescript
        <TouchableOpacity onPress={() => router.push('/how-to-vote')}>
          <Text style={styles.howText}>How to Vote</Text>
        </TouchableOpacity>
```

And add to the stylesheet:

```typescript
  howText: { color: '#93c5fd', fontSize: 12, fontWeight: '600', marginLeft: 12 },
```

- [ ] **Step 4: Test in Expo Go**

- Home screen should show 3 buttons: "See My Ballot", "Register to Vote", "How to Vote"
- Tapping "How to Vote" shows a numbered step-by-step guide with the correct state name
- Links open the device browser to official state voter sites

- [ ] **Step 5: Commit**

```bash
git add mobile/app/how-to-vote.tsx mobile/app/index.tsx mobile/app/ballot.tsx
git commit -m "feat(mobile): add How to Vote guide screen with state-specific links"
```

---

## Task 7: Production launch — GitHub and Coolify

**Files:**
- No code changes — this is infrastructure setup

- [ ] **Step 1: Create GitHub repository**

On GitHub.com: New repository → name `voteriq` → Private → no README (we have one).

Then in the terminal on the developer machine:

```bash
cd "/home/imran/Documents/Imaan Ali Folder/FirstApp"
git remote add origin https://github.com/<your-org>/voteriq.git
git push -u origin main
```

- [ ] **Step 2: Add GitHub repository secrets**

Go to GitHub → voteriq repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|--------|-------|
| `COOLIFY_WEBHOOK_URL` | From Coolify: your resource → Deployments → Webhook URL |
| `COOLIFY_WEBHOOK_TOKEN` | From Coolify: same page |
| `EXPO_TOKEN` | From expo.dev → Account → Access Tokens |

- [ ] **Step 3: Configure Coolify resource**

In Coolify dashboard:
1. Projects → voteriq → New Resource → Docker Compose
2. Source: GitHub → select the `voteriq` repo
3. Docker Compose file path: `backend/docker-compose.yml`
4. Add all environment variables from `docs/devops-setup.md` Section 3c

- [ ] **Step 4: Run first deploy**

```bash
# On the Coolify server — run migrations before first deploy
cd /path/to/voteriq/backend
cp .env.example .env
# Edit .env with real values
npm install
npm run db:push
```

Then in Coolify: click **Deploy**. Watch the Deployments tab for green status.

- [ ] **Step 5: Verify production API**

```bash
curl https://api.voteriq.app/health
# Expected: {"status":"ok"}

curl -X POST https://api.voteriq.app/ballot \
  -H "Content-Type: application/json" \
  -d '{"address": "100 Main St, Richmond, VA 23220"}'
# Expected: ballot JSON
```

- [ ] **Step 6: Update mobile env for production**

```bash
# In mobile/.env
EXPO_PUBLIC_API_URL=https://api.voteriq.app
```

- [ ] **Step 7: Configure EAS Build for production**

```bash
cd mobile
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios --profile production
```

Submit to TestFlight first for internal testing before App Store submission.

- [ ] **Step 8: Commit production env update**

```bash
git add mobile/.env
git commit -m "chore: point mobile at production API for release build"
git push origin main
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Option B layout (gradient header, photo overlap, tabs) → Task 5
- [x] Party badge colors (Democrat/Republican/Independent) → Task 3 `PartyBadge`
- [x] Compare tab — same-office candidates only → Task 4 `CompareTab`
- [x] Ask AI tab navigates to chat pre-loaded → Task 5 (handleAskAI)
- [x] Congress.gov photos → Task 1 `getEnrichedPhotoUrl`
- [x] AI position extraction fallback with `confidence: 'low'` label → Task 1 `getAiExtractedPositions`
- [x] Per-position source + year display → Task 3 `PositionRow`
- [x] How to Vote screen with 6 steps → Task 6
- [x] How to Vote accessible from Home + Ballot → Task 6 Steps 2 & 3
- [x] Production launch sequence → Task 7
- [x] `EXPO_PUBLIC_API_URL` updated for production → Task 7 Step 6

**Type consistency:**
- `CandidatePosition` interface defined in Task 1, used in Tasks 3, 4, 5 — consistent
- `api.getCandidate(id, address)` updated in Task 5 Step 2, matches `getCandidateById` backend signature
- `api.getCandidatesByOffice` added in Task 2 Step 5, used in Task 4 — consistent
