import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

interface AppState {
  address: string | null
  userId: string | null
  hydrated: boolean
  setAddress: (address: string) => void
  setAuth: (userId: string, accessToken: string, refreshToken: string) => Promise<void>
  clearAuth: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  address: null,
  userId: null,
  hydrated: false,

  setAddress: (address) => {
    SecureStore.setItemAsync('savedAddress', address).catch(() => {})
    set({ address })
  },

  setAuth: async (userId, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken)
    await SecureStore.setItemAsync('refreshToken', refreshToken)
    await SecureStore.setItemAsync('savedUserId', userId)
    set({ userId })
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
    await SecureStore.deleteItemAsync('savedUserId')
    set({ userId: null })
  },

  hydrate: async () => {
    try {
      const [address, userId] = await Promise.all([
        SecureStore.getItemAsync('savedAddress'),
        SecureStore.getItemAsync('savedUserId'),
      ])
      set({ address: address ?? null, userId: userId ?? null, hydrated: true })
    } catch {
      set({ hydrated: true })
    }
  },
}))
