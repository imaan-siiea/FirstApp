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
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerBackTitleVisible: false,
          animation: 'slide_from_right',
          headerShadowVisible: true,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="ballot" options={{ title: 'Your Ballot', animation: 'slide_from_right' }} />
        <Stack.Screen name="candidate/[id]" options={{ title: 'Candidate', animation: 'slide_from_right' }} />
        <Stack.Screen name="chat" options={{ title: 'AI Ballot Guide', animation: 'slide_from_bottom' }} />
<Stack.Screen name="how-to-vote" options={{ title: 'How to Vote', animation: 'slide_from_right' }} />
        <Stack.Screen name="polling-map" options={{ title: 'Find Polling Place', animation: 'slide_from_right' }} />
        <Stack.Screen name="registration/index" options={{ title: 'Register to Vote', animation: 'slide_from_right' }} />
        <Stack.Screen name="registration/[state]" options={{ title: 'Registration Guide', animation: 'slide_from_right' }} />
        <Stack.Screen name="rep/[id]" options={{ title: 'Representative', animation: 'slide_from_right', headerShown: false }} />
        <Stack.Screen name="polls" options={{ title: 'Election Polls', animation: 'slide_from_right', headerShown: false }} />
        <Stack.Screen name="account/index" options={{ title: 'Account', animation: 'slide_from_right' }} />
        <Stack.Screen name="account/login" options={{ title: 'Sign In', animation: 'fade' }} />
        <Stack.Screen name="alerts" options={{ title: 'My Alerts', animation: 'slide_from_right', headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  )
}
