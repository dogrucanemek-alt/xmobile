import * as Sentry from '@sentry/react-native';

export function sentryBaslat() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 0 : 0.2,
    enabled: !__DEV__,
  });
}

export const hataRaporla = (hata: unknown, context?: Record<string, unknown>) => {
  if (__DEV__) { console.error(hata); return; }
  Sentry.withScope(scope => {
    if (context) scope.setExtras(context);
    Sentry.captureException(hata);
  });
};
