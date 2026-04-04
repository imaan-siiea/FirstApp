import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Alert, ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { useAppStore } from '../lib/store'

const FEATURE_CARDS = [
  { icon: '📊', label: 'Election Center', sub: 'Polls, reps, races & news by state', route: '/polls' as const, accent: '#0f766e' },
  { icon: '🔔', label: 'My Alerts', sub: 'Follow politicians & get news alerts', route: '/alerts' as const, accent: '#b45309' },
  { icon: '📋', label: 'Register to Vote', sub: 'Find your state guide', route: '/registration' as const, accent: '#0891b2' },
  { icon: '🗺️', label: 'How to Vote', sub: 'Polling place & ID info', route: '/how-to-vote' as const, accent: '#7c3aed' },
]

export default function HomeScreen() {
  const [address, setAddressInput] = useState('')
  const setAddress = useAppStore((s) => s.setAddress)
  const savedAddress = useAppStore((s) => s.address)

  function handleContinue() {
    const addr = address.trim() || savedAddress
    if (!addr) {
      Alert.alert('Enter your address', 'We need your address to show your specific ballot.')
      return
    }
    setAddress(addr)
    router.push('/ballot')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a5f" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero header */}
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>NONPARTISAN · SOURCED · FREE</Text>
          <Text style={styles.heroTitle}>VoterIQ</Text>
          <Text style={styles.heroTagline}>Your complete civic companion</Text>
        </View>

        {/* Main CTA */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>See Your Exact Ballot</Text>
          <Text style={styles.ctaSubtitle}>
            Enter your registered address to get your personal ballot, candidates, and AI-powered research.
          </Text>

          <TextInput
            style={styles.input}
            placeholder={savedAddress ?? 'e.g. 123 Main St, Austin, TX 78701'}
            placeholderTextColor="#94a3b8"
            value={address}
            onChangeText={setAddressInput}
            autoCapitalize="words"
            returnKeyType="go"
            onSubmitEditing={handleContinue}
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>View My Ballot →</Text>
          </TouchableOpacity>

          {savedAddress && (
            <TouchableOpacity onPress={() => router.push('/ballot')} style={styles.recentAddr}>
              <Text style={styles.recentAddrIcon}>📍</Text>
              <Text style={styles.recentAddrText} numberOfLines={1}>{savedAddress}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Feature cards */}
        <Text style={styles.sectionLabel}>EXPLORE</Text>
        {FEATURE_CARDS.map((f) => (
          <TouchableOpacity
            key={f.route}
            style={[styles.featureCard, { borderLeftColor: f.accent }]}
            onPress={() => router.push(f.route)}
            activeOpacity={0.8}
          >
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureLabel}>{f.label}</Text>
              <Text style={styles.featureSub}>{f.sub}</Text>
            </View>
            <Text style={[styles.featureChevron, { color: f.accent }]}>›</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.footer}>
          VoterIQ is nonpartisan. All data is sourced from official civic databases.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1e3a5f' },
  scroll: { flex: 1, backgroundColor: '#f1f5f9' },
  scrollContent: { paddingBottom: 40 },

  hero: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#60a5fa',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: 6,
  },
  heroTagline: {
    fontSize: 15,
    color: '#93c5fd',
    fontWeight: '500',
  },

  ctaCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: '#1e3a5f',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#1e3a5f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },

  recentAddr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  recentAddrIcon: { fontSize: 13 },
  recentAddrText: { fontSize: 13, color: '#475569', flex: 1 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.2,
    marginTop: 28,
    marginBottom: 10,
    marginHorizontal: 20,
  },

  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  featureIcon: { fontSize: 26 },
  featureText: { flex: 1 },
  featureLabel: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  featureSub: { fontSize: 12, color: '#64748b' },
  featureChevron: { fontSize: 24, fontWeight: '300' },

  footer: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 24,
    marginHorizontal: 24,
    lineHeight: 16,
  },
})
