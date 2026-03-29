import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

interface AppState {
  address: string | null
  userId: string | null
  setAddress: (address: string) => void
  setAuth: (userId: string, accessToken: string, refreshToken: string) => Promise<void>
  clearAuth: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  address: null,
  userId: null,

  setAddress: (address) => set({ address }),

  setAuth: async (userId, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken)
    await SecureStore.setItemAsync('refreshToken', refreshToken)
    set({ userId })
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
    set({ userId: null })
  },
}))
