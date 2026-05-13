import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { AppProvider, useApp } from '../lib/context';
import { ErrorBoundary } from '../lib/error-boundary';
import { SubscriptionProvider } from '../lib/subscriptionContext';
import { AuthProvider } from '../lib/authContext';
import { gunlukBildirimKur } from '../lib/notifications';
import { sentryBaslat } from '../lib/sentry';
import { revenueCatBaslat } from '../lib/revenueCat';
import { analyticsBaslat } from '../lib/analytics';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

sentryBaslat();
revenueCatBaslat();
analyticsBaslat();

// expo-notifications push support removed from Expo Go in SDK 53+
const isExpoGo = Constants.appOwnership === 'expo';

function ThemeFlashOverlay() {
  const { temaGecisAnimValue, karanlik } = useApp();
  const bgColor = karanlik ? '#fff' : '#000';
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { backgroundColor: bgColor, opacity: temaGecisAnimValue, zIndex: 9999 }]}
    />
  );
}

function DeepLinkHandler() {
  useEffect(() => {
    // İlk açılışta URL varsa işle
    Linking.getInitialURL().then(url => { if (url) deepLinkIsle(url); });
    // Uygulama açıkken gelen linkler
    const sub = Linking.addEventListener('url', ({ url }) => deepLinkIsle(url));
    return () => sub.remove();
  }, []);

  const deepLinkIsle = async (url: string) => {
    if (!url) return;
    try {
      // Hem # hem ? formatını destekle: xmobile://login#access_token=... veya ?token_hash=...
      const parsed = Linking.parse(url);
      const params: Record<string, string> = {};

      // Query params
      Object.entries(parsed.queryParams ?? {}).forEach(([k, v]) => {
        if (typeof v === 'string') params[k] = v;
      });

      // Hash params (#key=val&key2=val2)
      const hashStr = url.split('#')[1] ?? '';
      hashStr.split('&').forEach(p => {
        const [k, v] = p.split('=');
        if (k && v) params[k] = decodeURIComponent(v);
      });

      const accessToken  = params['access_token'];
      const refreshToken = params['refresh_token'];
      const tokenHash    = params['token_hash'];
      const type         = params['type'] ?? 'magiclink';

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      } else if (tokenHash) {
        await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any });
      }
    } catch { /* deep link parse hatası — sessizce geç */ }
  };

  return null;
}

function NotificationHandler() {
  const router = useRouter();
  const listener = useRef<any>(null);

  useEffect(() => {
    if (isExpoGo) return;
    try {
      const N = require('expo-notifications');
      listener.current = N.addNotificationResponseReceivedListener((response: any) => {
        const { ekran, sabah } = response.notification.request.content.data ?? {};
        if (ekran === 'ai') router.push(sabah ? '/(tabs)/ai?sabah=1' : '/(tabs)/ai' as any);
        else if (ekran === 'outfits') router.push('/(tabs)/outfits' as any);
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
            <DeepLinkHandler />
            <NotificationHandler />
            <ThemeFlashOverlay />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index"       options={{ headerShown: false }} />
              <Stack.Screen name="login"       options={{ headerShown: false, gestureEnabled: false }} />
              <Stack.Screen name="onboarding"  options={{ headerShown: false, gestureEnabled: false }} />
              <Stack.Screen name="history"     options={{ headerShown: false }} />
              <Stack.Screen name="takvim"      options={{ headerShown: false }} />
              <Stack.Screen name="analiz"      options={{ headerShown: false }} />
              <Stack.Screen name="urun-sorgula"   options={{ headerShown: false }} />
              <Stack.Screen name="haftalik-rapor" options={{ headerShown: false }} />
              <Stack.Screen name="avatar"      options={{ headerShown: false }} />
              <Stack.Screen name="import-model" options={{ headerShown: false }} />
              <Stack.Screen name="privacy"     options={{ headerShown: false }} />
              <Stack.Screen name="jarvis"      options={{ headerShown: false }} />
              <Stack.Screen name="subscription" options={{ headerShown: false, presentation: 'modal' }} />
            </Stack>
          </SubscriptionProvider>
        </AuthProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}
