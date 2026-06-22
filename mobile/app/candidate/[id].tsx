import { useState } from 'react'
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  Linking, StyleSheet, ActivityIndicator,
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
    if (!candidate) return
    router.push({ pathname: '/chat', params: { candidateName: candidate.name } })
  }

  return (
    <View style={styles.container}>
      {/* Gradient header */}
      <View style={styles.header} />

      {/* Photo overlaps header */}
      <View style={styles.photoWrap}>
        {candidate.photoUrl ? (
          <Image source={{ uri: candidate.photoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.initial}>{candidate.name[0]}</Text>
          </View>
        )}
      </View>

      {/* Name + party beside photo */}
      <View style={styles.nameArea}>
        <Text style={styles.name} numberOfLines={1}>{candidate.name}</Text>
        <Text style={styles.office}>
          {candidate.office}{candidate.state ? ` · ${candidate.state.toUpperCase()}` : ''}
        </Text>
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

      {/* Overview tab */}
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
            <TouchableOpacity style={styles.link} onPress={() => Linking.openURL(candidate.websiteUrl)}>
              <Text style={styles.linkText}>🌐 Official Website</Text>
            </TouchableOpacity>
          )}

          <View style={styles.sourceBox}>
            <Text style={styles.sourceTitle}>Sources</Text>
            {candidate.sources?.map((s: any, i: number) => (
              <Text key={i} style={styles.sourceItem}>
                • {s.name} — {new Date(s.fetchedAt).toLocaleDateString()}
              </Text>
            ))}
            <Text style={styles.disclaimer}>
              VoterIQ is nonpartisan. Information sourced from official civic databases.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Positions tab */}
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

      {/* Compare tab */}
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

  header: { height: HEADER_HEIGHT, backgroundColor: '#1e3a5f' },

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
