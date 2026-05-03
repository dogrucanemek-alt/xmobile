import { Text, View, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'xmobile_kiyafetler';

const BASLANGIC = [
  { id: 1, ad: 'Beyaz Gömlek', tur: 'Üst', renk: '⚪', sezon: 'Tüm Sezon', foto: null },
  { id: 2, ad: 'Lacivert Pantolon', tur: 'Alt', renk: '🔵', sezon: 'Tüm Sezon', foto: null },
  { id: 3, ad: 'Siyah Ceket', tur: 'Üst', renk: '⚫', sezon: 'Kış', foto: null },
  { id: 4, ad: 'Bej Trençkot', tur: 'Dış Giyim', renk: '🟤', sezon: 'İlkbahar', foto: null },
];

export default function Wardrobe() {
  const router = useRouter();
  const [kiyafetler, setKiyafetler] = useState([]);

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
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(yeniListe));
      setKiyafetler(yeniListe);
    } catch (e) {
      Alert.alert('Hata', 'Kaydetme başarısız.');
    }
  };

  const fotografCek = async () => {
    const izin = await ImagePicker.requestCameraPermissionsAsync();
    if (!izin.granted) {
      Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin vermen gerekiyor.');
      return;
    }
    const sonuc = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!sonuc.canceled) {
      const yeniListe = [...kiyafetler, {
        id: Date.now(),
        ad: 'Yeni Kıyafet',
        tur: 'Üst',
        renk: '👕',
        sezon: 'Tüm Sezon',
        foto: sonuc.assets[0].uri,
      }];
      kaydet(yeniListe);
      Alert.alert('Eklendi!', 'Kıyafet gardırobuna kaydedildi.');
    }
  };

  const galeridenSec = async () => {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) {
      Alert.alert('İzin Gerekli', 'Galeriye erişmek için izin vermen gerekiyor.');
      return;
    }
    const sonuc = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!sonuc.canceled) {
      const yeniListe = [...kiyafetler, {
        id: Date.now(),
        ad: 'Yeni Kıyafet',
        tur: 'Üst',
        renk: '👗',
        sezon: 'Tüm Sezon',
        foto: sonuc.assets[0].uri,
      }];
      kaydet(yeniListe);
      Alert.alert('Eklendi!', 'Kıyafet gardırobuna kaydedildi.');
    }
  };

  const ekleSecenekleri = () => {
    Alert.alert('Kıyafet Ekle', 'Nasıl eklemek istersin?', [
      { text: 'Fotoğraf Çek', onPress: fotografCek },
      { text: 'Galeriden Seç', onPress: galeridenSec },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const sil = (id) => {
    Alert.alert('Kıyafeti Sil', 'Bu kıyafeti silmek istiyor musun?', [
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          const yeniListe = kiyafetler.filter(k => k.id !== id);
          kaydet(yeniListe);
        },
      },
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

      <Text style={styles.sayi}>{kiyafetler.length} kıyafet</Text>

      <ScrollView style={styles.liste} showsVerticalScrollIndicator={false}>
        {kiyafetler.map((k) => (
          <TouchableOpacity
            key={k.id}
            style={styles.kiyafetKart}
            onLongPress={() => sil(k.id)}
          >
            {k.foto ? (
              <Image source={{ uri: k.foto }} style={styles.kiyafetFoto} />
            ) : (
              <View style={styles.renkCircle}>
                <Text style={styles.renk}>{k.renk}</Text>
              </View>
            )}
            <View style={styles.bilgi}>
              <Text style={styles.kiyafetAd}>{k.ad}</Text>
              <Text style={styles.kiyafetDetay}>{k.tur} · {k.sezon}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.silHint}>Silmek için kartı uzun bas</Text>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.kombinButon}
          onPress={() => router.push('/outfits')}
        >
          <Text style={styles.kombinButonText}>Kombin Önerileri Al</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  geri: { color: '#000000', fontSize: 20, fontWeight: '300' },
  baslik: { color: '#000000', fontSize: 17, fontWeight: '600' },
  ekle: { color: '#000000', fontSize: 16, fontWeight: '400' },
  sayi: {
    color: '#999999',
    fontSize: 13,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  liste: { flex: 1, paddingHorizontal: 16 },
  kiyafetKart: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#EEEEEE',
  },
  renkCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  kiyafetFoto: {
    width: 48,
    height: 58,
    borderRadius: 8,
    marginRight: 14,
  },
  renk: { fontSize: 24 },
  bilgi: { flex: 1 },
  kiyafetAd: { color: '#000000', fontSize: 15, fontWeight: '500', marginBottom: 3 },
  kiyafetDetay: { color: '#999999', fontSize: 13 },
  arrow: { color: '#CCCCCC', fontSize: 22, fontWeight: '300' },
  silHint: {
    textAlign: 'center',
    color: '#CCCCCC',
    fontSize: 12,
    paddingVertical: 16,
  },
  bottomBar: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#EEEEEE',
  },
  kombinButon: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  kombinButonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
