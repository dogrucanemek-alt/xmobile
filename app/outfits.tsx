import React, { useEffect, useState } from 'react';
import {
  Text, View, StyleSheet, StatusBar, TouchableOpacity,
  ScrollView, ActivityIndicator, Image, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from './context';
import type { Kiyafet, Kombin, HavaDurumu, Profil } from './types';

const WEATHER_KEY = process.env.EXPO_PUBLIC_WEATHER_KEY ?? '';
const CLAUDE_KEY  = process.env.EXPO_PUBLIC_CLAUDE_KEY ?? '';
const SEHIR       = 'Izmir,TR';

const renkBul = (parcaAdi: string | null): string => {
  const ad = (parcaAdi ?? '').toLowerCase();
  if (ad.includes('beyaz'))                              return '#F0F0F0';
  if (ad.includes('siyah'))                              return '#1A1A1A';
  if (ad.includes('lacivert'))                           return '#1B2A4A';
  if (ad.includes('mavi'))                               return '#2E6DA4';
  if (ad.includes('kirmizi') || ad.includes('kırmızı')) return '#C0392B';
  if (ad.includes('yesil')   || ad.includes('yeşil'))   return '#27AE60';
  if (ad.includes('sari')    || ad.includes('sarı'))     return '#F1C40F';
  if (ad.includes('gri'))                                return '#7F8C8D';
  if (ad.includes('bej')     || ad.includes('krem'))     return '#D4B896';
  if (ad.includes('kahve')   || ad.includes('bordo'))    return '#6B3A2A';
  if (ad.includes('pembe'))                              return '#E91E8C';
  if (ad.includes('turuncu'))                            return '#E67E22';
  if (ad.includes('mor'))                                return '#8E44AD';
  return '#4A90D9';
};

interface AvatarKombinProps {
  kombin: Kombin;
  profil: Profil | null;
  kiyafetler: Kiyafet[];
}

const AvatarKombin = React.memo(function AvatarKombin({ kombin, profil, kiyafetler }: AvatarKombinProps) {
  const tenRengi = profil?.tenRengi ?? '#FDDBB4';
  const sacRengi = profil?.sacRengi ?? '#1A1A1A';
  const gozRengi = profil?.gozRengi ?? '#6B3A2A';

  const parcaEsle = (anahtar: string[]): string | null =>
    kombin.parcalar.find(p =>
      anahtar.some(k => p.toLowerCase().includes(k))
    ) ?? null;

  const fotografBul = (parcaAdi: string | null): string | null => {
    if (!parcaAdi) return null;
    const aranan = parcaAdi.toLowerCase();
    const tam = kiyafetler.find(k => k.ad?.toLowerCase() === aranan);
    if (tam?.foto) return tam.foto;
    const kismi = kiyafetler.find(k => {
      const ad = k.ad?.toLowerCase() ?? '';
      return aranan.includes(ad) || ad.includes(aranan);
    });
    return kismi?.foto ?? null;
  };

  const ustParca = parcaEsle(['gömlek', 'gomlek', 'tişört', 'tisort', 'kazak', 'bluz', 'ceket']);
  const altParca = parcaEsle(['pantolon', 'etek', 'şort', 'short', 'jean', 'takim', 'takım']);
  const disParca = parcaEsle(['mont', 'kaban', 'trençkot', 'trenkot', 'yağmurluk', 'yagmurluk']);

  const ustFoto = fotografBul(ustParca);
  const altFoto = fotografBul(altParca);
  const disFoto = fotografBul(disParca);
  const ustRenk = renkBul(ustParca);
  const altRenk = renkBul(altParca);
  const disRenk = disParca ? renkBul(disParca) : null;

  return (
    <View style={av.container}>
      {profil?.profilFoto ? (
        <Image source={{ uri: profil.profilFoto }} style={av.yuzFoto} resizeMode="cover" />
      ) : (
        <>
          <View style={[av.sac, { backgroundColor: sacRengi }]} />
          <View style={[av.bas, { backgroundColor: tenRengi }]}>
            <View style={av.gozSatir}>
              <View style={[av.goz, { backgroundColor: gozRengi }]} />
              <View style={[av.goz, { backgroundColor: gozRengi }]} />
            </View>
            <View style={av.agiz} />
          </View>
        </>
      )}

      <View style={[av.boyun, { backgroundColor: tenRengi }]} />

      {disParca && (
        <>
          {disFoto
            ? <Image source={{ uri: disFoto }} style={av.disGovde} resizeMode="cover" />
            : <View style={[av.disGovde, { backgroundColor: disRenk ?? undefined }]} />}
          <View style={[av.disKolSol, { backgroundColor: disRenk ?? undefined }]} />
          <View style={[av.disKolSag, { backgroundColor: disRenk ?? undefined }]} />
        </>
      )}

      {ustFoto
        ? <Image source={{ uri: ustFoto }} style={av.ust} resizeMode="cover" />
        : <View style={[av.ust, { backgroundColor: ustRenk, borderWidth: ustRenk === '#F0F0F0' ? 1 : 0, borderColor: '#DDD' }]} />}

      <View style={[av.kolSol, { backgroundColor: disRenk ?? ustRenk }]} />
      <View style={[av.kolSag, { backgroundColor: disRenk ?? ustRenk }]} />

      {altFoto
        ? <Image source={{ uri: altFoto }} style={av.alt} resizeMode="cover" />
        : <View style={[av.alt, { backgroundColor: altRenk }]} />}

      <View style={[av.bacakSol, { backgroundColor: altRenk }]} />
      <View style={[av.bacakSag, { backgroundColor: altRenk }]} />
      <View style={av.ayakSol} />
      <View style={av.ayakSag} />
    </View>
  );
});

export default function Outfits() {
  const { t, renkler, dil } = useApp();
  const router = useRouter();
  const [hava, setHava]               = useState<HavaDurumu | null>(null);
  const [kombinler, setKombinler]     = useState<Kombin[]>([]);
  const [yukleniyor, setYukleniyor]   = useState(true);
  const [hata, setHata]               = useState('');
  const [seciliIndex, setSeciliIndex] = useState(0);
  const [profil, setProfil]           = useState<Profil | null>(null);
  const [kiyafetler, setKiyafetler]   = useState<Kiyafet[]>([]);

  useEffect(() => { baslat(); }, []);

  const havaAl = async (): Promise<HavaDurumu> => {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${SEHIR}&appid=${WEATHER_KEY}&units=metric&lang=tr`
    );
    const data = await res.json();
    if (!data.main) throw new Error('Hava verisi alınamadı');
    const havaVeri: HavaDurumu = {
      derece:     Math.round(data.main.temp),
      durum:      data.weather[0].description,
      nem:        data.main.humidity,
      hissedilen: Math.round(data.main.feels_like),
    };
    setHava(havaVeri);
    return havaVeri;
  };

  const kiyafetleriAl = async (): Promise<Kiyafet[]> => {
    const kayitli = await AsyncStorage.getItem('xmobile_kiyafetler');
    const liste: Kiyafet[] = kayitli ? JSON.parse(kayitli) : [];
    setKiyafetler(liste);
    return liste;
  };

  const baslat = async () => {
    setYukleniyor(true);
    setHata('');
    try {
      const [profilStr, havaVeri, kiyafetle] = await Promise.all([
        AsyncStorage.getItem('xmobile_profil'),
        havaAl(),
        kiyafetleriAl(),
      ]);
      if (profilStr) setProfil(JSON.parse(profilStr));
      await kombinOner(havaVeri, kiyafetle);
    } catch (e) {
      setHata('Bir hata oluştu. Tekrar dene.');
      setYukleniyor(false);
    }
  };

  const kombinOner = async (havaVeri: HavaDurumu, liste: Kiyafet[]): Promise<void> => {
    if (liste.length === 0) {
      setHata('Gardırobunda kıyafet yok. Önce kıyafet ekle.');
      setYukleniyor(false);
      return;
    }

    const listeStr  = liste.map(k => `${k.ad} (${k.tur}, ${k.sezon})`).join(', ');
    const lang      = dil === 'en' ? 'English' : 'Turkish';
    const jsonFormat = dil === 'en'
      ? `{"kombinler":[{"baslik":"title","tur":"Work","parcalar":["item name"],"neden":"1 sentence explanation"}]}`
      : `{"kombinler":[{"baslik":"başlık","tur":"İş","parcalar":["kıyafet adı"],"neden":"1 cümle açıklama"}]}`;

    const prompt = `You are a personal style consultant. You MUST respond entirely in ${lang}. This is critical.
Weather: ${havaVeri.derece}°C, ${havaVeri.durum}, feels like ${havaVeri.hissedilen}°C, humidity ${havaVeri.nem}%
Wardrobe items: ${listeStr}
Suggest 3 different outfit combinations for today based on the weather and wardrobe.
IMPORTANT: In the "parcalar" array, use ONLY the exact item names from the wardrobe list above.
The "tur" field must be one of: ${dil === 'en' ? 'Work, Casual, Social, Sport' : 'İş, Günlük, Sosyal, Spor'}
Return ONLY valid JSON, nothing else:
${jsonFormat}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await res.json();

      if (data.error) {
        setHata(`API Hatası: ${data.error.message}`);
        setYukleniyor(false);
        return;
      }

      if (data.content?.[0]?.text) {
        const metin     = data.content[0].text as string;
        const baslangic = metin.indexOf('{');
        const bitis     = metin.lastIndexOf('}') + 1;
        const parsed    = JSON.parse(metin.slice(baslangic, bitis)) as { kombinler: Kombin[] };
        setKombinler(parsed.kombinler);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Bilinmeyen hata';
      setHata(`Kombin oluşturulamadı: ${msg}`);
    }
    setYukleniyor(false);
  };

  const havaIkon = () => {
    if (!hava) return '🌡️';
    const d = hava.durum.toLowerCase();
    if (d.includes('yağmur') || d.includes('rain'))  return '🌧️';
    if (d.includes('kar')    || d.includes('snow'))  return '❄️';
    if (d.includes('bulut')  || d.includes('cloud')) return '⛅';
    if (d.includes('açık')   || d.includes('clear')) return '☀️';
    return '🌤️';
  };

  const seciliKombin = kombinler[seciliIndex];

  return (
    <View style={[styles.container, { backgroundColor: renkler.bg2 }]}>
      <StatusBar barStyle={renkler.statusBar} backgroundColor={renkler.bg} />

      <View style={[styles.header, { backgroundColor: renkler.bg, borderBottomColor: renkler.sinir }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.geri, { color: renkler.metin }]}>{t.geri}</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { color: renkler.metin }]}>{t.bugunkuKombinler}</Text>
        <TouchableOpacity onPress={baslat}>
          <Text style={[styles.yenile, { color: renkler.metin }]}>↺</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.havaDurumu, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
        {!hava ? <ActivityIndicator color={renkler.metin} /> : (
          <>
            <Text style={styles.havaIkon}>{havaIkon()}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.havaDerece, { color: renkler.metin }]}>{hava.derece}°C · {hava.durum}</Text>
              <Text style={[styles.havaNot, { color: renkler.metin2 }]}>
                {t.hissedilen} {hava.hissedilen}°C, {t.nem} %{hava.nem}
              </Text>
            </View>
            <Text style={[styles.havaSehir, { color: renkler.metin2 }]}>İzmir</Text>
          </>
        )}
      </View>

      {yukleniyor ? (
        <View style={styles.yukleniyor}>
          <ActivityIndicator color={renkler.metin} size="large" />
          <Text style={[styles.yukleniyorText, { color: renkler.metin2 }]}>{t.yukleniyorText}</Text>
        </View>
      ) : hata ? (
        <View style={styles.hataKutu}>
          <Text style={styles.hataIcon}>⚠️</Text>
          <Text style={[styles.hataText, { color: renkler.metin2 }]}>{hata}</Text>
          <TouchableOpacity style={[styles.tekrarBtn, { backgroundColor: renkler.btnPrimary }]} onPress={baslat}>
            <Text style={[styles.tekrarBtnText, { color: renkler.btnPrimaryMetin }]}>{t.tekrarDene}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.avatarBolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
            {seciliKombin && (
              <AvatarKombin kombin={seciliKombin} profil={profil} kiyafetler={kiyafetler} />
            )}
            {seciliKombin && (
              <View style={styles.avatarBilgi}>
                <Text style={[styles.avatarBaslik, { color: renkler.metin }]}>{seciliKombin.baslik}</Text>
                <View style={[styles.badge, { backgroundColor: renkler.chip }]}>
                  <Text style={[styles.badgeText, { color: renkler.metin2 }]}>{seciliKombin.tur}</Text>
                </View>
                <Text style={[styles.avatarNeden, { color: renkler.metin2 }]}>{seciliKombin.neden}</Text>
              </View>
            )}
          </View>

          <View style={styles.seciciSatir}>
            {kombinler.map((k, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.seciciBtn, { backgroundColor: renkler.kart, borderColor: renkler.sinir },
                  seciliIndex === i && { backgroundColor: renkler.btnPrimary, borderColor: renkler.btnPrimary }
                ]}
                onPress={() => setSeciliIndex(i)}
              >
                <Text style={[styles.seciciBtnText, { color: renkler.metin2 },
                  seciliIndex === i && { color: renkler.btnPrimaryMetin }
                ]}>
                  {i + 1}. {k.tur}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {seciliKombin && (
            <View style={[styles.parcalarBolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
              <Text style={[styles.parcalarBaslik, { color: renkler.metin2 }]}>{t.buKombin}</Text>
              <View style={styles.parcalar}>
                {seciliKombin.parcalar.map((p, i) => (
                  <View key={i} style={[styles.parcaChip, { backgroundColor: renkler.chip }]}>
                    <Text style={[styles.parcaText, { color: renkler.metin }]}>{p}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.secButon, { backgroundColor: renkler.btnPrimary }]}
                onPress={() => Alert.alert(`✓ ${t.kombinSecildi}`, `"${seciliKombin.baslik}" ${t.iyiGunler}`)}
              >
                <Text style={[styles.secButonText, { color: renkler.btnPrimaryMetin }]}>{t.buKombiniSec}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const av = StyleSheet.create({
  container:  { width: 110, height: 200, position: 'relative' },
  yuzFoto:    { position: 'absolute', top: 0, left: 22, width: 66, height: 66, borderRadius: 33 },
  sac:        { position: 'absolute', top: 0, left: 27, width: 56, height: 22, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  bas:        { position: 'absolute', top: 10, left: 27, width: 56, height: 50, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  gozSatir:   { flexDirection: 'row', gap: 10, marginBottom: 6 },
  goz:        { width: 7, height: 7, borderRadius: 4 },
  agiz:       { width: 14, height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.25)' },
  boyun:      { position: 'absolute', top: 57, left: 47, width: 16, height: 10 },
  disGovde:   { position: 'absolute', top: 65, left: 14, width: 82, height: 60, borderRadius: 8 },
  disKolSol:  { position: 'absolute', top: 67, left: 0,  width: 16, height: 50, borderRadius: 8 },
  disKolSag:  { position: 'absolute', top: 67, right: 0, width: 16, height: 50, borderRadius: 8 },
  ust:        { position: 'absolute', top: 65, left: 20, width: 70, height: 58, borderRadius: 6 },
  kolSol:     { position: 'absolute', top: 67, left: 4,  width: 18, height: 48, borderRadius: 8 },
  kolSag:     { position: 'absolute', top: 67, right: 4, width: 18, height: 48, borderRadius: 8 },
  alt:        { position: 'absolute', top: 121, left: 20, width: 70, height: 45, borderRadius: 4 },
  bacakSol:   { position: 'absolute', top: 164, left: 20, width: 30, height: 22, borderRadius: 4 },
  bacakSag:   { position: 'absolute', top: 164, left: 60, width: 30, height: 22, borderRadius: 4 },
  ayakSol:    { position: 'absolute', top: 183, left: 16, width: 34, height: 12, borderRadius: 4, backgroundColor: '#1A1A1A' },
  ayakSag:    { position: 'absolute', top: 183, left: 56, width: 34, height: 12, borderRadius: 4, backgroundColor: '#1A1A1A' },
});

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 0.5,
  },
  geri:           { fontSize: 20, fontWeight: '300' },
  baslik:         { fontSize: 17, fontWeight: '600' },
  yenile:         { fontSize: 22, fontWeight: '300' },
  havaDurumu: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, borderRadius: 14, padding: 16,
    borderWidth: 0.5, gap: 12, minHeight: 72,
  },
  havaIkon:       { fontSize: 32 },
  havaDerece:     { fontSize: 15, fontWeight: '600' },
  havaNot:        { fontSize: 12, marginTop: 2 },
  havaSehir:      { fontSize: 13 },
  yukleniyor:     { alignItems: 'center', paddingVertical: 80, gap: 16 },
  yukleniyorText: { fontSize: 14 },
  hataKutu:       { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 12 },
  hataIcon:       { fontSize: 40 },
  hataText:       { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  tekrarBtn:      { marginTop: 8, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  tekrarBtnText:  { fontSize: 14, fontWeight: '600' },
  avatarBolum: {
    marginHorizontal: 16, borderRadius: 14, padding: 20,
    borderWidth: 0.5, flexDirection: 'row', alignItems: 'center', gap: 20,
  },
  avatarBilgi:    { flex: 1 },
  avatarBaslik:   { fontSize: 17, fontWeight: '600', marginBottom: 6 },
  badge:          { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10 },
  badgeText:      { fontSize: 11 },
  avatarNeden:    { fontSize: 13, lineHeight: 20 },
  seciciSatir:    { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  seciciBtn:      { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 0.5 },
  seciciBtnText:  { fontSize: 12, fontWeight: '500' },
  parcalarBolum: {
    marginHorizontal: 16, marginTop: 12,
    borderRadius: 14, padding: 18, borderWidth: 0.5,
  },
  parcalarBaslik: { fontSize: 13, marginBottom: 10 },
  parcalar:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  parcaChip:      { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  parcaText:      { fontSize: 13 },
  secButon:       { borderRadius: 10, padding: 14, alignItems: 'center' },
  secButonText:   { fontSize: 14, fontWeight: '500' },
});
