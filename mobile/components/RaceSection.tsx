import { View, Text, StyleSheet } from 'react-native'
import { CandidateCard } from './CandidateCard'

interface Props {
  office: string
  level: string
  candidates: any[]
}

export function RaceSection({ office, level, candidates }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.levelBadge}>{level}</Text>
        <Text style={styles.office}>{office}</Text>
      </View>
      {candidates.map((c) => (
        <CandidateCard key={c.id} candidate={c} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  header: { marginBottom: 12 },
  levelBadge: {
    fontSize: 11, fontWeight: '700', color: '#1e3a5f',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
  },
  office: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
})
