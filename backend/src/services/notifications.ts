import { db } from '../db'
import { follows, pushTokens } from '../db/schema'
import { eq, or, and, inArray } from 'drizzle-orm'
import type { NewsArticle } from './newsRss'

// Dedup: avoid re-notifying the same user for the same article (in-memory, resets on restart)
const sentKeys = new Set<string>() // `${userId}:${articleUrl}`

export async function checkAndNotifyFollows(
  stateCode: string,
  articles: NewsArticle[],
): Promise<void> {
  if (!articles.length) return

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

  // Load push tokens for all affected users
  const userIds = [...new Set(pendingNotifications.map(n => n.userId))]
  const tokens = await db
    .select()
    .from(pushTokens)
    .where(inArray(pushTokens.userId, userIds))
  const tokensByUser = new Map(tokens.map(t => [t.userId, t.token]))

  const pushMessages: object[] = []
  for (const notif of pendingNotifications) {
    const token = tokensByUser.get(notif.userId)
    if (!token) continue
    sentKeys.add(`${notif.userId}:${notif.articleUrl}`)
    pushMessages.push({
      to: token,
      title: notif.title,
      body: notif.body,
      sound: 'default',
      data: { articleUrl: notif.articleUrl },
    })
  }

  if (!pushMessages.length) return

  // Expo Push Notification Service — free, no key required
  await fetch('https://exp.push.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(pushMessages),
  })
}
