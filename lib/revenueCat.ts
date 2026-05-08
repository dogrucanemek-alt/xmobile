import AsyncStorage from '@react-native-async-storage/async-storage';

const PRO_KEY = 'xmobile_pro_override';

export const RC_ENTITLEMENT = 'pro';

export function revenueCatBaslat() {
  // Native SDK devre dışı — Kotlin 2.x uyumsuzluğu nedeniyle
  // Store gönderiminde react-native-purchases tekrar eklenecek
}

export async function proMuKontrol(): Promise<boolean> {
  const override = await AsyncStorage.getItem(PRO_KEY);
  return override === 'true';
}

export async function tekliflerAl() {
  return {
    identifier: 'default',
    serverDescription: '',
    metadata: {},
    availablePackages: [
      {
        identifier: 'monthly',
        packageType: 'MONTHLY',
        product: {
          identifier: 'xmobile_pro_monthly',
          description: 'xmobile Pro Aylık',
          title: 'Pro Aylık',
          price: 149.99,
          priceString: '₺149,99',
          currencyCode: 'TRY',
        },
      },
      {
        identifier: 'annual',
        packageType: 'ANNUAL',
        product: {
          identifier: 'xmobile_pro_annual',
          description: 'xmobile Pro Yıllık',
          title: 'Pro Yıllık',
          price: 999.99,
          priceString: '₺999,99',
          currencyCode: 'TRY',
        },
      },
    ],
  };
}

export async function satin(_pkg: any): Promise<boolean> {
  // Gerçek IAP store gönderiminde aktif olacak
  // Test için pro flag'ini ayarla
  await AsyncStorage.setItem(PRO_KEY, 'true');
  return true;
}

export async function geriYukle(): Promise<boolean> {
  const isPro = await AsyncStorage.getItem(PRO_KEY);
  return isPro === 'true';
}
