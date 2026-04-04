import { View, Text, StyleSheet } from 'react-native'

const ISSUE_ICONS: Record<string, string> = {
  healthcare: '🏥',
  economy: '💼',
  education: '🎓',
  immigration: '🌎',
  environment: '🌿',
  veterans: '🎖️',
  'gun policy': '⚖️',
  'foreign policy': '🌐',
}

function getIcon(issue: string): string {
  return ISSUE_ICONS[issue.toLowerCase()] ?? '📋'
}

interface Position {
  issue: string
  position: string
  source: string
  year: string
  confidence: 'high' | 'medium' | 'low'
}

interface Props {
  position: Position
}

export function PositionRow({ position }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.icon}>{getIcon(position.issue)}</Text>
      <View style={styles.content}>
        <Text style={styles.issue}>{position.issue}</Text>
        <Text style={styles.text}>{position.position}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.source}>{position.source} · {position.year}</Text>
          {position.confidence === 'low' && (
            <Text style={styles.aiLabel}> · AI-inferred</Text>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  icon: { fontSize: 18, width: 24, textAlign: 'center', marginTop: 1 },
  content: { flex: 1 },
  issue: { fontSize: 12, fontWeight: '700', color: '#1e3a5f', marginBottom: 2 },
  text: { fontSize: 13, color: '#374151', lineHeight: 18 },
  metaRow: { flexDirection: 'row', marginTop: 3 },
  source: { fontSize: 11, color: '#94a3b8' },
  aiLabel: { fontSize: 11, color: '#f59e0b', fontStyle: 'italic' },
})
