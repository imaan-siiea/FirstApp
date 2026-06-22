import { useState, useRef, useEffect } from 'react'
import {
  View, Text, ScrollView, ActivityIndicator,
  TouchableOpacity, StyleSheet, Image, Linking, Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { api } from '../lib/api'
import { ElectoralMap } from '../components/ElectoralMap'
import { useFollows } from '../hooks/useFollows'
import { useAppStore } from '../lib/store'

// ─── Constants ────────────────────────────────────────────────────────────────

const RATING_META: Record<string, { bg: string; text: string; bar: string; label: string }> = {
  'Safe Republican':   { bg: '#991b1b', text: '#fff',    bar: '#dc2626', label: 'Safe R'    },
  'Likely Republican': { bg: '#b91c1c', text: '#fff',    bar: '#ef4444', label: 'Likely R'  },
  'Lean Republican':   { bg: '#dc2626', text: '#fff',    bar: '#f87171', label: 'Lean R'    },
  'Toss-Up':           { bg: '#92400e', text: '#fff',    bar: '#f59e0b', label: 'Toss-Up'   },
  'Lean Democratic':   { bg: '#1d4ed8', text: '#fff',    bar: '#60a5fa', label: 'Lean D'    },
  'Likely Democratic': { bg: '#1e40af', text: '#fff',    bar: '#3b82f6', label: 'Likely D'  },
  'Safe Democratic':   { bg: '#1e3a8a', text: '#fff',    bar: '#2563eb', label: 'Safe D'    },
}

const PARTY_COLORS: Record<string, string> = {
  Republican: '#dc2626', Democrat: '#2563eb', Democratic: '#2563eb',
  Independent: '#7c3aed', Libertarian: '#d97706', Green: '#16a34a',
}

const TREND_ICON: Record<string, string>  = { up: '▲', down: '▼', stable: '─' }
const TREND_COLOR: Record<string, string> = { up: '#16a34a', down: '#dc2626', stable: '#94a3b8' }

const SOURCE_COLORS: Record<string, string> = {
  'Politico':         '#e63946',
  'The Hill':         '#2563eb',
  'NBC News':         '#0f766e',
  'CBS News':         '#1a56db',
  'ABC News':         '#0050a0',
  'Roll Call':        '#7c3aed',
  'Google News':      '#1a73e8',
  'VoterIQ Analysis': '#0f766e',
}

// ─── Accordion ────────────────────────────────────────────────────────────────

interface AccordionProps {
  title: string
  subtitle: string
  accentColor: string
  icon: string
  isLoading?: boolean
  defaultOpen?: boolean
  children: React.ReactNode
}

function Accordion({ title, subtitle, accentColor, icon, isLoading, defaultOpen, children }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen ?? false)

  return (
    <View style={styles.accordion}>
      <TouchableOpacity
        style={[styles.accordionBar, { borderLeftColor: accentColor }]}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.8}
      >
        <View style={[styles.accordionIconWrap, { backgroundColor: accentColor + '20' }]}>
          <Text style={styles.accordionIcon}>{icon}</Text>
        </View>
        <View style={styles.accordionLabels}>
          <Text style={[styles.accordionTitle, { color: accentColor }]}>{title}</Text>
          <Text style={styles.accordionSub}>{subtitle}</Text>
        </View>
        {isLoading
          ? <ActivityIndicator size="small" color={accentColor} style={{ marginRight: 4 }} />
          : <View style={[styles.chevronPill, { backgroundColor: accentColor + '15' }]}>
              <Text style={[styles.accordionChevron, { color: accentColor }]}>{open ? '▲' : '▼'}</Text>
            </View>
        }
      </TouchableOpacity>

      {open && !isLoading && (
        <View style={styles.accordionBody}>
          {children}
        </View>
      )}
    </View>
  )
}

// ─── Federal Official Row ─────────────────────────────────────────────────────

function FederalRow({ official, chamber, stateCode, isFollowing, onToggleBell }: {
  official: any; chamber: string; stateCode: string
  isFollowing: boolean; onToggleBell: () => void
}) {
  const color = PARTY_COLORS[official.party] ?? '#64748b'

  function navigate() {
    router.push({
      pathname: '/rep/[id]',
      params: {
        id: official.name.replace(/\s+/g, '-').toLowerCase(),
        name: official.name,
        party: official.party ?? 'Independent',
        title: chamber === 'governor' ? 'Governor' : 'U.S. Senator',
        chamber,
        district: '',
        stateCode,
        imageUrl: official.imageUrl ?? '',
        profileUrl: '',
      },
    })
  }

  return (
    <TouchableOpacity style={styles.repRow} onPress={navigate} activeOpacity={0.75}>
      <View style={[styles.repAccent, { backgroundColor: color }]} />
      {official.imageUrl ? (
        <Image source={{ uri: official.imageUrl }} style={styles.repAvatar} />
      ) : (
        <View style={[styles.repAvatarFallback, { backgroundColor: color + '20' }]}>
          <Text style={[styles.repInitial, { color }]}>{official.name?.[0] ?? '?'}</Text>
        </View>
      )}
      <View style={styles.repInfo}>
        <Text style={styles.repName}>{official.name}</Text>
        <View style={styles.federalMetaRow}>
          <Text style={styles.repMeta}>{official.party}</Text>
          {official.upIn2026 && (
            <View style={styles.upBadge}>
              <Text style={styles.upBadgeText}>UP 2026</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={onToggleBell} style={styles.bellBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.bellIcon}>{isFollowing ? '🔔' : '🔕'}</Text>
      </TouchableOpacity>
      <View style={[styles.repArrowWrap, { backgroundColor: color + '12' }]}>
        <Text style={[styles.repChevron, { color }]}>›</Text>
      </View>
    </TouchableOpacity>
  )
}

// ─── Rep Row ─────────────────────────────────────────────────────────────────

function RepRow({ rep, stateCode, isFollowing, onToggleBell }: {
  rep: any; stateCode: string
  isFollowing: boolean; onToggleBell: () => void
}) {
  const color = PARTY_COLORS[rep.party] ?? '#64748b'

  function navigate() {
    router.push({
      pathname: '/rep/[id]',
      params: {
        id: String(rep.id ?? rep.name).replace(/\//g, '-'),
        name: rep.name,
        party: rep.party ?? 'Independent',
        title: rep.title ?? '',
        chamber: rep.chamber ?? 'lower',
        district: rep.district ?? '',
        stateCode,
        imageUrl: rep.imageUrl ?? '',
        profileUrl: rep.profileUrl ?? '',
      },
    })
  }

  return (
    <TouchableOpacity style={styles.repRow} onPress={navigate} activeOpacity={0.75}>
      <View style={[styles.repAccent, { backgroundColor: color }]} />
      {rep.imageUrl ? (
        <Image source={{ uri: rep.imageUrl }} style={styles.repAvatar} />
      ) : (
        <View style={[styles.repAvatarFallback, { backgroundColor: color + '20' }]}>
          <Text style={[styles.repInitial, { color }]}>{rep.name?.[0] ?? '?'}</Text>
        </View>
      )}
      <View style={styles.repInfo}>
        <Text style={styles.repName}>{rep.name}</Text>
        <Text style={styles.repMeta}>District {rep.district} · {rep.party}</Text>
      </View>
      <TouchableOpacity onPress={onToggleBell} style={styles.bellBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.bellIcon}>{isFollowing ? '🔔' : '🔕'}</Text>
      </TouchableOpacity>
      <View style={[styles.repArrowWrap, { backgroundColor: color + '12' }]}>
        <Text style={[styles.repChevron, { color }]}>›</Text>
      </View>
    </TouchableOpacity>
  )
}

// ─── News Card ────────────────────────────────────────────────────────────────

function NewsCard({ article }: { article: any }) {
  const isAnalysis = article.isAnalysis || article.source === 'VoterIQ Analysis'
  const sourceColor = SOURCE_COLORS[article.source] ?? '#64748b'

  function formatDate(str: string) {
    if (!str) return ''
    try {
      return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch { return '' }
  }

  const card = (
    <View style={[styles.newsCard, isAnalysis && styles.newsCardAnalysis]}>
      {/* Top meta row */}
      <View style={styles.newsTopRow}>
        <View style={[styles.sourcePill, { backgroundColor: sourceColor + '18', borderColor: sourceColor + '40' }]}>
          <View style={[styles.sourceDot, { backgroundColor: sourceColor }]} />
          <Text style={[styles.newsSource, { color: sourceColor }]}>{article.source}</Text>
          {isAnalysis && (
            <View style={[styles.analysisBadge, { backgroundColor: sourceColor }]}>
              <Text style={styles.analysisBadgeText}>AI</Text>
            </View>
          )}
        </View>
        {article.publishedAt ? (
          <Text style={styles.newsDate}>{formatDate(article.publishedAt)}</Text>
        ) : null}
      </View>

      {/* Title */}
      <Text style={styles.newsTitle} numberOfLines={3}>{article.title}</Text>

      {/* Description */}
      {article.description ? (
        <Text style={styles.newsDesc} numberOfLines={2}>{article.description}</Text>
      ) : null}

      {/* Footer */}
      {!isAnalysis && (
        <View style={styles.newsFooter}>
          <Text style={[styles.newsReadMore, { color: sourceColor }]}>Read article  →</Text>
        </View>
      )}
    </View>
  )

  if (isAnalysis || !article.url) return card

  return (
    <TouchableOpacity onPress={() => Linking.openURL(article.url)} activeOpacity={0.72}>
      {card}
    </TouchableOpacity>
  )
}

// ─── Race Card ────────────────────────────────────────────────────────────────

function RaceCard({ race }: { race: any }) {
  const rm = RATING_META[race.rating] ?? RATING_META['Toss-Up']
  const total = race.candidates.reduce((s: number, c: any) => s + c.polling, 0) || 100

  return (
    <View style={styles.raceCard}>
      {/* Rating header strip */}
      <View style={[styles.raceRatingStrip, { backgroundColor: rm.bg }]}>
        <Text style={[styles.raceRatingText, { color: rm.text }]}>{race.rating}</Text>
        <View style={styles.raceRatingRight}>
          <Text style={[styles.raceOfficeLabel, { color: rm.text + 'cc' }]}>{race.office}</Text>
          <Text style={[styles.raceCycleLabel, { color: rm.text + '99' }]}>{race.cycle}</Text>
        </View>
      </View>

      <View style={styles.raceBody}>
        {race.candidates.map((c: any, i: number) => {
          const color = PARTY_COLORS[c.party] ?? '#64748b'
          const pct = Math.round((c.polling / total) * 100)
          return (
            <View key={i} style={styles.candidateBlock}>
              {/* Name + polling row */}
              <View style={styles.candidateRow}>
                {/* Party dot + name */}
                <View style={styles.candidateLeft}>
                  <View style={[styles.partyDot, { backgroundColor: color }]} />
                  <View>
                    <Text style={styles.candidateName}>{c.name}</Text>
                    <Text style={[styles.partyLabel, { color }]}>{c.party}</Text>
                  </View>
                </View>
                {/* Polling number + trend */}
                <View style={styles.pollingChip}>
                  <Text style={[styles.trendIcon, { color: TREND_COLOR[c.trend] }]}>
                    {TREND_ICON[c.trend]}
                  </Text>
                  <Text style={[styles.pollingPct, { color }]}>{c.polling}%</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                <View style={[styles.barGlow, { width: `${pct}%` as any, backgroundColor: color }]} />
              </View>
            </View>
          )
        })}

        {race.rationale ? (
          <Text style={styles.rationale}>{race.rationale}</Text>
        ) : null}
      </View>
    </View>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon, title, sub, onRefresh, fetching, tint,
}: {
  icon: string; title: string; sub: string
  onRefresh: () => void; fetching: boolean; tint: string
}) {
  return (
    <View style={[styles.sectionHeaderCard, { borderLeftColor: tint }]}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSub}>{sub}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.refreshBtn, { backgroundColor: tint }, fetching && styles.refreshBtnDisabled]}
        onPress={onRefresh}
        disabled={fetching}
      >
        {fetching
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={styles.refreshText}>↻</Text>
        }
      </TouchableOpacity>
    </View>
  )
}

// ─── State View ───────────────────────────────────────────────────────────────

function StateView({ stateCode }: { stateCode: string }) {
  const userId = useAppStore((s) => s.userId)
  const { isFollowing, toggleFollow } = useFollows()

  function handleBell(entityType: 'politician' | 'state' | 'party', entityId: string, entityName: string) {
    if (!userId) {
      Alert.alert(
        'Sign in required',
        'Create a free account to follow politicians and get news alerts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/account/login') },
        ],
      )
      return
    }
    toggleFollow(entityType, entityId, entityName)
  }

  const { data: federalData } = useQuery({
    queryKey: ['federalOfficials', stateCode],
    queryFn: () => api.getFederalOfficials(stateCode),
    staleTime: 1000 * 60 * 60 * 24, // 24h — changes rarely
  })

  const { data: repsData, isLoading: repsLoading } = useQuery({
    queryKey: ['representatives', stateCode],
    queryFn: () => api.getRepresentatives(stateCode),
    staleTime: 1000 * 60 * 60,
  })

  const { data: pollData, isLoading: pollLoading, refetch: refetchPoll, isFetching: pollFetching } = useQuery({
    queryKey: ['polling', stateCode],
    queryFn: () => api.getPolling(stateCode),
    staleTime: 1000 * 60 * 60,
    retry: 1,
  })

  const { data: newsData, isLoading: newsLoading, refetch: refetchNews, isFetching: newsFetching } = useQuery({
    queryKey: ['electionNews', stateCode],
    queryFn: () => api.getElectionNews(stateCode),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  })

  const senators  = (repsData?.representatives ?? []).filter((r: any) => r.chamber === 'upper')
  const houseReps = (repsData?.representatives ?? []).filter((r: any) => r.chamber === 'lower')
  const stateName = pollData?.stateName ?? newsData?.stateName ?? stateCode

  return (
    <View style={styles.stateSection}>

      {/* State banner */}
      <View style={styles.stateBanner}>
        <View>
          <Text style={styles.stateLabel}>SELECTED STATE</Text>
          <Text style={styles.stateHeading}>{stateName}</Text>
        </View>
        <View style={styles.stateMeta}>
          <View style={styles.stateStatPill}>
            <Text style={styles.stateStatNum}>2</Text>
            <Text style={styles.stateStatLabel}>US Sen.</Text>
          </View>
          <View style={styles.stateStatPill}>
            <Text style={styles.stateStatNum}>{houseReps.length || '—'}</Text>
            <Text style={styles.stateStatLabel}>State</Text>
          </View>
        </View>
      </View>

      {/* US Senators accordion */}
      <Accordion
        title="U.S. Senators"
        subtitle={federalData ? federalData.senators.map((s: any) => s.name.split(' ').pop()).join(' · ') : 'Federal'}
        accentColor="#0f766e"
        icon="🇺🇸"
      >
        {(federalData?.senators ?? []).map((s: any, i: number) => (
          <FederalRow
            key={i}
            official={s}
            chamber="us_senate"
            stateCode={stateCode}
            isFollowing={isFollowing(s.name)}
            onToggleBell={() => handleBell('politician', s.name, s.name)}
          />
        ))}
      </Accordion>

      {/* Governor accordion */}
      <Accordion
        title="Governor"
        subtitle={federalData?.governor?.name ?? 'Executive'}
        accentColor="#7c3aed"
        icon="🏛️"
      >
        {federalData?.governor ? (
          <FederalRow
            official={federalData.governor}
            chamber="governor"
            stateCode={stateCode}
            isFollowing={isFollowing(federalData.governor.name)}
            onToggleBell={() => handleBell('politician', federalData.governor.name, federalData.governor.name)}
          />
        ) : (
          <Text style={styles.emptyMsg}>Loading…</Text>
        )}
      </Accordion>

      {/* State Senate accordion */}
      <Accordion
        title="State Senate"
        subtitle={repsLoading ? 'Loading…' : `${senators.length} senator${senators.length !== 1 ? 's' : ''}`}
        accentColor="#92400e"
        icon="🏛"
        isLoading={repsLoading}
        defaultOpen
      >
        {senators.length === 0
          ? <Text style={styles.emptyMsg}>No senators found for this state.</Text>
          : senators.map((rep: any) => (
              <RepRow
                key={rep.id ?? rep.name}
                rep={rep}
                stateCode={stateCode}
                isFollowing={isFollowing(rep.name)}
                onToggleBell={() => handleBell('politician', rep.name, rep.name)}
              />
            ))
        }
      </Accordion>

      {/* House accordion */}
      <Accordion
        title="State House"
        subtitle={repsLoading ? 'Loading…' : `${houseReps.length} representative${houseReps.length !== 1 ? 's' : ''}`}
        accentColor="#1e40af"
        icon="🏘"
        isLoading={repsLoading}
      >
        {houseReps.length === 0
          ? <Text style={styles.emptyMsg}>No representatives found for this state.</Text>
          : houseReps.map((rep: any) => (
              <RepRow
                key={rep.id ?? rep.name}
                rep={rep}
                stateCode={stateCode}
                isFollowing={isFollowing(rep.name)}
                onToggleBell={() => handleBell('politician', rep.name, rep.name)}
              />
            ))
        }
      </Accordion>

      {/* Race Analysis */}
      <View style={styles.pollSection}>
        <SectionHeader
          icon="📊"
          title="Race Analysis"
          sub="2026 Election Cycle · AI-powered estimates"
          onRefresh={refetchPoll}
          fetching={pollFetching}
          tint="#0f766e"
        />

        {pollLoading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#0f766e" />
            <Text style={styles.loadingText}>Analyzing races…</Text>
          </View>
        )}

        {!pollLoading && (pollData?.races ?? []).length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardIcon}>📭</Text>
            <Text style={styles.emptyCardText}>No 2026 races on record for {stateName} yet.</Text>
          </View>
        )}

        {!pollLoading && (pollData?.races ?? []).map((race: any, i: number) => (
          <RaceCard key={i} race={race} />
        ))}

        {!pollLoading && pollData?.outlook && (
          <View style={styles.outlookCard}>
            <Text style={styles.outlookLabel}>OVERALL OUTLOOK</Text>
            <Text style={styles.outlookText}>{pollData.outlook}</Text>
          </View>
        )}

        {!pollLoading && (
          <View style={styles.disclaimerCard}>
            <Text style={styles.disclaimerIcon}>⚠️</Text>
            <View style={styles.disclaimerBody}>
              <Text style={styles.disclaimerTitle}>About this data</Text>
              <Text style={styles.disclaimerText}>
                {pollData?.dataNote ? `${pollData.dataNote} ` : ''}AI estimates based on historical patterns — not live polling.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Latest News */}
      <View style={styles.newsSection}>
        <SectionHeader
          icon="📰"
          title="Latest News"
          sub="Politico · The Hill · NBC · Google News"
          onRefresh={refetchNews}
          fetching={newsFetching}
          tint="#475569"
        />

        {newsLoading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#475569" />
            <Text style={styles.loadingText}>Fetching headlines…</Text>
          </View>
        )}

        {!newsLoading && (newsData?.articles ?? []).length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardIcon}>📭</Text>
            <Text style={styles.emptyCardText}>No recent headlines found for {stateName}.</Text>
          </View>
        )}

        {!newsLoading && (newsData?.articles ?? []).map((a: any, i: number) => (
          <NewsCard key={i} article={a} />
        ))}
      </View>
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PollsScreen() {
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const insets = useSafeAreaInsets()
  const scrollRef = useRef<ScrollView>(null)

  // Auto-scroll to state content when a state is selected
  useEffect(() => {
    if (selectedState) {
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 400)
    }
  }, [selectedState])

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Election Center</Text>
          <Text style={styles.headerSubtitle}>2026 Race Tracker</Text>
        </View>
        {selectedState && (
          <TouchableOpacity onPress={() => setSelectedState(null)} style={styles.clearStateBtn}>
            <Text style={styles.clearStateText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Map */}
      <ElectoralMap selectedState={selectedState} onSelectState={setSelectedState} />

      {/* Body */}
      <ScrollView ref={scrollRef} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {!selectedState && (
          <View style={styles.promptCard}>
            <View style={styles.promptIconRow}>
              <Text style={styles.promptEmoji}>🗺️</Text>
            </View>
            <Text style={styles.promptTitle}>Tap Any State</Text>
            <Text style={styles.promptSub}>
              Explore Senate &amp; House members, 2026 race predictions, and the latest election headlines — all in one place.
            </Text>
            <View style={styles.featureGrid}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#fef9c3' }]}>
                  <Text style={styles.featureEmoji}>🏛️</Text>
                </View>
                <Text style={styles.featureLabel}>Senate</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#eff6ff' }]}>
                  <Text style={styles.featureEmoji}>🏛</Text>
                </View>
                <Text style={styles.featureLabel}>House</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#f0fdfa' }]}>
                  <Text style={styles.featureEmoji}>📊</Text>
                </View>
                <Text style={styles.featureLabel}>Polls</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#f8fafc' }]}>
                  <Text style={styles.featureEmoji}>📰</Text>
                </View>
                <Text style={styles.featureLabel}>News</Text>
              </View>
            </View>
          </View>
        )}

        {selectedState && <StateView stateCode={selectedState} />}

      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  // Header
  header: {
    backgroundColor: '#0d5c56',
    paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'flex-end', gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#0f766e',
  },
  backBtn: { paddingBottom: 2 },
  backText: { color: '#5eead4', fontSize: 14, fontWeight: '600' },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 12, color: '#5eead4', fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  clearStateBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#ffffff20', alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  clearStateText: { color: '#99f6e4', fontSize: 14, fontWeight: '700' },

  body: { padding: 14, paddingBottom: 60 },

  // Prompt card
  promptCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    alignItems: 'center', marginTop: 8,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  promptIconRow: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 2, borderColor: '#ccfbf1',
  },
  promptEmoji: { fontSize: 36 },
  promptTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 10, letterSpacing: -0.5 },
  promptSub: { fontSize: 14, color: '#64748b', lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  featureGrid: { flexDirection: 'row', gap: 12, width: '100%', justifyContent: 'center' },
  featureItem: { alignItems: 'center', gap: 6 },
  featureIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  featureEmoji: { fontSize: 24 },
  featureLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: 0.3 },

  // State section
  stateSection: { gap: 10 },
  stateBanner: {
    backgroundColor: '#0f766e', borderRadius: 16, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#0f766e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  stateLabel: { fontSize: 10, fontWeight: '800', color: '#5eead4', letterSpacing: 1.2, marginBottom: 4 },
  stateHeading: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  stateMeta: { flexDirection: 'row', gap: 8 },
  stateStatPill: {
    backgroundColor: '#ffffff20', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center',
  },
  stateStatNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
  stateStatLabel: { fontSize: 10, color: '#99f6e4', fontWeight: '600', marginTop: 2 },

  // Accordion
  accordion: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  accordionBar: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderLeftWidth: 4 },
  accordionIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  accordionIcon: { fontSize: 20 },
  accordionLabels: { flex: 1 },
  accordionTitle: { fontSize: 15, fontWeight: '800' },
  accordionSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  chevronPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  accordionChevron: { fontSize: 11, fontWeight: '800' },
  accordionBody: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingBottom: 6 },

  // Rep row
  repRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  repAccent: { width: 3, alignSelf: 'stretch' },
  repAvatar: { width: 42, height: 42, borderRadius: 21, margin: 10 },
  repAvatarFallback: { width: 42, height: 42, borderRadius: 21, margin: 10, alignItems: 'center', justifyContent: 'center' },
  repInitial: { fontSize: 17, fontWeight: '800' },
  repInfo: { flex: 1, paddingVertical: 13, paddingRight: 8 },
  repName: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 3 },
  repMeta: { fontSize: 12, color: '#64748b' },
  repArrowWrap: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  repChevron: { fontSize: 18, fontWeight: '700' },
  bellBtn: { padding: 6, marginLeft: 4 },
  bellIcon: { fontSize: 17 },
  emptyMsg: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: 20 },

  // Federal row extras
  federalMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, flexWrap: 'wrap', gap: 4 },
  upBadge: { backgroundColor: '#0f766e', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  upBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  // Section header card
  sectionHeaderCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderLeftWidth: 4,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sectionIcon: { fontSize: 22 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  sectionSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  refreshBtn: { borderRadius: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  refreshBtnDisabled: { backgroundColor: '#cbd5e1' },
  refreshText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Loading / empty
  loadingCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 28,
    alignItems: 'center', gap: 12,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  loadingText: { fontSize: 13, color: '#94a3b8' },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 24,
    alignItems: 'center', gap: 8,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  emptyCardIcon: { fontSize: 28 },
  emptyCardText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },

  // Polling
  pollSection: { gap: 10 },
  raceCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  raceRatingStrip: { padding: 12, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  raceRatingText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  raceRatingRight: { alignItems: 'flex-end' },
  raceOfficeLabel: { fontSize: 13, fontWeight: '700' },
  raceCycleLabel: { fontSize: 11, marginTop: 1 },
  raceBody: { padding: 16, gap: 12 },
  candidateBlock: { gap: 7 },
  candidateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  candidateLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  partyDot: { width: 10, height: 10, borderRadius: 5 },
  candidateName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  partyLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  pollingChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendIcon: { fontSize: 10, fontWeight: '800' },
  pollingPct: { fontSize: 18, fontWeight: '800' },
  barTrack: { height: 12, backgroundColor: '#e2e8f0', borderRadius: 6, overflow: 'hidden', position: 'relative' },
  barFill: { height: 12, borderRadius: 6 },
  barGlow: { position: 'absolute', top: 0, left: 0, height: 4, borderRadius: 2, opacity: 0.4 },
  rationale: { fontSize: 12, color: '#64748b', lineHeight: 20, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  outlookCard: {
    backgroundColor: '#ecfdf5', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#a7f3d0',
  },
  outlookLabel: { fontSize: 10, fontWeight: '800', color: '#065f46', letterSpacing: 1.2, marginBottom: 8 },
  outlookText: { fontSize: 14, color: '#064e3b', lineHeight: 22, fontWeight: '500' },
  disclaimerCard: {
    backgroundColor: '#fffbeb', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#fde68a', flexDirection: 'row', gap: 10, alignItems: 'flex-start',
  },
  disclaimerIcon: { fontSize: 16, marginTop: 1 },
  disclaimerBody: { flex: 1 },
  disclaimerTitle: { fontSize: 12, fontWeight: '800', color: '#92400e', marginBottom: 4 },
  disclaimerText: { fontSize: 12, color: '#78350f', lineHeight: 18 },

  // News
  newsSection: { gap: 10, marginBottom: 4 },
  newsCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  newsCardAnalysis: { backgroundColor: '#f0fdfa', borderWidth: 1, borderColor: '#99f6e4' },
  newsTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sourcePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1,
  },
  sourceDot: { width: 6, height: 6, borderRadius: 3 },
  newsSource: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  analysisBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginLeft: 2 },
  analysisBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  newsDate: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  newsTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', lineHeight: 22, marginBottom: 8 },
  newsDesc: { fontSize: 13, color: '#64748b', lineHeight: 19, marginBottom: 10 },
  newsFooter: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  newsReadMore: { fontSize: 13, fontWeight: '700' },
})
