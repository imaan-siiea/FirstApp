import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useAppStore } from '../lib/store'
import { api } from '../lib/api'
import { RaceSection } from '../components/RaceSection'

export default function BallotScreen() {
  const address = useAppStore((s) => s.address)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['candidates', address],
    queryFn: () => api.getCandidates(address!),
    enabled: !!address,
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

  const byOffice = (data?.candidates ?? []).reduce<Record<string, any[]>>((acc, c) => {
    if (!acc[c.office]) acc[c.office] = []
    acc[c.office].push(c)
    return acc
  }, {})

  const sections = Object.entries(byOffice).map(([office, candidates]) => ({
    office,
    candidates: [...candidates].sort((a, b) => a.name.localeCompare(b.name)),
    level: candidates[0]?.state ? 'State' : 'Federal',
  }))

  return (
    <View style={styles.container}>
      <View style={styles.addressBar}>
        <Text style={styles.addressText} numberOfLines={1}>📍 {address}</Text>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.changeText}>Change</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  addressBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, backgroundColor: '#1e3a5f',
  },
  addressText: { color: '#fff', fontSize: 14, flex: 1 },
  changeText: { color: '#93c5fd', fontSize: 14, fontWeight: '600' },
  aiButton: {
    margin: 16, backgroundColor: '#4f46e5',
    borderRadius: 12, padding: 16, alignItems: 'center',
  },
  aiButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  list: { padding: 16 },
  errorText: { color: '#64748b', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  emptyText: { color: '#94a3b8', fontSize: 15, textAlign: 'center', marginTop: 48 },
})
