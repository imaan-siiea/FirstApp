import { ScrollView, View, Text, TouchableOpacity, Linking, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '../lib/store'
import { api } from '../lib/api'

interface Step {
  number: string
  title: string
  body: string
  link?: { label: string; url: string }
}

export default function HowToVoteScreen() {
  const address = useAppStore((s) => s.address)
  const stateCode = address?.match(/\b([A-Z]{2})\b/)?.[1] ?? null

  const { data: regInfo, isLoading } = useQuery({
    queryKey: ['registration', stateCode],
    queryFn: () => api.getRegistration(stateCode!),
    enabled: !!stateCode,
  })

  const stateName = regInfo?.stateName ?? stateCode ?? 'Your State'

  const steps: Step[] = [
    {
      number: '1',
      title: 'Check Your Registration',
      body: `Make sure you're registered to vote in ${stateName}. Registration deadlines vary — check your status now so you're not caught off guard.`,
      link: regInfo?.checkRegistrationUrl
        ? { label: `Check Registration in ${stateName}`, url: regInfo.checkRegistrationUrl }
        : regInfo?.officialUrl
        ? { label: `${stateName} Voter Info`, url: regInfo.officialUrl }
        : undefined,
    },
    {
      number: '2',
      title: 'Find Your Polling Place',
      body: 'Your polling place is assigned by your registered address. Find it before Election Day so you know exactly where to go.',
      link: regInfo?.methods?.online?.url
        ? { label: `Find Polling Place in ${stateName}`, url: regInfo.methods.online.url }
        : undefined,
    },
    {
      number: '3',
      title: 'Know What to Bring',
      body: regInfo?.idRequired
        ? `In ${stateName}: ${regInfo.idRequired}`
        : "ID requirements vary by state. Check your state's requirements before heading to the polls.",
    },
    {
      number: '4',
      title: 'Research Your Ballot',
      body: 'Use VoterIQ to review every candidate on your ballot before you vote. A prepared voter is an informed voter.',
    },
    {
      number: '5',
      title: 'Vote Early or By Mail',
      body: `${stateName} offers absentee and early voting options. You don't have to vote on Election Day.`,
      link: regInfo?.officialUrl
        ? { label: `Absentee Voting in ${stateName}`, url: regInfo.officialUrl }
        : undefined,
    },
    {
      number: '6',
      title: 'On Election Day',
      body: "Polls are typically open 7am–8pm (varies by state). If you're in line when polls close, you have the right to vote. Bring your ID and your polling place address.",
    },
  ]

  if (isLoading) return <View style={styles.center}><ActivityIndicator color="#1e3a5f" /></View>

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>How to Vote</Text>
        <Text style={styles.headerSubtitle}>in {stateName}</Text>
      </View>

      {steps.map((step) => (
        <View key={step.number} style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{step.number}</Text>
          </View>
          <View style={styles.stepBody}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepText}>{step.body}</Text>
            {step.link && (
              <TouchableOpacity onPress={() => Linking.openURL(step.link!.url)}>
                <Text style={styles.stepLink}>{step.link.label} →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.aiButton} onPress={() => router.push('/chat')}>
        <Text style={styles.aiButtonText}>💬 Ask AI Any Voting Question</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        VoterIQ is nonpartisan. Links go to official government sources.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  headerBox: {
    backgroundColor: '#1e3a5f',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 16, color: '#93c5fd', marginTop: 4 },

  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  stepNumberText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  stepText: { fontSize: 13, color: '#475569', lineHeight: 19 },
  stepLink: { fontSize: 13, color: '#4f46e5', fontWeight: '600', marginTop: 8 },

  aiButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  aiButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disclaimer: { fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 16 },
})
