import { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useAppStore } from '../lib/store'
import { api } from '../lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const INITIAL_MESSAGE: Message = {
  id: '0',
  role: 'assistant',
  content: "Hi! I'm your nonpartisan ballot guide. Ask me anything about the candidates on your ballot — their positions, backgrounds, or how they differ on issues. I only share verified information from official sources.",
}

export default function ChatScreen() {
  const { candidateName } = useLocalSearchParams<{ candidateName?: string }>()
  const address = useAppStore((s) => s.address)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState(candidateName ? `Tell me about ${candidateName}` : '')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<FlatList>(null)

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading || !address) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const { answer } = await api.chat(
        updated.filter(m => m.id !== '0').map(m => ({ role: m.role, content: m.content })),
        address,
      )
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: answer }])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: 'Sorry, I had trouble getting that information. Please try again.',
      }])
    } finally {
      setLoading(false)
      setTimeout(() => listRef.current?.scrollToEnd(), 100)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>🛡️ Nonpartisan · Sourced · Verified</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.bubbleText, item.role === 'user' ? styles.userText : styles.aiText]}>
              {item.content}
            </Text>
          </View>
        )}
      />

      {loading && (
        <View style={styles.typing}>
          <ActivityIndicator size="small" color="#1e3a5f" />
          <Text style={styles.typingText}>Looking that up...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about a candidate or issue..."
          multiline
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendDisabled]}
          onPress={sendMessage}
          disabled={loading}
        >
          <Text style={styles.sendText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  banner: { backgroundColor: '#e0f2fe', padding: 8, alignItems: 'center' },
  bannerText: { fontSize: 12, color: '#0369a1', fontWeight: '600' },
  messageList: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: '85%', borderRadius: 16, padding: 12, marginBottom: 12 },
  userBubble: { backgroundColor: '#1e3a5f', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: {
    backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: '#1e293b' },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, paddingTop: 0 },
  typingText: { color: '#64748b', fontSize: 13 },
  inputRow: {
    flexDirection: 'row', padding: 12, gap: 8,
    borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#fff',
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100,
  },
  sendButton: { backgroundColor: '#1e3a5f', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { backgroundColor: '#94a3b8' },
  sendText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
})
