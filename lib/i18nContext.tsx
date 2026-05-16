import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DIL_KEY = 'xmobile_dil';

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
    yukleniyorText: 'True Ai kombinlerinizi hazırlıyor...',
    buKombin: 'Bu Kombin',
    buKombiniSec: 'Bu Kombini Seç ✓',
    tekrarDene: 'Tekrar Dene',
    kombinSecildi: 'Kombin Seçildi',
    iyiGunler: 'İyi günler! 🎉',
    hissedilen: 'Hissedilen',
    nem: 'Nem',
    gardırobunuzBos: 'Gardırobunuz boş',
    kiyafetEkleyinAciklama: 'Kıyafetlerinizi ekleyerek AI kombin önerileri almaya başlayın.',
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
    yukleniyorText: 'True Ai is preparing your outfits...',
    buKombin: 'This Outfit',
    buKombiniSec: 'Select This Outfit ✓',
    tekrarDene: 'Try Again',
    kombinSecildi: 'Outfit Selected',
    iyiGunler: 'Have a great day! 🎉',
    hissedilen: 'Feels like',
    nem: 'Humidity',
    gardırobunuzBos: 'Your wardrobe is empty',
    kiyafetEkleyinAciklama: 'Add your clothes to start getting AI outfit suggestions.',
  },
};

type Ceviri = typeof çeviriler['tr'];
type TFunc = ((key: string) => string) & Ceviri;

interface I18nContextValue {
  dil: 'tr' | 'en';
  dilDegistir: (d: 'tr' | 'en') => void;
  t: TFunc;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [dil, setDil] = useState<'tr' | 'en'>('tr');

  useEffect(() => {
    AsyncStorage.getItem(DIL_KEY).then((d) => {
      if (d === 'tr' || d === 'en') setDil(d);
    });
  }, []);

  const dilDegistir = useCallback((yeniDil: 'tr' | 'en') => {
    AsyncStorage.setItem(DIL_KEY, yeniDil);
    setDil(yeniDil);
  }, []);

  const t = useMemo<TFunc>(() => {
    const dict = çeviriler[dil];
    const fn = (key: string): string => {
      const val = (dict as Record<string, string>)[key];
      return typeof val === 'string' ? val : key;
    };
    return Object.assign(fn, dict) as TFunc;
  }, [dil]);

  const value = useMemo(
    () => ({ dil, dilDegistir, t }),
    [dil, dilDegistir, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
