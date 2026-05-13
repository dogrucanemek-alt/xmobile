import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/context';
import { chatJarvis } from '../lib/aiService';
import type { KombinKayit, Kiyafet, Profil } from '../lib/types';
import { streakOku, type StreakData } from '../lib/streak';

const CYAN = '#00D4FF';
const GECMIS_KEY  = 'xmobile_gecmis';
const KIYAFET_KEY = 'xmobile_kiyafetler';
const PROFIL_KEY  = 'xmobile_profil';

const TEN: Record<string, string> = { '#FDDBB4': 'Açık', '#E8B887': 'Buğday', '#C68642': 'Esmer', '#8D5524': 'Koyu' };

interface HaftaIstats {
  toplamKombin: number;
  enCokGiyilen: string;
  favoriler: number;
  kategoriler: Record<string, number>;
}

function istatHesapla(kayitlar: KombinKayit[]): HaftaIstats {
  const kategoriler: Record<string, number> = {};
  const parcaSayim: Record<string, number> = {};
  let favoriler = 0;

  for (const k of kayitlar) {
    if (k.favori) favoriler++;
    if (k.kombin.tur) kategoriler[k.kombin.tur] = (kategoriler[k.kombin.tur] ?? 0) + 1;
    for (const p of k.kombin.parcalar) {
      const k2 = p.toLowerCase().trim();
      parcaSayim[k2] = (parcaSayim[k2] ?? 0) + 1;
    }
  }

  const enCokGiyilen = Object.entries(parcaSayim).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';

  return { toplamKombin: kayitlar.length, enCokGiyilen, favoriler, kategoriler };
}

function sonYediGun(): string {
  const tarihler: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    tarihler.push(d.toISOString().split('T')[0]);
  }
  return tarihler[0] + ' — ' + tarihler[6];
}

export default function HaftalikRapor() {
  const router = useRouter();
  const { renkler, dil } = useApp();

  const [yukleniyor, setYukleniyor]   = useState(false);
  const [rapor, setRapor]             = useState('');
  const [istat, setIstat]             = useState<HaftaIstats | null>(null);
  const [hafta, setHafta]             = useState(sonYediGun());
  const [streak, setStreak]           = useState<StreakData>({ current: 0, best: 0, lastActive: '' });
  const [renkPaleti, setRenkPaleti]   = useState<{renk: string; ad: string; sayi: number}[]>([]);

  useEffect(() => {
    yukleVeRaporla();
    streakOku().then(setStreak);
  }, []);

  const yukleVeRaporla = async () => {
    setYukleniyor(true);
    try {
      const [gv, kv, pv] = await AsyncStorage.multiGet([GECMIS_KEY, KIYAFET_KEY, PROFIL_KEY]);

      let gecmis: KombinKayit[] = [];
      let kiyafetler: Kiyafet[] = [];
      let profil: Profil | null = null;

      if (gv[1]) { try { gecmis = JSON.parse(gv[1]); } catch {} }
      if (kv[1]) { try { const p = JSON.parse(kv[1]); kiyafetler = Array.isArray(p) ? p : p.kiyafetler ?? []; } catch {} }
      if (pv[1]) { try { profil = JSON.parse(pv[1]); } catch {} }

      // Son 7 gün
      const yediGunOnce = new Date();
      yediGunOnce.setDate(yediGunOnce.getDate() - 7);
      const haftaKayitlari = gecmis.filter(k => new Date(k.tarih) >= yediGunOnce);

      setIstat(istatHesapla(haftaKayitlari));
      setHafta(sonYediGun());

      // Renk paleti — gardırobtaki renkleri say
      const renkSayim: Record<string, number> = {};
      const RENK_ADLARI: Record<string, string> = {
        '#1A1A1A': 'Siyah', '#FFFFFF': 'Beyaz', '#EEEEEE': 'Krem',
        '#2C3E50': 'Lacivert', '#4A90D9': 'Mavi', '#2ED573': 'Yeşil',
        '#E74C3C': 'Kırmızı', '#C68642': 'Kahve', '#F39C12': 'Sarı',
        '#9B59B6': 'Mor', '#808080': 'Gri', '#FFA07A': 'Somon',
      };
      for (const k of kiyafetler) {
        if (k.renk) {
          renkSayim[k.renk] = (renkSayim[k.renk] ?? 0) + 1;
        }
      }
      const palette = Object.entries(renkSayim)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([renk, sayi]) => ({ renk, sayi, ad: RENK_ADLARI[renk] ?? renk }));
      setRenkPaleti(palette);

      const kombinListesi = haftaKayitlari.length > 0
        ? haftaKayitlari.map(k => `- ${k.kombin.baslik} (${k.kombin.parcalar.join(', ')})`).join('\n')
        : (dil === 'tr' ? 'Bu hafta kombin seçilmedi' : 'No outfits this week');

      const profilMetin = profil
        ? `${profil.cinsiyet}, ${profil.boy}cm, Ten: ${TEN[profil.tenRengi] ?? profil.tenRengi}`
        : '';

      const gardıropMetin = kiyafetler.length > 0
        ? kiyafetler.map(k => `- ${k.ad} (${k.tur})`).join('\n')
        : (dil === 'tr' ? 'Gardırop boş' : 'Empty wardrobe');

      const sistem = dil === 'tr'
        ? `Sen bir kişisel moda asistanısın. Türkçe yaz.`
        : `You are a personal fashion assistant. Reply in English.`;

      const prompt = dil === 'tr'
        ? `Kullanıcının bu haftaki kıyafet geçmişini analiz et ve kişisel bir haftalık stil raporu yaz.

KULLANICI: ${profilMetin || 'Bilinmiyor'}

BU HAFTANIN KOMBİNLERİ:
${kombinListesi}

GARDIROB:
${gardıropMetin}

Raporunda şunları içer:
1. **Bu Haftanın Özeti** — Ne giyildi, hangi tema öne çıktı
2. **Güçlü Yönler** — Bu haftaki stil başarıları
3. **Gelişim Fırsatları** — Denenmesi gereken şeyler
4. **Gelecek Hafta İçin İpuçları** — 2-3 somut öneri

Kısa, samimi ve motive edici bir ton kullan. Maks 250 kelime.`
        : `Analyze the user's outfit history for this week and write a personal weekly style report.

USER: ${profilMetin || 'Unknown'}

THIS WEEK'S OUTFITS:
${kombinListesi}

WARDROBE:
${gardıropMetin}

Include in the report:
1. **Week Summary** — What was worn, what theme stood out
2. **Strengths** — This week's style wins
3. **Growth Areas** — Things to try
4. **Tips for Next Week** — 2-3 concrete suggestions

Use a concise, genuine, motivating tone. Max 250 words.`;

      const { content } = await chatJarvis({
        messages: [
          { role: 'user',      content: sistem },
          { role: 'assistant', content: dil === 'tr' ? 'Anlıyorum, haftalık stil raporu hazırlıyorum.' : 'Got it, preparing your weekly style report.' },
          { role: 'user',      content: prompt },
        ],
        company: 'dogrucan',
        taskType: 'general',
      });

      setRapor(content);
    } catch {
      setRapor(dil === 'tr' ? 'Rapor oluşturulamadı. Tekrar dene.' : 'Could not generate report. Try again.');
    } finally {
      setYukleniyor(false);
    }
  };

  const raporBolumlerineAyir = (metin: string) => {
    const satırlar = metin.split('\n').filter(s => s.trim());
    return satırlar.map((satir, i) => {
      const baslik = satir.startsWith('**') && satir.endsWith('**');
      const bold = satir.startsWith('**');
      if (baslik) {
        return <Text key={i} style={[s.bolumBaslik, { color: renkler.metin }]}>{satir.replace(/\*\*/g, '')}</Text>;
      }
      if (bold) {
        const parca = satir.split('**');
        return (
          <Text key={i} style={[s.satirMetin, { color: renkler.metin }]}>
            {parca.map((p, j) => j % 2 === 1 ? <Text key={j} style={{ fontWeight: '700', color: CYAN }}>{p}</Text> : p)}
          </Text>
        );
      }
      return <Text key={i} style={[s.satirMetin, { color: renkler.metin }]}>{satir}</Text>;
    });
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: renkler.bg }]} edges={['top']}>
      <StatusBar barStyle={renkler.statusBar} />

      <View style={[s.header, { borderBottomColor: renkler.sinir }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[s.geri, { color: renkler.metin }]}>←</Text>
        </TouchableOpacity>
        <Text style={[s.baslik, { color: renkler.metin }]}>
          {dil === 'tr' ? '📊 Haftalık Rapor' : '📊 Weekly Report'}
        </Text>
        <TouchableOpacity onPress={yukleVeRaporla} disabled={yukleniyor}>
          <Ionicons name="refresh" size={20} color={yukleniyor ? renkler.metin2 : CYAN} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.icerik} showsVerticalScrollIndicator={false}>

        {/* Tarih aralığı */}
        <Text style={[s.hafta, { color: renkler.metin2 }]}>{hafta}</Text>

        {/* İstatistik kartları */}
        {istat && (
          <View style={s.statSatir}>
            <View style={[s.statKart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
              <Text style={[s.statSayi, { color: CYAN }]}>{istat.toplamKombin}</Text>
              <Text style={[s.statEtiket, { color: renkler.metin2 }]}>
                {dil === 'tr' ? 'Kombin' : 'Outfits'}
              </Text>
            </View>
            <View style={[s.statKart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
              <Text style={[s.statSayi, { color: CYAN }]}>{istat.favoriler}</Text>
              <Text style={[s.statEtiket, { color: renkler.metin2 }]}>
                {dil === 'tr' ? 'Favori' : 'Favorites'}
              </Text>
            </View>
            <View style={[s.statKart, { backgroundColor: renkler.kart, borderColor: renkler.sinir, flex: 2 }]}>
              <Text style={[s.statSayi, { color: CYAN, fontSize: 14, fontWeight: '700' }]} numberOfLines={1}>
                {istat.enCokGiyilen}
              </Text>
              <Text style={[s.statEtiket, { color: renkler.metin2 }]}>
                {dil === 'tr' ? 'En çok' : 'Top item'}
              </Text>
            </View>
          </View>
        )}

        {/* Kategori dağılımı */}
        {istat && Object.keys(istat.kategoriler).length > 0 && (
          <View style={[s.kategoriKart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
            <Text style={[s.altBaslik, { color: renkler.metin }]}>
              {dil === 'tr' ? 'Kombin Türleri' : 'Outfit Types'}
            </Text>
            {Object.entries(istat.kategoriler).sort((a, b) => b[1] - a[1]).map(([tur, sayi]) => {
              const yuzde = istat.toplamKombin > 0 ? sayi / istat.toplamKombin : 0;
              return (
                <View key={tur} style={s.kategorSatir}>
                  <Text style={[s.kategoriAd, { color: renkler.metin }]}>{tur}</Text>
                  <View style={[s.barBg, { backgroundColor: renkler.sinir }]}>
                    <View style={[s.barDolu, { width: `${yuzde * 100}%` as any, backgroundColor: CYAN }]} />
                  </View>
                  <Text style={[s.kategoriSayi, { color: renkler.metin2 }]}>{sayi}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Streak */}
        {streak.current > 0 && (
          <View style={[s.kategoriKart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
            <Text style={[s.altBaslik, { color: renkler.metin }]}>
              {dil === 'tr' ? '🔥 Günlük Seri' : '🔥 Daily Streak'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 36, fontWeight: '900', color: '#FF6B35' }}>{streak.current}</Text>
                <Text style={[{ fontSize: 11, color: renkler.metin2 }]}>{dil === 'tr' ? 'günlük' : 'day streak'}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 36, fontWeight: '900', color: CYAN }}>{streak.best}</Text>
                <Text style={[{ fontSize: 11, color: renkler.metin2 }]}>{dil === 'tr' ? 'en iyi' : 'best'}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 13, color: renkler.metin2, lineHeight: 19 }}>
                {streak.current >= streak.best
                  ? (dil === 'tr' ? '🏆 Yeni rekor kırıyorsun!' : '🏆 New record!')
                  : (dil === 'tr' ? `Rekoru kırmak için ${streak.best - streak.current + 1} gün daha!` : `${streak.best - streak.current + 1} more days to beat your record!`)}
              </Text>
            </View>
          </View>
        )}

        {/* Renk Paleti */}
        {renkPaleti.length > 0 && (
          <View style={[s.kategoriKart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
            <Text style={[s.altBaslik, { color: renkler.metin }]}>
              {dil === 'tr' ? '🎨 Gardırop Renk Paleti' : '🎨 Wardrobe Color Palette'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {renkPaleti.map((r, i) => (
                <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: r.renk,
                    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
                      {r.sayi}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 9, color: renkler.metin2, textAlign: 'center', maxWidth: 44 }} numberOfLines={1}>
                    {r.ad}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* AI Rapor */}
        <View style={[s.raporKart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <View style={s.raporHeader}>
            <Ionicons name="sparkles" size={16} color={CYAN} />
            <Text style={[s.altBaslik, { color: renkler.metin }]}>
              {dil === 'tr' ? 'AI Stil Analizi' : 'AI Style Analysis'}
            </Text>
          </View>

          {yukleniyor ? (
            <View style={s.yukleniyor}>
              <ActivityIndicator color={CYAN} />
              <Text style={[{ color: renkler.metin2, fontSize: 14, marginTop: 8 }]}>
                {dil === 'tr' ? 'Haftan analiz ediliyor...' : 'Analyzing your week...'}
              </Text>
            </View>
          ) : rapor ? (
            <View style={{ gap: 6 }}>
              {raporBolumlerineAyir(rapor)}
            </View>
          ) : null}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5,
  },
  geri:   { fontSize: 22 },
  baslik: { fontSize: 17, fontWeight: '700' },
  icerik: { padding: 20, paddingBottom: 120, gap: 16 },

  hafta: { fontSize: 13, textAlign: 'center' },

  statSatir: { flexDirection: 'row', gap: 10 },
  statKart: {
    flex: 1, borderRadius: 16, borderWidth: 0.5,
    padding: 14, alignItems: 'center', gap: 4,
  },
  statSayi:   { fontSize: 26, fontWeight: '800' },
  statEtiket: { fontSize: 11 },

  kategoriKart: { borderRadius: 16, borderWidth: 0.5, padding: 16, gap: 10 },
  altBaslik:    { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  kategorSatir: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kategoriAd:   { fontSize: 13, width: 80 },
  barBg:        { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barDolu:      { height: '100%', borderRadius: 3 },
  kategoriSayi: { fontSize: 12, width: 20, textAlign: 'right' },

  raporKart:  { borderRadius: 16, borderWidth: 0.5, padding: 16, gap: 12 },
  raporHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  yukleniyor: { alignItems: 'center', paddingVertical: 20 },

  bolumBaslik: { fontSize: 15, fontWeight: '700', marginTop: 8 },
  satirMetin:  { fontSize: 14, lineHeight: 22 },
});
