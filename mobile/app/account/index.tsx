import { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { router } from 'expo-router'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { useAppStore } from '../../lib/store'
import { api } from '../../lib/api'

async function registerPushToken() {
  try {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    )
    const platform = Platform.OS === 'ios' ? 'ios' : 'android'
    await api.registerPushToken(tokenData.data, platform)
  } catch {
    // Push token registration is best-effort
  }
}

export default function AccountScreen() {
  const userId = useAppStore((s) => s.userId)
  const clearAuth = useAppStore((s) => s.clearAuth)
  const address = useAppStore((s) => s.address)

  useEffect(() => {
    if (userId) registerPushToken()
  }, [userId])

  if (!userId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Save Your Ballot</Text>
        <Text style={styles.body}>
          Create a free account to save your address, get election reminders, and return to your ballot anytime.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/account/login')}>
          <Text style={styles.buttonText}>Sign In or Create Account</Text>
        </TouchableOpacity>
        <Text style={styles.note}>All features work without an account.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Account</Text>
      {address && <Text style={styles.body}>Saved address: {address}</Text>}
      <TouchableOpacity
        style={styles.dangerButton}
        onPress={async () => { await clearAuth(); router.replace('/') }}
      >
        <Text style={styles.dangerText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 12 },
  body: { fontSize: 16, color: '#475569', marginBottom: 32, lineHeight: 24 },
  button: { backgroundColor: '#1e3a5f', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  note: { color: '#94a3b8', textAlign: 'center', fontSize: 13 },
  dangerButton: { borderWidth: 1, borderColor: '#ef4444', borderRadius: 12, padding: 16, alignItems: 'center' },
  dangerText: { color: '#ef4444', fontWeight: '600' },
})
