import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AppProvider } from '../lib/context';
import { ErrorBoundary } from '../lib/error-boundary';
import { SubscriptionProvider } from '../lib/subscriptionContext';
import { AuthProvider } from '../lib/authContext';
import { gunlukBildirimKur } from '../lib/notifications';
import { sentryBaslat } from '../lib/sentry';
import { revenueCatBaslat } from '../lib/revenueCat';

sentryBaslat();
revenueCatBaslat();

export default function RootLayout() {
  useEffect(() => { gunlukBildirimKur(); }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
              <Stack.Screen name="wardrobe" options={{ headerShown: false }} />
              <Stack.Screen name="outfits" options={{ headerShown: false }} />
              <Stack.Screen name="profile" options={{ headerShown: false }} />
              <Stack.Screen name="history" options={{ headerShown: false }} />
              <Stack.Screen name="avatar" options={{ headerShown: false }} />
              <Stack.Screen name="import-model" options={{ headerShown: false }} />
              <Stack.Screen name="privacy" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
              <Stack.Screen name="subscription" options={{ headerShown: false, presentation: 'modal' }} />
            </Stack>
          </SubscriptionProvider>
        </AuthProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}