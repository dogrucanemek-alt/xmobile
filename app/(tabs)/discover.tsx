import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, Dimensions, ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../lib/context';
import { useAuth } from '../../lib/authContext';
import { postListesiAl, begeniToggle, kullaniciBegendimi, type SocialPost } from '../../lib/socialService';
import { Linking } from 'react-native';
import { takipEt, Olaylar } from '../../lib/analytics';

const { width } = Dimensions.get('window');
const KART_W = (width - 48) / 2;
const CYAN   = '#00D4FF';
const ITEM_HEIGHT = KART_W * 1.3 + 115; // gorsel (KART_W*1.3) + icerik (~115px)
const ROW_GAP = 12;

const KATEGORILER = ['Tümü', 'Casual', 'Formal', 'Spor', 'Gece', 'Yaz', 'Kış'];

export default function Discover() {
  const router = useRouter();
  const { renkler, dil } = useApp();
  const { user } = useAuth();

  const [postlar, setPostlar]           = useState<SocialPost[]>([]);
  const [yukleniyor, setYukleniyor]     = useState(true);
  const [yenileniyor, setYenileniyor]   = useState(false);
  const [begenilenler, setBegenilenler] = useState<Set<string>>(new Set());
  const [hata, setHata]                 = useState('');
  const [aktifFiltre, setAktifFiltre]   = useState('Tümü');

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
    if (!user) { router.push('/login' as any); return; }
    const yeniDurum = await begeniToggle(postId, user.id);
    if (yeniDurum) takipEt(Olaylar.BEGENI_YAPILDI);
    setBegenilenler(prev => {
      const yeni = new Set(prev);
      if (yeniDurum) yeni.add(postId); else yeni.delete(postId);
      return yeni;
    });
    setPostlar(prev => prev.map(p =>
      p.id === postId ? { ...p, like_count: p.like_count + (yeniDurum ? 1 : -1) } : p
    ));
  };

  const filtreli = aktifFiltre === 'Tümü'
    ? postlar
    : postlar.filter(p => p.tur?.toLowerCase().includes(aktifFiltre.toLowerCase()));

  const renderPost = useCallback(({ item }: { item: SocialPost }) => {
    const begendi     = begenilenler.has(item.id);
    const displayName = item.profiles?.display_name ?? '—';
    const tarih       = new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

    return (
      <View style={[styles.kart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
        {item.gorsel_url ? (
          <Image source={{ uri: item.gorsel_url }} style={styles.kartGorsel} contentFit="cover" transition={200} cachePolicy="memory-disk" />
        ) : (
          <View style={[styles.gorselYok, { backgroundColor: renkler.chip }]}>
            <Text style={{ fontSize: 32 }}>👗</Text>
            <Text style={[{ color: renkler.metin2, fontSize: 10, marginTop: 4, textAlign: 'center', paddingHorizontal: 6 }]} numberOfLines={2}>
              {item.parcalar?.slice(0, 2).join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.kartIcerik}>
          <Text style={[styles.kartBaslik, { color: renkler.metin }]} numberOfLines={1}>{item.baslik}</Text>

          {item.tur && (
            <View style={[styles.turBadge, { backgroundColor: 'rgba(0,212,255,0.1)', borderColor: 'rgba(0,212,255,0.3)', borderWidth: 0.5 }]}>
              <Text style={[styles.turBadgeText, { color: CYAN }]}>{item.tur}</Text>
            </View>
          )}

          <Text style={[styles.parcalar, { color: renkler.metin2 }]} numberOfLines={2}>
            {Array.isArray(item.parcalar) ? item.parcalar.join(' · ') : ''}
          </Text>

          {/* Ürün linkleri — eğer varsa */}
          {item.post_items && item.post_items.length > 0 && (
            <View style={{ marginTop: 6, gap: 3 }}>
              {item.post_items.slice(0, 3).map(pi => (
                <TouchableOpacity
                  key={pi.id ?? pi.parca_adi}
                  onPress={() => pi.urun_url && Linking.openURL(pi.urun_url).catch(() => {})}
                  disabled={!pi.urun_url}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: 'rgba(0,212,255,0.08)',
                    borderRadius: 8,
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                  }}
                >
                  <Text style={{ fontSize: 10 }}>🛒</Text>
                  <Text style={{ fontSize: 10, color: CYAN, flex: 1 }} numberOfLines={1}>
                    {pi.marka ?? pi.parca_adi}
                    {pi.fiyat ? ` · ${pi.fiyat}₺` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.altSatir}>
            <Text style={[styles.kullanici, { color: renkler.metin2 }]}>@{displayName}</Text>
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
  }, [begenilenler, renkler, begeni]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: renkler.bg }]}>
      <StatusBar barStyle={renkler.statusBar} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: renkler.sinir }]}>
        <Text style={[styles.baslik, { color: renkler.metin }]}>
          {dil === 'en' ? '🌍 Discover' : '🌍 Keşfet'}
        </Text>
        <Text style={[styles.altBaslik, { color: renkler.metin2 }]}>
          {dil === 'en' ? 'Community outfits' : 'Topluluk kombinleri'}
        </Text>
      </View>

      {/* Filtreler */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtreSatir}
        style={{ flexGrow: 0, maxHeight: 60 }}
      >
        {KATEGORILER.map(k => (
          <TouchableOpacity
            key={k}
            style={[
              styles.filtreChip,
              { backgroundColor: renkler.chip, borderColor: renkler.sinir },
              aktifFiltre === k && { backgroundColor: CYAN, borderColor: CYAN },
            ]}
            onPress={() => setAktifFiltre(k)}
          >
            <Text style={[
              styles.filtreText, { color: renkler.metin2 },
              aktifFiltre === k && { color: '#000', fontWeight: '700' },
            ]}>
              {k}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {yukleniyor ? (
        <View style={styles.merkez}>
          <ActivityIndicator size="large" color={CYAN} />
        </View>
      ) : hata ? (
        <View style={styles.merkez}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
          <Text style={[{ color: renkler.metin2, textAlign: 'center', paddingHorizontal: 32 }]}>{hata}</Text>
          <TouchableOpacity onPress={yenile} style={styles.tekrarBtn}>
            <Text style={{ color: CYAN, fontWeight: '600' }}>
              {dil === 'en' ? 'Retry' : 'Tekrar Dene'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : filtreli.length === 0 ? (
        <View style={styles.merkez}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>✨</Text>
          <Text style={[styles.bosBaslik, { color: renkler.metin }]}>
            {dil === 'en' ? 'Be the first!' : 'İlk sen paylaş!'}
          </Text>
          <Text style={[styles.bosAlt, { color: renkler.metin2 }]}>
            {dil === 'en'
              ? 'Share your outfit from the Outfits tab\nand inspire the community'
              : 'Kombinler sekmesinden kombinini paylaş\nve topluluğa ilham ver'}
          </Text>
          <TouchableOpacity
            style={styles.kesfetBtn}
            onPress={() => router.push('/(tabs)/outfits' as any)}
          >
            <Text style={styles.kesfetBtnText}>
              {dil === 'en' ? '👗 Go to Outfits' : '👗 Kombinlere Git'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtreli}
          keyExtractor={item => item.id}
          renderItem={renderPost}
          numColumns={2}
          contentContainerStyle={styles.liste}
          columnWrapperStyle={styles.satir}
          refreshControl={
            <RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={CYAN} />
          }
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => {
            const row = Math.floor(index / 2);
            return {
              length: ITEM_HEIGHT,
              offset: row * (ITEM_HEIGHT + ROW_GAP),
              index,
            };
          }}
          removeClippedSubviews={true}
          windowSize={5}
          maxToRenderPerBatch={6}
          initialNumToRender={6}
          ListHeaderComponent={
            filtreli.length > 0 ? (
              <Text style={[styles.sayac, { color: renkler.metin2 }]}>
                {filtreli.length} {dil === 'en' ? 'outfits' : 'kombin'}
              </Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
    borderBottomWidth: 0.5, gap: 2,
  },
  baslik:      { fontSize: 22, fontWeight: '800' },
  altBaslik:   { fontSize: 13 },
  filtreSatir: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  filtreChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 0.5,
    alignItems: 'center', justifyContent: 'center',
  },
  filtreText:  { fontSize: 13 },
  merkez:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  bosBaslik:   { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  bosAlt:      { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  tekrarBtn:   { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: CYAN },
  kesfetBtn: {
    marginTop: 8, backgroundColor: CYAN,
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50,
  },
  kesfetBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
  sayac:       { fontSize: 12, paddingBottom: 8, paddingLeft: 4 },
  liste:       { padding: 16, gap: 12, paddingBottom: 110 },
  satir:       { gap: 12 },
  kart: {
    width: KART_W, borderRadius: 16, borderWidth: 0.5, overflow: 'hidden',
  },
  kartGorsel:  { width: KART_W, height: KART_W * 1.3 },
  gorselYok: {
    width: KART_W, height: KART_W * 1.3,
    alignItems: 'center', justifyContent: 'center',
  },
  kartIcerik:  { padding: 10, gap: 4 },
  kartBaslik:  { fontSize: 13, fontWeight: '700' },
  turBadge:    { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  turBadgeText:{ fontSize: 10, fontWeight: '600' },
  parcalar:    { fontSize: 10, lineHeight: 15 },
  altSatir:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  kullanici:   { fontSize: 9, flex: 1 },
  begeniBtn:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  begeniIkon:  { fontSize: 16, color: '#aaa' },
  begeniSayi:  { fontSize: 11 },
});
