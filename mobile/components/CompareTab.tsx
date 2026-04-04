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

  const sharedIssues = selected
    ? Array.from(new Set([
        ...currentCandidate.positions.map(p => p.issue),
        ...selected.positions.map(p => p.issue),
      ]))
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

          {sharedIssues.length === 0 ? (
            <Text style={styles.emptyText}>No position data available for comparison.</Text>
          ) : (
            sharedIssues.map(issue => {
              const leftPos = currentCandidate.positions.find(p => p.issue === issue)
              const rightPos = selected.positions.find(p => p.issue === issue)
              return (
                <View key={issue} style={styles.issueBlock}>
                  <Text style={styles.issueTitle}>{issue}</Text>
                  <View style={styles.issueRow}>
                    <Text style={styles.issueText}>{leftPos ? leftPos.position : '—'}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.issueText}>{rightPos ? rightPos.position : '—'}</Text>
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
