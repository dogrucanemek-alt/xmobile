import { Text, View, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Image, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../lib/context';
import type { Kiyafet } from '../lib/types';
import { kiyafetTani } from '../lib/vision';

const STORAGE_KEY  = 'xmobile_kiyafetler';
const CLAUDE_KEY   = process.env.EXPO_PUBLIC_CLAUDE_KEY ?? '';
const VERI_VERSIYON = 2;
const FOTO_DIR = `${FileSystem.documentDirectory}kiyafet_fotolari/`;

const fotografKaydet = async (uri: string): Promise<string> => {
  await FileSystem.makeDirectoryAsync(FOTO_DIR, { intermediates: true });
  const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const hedef = `${FOTO_DIR}${Date.now()}_${Math.round(Math.random() * 1e6)}.${ext}`;
  await FileSystem.copyAsync({ from: uri, to: hedef });
  return hedef;
};

const BASLANGIC = [
  { id: 1,  ad: 'Gri Jean Pantolon',              tur: 'Alt',       sezon: 'Tüm Sezon',         foto: null },
  { id: 2,  ad: 'Bej Chino Pantolon (GANT)',      tur: 'Alt',       sezon: 'Tüm Sezon',         foto: null },
  { id: 3,  ad: 'Yeşil Chino Pantolon (GANT)',    tur: 'Alt',       sezon: 'Tüm Sezon',         foto: null },
  { id: 4,  ad: 'Beyaz Kumaş Pantolon',           tur: 'Alt',       sezon: 'Tüm Sezon',         foto: null },
  { id: 5,  ad: 'Lacivert Kumaş Pantolon',        tur: 'Alt',       sezon: 'Tüm Sezon',         foto: null },
  { id: 6,  ad: 'Saks Mavisi Kumaş Pantolon',     tur: 'Alt',       sezon: 'Tüm Sezon',         foto: null },
  { id: 7,  ad: 'Kırmızı Oversize Tişört',        tur: 'Üst',       sezon: 'Tüm Sezon',         foto: null },
  { id: 8,  ad: 'Siyah Gömlek (C&A)',             tur: 'Üst',       sezon: 'Tüm Sezon',         foto: null },
  { id: 9,  ad: 'Açık Mavi Gömlek',               tur: 'Üst',       sezon: 'Tüm Sezon',         foto: null },
  { id: 10, ad: 'Beyaz Gömlek (Ismont)',           tur: 'Üst',       sezon: 'Tüm Sezon',         foto: null },
  { id: 11, ad: 'Siyah Trençkot',                 tur: 'Dış Giyim', sezon: 'İlkbahar/Sonbahar', foto: null },
  { id: 12, ad: 'Bej Trençkot',                   tur: 'Dış Giyim', sezon: 'İlkbahar/Sonbahar', foto: null },
  { id: 13, ad: 'Siyah Bomber Ceket',             tur: 'Dış Giyim', sezon: 'Tüm Sezon',         foto: null },
];

const TURLER   = ['Üst', 'Alt', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'];
const SEZONLAR = ['Tüm Sezon', 'İlkbahar', 'Yaz', 'Sonbahar', 'Kış'];

export default function Wardrobe() {
  const router = useRouter();
  const { t, renkler, aksanRenk } = useApp();

  const [kiyafetler, setKiyafetler]       = useState<Kiyafet[]>([]);
  const [modalAcik, setModalAcik]         = useState(false);
  const [seciliKiyafet, setSeciliKiyafet] = useState<Kiyafet | null>(null);
  const [duzenAd, setDuzenAd]             = useState('');
  const [duzenTur, setDuzenTur]           = useState('');
  const [duzenSezon, setDuzenSezon]       = useState('');
  const [cokluProgress, setCokluProgress] = useState<{simdiki: number; toplam: number} | null>(null);

  useEffect(() => { yukle(); }, []);

  const yukle = async () => {
    try {
      const versiyon = await AsyncStorage.getItem('xmobile_veri_v');
      const kayitli  = await AsyncStorage.getItem(STORAGE_KEY);
      if (kayitli && Number(versiyon) >= VERI_VERSIYON) {
        setKiyafetler(JSON.parse(kayitli));
      } else {
        setKiyafetler(BASLANGIC);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(BASLANGIC));
        await AsyncStorage.setItem('xmobile_veri_v', String(VERI_VERSIYON));
      }
    } catch (e) {
      setKiyafetler(BASLANGIC);
    }
  };

  const kaydet = async (yeniListe: Kiyafet[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(yeniListe));
    setKiyafetler(yeniListe);
  };

  const fotodanEkle = async (uri: string) => {
    const kaliciUri = await fotografKaydet(uri);
    let ad = 'Yeni Kıyafet';
    let tur = 'Üst';
    if (CLAUDE_KEY) {
      try { ({ ad, tur } = await kiyafetTani(kaliciUri, CLAUDE_KEY)); } catch (e) { console.warn('Kıyafet tanıma hatası:', e); }
    }
    const yeni = { id: Date.now(), ad, tur, sezon: 'Tüm Sezon', foto: kaliciUri };
    await kaydet([...kiyafetler, yeni]);
    kiyafetDuzenle(yeni);
  };

  const fotografCek = async () => {
    const izin = await ImagePicker.requestCameraPermissionsAsync();
    if (!izin.granted) return;
    const sonuc = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.8 });
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
      let kaliciUri: string;
      try { kaliciUri = await fotografKaydet(asset.uri); } catch { kaliciUri = asset.uri; }
      let ad = 'Yeni Kıyafet';
      let tur = 'Üst';
      if (CLAUDE_KEY) {
        try { ({ ad, tur } = await kiyafetTani(kaliciUri, CLAUDE_KEY)); } catch (e) { console.warn('Tanıma hatası:', e); }
      }
      yeniListe.push({ id: Date.now() + Math.random(), ad, tur, sezon: 'Tüm Sezon', foto: kaliciUri });
    }
    await kaydet(yeniListe);
    setCokluProgress(null);
    Alert.alert('✓', `${toplam} kıyafet eklendi`);
  };

  const ekleSecenekleri = () => {
    Alert.alert(t.kiyafetEkle, t.nasılEklemek, [
      { text: t.fotografCek,              onPress: fotografCek },
      { text: t.galeridenSec,             onPress: galeridenSec },
      { text: '📚 Çoklu Seç (Galeri)',    onPress: cokluSec },
      { text: t.iptal,                    style: 'cancel' },
    ]);
  };

  const kiyafetDuzenle = (k: Kiyafet) => {
    setSeciliKiyafet(k);
    setDuzenAd(k.ad);
    setDuzenTur(k.tur);
    setDuzenSezon(k.sezon);
    setModalAcik(true);
  };

  const duzenKaydet = async () => {
    const yeniListe = kiyafetler.map(k =>
      k.id === seciliKiyafet!.id
        ? { ...k, ad: duzenAd, tur: duzenTur, sezon: duzenSezon }
        : k
    );
    await kaydet(yeniListe);
    setModalAcik(false);
  };

  const modalFotoGuncelle = async () => {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) return;
    const sonuc = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.8 });
    if (sonuc.canceled) return;
    let kaliciUri: string;
    try { kaliciUri = await fotografKaydet(sonuc.assets[0].uri); } catch { kaliciUri = sonuc.assets[0].uri; }
    const guncellenmis = { ...seciliKiyafet!, foto: kaliciUri };
    setSeciliKiyafet(guncellenmis);
    const yeniListe = kiyafetler.map(k => k.id === guncellenmis.id ? guncellenmis : k);
    await kaydet(yeniListe);
  };

  const sil = (id: number) => {
    Alert.alert(t.buKiyafetiSil, t.silOnay, [
      { text: t.sil, style: 'destructive', onPress: async () => {
        const yeniListe = kiyafetler.filter(k => k.id !== id);
        await kaydet(yeniListe);
        setModalAcik(false);
      }},
      { text: t.iptal, style: 'cancel' },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: renkler.bg2 }]}>
      <StatusBar barStyle={renkler.statusBar} backgroundColor={renkler.bg} />

      <View style={[styles.header, { backgroundColor: renkler.bg }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.geri, { color: renkler.metin }]}>{t.geri}</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { color: renkler.metin }]}>{t.gardırobum}</Text>
        <TouchableOpacity onPress={ekleSecenekleri}>
          <Text style={[styles.ekle, { color: aksanRenk }]}>{t.ekle}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sayi, { color: renkler.metin2 }]}>
        {kiyafetler.length} {t.kiyafet} · {t.duzenlemekIcin}
      </Text>

      <ScrollView style={styles.liste} showsVerticalScrollIndicator={false}>
        {kiyafetler.map((k) => (
          <View
            key={k.id}
            style={[styles.kiyafetKart, { backgroundColor: renkler.kart }]}
          >
            <TouchableOpacity style={styles.kartIcerik} onPress={() => kiyafetDuzenle(k)}>
              {k.foto ? (
                <Image source={{ uri: k.foto }} style={styles.kiyafetFoto} />
              ) : (
                <View style={[styles.renkCircle, { backgroundColor: renkler.chip }]}>
                  <Text style={[styles.renkHarf, { color: renkler.metin2 }]}>{k.ad.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.bilgi}>
                <Text style={[styles.kiyafetAd, { color: renkler.metin }]}>{k.ad}</Text>
                <Text style={[styles.kiyafetDetay, { color: renkler.metin2 }]}>{k.tur} · {k.sezon}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => sil(k.id)} style={styles.silBtn}>
              <Text style={styles.silBtnText}>🗑</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {cokluProgress && (
        <View style={[styles.progressBar, { backgroundColor: renkler.kart }]}>
          <Text style={[styles.progressText, { color: renkler.metin2 }]}>
            Yükleniyor {cokluProgress.simdiki}/{cokluProgress.toplam}
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: renkler.sinir }]}>
            <View style={[styles.progressFill, { backgroundColor: renkler.btnPrimary, width: `${(cokluProgress.simdiki / cokluProgress.toplam) * 100}%` as any }]} />
          </View>
        </View>
      )}

      <View style={[styles.bottomBar, { backgroundColor: renkler.bg }]}>
        <TouchableOpacity
          style={[styles.gecmisButon, { borderColor: renkler.sinir2 }]}
          onPress={() => router.push('/history')}
        >
          <Text style={[styles.gecmisButonText, { color: renkler.metin }]}>📋</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.kombinButon, { backgroundColor: renkler.btnPrimary, flex: 1 }]}
          onPress={() => router.push('/outfits')}
        >
          <Text style={[styles.kombinButonText, { color: renkler.btnPrimaryMetin }]}>
            {t.kombinOnerisiAl}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Düzenleme Modalı */}
      <Modal visible={modalAcik} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: renkler.bg2 }]}>
          <View style={[styles.modalHeader, { backgroundColor: renkler.bg }]}>
            <TouchableOpacity onPress={() => setModalAcik(false)}>
              <Text style={[styles.modalIptal, { color: renkler.metin }]}>{t.iptal}</Text>
            </TouchableOpacity>
            <Text style={[styles.modalBaslik, { color: renkler.metin }]}>{t.kiyafetDuzenle}</Text>
            <TouchableOpacity onPress={duzenKaydet}>
              <Text style={styles.modalKaydet}>{t.kaydet}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={modalFotoGuncelle} activeOpacity={0.8}>
            {seciliKiyafet?.foto ? (
              <Image source={{ uri: seciliKiyafet.foto }} style={styles.modalFoto} />
            ) : (
              <View style={[styles.modalFotoEkle, { backgroundColor: renkler.chip }]}>
                <Text style={[styles.modalFotoEkleText, { color: renkler.metin2 }]}>📷 Fotoğraf Ekle</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={[styles.inputGrup, { backgroundColor: renkler.kart }]}>
            <Text style={[styles.inputLabel, { color: renkler.metin2 }]}>{t.kiyafetAdi}</Text>
            <TextInput
              style={[styles.input, { color: renkler.metin, borderBottomColor: renkler.sinir }]}
              value={duzenAd}
              onChangeText={setDuzenAd}
              placeholder="örn. Beyaz Gömlek"
              placeholderTextColor={renkler.metin2}
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
                  onPress={() => setDuzenTur(tur)}
                >
                  <Text style={[styles.chipText, { color: renkler.metin2 },
                    duzenTur === tur && { color: renkler.btnPrimaryMetin }
                  ]}>{tur}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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

          <TouchableOpacity style={styles.silButon} onPress={() => sil(seciliKiyafet!.id)}>
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
  kiyafetDetay:{ fontSize: 13 },
  arrow:       { fontSize: 22 },
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
  inputLabel:  { fontSize: 12, marginBottom: 10, letterSpacing: 0.5 } as any,
  input:       { fontSize: 17, paddingVertical: 8 },
  chipGrup:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:        { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 50, borderWidth: 1 },
  chipText:    { fontSize: 13 },
  silButon:    { margin: 20, padding: 17, borderRadius: 50, alignItems: 'center', borderWidth: 1, borderColor: '#FF3B30' },
  silButonText:{ color: '#FF3B30', fontSize: 16, fontWeight: '500' },
});