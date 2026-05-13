import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/context';
import { chatJarvis } from '../lib/aiService';
import type { Kiyafet, Profil } from '../lib/types';

const CYAN       = '#00D4FF';
const KIYAFET_KEY = 'xmobile_kiyafetler';
const PROFIL_KEY  = 'xmobile_profil';

const TEN: Record<string, string> = { '#FDDBB4': 'Açık', '#E8B887': 'Buğday', '#C68642': 'Esmer', '#8D5524': 'Koyu' };

const KATEGORILER = ['Üst', 'Alt', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'];
const KATEGORI_IKONU: Record<string, string> = {
  'Üst': '👕', 'Alt': '👖', 'Dış Giyim': '🧥', 'Ayakkabı': '👟', 'Aksesuar': '👜',
};

function analizPrompt(kiyafetler: Kiyafet[], profil: Profil | null, dil: 'tr' | 'en'): string {
  const kategoriler: Record<string, string[]> = {};
  KATEGORILER.forEach(k => { kategoriler[k] = []; });
  kiyafetler.forEach(k => {
    const tur = KATEGORILER.find(t => k.tur.includes(t)) ?? 'Diğer';
    if (!kategoriler[tur]) kategoriler[tur] = [];
    kategoriler[tur].push(k.ad);
  });

  const profilMetin = profil ? [
    `Cinsiyet: ${profil.cinsiyet}`,
    `Ten: ${TEN[profil.tenRengi] ?? profil.tenRengi}`,
    `Boy: ${profil.boy} cm`,
  ].join(', ') : '';

  const gardıropMetin = KATEGORILER.map(k =>
    `${k}: ${kategoriler[k].length > 0 ? kategoriler[k].join(', ') : 'yok'}`
  ).join('\n');

  if (dil === 'en') {
    return `You are a personal stylist. Analyze this wardrobe and suggest up to 5 missing essentials.

USER: ${profilMetin}
WARDROBE (${kiyafetler.length} items):
${gardıropMetin}

For each suggestion provide:
- Item name (specific, e.g. "White Basic T-Shirt")
- Priority: HIGH / MEDIUM / LOW
- Why it's needed (1 sentence)
- Color recommendation based on skin tone

Format each item as:
**[Item Name]** | [PRIORITY]
[Reason] | Renk: [Color]

Be concise. Max 5 items.`;
  }

  return `Sen kişisel bir moda stilistisin. Bu gardırobu analiz et ve eksik olan en fazla 5 temel parçayı öner.

KULLANICI: ${profilMetin}
GARDIROB (${kiyafetler.length} kıyafet):
${gardıropMetin}

Her öneri için şu formatı kullan:
**[Parça Adı]** | [ÖNCELİK: YÜKSEK / ORTA / DÜŞÜK]
[Neden gerekli - 1 cümle] | Renk: [Ten rengine uygun renk önerisi]

Kısa ve pratik ol. Maksimum 5 öneri.`;
}

interface OneriKart {
  baslik: string;
  oncelik: 'YÜKSEK' | 'ORTA' | 'DÜŞÜK' | 'HIGH' | 'MEDIUM' | 'LOW';
  aciklama: string;
  renk: string;
}

function parseOneri(metin: string): OneriKart[] {
  const satirlar = metin.split('\n').filter(s => s.trim());
  const oneriler: OneriKart[] = [];
  let i = 0;
  while (i < satirlar.length) {
    const satir = satirlar[i].trim();
    const baslikMatch = satir.match(/\*\*(.+?)\*\*\s*\|\s*(.+)/);
    if (baslikMatch) {
      const baslik   = baslikMatch[1].trim();
      const oncelik  = baslikMatch[2].trim() as OneriKart['oncelik'];
      const sonraki  = satirlar[i + 1]?.trim() ?? '';
      const renkMatch = sonraki.match(/[Rr]enk:\s*(.+)/);
      const aciklama = sonraki.replace(/\s*\|?\s*[Rr]enk:.+/, '').trim();
      const renk     = renkMatch ? renkMatch[1].trim() : '';
      oneriler.push({ baslik, oncelik, aciklama, renk });
      i += 2;
    } else {
      i++;
    }
  }
  return oneriler;
}

const oncelikRenk = (o: string) => {
  if (o === 'YÜKSEK' || o === 'HIGH')   return '#FF4757';
  if (o === 'ORTA'   || o === 'MEDIUM') return '#FFA502';
  return '#2ED573';
};

export default function Analiz() {
  const router = useRouter();
  const { renkler, dil } = useApp();

  const [kiyafetler, setKiyafetler] = useState<Kiyafet[]>([]);
  const [profil,     setProfil]     = useState<Profil | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [oneriler,   setOneriler]   = useState<OneriKart[]>([]);
  const [hamMetin,   setHamMetin]   = useState('');
  const [hata,       setHata]       = useState('');

  const kategoriSayilari = KATEGORILER.map(k => ({
    tur: k,
    sayi: kiyafetler.filter(ki => ki.tur.includes(k)).length,
  }));
  const maksKategori = Math.max(...kategoriSayilari.map(k => k.sayi), 1);

  useEffect(() => {
    AsyncStorage.multiGet([KIYAFET_KEY, PROFIL_KEY]).then(([kv, pv]) => {
      let k: Kiyafet[] = [];
      let p: Profil | null = null;
      if (kv[1]) { try { const x = JSON.parse(kv[1]); k = Array.isArray(x) ? x : x.kiyafetler ?? []; } catch {} }
      if (pv[1]) { try { p = JSON.parse(pv[1]); } catch {} }
      setKiyafetler(k);
      setProfil(p);
      calistir(k, p);
    });
  }, []);

  const calistir = async (k: Kiyafet[], p: Profil | null) => {
    setYukleniyor(true);
    setHata('');
    setOneriler([]);
    setHamMetin('');
    try {
      const { content } = await chatJarvis({
        messages: [{ role: 'user', content: analizPrompt(k, p, dil) }],
        company: 'dogrucan',
        taskType: 'general',
      });
      setHamMetin(content);
      const parsed = parseOneri(content);
      setOneriler(parsed);
    } catch {
      setHata(dil === 'en' ? 'Analysis failed. Try again.' : 'Analiz başarısız. Tekrar dene.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: renkler.bg }]} edges={['top']}>
      <StatusBar barStyle={renkler.statusBar} />

      <View style={[styles.header, { borderBottomColor: renkler.sinir }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.geri, { color: renkler.metin }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { color: renkler.metin }]}>
          {dil === 'en' ? '🧠 Wardrobe Analysis' : '🧠 Gardırop Analizi'}
        </Text>
        <TouchableOpacity onPress={() => calistir(kiyafetler, profil)} disabled={yukleniyor}>
          <Ionicons name="refresh" size={20} color={yukleniyor ? renkler.metin2 : CYAN} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.icerik} showsVerticalScrollIndicator={false}>

        {/* ── İstatistikler ── */}
        <View style={[styles.kart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.kartBaslik, { color: renkler.metin }]}>
            {dil === 'en' ? `Wardrobe · ${kiyafetler.length} items` : `Gardırob · ${kiyafetler.length} kıyafet`}
          </Text>
          {kategoriSayilari.map(({ tur, sayi }) => (
            <View key={tur} style={styles.kategorıSatir}>
              <Text style={styles.kategorıIkon}>{KATEGORI_IKONU[tur]}</Text>
              <Text style={[styles.kategorıAd, { color: renkler.metin2 }]}>{tur}</Text>
              <View style={[styles.barArka, { backgroundColor: renkler.chip }]}>
                <View style={[styles.barOn, {
                  width: `${(sayi / maksKategori) * 100}%`,
                  backgroundColor: sayi === 0 ? renkler.sinir : CYAN,
                  opacity: sayi === 0 ? 0.4 : 0.7,
                }]} />
              </View>
              <Text style={[styles.kategorıSayi, { color: sayi === 0 ? renkler.metin2 : renkler.metin }]}>
                {sayi}
              </Text>
            </View>
          ))}
        </View>

        {/* ── AI Önerileri ── */}
        <Text style={[styles.bolumBaslik, { color: renkler.metin }]}>
          {dil === 'en' ? '✦ Shopping Suggestions' : '✦ Alışveriş Önerileri'}
        </Text>

        {yukleniyor ? (
          <View style={styles.merkez}>
            <ActivityIndicator color={CYAN} size="large" />
            <Text style={[styles.yukleniyorMetin, { color: renkler.metin2 }]}>
              {dil === 'en' ? 'Analyzing your wardrobe...' : 'Gardırobun analiz ediliyor...'}
            </Text>
          </View>
        ) : hata ? (
          <View style={styles.merkez}>
            <Text style={[{ color: renkler.metin2, textAlign: 'center' }]}>{hata}</Text>
            <TouchableOpacity style={[styles.tekrarBtn, { borderColor: CYAN }]}
              onPress={() => calistir(kiyafetler, profil)}>
              <Text style={{ color: CYAN, fontWeight: '600' }}>
                {dil === 'en' ? 'Retry' : 'Tekrar Dene'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : oneriler.length > 0 ? (
          oneriler.map((o, i) => (
            <View key={i} style={[styles.oneriKart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
              <View style={styles.oneriUst}>
                <Text style={[styles.oneriBaslik, { color: renkler.metin }]}>{o.baslik}</Text>
                <View style={[styles.oncelikBadge, { backgroundColor: oncelikRenk(o.oncelik) + '22' }]}>
                  <Text style={[styles.oncelikMetin, { color: oncelikRenk(o.oncelik) }]}>
                    {o.oncelik}
                  </Text>
                </View>
              </View>
              {o.aciklama ? (
                <Text style={[styles.oneriAciklama, { color: renkler.metin2 }]}>{o.aciklama}</Text>
              ) : null}
              {o.renk ? (
                <View style={styles.renkSatir}>
                  <Ionicons name="color-palette-outline" size={13} color={CYAN} />
                  <Text style={[styles.renkMetin, { color: CYAN }]}>{o.renk}</Text>
                </View>
              ) : null}
            </View>
          ))
        ) : hamMetin ? (
          // Parse edilemezse ham metni göster
          <View style={[styles.kart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
            <Text style={[{ color: renkler.metin, fontSize: 14, lineHeight: 22 }]}>{hamMetin}</Text>
          </View>
        ) : null}

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
  icerik: { padding: 16, gap: 12, paddingBottom: 120 },

  kart: { borderRadius: 16, borderWidth: 0.5, padding: 16, gap: 10 },
  kartBaslik: { fontSize: 15, fontWeight: '700', marginBottom: 4 },

  kategorıSatir: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kategorıIkon:  { fontSize: 16, width: 24 },
  kategorıAd:    { fontSize: 13, width: 80 },
  barArka:       { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barOn:         { height: 6, borderRadius: 3, minWidth: 4 },
  kategorıSayi:  { fontSize: 13, fontWeight: '700', width: 24, textAlign: 'right' },

  bolumBaslik: { fontSize: 14, fontWeight: '700', marginTop: 4, marginLeft: 2 },

  merkez: { alignItems: 'center', gap: 16, paddingVertical: 32 },
  yukleniyorMetin: { fontSize: 14 },
  tekrarBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },

  oneriKart: { borderRadius: 16, borderWidth: 0.5, padding: 16, gap: 8 },
  oneriUst:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  oneriBaslik: { fontSize: 15, fontWeight: '700', flex: 1 },
  oncelikBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  oncelikMetin: { fontSize: 11, fontWeight: '700' },
  oneriAciklama: { fontSize: 13, lineHeight: 19 },
  renkSatir:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  renkMetin:   { fontSize: 12, fontWeight: '600' },
});
