import { View, Text, StyleSheet } from 'react-native'

const PARTY_COLORS: Record<string, string> = {
  democrat: '#2563eb',
  democratic: '#2563eb',
  republican: '#dc2626',
  independent: '#7c3aed',
  libertarian: '#f59e0b',
  green: '#16a34a',
}

function getPartyColor(party?: string): string {
  if (!party) return '#64748b'
  return PARTY_COLORS[party.toLowerCase()] ?? '#64748b'
}

interface Props {
  party?: string
}

export function PartyBadge({ party }: Props) {
  const color = getPartyColor(party)
  const label = party ?? 'Unknown'
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  text: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
})
