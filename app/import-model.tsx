import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ActivityIndicator, Image, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { readAsStringAsync, copyAsync, cacheDirectory, EncodingType } from '../lib/fileSystem';
import { useRouter } from 'expo-router';
import ThreeDViewer from '../components/ThreeDViewer';
import { useApp } from '../lib/context';

const PROFIL_KEY = 'xmobile_profil';

export default function ImportModel() {
  const router = useRouter();
  const { renkler, dil } = useApp();

  const [profilFoto,      setProfilFoto]      = useState<string | null>(null);
  const [glbUrl,          setGlbUrl]          = useState<string | null>(null);
  const [dosyaAdi,        setDosyaAdi]        = useState('');
  const [viewer3D,        setViewer3D]        = useState(false);
  const [hata,            setHata]            = useState('');
  const [donusturuluyor,  setDonusturuluyor]  = useState(false);
  const [fotoYukleniyor,  setFotoYukleniyor]  = useState(false);
  const [kaydedildi,      setKaydedildi]      = useState(false);

  useEffect(() => { yukle(); }, []);

  const yukle = async () => {
    try {
      const raw = await AsyncStorage.getItem(PROFIL_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.profilFoto) setProfilFoto(p.profilFoto);
        if (p.avatarGlbPath) setDosyaAdi(p.avatarGlbPath.split('/').pop() ?? '');
      }
    } catch {}
  };

  const profilFotoSec = async () => {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) {
      Alert.alert(
        dil === 'en' ? 'Permission required' : 'İzin gerekli',
        dil === 'en' ? 'Allow photo access.' : 'Fotoğraf erişimine izin ver.',
      );
      return;
    }
    setFotoYukleniyor(true);
    try {
      const sonuc = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 0.9,
      });
      if (!sonuc.canceled) {
        setProfilFoto(sonuc.assets[0].uri);
        setKaydedildi(false);
      }
    } finally {
      setFotoYukleniyor(false);
    }
  };

  const kaydet = async () => {
    try {
      const raw = await AsyncStorage.getItem(PROFIL_KEY);
      const profil = raw ? JSON.parse(raw) : {};
      if (profilFoto) profil.profilFoto = profilFoto;
      await AsyncStorage.setItem(PROFIL_KEY, JSON.stringify(profil));
      setKaydedildi(true);
      Alert.alert(
        dil === 'en' ? 'Saved!' : 'Kaydedildi!',
        dil === 'en' ? 'Your photo has been updated.' : 'Fotoğrafın güncellendi.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e) {
      Alert.alert('Hata', String(e));
    }
  };

  const dosyaSec = async () => {
    setHata('');
    try {
      const sonuc = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });
      if (sonuc.canceled) return;

      const dosya = sonuc.assets[0];
      if (!dosya.name.toLowerCase().endsWith('.glb')) {
        setHata('Sadece .glb dosyaları destekleniyor');
        return;
      }

      setDonusturuluyor(true);

      const temizAd = dosya.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const hedef = (cacheDirectory ?? '') + temizAd;
      await copyAsync({ from: dosya.uri, to: hedef });

      const base64 = await readAsStringAsync(hedef, { encoding: EncodingType.Base64 });
      const dataUri = `data:model/gltf-binary;base64,${base64}`;

      setDosyaAdi(dosya.name);
      setGlbUrl(dataUri);

      const raw = await AsyncStorage.getItem(PROFIL_KEY);
      const profil = raw ? JSON.parse(raw) : {};
      profil.avatarGlbPath = hedef;
      await AsyncStorage.setItem(PROFIL_KEY, JSON.stringify(profil));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setHata(`Hata: ${msg.slice(0, 100)}`);
    } finally {
      setDonusturuluyor(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: renkler.bg }]}>
      <StatusBar barStyle={renkler.statusBar} />

      <View style={[styles.header, { borderBottomColor: renkler.sinir }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.geri, { color: renkler.metin }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { color: renkler.metin }]}>
          {dil === 'en' ? 'Photo & Avatar' : 'Fotoğraf & Avatar'}
        </Text>
        <TouchableOpacity onPress={kaydet} disabled={!profilFoto}>
          <Text style={[styles.kaydetBtn, { color: profilFoto ? '#00D4FF' : renkler.sinir }]}>
            {dil === 'en' ? 'Save' : 'Kaydet'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── FOTOĞRAF BÖLÜMÜ ── */}
        <View style={[styles.kart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.kartBaslik, { color: renkler.metin2 }]}>
            {dil === 'en' ? 'PROFILE PHOTO' : 'PROFİL FOTOĞRAFI'}
          </Text>
          <Text style={[styles.kartAciklama, { color: renkler.metin2 }]}>
            {dil === 'en'
              ? 'Add a full-body photo for virtual try-on. Head to toe, standing upright.'
              : 'Sanal deneme için tam boy fotoğraf ekle. Baştan ayağa, ayakta durur pozda.'}
          </Text>

          <View style={styles.fotoSatir}>
            <TouchableOpacity onPress={profilFotoSec} style={styles.fotoAlani}>
              {fotoYukleniyor ? (
                <ActivityIndicator color="#00D4FF" />
              ) : profilFoto ? (
                <Image source={{ uri: profilFoto }} style={styles.fotoOnizleme} resizeMode="cover" />
              ) : (
                <View style={[styles.fotoYok, { backgroundColor: renkler.chip }]}>
                  <Text style={{ fontSize: 36 }}>👤</Text>
                  <Text style={[{ color: renkler.metin2, fontSize: 11, marginTop: 6, textAlign: 'center' }]}>
                    {dil === 'en' ? 'Tap to add' : 'Eklemek için tıkla'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.fotoSag}>
              <TouchableOpacity
                style={[styles.fotoBtn, { borderColor: '#00D4FF' }]}
                onPress={profilFotoSec}
              >
                <Text style={[styles.fotoBtnText, { color: '#00D4FF' }]}>
                  {profilFoto
                    ? (dil === 'en' ? '📷 Change Photo' : '📷 Fotoğrafı Değiştir')
                    : (dil === 'en' ? '📷 Add Photo' : '📷 Fotoğraf Ekle')}
                </Text>
              </TouchableOpacity>

              <View style={[styles.ipucuKutu, { backgroundColor: renkler.chip }]}>
                <Text style={[styles.ipucu, { color: renkler.metin2 }]}>✅ {dil === 'en' ? 'Full body · standing' : 'Tam boy · ayakta'}</Text>
                <Text style={[styles.ipucu, { color: renkler.metin2 }]}>✅ {dil === 'en' ? 'Head to toe visible' : 'Baş + ayak görünsün'}</Text>
                <Text style={[styles.ipucu, { color: '#E74C3C' }]}>❌ {dil === 'en' ? 'No selfies / cropped' : 'Selfie/kare fotoğraf değil'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── 3D MODEL BÖLÜMÜ ── */}
        <View style={[styles.kart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.kartBaslik, { color: renkler.metin2 }]}>
            {dil === 'en' ? '3D AVATAR (GLB)' : '3D AVATAR (GLB)'}
          </Text>
          <Text style={[styles.kartAciklama, { color: renkler.metin2 }]}>
            {dil === 'en'
              ? 'Import a .glb file from Meshy.ai or another source.'
              : 'Meshy.ai veya başka bir kaynaktan .glb dosyası yükle.'}
          </Text>

          <TouchableOpacity
            style={[styles.glbBtn, donusturuluyor && { opacity: 0.6 }]}
            onPress={dosyaSec}
            disabled={donusturuluyor}
          >
            {donusturuluyor
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.glbBtnText}>📁 {dil === 'en' ? 'Select .glb File' : '.glb Dosyası Seç'}</Text>
            }
          </TouchableOpacity>

          {hata ? <Text style={styles.hataText}>{hata}</Text> : null}

          {dosyaAdi ? (
            <View style={styles.glbSecili}>
              <Text style={[styles.glbAd, { color: renkler.metin }]} numberOfLines={1}>
                ✓ {dosyaAdi}
              </Text>
              {glbUrl && (
                <TouchableOpacity
                  style={[styles.gosterBtn, { borderColor: 'rgba(0,212,255,0.4)' }]}
                  onPress={() => setViewer3D(true)}
                >
                  <Text style={styles.gosterBtnText}>{dil === 'en' ? '3D Preview →' : '3D Önizle →'}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {glbUrl && (
        <ThreeDViewer
          visible={viewer3D}
          glbUrl={glbUrl}
          baslik={dosyaAdi}
          onKapat={() => setViewer3D(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5,
  },
  geri:         { fontSize: 22 },
  baslik:       { fontSize: 16, fontWeight: '600' },
  kaydetBtn:    { fontSize: 15, fontWeight: '700' },
  scroll:       { padding: 16, gap: 16 },

  kart: {
    borderRadius: 18, padding: 20, borderWidth: 0.5,
  },
  kartBaslik:   { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  kartAciklama: { fontSize: 13, lineHeight: 19, marginBottom: 18 },

  fotoSatir:    { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  fotoAlani:    { width: 100, height: 140, borderRadius: 14, overflow: 'hidden' },
  fotoOnizleme: { width: 100, height: 140 },
  fotoYok: {
    width: 100, height: 140, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  fotoSag:      { flex: 1, gap: 12 },
  fotoBtn: {
    borderWidth: 1.5, borderRadius: 50,
    paddingVertical: 10, paddingHorizontal: 16,
    alignItems: 'center',
  },
  fotoBtnText:  { fontSize: 13, fontWeight: '600' },
  ipucuKutu:    { borderRadius: 10, padding: 10, gap: 4 },
  ipucu:        { fontSize: 11, lineHeight: 17 },

  glbBtn: {
    backgroundColor: '#00D4FF', borderRadius: 50,
    paddingVertical: 13, paddingHorizontal: 28,
    alignItems: 'center', alignSelf: 'flex-start',
  },
  glbBtnText:   { color: '#000', fontSize: 14, fontWeight: '700' },
  hataText:     { color: '#E74C3C', fontSize: 13, marginTop: 12 },
  glbSecili:    { marginTop: 16, gap: 10 },
  glbAd:        { fontSize: 13 },
  gosterBtn: {
    borderWidth: 1, borderRadius: 50,
    paddingVertical: 10, paddingHorizontal: 22,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,212,255,0.08)',
  },
  gosterBtnText: { color: '#00D4FF', fontSize: 13, fontWeight: '600' },
});
