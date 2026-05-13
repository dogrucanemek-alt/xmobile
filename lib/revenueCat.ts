import AsyncStorage from '@react-native-async-storage/async-storage';

const PRO_KEY = 'xmobile_pro_override';
export const RC_ENTITLEMENT = 'pro';

const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '';
const RC_IOS_KEY     = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '';

let Purchases: any = null;

// Conditionally load react-native-purchases (available after native build)
try {
  Purchases = require('react-native-purchases').default;
} catch {
  // Not installed — using mock for Expo Go / dev builds
}

export function revenueCatBaslat() {
  if (!Purchases) return;
  try {
    const { Platform } = require('react-native');
    const apiKey = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY;
    if (!apiKey) return;
    Purchases.configure({ apiKey });
  } catch {}
}

export async function proMuKontrol(): Promise<boolean> {
  if (Purchases) {
    try {
      const info = await Purchases.getCustomerInfo();
      return !!info.entitlements.active[RC_ENTITLEMENT];
    } catch {}
  }
  const override = await AsyncStorage.getItem(PRO_KEY);
  return override === 'true';
}

export async function tekliflerAl() {
  if (Purchases) {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) return offerings.current;
    } catch {}
  }
  // Mock — matches real RevenueCat offering shape
  return {
    identifier: 'default',
    serverDescription: '',
    metadata: {},
    availablePackages: [
      {
        identifier: '$rc_monthly',
        packageType: 'MONTHLY',
        product: {
          identifier: 'xmobile_pro_monthly',
          description: 'xmobile Pro Aylık',
          title: 'Pro Aylık',
          price: 59.99,
          priceString: '₺59,99',
          currencyCode: 'TRY',
        },
      },
      {
        identifier: '$rc_annual',
        packageType: 'ANNUAL',
        product: {
          identifier: 'xmobile_pro_annual',
          description: 'xmobile Pro Yıllık',
          title: 'Pro Yıllık',
          price: 390.00,
          priceString: '₺390,00',
          currencyCode: 'TRY',
        },
      },
      {
        identifier: '$rc_lifetime',
        packageType: 'LIFETIME',
        product: {
          identifier: 'xmobile_pro_lifetime',
          description: 'xmobile Pro Ömür Boyu — İlk 200 Kişi',
          title: 'Pro Ömür Boyu',
          price: 490.00,
          priceString: '₺490,00',
          currencyCode: 'TRY',
        },
      },
    ],
  };
}

export async function satin(pkg: any): Promise<boolean> {
  if (Purchases) {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return !!customerInfo.entitlements.active[RC_ENTITLEMENT];
    } catch (e: any) {
      if (e?.userCancelled) return false;
      throw e;
    }
  }
  // Dev mock: always succeeds
  await AsyncStorage.setItem(PRO_KEY, 'true');
  return true;
}

export async function geriYukle(): Promise<boolean> {
  if (Purchases) {
    try {
      const info = await Purchases.restorePurchases();
      return !!info.entitlements.active[RC_ENTITLEMENT];
    } catch {}
  }
  const isPro = await AsyncStorage.getItem(PRO_KEY);
  return isPro === 'true';
}
