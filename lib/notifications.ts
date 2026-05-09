import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_KEY = 'xmobile_notif_scheduled';
const NOTIF_ACIK_KEY = 'xmobile_notif_acik';

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

    await Notif.cancelAllScheduledNotificationsAsync();
    await Notif.scheduleNotificationAsync({
      content: {
        title: dil === 'en' ? '👔 What will you wear today?' : '👔 Bugün ne giyeceksin?',
        body: dil === 'en'
          ? 'Open xmobile to get your AI outfit suggestion!'
          : 'xmobile\'ı aç, bugünkü AI kombin önerini al!',
        data: { ekran: 'outfits' },
      },
      trigger: {
        type: Notif.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
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
