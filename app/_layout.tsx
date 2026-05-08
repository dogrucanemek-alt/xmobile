import { Stack } from 'expo-router';
import { AppProvider } from '../lib/context';
import { ErrorBoundary } from '../lib/error-boundary';
import { SubscriptionProvider } from '../lib/subscriptionContext';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <SubscriptionProvider>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="wardrobe" options={{ headerShown: false }} />
            <Stack.Screen name="outfits" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="history" options={{ headerShown: false }} />
            <Stack.Screen name="avatar" options={{ headerShown: false }} />
            <Stack.Screen name="import-model" options={{ headerShown: false }} />
          </Stack>
        </SubscriptionProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}