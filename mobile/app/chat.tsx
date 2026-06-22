import { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
  content: "Hi! I'm your nonpartisan civic AI guide. Ask me anything about candidates, elections, voting procedures, or civic issues. For ballot-specific results, enter your address on the home screen.",
}

export default function ChatScreen() {
  const { candidateName, repContext: repContextStr } = useLocalSearchParams<{ candidateName?: string; repContext?: string }>()
  const address = useAppStore((s) => s.address)
  const insets = useSafeAreaInsets()
  let repContext: object | null = null
  if (repContextStr) {
    try { repContext = JSON.parse(repContextStr) } catch { /* ignore malformed param */ }
  }
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState(candidateName ? `Tell me about ${candidateName}` : '')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<FlatList>(null)

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const { answer } = await api.chat(
        updated.filter(m => m.id !== '0').map(m => ({ role: m.role, content: m.content })),
        address ?? '',
        repContext,
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={styles.banner}>
        <Text style={styles.bannerText}>🛡️ Nonpartisan · Sourced · Verified</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messageList}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
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

      <View style={[styles.inputRow, { paddingBottom: Math.max(12, insets.bottom) }]}>
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
