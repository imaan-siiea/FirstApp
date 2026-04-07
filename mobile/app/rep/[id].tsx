import { useState } from 'react'
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Linking,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'

const PARTY_COLORS: Record<string, string> = {
  Democratic: '#1d4ed8', Democrat: '#1d4ed8',
  Republican: '#b91c1c',
  Independent: '#7c3aed',
  Libertarian: '#b45309',
  Green: '#15803d',
}

const CHAMBER_LABELS: Record<string, string> = {
  upper:      'State Senate',
  lower:      'State House of Representatives',
  us_senate:  'U.S. Senate',
  governor:   'Governor',
}

const POLICY_ICONS: [string, string][] = [
  ['education', '🎓'], ['school', '🎓'],
  ['health', '🏥'], ['medicaid', '🏥'], ['medical', '🏥'],
  ['economy', '💼'], ['business', '💼'], ['job', '💼'],
  ['environment', '🌿'], ['climate', '🌿'], ['energy', '⚡'],
  ['public safety', '🛡️'], ['crime', '🛡️'], ['law enforcement', '🛡️'],
  ['infrastructure', '🏗️'], ['transport', '🚗'],
  ['tax', '💰'], ['budget', '💰'], ['fiscal', '💰'],
  ['agriculture', '🌾'], ['farm', '🌾'],
  ['veteran', '🎖️'], ['military', '🎖️'],
  ['housing', '🏠'], ['homeless', '🏠'],
  ['immigration', '🌍'],
  ['technology', '💻'], ['innovation', '💻'],
]

function getPolicyIcon(p: string): string {
  const lower = p.toLowerCase()
  for (const [key, icon] of POLICY_ICONS) {
    if (lower.includes(key)) return icon
  }
  return '⚖️'
}

const TABS = ['Overview', 'Positions', 'Ask AI'] as const
type Tab = typeof TABS[number]
const HEADER_HEIGHT = 120

// Small inline spinner shown while AI content loads
function InlineLoader({ color }: { color: string }) {
  return (
    <View style={styles.inlineLoader}>
      <ActivityIndicator size="small" color={color} />
      <Text style={[styles.inlineLoaderText, { color }]}>Loading profile…</Text>
    </View>
  )
}

export default function RepScreen() {
  const params = useLocalSearchParams<{
    name: string; party: string; title: string; chamber: string
    district: string; stateCode: string; imageUrl: string; profileUrl: string
  }>()

  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const partyColor = PARTY_COLORS[params.party] ?? '#1e3a5f'
  const chamberLabel = CHAMBER_LABELS[params.chamber] ?? params.title

  // Profile loads in background — screen renders immediately with static info
  const { data: profile, isLoading } = useQuery({
    queryKey: ['rep-profile', params.name, params.stateCode, params.chamber, params.party],
    queryFn: () => api.getRepProfile(params.name, params.stateCode, params.chamber, params.party),
    staleTime: 1000 * 60 * 60 * 24,
    retry: 1,
  })

  function handleAskAI() {
    const repContext = {
      name: params.name,
      party: params.party,
      chamber: params.chamber,
      district: params.district,
      state: params.stateCode,
      ...(profile ?? {}),
    }
    router.push({
      pathname: '/chat',
      params: { candidateName: params.name, repContext: JSON.stringify(repContext) },
    })
  }

  return (
    <View style={styles.container}>
      {/* Party-colored header — renders immediately */}
      <View style={[styles.header, { backgroundColor: partyColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerChamber}>{chamberLabel.toUpperCase()}</Text>
      </View>

      {/* Photo — renders immediately from URL in params */}
      <View style={styles.photoWrap}>
        {params.imageUrl ? (
          <Image source={{ uri: params.imageUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={[styles.initial, { color: partyColor }]}>{params.name?.[0] ?? '?'}</Text>
          </View>
        )}
      </View>

      {/* Name + meta — renders immediately from params */}
      <View style={styles.nameArea}>
        <Text style={styles.name} numberOfLines={2}>{params.name}</Text>
        <Text style={styles.districtText}>
          {params.district ? `District ${params.district} · ` : ''}{params.stateCode}
        </Text>
        <View style={[styles.partyBadge, { backgroundColor: partyColor }]}>
          <Text style={styles.partyBadgeText}>{params.party}</Text>
        </View>
      </View>

      {/* Tabs — renders immediately */}
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => tab === 'Ask AI' ? handleAskAI() : setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && tab !== 'Ask AI' && { color: partyColor }]}>
              {tab === 'Ask AI' ? '💬 Ask AI' : tab}
            </Text>
            {activeTab === tab && tab !== 'Ask AI' && (
              <View style={[styles.tabIndicator, { backgroundColor: partyColor }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Scrollable content — tab sections each handle their own loading inline */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'Overview' && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: partyColor }]}>BACKGROUND</Text>
              {isLoading
                ? <InlineLoader color={partyColor} />
                : <Text style={styles.bio}>{profile?.background ?? 'Background information unavailable.'}</Text>
              }
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: partyColor }]}>FUN FACTS</Text>
              {isLoading
                ? <InlineLoader color={partyColor} />
                : profile?.funFacts?.length
                  ? profile.funFacts.map((fact, i) => (
                      <View key={i} style={styles.factRow}>
                        <Text style={[styles.factBullet, { color: partyColor }]}>✦</Text>
                        <Text style={styles.factText}>{fact}</Text>
                      </View>
                    ))
                  : null
              }
            </View>

            {params.profileUrl ? (
              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: partyColor }]}
                onPress={() => Linking.openURL(params.profileUrl)}
              >
                <Text style={[styles.outlineBtnText, { color: partyColor }]}>🔗 Official Profile</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={[styles.aiButton, { backgroundColor: partyColor }]} onPress={handleAskAI}>
              <Text style={styles.aiButtonText}>💬 Ask AI about {params.name.split(' ').slice(-1)[0]}</Text>
            </TouchableOpacity>

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>⚠️ AI-generated profile for informational purposes. Verify with official sources.</Text>
            </View>
          </>
        )}

        {/* ── POSITIONS TAB ── */}
        {activeTab === 'Positions' && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: partyColor }]}>KEY POLICY AREAS</Text>
              {isLoading
                ? <InlineLoader color={partyColor} />
                : profile?.policies?.length
                  ? profile.policies.map((p, i) => (
                      <View key={i} style={styles.policyCard}>
                        <Text style={styles.policyIcon}>{getPolicyIcon(p)}</Text>
                        <Text style={styles.policyText}>{p}</Text>
                      </View>
                    ))
                  : <Text style={styles.emptyHint}>No policy data available — try Ask AI.</Text>
              }
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: partyColor }]}>LEGISLATIVE HIGHLIGHTS</Text>
              {isLoading
                ? <InlineLoader color={partyColor} />
                : profile?.highlights?.length
                  ? profile.highlights.map((h, i) => (
                      <View key={i} style={[styles.highlightCard, { borderLeftColor: partyColor }]}>
                        <Text style={styles.highlightText}>{h}</Text>
                      </View>
                    ))
                  : <Text style={styles.emptyHint}>No highlight data available — try Ask AI.</Text>
              }
            </View>

            <TouchableOpacity style={[styles.aiButton, { backgroundColor: partyColor }]} onPress={handleAskAI}>
              <Text style={styles.aiButtonText}>💬 Ask AI about their positions</Text>
            </TouchableOpacity>

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>⚠️ AI-generated — verify with official voting records.</Text>
            </View>
          </>
        )}

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: { height: HEADER_HEIGHT, paddingTop: 54, paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { marginBottom: 6 },
  backText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  headerChamber: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.65)', letterSpacing: 1.2 },

  photoWrap: { position: 'absolute', top: HEADER_HEIGHT - 40, left: 20, zIndex: 10 },
  photo: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#f8fafc' },
  photoPlaceholder: { backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 32, fontWeight: '900' },

  nameArea: { paddingTop: 10, paddingLeft: 118, paddingRight: 16, paddingBottom: 14, backgroundColor: '#f8fafc' },
  name: { fontSize: 17, fontWeight: '800', color: '#0f172a', lineHeight: 22, marginBottom: 3 },
  districtText: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  partyBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  partyBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fff' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 11, position: 'relative' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  tabIndicator: { position: 'absolute', bottom: 0, left: 6, right: 6, height: 2.5, borderRadius: 2 },

  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 48 },

  section: { marginBottom: 22 },
  sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 10 },

  inlineLoader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  inlineLoaderText: { fontSize: 13, fontWeight: '500' },

  bio: { fontSize: 14, color: '#475569', lineHeight: 23 },

  factRow: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'flex-start' },
  factBullet: { fontSize: 10, marginTop: 5 },
  factText: { fontSize: 14, color: '#475569', lineHeight: 21, flex: 1 },

  policyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  policyIcon: { fontSize: 24 },
  policyText: { fontSize: 14, fontWeight: '500', color: '#0f172a', flex: 1, lineHeight: 20 },

  highlightCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  highlightText: { fontSize: 14, color: '#475569', lineHeight: 21 },

  emptyHint: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic' },

  outlineBtn: { borderWidth: 1.5, borderRadius: 12, padding: 13, alignItems: 'center', marginBottom: 10 },
  outlineBtnText: { fontSize: 14, fontWeight: '600' },

  aiButton: { borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 4, marginBottom: 14 },
  aiButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  disclaimer: { padding: 12, backgroundColor: '#fef3c7', borderRadius: 10 },
  disclaimerText: { fontSize: 11, color: '#78350f', lineHeight: 16 },
})
