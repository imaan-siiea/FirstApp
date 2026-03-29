import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'

interface Props {
  candidate: {
    id: string
    name: string
    party?: string
    photoUrl?: string
    bio?: string
    dataConfidence: 'high' | 'medium' | 'low'
    lastVerified: string
  }
}

export function CandidateCard({ candidate }: Props) {
  const confidenceColor = { high: '#22c55e', medium: '#f59e0b', low: '#94a3b8' }[candidate.dataConfidence]
  const date = new Date(candidate.lastVerified).toLocaleDateString()

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/candidate/${candidate.id}`)}>
      <View style={styles.row}>
        {candidate.photoUrl ? (
          <Image source={{ uri: candidate.photoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.photoInitial}>{candidate.name[0]}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{candidate.name}</Text>
          {candidate.party && <Text style={styles.party}>{candidate.party}</Text>}
          {candidate.bio && (
            <Text style={styles.bio} numberOfLines={2}>{candidate.bio}</Text>
          )}
          <View style={styles.confidence}>
            <View style={[styles.dot, { backgroundColor: confidenceColor }]} />
            <Text style={styles.confidenceText}>Verified {date}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  row: { flexDirection: 'row', gap: 12 },
  photo: { width: 56, height: 56, borderRadius: 28 },
  photoPlaceholder: { backgroundColor: '#1e3a5f', alignItems: 'center', justifyContent: 'center' },
  photoInitial: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  party: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  bio: { fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 6 },
  confidence: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  confidenceText: { fontSize: 11, color: '#94a3b8' },
})
