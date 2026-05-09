import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppProvider } from '../lib/context';
import { ErrorBoundary } from '../lib/error-boundary';
import { SubscriptionProvider } from '../lib/subscriptionContext';
import { AuthProvider } from '../lib/authContext';
import { gunlukBildirimKur } from '../lib/notifications';
import { sentryBaslat } from '../lib/sentry';
import { revenueCatBaslat } from '../lib/revenueCat';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

sentryBaslat();
revenueCatBaslat();

// expo-notifications push support removed from Expo Go in SDK 53+
const isExpoGo = Constants.appOwnership === 'expo';

function NotificationHandler() {
  const router = useRouter();
  const listener = useRef<any>(null);

  useEffect(() => {
    if (isExpoGo) return;
    try {
      const N = require('expo-notifications');
      listener.current = N.addNotificationResponseReceivedListener((response: any) => {
        const ekran = response.notification.request.content.data?.ekran;
        if (ekran === 'outfits') router.push('/outfits' as any);
      });
    } catch (_) {}
    return () => { try { listener.current?.remove(); } catch (_) {} };
  }, []);

  return null;
}

export default function RootLayout() {
  useEffect(() => { gunlukBildirimKur(); }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <NotificationHandler />
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
              <Stack.Screen name="jarvis" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
              <Stack.Screen name="subscription" options={{ headerShown: false, presentation: 'modal' }} />
            </Stack>
          </SubscriptionProvider>
        </AuthProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}
