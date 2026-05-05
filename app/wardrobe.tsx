import { Text, View, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Image, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../lib/context';
import type { Kiyafet } from '../lib/types';
import { kiyafetTani } from '../lib/vision';

const STORAGE_KEY  = 'xmobile_kiyafetler';
const VISION_KEY   = process.env.EXPO_PUBLIC_VISION_KEY ?? '';

const BASLANGIC = [
  { id: 1, ad: 'Beyaz Gömlek',    tur: 'Üst',       sezon: 'Tüm Sezon', foto: null },
  { id: 2, ad: 'Lacivert Pantolon', tur: 'Alt',      sezon: 'Tüm Sezon', foto: null },
  { id: 3, ad: 'Siyah Ceket',     tur: 'Üst',       sezon: 'Kış',       foto: null },
  { id: 4, ad: 'Bej Trençkot',    tur: 'Dış Giyim', sezon: 'İlkbahar',  foto: null },
];

const TURLER   = ['Üst', 'Alt', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'];
const SEZONLAR = ['Tüm Sezon', 'İlkbahar', 'Yaz', 'Sonbahar', 'Kış'];

export default function Wardrobe() {
  const router = useRouter();
  const { t, renkler } = useApp();

  const [kiyafetler, setKiyafetler]       = useState<Kiyafet[]>([]);
  const [modalAcik, setModalAcik]         = useState(false);
  const [seciliKiyafet, setSeciliKiyafet] = useState<Kiyafet | null>(null);
  const [duzenAd, setDuzenAd]             = useState('');
  const [duzenTur, setDuzenTur]           = useState('');
  const [duzenSezon, setDuzenSezon]       = useState('');

  useEffect(() => { yukle(); }, []);

  const yukle = async () => {
    try {
      const kayitli = await AsyncStorage.getItem(STORAGE_KEY);
      if (kayitli) {
        setKiyafetler(JSON.parse(kayitli));
      } else {
        setKiyafetler(BASLANGIC);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(BASLANGIC));
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
    let ad = 'Yeni Kıyafet';
    let tur = 'Üst';
    if (VISION_KEY) {
      try { ({ ad, tur } = await kiyafetTani(uri, VISION_KEY)); } catch {}
    }
    const yeni = { id: Date.now(), ad, tur, sezon: 'Tüm Sezon', foto: uri };
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

  const ekleSecenekleri = () => {
    Alert.alert(t.kiyafetEkle, t.nasılEklemek, [
      { text: t.fotografCek,   onPress: fotografCek },
      { text: t.galeridenSec,  onPress: galeridenSec },
      { text: t.iptal,         style: 'cancel' },
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

      <View style={[styles.header, { backgroundColor: renkler.bg, borderBottomColor: renkler.sinir }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.geri, { color: renkler.metin }]}>{t.geri}</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { color: renkler.metin }]}>{t.gardırobum}</Text>
        <TouchableOpacity onPress={ekleSecenekleri}>
          <Text style={[styles.ekle, { color: renkler.metin }]}>{t.ekle}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sayi, { color: renkler.metin2 }]}>
        {kiyafetler.length} {t.kiyafet} · {t.duzenlemekIcin}
      </Text>

      <ScrollView style={styles.liste} showsVerticalScrollIndicator={false}>
        {kiyafetler.map((k) => (
          <View
            key={k.id}
            style={[styles.kiyafetKart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}
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

      <View style={[styles.bottomBar, { backgroundColor: renkler.bg, borderTopColor: renkler.sinir }]}>
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
          <View style={[styles.modalHeader, { backgroundColor: renkler.bg, borderBottomColor: renkler.sinir }]}>
            <TouchableOpacity onPress={() => setModalAcik(false)}>
              <Text style={[styles.modalIptal, { color: renkler.metin }]}>{t.iptal}</Text>
            </TouchableOpacity>
            <Text style={[styles.modalBaslik, { color: renkler.metin }]}>{t.kiyafetDuzenle}</Text>
            <TouchableOpacity onPress={duzenKaydet}>
              <Text style={[styles.modalKaydet, { color: renkler.metin }]}>{t.kaydet}</Text>
            </TouchableOpacity>
          </View>

          {seciliKiyafet?.foto && (
            <Image source={{ uri: seciliKiyafet.foto }} style={styles.modalFoto} />
          )}

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
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  geri:         { fontSize: 20, fontWeight: '300' },
  baslik:       { fontSize: 17, fontWeight: '600' },
  ekle:         { fontSize: 16 },
  sayi:         { fontSize: 13, paddingHorizontal: 20, paddingVertical: 12 },
  liste:        { flex: 1, paddingHorizontal: 16 },
  kiyafetKart: {
    borderRadius: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', borderWidth: 0.5,
    overflow: 'hidden',
  },
  kartIcerik: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14 },
  silBtn:     { paddingHorizontal: 16, paddingVertical: 14, justifyContent: 'center' },
  silBtnText: { fontSize: 18 },
  renkCircle:  { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  renkHarf:    { fontSize: 20, fontWeight: '500' },
  kiyafetFoto: { width: 48, height: 58, borderRadius: 8, marginRight: 14 },
  bilgi:       { flex: 1 },
  kiyafetAd:   { fontSize: 15, fontWeight: '500', marginBottom: 3 },
  kiyafetDetay:{ fontSize: 13 },
  arrow:       { fontSize: 22 },
  bottomBar:      { padding: 20, borderTopWidth: 0.5, flexDirection: 'row', gap: 10 },
  gecmisButon:    { width: 52, height: 52, borderRadius: 14, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center' },
  gecmisButonText:{ fontSize: 22 },
  kombinButon:    { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  kombinButonText:{ fontSize: 16, fontWeight: '600' },
  modal:       { flex: 1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 60, borderBottomWidth: 0.5,
  },
  modalIptal:  { fontSize: 16 },
  modalBaslik: { fontSize: 17, fontWeight: '600' },
  modalKaydet: { fontSize: 16, fontWeight: '600' },
  modalFoto:   { width: '100%', height: 200, resizeMode: 'cover' },
  inputGrup:   { padding: 20, marginTop: 12 },
  inputLabel:  { fontSize: 13, marginBottom: 8 },
  input:       { fontSize: 16, borderBottomWidth: 0.5, paddingVertical: 8 },
  chipGrup:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 0.5 },
  chipText:    { fontSize: 13 },
  silButon:    { margin: 20, padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#FF3B30' },
  silButonText:{ color: '#FF3B30', fontSize: 16, fontWeight: '500' },
});