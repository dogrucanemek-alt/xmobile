import { Stack } from 'expo-router';
import { AppProvider } from './context';
import { ErrorBoundary } from './error-boundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="wardrobe" options={{ headerShown: false }} />
          <Stack.Screen name="outfits" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
        </Stack>
      </AppProvider>
    </ErrorBoundary>
  );
}