import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from './fileSystem';

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
    yukleniyorText: 'X kombinlerinizi hazırlıyor...',
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
    yukleniyorText: 'X is preparing your outfits...',
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

interface AppContextValue {
  t: typeof çeviriler['tr'] | typeof çeviriler['en'];
  renkler: Renkler;
  aksanRenk: string;
  temaToggle: () => void;
  dil: 'tr' | 'en';
  dilDegistir: (d: 'tr' | 'en') => void;
  karanlik: boolean;
  avatarGlbUri: string | null;
  loadAvatarGlb: (path: string) => Promise<void>;
  clearAvatarGlb: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [karanlik, setKaranlik] = useState(true);
  const [dil, setDil] = useState<'tr' | 'en'>('tr');
  const [avatarGlbUri, setAvatarGlbUri] = useState<string | null>(null);
  // Hangi path'in yüklendiğini tutar — aynı path için tekrar diskten okumayı önler
  const loadedPathRef = useRef<string | null>(null);

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

  const loadAvatarGlb = useCallback(async (path: string) => {
    if (loadedPathRef.current === path && avatarGlbUri) return; // zaten yüklü
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

  const renkler = karanlik ? karanlıkRenkler : açıkRenkler;
  const t = çeviriler[dil];
  const aksanRenk = karanlik ? '#2997ff' : '#2997ff';

  const value = useMemo(
    () => ({ t, renkler, aksanRenk, temaToggle, dil, dilDegistir, karanlik, avatarGlbUri, loadAvatarGlb, clearAvatarGlb }),
    [t, renkler, temaToggle, dil, dilDegistir, karanlik, avatarGlbUri, loadAvatarGlb, clearAvatarGlb],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
