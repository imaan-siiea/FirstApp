import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeader()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...authHeaders, ...options.headers },
  })
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

  chat: (messages: { role: string; content: string }[], address: string) =>
    request<{ answer: string }>('/ai/chat', {
      method: 'POST', body: JSON.stringify({ messages, address }),
    }),

  getRegistration: (stateCode: string) =>
    request<any>(`/registration/${stateCode}`),

  getRegistrationStates: () =>
    request<{ code: string; name: string }[]>('/registration'),

  getRegistrationSites: (stateCode: string, address: string) =>
    request<{ sites: any[] }>(`/registration/${stateCode}/sites`, {
      method: 'POST', body: JSON.stringify({ address }),
    }),

  login: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
}
