import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 1000 * 60 * 5 } },
})

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1e3a5f' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'VoterIQ' }} />
        <Stack.Screen name="ballot" options={{ title: 'Your Ballot' }} />
        <Stack.Screen name="candidate/[id]" options={{ title: 'Candidate' }} />
        <Stack.Screen name="chat" options={{ title: 'Ask AI Guide' }} />
        <Stack.Screen name="registration/index" options={{ title: 'Register to Vote' }} />
        <Stack.Screen name="registration/[state]" options={{ title: 'Registration Guide' }} />
        <Stack.Screen name="account/index" options={{ title: 'Account' }} />
        <Stack.Screen name="account/login" options={{ title: 'Sign In' }} />
      </Stack>
    </QueryClientProvider>
  )
}
