import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, SectionList } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useAppStore } from '../lib/store'
import { api } from '../lib/api'
import { extractStateCode } from '../lib/extractStateCode'
import { RaceSection } from '../components/RaceSection'

function ElectionCard({ election }: { election: any }) {
  const today = new Date()
  const day = new Date(election.electionDay)
  const isPast = day < today
  const isUpcoming = day > today
  const daysAway = Math.ceil((day.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  let badge = ''
  let badgeColor = '#64748b'
  if (isPast) { badge = 'Past'; badgeColor = '#94a3b8' }
  else if (daysAway <= 30) { badge = `In ${daysAway}d`; badgeColor = '#16a34a' }
  else { badge = 'Upcoming'; badgeColor = '#2563eb' }

  const scope = election.stateCode ? election.stateCode : 'National'

  return (
    <View style={elCard.card}>
      <View style={elCard.left}>
        <Text style={elCard.name}>{election.name}</Text>
        <Text style={elCard.date}>{new Date(election.electionDay + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
      </View>
      <View style={elCard.right}>
        <View style={[elCard.badge, { backgroundColor: badgeColor }]}>
          <Text style={elCard.badgeText}>{badge}</Text>
        </View>
        <Text style={elCard.scope}>{scope}</Text>
      </View>
    </View>
  )
}

const PARTY_COLORS: Record<string, string> = {
  Democratic: '#2563eb', Republican: '#dc2626',
  Independent: '#7c3aed', Libertarian: '#f59e0b', Green: '#16a34a',
}

function RepCard({ rep }: { rep: any }) {
  const partyColor = PARTY_COLORS[rep.party] ?? '#64748b'
  return (
    <View style={repCard.card}>
      <View style={[repCard.partyBar, { backgroundColor: partyColor }]} />
      <View style={repCard.body}>
        <Text style={repCard.name}>{rep.name}</Text>
        <Text style={repCard.meta}>{rep.title} · District {rep.district}</Text>
      </View>
      <View style={[repCard.badge, { backgroundColor: partyColor }]}>
        <Text style={repCard.badgeText}>{rep.party.slice(0, 1)}</Text>
      </View>
    </View>
  )
}

export default function BallotScreen() {
  const address = useAppStore((s) => s.address)
  const stateCode = extractStateCode(address)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['candidates', address],
    queryFn: () => api.getCandidates(address!),
    enabled: !!address,
  })

  const noContests = !isLoading && (data?.candidates ?? []).length === 0

  const { data: electionsData, isLoading: electionsLoading } = useQuery({
    queryKey: ['elections', stateCode],
    queryFn: () => api.getElections(stateCode ?? undefined),
    enabled: !!address && noContests,
  })

  const { data: repsData, isLoading: repsLoading } = useQuery({
    queryKey: ['representatives', stateCode],
    queryFn: () => api.getRepresentatives(stateCode!),
    enabled: !!stateCode && noContests,
  })

  if (!address) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No address set. Go back and enter your address.</Text>
      </View>
    )
  }

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#1e3a5f" /></View>

  if (isError) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>Election data temporarily unavailable. Try again shortly.</Text>
    </View>
  )

  const candidates = data?.candidates ?? []

  // No ballot contests — show state reps + elections fallback
  if (candidates.length === 0) {
    const elections = electionsData?.elections ?? []
    const reps = repsData?.representatives ?? []
    const today = new Date()
    const upcoming = elections.filter((e: any) => new Date(e.electionDay) >= today)
    const past = elections.filter((e: any) => new Date(e.electionDay) < today).reverse()
    const senators = reps.filter((r: any) => r.chamber === 'upper')
    const houseReps = reps.filter((r: any) => r.chamber === 'lower')

    const sections: { title: string; data: any[]; type: string }[] = [
      ...(upcoming.length > 0 ? [{ title: 'Upcoming Elections', data: upcoming, type: 'election' }] : []),
      ...(past.length > 0 ? [{ title: 'Recent Elections (Last 2 Years)', data: past, type: 'election' }] : []),
      ...(senators.length > 0 ? [{ title: `${stateCode} Senate`, data: senators, type: 'rep' }] : []),
      ...(houseReps.length > 0 ? [{ title: `${stateCode} House of Representatives`, data: houseReps, type: 'rep' }] : []),
    ]

    return (
      <View style={styles.container}>
        <View style={styles.addressBar}>
          <Text style={styles.addressText} numberOfLines={1}>📍 {address}</Text>
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noContestsBanner}>
          <Text style={styles.noContestsTitle}>No active ballot found for this address</Text>
          <Text style={styles.noContestsSubtitle}>
            Showing {stateCode ?? 'state'} elections + current legislators
          </Text>
        </View>

        {(electionsLoading || repsLoading) ? (
          <View style={styles.center}><ActivityIndicator color="#1e3a5f" /></View>
        ) : (
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
              <Text style={styles.emptyText}>No data found for {stateCode ?? 'this state'}.</Text>
            }
          />
        )}

        <TouchableOpacity style={styles.allElectionsButton} onPress={() => router.push('/polls')}>
          <Text style={styles.allElectionsText}>📊 Explore Election Center</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const byOffice = candidates.reduce<Record<string, any[]>>((acc, c) => {
    if (!acc[c.office]) acc[c.office] = []
    acc[c.office].push(c)
    return acc
  }, {})

  const sections = Object.entries(byOffice).map(([office, cands]) => ({
    office,
    candidates: [...cands].sort((a, b) => a.name.localeCompare(b.name)),
    level: cands[0]?.state ? 'State' : 'Federal',
  }))

  return (
    <View style={styles.container}>
      <View style={styles.addressBar}>
        <Text style={styles.addressText} numberOfLines={1}>📍 {address}</Text>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.changeText}>Change</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/how-to-vote')}>
          <Text style={styles.howText}>How to Vote</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.aiButton} onPress={() => router.push('/chat')}>
        <Text style={styles.aiButtonText}>💬 Ask AI about your ballot</Text>
      </TouchableOpacity>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.office}
        renderItem={({ item }) => (
          <RaceSection office={item.office} level={item.level} candidates={item.candidates} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No upcoming election data found for this address.</Text>
        }
      />
    </View>
  )
}

const repCard = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  partyBar: { width: 4, alignSelf: 'stretch' },
  body: { flex: 1, padding: 12 },
  name: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  meta: { fontSize: 12, color: '#64748b' },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 14 },
})

const elCard = StyleSheet.create({
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05,
    shadowRadius: 2, elevation: 1,
  },
  left: { flex: 1, marginRight: 10 },
  name: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 3 },
  date: { fontSize: 12, color: '#64748b' },
  right: { alignItems: 'flex-end', gap: 4 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  scope: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
})

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  addressBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, backgroundColor: '#1e3a5f',
  },
  addressText: { color: '#fff', fontSize: 14, flex: 1 },
  changeText: { color: '#93c5fd', fontSize: 14, fontWeight: '600' },
  howText: { color: '#93c5fd', fontSize: 12, fontWeight: '600', marginLeft: 12 },
  aiButton: {
    margin: 16, backgroundColor: '#4f46e5',
    borderRadius: 12, padding: 16, alignItems: 'center',
  },
  aiButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  list: { padding: 16 },
  errorText: { color: '#64748b', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  emptyText: { color: '#94a3b8', fontSize: 15, textAlign: 'center', marginTop: 48 },
  noContestsBanner: {
    margin: 16, backgroundColor: '#fef3c7', borderRadius: 12,
    padding: 16, borderLeftWidth: 4, borderLeftColor: '#f59e0b',
  },
  noContestsTitle: { fontSize: 15, fontWeight: '700', color: '#92400e', marginBottom: 4 },
  noContestsSubtitle: { fontSize: 13, color: '#78350f', lineHeight: 18 },
  sectionHeader: {
    fontSize: 13, fontWeight: '700', color: '#475569', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 8, marginTop: 4,
  },
  allElectionsButton: {
    margin: 16, marginTop: 0, backgroundColor: '#1e3a5f',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  allElectionsText: { color: '#fff', fontSize: 14, fontWeight: '600' },
})
