import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import * as FileSystem from './fileSystem';
import { ThemeProvider, useTheme } from './themeContext';
import { I18nProvider, useI18n } from './i18nContext';

interface AppContextValue {
  // Theme
  karanlik: boolean;
  renkler: ReturnType<typeof useTheme>['renkler'];
  aksanRenk: string;
  temaToggle: () => void;
  temaGecisAnimValue: ReturnType<typeof useTheme>['temaGecisAnimValue'];
  // i18n
  dil: 'tr' | 'en';
  dilDegistir: (d: 'tr' | 'en') => void;
  t: ReturnType<typeof useI18n>['t'];
  // Avatar
  avatarGlbUri: string | null;
  loadAvatarGlb: (path: string) => Promise<void>;
  clearAvatarGlb: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function AppProviderInner({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const i18n = useI18n();
  const [avatarGlbUri, setAvatarGlbUri] = useState<string | null>(null);
  const loadedPathRef = useRef<string | null>(null);

  const loadAvatarGlb = useCallback(async (path: string) => {
    if (loadedPathRef.current === path && avatarGlbUri) return;
    try {
      const b64 = await FileSystem.readAsStringAsync(path, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const uri = `data:model/gltf-binary;base64,${b64}`;
      loadedPathRef.current = path;
      setAvatarGlbUri(uri);
    } catch {
      setAvatarGlbUri(null);
      loadedPathRef.current = null;
    }
  }, [avatarGlbUri]);

  const clearAvatarGlb = useCallback(() => {
    setAvatarGlbUri(null);
    loadedPathRef.current = null;
  }, []);

  const value = useMemo(
    () => ({
      karanlik: theme.karanlik,
      renkler: theme.renkler,
      aksanRenk: theme.aksanRenk,
      temaToggle: theme.temaToggle,
      temaGecisAnimValue: theme.temaGecisAnimValue,
      dil: i18n.dil,
      dilDegistir: i18n.dilDegistir,
      t: i18n.t,
      avatarGlbUri,
      loadAvatarGlb,
      clearAvatarGlb,
    }),
    [theme, i18n, avatarGlbUri, loadAvatarGlb, clearAvatarGlb],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppProviderInner>{children}</AppProviderInner>
      </I18nProvider>
    </ThemeProvider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

// Re-export individual hooks for more granular use
export { useTheme } from './themeContext';
export { useI18n } from './i18nContext';
