import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_KEY      = 'xmobile_notif_scheduled';
const NOTIF_ACIK_KEY = 'xmobile_notif_acik';
const NOTIF_SAAT_KEY = 'xmobile_notif_saat';

// expo-notifications push support removed from Expo Go in SDK 53+
// Conditionally import to avoid startup crash in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';
type N = typeof import('expo-notifications');
const Notif: N | null = isExpoGo
  ? null
  : (() => { try { return require('expo-notifications'); } catch { return null; } })();

if (Notif) {
  Notif.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export const bildirimIzniAl = async (): Promise<boolean> => {
  if (!Notif) return false;
  try {
    const { status: mevcut } = await Notif.getPermissionsAsync();
    if (mevcut === 'granted') return true;
    const { status } = await Notif.requestPermissionsAsync();
    return status === 'granted';
  } catch { return false; }
};

export const bildirimAcikMi = async (): Promise<boolean> => {
  const val = await AsyncStorage.getItem(NOTIF_ACIK_KEY);
  return val !== 'false';
};

export const bildirimSaatAl = async (): Promise<number> => {
  const val = await AsyncStorage.getItem(NOTIF_SAAT_KEY);
  return val ? parseInt(val, 10) : 8;
};

export const bildirimSaatKaydet = async (saat: number) => {
  await AsyncStorage.setItem(NOTIF_SAAT_KEY, String(saat));
};

export const gunlukBildirimKur = async (dil?: 'tr' | 'en') => {
  if (!Notif) return;
  try {
    const acik = await bildirimAcikMi();
    if (!acik) return;

    if (!dil) {
      const stored = await AsyncStorage.getItem('xmobile_dil');
      dil = stored === 'en' ? 'en' : 'tr';
    }

    const izinVar = await bildirimIzniAl();
    if (!izinVar) return;

    const saat = await bildirimSaatAl();

    await Notif.cancelAllScheduledNotificationsAsync();
    await Notif.scheduleNotificationAsync({
      content: {
        title: dil === 'en' ? '✨ Good morning! Style time.' : '✨ Günaydın! Kombin zamanı.',
        body: dil === 'en'
          ? 'Your AI stylist is ready — what will you wear today?'
          : 'Moda AI\'ın hazır — bugün ne giyeceksin?',
        data: { ekran: 'ai', sabah: true },
      },
      trigger: {
        type: Notif.SchedulableTriggerInputTypes.DAILY,
        hour: saat,
        minute: 0,
      },
    });

    await AsyncStorage.setItem(NOTIF_KEY, 'true');
  } catch (_) {}
};

export const bildirimAc = async (dil?: 'tr' | 'en') => {
  await AsyncStorage.setItem(NOTIF_ACIK_KEY, 'true');
  await gunlukBildirimKur(dil);
};

export const bildirimKapat = async () => {
  await AsyncStorage.setItem(NOTIF_ACIK_KEY, 'false');
  if (Notif) {
    try { await Notif.cancelAllScheduledNotificationsAsync(); } catch (_) {}
  }
  await AsyncStorage.removeItem(NOTIF_KEY);
};

export const bildirimIptal = async () => {
  if (Notif) {
    try { await Notif.cancelAllScheduledNotificationsAsync(); } catch (_) {}
  }
  await AsyncStorage.removeItem(NOTIF_KEY);
};
