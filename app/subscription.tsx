import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../lib/context';
import { tekliflerAl, satin, geriYukle } from '../lib/revenueCat';
import { useSubscription } from '../lib/subscriptionContext';

const CYAN = '#00D4FF';

const OZELLIKLER = {
  tr: [
    { icon: '✦', metin: 'Sınırsız AI kombin önerisi' },
    { icon: '🌤', metin: 'Hava durumuna göre öneri' },
    { icon: '🧍', metin: '3D avatar & kıyafet overlay' },
    { icon: '📅', metin: 'Sınırsız kombin geçmişi' },
    { icon: '📤', metin: 'Instagram Story export' },
    { icon: '💬', metin: 'Stil danışmanı önerileri' },
  ],
  en: [
    { icon: '✦', metin: 'Unlimited AI outfit suggestions' },
    { icon: '🌤', metin: 'Weather-based recommendations' },
    { icon: '🧍', metin: '3D avatar & clothing overlay' },
    { icon: '📅', metin: 'Unlimited outfit history' },
    { icon: '📤', metin: 'Instagram Story export' },
    { icon: '💬', metin: 'Personal style advisor tips' },
  ],
};

export default function Subscription() {
  const router = useRouter();
  const { renkler, dil } = useApp();
  const { tierDegistir } = useSubscription();
  const tr = dil === 'tr';
  const ozellikler = OZELLIKLER[dil];

  const [teklifler, setTeklifler]     = useState<any[]>([]);
  const [secili, setSecili]           = useState(0);
  const [yukleniyor, setYukleniyor]   = useState(true);
  const [satinAliyor, setSatinAliyor] = useState(false);

  useEffect(() => {
    tekliflerAl().then(offering => {
      if (offering?.availablePackages?.length) {
        setTeklifler(offering.availablePackages);
        // Yıllık paketi varsayılan seç
        const yillikIdx = offering.availablePackages.findIndex(
          (p: any) => p.packageType === 'ANNUAL' || p.identifier?.includes('annual')
        );
        if (yillikIdx >= 0) setSecili(yillikIdx);
      }
      setYukleniyor(false);
    });
  }, []);

  const satinAl = async () => {
    if (!teklifler[secili]) return;
    setSatinAliyor(true);
    try {
      const basarili = await satin(teklifler[secili]);
      if (basarili) {
        await tierDegistir('pro');
        Alert.alert(
          tr ? 'Pro\'ya Hoş Geldin! 🎉' : 'Welcome to Pro! 🎉',
          tr ? 'Tüm özellikler aktif.' : 'All features are now active.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (e: any) {
      Alert.alert(tr ? 'Hata' : 'Error', e.message);
    }
    setSatinAliyor(false);
  };

  const geriYukleBasin = async () => {
    setSatinAliyor(true);
    try {
      const basarili = await geriYukle();
      if (basarili) await tierDegistir('pro');
      Alert.alert(
        basarili ? (tr ? 'Geri Yüklendi ✓' : 'Restored ✓') : (tr ? 'Abonelik Bulunamadı' : 'No Subscription Found'),
        basarili
          ? (tr ? 'Pro aboneliğin aktif edildi.' : 'Your Pro subscription is active.')
          : (tr ? 'Aktif bir abonelik bulunamadı.' : 'No active subscription found.'),
        [{ text: 'OK', onPress: () => { if (basarili) router.back(); } }]
      );
    } catch (e: any) {
      Alert.alert(tr ? 'Hata' : 'Error', e.message);
    }
    setSatinAliyor(false);
  };

  const fiyatMetni = (pkg: any) => {
    return pkg?.product?.priceString ?? '—';
  };

  const paketAdi = (pkg: any) => {
    const tip = pkg?.packageType ?? '';
    if (tip === 'MONTHLY' || pkg?.identifier?.includes('monthly')) return tr ? 'Aylık' : 'Monthly';
    if (tip === 'ANNUAL'  || pkg?.identifier?.includes('annual'))  return tr ? 'Yıllık' : 'Annual';
    if (tip === 'LIFETIME'|| pkg?.identifier?.includes('lifetime')) return tr ? 'Ömür Boyu' : 'Lifetime';
    return pkg?.identifier ?? tip;
  };

  const indirimBadge = (pkg: any, idx: number, list: any[]) => {
    const tip = pkg?.packageType ?? '';
    if (tip === 'ANNUAL' || pkg?.identifier?.includes('annual')) {
      const aylik = list.find((p: any) =>
        p.packageType === 'MONTHLY' || p.identifier?.includes('monthly')
      );
      if (aylik) {
        const aylikFiyat = aylik.product?.price ?? 0;
        const yillikFiyat = pkg.product?.price ?? 0;
        const tasarruf = Math.round((1 - yillikFiyat / (aylikFiyat * 12)) * 100);
        if (tasarruf > 0) return `%${tasarruf} ${tr ? 'tasarruf' : 'off'}`;
      }
    }
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: renkler.bg }]}>
      <StatusBar barStyle={renkler.statusBar} backgroundColor={renkler.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.kapat}>
          <Text style={[styles.kapatText, { color: renkler.metin2 }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.icerik}>
        {/* Başlık */}
        <View style={styles.logoBlok}>
          <Text style={styles.proRozet}>PRO</Text>
          <Text style={[styles.baslik, { color: renkler.metin }]}>
            {tr ? 'xmobile Pro' : 'xmobile Pro'}
          </Text>
          <View style={styles.trialBadge}>
            <Text style={styles.trialText}>
              {tr ? '🎁 7 Gün Ücretsiz Dene' : '🎁 Try Free for 7 Days'}
            </Text>
          </View>
          <Text style={[styles.altBaslik, { color: renkler.metin2 }]}>
            {tr
              ? 'Gardırobunu tam anlamıyla akıllı hale getir.'
              : 'Make your wardrobe truly intelligent.'}
          </Text>
        </View>

        {/* Özellikler */}
        <View style={[styles.ozelliklerKart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          {ozellikler.map((o, i) => (
            <View key={i} style={styles.ozellikSatir}>
              <Text style={styles.ozellikIcon}>{o.icon}</Text>
              <Text style={[styles.ozellikMetin, { color: renkler.metin }]}>{o.metin}</Text>
            </View>
          ))}
        </View>

        {/* Paket seçimi */}
        {yukleniyor ? (
          <ActivityIndicator color={CYAN} style={{ marginVertical: 32 }} />
        ) : teklifler.length === 0 ? (
          <View style={styles.mevcutDegil}>
            <Text style={[{ color: renkler.metin2, textAlign: 'center', fontSize: 14 }]}>
              {tr
                ? 'Abonelik paketleri yüklenemedi.\nRevenueCat yapılandırılmamış olabilir.'
                : 'Could not load subscription packages.\nRevenueCat may not be configured yet.'}
            </Text>
          </View>
        ) : (
          <View style={styles.paketler}>
            {teklifler.map((pkg, idx) => {
              const badge = indirimBadge(pkg, idx, teklifler);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.paket,
                    { borderColor: secili === idx ? CYAN : renkler.sinir,
                      backgroundColor: secili === idx ? 'rgba(0,212,255,0.06)' : renkler.kart },
                  ]}
                  onPress={() => setSecili(idx)}
                  activeOpacity={0.8}
                >
                  <View style={styles.paketSol}>
                    <View style={[styles.radyo, { borderColor: secili === idx ? CYAN : renkler.sinir }]}>
                      {secili === idx && <View style={styles.radyoIc} />}
                    </View>
                    <View>
                      <Text style={[styles.paketAd, { color: renkler.metin }]}>{paketAdi(pkg)}</Text>
                      <Text style={[styles.paketFiyat, { color: renkler.metin2 }]}>{fiyatMetni(pkg)}</Text>
                    </View>
                  </View>
                  {badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Alt butonlar */}
      <View style={[styles.alt, { borderTopColor: renkler.sinir }]}>
        <TouchableOpacity
          style={[styles.btnPrimary, (satinAliyor || teklifler.length === 0) && { opacity: 0.6 }]}
          onPress={satinAl}
          disabled={satinAliyor || teklifler.length === 0}
          activeOpacity={0.85}
        >
          {satinAliyor
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.btnPrimaryText}>
                {tr ? 'Pro\'ya Geç →' : 'Upgrade to Pro →'}
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={geriYukleBasin} disabled={satinAliyor}>
          <Text style={[styles.geriYukle, { color: renkler.metin2 }]}>
            {tr ? 'Satın almayı geri yükle' : 'Restore purchase'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.yasal, { color: renkler.metin2 }]}>
          {tr
            ? 'Abonelik otomatik yenilenir. iTunes hesabından iptal edebilirsin.'
            : 'Subscription auto-renews. Cancel anytime in your iTunes account.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header:         { paddingTop: 56, paddingHorizontal: 20, alignItems: 'flex-end' },
  kapat:          { padding: 8 },
  kapatText:      { fontSize: 18 },

  icerik:         { paddingHorizontal: 24, paddingBottom: 16 },
  logoBlok:       { alignItems: 'center', marginBottom: 28, marginTop: 8 },
  trialBadge: {
    backgroundColor: 'rgba(46,213,115,0.15)',
    borderWidth: 1, borderColor: 'rgba(46,213,115,0.5)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
    marginTop: 8, marginBottom: 4,
  },
  trialText: { fontSize: 14, fontWeight: '700', color: '#2ED573' },

  proRozet: {
    backgroundColor: CYAN, color: '#000',
    fontSize: 11, fontWeight: '800', letterSpacing: 2,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
    marginBottom: 14,
  },
  baslik:         { fontSize: 30, fontWeight: '700', marginBottom: 8 },
  altBaslik:      { fontSize: 15, textAlign: 'center', lineHeight: 22 },

  ozelliklerKart: {
    borderRadius: 16, padding: 20, borderWidth: 0.5, marginBottom: 20,
  },
  ozellikSatir:   { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  ozellikIcon:    { fontSize: 18, width: 30 },
  ozellikMetin:   { fontSize: 15, flex: 1 },

  paketler:       { gap: 10, marginBottom: 8 },
  paket: {
    borderWidth: 1.5, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  paketSol:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radyo: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  radyoIc:        { width: 11, height: 11, borderRadius: 6, backgroundColor: CYAN },
  paketAd:        { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  paketFiyat:     { fontSize: 13 },
  badge: {
    backgroundColor: CYAN, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText:      { fontSize: 11, fontWeight: '700', color: '#000' },

  mevcutDegil:    { marginVertical: 32 },

  alt: {
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 36,
    borderTopWidth: 0.5, gap: 12,
  },
  btnPrimary: {
    backgroundColor: CYAN, paddingVertical: 18,
    borderRadius: 50, alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 17, fontWeight: '700', color: '#000' },
  geriYukle:      { textAlign: 'center', fontSize: 13 },
  yasal: {
    textAlign: 'center', fontSize: 11, lineHeight: 16, opacity: 0.7,
  },
});
