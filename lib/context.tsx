import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TEMA_KEY = 'xmobile_karanlik';
const DIL_KEY  = 'xmobile_dil';

const çeviriler = {
  tr: {
    tagline: 'Yapay zeka destekli gardırobunuzla her gün doğru kombinasyonu giyin.',
    gardırobunuKur: 'Gardırobunu Kur',
    profilimDuzenle: 'Profilimi Düzenle',
    hesabınVarMı: 'Zaten hesabın var mı?',
    girisYap: 'Giriş Yap',
    gardırobum: 'Gardırobum',
    duzenlemekIcin: 'düzenlemek için tıkla',
    kiyafet: 'kıyafet',
    kiyafetEkle: 'Kıyafet Ekle',
    nasılEklemek: 'Nasıl eklemek istersin?',
    fotografCek: 'Fotoğraf Çek',
    galeridenSec: 'Galeriden Seç',
    iptal: 'İptal',
    kombinOnerisiAl: 'Kombin Önerileri Al',
    kiyafetDuzenle: 'Kıyafeti Düzenle',
    kaydet: 'Kaydet',
    kiyafetAdi: 'Kıyafet Adı',
    tur: 'Tür',
    sezon: 'Sezon',
    buKiyafetiSil: 'Bu Kıyafeti Sil',
    silOnay: 'Silmek istiyor musun?',
    sil: 'Sil',
    geri: '‹ Geri',
    ekle: '+ Ekle',
    bugunkuKombinler: 'Bugünkü Kombinler',
    yukleniyorText: 'AI kombinlerinizi hazırlıyor...',
    buKombin: 'Bu Kombin',
    buKombiniSec: 'Bu Kombini Seç ✓',
    tekrarDene: 'Tekrar Dene',
    kombinSecildi: 'Kombin Seçildi',
    iyiGunler: 'İyi günler! 🎉',
    hissedilen: 'Hissedilen',
    nem: 'Nem',
  },
  en: {
    tagline: 'Wear the right outfit every day with your AI-powered wardrobe.',
    gardırobunuKur: 'Set Up Wardrobe',
    profilimDuzenle: 'Edit Profile',
    hesabınVarMı: 'Already have an account?',
    girisYap: 'Sign In',
    gardırobum: 'My Wardrobe',
    duzenlemekIcin: 'tap to edit',
    kiyafet: 'items',
    kiyafetEkle: 'Add Item',
    nasılEklemek: 'How would you like to add?',
    fotografCek: 'Take Photo',
    galeridenSec: 'Choose from Gallery',
    iptal: 'Cancel',
    kombinOnerisiAl: 'Get Outfit Suggestions',
    kiyafetDuzenle: 'Edit Item',
    kaydet: 'Save',
    kiyafetAdi: 'Item Name',
    tur: 'Type',
    sezon: 'Season',
    buKiyafetiSil: 'Delete This Item',
    silOnay: 'Are you sure?',
    sil: 'Delete',
    geri: '‹ Back',
    ekle: '+ Add',
    bugunkuKombinler: "Today's Outfits",
    yukleniyorText: 'AI is preparing your outfits...',
    buKombin: 'This Outfit',
    buKombiniSec: 'Select This Outfit ✓',
    tekrarDene: 'Try Again',
    kombinSecildi: 'Outfit Selected',
    iyiGunler: 'Have a great day! 🎉',
    hissedilen: 'Feels like',
    nem: 'Humidity',
  },
};

const açıkRenkler = {
  bg: '#FFFFFF',
  bg2: '#F9F9F9',
  metin: '#0A0A0A',
  metin2: '#888888',
  sinir: '#E5E5E5',
  sinir2: '#DDDDDD',
  kart: '#FFFFFF',
  chip: '#F5F5F5',
  btnPrimary: '#0A0A0A',
  btnPrimaryMetin: '#FFFFFF',
  statusBar: 'dark-content' as const,
};

const karanlıkRenkler = {
  bg: '#0A0A0A',
  bg2: '#111111',
  metin: '#FFFFFF',
  metin2: '#888888',
  sinir: '#222222',
  sinir2: '#333333',
  kart: '#1A1A1A',
  chip: '#222222',
  btnPrimary: '#FFFFFF',
  btnPrimaryMetin: '#0A0A0A',
  statusBar: 'light-content' as const,
};

type Renkler = typeof açıkRenkler | typeof karanlıkRenkler;

interface AppContextValue {
  t: typeof çeviriler['tr'] | typeof çeviriler['en'];
  renkler: Renkler;
  temaToggle: () => void;
  dil: 'tr' | 'en';
  dilDegistir: (d: 'tr' | 'en') => void;
  karanlik: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [karanlik, setKaranlik] = useState(false);
  const [dil, setDil] = useState<'tr' | 'en'>('tr');

  useEffect(() => {
    AsyncStorage.multiGet([TEMA_KEY, DIL_KEY]).then((pairs) => {
      const tema = pairs[0][1];
      const d    = pairs[1][1];
      if (tema !== null) setKaranlik(tema === 'true');
      if (d === 'tr' || d === 'en') setDil(d);
    });
  }, []);

  const temaToggle = useCallback(() => {
    setKaranlik(prev => {
      const next = !prev;
      AsyncStorage.setItem(TEMA_KEY, String(next));
      return next;
    });
  }, []);

  const dilDegistir = useCallback((yeniDil: 'tr' | 'en') => {
    AsyncStorage.setItem(DIL_KEY, yeniDil);
    setDil(yeniDil);
  }, []);

  const renkler = karanlik ? karanlıkRenkler : açıkRenkler;
  const t = çeviriler[dil];

  const value = useMemo(
    () => ({ t, renkler, temaToggle, dil, dilDegistir, karanlik }),
    [t, renkler, temaToggle, dil, dilDegistir, karanlik],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
