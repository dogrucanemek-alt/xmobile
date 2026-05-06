import React, { useEffect, useState, useRef } from 'react';
import {
  Text, View, StyleSheet, StatusBar, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Image,
  PanResponder, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, {
  Circle, Rect, Path, Ellipse,
  ClipPath, Defs, Image as SvgImage,
  RadialGradient, LinearGradient, Stop,
} from 'react-native-svg';
import { useApp } from '../lib/context';
import type { Kiyafet, Kombin, HavaDurumu, Profil } from '../lib/types';
import { GECMIS_KEY } from './history';

const WEATHER_KEY = process.env.EXPO_PUBLIC_WEATHER_KEY ?? '';
const CLAUDE_KEY  = process.env.EXPO_PUBLIC_CLAUDE_KEY ?? '';
const SEHIR       = 'Izmir,TR';

const renkBul = (parcaAdi: string | null): string => {
  const ad = (parcaAdi ?? '').toLowerCase();
  if (ad.includes('beyaz') || ad.includes('ekru') || ad.includes('kırık'))  return '#F0F0F0';
  if (ad.includes('siyah'))                                                  return '#1A1A1A';
  if (ad.includes('antrasit') || ad.includes('füme'))                        return '#3B3B3B';
  if (ad.includes('lacivert') || ad.includes('indigo') || ad.includes('navy')) return '#1B2A4A';
  if (ad.includes('saks'))                                                   return '#4A7FA5';
  if (ad.includes('mavi'))                                                   return '#2E6DA4';
  if (ad.includes('kirmizi') || ad.includes('kırmızı'))                      return '#C0392B';
  if (ad.includes('yesil')   || ad.includes('yeşil') || ad.includes('haki')) return '#27AE60';
  if (ad.includes('sari')    || ad.includes('sarı') || ad.includes('hardal')) return '#F1C40F';
  if (ad.includes('gri')     || ad.includes('grimelanj'))                    return '#7F8C8D';
  if (ad.includes('bej')     || ad.includes('krem') || ad.includes('kum'))   return '#D4B896';
  if (ad.includes('kahve')   || ad.includes('taba') || ad.includes('vizon')) return '#8B6347';
  if (ad.includes('bordo')   || ad.includes('mürdüm'))                       return '#6B1A1A';
  if (ad.includes('pembe')   || ad.includes('pudra'))                        return '#E91E8C';
  if (ad.includes('turuncu') || ad.includes('kiremit'))                      return '#E67E22';
  if (ad.includes('mor')     || ad.includes('lila') || ad.includes('leylak')) return '#8E44AD';
  return '#6B6B6B';
};

const hexToHsl = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if      (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else                h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
};

const hueDist = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

const pairScore = (d: number): number => {
  if (d <=  30)              return 95; // monochromatic
  if (d <=  60)              return 82; // analogous
  if (d >= 150 && d <= 210)  return 88; // complementary
  if (d >= 100 && d <= 140)  return 78; // split-complementary / triadic
  if (d >= 220 && d <= 260)  return 78; // triadic
  if (d >=  61 && d <=  99)  return 52; // tension
  return 45;                            // discord
};

const renkUyumSkoru = (parcalar: string[]): number => {
  const hslList = parcalar.map(p => hexToHsl(renkBul(p)));
  const aktif   = hslList.filter(([, s]) => s > 0.12); // nötr renkleri atla
  if (aktif.length < 2) return 88;                      // çoğunlukla nötr → güvenli
  let total = 0, count = 0;
  for (let i = 0; i < aktif.length; i++)
    for (let j = i + 1; j < aktif.length; j++) {
      total += pairScore(hueDist(aktif[i][0], aktif[j][0]));
      count++;
    }
  return Math.round(total / count);
};

interface AvatarProps {
  kombin: Kombin;
  profil: Profil | null;
  kiyafetler: Kiyafet[];
}

// viewBox koordinat sistemi (iç çizim alanı)
const W = 200, H = 400;
// Ekranda gösterim boyutu (küçük, row layout için)
const DISP_W = 120, DISP_H = 240;

const AvatarSVG = React.memo(function AvatarSVG({ kombin, profil, kiyafetler }: AvatarProps) {
  if (profil?.avatarUrl && !profil?.profilFoto) {
    const pngUrl = profil.avatarUrl.replace(/\.glb(\?.*)?$/, '.png') + '?scene=fullbody-portrait-v1';
    return (
      <Image
        source={{ uri: pngUrl }}
        style={{ width: DISP_W, height: DISP_H, borderRadius: 12 }}
        resizeMode="contain"
      />
    );
  }

  const tenRengi = profil?.tenRengi ?? '#FDDBB4';
  const sacRengi = profil?.sacRengi ?? '#3D2314';
  const gozRengi = profil?.gozRengi ?? '#5C3D2E';
  const kadin    = profil?.cinsiyet === 'Kadın';
  const uzunSac  = (profil?.sacStili ?? (kadin ? 'uzun' : 'orta')) === 'uzun';
  const sakal    = profil?.sakal ?? 'yok';

  const parcaEsle = (anahtar: string[]): string | null =>
    kombin.parcalar.find(p => anahtar.some(k => p.toLowerCase().includes(k))) ?? null;

  const disParca  = parcaEsle(['mont', 'kaban', 'trençkot', 'trenkot', 'yağmurluk', 'yagmurluk', 'hırka', 'hirka']);
  const ustParca  = parcaEsle(['gömlek', 'gomlek', 'tişört', 'tisort', 'kazak', 'bluz', 'ceket', 'sweatshirt', 'hoodie']);
  const altParca  = parcaEsle(['pantolon', 'etek', 'şort', 'short', 'jean', 'takim', 'takım', 'elbise']);
  const ayakParca = parcaEsle(['ayakkabı', 'ayakkabi', 'bot', 'sneaker', 'loafer', 'sandalet', 'çizme', 'cizme']);

  const ust      = disParca ?? ustParca;
  const ustRenk  = renkBul(ust);
  const altRenk  = renkBul(altParca);
  const ayakRenk = renkBul(ayakParca) ?? '#1A1A1A';

  // Koordinat düzeni:
  // Kafa:   cy=110  (rx=56 ry=62)  →  y=48..172
  // Boyun:  y=168..188
  // Gövde:  y=186..274
  // Kalça:  y=272..294
  // Bacak:  y=291..365
  // Ayak:   y=362..382

  return (
    <Svg width={DISP_W} height={DISP_H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <RadialGradient id="outYuz" cx="40%" cy="35%" rx="60%" ry="55%">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.28} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0.13} />
        </RadialGradient>
        <RadialGradient id="outSac" cx="50%" cy="15%" rx="55%" ry="60%">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.20} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0.28} />
        </RadialGradient>
        <RadialGradient id="outIris" cx="35%" cy="30%" rx="65%" ry="65%">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.32} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0.22} />
        </RadialGradient>
        <ClipPath id="avcHeadClip">
          <Ellipse cx={100} cy={110} rx={56} ry={62} />
        </ClipPath>
      </Defs>

      {/* Zemin gölgesi */}
      <Ellipse cx={100} cy={392} rx={58} ry={7} fill="rgba(0,0,0,0.10)" />

      {/* ── SAÇ ARKA ── */}
      {uzunSac ? (
        <Path
          d="M 44 110 C 40 48, 160 48, 156 110 L 162 238 C 155 263, 45 263, 38 238 Z"
          fill={sacRengi}
        />
      ) : (
        <Path d="M 44 110 C 40 48, 160 48, 156 110" fill={sacRengi} />
      )}

      {/* ── BAŞ ── */}
      <Ellipse cx={100} cy={110} rx={56} ry={62} fill={tenRengi} />
      <Ellipse cx={100} cy={110} rx={56} ry={62} fill="url(#outYuz)" />

      {/* Kulaklar */}
      <Ellipse cx={44}  cy={114} rx={8} ry={10} fill={tenRengi} />
      <Ellipse cx={156} cy={114} rx={8} ry={10} fill={tenRengi} />
      <Ellipse cx={44}  cy={114} rx={5} ry={6}  fill="rgba(0,0,0,0.07)" />
      <Ellipse cx={156} cy={114} rx={5} ry={6}  fill="rgba(0,0,0,0.07)" />

      {/* ── SAKAL ── */}
      {sakal === 'hafif' && (
        <>
          <Ellipse cx={100} cy={155} rx={30} ry={13} fill={sacRengi} opacity={0.35} />
          <Ellipse cx={76}  cy={148} rx={13} ry={9}  fill={sacRengi} opacity={0.25} />
          <Ellipse cx={124} cy={148} rx={13} ry={9}  fill={sacRengi} opacity={0.25} />
        </>
      )}
      {sakal === 'tam' && (
        <Path
          d="M 58 136 Q 58 170 100 176 Q 142 170 142 136 Q 135 156 100 162 Q 65 156 58 136 Z"
          fill={sacRengi} opacity={0.72}
        />
      )}

      {/* Profil fotoğrafı VEYA çizgi yüz */}
      {profil?.profilFoto ? (
        <SvgImage
          x={44} y={48} width={112} height={124}
          href={profil.profilFoto}
          clipPath="url(#avcHeadClip)"
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <>
          <Ellipse cx={68}  cy={124} rx={13} ry={9} fill="rgba(255,120,100,0.18)" />
          <Ellipse cx={132} cy={124} rx={13} ry={9} fill="rgba(255,120,100,0.18)" />
          <Path d="M 76 88 Q 86 82 96 88"
            stroke={sacRengi} strokeWidth={3} fill="none" strokeLinecap="round" />
          <Path d="M 104 88 Q 114 82 124 88"
            stroke={sacRengi} strokeWidth={3} fill="none" strokeLinecap="round" />
          <Ellipse cx={86}  cy={100} rx={11} ry={11} fill="white" />
          <Ellipse cx={114} cy={100} rx={11} ry={11} fill="white" />
          <Circle  cx={86}  cy={101} r={7}   fill={gozRengi} />
          <Circle  cx={86}  cy={101} r={7}   fill="url(#outIris)" />
          <Circle  cx={114} cy={101} r={7}   fill={gozRengi} />
          <Circle  cx={114} cy={101} r={7}   fill="url(#outIris)" />
          <Circle  cx={86}  cy={101} r={3.5} fill="#111" />
          <Circle  cx={114} cy={101} r={3.5} fill="#111" />
          <Circle  cx={88}  cy={97}  r={2.5} fill="white" />
          <Circle  cx={116} cy={97}  r={2.5} fill="white" />
          <Circle  cx={84}  cy={104} r={1.2} fill="white" opacity={0.6} />
          <Circle  cx={112} cy={104} r={1.2} fill="white" opacity={0.6} />
          <Path d="M 97 112 Q 95 122 97 124 Q 100 127 103 124 Q 105 122 103 112"
            fill="none" stroke="rgba(0,0,0,0.13)" strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M 88 132 Q 100 143 112 132"
            stroke="#D4706C" strokeWidth={3} fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ── SAÇ ÖN KAPAK ── */}
      <Path d="M 44 80 C 44 44, 156 44, 156 80 C 140 62, 60 62, 44 80 Z" fill={sacRengi} />
      <Path d="M 44 80 C 44 44, 156 44, 156 80 C 140 62, 60 62, 44 80 Z" fill="url(#outSac)" />
      {uzunSac && (
        <>
          <Path d="M 44 110 C 34 158, 32 200, 34 228"
            stroke={sacRengi} strokeWidth={14} fill="none" strokeLinecap="round" />
          <Path d="M 156 110 C 166 158, 168 200, 166 228"
            stroke={sacRengi} strokeWidth={14} fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ── BOYUN ── */}
      <Rect x={88} y={168} width={24} height={20} fill={tenRengi} />

      {/* ── VÜCUT DERİ ── */}
      <Rect x={50}  y={186} width={100} height={88} rx={12} fill={tenRengi} />
      <Rect x={22}  y={188} width={28}  height={80} rx={12} fill={tenRengi} />
      <Rect x={150} y={188} width={28}  height={80} rx={12} fill={tenRengi} />
      <Ellipse cx={36}  cy={271} rx={16} ry={13} fill={tenRengi} />
      <Ellipse cx={164} cy={271} rx={16} ry={13} fill={tenRengi} />
      {/* Kalça + bacaklar tek blok (П engeli) */}
      <Rect x={50}  y={272} width={100} height={94} rx={4}  fill={tenRengi} />
      <Rect x={50}  y={362} width={46}  height={6}  rx={4}  fill={tenRengi} />
      <Rect x={104} y={362} width={46}  height={6}  rx={4}  fill={tenRengi} />

      {/* ── ÜST GİYSİ ── */}
      <Rect x={50}  y={186} width={100} height={88} rx={12} fill={ustRenk} />
      <Rect x={22}  y={188} width={28}  height={80} rx={12} fill={ustRenk} />
      <Rect x={150} y={188} width={28}  height={80} rx={12} fill={ustRenk} />
      <Path d="M 88 188 Q 100 202 112 188"
        fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth={2} />

      {/* Bilekler */}
      <Rect x={22}  y={256} width={28} height={14} fill={tenRengi} />
      <Rect x={150} y={256} width={28} height={14} fill={tenRengi} />

      {/* ── ALT GİYSİ ── */}
      <Rect x={50}  y={272} width={100} height={92} rx={6} fill={altRenk} />
      <Rect x={98}  y={296} width={4}   height={68} fill="rgba(0,0,0,0.12)" />

      {/* ── AYAKKABI ── */}
      <Rect x={38}  y={360} width={62} height={22} rx={9} fill={ayakRenk} />
      <Rect x={100} y={360} width={62} height={22} rx={9} fill={ayakRenk} />
      <Rect x={38}  y={375} width={62} height={7}  rx={4} fill="rgba(0,0,0,0.28)" />
      <Rect x={100} y={375} width={62} height={7}  rx={4} fill="rgba(0,0,0,0.28)" />
    </Svg>
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

  const kombinlerRef = useRef<Kombin[]>([]);
  const indexRef     = useRef(0);
  const slideAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => { kombinlerRef.current = kombinler; }, [kombinler]);
  useEffect(() => { indexRef.current = seciliIndex; },  [seciliIndex]);

  const swipeRef = useRef((dir: 1 | -1) => {
    const next = Math.min(Math.max(indexRef.current + dir, 0), kombinlerRef.current.length - 1);
    if (next === indexRef.current) return;
    slideAnim.setValue(-dir * 320);
    setSeciliIndex(next);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 12,
      onPanResponderRelease: (_, g) => {
        if      (g.dx < -50) swipeRef.current(1);
        else if (g.dx >  50) swipeRef.current(-1);
      },
    })
  ).current;

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
      const msg = e instanceof Error ? e.message : String(e);
      setHata(`Başlatma hatası: ${msg}`);
      setYukleniyor(false);
    }
  };

  const kombinOner = async (havaVeri: HavaDurumu, liste: Kiyafet[]): Promise<void> => {
    if (liste.length === 0) {
      setHata('Gardırobunda kıyafet yok. Önce kıyafet ekle.');
      setYukleniyor(false);
      return;
    }

    const lang = dil === 'en' ? 'English' : 'Turkish';
    const numaraliListe = liste
      .map((k, i) => `${i + 1}. "${k.ad}" (${k.tur}, ${k.sezon})`)
      .join('\n');
    const jsonFormat = dil === 'en'
      ? `{"kombinler":[{"baslik":"title","tur":"Work","parcalar":["EXACT item name from list"],"neden":"1 sentence"}]}`
      : `{"kombinler":[{"baslik":"başlık","tur":"İş","parcalar":["LİSTEDEKİ TAM İSİM"],"neden":"1 cümle"}]}`;

    const iltifat = dil === 'en'
      ? 'End with a short compliment like "You\'ll look great! ✨" or "Very stylish! 🔥"'
      : '"neden" alanını kısa bir iltifatla bitir: "Çok yakışıklı olacaksın! ✨" veya "Harika görüneceksin! 🔥" gibi';

    const prompt = `Style assistant. Respond in ${lang}.

Weather: ${havaVeri.derece}°C, ${havaVeri.durum}, feels like ${havaVeri.hissedilen}°C

WARDROBE (copy names exactly, character-for-character):
${numaraliListe}

Create 3 outfit combinations. Rules:
- "parcalar": EXACT names from the list above, no changes
- "tur": ${dil === 'en' ? 'Work, Casual, Social, or Sport' : 'İş, Günlük, Sosyal veya Spor'}
- "neden": 1 short sentence explaining why this works for today's weather. ${iltifat}
Return ONLY valid JSON:
${jsonFormat}`;

    if (!CLAUDE_KEY) {
      setHata('EXPO_PUBLIC_CLAUDE_KEY tanımlı değil. .env dosyasını kontrol et ve Expo\'yu yeniden başlat.');
      setYukleniyor(false);
      return;
    }

    const controller = new AbortController();
    const zaman = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          system: 'You are a fashion style assistant. You MUST respond with valid JSON only. Never include any explanatory text, markdown, or code blocks outside the JSON structure.',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      clearTimeout(zaman);

      if (!res.ok) {
        const errText = await res.text();
        setHata(`API Hatası (${res.status}): ${errText.slice(0, 200)}`);
        setYukleniyor(false);
        return;
      }

      const data = await res.json();

      if (data.error) {
        setHata(`Claude Hatası: ${data.error.type} — ${data.error.message}`);
        setYukleniyor(false);
        return;
      }

      if (data.content?.[0]?.text) {
        const metin     = data.content[0].text as string;
        const baslangic = metin.indexOf('{');
        const bitis     = metin.lastIndexOf('}') + 1;
        if (baslangic === -1 || bitis === 0) {
          setHata(`JSON bulunamadı. Claude yanıtı: ${metin.slice(0, 200)}`);
          setYukleniyor(false);
          return;
        }
        const parsed = JSON.parse(metin.slice(baslangic, bitis)) as { kombinler: Kombin[] };
        if (!Array.isArray(parsed.kombinler) || parsed.kombinler.length === 0) {
          setHata(`Kombinler oluşturulamadı. Claude yanıtı: ${metin.slice(0, 300)}`);
          setYukleniyor(false);
          return;
        }
        setKombinler(parsed.kombinler);
      } else {
        setHata(`Beklenmeyen API yanıtı: ${JSON.stringify(data).slice(0, 200)}`);
      }
    } catch (e) {
      clearTimeout(zaman);
      const msg = e instanceof Error ? e.message : 'Bilinmeyen hata';
      const hataMesaj = msg.includes('abort') || msg.includes('Abort')
        ? 'İstek zaman aşımına uğradı (30s). İnternet bağlantını kontrol et.'
        : `Kombin oluşturulamadı: ${msg}`;
      setHata(hataMesaj);
    }
    setYukleniyor(false);
  };

  const havaIkon = () => {
    if (!hava) return '🌡️';
    const d = hava.durum.toLowerCase();
    const saat = new Date().getHours();
    const gece = saat >= 21 || saat < 5;
    const alacakaranlik = (saat >= 5 && saat < 7) || (saat >= 18 && saat < 21);

    if (d.includes('yağmur') || d.includes('rain'))  return '🌧️';
    if (d.includes('kar')    || d.includes('snow'))  return '❄️';
    if (d.includes('fırtına')|| d.includes('storm')) return '⛈️';
    if (d.includes('sis')    || d.includes('fog')  || d.includes('mist')) return '🌫️';
    if (d.includes('bulut')  || d.includes('cloud')) return gece ? '☁️' : '⛅';
    if (d.includes('açık')   || d.includes('clear')) {
      if (gece) return '🌙';
      if (alacakaranlik) return saat < 7 ? '🌅' : '🌆';
      return '☀️';
    }
    return gece ? '🌙' : '🌤️';
  };

  const seciliKombin = kombinler[seciliIndex];
  const skor      = seciliKombin ? renkUyumSkoru(seciliKombin.parcalar) : 0;
  const skorRenk  = skor >= 80 ? '#27AE60' : skor >= 60 ? '#F39C12' : '#E74C3C';
  const skorEtiket = dil === 'en'
    ? (skor >= 90 ? 'Perfect' : skor >= 75 ? 'Great'  : skor >= 60 ? 'Good' : 'Mismatch')
    : (skor >= 90 ? 'Mükemmel' : skor >= 75 ? 'Harika' : skor >= 60 ? 'İyi'  : 'Uyumsuz');

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
          <View
            style={[styles.avatarBolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir, overflow: 'hidden' }]}
            {...panResponder.panHandlers}
          >
            {seciliKombin && (
              <Animated.View style={[styles.avatarSatir, { transform: [{ translateX: slideAnim }] }]}>
                <View style={{ width: DISP_W, height: DISP_H }}>
                  <AvatarSVG kombin={seciliKombin} profil={profil} kiyafetler={kiyafetler} />
                </View>
                <View style={styles.avatarBilgi}>
                  <Text style={[styles.avatarBaslik, { color: renkler.metin }]}>{seciliKombin.baslik}</Text>
                  <View style={[styles.badge, { backgroundColor: renkler.chip }]}>
                    <Text style={[styles.badgeText, { color: renkler.metin2 }]}>{seciliKombin.tur}</Text>
                  </View>
                  <Text style={[styles.avatarNeden, { color: renkler.metin2 }]}>{seciliKombin.neden}</Text>
                  <View style={styles.skorKutu}>
                    <View style={styles.skorUstSatir}>
                      <Text style={[styles.skorLabel, { color: renkler.metin2 }]}>
                        {dil === 'en' ? 'Color Match' : 'Renk Uyumu'}
                      </Text>
                      <Text style={[styles.skorSayi, { color: skorRenk }]}>
                        {skor} <Text style={styles.skorEtiketText}>{skorEtiket}</Text>
                      </Text>
                    </View>
                    <View style={[styles.skorBarBg, { backgroundColor: renkler.chip }]}>
                      <View style={[styles.skorBarDolu, { width: `${skor}%` as any, backgroundColor: skorRenk }]} />
                    </View>
                  </View>
                  <View style={styles.noktaSatir}>
                    {kombinler.map((_, i) => (
                      <View
                        key={i}
                        style={[styles.nokta, { backgroundColor: i === seciliIndex ? renkler.metin : renkler.sinir }]}
                      />
                    ))}
                  </View>
                </View>
              </Animated.View>
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
                {seciliKombin.parcalar.map((p, i) => {
                  const aranan = p.toLowerCase();
                  const eslesme = kiyafetler.find(k => {
                    const kAd = k.ad?.toLowerCase() ?? '';
                    return kAd === aranan || aranan.includes(kAd) || kAd.includes(aranan);
                  });
                  const foto = eslesme?.foto ?? null;
                  return (
                    <View key={i} style={[styles.parcaChip, { backgroundColor: renkler.chip }]}>
                      {foto
                        ? <Image source={{ uri: foto }} style={styles.parcaChipFoto} />
                        : <View style={[styles.parcaChipFotoYok, { backgroundColor: renkler.sinir }]} />
                      }
                      <Text style={[styles.parcaText, { color: renkler.metin }]}>{p}</Text>
                    </View>
                  );
                })}
              </View>
              <TouchableOpacity
                style={[styles.secButon, { backgroundColor: renkler.btnPrimary }]}
                onPress={async () => {
                  const kayitli = await AsyncStorage.getItem(GECMIS_KEY);
                  const liste = kayitli ? JSON.parse(kayitli) : [];
                  liste.unshift({
                    id: Date.now().toString(),
                    tarih: new Date().toISOString(),
                    kombin: seciliKombin,
                    favori: false,
                    hava: hava ? { derece: hava.derece, durum: hava.durum } : undefined,
                  });
                  await AsyncStorage.setItem(GECMIS_KEY, JSON.stringify(liste));
                  Alert.alert(
                    `✓ ${t.kombinSecildi}`,
                    `"${seciliKombin.baslik}" ${t.iyiGunler}`,
                    [
                      { text: dil === 'en' ? 'View History' : 'Geçmişi Gör', onPress: () => router.push('/history') },
                      { text: 'OK' },
                    ],
                  );
                }}
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
    marginHorizontal: 16, borderRadius: 16, padding: 14,
    borderWidth: 0.5,
  },
  avatarSatir:    { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarBilgi:    { flex: 1 },
  avatarBaslik:   { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  badge:          { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText:      { fontSize: 11, fontWeight: '500' },
  avatarNeden:    { fontSize: 12, lineHeight: 18 },
  noktaSatir:     { flexDirection: 'row', gap: 6, marginTop: 12 },
  nokta:          { width: 7, height: 7, borderRadius: 4 },
  skorKutu:       { marginTop: 10, gap: 5 },
  skorUstSatir:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  skorLabel:      { fontSize: 10 },
  skorSayi:       { fontSize: 13, fontWeight: '700' },
  skorEtiketText: { fontSize: 10, fontWeight: '400' },
  skorBarBg:      { height: 4, borderRadius: 2 },
  skorBarDolu:    { height: 4, borderRadius: 2 },
  seciciSatir:    { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  seciciBtn:      { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 0.5 },
  seciciBtnText:  { fontSize: 12, fontWeight: '500' },
  parcalarBolum: {
    marginHorizontal: 16, marginTop: 12,
    borderRadius: 14, padding: 18, borderWidth: 0.5,
  },
  parcalarBaslik: { fontSize: 13, marginBottom: 10 },
  parcalar:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  parcaChip:       { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingRight: 12, paddingVertical: 4, paddingLeft: 4, gap: 8 },
  parcaChipFoto:   { width: 36, height: 44, borderRadius: 16, resizeMode: 'cover' },
  parcaChipFotoYok:{ width: 36, height: 44, borderRadius: 16 },
  parcaText:       { fontSize: 13 },
  secButon:       { borderRadius: 10, padding: 14, alignItems: 'center' },
  secButonText:   { fontSize: 14, fontWeight: '500' },
});
