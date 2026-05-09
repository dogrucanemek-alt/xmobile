import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Tier = 'free' | 'basic' | 'pro';

interface AylikSayac {
  ay: string;
  sayi: number;
}

interface SubscriptionContextType {
  tier: Tier;
  aylikKullanim: number;
  can3D: () => boolean;
  kullanim3DArtir: () => Promise<void>;
  tierDegistir: (yeniTier: Tier) => Promise<void>;
}

const TIER_KEY = 'xmobile_subscription_tier';
const SAYAC_KEY = 'xmobile_3d_monthly_count';
const TIER_LIMITLER: Record<Tier, number> = {
  free: 0,
  basic: 10,
  pro: Infinity,
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  tier: 'free',
  aylikKullanim: 0,
  can3D: () => false,
  kullanim3DArtir: async () => {},
  tierDegistir: async () => {},
});

function simdikiAy(): string {
  return new Date().toISOString().slice(0, 7);
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<Tier>('free');
  const [aylikKullanim, setAylikKullanim] = useState(0);

  useEffect(() => {
    (async () => {
      const [kayitliTier, kayitliSayac] = await Promise.all([
        AsyncStorage.getItem(TIER_KEY),
        AsyncStorage.getItem(SAYAC_KEY),
      ]);
      if (kayitliTier) setTier(kayitliTier as Tier);
      if (kayitliSayac) {
        const sayac: AylikSayac = JSON.parse(kayitliSayac);
        if (sayac.ay === simdikiAy()) setAylikKullanim(sayac.sayi);
      }
    })();
  }, []);

  const can3D = useCallback(() => {
    const limit = TIER_LIMITLER[tier];
    return aylikKullanim < limit;
  }, [tier, aylikKullanim]);

  const kullanim3DArtir = useCallback(async () => {
    const yeniSayi = aylikKullanim + 1;
    setAylikKullanim(yeniSayi);
    const sayac: AylikSayac = { ay: simdikiAy(), sayi: yeniSayi };
    await AsyncStorage.setItem(SAYAC_KEY, JSON.stringify(sayac));
  }, [aylikKullanim]);

  const tierDegistir = useCallback(async (yeniTier: Tier) => {
    setTier(yeniTier);
    await AsyncStorage.setItem(TIER_KEY, yeniTier);
  }, []);

  return (
    <SubscriptionContext.Provider value={{ tier, aylikKullanim, can3D, kullanim3DArtir, tierDegistir }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
