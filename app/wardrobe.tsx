import { Text, View, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Image, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'xmobile_kiyafetler';

const BASLANGIC = [
  { id: 1, ad: 'Beyaz Gömlek', tur: 'Üst', sezon: 'Tüm Sezon', foto: null },
  { id: 2, ad: 'Lacivert Pantolon', tur: 'Alt', sezon: 'Tüm Sezon', foto: null },
  { id: 3, ad: 'Siyah Ceket', tur: 'Üst', sezon: 'Kış', foto: null },
  { id: 4, ad: 'Bej Trençkot', tur: 'Dış Giyim', sezon: 'İlkbahar', foto: null },
];

const TURLER = ['Üst', 'Alt', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'];
const SEZONLAR = ['Tüm Sezon', 'İlkbahar', 'Yaz', 'Sonbahar', 'Kış'];

export default function Wardrobe() {
  const router = useRouter();
  const [kiyafetler, setKiyafetler] = useState([]);
  const [modalAcik, setModalAcik] = useState(false);
  const [seciliKiyafet, setSeciliKiyafet] = useState(null);
  const [duzenAd, setDuzenAd] = useState('');
  const [duzenTur, setDuzenTur] = useState('');
  const [duzenSezon, setDuzenSezon] = useState('');

  useEffect(() => {
    yukle();
  }, []);

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

  const kaydet = async (yeniListe) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(yeniListe));
    setKiyafetler(yeniListe);
  };

  const fotografCek = async () => {
    const izin = await ImagePicker.requestCameraPermissionsAsync();
    if (!izin.granted) return;
    const sonuc = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.8 });
    if (!sonuc.canceled) {
      const yeni = { id: Date.now(), ad: 'Yeni Kıyafet', tur: 'Üst', sezon: 'Tüm Sezon', foto: sonuc.assets[0].uri };
      const yeniListe = [...kiyafetler, yeni];
      await kaydet(yeniListe);
      kiyafetDuzenle(yeni);
    }
  };

  const galeridenSec = async () => {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) return;
    const sonuc = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.8 });
    if (!sonuc.canceled) {
      const yeni = { id: Date.now(), ad: 'Yeni Kıyafet', tur: 'Üst', sezon: 'Tüm Sezon', foto: sonuc.assets[0].uri };
      const yeniListe = [...kiyafetler, yeni];
      await kaydet(yeniListe);
      kiyafetDuzenle(yeni);
    }
  };

  const ekleSecenekleri = () => {
    Alert.alert('Kıyafet Ekle', 'Nasıl eklemek istersin?', [
      { text: 'Fotoğraf Çek', onPress: fotografCek },
      { text: 'Galeriden Seç', onPress: galeridenSec },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const kiyafetDuzenle = (k) => {
    setSeciliKiyafet(k);
    setDuzenAd(k.ad);
    setDuzenTur(k.tur);
    setDuzenSezon(k.sezon);
    setModalAcik(true);
  };

  const duzenKaydet = async () => {
    const yeniListe = kiyafetler.map(k =>
      k.id === seciliKiyafet.id
        ? { ...k, ad: duzenAd, tur: duzenTur, sezon: duzenSezon }
        : k
    );
    await kaydet(yeniListe);
    setModalAcik(false);
  };

  const sil = (id) => {
    Alert.alert('Kıyafeti Sil', 'Silmek istiyor musun?', [
      { text: 'Sil', style: 'destructive', onPress: async () => {
        const yeniListe = kiyafetler.filter(k => k.id !== id);
        await kaydet(yeniListe);
        setModalAcik(false);
      }},
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9F9" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.geri}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.baslik}>Gardırobum</Text>
        <TouchableOpacity onPress={ekleSecenekleri}>
          <Text style={styles.ekle}>+ Ekle</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sayi}>{kiyafetler.length} kıyafet · düzenlemek için tıkla</Text>

      <ScrollView style={styles.liste} showsVerticalScrollIndicator={false}>
        {kiyafetler.map((k) => (
          <TouchableOpacity key={k.id} style={styles.kiyafetKart} onPress={() => kiyafetDuzenle(k)}>
            {k.foto ? (
              <Image source={{ uri: k.foto }} style={styles.kiyafetFoto} />
            ) : (
              <View style={styles.renkCircle}>
                <Text style={styles.renkHarf}>{k.ad.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.bilgi}>
              <Text style={styles.kiyafetAd}>{k.ad}</Text>
              <Text style={styles.kiyafetDetay}>{k.tur} · {k.sezon}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.kombinButon} onPress={() => router.push('/outfits')}>
          <Text style={styles.kombinButonText}>Kombin Önerileri Al</Text>
        </TouchableOpacity>
      </View>

      {/* Düzenleme Modalı */}
      <Modal visible={modalAcik} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalAcik(false)}>
              <Text style={styles.modalIptal}>İptal</Text>
            </TouchableOpacity>
            <Text style={styles.modalBaslik}>Kıyafeti Düzenle</Text>
            <TouchableOpacity onPress={duzenKaydet}>
              <Text style={styles.modalKaydet}>Kaydet</Text>
            </TouchableOpacity>
          </View>

          {seciliKiyafet?.foto && (
            <Image source={{ uri: seciliKiyafet.foto }} style={styles.modalFoto} />
          )}

          <View style={styles.inputGrup}>
            <Text style={styles.inputLabel}>Kıyafet Adı</Text>
            <TextInput
              style={styles.input}
              value={duzenAd}
              onChangeText={setDuzenAd}
              placeholder="örn. Beyaz Gömlek"
              placeholderTextColor="#CCCCCC"
            />
          </View>

          <View style={styles.inputGrup}>
            <Text style={styles.inputLabel}>Tür</Text>
            <View style={styles.chipGrup}>
              {TURLER.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, duzenTur === t && styles.chipSecili]}
                  onPress={() => setDuzenTur(t)}
                >
                  <Text style={[styles.chipText, duzenTur === t && styles.chipTextSecili]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGrup}>
            <Text style={styles.inputLabel}>Sezon</Text>
            <View style={styles.chipGrup}>
              {SEZONLAR.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, duzenSezon === s && styles.chipSecili]}
                  onPress={() => setDuzenSezon(s)}
                >
                  <Text style={[styles.chipText, duzenSezon === s && styles.chipTextSecili]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.silButon} onPress={() => sil(seciliKiyafet?.id)}>
            <Text style={styles.silButonText}>Bu Kıyafeti Sil</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5',
  },
  geri: { color: '#000000', fontSize: 20, fontWeight: '300' },
  baslik: { color: '#000000', fontSize: 17, fontWeight: '600' },
  ekle: { color: '#000000', fontSize: 16 },
  sayi: { color: '#999999', fontSize: 13, paddingHorizontal: 20, paddingVertical: 12 },
  liste: { flex: 1, paddingHorizontal: 16 },
  kiyafetKart: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', borderWidth: 0.5, borderColor: '#EEEEEE',
  },
  renkCircle: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  renkHarf: { fontSize: 20, fontWeight: '500', color: '#999999' },
  kiyafetFoto: { width: 48, height: 58, borderRadius: 8, marginRight: 14 },
  bilgi: { flex: 1 },
  kiyafetAd: { color: '#000000', fontSize: 15, fontWeight: '500', marginBottom: 3 },
  kiyafetDetay: { color: '#999999', fontSize: 13 },
  arrow: { color: '#CCCCCC', fontSize: 22 },
  bottomBar: {
    padding: 20, backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5, borderTopColor: '#EEEEEE',
  },
  kombinButon: { backgroundColor: '#000000', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  kombinButonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: '#F9F9F9' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 60, backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5',
  },
  modalIptal: { color: '#000000', fontSize: 16 },
  modalBaslik: { color: '#000000', fontSize: 17, fontWeight: '600' },
  modalKaydet: { color: '#000000', fontSize: 16, fontWeight: '600' },
  modalFoto: { width: '100%', height: 200, resizeMode: 'cover' },
  inputGrup: { padding: 20, backgroundColor: '#FFFFFF', marginTop: 12 },
  inputLabel: { color: '#999999', fontSize: 13, marginBottom: 8 },
  input: {
    fontSize: 16, color: '#000000', borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5', paddingVertical: 8,
  },
  chipGrup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F5F5F5', borderWidth: 0.5, borderColor: '#EEEEEE',
  },
  chipSecili: { backgroundColor: '#000000', borderColor: '#000000' },
  chipText: { fontSize: 13, color: '#666666' },
  chipTextSecili: { color: '#FFFFFF' },
  silButon: {
    margin: 20, padding: 16, borderRadius: 14, alignItems: 'center',
    borderWidth: 0.5, borderColor: '#FF3B30',
  },
  silButonText: { color: '#FF3B30', fontSize: 16, fontWeight: '500' },
});

