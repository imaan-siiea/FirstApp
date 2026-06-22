import { db } from '../db'
import { follows, pushTokens } from '../db/schema'
import { eq, or, and, inArray } from 'drizzle-orm'
import type { NewsArticle } from './newsRss'

// Dedup: avoid re-notifying the same user for the same article
// TTL-based: entries expire after 24h to prevent unbounded memory growth
const sentKeys = new Map<string, number>() // key -> timestamp

const SENT_KEY_TTL = 24 * 60 * 60 * 1000 // 24 hours

function pruneSentKeys() {
  const now = Date.now()
  for (const [key, ts] of sentKeys) {
    if (now - ts > SENT_KEY_TTL) sentKeys.delete(key)
  }
}

export async function checkAndNotifyFollows(
  stateCode: string,
  articles: NewsArticle[],
): Promise<void> {
  if (!articles.length) return

  pruneSentKeys()

  // Load all follows relevant to this state: state-level follows + all politician/party follows
  const allFollows = await db.select().from(follows).where(
    or(
      and(eq(follows.entityType, 'state'), eq(follows.entityId, stateCode.toLowerCase())),
      eq(follows.entityType, 'politician'),
      eq(follows.entityType, 'party'),
    ),
  )
  if (!allFollows.length) return

  const pendingNotifications: {
    userId: string
    title: string
    body: string
    articleUrl: string
  }[] = []

  for (const article of articles) {
    const content = `${article.title} ${article.description ?? ''}`.toLowerCase()

    for (const follow of allFollows) {
      const key = `${follow.userId}:${article.url}`
      if (sentKeys.has(key)) continue

      let matched = false
      if (follow.entityType === 'state') {
        matched = true // state followers get all news from that state
      } else {
        // politician or party: check entity name appears in article content
        matched = content.includes(follow.entityId)
      }

      if (!matched) continue

      pendingNotifications.push({
        userId: follow.userId,
        title:
          follow.entityType === 'state'
            ? `📰 ${follow.entityName} Election News`
            : `🔔 ${follow.entityName} in the news`,
        body: article.title,
        articleUrl: article.url,
      })
    }
  }

  if (!pendingNotifications.length) return

  // Load push tokens for all affected users — support multiple devices per user
  const userIds = [...new Set(pendingNotifications.map(n => n.userId))]
  const tokens = await db
    .select()
    .from(pushTokens)
    .where(inArray(pushTokens.userId, userIds))

  const tokensByUser = new Map<string, string[]>()
  for (const t of tokens) {
    const existing = tokensByUser.get(t.userId) ?? []
    existing.push(t.token)
    tokensByUser.set(t.userId, existing)
  }

  const pushMessages: object[] = []
  for (const notif of pendingNotifications) {
    const userTokens = tokensByUser.get(notif.userId)
    if (!userTokens?.length) continue
    sentKeys.set(`${notif.userId}:${notif.articleUrl}`, Date.now())
    for (const token of userTokens) {
      pushMessages.push({
        to: token,
        title: notif.title,
        body: notif.body,
        sound: 'default',
        data: { articleUrl: notif.articleUrl },
      })
    }
  }

  if (!pushMessages.length) return

  // Expo Push Notification Service — free, no key required
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(pushMessages),
    })

    if (!res.ok) {
      console.error('[push] Expo push API error:', res.status, await res.text().catch(() => ''))
      return
    }

    // Check for per-token errors (e.g. DeviceNotRegistered)
    const result = await res.json().catch(() => null)
    if (result?.data) {
      const invalidTokens: string[] = []
      for (let i = 0; i < result.data.length; i++) {
        const ticket = result.data[i]
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          const msg = pushMessages[i] as { to: string }
          invalidTokens.push(msg.to)
        }
      }
      // Clean up invalid tokens from DB
      if (invalidTokens.length > 0) {
        await db.delete(pushTokens).where(inArray(pushTokens.token, invalidTokens))
          .catch(err => console.error('[push] Failed to clean invalid tokens:', err))
      }
    }
  } catch (err) {
    console.error('[push] Failed to send notifications:', err)
  }
}
