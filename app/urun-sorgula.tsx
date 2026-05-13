import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  StatusBar, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/context';
import * as FileSystem from '../lib/fileSystem';
import type { Kiyafet, Profil } from '../lib/types';

const CYAN        = '#00D4FF';
const API_URL     = process.env.EXPO_PUBLIC_API_URL || 'https://xmobile-proxy.vercel.app';
const KIYAFET_KEY = 'xmobile_kiyafetler';
const PROFIL_KEY  = 'xmobile_profil';
const TEN: Record<string, string> = { '#FDDBB4': 'Açık', '#E8B887': 'Buğday', '#C68642': 'Esmer', '#8D5524': 'Koyu' };

async function urunAnalizEt(
  imageUri: string,
  kiyafetler: Kiyafet[],
  profil: Profil | null,
  dil: 'tr' | 'en',
): Promise<string> {
  const kucuk = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 800 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  );
  const base64 = await FileSystem.readAsStringAsync(kucuk.uri, { encoding: 'base64' });

  const gardıropMetin = kiyafetler.length > 0
    ? kiyafetler.map(k => `- ${k.ad} (${k.tur})`).join('\n')
    : dil === 'en' ? 'Wardrobe is empty' : 'Gardırop boş';

  const profilMetin = profil
    ? `${profil.cinsiyet}, Ten: ${TEN[profil.tenRengi] ?? profil.tenRengi}`
    : '';

  const prompt = dil === 'en'
    ? `You are a personal fashion stylist. Analyze this clothing item and tell me:
1. What is this item? (name, color, type)
2. Does it work with the wardrobe below? (yes/partially/no)
3. Which specific items from the wardrobe pair well with it?
4. Color harmony with the user's skin tone: ${profilMetin || 'unknown'}

WARDROBE:
${gardıropMetin}

Be concise and practical. Max 150 words.`
    : `Sen kişisel bir moda stilistisin. Bu kıyafeti analiz et ve şunları söyle:
1. Bu ürün nedir? (ad, renk, tür)
2. Aşağıdaki gardıropla uyumlu mu? (uyar / kısmen uyar / uymaz)
3. Gardıropta hangi spesifik parçalarla kombinlenebilir?
4. Kullanıcının ten rengine renk uyumu: ${profilMetin || 'bilinmiyor'}

GARDIROB:
${gardıropMetin}

Kısa ve pratik ol. Maks 150 kelime.`;

  const res = await fetch(`${API_URL}/api/claude`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? (dil === 'en' ? 'Analysis failed.' : 'Analiz başarısız.');
}

export default function UrunSorgula() {
  const router = useRouter();
  const { renkler, dil } = useApp();

  const [gorsel,     setGorsel]     = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc,      setSonuc]      = useState('');
  const [uyum,       setUyum]       = useState<'uyar' | 'kismen' | 'uymaz' | null>(null);

  const sonuctenUyumCıkar = (metin: string) => {
    const lower = metin.toLowerCase();
    if (lower.includes('uymaz') || lower.includes("doesn't work") || lower.includes('no,')) return 'uymaz';
    if (lower.includes('kısmen') || lower.includes('partially') || lower.includes('some')) return 'kismen';
    return 'uyar';
  };

  const secVeAnalizEt = async (kaynak: 'camera' | 'gallery') => {
    const izin = kaynak === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (izin.status !== 'granted') {
      Alert.alert(dil === 'en' ? 'Permission required' : 'İzin gerekli');
      return;
    }

    const sonuc = kaynak === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [3, 4] })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [3, 4] });

    if (sonuc.canceled || !sonuc.assets[0]) return;

    const uri = sonuc.assets[0].uri;
    setGorsel(uri);
    setSonuc('');
    setUyum(null);
    setYukleniyor(true);

    try {
      const [kv, pv] = await AsyncStorage.multiGet([KIYAFET_KEY, PROFIL_KEY]);
      let kiyafetler: Kiyafet[] = [];
      let profil: Profil | null = null;
      if (kv[1]) { try { const p = JSON.parse(kv[1]); kiyafetler = Array.isArray(p) ? p : p.kiyafetler ?? []; } catch {} }
      if (pv[1]) { try { profil = JSON.parse(pv[1]); } catch {} }

      const analiz = await urunAnalizEt(uri, kiyafetler, profil, dil);
      setSonuc(analiz);
      setUyum(sonuctenUyumCıkar(analiz));
    } catch {
      setSonuc(dil === 'en' ? 'Analysis failed. Try again.' : 'Analiz başarısız. Tekrar dene.');
    } finally {
      setYukleniyor(false);
    }
  };

  const uyumRenk  = uyum === 'uyar' ? '#2ED573' : uyum === 'kismen' ? '#FFA502' : '#FF4757';
  const uyumMetin = uyum === 'uyar'
    ? (dil === 'en' ? '✓ Works with your wardrobe' : '✓ Gardırobunla uyuyor')
    : uyum === 'kismen'
    ? (dil === 'en' ? '~ Partially compatible' : '~ Kısmen uyumlu')
    : (dil === 'en' ? '✗ Doesn\'t match well' : '✗ Pek uymuyor');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: renkler.bg }]} edges={['top']}>
      <StatusBar barStyle={renkler.statusBar} />

      <View style={[styles.header, { borderBottomColor: renkler.sinir }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.geri, { color: renkler.metin }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { color: renkler.metin }]}>
          {dil === 'en' ? '📸 Try Before You Buy' : '📸 Almadan Önce Sor'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.icerik} showsVerticalScrollIndicator={false}>

        {!gorsel ? (
          <View style={styles.bos}>
            <View style={styles.orbDis}>
              <View style={styles.orbIc}>
                <Ionicons name="camera" size={32} color={CYAN} />
              </View>
            </View>
            <Text style={[styles.bosBaslik, { color: renkler.metin }]}>
              {dil === 'en' ? 'Scan a clothing item' : 'Bir kıyafeti fotoğrafla'}
            </Text>
            <Text style={[styles.bosAlt, { color: renkler.metin2 }]}>
              {dil === 'en'
                ? 'AI checks if it matches your existing wardrobe'
                : 'AI gardırobunla uyup uymadığını kontrol eder'}
            </Text>

            <View style={styles.butonlar}>
              <TouchableOpacity
                style={[styles.buyukBtn, { backgroundColor: CYAN }]}
                onPress={() => secVeAnalizEt('camera')}
              >
                <Ionicons name="camera" size={22} color="#000" />
                <Text style={styles.buyukBtnMetin}>
                  {dil === 'en' ? 'Take Photo' : 'Fotoğraf Çek'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buyukBtn, { backgroundColor: renkler.kart, borderColor: renkler.sinir, borderWidth: 1 }]}
                onPress={() => secVeAnalizEt('gallery')}
              >
                <Ionicons name="images" size={22} color={renkler.metin} />
                <Text style={[styles.buyukBtnMetin, { color: renkler.metin }]}>
                  {dil === 'en' ? 'From Gallery' : 'Galeriden Seç'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <View style={styles.gorselContainer}>
              <Image source={{ uri: gorsel }} style={styles.gorsel} resizeMode="cover" />
              <TouchableOpacity
                style={[styles.tekrarBtn, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}
                onPress={() => { setGorsel(null); setSonuc(''); setUyum(null); }}
              >
                <Ionicons name="refresh" size={16} color={renkler.metin} />
                <Text style={[{ fontSize: 13, color: renkler.metin }]}>
                  {dil === 'en' ? 'New Photo' : 'Yeni Fotoğraf'}
                </Text>
              </TouchableOpacity>
            </View>

            {yukleniyor ? (
              <View style={[styles.sonucKart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
                <ActivityIndicator color={CYAN} />
                <Text style={[{ color: renkler.metin2, fontSize: 14, marginTop: 8 }]}>
                  {dil === 'en' ? 'Analyzing with AI...' : 'AI analiz ediyor...'}
                </Text>
              </View>
            ) : sonuc ? (
              <View style={{ gap: 10 }}>
                {uyum && (
                  <View style={[styles.uyumBadge, { backgroundColor: uyumRenk + '18', borderColor: uyumRenk }]}>
                    <Text style={[styles.uyumMetin, { color: uyumRenk }]}>{uyumMetin}</Text>
                  </View>
                )}
                <View style={[styles.sonucKart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
                  <Text style={[styles.sonucMetin, { color: renkler.metin }]}>{sonuc}</Text>
                </View>
                <View style={styles.butonlar}>
                  <TouchableOpacity
                    style={[styles.buyukBtn, { backgroundColor: CYAN }]}
                    onPress={() => secVeAnalizEt('camera')}
                  >
                    <Ionicons name="camera" size={20} color="#000" />
                    <Text style={styles.buyukBtnMetin}>
                      {dil === 'en' ? 'New Photo' : 'Yeni Fotoğraf'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.buyukBtn, { backgroundColor: renkler.kart, borderColor: renkler.sinir, borderWidth: 1 }]}
                    onPress={() => secVeAnalizEt('gallery')}
                  >
                    <Ionicons name="images" size={20} color={renkler.metin} />
                    <Text style={[styles.buyukBtnMetin, { color: renkler.metin }]}>
                      {dil === 'en' ? 'Gallery' : 'Galeri'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5,
  },
  geri:   { fontSize: 22 },
  baslik: { fontSize: 17, fontWeight: '700' },
  icerik: { padding: 20, paddingBottom: 120 },

  bos: { alignItems: 'center', gap: 16, paddingTop: 40 },
  orbDis: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(0,212,255,0.06)', borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  orbIc: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(0,212,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  bosBaslik: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  bosAlt:    { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  butonlar:  { flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' },
  buyukBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 16,
  },
  buyukBtnMetin: { fontSize: 15, fontWeight: '700', color: '#000' },

  gorselContainer: { position: 'relative' },
  gorsel: { width: '100%', height: 360, borderRadius: 20 },
  tekrarBtn: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 0.5,
  },
  uyumBadge: {
    borderRadius: 12, borderWidth: 1, padding: 14, alignItems: 'center',
  },
  uyumMetin: { fontSize: 15, fontWeight: '700' },
  sonucKart: {
    borderRadius: 16, borderWidth: 0.5, padding: 16,
  },
  sonucMetin: { fontSize: 14, lineHeight: 22 },
});
