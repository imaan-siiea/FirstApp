import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useAppStore } from '../../lib/store'
import { api } from '../../lib/api'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [loading, setLoading] = useState(false)
  const setAuth = useAppStore((s) => s.setAuth)

  async function handleSubmit() {
    if (!email.trim() || !password) return
    setLoading(true)
    try {
      const fn = isRegistering ? api.register : api.login
      const { accessToken, refreshToken } = await fn(email.trim(), password)
      await setAuth('user', accessToken, refreshToken)
      router.replace('/account')
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegistering ? 'Create Account' : 'Sign In'}</Text>
      <Text style={styles.subtitle}>
        Save your ballot and set election reminders. Optional — all features work without an account.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password (8+ characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>{isRegistering ? 'Create Account' : 'Sign In'}</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
        <Text style={styles.toggle}>
          {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 32, lineHeight: 20 },
  input: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12,
    padding: 16, fontSize: 16, backgroundColor: '#fff', marginBottom: 12,
  },
  button: { backgroundColor: '#1e3a5f', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  toggle: { color: '#4f46e5', textAlign: 'center', fontSize: 14 },
})
