import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../lib/context';
import { useAuth } from '../lib/authContext';
import { postListesiAl, begeniToggle, kullaniciBegendimi, type SocialPost } from '../lib/socialService';
import { takipEt, Olaylar } from '../lib/analytics';

const { width } = Dimensions.get('window');
const KART_W = (width - 48) / 2;

export default function Discover() {
  const router = useRouter();
  const { renkler, dil } = useApp();
  const { user } = useAuth();

  const [postlar, setPostlar]       = useState<SocialPost[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [begenilenler, setBegenilenler] = useState<Set<string>>(new Set());
  const [hata, setHata]             = useState('');

  const yukle = useCallback(async () => {
    try {
      setHata('');
      const liste = await postListesiAl(40, 0);
      setPostlar(liste);
      if (user) {
        const begeniSorgu = await Promise.all(
          liste.map(p => kullaniciBegendimi(p.id, user.id).then(v => v ? p.id : null))
        );
        setBegenilenler(new Set(begeniSorgu.filter(Boolean) as string[]));
      }
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    }
  }, [user]);

  useEffect(() => {
    takipEt(Olaylar.KESFET_ACILDI);
    yukle().finally(() => setYukleniyor(false));
  }, [yukle]);

  const yenile = async () => {
    setYenileniyor(true);
    await yukle();
    setYenileniyor(false);
  };

  const begeni = async (postId: string) => {
    if (!user) {
      router.push('/login' as any);
      return;
    }
    const yeniDurum = await begeniToggle(postId, user.id);
    if (yeniDurum) takipEt(Olaylar.BEGENI_YAPILDI);
    setBegenilenler(prev => {
      const yeni = new Set(prev);
      if (yeniDurum) yeni.add(postId); else yeni.delete(postId);
      return yeni;
    });
    setPostlar(prev => prev.map(p =>
      p.id === postId
        ? { ...p, like_count: p.like_count + (yeniDurum ? 1 : -1) }
        : p
    ));
  };

  const renderPost = ({ item }: { item: SocialPost }) => {
    const begendi = begenilenler.has(item.id);
    const displayName = item.profiles?.display_name ?? '—';
    const tarih = new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

    return (
      <View style={[styles.kart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
        {item.gorsel_url ? (
          <Image source={{ uri: item.gorsel_url }} style={styles.kartGorsel} resizeMode="cover" />
        ) : (
          <View style={[styles.gorselYok, { backgroundColor: renkler.chip }]}>
            <Text style={{ fontSize: 32 }}>👗</Text>
            <Text style={[{ color: renkler.metin2, fontSize: 10, marginTop: 4 }]}>{item.tur ?? ''}</Text>
          </View>
        )}

        <View style={styles.kartIcerik}>
          <Text style={[styles.kartBaslik, { color: renkler.metin }]} numberOfLines={1}>{item.baslik}</Text>

          {item.tur && (
            <View style={[styles.turBadge, { backgroundColor: renkler.chip }]}>
              <Text style={[styles.turBadgeText, { color: renkler.metin2 }]}>{item.tur}</Text>
            </View>
          )}

          <Text style={[styles.parcalar, { color: renkler.metin2 }]} numberOfLines={2}>
            {Array.isArray(item.parcalar) ? item.parcalar.join(' · ') : ''}
          </Text>

          <View style={styles.altSatir}>
            <Text style={[styles.kullanici, { color: renkler.metin2 }]}>@{displayName} · {tarih}</Text>
            <TouchableOpacity style={styles.begeniBtn} onPress={() => begeni(item.id)}>
              <Text style={[styles.begeniIkon, begendi && { color: '#E74C3C' }]}>
                {begendi ? '♥' : '♡'}
              </Text>
              <Text style={[styles.begeniSayi, { color: renkler.metin2 }]}>{item.like_count}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: renkler.bg }]}>
      <StatusBar barStyle={renkler.statusBar} />

      <View style={[styles.header, { borderBottomColor: renkler.sinir }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.geri, { color: renkler.metin }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { color: renkler.metin }]}>
          {dil === 'en' ? '🌍 Discover' : '🌍 Keşfet'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {yukleniyor ? (
        <View style={styles.merkez}>
          <ActivityIndicator size="large" color="#00D4FF" />
        </View>
      ) : hata ? (
        <View style={styles.merkez}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
          <Text style={[{ color: renkler.metin2, textAlign: 'center', paddingHorizontal: 32 }]}>{hata}</Text>
          <TouchableOpacity onPress={yenile} style={styles.tekrarBtn}>
            <Text style={{ color: '#00D4FF', fontWeight: '600' }}>
              {dil === 'en' ? 'Retry' : 'Tekrar Dene'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : postlar.length === 0 ? (
        <View style={styles.merkez}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>👗</Text>
          <Text style={[styles.bosText, { color: renkler.metin2 }]}>
            {dil === 'en'
              ? 'No outfits shared yet.\nBe the first!'
              : 'Henüz paylaşılan kombin yok.\nİlk sen paylaş!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={postlar}
          keyExtractor={item => item.id}
          renderItem={renderPost}
          numColumns={2}
          contentContainerStyle={styles.liste}
          columnWrapperStyle={styles.satir}
          refreshControl={
            <RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor="#00D4FF" />
          }
          showsVerticalScrollIndicator={false}
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
  baslik:       { fontSize: 17, fontWeight: '700' },
  merkez:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  bosText:      { fontSize: 15, textAlign: 'center', lineHeight: 24 },
  tekrarBtn:    { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#00D4FF' },
  liste:        { padding: 16, gap: 12 },
  satir:        { gap: 12 },
  kart: {
    width: KART_W, borderRadius: 16, borderWidth: 0.5, overflow: 'hidden',
  },
  kartGorsel:   { width: KART_W, height: KART_W * 1.3 },
  gorselYok: {
    width: KART_W, height: KART_W * 1.3,
    alignItems: 'center', justifyContent: 'center',
  },
  kartIcerik:   { padding: 10, gap: 4 },
  kartBaslik:   { fontSize: 13, fontWeight: '700', letterSpacing: 0.1 },
  turBadge:     { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  turBadgeText: { fontSize: 10, fontWeight: '600' },
  parcalar:     { fontSize: 10, lineHeight: 15 },
  altSatir:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  kullanici:    { fontSize: 9, flex: 1 },
  begeniBtn:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  begeniIkon:   { fontSize: 16, color: '#aaa' },
  begeniSayi:   { fontSize: 11 },
});
