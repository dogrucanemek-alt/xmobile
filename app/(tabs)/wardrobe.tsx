import { Text, View, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Alert, TextInput, Modal, TextStyle, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from '../../lib/fileSystem';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../../lib/context';
import { useAuth } from '../../lib/authContext';
import type { Kiyafet, KombinKayit } from '../../lib/types';
import { kiyafetTani } from '../../lib/vision';
import { AKSESUAR_ALT_TURLERI, AKSESUAR_LABELS_EN } from '../../lib/accessories';
import { arkaPlaniTemizle } from '../../lib/rembgService';
import { syncYukle, syncKaydet, syncSil, syncTumunuYukle, syncBackfillFotos } from '../../lib/wardrobeSync';
import { handleError, logError } from '../../lib/errorHandler';
import { getTestID, getButtonA11yProps, getInputA11yProps, formatCountA11y } from '../../lib/accessibility';

const STORAGE_KEY  = 'xmobile_kiyafetler';
const GECMIS_KEY   = 'xmobile_gecmis';
const VERI_VERSIYON = 2;
const FOTO_DIR = `${FileSystem.documentDirectory}kiyafet_fotolari/`;

const fotografKaydet = async (uri: string): Promise<string> => {
  await FileSystem.makeDirectoryAsync(FOTO_DIR, { intermediates: true });
  const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const hedef = `${FOTO_DIR}${Date.now()}_${Math.round(Math.random() * 1e6)}.${ext}`;
  await FileSystem.copyAsync({ from: uri, to: hedef });
  return hedef;
};

const BASLANGIC: import('../../lib/types').Kiyafet[] = [];

const TURLER   = ['Üst', 'Alt', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'];
const SEZONLAR = ['Tüm Sezon', 'İlkbahar', 'Yaz', 'Sonbahar', 'Kış'];

export default function Wardrobe() {
  const router = useRouter();
  const { t, renkler, aksanRenk, dil } = useApp();
  const { user } = useAuth();

  const [kiyafetler, setKiyafetler]       = useState<Kiyafet[]>([]);
  const [aramaMetni, setAramaMetni]       = useState('');
  const [modalAcik, setModalAcik]         = useState(false);
  const [seciliKiyafet, setSeciliKiyafet] = useState<Kiyafet | null>(null);
  const [duzenAd, setDuzenAd]             = useState('');
  const [duzenTur, setDuzenTur]           = useState('');
  const [duzenAltTur, setDuzenAltTur]     = useState<string>('');
  const [duzenSezon, setDuzenSezon]       = useState('');
  const [duzenFiyat, setDuzenFiyat]       = useState('');
  const [kiyafetKullanim, setKiyafetKullanim] = useState<Record<number, number>>({});
  const [cokluProgress, setCokluProgress] = useState<{simdiki: number; toplam: number} | null>(null);
  const [eklemeMod, setEklemeMod] = useState<null | 'tani' | 'rembg'>(null);
  const [hatalıFotolar, setHatalıFotolar] = useState<Record<number, boolean>>({});

  useEffect(() => { yukle(); yukleKullanim(); }, []);

  const yukle = async () => {
    try {
      const versiyon = await AsyncStorage.getItem('xmobile_veri_v');
      const kayitli  = await AsyncStorage.getItem(STORAGE_KEY);
      let lokal: Kiyafet[] = [];
      if (kayitli && Number(versiyon) >= VERI_VERSIYON) {
        lokal = JSON.parse(kayitli);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        await AsyncStorage.setItem('xmobile_veri_v', String(VERI_VERSIYON));
      }

      if (user) {
        try {
          const uzak = await syncYukle(user.id);
          if (uzak.length > 0) {
            setKiyafetler(uzak);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(uzak));
            // Best-effort: bucket fix sonrası foto_url=null kalan kıyafetleri yeniden yükle
            // Lokalde dosya hâlâ duruyorsa cihaz dışından erişilebilir hale gelir
            syncBackfillFotos(user.id, lokal).catch(() => {});
            return;
          }
          // Supabase boşsa ve lokalde veri varsa → cloud'a yükle
          if (lokal.length > 0) {
            setKiyafetler(lokal);
            syncTumunuYukle(user.id, lokal).catch(() => {});
            return;
          }
        } catch (e) {
          const error = handleError(e);
          logError(error, 'wardrobe.yukle.sync');
          // Supabase başarısız ama lokalde veri varsa kullan
          if (lokal.length > 0) {
            setKiyafetler(lokal);
            return;
          }
        }
      }

      setKiyafetler(lokal.length > 0 ? lokal : BASLANGIC);
    } catch (e) {
      const error = handleError(e);
      logError(error, 'wardrobe.yukle');
      setKiyafetler(BASLANGIC);
    }
  };

  const yukleKullanim = async () => {
    try {
      const gv = await AsyncStorage.getItem(GECMIS_KEY);
      if (!gv) return;
      const gecmis: KombinKayit[] = JSON.parse(gv);
      const sayim: Record<number, number> = {};
      for (const kayit of gecmis) {
        for (const parca of kayit.kombin.parcalar) {
          // Match parca name against kiyafet names (case-insensitive substring)
          const lower = parca.toLowerCase();
          for (const k of kiyafetler) {
            if (lower.includes(k.ad.toLowerCase()) || k.ad.toLowerCase().includes(lower)) {
              sayim[k.id] = (sayim[k.id] ?? 0) + 1;
            }
          }
        }
      }
      setKiyafetKullanim(sayim);
    } catch {}
  };

  const kaydet = async (yeniListe: Kiyafet[], degisen?: Kiyafet, silinenId?: number) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(yeniListe));
    setKiyafetler(yeniListe);
    if (user) {
      if (silinenId !== undefined) {
        syncSil(user.id, silinenId).catch(() => {});
      } else if (degisen) {
        syncKaydet(user.id, degisen).catch(() => {});
      }
    }
  };

  // Lokal sandbox fotoğrafları (Supabase'e yüklenmemiş) — başka cihaz/Expo Go'da görünmez
  const bozukFotoIdler = useMemo(() => {
    const ids = new Set<number>();
    for (const k of kiyafetler) {
      if (k.foto && (k.foto.startsWith('file://') || k.foto.startsWith('content://'))) {
        ids.add(k.id);
      }
      if (hatalıFotolar[k.id]) ids.add(k.id);
    }
    return Array.from(ids);
  }, [kiyafetler, hatalıFotolar]);

  const bozukFotolariTemizle = () => {
    if (bozukFotoIdler.length === 0) {
      Alert.alert(
        dil === 'en' ? 'Nothing to clean' : 'Temizlenecek bir şey yok',
        dil === 'en' ? 'All photos look fine.' : 'Tüm fotoğraflar düzgün görünüyor.',
      );
      return;
    }
    Alert.alert(
      dil === 'en' ? 'Clean Broken Photos' : 'Bozuk Fotoğrafları Temizle',
      dil === 'en'
        ? `${bozukFotoIdler.length} items have broken photos. Remove only the photos (items will stay)?`
        : `${bozukFotoIdler.length} kıyafetin fotoğrafı yüklenemedi. Sadece fotoğrafları kaldırılsın mı (kıyafetler kalacak)?`,
      [
        { text: t.iptal, style: 'cancel' },
        {
          text: dil === 'en' ? 'Clean' : 'Temizle',
          style: 'destructive',
          onPress: async () => {
            try {
              const bozukSet = new Set(bozukFotoIdler);
              const yeniListe = kiyafetler.map(k =>
                bozukSet.has(k.id) ? { ...k, foto: null } : k,
              );
              // Lokali kaydet — anında
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(yeniListe));
              setKiyafetler(yeniListe);
              setHatalıFotolar({});
              // Supabase senkronu — paralel, bitince Alert göster
              if (user) {
                await Promise.allSettled(
                  yeniListe
                    .filter(k => bozukSet.has(k.id))
                    .map(k => syncKaydet(user.id, k)),
                );
              }
              Alert.alert(
                dil === 'en' ? 'Done' : 'Tamam',
                dil === 'en'
                  ? `${bozukFotoIdler.length} photos cleared.`
                  : `${bozukFotoIdler.length} fotoğraf temizlendi.`,
              );
            } catch (e) {
              Alert.alert(
                dil === 'en' ? 'Error' : 'Hata',
                String(e),
              );
            }
          },
        },
      ],
    );
  };

  const fotodanEkle = async (uri: string) => {
    let ad = 'Yeni Kıyafet';
    let tur = 'Üst';
    let altTur: string | undefined;
    setEklemeMod('tani');
    try { ({ ad, tur, altTur } = await kiyafetTani(uri)); } catch (e) { console.warn('Tanıma hatası:', e); }

    // Arka plan temizleme — başarısız olursa orijinali kullan (best-effort)
    setEklemeMod('rembg');
    let temizUri = uri;
    try { temizUri = await arkaPlaniTemizle(uri, user?.id); } catch (e) { console.warn('Rembg hatası:', e); }
    setEklemeMod(null);

    let kaliciUri = temizUri;
    try { kaliciUri = await fotografKaydet(temizUri); } catch {}
    const yeni: Kiyafet = { id: Date.now(), ad, tur, altTur, sezon: 'Tüm Sezon', foto: kaliciUri };
    await kaydet([...kiyafetler, yeni], yeni);
    kiyafetDuzenle(yeni);
  };

  const fotografCek = async () => {
    const izin = await ImagePicker.requestCameraPermissionsAsync();
    if (!izin.granted) return;
    const sonuc = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.85 });
    if (!sonuc.canceled) await fotodanEkle(sonuc.assets[0].uri);
  };

  const galeridenSec = async () => {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) return;
    const sonuc = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.8 });
    if (!sonuc.canceled) await fotodanEkle(sonuc.assets[0].uri);
  };

  const cokluSec = async () => {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) return;
    const sonuc = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 20,
    });
    if (sonuc.canceled || !sonuc.assets.length) return;
    const toplam = sonuc.assets.length;
    setCokluProgress({ simdiki: 0, toplam });
    const yeniListe = [...kiyafetler];
    for (let i = 0; i < sonuc.assets.length; i++) {
      const asset = sonuc.assets[i];
      setCokluProgress({ simdiki: i + 1, toplam });
      let ad = 'Yeni Kıyafet';
      let tur = 'Üst';
      let altTur: string | undefined;
      try { ({ ad, tur, altTur } = await kiyafetTani(asset.uri)); } catch (e) { console.warn('Tanıma hatası:', e); }
      let kaliciUri: string;
      try { kaliciUri = await fotografKaydet(asset.uri); } catch { kaliciUri = asset.uri; }
      const yeniItem: Kiyafet = { id: Date.now() + Math.random(), ad, tur, altTur, sezon: 'Tüm Sezon', foto: kaliciUri };
      yeniListe.push(yeniItem);
      if (user) syncKaydet(user.id, yeniItem).catch(() => {});
    }
    await kaydet(yeniListe);
    setCokluProgress(null);
    Alert.alert('✓', `${toplam} kıyafet eklendi`);
  };

  const ekleSecenekleri = () => {
    const ipucu = dil === 'en'
      ? '💡 Tip: Use product photos (item alone) for best AI try-on results. Photos with a model wearing the item may give unexpected output.'
      : '💡 İpucu: En iyi sanal deneme sonucu için ürün fotoğrafları (kıyafet tek başına) kullan. Modelli (üstte giyilen) fotoğraflar beklenmeyen sonuç verebilir.';
    Alert.alert(
      t.kiyafetEkle,
      `${t.nasılEklemek}\n\n${ipucu}`,
      [
        { text: t.fotografCek,              onPress: fotografCek },
        { text: t.galeridenSec,             onPress: galeridenSec },
        { text: '📚 Çoklu Seç (Galeri)',    onPress: cokluSec },
        { text: t.iptal,                    style: 'cancel' },
      ],
    );
  };

  const kiyafetDuzenle = (k: Kiyafet) => {
    setSeciliKiyafet(k);
    setDuzenAd(k.ad);
    setDuzenTur(k.tur);
    setDuzenAltTur(k.altTur ?? '');
    setDuzenSezon(k.sezon);
    setDuzenFiyat(k.fiyat ? String(k.fiyat) : '');
    setModalAcik(true);
  };

  const duzenKaydet = async () => {
    if (!seciliKiyafet) return;
    const fiyatSayi = duzenFiyat ? parseFloat(duzenFiyat.replace(',', '.')) : undefined;
    const guncellenmisItem: Kiyafet = {
      ...seciliKiyafet,
      ad: duzenAd,
      tur: duzenTur,
      altTur: duzenTur === 'Aksesuar' && duzenAltTur ? duzenAltTur : undefined,
      sezon: duzenSezon,
      fiyat: fiyatSayi && !isNaN(fiyatSayi) ? fiyatSayi : undefined,
    };
    const yeniListe = kiyafetler.map(k => k.id === seciliKiyafet.id ? guncellenmisItem : k);
    await kaydet(yeniListe, guncellenmisItem);
    setModalAcik(false);
  };

  const modalFotoGuncelle = async () => {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) return;
    const sonuc = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.8 });
    if (sonuc.canceled) return;

    // Arka plan temizleme (best-effort)
    setEklemeMod('rembg');
    let temizUri = sonuc.assets[0].uri;
    try { temizUri = await arkaPlaniTemizle(sonuc.assets[0].uri, user?.id); } catch (e) { console.warn('Rembg hatası:', e); }
    setEklemeMod(null);

    let kaliciUri: string;
    try { kaliciUri = await fotografKaydet(temizUri); } catch { kaliciUri = temizUri; }
    if (!seciliKiyafet) return;
    const guncellenmis = { ...seciliKiyafet, foto: kaliciUri };
    setSeciliKiyafet(guncellenmis);
    const yeniListe = kiyafetler.map(k => k.id === guncellenmis.id ? guncellenmis : k);
    await kaydet(yeniListe);
  };

  const sil = (id: number) => {
    Alert.alert(t.buKiyafetiSil, t.silOnay, [
      { text: t.sil, style: 'destructive', onPress: async () => {
        const yeniListe = kiyafetler.filter(k => k.id !== id);
        await kaydet(yeniListe, undefined, id);
        setModalAcik(false);
      }},
      { text: t.iptal, style: 'cancel' },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: renkler.bg2 }]}>
      <StatusBar barStyle={renkler.statusBar} backgroundColor={renkler.bg} />

      <View style={[styles.header, { backgroundColor: renkler.bg }]}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/outfits' as any);
          }}
          testID={getTestID('wardrobe', 'button', 'back')}
          {...getButtonA11yProps('Geri Git', 'Wardrobe ekranından çık')}
        >
          <Text style={[styles.geri, { color: renkler.metin }]}>{t.geri}</Text>
        </TouchableOpacity>
        <Text
          style={[styles.baslik, { color: renkler.metin }]}
          accessibilityRole="header"
        >
          {t.gardırobum}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          {bozukFotoIdler.length > 0 && (
            <TouchableOpacity
              onPress={bozukFotolariTemizle}
              testID={getTestID('wardrobe', 'button', 'clean-broken')}
              {...getButtonA11yProps('Bozuk Fotoğrafları Temizle', 'Yüklenemeyen fotoğrafları kaldır')}
            >
              <Text style={{ fontSize: 18 }}>🧹 {bozukFotoIdler.length}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => router.push('/analiz' as any)}
            testID={getTestID('wardrobe', 'button', 'analysis')}
            {...getButtonA11yProps('Analiz Yap', 'Wardrobe analiz ekranına git')}
          >
            <Text style={{ fontSize: 18 }}>🧠</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={ekleSecenekleri}
            testID={getTestID('wardrobe', 'button', 'add')}
            {...getButtonA11yProps('Kıyafet Ekle', 'Yeni kıyafet ekleme seçeneklerini aç')}
          >
            <Text style={[styles.ekle, { color: aksanRenk }]}>{t.ekle}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Arama */}
      {kiyafetler.length > 0 && (
        <View
          style={[styles.aramaKutu, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}
          testID={getTestID('wardrobe', 'search', 'container')}
        >
          <Text style={{ fontSize: 15, color: renkler.metin2 }} accessibilityRole="image">🔍</Text>
          <TextInput
            style={[styles.aramaInput, { color: renkler.metin }]}
            value={aramaMetni}
            onChangeText={setAramaMetni}
            placeholder={dil === 'en' ? 'Search wardrobe...' : 'Gardıropda ara...'}
            placeholderTextColor={renkler.metin2}
            autoCorrect={false}
            testID={getTestID('wardrobe', 'input', 'search')}
            {...getInputA11yProps('Gardırop Ara', 'İsim, tür veya renge göre ara')}
          />
          {aramaMetni.length > 0 && (
            <TouchableOpacity
              onPress={() => setAramaMetni('')}
              testID={getTestID('wardrobe', 'button', 'clear-search')}
              {...getButtonA11yProps('Aramayı Temizle', 'Arama metnini sil')}
            >
              <Text style={{ fontSize: 16, color: renkler.metin2 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Text
        style={[styles.sayi, { color: renkler.metin2 }]}
        testID={getTestID('wardrobe', 'text', 'count')}
        accessibilityLiveRegion="polite"
      >
        {formatCountA11y(kiyafetler.length, 'kıyafet', 'kıyafet')} · {t.duzenlemekIcin}
      </Text>

      <ScrollView style={styles.liste} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {kiyafetler.length === 0 ? (
          <View style={styles.bosHal}>
            <Text style={{ fontSize: 64, marginBottom: 8 }}>👗</Text>
            <Text style={[styles.bosHalBaslik, { color: renkler.metin }]}>
              {dil === 'en' ? 'Your wardrobe is empty' : 'Gardırobun boş'}
            </Text>
            <Text style={[styles.bosHalAciklama, { color: renkler.metin2 }]}>
              {dil === 'en'
                ? 'Add your clothes to get AI-powered outfit suggestions every day'
                : 'Kıyafetlerini ekle, her gün AI destekli kombin önerileri al'}
            </Text>

            {/* Adım adım yönlendirme */}
            <View style={{ width: '100%', gap: 8, marginBottom: 20 }}>
              {[
                { no: '1', tr: 'Fotoğraf veya isim ile kıyafet ekle', en: 'Add clothes by photo or name' },
                { no: '2', tr: 'AI gardırobunu öğrenir', en: 'AI learns your wardrobe' },
                { no: '3', tr: 'Her gün kişisel kombin önerisi al', en: 'Get daily personalized outfit suggestions' },
              ].map(step => (
                <View key={step.no} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: renkler.kart }]}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,212,255,0.12)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#00D4FF', fontSize: 13, fontWeight: '700' }}>{step.no}</Text>
                  </View>
                  <Text style={{ color: renkler.metin, fontSize: 13, flex: 1 }}>{dil === 'en' ? step.en : step.tr}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.bosHalButon, { backgroundColor: '#00D4FF' }]}
              onPress={ekleSecenekleri}
            >
              <Text style={[styles.bosHalButonText, { color: '#000' }]}>
                + {dil === 'en' ? 'Add First Item' : 'İlk Kıyafeti Ekle'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          kiyafetler
          .filter(k => aramaMetni.length === 0 ||
            k.ad.toLowerCase().includes(aramaMetni.toLowerCase()) ||
            k.tur.toLowerCase().includes(aramaMetni.toLowerCase()) ||
            (k.renk ?? '').toLowerCase().includes(aramaMetni.toLowerCase())
          )
          .map((k) => (
            <View
              key={k.id}
              style={[styles.kiyafetKart, { backgroundColor: renkler.kart }]}
              testID={getTestID('wardrobe', 'item', k.id)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${k.ad}, ${k.tur}, ${k.sezon}`}
              accessibilityHint={k.fiyat ? `Fiyat: ${k.fiyat}₺` : undefined}
            >
              <TouchableOpacity
                style={styles.kartIcerik}
                onPress={() => kiyafetDuzenle(k)}
                accessible={false}
              >
                {k.foto && !hatalıFotolar[k.id] ? (
                  <Image
                    source={{ uri: k.foto }}
                    style={styles.kiyafetFoto}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                    accessibilityLabel={`${k.ad} fotoğrafı`}
                    accessible={true}
                    onError={() => setHatalıFotolar(prev => ({ ...prev, [k.id]: true }))}
                  />
                ) : (
                  <View style={[styles.renkCircle, { backgroundColor: renkler.chip }]}>
                    <Text
                      style={[styles.renkHarf, { color: renkler.metin2 }]}
                      accessibilityRole="image"
                    >
                      {k.ad.charAt(0)}
                    </Text>
                  </View>
                )}
                <View style={styles.bilgi}>
                  <Text style={[styles.kiyafetAd, { color: renkler.metin }]}>{k.ad}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={[styles.kiyafetDetay, { color: renkler.metin2 }]}>{k.tur} · {k.sezon}</Text>
                    {k.fiyat ? (
                      <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                        <Text style={[styles.kiyafetDetay, { color: 'rgba(0,212,255,0.7)' }]}>
                          {k.fiyat}₺
                        </Text>
                        {(kiyafetKullanim[k.id] ?? 0) > 0 && (
                          <Text style={[styles.kiyafetDetay, { color: '#2ED573' }]}>
                            · {(k.fiyat / (kiyafetKullanim[k.id] ?? 1)).toFixed(0)}₺/giyim
                          </Text>
                        )}
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.kartButonlar}>
                    {/* Fashn AI ayakkabı/aksesuar try-on'u desteklemiyor — sadece Üst/Alt/Dış Giyim için göster */}
                    {(k.tur === 'Üst' || k.tur === 'Alt' || k.tur === 'Dış Giyim') && (
                      <TouchableOpacity
                        style={[styles.kartBtn, { borderColor: '#00D4FF' }]}
                        onPress={() => router.push({ pathname: '/outfits', params: { tryOnKiyafetId: k.id } } as any)}
                        testID={getTestID('wardrobe', 'button', `try-on-${k.id}`)}
                        {...getButtonA11yProps(`${k.ad} Dene`, 'Bu kıyafeti kullanarak kombin oluştur')}
                      >
                        <Text style={[styles.kartBtnText, { color: '#00D4FF' }]}>👗 Dene</Text>
                      </TouchableOpacity>
                    )}
                    {k.foto && !hatalıFotolar[k.id] ? (
                      <TouchableOpacity
                        style={[styles.kartBtn, { borderColor: renkler.sinir }]}
                        onPress={async () => {
                          const available = await Sharing.isAvailableAsync();
                          if (available) await Sharing.shareAsync(k.foto!);
                        }}
                        testID={getTestID('wardrobe', 'button', `share-${k.id}`)}
                        {...getButtonA11yProps(`${k.ad} Paylaş`, 'Kıyafet fotoğrafını paylaş')}
                      >
                        <Text style={[styles.kartBtnText, { color: renkler.metin2 }]}>↑ Paylaş</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sil(k.id)}
                style={styles.silBtn}
                testID={getTestID('wardrobe', 'button', `delete-${k.id}`)}
                {...getButtonA11yProps(`${k.ad} Sil`, 'Bu kıyafeti kalıcı olarak sil')}
              >
                <Text style={styles.silBtnText}>🗑</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {cokluProgress && (
        <View style={[styles.progressBar, { backgroundColor: renkler.kart }]}>
          <Text style={[styles.progressText, { color: renkler.metin2 }]}>
            {dil === 'en' ? 'Uploading' : 'Yükleniyor'} {cokluProgress.simdiki}/{cokluProgress.toplam}
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: renkler.sinir }]}>
            <View style={[styles.progressFill, { backgroundColor: renkler.btnPrimary, width: `${(cokluProgress.simdiki / cokluProgress.toplam) * 100}%` as `${number}%` }]} />
          </View>
        </View>
      )}

      {eklemeMod && (
        <View style={[styles.progressBar, { backgroundColor: renkler.kart, borderColor: 'rgba(0,212,255,0.25)', borderWidth: 1 }]}>
          <Text style={[styles.progressText, { color: '#00D4FF', fontWeight: '600' }]}>
            {eklemeMod === 'tani'
              ? (dil === 'en' ? '✨ Recognizing clothing…' : '✨ Kıyafet tanınıyor…')
              : (dil === 'en' ? '🪄 Removing background…'  : '🪄 Arka plan temizleniyor…')}
          </Text>
        </View>
      )}

      <View style={[styles.bottomBar, { backgroundColor: renkler.bg }]}>
        <TouchableOpacity
          style={[styles.gecmisButon, { borderColor: renkler.sinir2 }]}
          onPress={() => router.push('/history')}
          testID={getTestID('wardrobe', 'button', 'history')}
          {...getButtonA11yProps('Geçmiş', 'Kullanılan kombinlerin geçmişini görüntüle')}
        >
          <Text style={[styles.gecmisButonText, { color: renkler.metin }]}>📋</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.kombinButon, { backgroundColor: renkler.btnPrimary, flex: 1 }]}
          onPress={() => router.push('/outfits')}
          testID={getTestID('wardrobe', 'button', 'suggest-outfit')}
          {...getButtonA11yProps('Kombin Önerisi Al', 'Yapay zeka tarafından önerilecek kombin al')}
        >
          <Text style={[styles.kombinButonText, { color: renkler.btnPrimaryMetin }]}>
            {t.kombinOnerisiAl}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Düzenleme Modalı */}
      <Modal
        visible={modalAcik}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        testID={getTestID('wardrobe', 'modal', 'edit')}
        accessible={true}
        accessibilityViewIsModal={true}
      >
        <View style={[styles.modal, { backgroundColor: renkler.bg2 }]}>
          <View style={[styles.modalHeader, { backgroundColor: renkler.bg }]}>
            <TouchableOpacity
              onPress={() => setModalAcik(false)}
              testID={getTestID('wardrobe', 'button', 'modal-cancel')}
              {...getButtonA11yProps('İptal', 'Değişiklikleri kaydetmeden kapat')}
            >
              <Text style={[styles.modalIptal, { color: renkler.metin }]}>{t.iptal}</Text>
            </TouchableOpacity>
            <Text
              style={[styles.modalBaslik, { color: renkler.metin }]}
              accessibilityRole="header"
            >
              {t.kiyafetDuzenle}
            </Text>
            <TouchableOpacity
              onPress={duzenKaydet}
              testID={getTestID('wardrobe', 'button', 'modal-save')}
              {...getButtonA11yProps('Kaydet', 'Değişiklikleri kaydet')}
            >
              <Text style={styles.modalKaydet}>{t.kaydet}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={modalFotoGuncelle} activeOpacity={0.8}>
            {seciliKiyafet?.foto ? (
              <Image source={{ uri: seciliKiyafet.foto }} style={styles.modalFoto} contentFit="cover" transition={200} cachePolicy="memory-disk" />
            ) : (
              <View style={[styles.modalFotoEkle, { backgroundColor: renkler.chip }]}>
                <Text style={[styles.modalFotoEkleText, { color: renkler.metin2 }]}>📷 Fotoğraf Ekle</Text>
              </View>
            )}
          </TouchableOpacity>

          <View
            style={[styles.inputGrup, { backgroundColor: renkler.kart }]}
            testID={getTestID('wardrobe', 'group', 'name')}
          >
            <Text
              style={[styles.inputLabel, { color: renkler.metin2 }]}
              nativeID="label-item-name"
            >
              {t.kiyafetAdi}
            </Text>
            <TextInput
              style={[styles.input, { color: renkler.metin, borderBottomColor: renkler.sinir }]}
              value={duzenAd}
              onChangeText={setDuzenAd}
              placeholder="örn. Beyaz Gömlek"
              placeholderTextColor={renkler.metin2}
              testID={getTestID('wardrobe', 'input', 'name')}
              {...getInputA11yProps('Kıyafet Adı', 'Kıyafetin adını veya açıklamasını gir')}
              nativeID="input-item-name"
            />
          </View>

          <View style={[styles.inputGrup, { backgroundColor: renkler.kart }]}>
            <Text style={[styles.inputLabel, { color: renkler.metin2 }]}>{t.tur}</Text>
            <View style={styles.chipGrup}>
              {TURLER.map(tur => (
                <TouchableOpacity
                  key={tur}
                  style={[styles.chip, { backgroundColor: renkler.chip, borderColor: renkler.sinir },
                    duzenTur === tur && { backgroundColor: renkler.btnPrimary, borderColor: renkler.btnPrimary }
                  ]}
                  onPress={() => {
                    setDuzenTur(tur);
                    if (tur !== 'Aksesuar') setDuzenAltTur('');
                  }}
                >
                  <Text style={[styles.chipText, { color: renkler.metin2 },
                    duzenTur === tur && { color: renkler.btnPrimaryMetin }
                  ]}>{tur}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {duzenTur === 'Aksesuar' && (
            <View style={[styles.inputGrup, { backgroundColor: renkler.kart }]}>
              <Text style={[styles.inputLabel, { color: renkler.metin2 }]}>
                {dil === 'en' ? 'Type' : 'Tip'}
              </Text>
              <View style={styles.chipGrup}>
                {AKSESUAR_ALT_TURLERI.map(altTur => (
                  <TouchableOpacity
                    key={altTur}
                    style={[styles.chip, { backgroundColor: renkler.chip, borderColor: renkler.sinir },
                      duzenAltTur === altTur && { backgroundColor: renkler.btnPrimary, borderColor: renkler.btnPrimary }
                    ]}
                    onPress={() => setDuzenAltTur(altTur)}
                  >
                    <Text style={[styles.chipText, { color: renkler.metin2 },
                      duzenAltTur === altTur && { color: renkler.btnPrimaryMetin }
                    ]}>{dil === 'en' ? AKSESUAR_LABELS_EN[altTur] : altTur}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={[styles.inputGrup, { backgroundColor: renkler.kart }]}>
            <Text style={[styles.inputLabel, { color: renkler.metin2 }]}>{t.sezon}</Text>
            <View style={styles.chipGrup}>
              {SEZONLAR.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, { backgroundColor: renkler.chip, borderColor: renkler.sinir },
                    duzenSezon === s && { backgroundColor: renkler.btnPrimary, borderColor: renkler.btnPrimary }
                  ]}
                  onPress={() => setDuzenSezon(s)}
                >
                  <Text style={[styles.chipText, { color: renkler.metin2 },
                    duzenSezon === s && { color: renkler.btnPrimaryMetin }
                  ]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View
            style={[styles.inputGrup, { backgroundColor: renkler.kart }]}
            testID={getTestID('wardrobe', 'group', 'price')}
          >
            <Text
              style={[styles.inputLabel, { color: renkler.metin2 }]}
              nativeID="label-item-price"
            >
              {t.tur === 'Type' ? 'Purchase Price (₺)' : 'Satın Alma Fiyatı (₺)'}
            </Text>
            <TextInput
              style={[styles.input, { color: renkler.metin, borderBottomColor: renkler.sinir }]}
              value={duzenFiyat}
              onChangeText={setDuzenFiyat}
              placeholder="örn. 299"
              placeholderTextColor={renkler.metin2}
              keyboardType="numeric"
              testID={getTestID('wardrobe', 'input', 'price')}
              {...getInputA11yProps('Satın Alma Fiyatı', 'Kıyafetin fiyatını TL olarak gir')}
              nativeID="input-item-price"
            />
          </View>

          <TouchableOpacity
            style={styles.silButon}
            onPress={() => seciliKiyafet && sil(seciliKiyafet.id)}
            testID={getTestID('wardrobe', 'button', 'delete-item')}
            {...getButtonA11yProps('Kıyafeti Sil', 'Seçili kıyafeti kalıcı olarak sil')}
          >
            <Text style={styles.silButonText}>{t.buKiyafetiSil}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16,
  },
  geri:         { fontSize: 20, fontWeight: '300' },
  baslik:       { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },
  ekle:         { fontSize: 16, fontWeight: '500' },
  sayi:         { fontSize: 13, paddingHorizontal: 24, paddingVertical: 10 },
  liste:        { flex: 1, paddingHorizontal: 16 },
  kiyafetKart: {
    borderRadius: 18, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden',
  },
  kartIcerik: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16 },
  silBtn:     { paddingHorizontal: 18, paddingVertical: 16, justifyContent: 'center' },
  silBtnText: { fontSize: 18 },
  renkCircle:  { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  renkHarf:    { fontSize: 20, fontWeight: '500' },
  kiyafetFoto: { width: 48, height: 60, borderRadius: 12, marginRight: 14 },
  bilgi:       { flex: 1 },
  kiyafetAd:   { fontSize: 15, fontWeight: '500', marginBottom: 3 },
  kiyafetDetay:{ fontSize: 13, marginBottom: 8 },
  kartButonlar:{ flexDirection: 'row', gap: 8 },
  kartBtn:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  kartBtnText: { fontSize: 12, fontWeight: '600' },
  arrow:       { fontSize: 22 },
  aramaKutu: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 4, marginTop: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 0.5,
  },
  aramaInput: { flex: 1, fontSize: 15 },
  bosHal:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32, gap: 12 },
  bosHalIkon:     { fontSize: 52, marginBottom: 8 },
  bosHalBaslik:   { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  bosHalAciklama: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  bosHalButon:    { marginTop: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50 },
  bosHalButonText:{ fontSize: 15, fontWeight: '600' },
  progressBar:    { marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 14, gap: 8 },
  progressText:   { fontSize: 12, fontWeight: '500' },
  progressTrack:  { height: 4, borderRadius: 2 },
  progressFill:   { height: 4, borderRadius: 2 },
  bottomBar:      { paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', gap: 10 },
  gecmisButon:    { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  gecmisButonText:{ fontSize: 22 },
  kombinButon:    { paddingVertical: 17, borderRadius: 50, alignItems: 'center' },
  kombinButonText:{ fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
  modal:       { flex: 1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 60,
  },
  modalIptal:  { fontSize: 16 },
  modalBaslik: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },
  modalKaydet: { fontSize: 16, fontWeight: '600', color: '#2997ff' },
  modalFoto:       { width: '100%', height: 220, resizeMode: 'cover' },
  modalFotoEkle:   { width: '100%', height: 160, alignItems: 'center', justifyContent: 'center' },
  modalFotoEkleText: { fontSize: 16 },
  inputGrup:   { padding: 20, marginTop: 8 },
  inputLabel:  { fontSize: 12, marginBottom: 10, letterSpacing: 0.5 } as TextStyle,
  input:       { fontSize: 17, paddingVertical: 8 },
  chipGrup:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:        { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 50, borderWidth: 1 },
  chipText:    { fontSize: 13 },
  silButon:    { margin: 20, padding: 17, borderRadius: 50, alignItems: 'center', borderWidth: 1, borderColor: '#FF3B30' },
  silButonText:{ color: '#FF3B30', fontSize: 16, fontWeight: '500' },
});