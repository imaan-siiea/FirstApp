import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../lib/store'
import { api } from '../lib/api'

export interface Follow {
  id: string
  entityType: string
  entityId: string
  entityName: string
}

export function useFollows() {
  const userId = useAppStore((s) => s.userId)
  const [follows, setFollows] = useState<Follow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) { setFollows([]); return }
    setLoading(true)
    api.getFollows()
      .then(rows => setFollows(rows.map(r => ({
        id: r.id, entityType: r.entityType, entityId: r.entityId, entityName: r.entityName,
      }))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  const isFollowing = useCallback(
    (entityId: string) => follows.some(f => f.entityId === entityId.toLowerCase()),
    [follows],
  )

  const toggleFollow = useCallback(async (
    entityType: 'politician' | 'state' | 'party',
    entityId: string,
    entityName: string,
  ): Promise<boolean> => {
    if (!userId) return false

    const alreadyFollowing = follows.some(f => f.entityId === entityId.toLowerCase())

    if (alreadyFollowing) {
      // Optimistic remove
      setFollows(prev => prev.filter(f => f.entityId !== entityId.toLowerCase()))
      api.removeFollow(entityId).catch(() => {
        // Rollback
        setFollows(prev => [
          ...prev,
          { id: '', entityType, entityId: entityId.toLowerCase(), entityName },
        ])
      })
    } else {
      // Optimistic add
      const optimistic: Follow = { id: 'pending', entityType, entityId: entityId.toLowerCase(), entityName }
      setFollows(prev => [...prev, optimistic])
      api.addFollow(entityType, entityId, entityName)
        .then(result => {
          setFollows(prev => prev.map(f => f.id === 'pending' ? { ...f, id: result.id } : f))
        })
        .catch(() => {
          setFollows(prev => prev.filter(f => f.id !== 'pending'))
        })
    }

    return !alreadyFollowing
  }, [userId, follows])

  return { follows, loading, isFollowing, toggleFollow }
}
