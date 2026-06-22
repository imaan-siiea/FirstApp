import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken')
      if (!refreshToken) return false

      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!res.ok) return false

      const data = await res.json()
      await SecureStore.setItemAsync('accessToken', data.accessToken)
      if (data.refreshToken) {
        await SecureStore.setItemAsync('refreshToken', data.refreshToken)
      }
      return true
    } catch {
      return false
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

async function request<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const authHeaders = await getAuthHeader()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...authHeaders, ...options.headers },
  })

  // Auto-refresh on 401 (once)
  if (res.status === 401 && !retried) {
    const refreshed = await tryRefreshToken()
    if (refreshed) return request<T>(path, options, true)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as any).error ?? 'Request failed')
  }
  return res.json()
}

export const api = {
  getElections: (stateCode?: string) =>
    request<{ elections: any[] }>(`/elections${stateCode ? `?state=${stateCode}` : ''}`),

  getRepresentatives: (stateCode: string) =>
    request<{ representatives: any[] }>(`/representatives?state=${stateCode}`),

  getFederalOfficials: (stateCode: string) =>
    request<{
      senators: { name: string; party: string; imageUrl: string | null; upIn2026: boolean }[]
      governor: { name: string; party: string }
    }>(`/federal-officials?state=${stateCode}`),

  getCountyElections: (stateCode: string) =>
    request<{ state: string; stateName: string; summary: string; source: string }>(`/ai/county-elections?state=${stateCode}`),

  getPollingPlaces: (address: string) =>
    request<{ coords: { lat: number; lng: number } | null; places: any[] }>(
      `/polling-places?address=${encodeURIComponent(address)}`
    ),

  getBallot: (address: string) =>
    request<{ contests: any[]; normalizedAddress: string }>('/ballot', {
      method: 'POST', body: JSON.stringify({ address }),
    }),

  getCandidates: (address: string) =>
    request<{ candidates: any[] }>('/candidates', {
      method: 'POST', body: JSON.stringify({ address }),
    }),

  getCandidate: (id: string, address: string) =>
    request<any>(`/candidates/${encodeURIComponent(id)}?address=${encodeURIComponent(address)}`),

  getCandidatesByOffice: (office: string, address: string) =>
    request<{ candidates: any[] }>(`/candidates/by-office?office=${encodeURIComponent(office)}&address=${encodeURIComponent(address)}`),

  chat: (messages: { role: string; content: string }[], address: string, repContext?: object | null) =>
    request<{ answer: string }>('/ai/chat', {
      method: 'POST', body: JSON.stringify({ messages, address, repContext }),
    }),

  getRegistration: (stateCode: string) =>
    request<any>(`/registration/${stateCode}`),

  getRegistrationStates: () =>
    request<{ code: string; name: string }[]>('/registration'),

  getRegistrationSites: (stateCode: string, address: string) =>
    request<{ sites: any[] }>(`/registration/${stateCode}/sites`, {
      method: 'POST', body: JSON.stringify({ address }),
    }),

  getRepProfile: (name: string, state: string, chamber: string, party: string) =>
    request<{ background: string; policies: string[]; highlights: string[]; funFacts: string[] }>(
      `/ai/rep-profile?name=${encodeURIComponent(name)}&state=${encodeURIComponent(state)}&chamber=${encodeURIComponent(chamber)}&party=${encodeURIComponent(party)}`
    ),

  getStateTrends: (stateCode: string) =>
    request<{ state: string; stateName: string; trends: string }>(`/ai/state-trends?state=${stateCode}`),

  getElectionNews: (stateCode: string) =>
    request<{
      state: string; stateName: string
      articles: { title: string; url: string; source: string; description: string; publishedAt: string }[]
    }>(`/news/elections?state=${stateCode}`),

  getLatestNews: () =>
    request<{
      articles: { title: string; url: string; source: string; description: string; publishedAt: string }[]
    }>('/news/latest'),

  getPolling: (stateCode: string) =>
    request<{
      state: string; stateName: string; outlook: string; dataNote: string
      races: { office: string; cycle: string; rating: string; rationale: string; candidates: { name: string; party: string; polling: number; trend: 'up' | 'down' | 'stable' }[] }[]
    }>(`/ai/polling?state=${stateCode}`),

  login: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),

  registerPushToken: (token: string, platform: 'ios' | 'android') =>
    request<void>('/push-token', {
      method: 'POST', body: JSON.stringify({ token, platform }),
    }),

  getFollows: () =>
    request<{ id: string; entityType: string; entityId: string; entityName: string; createdAt: string }[]>('/follows'),

  addFollow: (entityType: string, entityId: string, entityName: string) =>
    request<{ id: string }>('/follows', {
      method: 'POST', body: JSON.stringify({ entityType, entityId, entityName }),
    }),

  removeFollow: (entityId: string) =>
    request<void>(`/follows/${encodeURIComponent(entityId)}`, { method: 'DELETE' }),
}
