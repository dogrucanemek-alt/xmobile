import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_KEY = 'xmobile_notif_scheduled';
const NOTIF_ACIK_KEY = 'xmobile_notif_acik';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const bildirimIzniAl = async (): Promise<boolean> => {
  const { status: mevcut } = await Notifications.getPermissionsAsync();
  if (mevcut === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const bildirimAcikMi = async (): Promise<boolean> => {
  const val = await AsyncStorage.getItem(NOTIF_ACIK_KEY);
  return val !== 'false';
};

export const gunlukBildirimKur = async (dil?: 'tr' | 'en') => {
  const acik = await bildirimAcikMi();
  if (!acik) return;

  if (!dil) {
    const stored = await AsyncStorage.getItem('xmobile_dil');
    dil = stored === 'en' ? 'en' : 'tr';
  }

  const izinVar = await bildirimIzniAl();
  if (!izinVar) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: dil === 'en' ? '👔 What will you wear today?' : '👔 Bugün ne giyeceksin?',
      body: dil === 'en'
        ? 'Open xmobile to get your AI outfit suggestion!'
        : 'xmobile\'ı aç, bugünkü AI kombin önerini al!',
      data: { ekran: 'outfits' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });

  await AsyncStorage.setItem(NOTIF_KEY, 'true');
};

export const bildirimAc = async (dil?: 'tr' | 'en') => {
  await AsyncStorage.setItem(NOTIF_ACIK_KEY, 'true');
  await gunlukBildirimKur(dil);
};

export const bildirimKapat = async () => {
  await AsyncStorage.setItem(NOTIF_ACIK_KEY, 'false');
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(NOTIF_KEY);
};

export const bildirimIptal = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(NOTIF_KEY);
};
