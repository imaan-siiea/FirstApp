import { useState } from 'react'
import { View, Text, SectionList, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { api } from '../lib/api'
import { UsMap } from '../components/UsMap'

const PARTY_COLORS: Record<string, string> = {
  Democratic: '#2563eb', Republican: '#dc2626',
  Independent: '#7c3aed', Libertarian: '#f59e0b', Green: '#16a34a',
}

function ElectionCard({ election }: { election: any }) {
  const today = new Date()
  const day = new Date(election.electionDay + 'T12:00:00')
  const daysAway = Math.ceil((day.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isNational = !election.stateCode
  const scope = election.stateCode ?? 'National'

  return (
    <View style={[styles.card, isNational && styles.cardNational]}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardName}>{election.name}</Text>
        <Text style={styles.cardDate}>
          {day.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.scopeBadge, isNational ? styles.scopeNational : styles.scopeState]}>
          <Text style={styles.scopeText}>{scope}</Text>
        </View>
        {daysAway > 0 && <Text style={styles.daysAway}>{daysAway}d away</Text>}
      </View>
    </View>
  )
}

function RepCard({ rep }: { rep: any }) {
  const color = PARTY_COLORS[rep.party] ?? '#64748b'
  return (
    <View style={[styles.repCard, { borderLeftColor: color }]}>
      <View style={styles.repBody}>
        <Text style={styles.repName}>{rep.name}</Text>
        <Text style={styles.repMeta}>{rep.title} · District {rep.district}</Text>
      </View>
      <View style={[styles.partyDot, { backgroundColor: color }]}>
        <Text style={styles.partyInitial}>{rep.party.slice(0, 1)}</Text>
      </View>
    </View>
  )
}

export default function ElectionsScreen() {
  const [selectedState, setSelectedState] = useState<string | null>(null)

  const { data: electionsData, isLoading: electionsLoading, isError, refetch } = useQuery({
    queryKey: ['elections-all'],
    queryFn: () => api.getElections(),
    staleTime: 1000 * 60 * 30,
  })

  const { data: repsData, isLoading: repsLoading } = useQuery({
    queryKey: ['representatives', selectedState],
    queryFn: () => api.getRepresentatives(selectedState!),
    enabled: !!selectedState,
    staleTime: 1000 * 60 * 60,
  })

  const today = new Date()
  const allElections = electionsData?.elections ?? []

  const filtered = selectedState
    ? allElections.filter((e: any) => e.stateCode === selectedState || e.stateCode === null)
    : allElections

  const upcoming = filtered
    .filter((e: any) => new Date(e.electionDay) > today)
    .sort((a: any, b: any) => a.electionDay.localeCompare(b.electionDay))

  const recent = filtered
    .filter((e: any) => new Date(e.electionDay) <= today)
    .sort((a: any, b: any) => b.electionDay.localeCompare(a.electionDay))

  const senators = (repsData?.representatives ?? []).filter((r: any) => r.chamber === 'upper')
  const houseReps = (repsData?.representatives ?? []).filter((r: any) => r.chamber === 'lower')

  const sections: { title: string; data: any[]; type: string }[] = [
    ...(upcoming.length > 0 ? [{ title: `Upcoming (${upcoming.length})`, data: upcoming, type: 'election' }] : []),
    ...(recent.length > 0 ? [{ title: `Recent — Last 2 Years (${recent.length})`, data: recent, type: 'election' }] : []),
    ...(senators.length > 0 ? [{ title: `${selectedState} Senate (${senators.length})`, data: senators, type: 'rep' }] : []),
    ...(houseReps.length > 0 ? [{ title: `${selectedState} House (${houseReps.length})`, data: houseReps, type: 'rep' }] : []),
  ]

  const isLoading = electionsLoading || (!!selectedState && repsLoading)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Elections</Text>
        <Text style={styles.headerSubtitle}>
          {selectedState ? `Showing: ${selectedState} + National` : 'Tap a state to filter'}
        </Text>
      </View>

      <UsMap selectedState={selectedState} onSelectState={setSelectedState} />

      <View style={styles.legend}>
        <View style={[styles.legendDot, styles.scopeNational]} /><Text style={styles.legendLabel}>National</Text>
        <View style={[styles.legendDot, styles.scopeState, { marginLeft: 16 }]} /><Text style={styles.legendLabel}>State</Text>
        {selectedState && (
          <Text style={[styles.legendLabel, { marginLeft: 16, color: '#1e3a5f', fontWeight: '700' }]}>
            + {selectedState} legislators
          </Text>
        )}
      </View>

      {isLoading && (
        <View style={styles.center}><ActivityIndicator size="large" color="#1e3a5f" /></View>
      )}

      {isError && (
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load elections.</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !isError && (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item, section }: any) =>
            section.type === 'election'
              ? <ElectionCard election={item} />
              : <RepCard rep={item} />
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No data available{selectedState ? ` for ${selectedState}` : ''}.</Text>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  header: { backgroundColor: '#1e3a5f', padding: 20, paddingTop: 52, paddingBottom: 16 },
  backBtn: { marginBottom: 10 },
  backText: { color: '#93c5fd', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: '#93c5fd' },

  legend: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  legendLabel: { fontSize: 12, color: '#64748b' },

  sectionHeader: {
    fontSize: 12, fontWeight: '700', color: '#475569',
    textTransform: 'uppercase', letterSpacing: 0.6,
    paddingHorizontal: 2, paddingTop: 16, paddingBottom: 8,
  },
  list: { padding: 16, paddingBottom: 40 },

  // Election card
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    borderLeftWidth: 3, borderLeftColor: '#e2e8f0',
  },
  cardNational: { borderLeftColor: '#1e3a5f' },
  cardLeft: { flex: 1, marginRight: 10 },
  cardName: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 3, lineHeight: 20 },
  cardDate: { fontSize: 12, color: '#64748b' },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  scopeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  scopeNational: { backgroundColor: '#1e3a5f' },
  scopeState: { backgroundColor: '#0891b2' },
  scopeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  daysAway: { fontSize: 11, color: '#16a34a', fontWeight: '700' },

  // Rep card
  repCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, marginBottom: 8,
    borderLeftWidth: 4, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  repBody: { flex: 1, padding: 12 },
  repName: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  repMeta: { fontSize: 12, color: '#64748b' },
  partyDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  partyInitial: { color: '#fff', fontWeight: '800', fontSize: 14 },

  errorText: { color: '#64748b', fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: '#1e3a5f', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyText: { color: '#94a3b8', fontSize: 15, textAlign: 'center', marginTop: 48 },
})
