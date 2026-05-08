import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_KEY = 'xmobile_notif_scheduled';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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

export const gunlukBildirimKur = async (dil: 'tr' | 'en' = 'tr') => {
  const zatenKurulu = await AsyncStorage.getItem(NOTIF_KEY);
  if (zatenKurulu) return;

  const izinVar = await bildirimIzniAl();
  if (!izinVar) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: dil === 'en' ? '👔 What will you wear today?' : '👔 Bugün ne giyeceksin?',
      body: dil === 'en'
        ? 'Open xmobile to get your AI outfit suggestion!'
        : 'xmobile\'ı aç, bugünkü AI kombin önerini al!',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });

  await AsyncStorage.setItem(NOTIF_KEY, 'true');
};

export const bildirimIptal = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(NOTIF_KEY);
};
