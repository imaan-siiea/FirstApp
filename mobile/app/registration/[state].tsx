import { View, Text, ScrollView, TouchableOpacity, Linking, ActivityIndicator, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export default function StateRegistrationScreen() {
  const { state } = useLocalSearchParams<{ state: string }>()

  const { data: guide, isLoading } = useQuery({
    queryKey: ['registration', state],
    queryFn: () => api.getRegistration(state),
  })

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#1e3a5f" /></View>
  if (!guide) return <View style={styles.center}><Text>Registration info not found.</Text></View>

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Register in {guide.stateName}</Text>
        <Text style={styles.idRequired}>{guide.idRequired}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏰ Registration Deadlines</Text>
        <View style={styles.deadlineRow}>
          <Text style={styles.deadlineLabel}>Online</Text>
          <Text style={styles.deadlineValue}>{guide.deadline.online}</Text>
        </View>
        <View style={styles.deadlineRow}>
          <Text style={styles.deadlineLabel}>By Mail</Text>
          <Text style={styles.deadlineValue}>{guide.deadline.mail}</Text>
        </View>
        <View style={styles.deadlineRow}>
          <Text style={styles.deadlineLabel}>In Person</Text>
          <Text style={styles.deadlineValue}>{guide.deadline.inPerson}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 How to Register</Text>
        {guide.methods.online?.available && (
          <TouchableOpacity style={styles.methodCard} onPress={() => Linking.openURL(guide.methods.online.url)}>
            <Text style={styles.methodTitle}>Online (Fastest)</Text>
            <Text style={styles.methodCTA}>Register at {guide.stateName} official site →</Text>
          </TouchableOpacity>
        )}
        {guide.methods.mail?.available && (
          <View style={styles.methodCard}>
            <Text style={styles.methodTitle}>By Mail</Text>
            <Text style={styles.methodBody}>{guide.methods.mail.instructions}</Text>
          </View>
        )}
        {guide.methods.inPerson?.available && (
          <View style={styles.methodCard}>
            <Text style={styles.methodTitle}>In Person</Text>
            <Text style={styles.methodBody}>{guide.methods.inPerson.instructions}</Text>
          </View>
        )}
      </View>

      {guide.checkRegistrationUrl && (
        <TouchableOpacity style={styles.checkButton} onPress={() => Linking.openURL(guide.checkRegistrationUrl)}>
          <Text style={styles.checkButtonText}>Check if You're Already Registered →</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.officialButton} onPress={() => Linking.openURL(guide.officialUrl)}>
        <Text style={styles.officialButtonText}>Official {guide.stateName} Elections Site</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        VoterIQ links directly to official government registration sites. Always verify deadlines at your state's official elections website.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#1e3a5f', padding: 24 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  idRequired: { fontSize: 14, color: '#93c5fd' },
  section: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e3a5f', marginBottom: 12 },
  deadlineRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  deadlineLabel: { fontSize: 14, color: '#64748b' },
  deadlineValue: { fontSize: 14, fontWeight: '600', color: '#1e293b', flex: 1, textAlign: 'right' },
  methodCard: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 8 },
  methodTitle: { fontSize: 15, fontWeight: '700', color: '#1e3a5f', marginBottom: 4 },
  methodBody: { fontSize: 14, color: '#475569', lineHeight: 20 },
  methodCTA: { fontSize: 14, color: '#4f46e5', fontWeight: '600' },
  checkButton: {
    margin: 16, marginTop: 0, backgroundColor: '#ecfdf5',
    borderWidth: 1, borderColor: '#22c55e', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  checkButtonText: { color: '#166534', fontSize: 15, fontWeight: '600' },
  officialButton: {
    margin: 16, marginTop: 0, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  officialButtonText: { color: '#1e3a5f', fontSize: 15 },
  disclaimer: { margin: 16, marginTop: 0, fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 18 },
})
