import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TEMA_KEY = 'xmobile_karanlik';

const açıkRenkler = {
  bg: '#FFFFFF',
  bg2: '#F5F5F7',
  metin: '#0A0A0A',
  metin2: '#6e6e73',
  sinir: '#E5E5E5',
  sinir2: 'rgba(0,0,0,0.12)',
  kart: '#FFFFFF',
  chip: '#F5F5F7',
  btnPrimary: '#0A0A0A',
  btnPrimaryMetin: '#FFFFFF',
  aksanRenk: '#2997ff',
  statusBar: 'dark-content' as const,
};

const karanlıkRenkler = {
  bg: '#000000',
  bg2: '#000000',
  metin: '#FFFFFF',
  metin2: 'rgba(255,255,255,0.65)',
  sinir: 'rgba(255,255,255,0.1)',
  sinir2: 'rgba(255,255,255,0.06)',
  kart: '#0D0D0D',
  chip: 'rgba(255,255,255,0.1)',
  btnPrimary: '#FFFFFF',
  btnPrimaryMetin: '#000000',
  aksanRenk: '#2997ff',
  statusBar: 'light-content' as const,
};

type Renkler = typeof açıkRenkler | typeof karanlıkRenkler;

interface ThemeContextValue {
  karanlik: boolean;
  renkler: Renkler;
  aksanRenk: string;
  temaToggle: () => void;
  temaGecisAnimValue: Animated.Value;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [karanlik, setKaranlik] = useState(true);
  const temaGecisAnimValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(TEMA_KEY).then((tema) => {
      if (tema !== null) setKaranlik(tema === 'true');
    });
  }, []);

  const temaToggle = useCallback(() => {
    Animated.sequence([
      Animated.timing(temaGecisAnimValue, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(temaGecisAnimValue, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      setKaranlik(prev => {
        const next = !prev;
        AsyncStorage.setItem(TEMA_KEY, String(next));
        return next;
      });
    }, 150);
  }, [temaGecisAnimValue]);

  const renkler = karanlik ? karanlıkRenkler : açıkRenkler;
  const aksanRenk = '#2997ff';

  const value = useMemo(
    () => ({ karanlik, renkler, aksanRenk, temaToggle, temaGecisAnimValue }),
    [karanlik, renkler, temaToggle, temaGecisAnimValue],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
