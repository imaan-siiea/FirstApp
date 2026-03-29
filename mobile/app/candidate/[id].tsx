import { View, Text, Image, ScrollView, TouchableOpacity, Linking, StyleSheet, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export default function CandidateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: candidate, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => api.getCandidate(id),
  })

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#1e3a5f" /></View>
  if (!candidate) return <View style={styles.center}><Text>Candidate not found.</Text></View>

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {candidate.photoUrl ? (
          <Image source={{ uri: candidate.photoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.initial}>{candidate.name[0]}</Text>
          </View>
        )}
        <Text style={styles.name}>{candidate.name}</Text>
        <Text style={styles.office}>{candidate.office}</Text>
        {candidate.party && <Text style={styles.party}>{candidate.party}</Text>}
      </View>

      {candidate.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biography</Text>
          <Text style={styles.body}>{candidate.bio}</Text>
        </View>
      )}

      {candidate.positions?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Known Positions</Text>
          {candidate.positions.map((p: any, i: number) => (
            <View key={i} style={styles.position}>
              <Text style={styles.positionIssue}>{p.issue}</Text>
              <Text style={styles.positionText}>{p.position}</Text>
              <Text style={styles.positionSource}>Source: {p.source}</Text>
            </View>
          ))}
        </View>
      )}

      {candidate.websiteUrl && (
        <TouchableOpacity style={styles.link} onPress={() => Linking.openURL(candidate.websiteUrl)}>
          <Text style={styles.linkText}>Official Website →</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.aiButton}
        onPress={() => router.push({ pathname: '/chat', params: { candidateName: candidate.name } })}
      >
        <Text style={styles.aiButtonText}>💬 Ask AI about {candidate.name}</Text>
      </TouchableOpacity>

      <View style={styles.sources}>
        <Text style={styles.sourcesTitle}>Data Sources</Text>
        {candidate.sources?.map((s: any, i: number) => (
          <Text key={i} style={styles.sourceItem}>
            • {s.name} — verified {new Date(s.fetchedAt).toLocaleDateString()}
          </Text>
        ))}
        <Text style={styles.disclaimer}>
          VoterIQ is nonpartisan. Information is sourced from official and established civic databases.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#1e3a5f', padding: 24, alignItems: 'center' },
  photo: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  photoPlaceholder: { backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  office: { fontSize: 16, color: '#93c5fd', marginBottom: 4 },
  party: { fontSize: 14, color: '#cbd5e1' },
  section: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e3a5f', marginBottom: 12 },
  body: { fontSize: 15, color: '#374151', lineHeight: 22 },
  position: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  positionIssue: { fontSize: 13, fontWeight: '700', color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  positionText: { fontSize: 15, color: '#374151', marginBottom: 4 },
  positionSource: { fontSize: 12, color: '#94a3b8' },
  link: { margin: 16, padding: 16, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center' },
  linkText: { color: '#1e3a5f', fontSize: 16, fontWeight: '600' },
  aiButton: { margin: 16, marginTop: 0, backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center' },
  aiButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sources: { margin: 16, padding: 16, backgroundColor: '#f1f5f9', borderRadius: 12 },
  sourcesTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8 },
  sourceItem: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  disclaimer: { fontSize: 12, color: '#94a3b8', marginTop: 8, lineHeight: 18 },
})
