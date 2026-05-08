import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import ThreeDViewer from '../components/ThreeDViewer';
import { useApp } from '../lib/context';

export default function ImportModel() {
  const router = useRouter();
  const { renkler } = useApp();
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [dosyaAdi, setDosyaAdi] = useState('');
  const [viewer3D, setViewer3D] = useState(false);
  const [hata, setHata] = useState('');
  const [donusturuluyor, setDonusturuluyor] = useState(false);

  const dosyaSec = async () => {
    setHata('');
    try {
      const sonuc = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (sonuc.canceled) return;

      const dosya = sonuc.assets[0];
      if (!dosya.name.toLowerCase().endsWith('.glb')) {
        setHata('Sadece .glb dosyaları destekleniyor');
        return;
      }

      setDonusturuluyor(true);
      // Android content:// URI'yi Three.js okuyamaz — base64 data URI'ye çeviriyoruz
      const base64 = await FileSystem.readAsStringAsync(dosya.uri, {
        encoding: 'base64' as any,
      });
      const dataUri = `data:model/gltf-binary;base64,${base64}`;

      setDosyaAdi(dosya.name);
      setGlbUrl(dataUri);
    } catch {
      setHata('Dosya seçilemedi veya okunamadı');
    } finally {
      setDonusturuluyor(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: renkler.bg }]}>
      <StatusBar barStyle={renkler.statusBar} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.geri, { color: renkler.metin }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { color: renkler.metin }]}>3D Model İçe Aktar</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.icerik}>
        <Text style={styles.aciklamaIcon}>📦</Text>
        <Text style={[styles.aciklamaBaslik, { color: renkler.metin }]}>
          Web'den GLB Aktar
        </Text>
        <Text style={[styles.aciklamaAlt, { color: renkler.metin2 }]}>
          Meshy.ai'dan veya başka bir kaynaktan indirdiğin{'\n'}
          .glb dosyasını seçerek app'te görüntüle.
        </Text>

        <TouchableOpacity style={[styles.secBtn, donusturuluyor && { opacity: 0.6 }]} onPress={dosyaSec} disabled={donusturuluyor}>
          {donusturuluyor
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.secBtnText}>📁 Dosya Seç (.glb)</Text>
          }
        </TouchableOpacity>

        {donusturuluyor && (
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 10 }}>
            Dosya hazırlanıyor...
          </Text>
        )}

        {hata ? <Text style={styles.hataText}>{hata}</Text> : null}

        {glbUrl ? (
          <View style={styles.seciliDosya}>
            <Text style={[styles.dosyaAdi, { color: renkler.metin }]} numberOfLines={1}>
              ✓ {dosyaAdi}
            </Text>
            <TouchableOpacity style={styles.gosterBtn} onPress={() => setViewer3D(true)}>
              <Text style={styles.gosterBtnText}>3D Görüntüle →</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

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
  container:      { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  geri:           { fontSize: 22 },
  baslik:         { fontSize: 16, fontWeight: '600' },
  icerik:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  aciklamaIcon:   { fontSize: 52, marginBottom: 16 },
  aciklamaBaslik: { fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  aciklamaAlt: {
    fontSize: 14, lineHeight: 22, textAlign: 'center',
    marginBottom: 32,
  },
  secBtn: {
    backgroundColor: '#00D4FF', borderRadius: 50,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  secBtnText:    { color: '#000', fontSize: 15, fontWeight: '700' },
  hataText:      { color: '#E74C3C', fontSize: 13, marginTop: 16 },
  seciliDosya:   { marginTop: 24, alignItems: 'center', gap: 12 },
  dosyaAdi:      { fontSize: 13, maxWidth: 260, textAlign: 'center' },
  gosterBtn: {
    backgroundColor: 'rgba(0,212,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.4)',
    borderRadius: 50, paddingVertical: 12, paddingHorizontal: 28,
  },
  gosterBtnText: { color: '#00D4FF', fontSize: 14, fontWeight: '600' },
});
