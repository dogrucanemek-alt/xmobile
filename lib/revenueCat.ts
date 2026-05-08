import Purchases, { LOG_LEVEL, type CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';

const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '';
const RC_IOS_KEY     = process.env.EXPO_PUBLIC_RC_IOS_KEY     ?? '';

export const RC_ENTITLEMENT = 'pro';

export function revenueCatBaslat() {
  const key = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY;
  if (!key) return;
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: key });
}

export async function proMuKontrol(): Promise<boolean> {
  try {
    const info: CustomerInfo = await Purchases.getCustomerInfo();
    return info.entitlements.active[RC_ENTITLEMENT] !== undefined;
  } catch {
    return false;
  }
}

export async function tekliflerAl() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch {
    return null;
  }
}

export async function satin(packageToBuy: any): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
    return customerInfo.entitlements.active[RC_ENTITLEMENT] !== undefined;
  } catch (e: any) {
    if (!e.userCancelled) throw e;
    return false;
  }
}

export async function geriYukle(): Promise<boolean> {
  try {
    const info = await Purchases.restorePurchases();
    return info.entitlements.active[RC_ENTITLEMENT] !== undefined;
  } catch {
    return false;
  }
}
