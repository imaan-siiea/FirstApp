import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { useAppStore } from '../lib/store'

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
    <View style={styles.container}>
      <Text style={styles.title}>Your Civic Guide</Text>
      <Text style={styles.subtitle}>
        Enter your address to see your exact ballot and research candidates.
      </Text>

      <TextInput
        style={styles.input}
        placeholder={savedAddress ?? 'e.g. 123 Main St, Austin, TX 78701'}
        value={address}
        onChangeText={setAddressInput}
        autoCapitalize="words"
        returnKeyType="go"
        onSubmitEditing={handleContinue}
      />

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>See My Ballot →</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/registration')}>
        <Text style={styles.secondaryButtonText}>Register to Vote</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/how-to-vote')}>
        <Text style={styles.secondaryButtonText}>How to Vote →</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f8fafc' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b', marginBottom: 32, lineHeight: 24 },
  input: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12,
    padding: 16, fontSize: 16, backgroundColor: '#fff', marginBottom: 16,
  },
  button: {
    backgroundColor: '#1e3a5f', borderRadius: 12,
    padding: 18, alignItems: 'center', marginBottom: 12,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  secondaryButton: {
    borderWidth: 1, borderColor: '#1e3a5f', borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  secondaryButtonText: { color: '#1e3a5f', fontSize: 16, fontWeight: '500' },
})
