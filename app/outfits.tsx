import React, { useEffect, useState, useRef } from 'react';
import {
  Text, View, StyleSheet, StatusBar, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Image,
  PanResponder, Animated, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Svg, {
  Circle, Rect, Path, Ellipse,
  ClipPath, Defs, Image as SvgImage,
  RadialGradient, LinearGradient, Stop,
} from 'react-native-svg';
import { useApp } from '../lib/context';
import type { Kiyafet, Kombin, HavaDurumu, Profil } from '../lib/types';
import { GECMIS_KEY } from './history';
import ThreeDViewer from '../components/ThreeDViewer';
import ThreeDInline from '../components/ThreeDInline';
import UpsellModal from '../components/UpsellModal';
import { useSubscription } from '../lib/subscriptionContext';
import { meshyModelUret } from '../lib/meshyService';
import { renkBul, parcaEsle, kiyafetRenkBul, hexToRgba, renkUyumSkoru } from '../lib/outfitColor';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { kombinHakkiVar, kombinKullan, kalanHakAl } from '../lib/freemium';
import { proMuKontrol } from '../lib/revenueCat';
import { tryOnBaslat, tryOnBekle, type TryOnCategory } from '../lib/fashnService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://xmobile-proxy.vercel.app';

const NEON    = '#00D4FF';
const DARK_BG = '#00040F';
const GLASS   = 'rgba(0,212,255,0.07)';
const GLASS_B = 'rgba(0,212,255,0.22)';



interface AvatarProps {
  kombin: Kombin;
  profil: Profil | null;
  kiyafetler: Kiyafet[];
}


function buildOverlayHtml(kombin: Kombin, kiyafetler: Kiyafet[]): string {
  const esle = (anahtarlar: string[]) => parcaEsle(kombin, anahtarlar);
  const renk = (ad: string | null) => kiyafetRenkBul(ad, kiyafetler);

  const disParca  = esle(['mont', 'kaban', 'trençkot', 'trenkot', 'yağmurluk', 'yagmurluk', 'hırka', 'hirka', 'coat', 'jacket', 'raincoat', 'cardigan', 'blazer', 'trench', 'parka', 'overcoat']);
  const ustParca  = esle(['gömlek', 'gomlek', 'tişört', 'tisort', 'kazak', 'bluz', 'ceket', 'sweatshirt', 'hoodie', 'shirt', 't-shirt', 'tshirt', 'sweater', 'blouse', 'top', 'polo', 'turtleneck', 'knit']);
  const altParca  = esle(['pantolon', 'etek', 'şort', 'short', 'jean', 'takim', 'takım', 'elbise', 'pants', 'trousers', 'skirt', 'shorts', 'jeans', 'dress', 'suit', 'chinos', 'leggings', 'culottes']);
  const ayakParca = esle(['ayakkabı', 'ayakkabi', 'bot', 'sneaker', 'loafer', 'sandalet', 'çizme', 'cizme', 'shoes', 'boots', 'sneakers', 'loafers', 'sandals', 'heels', 'flats', 'mules', 'oxfords']);

  const ust      = disParca ?? ustParca;
  const ustRenk  = renk(ust);
  const altRenk  = renk(altParca);
  const ayakRenk = renk(ayakParca);

  const band = (color: string, top: number, height: number, opacity: number): string => {
    const c    = hexToRgba(color, opacity);
    const fade = hexToRgba(color, 0);
    return `<div style="
      position:absolute;top:${top}%;left:0;width:100%;height:${height}%;
      background:linear-gradient(to bottom,${fade} 0%,${c} 22%,${c} 78%,${fade} 100%);
      filter:blur(9px);pointer-events:none;
    "></div>`;
  };

  let divs = '';

  if (ust) {
    if (disParca && ustParca) {
      divs += band(renk(ustParca), 20, 34, 0.38);
      divs += band(ustRenk, 17, 40, 0.36);
    } else {
      divs += band(ustRenk, 18, 38, 0.44);
    }
  }

  if (altParca) {
    divs += band(altRenk, 54, 34, 0.44);
  }

  if (ayakParca) {
    divs += band(ayakRenk, 86, 13, 0.52);
  }

  if (!divs) return '';

  return `<div style="position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;pointer-events:none;z-index:5;">${divs}</div>`;
}

// viewBox koordinat sistemi (iç çizim alanı)
const W = 200, H = 400;
// Ekranda gösterim boyutu
const DISP_W = 120, DISP_H = 220;

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

  const esle = (anahtarlar: string[]) => parcaEsle(kombin, anahtarlar);
  const renk = (ad: string | null) => kiyafetRenkBul(ad, kiyafetler);

  const disParca  = esle(['mont', 'kaban', 'trençkot', 'trenkot', 'yağmurluk', 'yagmurluk', 'hırka', 'hirka', 'coat', 'jacket', 'raincoat', 'cardigan', 'blazer', 'trench', 'parka', 'overcoat']);
  const ustParca  = esle(['gömlek', 'gomlek', 'tişört', 'tisort', 'kazak', 'bluz', 'ceket', 'sweatshirt', 'hoodie', 'shirt', 't-shirt', 'tshirt', 'sweater', 'blouse', 'top', 'polo', 'turtleneck', 'knit']);
  const altParca  = esle(['pantolon', 'etek', 'şort', 'short', 'jean', 'takim', 'takım', 'elbise', 'pants', 'trousers', 'skirt', 'shorts', 'jeans', 'dress', 'suit', 'chinos', 'leggings', 'culottes']);
  const ayakParca = esle(['ayakkabı', 'ayakkabi', 'bot', 'sneaker', 'loafer', 'sandalet', 'çizme', 'cizme', 'shoes', 'boots', 'sneakers', 'loafers', 'sandals', 'heels', 'flats', 'mules', 'oxfords']);

  const ust      = disParca ?? ustParca;
  const ustRenk  = renk(ust);
  const altRenk  = renk(altParca);
  const ayakRenk = renk(ayakParca);

  // Koordinat düzeni (AvatarSVG):
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
          <Ellipse cx={100} cy={110} rx={50} ry={55} />
        </ClipPath>
      </Defs>

      {/* Hologram platform */}
      <Ellipse cx={100} cy={396} rx={72} ry={13} fill="rgba(0,212,255,0.10)" />
      <Ellipse cx={100} cy={396} rx={52} ry={8}  fill="rgba(0,212,255,0.22)" />
      <Ellipse cx={100} cy={396} rx={30} ry={5}  fill="rgba(0,212,255,0.45)" />

      {/* ── SAÇ ARKA (sadece uzun saçta) ── */}
      {uzunSac && (
        <Path
          d="M 50 110 C 46 55, 154 55, 150 110 L 156 234 C 149 259, 51 259, 44 234 Z"
          fill={sacRengi}
        />
      )}

      {/* ── BAŞ ── (rx=50 ry=55 — vücutla orantılı) */}
      <Ellipse cx={100} cy={110} rx={50} ry={55} fill={tenRengi} />
      <Ellipse cx={100} cy={110} rx={50} ry={55} fill="url(#outYuz)" />

      {/* Kulaklar (profil fotoğrafı varsa gizle) */}
      {!profil?.profilFoto && (
        <>
          <Ellipse cx={50}  cy={113} rx={7} ry={9} fill={tenRengi} />
          <Ellipse cx={150} cy={113} rx={7} ry={9} fill={tenRengi} />
          <Ellipse cx={50}  cy={113} rx={4} ry={5} fill="rgba(0,0,0,0.07)" />
          <Ellipse cx={150} cy={113} rx={4} ry={5} fill="rgba(0,0,0,0.07)" />
        </>
      )}

      {/* ── SAKAL ── */}
      {sakal === 'hafif' && (
        <>
          <Ellipse cx={100} cy={152} rx={26} ry={11} fill={sacRengi} opacity={0.35} />
          <Ellipse cx={78}  cy={146} rx={11} ry={8}  fill={sacRengi} opacity={0.25} />
          <Ellipse cx={122} cy={146} rx={11} ry={8}  fill={sacRengi} opacity={0.25} />
        </>
      )}
      {sakal === 'tam' && (
        <Path
          d="M 62 134 Q 62 167 100 173 Q 138 167 138 134 Q 131 153 100 159 Q 69 153 62 134 Z"
          fill={sacRengi} opacity={0.72}
        />
      )}

      {/* Profil fotoğrafı VEYA çizgi yüz */}
      {profil?.profilFoto ? (
        <SvgImage
          x={50} y={55} width={100} height={110}
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

      {/* ── SAÇ ÖN KAPAK (profil fotoğrafı varsa saç çizilmez) ── */}
      {!profil?.profilFoto && (
        <>
          <Path d="M 50 78 C 50 48, 150 48, 150 78 C 136 62, 64 62, 50 78 Z" fill={sacRengi} />
          <Path d="M 50 78 C 50 48, 150 48, 150 78 C 136 62, 64 62, 50 78 Z" fill="url(#outSac)" />
          {uzunSac && (
            <>
              <Path d="M 50 110 C 40 158, 38 200, 40 228"
                stroke={sacRengi} strokeWidth={12} fill="none" strokeLinecap="round" />
              <Path d="M 150 110 C 160 158, 162 200, 160 228"
                stroke={sacRengi} strokeWidth={12} fill="none" strokeLinecap="round" />
            </>
          )}
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
      {disParca && ustParca ? (
        <>
          {/* İç gömlek — tam gövde + kollar */}
          <Rect x={50}  y={186} width={100} height={88} rx={12} fill={renk(ustParca)} />
          <Rect x={22}  y={188} width={28}  height={80} rx={12} fill={renk(ustParca)} />
          <Rect x={150} y={188} width={28}  height={80} rx={12} fill={renk(ustParca)} />
          {/* Açık ceket sol panel: üstte x=22..92, altta x=22..76 → V açılım */}
          <Path d="M 22 186 L 92 186 L 92 220 L 76 274 L 22 274 Z" fill={ustRenk} />
          {/* Açık ceket sağ panel (simetrik) */}
          <Path d="M 178 186 L 108 186 L 108 220 L 124 274 L 178 274 Z" fill={ustRenk} />
          {/* Sol yaka kıvrımı (revers) */}
          <Path d="M 92 186 L 84 210 L 76 186 Z" fill={ustRenk} opacity={0.85} />
          {/* Sağ yaka kıvrımı (revers) */}
          <Path d="M 108 186 L 116 210 L 124 186 Z" fill={ustRenk} opacity={0.85} />
          {/* Yaka gölge çizgisi */}
          <Path d="M 84 210 L 100 232 L 116 210"
            fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth={1.5} />
        </>
      ) : (
        <>
          <Rect x={50}  y={186} width={100} height={88} rx={12} fill={ustRenk} />
          <Rect x={22}  y={188} width={28}  height={80} rx={12} fill={ustRenk} />
          <Rect x={150} y={188} width={28}  height={80} rx={12} fill={ustRenk} />
          <Path d="M 88 188 Q 100 202 112 188"
            fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth={2} />
        </>
      )}

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
  const { t, renkler, aksanRenk, dil, avatarGlbUri, loadAvatarGlb } = useApp();
  const { can3D, kullanim3DArtir, tier, aylikKullanim } = useSubscription();
  const router = useRouter();
  const [hava, setHava]               = useState<HavaDurumu | null>(null);
  const [kombinler, setKombinler]     = useState<Kombin[]>([]);
  const [yukleniyor, setYukleniyor]   = useState(true);
  const [hata, setHata]               = useState('');
  const [seciliIndex, setSeciliIndex] = useState(0);
  const [profil, setProfil]           = useState<Profil | null>(null);
  const [kiyafetler, setKiyafetler]   = useState<Kiyafet[]>([]);
  const [sehirAdi, setSehirAdi]       = useState('...');

  const [viewer3D, setViewer3D]         = useState<{ visible: boolean; glbUrl: string; baslik: string }>({
    visible: false, glbUrl: '', baslik: '',
  });
  const [upsellGoster, setUpsellGoster] = useState(false);
  const [yuklenen3D, setYuklenen3D]     = useState<string | null>(null);
  const [yukleniyor3D, setYukleniyor3D] = useState(false);
  const [hata3D, setHata3D]             = useState<string | null>(null);
  const [paylasiyor, setPaylasiyor]     = useState(false);
  const [kalanHak, setKalanHak]         = useState<number | null>(null);
  const [tryOn, setTryOn] = useState<{
    visible: boolean;
    adim: 'sec' | 'yukleniyor' | 'sonuc';
    sonucUri: string | null;
    hata: string | null;
  }>({ visible: false, adim: 'sec', sonucUri: null, hata: null });
  const viewShotRef = useRef<ViewShot>(null);
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

  const paylas = async () => {
    if (!viewShotRef.current || !seciliKombin) return;
    try {
      setPaylasiyor(true);
      const uri = await captureRef(viewShotRef, { format: 'png', quality: 0.95 });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: seciliKombin.baslik });
      } else {
        Alert.alert(dil === 'en' ? 'Sharing not available' : 'Paylaşım desteklenmiyor');
      }
    } catch {
      Alert.alert(dil === 'en' ? 'Could not share' : 'Paylaşılamadı');
    } finally {
      setPaylasiyor(false);
    }
  };

  const tryOnBaslatParca = async (parcaAdi: string) => {
    if (!profil?.profilFoto) {
      Alert.alert(
        dil === 'en' ? 'Profile photo required' : 'Profil fotoğrafı gerekli',
        dil === 'en'
          ? 'Add a full-body photo in your profile to use virtual try-on.'
          : 'Sanal deneme için profil sayfasından bir boy fotoğrafı ekle.',
        [
          { text: dil === 'en' ? 'Go to Profile' : 'Profile Git', onPress: () => router.push('/profile' as any) },
          { text: 'İptal', style: 'cancel' },
        ],
      );
      return;
    }

    const aranan = parcaAdi.toLowerCase();
    const eslesme = kiyafetler.find(k => {
      const kAd = k.ad?.toLowerCase() ?? '';
      return kAd === aranan || aranan.includes(kAd) || kAd.includes(aranan);
    });

    if (!eslesme?.foto) {
      Alert.alert(
        dil === 'en' ? 'No photo' : 'Fotoğraf yok',
        dil === 'en'
          ? `"${parcaAdi}" has no photo. Add a photo in your wardrobe.`
          : `"${parcaAdi}" için gardıroptan fotoğraf ekle.`,
      );
      return;
    }

    const alt = ['pantolon', 'pant', 'şort', 'short', 'etek', 'skirt', 'tayt', 'jeans', 'kot'];
    const onepiece = ['elbise', 'dress', 'tulum', 'jumpsuit', 'overall'];
    let category: TryOnCategory = 'tops';
    if (onepiece.some(k => aranan.includes(k))) category = 'one-pieces';
    else if (alt.some(k => aranan.includes(k))) category = 'bottoms';

    setTryOn({ visible: true, adim: 'yukleniyor', sonucUri: null, hata: null });

    try {
      const jobId = await tryOnBaslat(profil.profilFoto!, eslesme.foto!, category);
      const sonuc = await tryOnBekle(jobId);
      setTryOn({ visible: true, adim: 'sonuc', sonucUri: sonuc, hata: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setTryOn({ visible: true, adim: 'sonuc', sonucUri: null, hata: msg });
    }
  };

  useEffect(() => { baslat(); }, []);

  const parcayi3DGoster = async (parcaAdi: string) => {
    if (!can3D()) {
      setUpsellGoster(true);
      return;
    }
    setYukleniyor3D(true);
    setHata3D(null);
    setYuklenen3D(parcaAdi);
    try {
      const glbUrl = await meshyModelUret(parcaAdi);
      await kullanim3DArtir();
      setViewer3D({ visible: true, glbUrl, baslik: parcaAdi });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Bilinmeyen hata';
      setHata3D(msg);
    } finally {
      setYukleniyor3D(false);
      setYuklenen3D(null);
    }
  };

  const havaAl = async (): Promise<HavaDurumu> => {
    let url: string;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        url = `${API_URL}/api/weather?lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&lang=tr`;
      } else {
        url = `${API_URL}/api/weather?city=Izmir,TR&lang=tr`;
      }
    } catch {
      url = `${API_URL}/api/weather?city=Izmir,TR&lang=tr`;
    }
    const res = await fetch(url);
    const data = await res.json();
    if (!data.main) throw new Error('Hava verisi alınamadı');
    setSehirAdi(data.name ?? 'İzmir');
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
      const isPro = await proMuKontrol();
      const hakVar = await kombinHakkiVar(isPro);
      const hak = await kalanHakAl(isPro);
      setKalanHak(hak.isPro ? null : hak.kalan);
      if (!hakVar) {
        setYukleniyor(false);
        router.push('/subscription' as any);
        return;
      }

      const [profilStr, kiyafetle] = await Promise.all([
        AsyncStorage.getItem('xmobile_profil'),
        kiyafetleriAl(),
      ]);
      if (profilStr) {
        const parsedProfil = JSON.parse(profilStr) as import('../lib/types').Profil;
        setProfil(parsedProfil);
        if (parsedProfil.avatarGlbPath) {
          loadAvatarGlb(parsedProfil.avatarGlbPath);
        }
      }
      let havaVeri: HavaDurumu;
      try {
        havaVeri = await havaAl();
      } catch {
        havaVeri = { derece: 20, durum: 'bilinmiyor', nem: 50, hissedilen: 20 };
        setSehirAdi('—');
      }
      await kombinOner(havaVeri, kiyafetle);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setHata(`Başlatma hatası: ${msg}`);
      setYukleniyor(false);
    }
  };

  const kombinOner = async (havaVeri: HavaDurumu, liste: Kiyafet[]): Promise<void> => {
    if (liste.length === 0) {
      setHata('__BOS_GARDIROB__');
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

    if (!API_URL) {
      setHata('EXPO_PUBLIC_API_URL tanımlı değil. .env dosyasını kontrol et ve Expo\'yu yeniden başlat.');
      setYukleniyor(false);
      return;
    }

    const controller = new AbortController();
    const zaman = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(`${API_URL}/api/claude`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
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
        await kombinKullan();
        const isPro2 = await proMuKontrol();
        const hak2 = await kalanHakAl(isPro2);
        setKalanHak(hak2.isPro ? null : hak2.kalan);
      } else {
        setHata(`Beklenmeyen API yanıtı: ${JSON.stringify(data).slice(0, 200)}`);
      }
    } catch (e) {
      clearTimeout(zaman);
      const msg = e instanceof Error ? e.message : 'Bilinmeyen hata';
      const hataMesaj = msg.includes('abort') || msg.includes('Abort')
        ? 'İstek zaman aşımına uğradı (60s). İnternet bağlantını kontrol et.'
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
          <Text style={[styles.yenile, { color: aksanRenk }]}>↺</Text>
        </TouchableOpacity>
      </View>

      {kalanHak !== null && (
        <TouchableOpacity
          style={styles.freemiumBant}
          onPress={() => router.push('/subscription' as any)}
        >
          <Text style={styles.freemiumBantText}>
            {kalanHak > 0
              ? (dil === 'en'
                  ? `✨ ${kalanHak} free outfit${kalanHak === 1 ? '' : 's'} left this month`
                  : `✨ Bu ay ${kalanHak} ücretsiz kombinlerin kaldı`)
              : (dil === 'en'
                  ? '🔒 Free limit reached — upgrade to PRO'
                  : '🔒 Ücretsiz limit doldu — PRO\'ya geç')}
          </Text>
          {kalanHak === 0 && (
            <Text style={styles.freemiumBantCta}>
              {dil === 'en' ? 'Upgrade →' : 'Yükselt →'}
            </Text>
          )}
        </TouchableOpacity>
      )}

      <View style={[styles.havaDurumu, { backgroundColor: renkler.kart }]}>
        {!hava ? <ActivityIndicator color={renkler.metin} /> : (
          <>
            <Text style={styles.havaIkon}>{havaIkon()}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.havaDerece, { color: renkler.metin }]}>{hava.derece}°C · {hava.durum}</Text>
              <Text style={[styles.havaNot, { color: renkler.metin2 }]}>
                {t.hissedilen} {hava.hissedilen}°C · {t.nem} %{hava.nem}
              </Text>
            </View>
            <Text style={[styles.havaSehir, { color: renkler.metin2 }]}>{sehirAdi}</Text>
          </>
        )}
      </View>

      {yukleniyor ? (
        <View style={styles.yukleniyor}>
          <ActivityIndicator color={renkler.metin} size="large" />
          <Text style={[styles.yukleniyorText, { color: renkler.metin2 }]}>{t.yukleniyorText}</Text>
        </View>
      ) : hata === '__BOS_GARDIROB__' ? (
        <View style={styles.hataKutu}>
          <Text style={styles.hataIcon}>👔</Text>
          <Text style={[styles.hataText, { color: renkler.metin2 }]}>
            {dil === 'en' ? 'Your wardrobe is empty.' : 'Gardırobunda henüz kıyafet yok.'}
          </Text>
          <TouchableOpacity style={[styles.tekrarBtn, { backgroundColor: renkler.btnPrimary }]} onPress={() => router.push('/wardrobe' as any)}>
            <Text style={[styles.tekrarBtnText, { color: renkler.btnPrimaryMetin }]}>
              {dil === 'en' ? '+ Add Clothes' : '+ Kıyafet Ekle'}
            </Text>
          </TouchableOpacity>
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
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.95 }}>
          <View
            style={[styles.avatarBolum, { backgroundColor: renkler.kart }]}
            {...panResponder.panHandlers}
          >
            {seciliKombin && (
              <Animated.View style={[styles.avatarSatir, { transform: [{ translateX: slideAnim }] }]}>
                <View style={styles.avatarOrtala}>
                  {avatarGlbUri ? (
                    <ThreeDInline
                      glbUrl={avatarGlbUri}
                      width={DISP_W}
                      height={DISP_H}
                      onTap={() => setViewer3D({ visible: true, glbUrl: avatarGlbUri!, baslik: 'Avatar' })}
                      overlayHtml={buildOverlayHtml(seciliKombin, kiyafetler)}
                    />
                  ) : (
                    <AvatarSVG kombin={seciliKombin} profil={profil} kiyafetler={kiyafetler} />
                  )}
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
                    <View style={[styles.skorBarBg, { backgroundColor: renkler.sinir }]}>
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
          </ViewShot>

          <View style={styles.seciciSatir}>
            {kombinler.map((k, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.seciciBtn, { backgroundColor: renkler.kart, borderColor: renkler.sinir },
                  seciliIndex === i && { backgroundColor: renkler.btnPrimary, borderColor: renkler.btnPrimary },
                ]}
                onPress={() => setSeciliIndex(i)}
              >
                <Text style={[styles.seciciBtnText, { color: renkler.metin2 },
                  seciliIndex === i && { color: renkler.btnPrimaryMetin },
                ]}>
                  {i + 1}. {k.tur}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {seciliKombin && (
            <View style={[styles.parcalarBolum, { backgroundColor: renkler.kart }]}>
              <Text style={[styles.parcalarBaslik, { color: renkler.metin2 }]}>{t.buKombin}</Text>
              <View style={styles.parcalar}>
                {seciliKombin.parcalar.map((p, i) => {
                  const aranan = p.toLowerCase();
                  const eslesme = kiyafetler.find(k => {
                    const kAd = k.ad?.toLowerCase() ?? '';
                    return kAd === aranan || aranan.includes(kAd) || kAd.includes(aranan);
                  });
                  const foto = eslesme?.foto ?? null;
                  const yukleniyor = yukleniyor3D && yuklenen3D === p;
                  return (
                    <View key={i} style={[styles.parcaChip, { backgroundColor: renkler.chip }]}>
                      {foto
                        ? <Image source={{ uri: foto }} style={styles.parcaChipFoto} />
                        : <View style={[styles.parcaChipFotoYok, { backgroundColor: renkler.sinir }]} />
                      }
                      <Text style={[styles.parcaText, { color: renkler.metin }]}>{p}</Text>
                      <TouchableOpacity
                        style={[styles.ucBoyutBtn, yukleniyor && styles.ucBoyutBtnYukleniyor]}
                        onPress={() => parcayi3DGoster(p)}
                        disabled={yukleniyor}
                      >
                        <Text style={styles.ucBoyutBtnText}>{yukleniyor ? '⟳' : '3D'}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
              {hata3D && (
                <Text style={[styles.hata3DText, { color: '#E74C3C' }]}>3D: {hata3D}</Text>
              )}
              <View style={styles.altButonSatir}>
              <TouchableOpacity
                style={[styles.paylasButon, { borderColor: renkler.sinir }]}
                onPress={paylas}
                disabled={paylasiyor}
              >
                <Text style={[styles.paylasButonText, { color: renkler.metin }]}>
                  {paylasiyor ? '...' : (dil === 'en' ? '↑ Share' : '↑ Paylaş')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paylasButon, { borderColor: '#00D4FF', borderWidth: 1.5 }]}
                onPress={() => setTryOn({ visible: true, adim: 'sec', sonucUri: null, hata: null })}
              >
                <Text style={[styles.paylasButonText, { color: '#00D4FF' }]}>
                  {dil === 'en' ? '👗 Try On' : '👗 Dene'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secButon, { backgroundColor: renkler.btnPrimary, flex: 1 }]}
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
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── VIRTUAL TRY-ON MODAL ── */}
      <Modal
        visible={tryOn.visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTryOn(s => ({ ...s, visible: false }))}
      >
        <View style={[styles.tryOnModal, { backgroundColor: renkler.bg }]}>
          <View style={styles.tryOnHeader}>
            <Text style={[styles.tryOnBaslik, { color: renkler.metin }]}>
              {dil === 'en' ? '👗 Virtual Try-On' : '👗 Sanal Deneme'}
            </Text>
            <TouchableOpacity onPress={() => setTryOn(s => ({ ...s, visible: false }))}>
              <Text style={[styles.tryOnKapat, { color: renkler.metin2 }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {tryOn.adim === 'sec' && seciliKombin && (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tryOnIcPadding}>
              <Text style={[styles.tryOnAciklama, { color: renkler.metin2 }]}>
                {dil === 'en'
                  ? 'Pick a garment to try on. Uses your profile photo.'
                  : 'Hangi parçayı denemek istiyorsun? Profil fotoğrafın kullanılır.'}
              </Text>
              {seciliKombin.parcalar.map((p, i) => {
                const aranan = p.toLowerCase();
                const eslesme = kiyafetler.find(k => {
                  const kAd = k.ad?.toLowerCase() ?? '';
                  return kAd === aranan || aranan.includes(kAd) || kAd.includes(aranan);
                });
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.tryOnParcaBtn, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}
                    onPress={() => tryOnBaslatParca(p)}
                  >
                    {eslesme?.foto
                      ? <Image source={{ uri: eslesme.foto }} style={styles.tryOnParcaFoto} />
                      : <View style={[styles.tryOnParcaFotoYok, { backgroundColor: renkler.chip }]} />
                    }
                    <Text style={[styles.tryOnParcaAd, { color: renkler.metin }]}>{p}</Text>
                    <Text style={[styles.tryOnParcaOk, { color: '#00D4FF' }]}>→</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {tryOn.adim === 'yukleniyor' && (
            <View style={styles.tryOnYukleniyor}>
              <ActivityIndicator size="large" color="#00D4FF" />
              <Text style={[styles.tryOnYukleniyorText, { color: renkler.metin2 }]}>
                {dil === 'en' ? 'AI is dressing you up...' : 'AI kıyafeti sana giydiriyor...'}
              </Text>
              <Text style={[styles.tryOnYukleniyorAlt, { color: renkler.metin2 }]}>
                {dil === 'en' ? '~10 seconds' : '~10 saniye'}
              </Text>
            </View>
          )}

          {tryOn.adim === 'sonuc' && (
            <View style={{ flex: 1 }}>
              {tryOn.hata ? (
                <View style={styles.tryOnHata}>
                  <Text style={styles.tryOnHataIkon}>⚠️</Text>
                  <Text style={[styles.tryOnHataText, { color: renkler.metin2 }]}>{tryOn.hata}</Text>
                  <TouchableOpacity
                    style={[styles.tryOnTekrar, { backgroundColor: renkler.btnPrimary }]}
                    onPress={() => setTryOn(s => ({ ...s, adim: 'sec', hata: null }))}
                  >
                    <Text style={{ color: renkler.btnPrimaryMetin, fontWeight: '600' }}>
                      {dil === 'en' ? 'Try Again' : 'Tekrar Dene'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <Image
                    source={{ uri: tryOn.sonucUri! }}
                    style={styles.tryOnSonucGorsel}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={[styles.tryOnTekrarBtn, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}
                    onPress={() => setTryOn(s => ({ ...s, adim: 'sec', sonucUri: null }))}
                  >
                    <Text style={{ color: renkler.metin, fontWeight: '600' }}>
                      {dil === 'en' ? '← Try another' : '← Başka parça dene'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>

      <ThreeDViewer
        visible={viewer3D.visible}
        glbUrl={viewer3D.glbUrl}
        baslik={viewer3D.baslik}
        onKapat={() => setViewer3D(v => ({ ...v, visible: false }))}
      />
      <UpsellModal
        visible={upsellGoster}
        onKapat={() => setUpsellGoster(false)}
        aylikKullanim={aylikKullanim}
        limit={tier === 'basic' ? 10 : undefined}
        dil={dil}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16,
  },
  geri:           { fontSize: 20, fontWeight: '300' },
  baslik:         { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },
  yenile:         { fontSize: 24, fontWeight: '300' },
  havaDurumu: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12, borderRadius: 18, padding: 16,
    gap: 12, minHeight: 68,
  },
  havaIkon:       { fontSize: 30 },
  havaDerece:     { fontSize: 15, fontWeight: '600' },
  havaNot:        { fontSize: 12, marginTop: 2 },
  havaSehir:      { fontSize: 13 },
  yukleniyor:     { alignItems: 'center', paddingVertical: 80, gap: 16 },
  yukleniyorText: { fontSize: 14 },
  hataKutu:       { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 12 },
  hataIcon:       { fontSize: 40 },
  hataText:       { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  tekrarBtn:      { marginTop: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 50 },
  tekrarBtnText:  { fontSize: 15, fontWeight: '600' },
  avatarBolum: {
    marginHorizontal: 16, borderRadius: 24, padding: 16,
  },
  avatarSatir:    { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarOrtala:   { width: DISP_W, height: DISP_H, alignItems: 'center' },
  avatarBilgi:    { flex: 1 },
  avatarBaslik:   { fontSize: 17, fontWeight: '700', marginBottom: 8, letterSpacing: 0.2 },
  badge:          { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 10 },
  badgeText:      { fontSize: 11, fontWeight: '600' },
  avatarNeden:    { fontSize: 12, lineHeight: 19 },
  noktaSatir:     { flexDirection: 'row', gap: 6, marginTop: 14, justifyContent: 'flex-start' },
  nokta:          { width: 6, height: 6, borderRadius: 3 },
  skorKutu:       { marginTop: 16, gap: 8 },
  skorUstSatir:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  skorLabel:      { fontSize: 11 },
  skorSayi:       { fontSize: 14, fontWeight: '700' },
  skorEtiketText: { fontSize: 11, fontWeight: '400' },
  skorBarBg:      { height: 3, borderRadius: 2 },
  skorBarDolu:    { height: 3, borderRadius: 2 },
  seciciSatir:    { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  seciciBtn:      { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 50, alignItems: 'center', borderWidth: 1 },
  seciciBtnText:  { fontSize: 12, fontWeight: '500' },
  parcalarBolum: {
    marginHorizontal: 16, marginTop: 12,
    borderRadius: 24, padding: 20,
  },
  parcalarBaslik: { fontSize: 12, marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' } as any,
  parcalar:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  parcaChip:       { flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingRight: 14, paddingVertical: 5, paddingLeft: 5, gap: 8 },
  parcaChipFoto:   { width: 38, height: 48, borderRadius: 18, resizeMode: 'cover' },
  parcaChipFotoYok:{ width: 38, height: 48, borderRadius: 18 },
  parcaText:       { fontSize: 13 },
  altButonSatir:  { flexDirection: 'row', gap: 10, marginTop: 12 },
  paylasButon:    { borderRadius: 50, padding: 16, alignItems: 'center', borderWidth: 1, paddingHorizontal: 22 },
  paylasButonText:{ fontSize: 15, fontWeight: '600' },
  secButon:       { borderRadius: 50, padding: 16, alignItems: 'center' },
  secButonText:   { fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },
  ucBoyutBtn: {
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.4)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 4,
  },
  ucBoyutBtnYukleniyor: { opacity: 0.5 },
  ucBoyutBtnText: { color: '#00D4FF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  hata3DText:     { fontSize: 11, marginTop: 8, textAlign: 'center', marginBottom: 8 },
  tryOnModal:         { flex: 1 },
  tryOnHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 24 },
  tryOnBaslik:        { fontSize: 18, fontWeight: '700' },
  tryOnKapat:         { fontSize: 22, padding: 4 },
  tryOnIcPadding:     { padding: 20, gap: 12 },
  tryOnAciklama:      { fontSize: 13, marginBottom: 8, lineHeight: 19 },
  tryOnParcaBtn:      { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 12, borderWidth: 1, gap: 12 },
  tryOnParcaFoto:     { width: 52, height: 64, borderRadius: 10, resizeMode: 'cover' },
  tryOnParcaFotoYok:  { width: 52, height: 64, borderRadius: 10 },
  tryOnParcaAd:       { flex: 1, fontSize: 15, fontWeight: '500' },
  tryOnParcaOk:       { fontSize: 18, fontWeight: '700' },
  tryOnYukleniyor:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  tryOnYukleniyorText:{ fontSize: 16, fontWeight: '500', textAlign: 'center' },
  tryOnYukleniyorAlt: { fontSize: 13, textAlign: 'center' },
  tryOnHata:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  tryOnHataIkon:      { fontSize: 40 },
  tryOnHataText:      { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  tryOnTekrar:        { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 50, marginTop: 8 },
  tryOnSonucGorsel:   { flex: 1, width: '100%' },
  tryOnTekrarBtn:     { margin: 16, padding: 14, borderRadius: 50, alignItems: 'center', borderWidth: 1 },
  freemiumBant: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 8, marginBottom: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, backgroundColor: 'rgba(0,212,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)',
  },
  freemiumBantText: { fontSize: 12, color: '#00D4FF', flex: 1 },
  freemiumBantCta:  { fontSize: 12, color: '#00D4FF', fontWeight: '700', marginLeft: 8 },
});
