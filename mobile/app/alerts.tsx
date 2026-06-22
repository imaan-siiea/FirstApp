import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useFollows } from '../hooks/useFollows'
import { useAppStore } from '../lib/store'

const TYPE_ICONS: Record<string, string> = {
  politician: '👤',
  state: '🗺️',
  party: '🏛️',
}

export default function AlertsScreen() {
  const userId = useAppStore((s) => s.userId)
  const { follows, loading, toggleFollow } = useFollows()
  const insets = useSafeAreaInsets()

  if (!userId) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Alerts</Text>
          <Text style={styles.headerSub}>Push notifications for election news</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>Sign in to use alerts</Text>
          <Text style={styles.emptyBody}>
            Follow politicians, states, and parties to get notified when they appear in election news.
          </Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/account/login')}>
            <Text style={styles.actionBtnText}>Sign In / Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Alerts</Text>
        <Text style={styles.headerSub}>{follows.length} following</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1e3a5f" />
        </View>
      ) : follows.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔕</Text>
          <Text style={styles.emptyTitle}>No alerts yet</Text>
          <Text style={styles.emptyBody}>
            Tap the 🔕 bell next to any politician in the Election Center to follow them and receive news alerts.
          </Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/polls')}>
            <Text style={styles.actionBtnText}>Browse Election Center</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionLabel}>YOU'RE FOLLOWING</Text>
          {follows.map(follow => (
            <View key={follow.id} style={styles.followRow}>
              <Text style={styles.followIcon}>{TYPE_ICONS[follow.entityType] ?? '⚡'}</Text>
              <View style={styles.followInfo}>
                <Text style={styles.followName}>{follow.entityName}</Text>
                <Text style={styles.followType}>{follow.entityType}</Text>
              </View>
              <TouchableOpacity
                style={styles.unfollowBtn}
                onPress={() => toggleFollow(follow.entityType as 'politician' | 'state' | 'party', follow.entityId, follow.entityName)}
              >
                <Text style={styles.unfollowText}>Unfollow</Text>
              </TouchableOpacity>
            </View>
          ))}
          <Text style={styles.note}>
            You'll get a push notification when these appear in election news.
          </Text>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: { backgroundColor: '#1e3a5f', padding: 20, paddingBottom: 20 },
  backBtn: { marginBottom: 10 },
  backText: { color: '#93c5fd', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 2 },
  headerSub: { fontSize: 13, color: '#93c5fd' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1e3a5f', marginBottom: 8, textAlign: 'center' },
  emptyBody: { fontSize: 14, color: '#64748b', lineHeight: 21, textAlign: 'center', marginBottom: 24 },

  actionBtn: { backgroundColor: '#1e3a5f', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  list: { padding: 16, paddingBottom: 48 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.2, marginBottom: 12, textTransform: 'uppercase' },

  followRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    gap: 12,
  },
  followIcon: { fontSize: 22 },
  followInfo: { flex: 1 },
  followName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  followType: { fontSize: 12, color: '#64748b', textTransform: 'capitalize', marginTop: 2 },

  unfollowBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1,
    borderColor: '#fca5a5', backgroundColor: '#fef2f2',
  },
  unfollowText: { fontSize: 12, fontWeight: '600', color: '#dc2626' },

  note: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 16, lineHeight: 18 },
})
