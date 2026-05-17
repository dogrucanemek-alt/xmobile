import React, { useEffect, useState, useRef } from 'react';
import {
  Text, View, StyleSheet, StatusBar, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Image,
  PanResponder, Animated, Modal, Platform, Linking, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Svg, {
  Circle, Rect, Path, Ellipse,
  ClipPath, Defs, Image as SvgImage,
  RadialGradient, LinearGradient, Stop,
} from 'react-native-svg';
import { useApp } from '../../lib/context';
import type { Kiyafet, Kombin, HavaDurumu, Profil } from '../../lib/types';
import { GECMIS_KEY } from '../history';
import ThreeDViewer from '../../components/ThreeDViewer';
import ThreeDInline from '../../components/ThreeDInline';
import UpsellModal from '../../components/UpsellModal';
import { useSubscription } from '../../lib/subscriptionContext';
import { meshyModelUret } from '../../lib/meshyService';
import { renkBul, parcaEsle, kiyafetRenkBul, hexToRgba, renkUyumSkoru } from '../../lib/outfitColor';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { kombinHakkiVar, kombinKullan, kalanHakAl } from '../../lib/freemium';
import { tryOnBaslat, tryOnBekle, kiyafetGorseliUret, type TryOnCategory } from '../../lib/fashnService';
import { getCached as tryOnCacheGet, setCached as tryOnCacheSet } from '../../lib/tryOnCache';
import { postOlustur } from '../../lib/socialService';
import { useAuth } from '../../lib/authContext';
import { kullanimAl, kalanHak as kalanHakHesapla, kalanRenk, type UsageSnapshot } from '../../lib/usageService';
import { urldenUrunCek, type ScrapedProduct } from '../../lib/urlScrapeService';
import { takipEt, Olaylar } from '../../lib/analytics';
import HavaAnimasyon, { durumModu } from '../../components/HavaAnimasyon';
import MidnightSky from '../../components/MidnightSky';
import * as ImagePicker from 'expo-image-picker';
import ShareKarti from '../../components/ShareKarti';
import StoryKarti from '../../components/StoryKarti';
import { streakGuncelle, streakOku, type StreakData } from '../../lib/streak';
import { stilPuaniHesapla, type StyleScore } from '../../lib/styleScore';
import { handleError, logError } from '../../lib/errorHandler';

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
  const { t, renkler, aksanRenk, dil, dilDegistir, karanlik, temaToggle, avatarGlbUri, loadAvatarGlb } = useApp();
  const { can3D, kullanim3DArtir, tier, aylikKullanim, isPro, proYenile } = useSubscription();
  const { user } = useAuth();
  const router = useRouter();
  const { tryOnKiyafetId } = useLocalSearchParams<{ tryOnKiyafetId?: string }>();
  const [hava, setHava]               = useState<HavaDurumu | null>(null);
  const [kombinler, setKombinler]     = useState<Kombin[]>([]);
  const [yukleniyor, setYukleniyor]   = useState(true);
  const [hata, setHata]               = useState('');
  const [seciliIndex, setSeciliIndex] = useState(0);
  const [profil, setProfil]           = useState<Profil | null>(null);
  const [kiyafetler, setKiyafetler]   = useState<Kiyafet[]>([]);
  const [sehirAdi, setSehirAdi]       = useState('...');
  const [kullanim, setKullanim]       = useState<UsageSnapshot | null>(null);
  const [urlModalAcik, setUrlModalAcik] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlOnizleme, setUrlOnizleme] = useState<ScrapedProduct | null>(null);
  const [urlYukleniyor, setUrlYukleniyor] = useState(false);
  const [urlHata, setUrlHata] = useState<string | null>(null);

  const [viewer3D, setViewer3D]         = useState<{ visible: boolean; glbUrl: string; baslik: string }>({
    visible: false, glbUrl: '', baslik: '',
  });
  const [upsellGoster, setUpsellGoster] = useState(false);
  const [yuklenen3D, setYuklenen3D]     = useState<string | null>(null);
  const [yukleniyor3D, setYukleniyor3D] = useState(false);
  const [hata3D, setHata3D]             = useState<string | null>(null);
  const [paylasiyor, setPaylasiyor]         = useState(false);
  const [feedPaylasiyor, setFeedPaylasiyor] = useState(false);
  const [kalanHak, setKalanHak]         = useState<number | null>(null);
  const [gorselMod, setGorselMod] = useState<'foto' | '3d'>('foto');
  const [tryOn, setTryOn] = useState<{
    visible: boolean;
    adim: 'sec' | 'yukleniyor' | 'sonuc';
    sonucUri: string | null;
    hata: string | null;
    modelFoto: string | null;
    secilenParcalar: string[];
    adimMetni: string;
  }>({ visible: false, adim: 'sec', sonucUri: null, hata: null, modelFoto: null, secilenParcalar: [], adimMetni: '' });
  const [tryOnImgLoading, setTryOnImgLoading] = useState(false);
  const [swapModal, setSwapModal]   = useState<{ parcaIndex: number } | null>(null);
  const [customAcik, setCustomAcik] = useState(false);
  const [streak, setStreak]         = useState<StreakData>({ current: 0, best: 0, lastActive: '' });
  const [stilSkor, setStilSkor]     = useState<StyleScore | null>(null);
  const [customSecili, setCustomSecili] = useState<number[]>([]);
  const viewShotRef = useRef<ViewShot>(null);
  const shareKartiRef = useRef<View>(null);
  const storyKartiRef = useRef<View>(null);
  const [shareMenuAcik, setShareMenuAcik] = useState(false);
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

  const paylas = () => {
    if (!seciliKombin) return;
    setShareMenuAcik(true);
  };

  const paylasResim = async (ref: React.RefObject<any>) => {
    if (!seciliKombin) return;
    try {
      setPaylasiyor(true);
      const uri = await captureRef(ref, { format: 'png', quality: 0.95 });
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
      setShareMenuAcik(false);
    }
  };

  const paylasMetin = async () => {
    if (!seciliKombin) return;
    const metin = dil === 'tr'
      ? `👗 ${seciliKombin.baslik}\n\n${seciliKombin.parcalar.join(', ')}\n\n${seciliKombin.neden ?? ''}\n\nxmobile ile hazırlandı`
      : `👗 ${seciliKombin.baslik}\n\n${seciliKombin.parcalar.join(', ')}\n\n${seciliKombin.neden ?? ''}\n\nStyled with xmobile`;
    setShareMenuAcik(false);
    const { Share } = require('react-native');
    await Share.share({ message: metin });
  };

  const feedePaylash = async () => {
    if (!user) {
      Alert.alert(
        dil === 'en' ? 'Sign in required' : 'Giriş gerekli',
        dil === 'en' ? 'Sign in to share to the community.' : 'Topluluğa paylaşmak için giriş yap.',
        [
          { text: dil === 'en' ? 'Cancel' : 'İptal', style: 'cancel' },
          { text: dil === 'en' ? 'Sign In' : 'Giriş Yap', onPress: () => router.push('/login' as any) },
        ],
      );
      return;
    }
    if (!seciliKombin) return;
    setFeedPaylasiyor(true);
    try {
      const localUri = await captureRef(viewShotRef, { format: 'png', quality: 0.9 });
      await postOlustur({
        userId:     user.id,
        email:      user.email ?? '',
        baslik:     seciliKombin.baslik,
        tur:        seciliKombin.tur,
        parcalar:   seciliKombin.parcalar,
        neden:      seciliKombin.neden ?? '',
        gorselUri:  localUri,
        havaDerece: hava?.derece,
        havaDurum:  hava?.durum,
      });
      takipEt(Olaylar.SOSYAL_PAYLASILDI, { kombin_turu: seciliKombin.tur });
      Alert.alert(
        dil === 'en' ? '🎉 Shared!' : '🎉 Paylaşıldı!',
        dil === 'en' ? 'Your outfit is now visible in Discover.' : 'Kombinin Keşfet\'te görünüyor.',
      );
    } catch (e) {
      Alert.alert(dil === 'en' ? 'Error' : 'Hata', e instanceof Error ? e.message : String(e));
    } finally {
      setFeedPaylasiyor(false);
    }
  };

  const tryOnModelFotoSec = async () => {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) {
      Alert.alert(
        dil === 'en' ? 'Permission required' : 'İzin gerekli',
        dil === 'en' ? 'Allow photo access to pick a photo.' : 'Fotoğraf seçmek için izin ver.',
      );
      return;
    }
    const sonuc = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.85,
    });
    if (!sonuc.canceled) {
      setTryOn(s => ({ ...s, modelFoto: sonuc.assets[0].uri }));
    }
  };

  const kategoriSec = (parcaAdi: string): TryOnCategory => {
    const a = parcaAdi.toLowerCase();
    const alt      = ['pantolon', 'pant', 'şort', 'short', 'etek', 'skirt', 'tayt', 'jeans', 'kot'];
    const onepiece = ['elbise', 'dress', 'tulum', 'jumpsuit', 'overall'];
    if (onepiece.some(k => a.includes(k))) return 'one-pieces';
    if (alt.some(k => a.includes(k)))      return 'bottoms';
    return 'tops';
  };

  const parcaEslesmeAra = (parcaAdi: string) => {
    const aranan = parcaAdi.toLowerCase();
    return kiyafetler.find(k => {
      const kAd = k.ad?.toLowerCase() ?? '';
      return kAd === aranan || aranan.includes(kAd) || kAd.includes(aranan);
    });
  };

  const parcaDegistir = (parcaIndex: number, yeniParca: string) => {
    setKombinler(prev => prev.map((k, ki) => {
      if (ki !== seciliIndex) return k;
      const yeni = [...k.parcalar];
      yeni[parcaIndex] = yeniParca;
      return { ...k, parcalar: yeni };
    }));
    setSwapModal(null);
  };

  const tryOnZincir = async (parcalar: string[], modelUri: string | null) => {
    if (!modelUri) {
      Alert.alert(
        dil === 'en' ? 'Full-body photo required' : 'Tam boy fotoğraf gerekli',
        dil === 'en'
          ? 'Tap your photo above to add a full-body photo of yourself.'
          : 'Yukarıdaki fotoğraf alanına tam boy bir fotoğrafını ekle.',
      );
      return;
    }

    takipEt(Olaylar.TRYON_BASLADI, { parca_sayisi: parcalar.length });

    // Tops önce, bottoms/one-pieces sonra
    const sirali = [...parcalar].sort((a, b) => {
      const ka = kategoriSec(a), kb = kategoriSec(b);
      if (ka === 'tops' && kb !== 'tops') return -1;
      if (kb === 'tops' && ka !== 'tops') return 1;
      return 0;
    });

    // Zincirleme modda fotoğrafsız parçaları atla; tek parçada DALL-E devreye girer
    const tekParca = sirali.length === 1;
    const islenecek = tekParca
      ? sirali
      : sirali.filter(p => !!parcaEslesmeAra(p)?.foto);

    if (islenecek.length === 0) {
      Alert.alert(
        dil === 'en' ? 'No photos' : 'Fotoğraf yok',
        dil === 'en'
          ? 'Selected items have no photos. Add photos in your wardrobe.'
          : 'Seçili parçaların fotoğrafı yok. Gardıroptan fotoğraf ekle.',
      );
      return;
    }

    setTryOn(s => ({ ...s, adim: 'yukleniyor', sonucUri: null, hata: null, adimMetni: '' }));

    try {
      let aktifModel = modelUri;

      for (let i = 0; i < islenecek.length; i++) {
        const parca = islenecek[i];
        const eslesen = parcaEslesmeAra(parca);
        const kategori = kategoriSec(parca);

        setTryOn(s => ({
          ...s,
          adimMetni: islenecek.length > 1
            ? `${i + 1}/${islenecek.length}: ${parca}`
            : parca,
        }));

        let garmentUri = eslesen?.foto ?? null;
        if (!garmentUri) {
          setTryOn(s => ({ ...s, adimMetni: `🪄 AI görsel üretiyor: ${parca}` }));
          garmentUri = await kiyafetGorseliUret(parca, user?.id);
        }

        // Cache hit ise Fashn'a hiç gitme — anında kullan
        const cachedPath = await tryOnCacheGet(aktifModel, garmentUri);
        if (cachedPath) {
          setTryOn(s => ({ ...s, adimMetni: dil === 'en' ? '⚡ from cache' : '⚡ önbellekten' }));
          aktifModel = cachedPath;
          continue;
        }

        const jobId = await tryOnBaslat(aktifModel, garmentUri, kategori, user?.id);
        const baslangic = Date.now();
        const sonucPath = await tryOnBekle(jobId, () => {
          const gecenSn = Math.round((Date.now() - baslangic) / 1000);
          setTryOn(s => ({ ...s, adimMetni: `⏳ ${gecenSn}s` }));
        });
        aktifModel = await tryOnCacheSet(aktifModel, garmentUri, sonucPath);
      }

      setTryOn(s => ({ ...s, adim: 'sonuc', sonucUri: aktifModel, hata: null }));
      takipEt(Olaylar.TRYON_TAMAMLANDI, { parca_sayisi: parcalar.length });
      kullanimYenile();
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      if (raw === 'USER_LIMIT_EXCEEDED') {
        setTryOn(s => ({ ...s, visible: false, adim: 'sec', secilenParcalar: [] }));
        setUpsellGoster(true);
        return;
      }
      const msg = raw === 'OUT_OF_CREDITS'
        ? (dil === 'en'
            ? 'Virtual try-on credits ran out. Please try again next month.'
            : 'Sanal deneme kredisi tükendi. Gelecek ay tekrar dene.')
        : raw;
      setTryOn(s => ({ ...s, adim: 'sonuc', sonucUri: null, hata: msg }));
    }
  };

  const parcaToggle = (parca: string) => {
    setTryOn(s => {
      const var_ = s.secilenParcalar.includes(parca);
      return {
        ...s,
        secilenParcalar: var_
          ? s.secilenParcalar.filter(p => p !== parca)
          : [...s.secilenParcalar, parca],
      };
    });
  };

  useEffect(() => {
    baslat();
    streakOku().then(setStreak);
  }, []);

  // Wardrobe'dan "Dene" butonuyla gelinince try-on otomatik aç
  useEffect(() => {
    if (!tryOnKiyafetId || kiyafetler.length === 0) return;
    const hedef = kiyafetler.find(k => String(k.id) === String(tryOnKiyafetId));
    if (!hedef) return;
    setTryOn({
      visible: true,
      adim: 'sec',
      sonucUri: null,
      hata: null,
      modelFoto: profil?.profilFoto ?? null,
      secilenParcalar: [hedef.ad],
      adimMetni: '',
    });
  }, [tryOnKiyafetId, kiyafetler.length]);

  // URL'den ürün çek
  const urlOnizle = async () => {
    if (!urlInput.trim()) return;
    setUrlYukleniyor(true);
    setUrlHata(null);
    setUrlOnizleme(null);
    try {
      const urun = await urldenUrunCek(urlInput.trim());
      setUrlOnizleme(urun);
    } catch (e) {
      setUrlHata(e instanceof Error ? e.message : 'URL okunamadı');
    } finally {
      setUrlYukleniyor(false);
    }
  };

  // URL'den çıkan ürünü direkt try-on'a gönder
  const urldenDene = () => {
    if (!urlOnizleme) return;
    if (!profil?.profilFoto) {
      Alert.alert(
        dil === 'en' ? 'Profile photo needed' : 'Profil fotoğrafı gerekli',
        dil === 'en' ? 'Add a full-body photo to your profile first.' : 'Önce profiline tam boy fotoğraf ekle.',
      );
      return;
    }
    // Modal'ı kapat, try-on chain'ini scraped image URL ile başlat
    const garmentUrl = urlOnizleme.image;
    setUrlModalAcik(false);
    setUrlOnizleme(null);
    setUrlInput('');
    setTryOn({
      visible: true,
      adim: 'yukleniyor',
      sonucUri: null,
      hata: null,
      modelFoto: profil.profilFoto,
      secilenParcalar: [urlOnizleme.title ?? 'URL Ürünü'],
      adimMetni: dil === 'en' ? 'Starting try-on...' : 'Sanal deneme başlıyor...',
    });
    // Doğrudan tryOnBaslat çağrısı (zinciri bypass — tek parça, scraped URL)
    (async () => {
      try {
        const baslangic = Date.now();
        const jobId = await tryOnBaslat(profil.profilFoto!, garmentUrl, 'auto', user?.id);
        const sonucPath = await tryOnBekle(jobId, () => {
          const gecenSn = Math.round((Date.now() - baslangic) / 1000);
          setTryOn(s => ({ ...s, adimMetni: `⏳ ${gecenSn}s` }));
        });
        setTryOn(s => ({ ...s, adim: 'sonuc', sonucUri: sonucPath, hata: null }));
        kullanimYenile();
      } catch (e) {
        const raw = e instanceof Error ? e.message : String(e);
        if (raw === 'USER_LIMIT_EXCEEDED') {
          setTryOn(s => ({ ...s, visible: false }));
          setUpsellGoster(true);
          return;
        }
        setTryOn(s => ({ ...s, adim: 'sonuc', sonucUri: null, hata: raw }));
      }
    })();
  };

  // Kullanım sayaçlarını yenile
  const kullanimYenile = React.useCallback(() => {
    if (!user?.id) return;
    kullanimAl(user.id).then(s => { if (s) setKullanim(s); });
  }, [user?.id]);

  useEffect(() => { kullanimYenile(); }, [kullanimYenile]);

  // Tab'a focus geldiğinde profili yenile (profilden döndüğünde fotoğraf güncel olsun)
  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem('xmobile_profil').then(str => {
        if (!str) return;
        try {
          const yeni = JSON.parse(str) as import('../../lib/types').Profil;
          setProfil(prev => {
            if (prev?.profilFoto === yeni.profilFoto && prev?.avatarGlbPath === yeni.avatarGlbPath) return prev;
            return yeni;
          });
        } catch {}
      });
    }, [])
  );

  // Wardrobe akışı: modal kapanınca otomatik geri dön
  const wardrobeAkisi = !!tryOnKiyafetId;
  const tryOnKapat = () => {
    setTryOn(s => ({ ...s, visible: false, secilenParcalar: [] }));
    if (wardrobeAkisi) {
      setTimeout(() => {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/wardrobe' as any);
      }, 50);
    }
  };

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
    let liste: Kiyafet[] = [];
    try { liste = kayitli ? JSON.parse(kayitli) : []; } catch {}
    setKiyafetler(liste);
    return liste;
  };

  const baslat = async () => {
    setYukleniyor(true);
    setHata('');
    try {
      await proYenile();
      const hak = await kalanHakAl(isPro);
      setKalanHak(hak.isPro ? null : hak.kalan);

      // TEMP: Limit check disabled for testing
      // if (!hak.isPro && hak.kalan === 0) {
      //   setYukleniyor(false);
      //   Alert.alert(...);
      //   return;
      // }

      const [profilStr, kiyafetle] = await Promise.all([
        AsyncStorage.getItem('xmobile_profil'),
        kiyafetleriAl(),
      ]);
      if (profilStr) {
        try {
          const parsedProfil = JSON.parse(profilStr) as import('../../lib/types').Profil;
          setProfil(parsedProfil);
          if (parsedProfil.avatarGlbPath) {
            loadAvatarGlb(parsedProfil.avatarGlbPath);
          }
        } catch {}
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

    // PARTITION: Shuffle wardrobe and split into 3 groups to prevent repetition
    const shuffled = [...liste].sort(() => Math.random() - 0.5);
    const itemsPerGroup = Math.ceil(shuffled.length / 3);
    const grup1 = shuffled.slice(0, itemsPerGroup);
    const grup2 = shuffled.slice(itemsPerGroup, itemsPerGroup * 2);
    const grup3 = shuffled.slice(itemsPerGroup * 2);

    // Create 3 separate prompts, each with a different group
    const numaraliListe1 = grup1.map((k, i) => `${i + 1}. "${k.ad}" (${k.tur}, ${k.sezon})`).join('\n');
    const numaraliListe2 = grup2.map((k, i) => `${i + 1}. "${k.ad}" (${k.tur}, ${k.sezon})`).join('\n');
    const numaraliListe3 = grup3.map((k, i) => `${i + 1}. "${k.ad}" (${k.tur}, ${k.sezon})`).join('\n');

    const jsonFormat = `{"baslik":"${dil === 'en' ? 'title' : 'başlık'}","tur":"${dil === 'en' ? 'Work' : 'İş'}","parcalar":[1,2],"neden":"${dil === 'en' ? '1 sentence' : '1 cümle'}"}`;

    const iltifat = dil === 'en'
      ? 'End with a short compliment like "You\'ll look great! ✨" or "Very stylish! 🔥"'
      : '"neden" alanını kısa bir iltifatla bitir: "Çok yakışıklı olacaksın! ✨" veya "Harika görüneceksin! 🔥" gibi';

    // Create 3 separate prompts for 3 separate API calls
    const createPrompt = (grupNo: number, numaraliList: string, turStr: string) => `Style assistant. Respond in ${lang}.

Weather: ${havaVeri.derece}°C, ${havaVeri.durum}, feels like ${havaVeri.hissedilen}°C

WARDROBE (use items from this list ONLY):
${numaraliList}

Create 1 outfit. Style: ${turStr}.
"tur": ${turStr}
"parcalar": use 2-4 items from the list above
"neden": 1 sentence. ${iltifat}

Return ONLY valid JSON:
${jsonFormat}`;

    const prompt1 = createPrompt(1, numaraliListe1, dil === 'en' ? 'Work' : 'İş');
    const prompt2 = createPrompt(2, numaraliListe2, dil === 'en' ? 'Casual' : 'Günlük');
    const prompt3 = createPrompt(3, numaraliListe3, dil === 'en' ? 'Social' : 'Sosyal');

    if (!API_URL) {
      setHata('EXPO_PUBLIC_API_URL tanımlı değil. .env dosyasını kontrol et ve Expo\'yu yeniden başlat.');
      setYukleniyor(false);
      return;
    }

    // Make 3 separate API calls for 3 outfits
    const callApi = async (prompt: string) => {
      const controller = new AbortController();
      const zaman = setTimeout(() => controller.abort(), 60000);

      try {
        const res = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 300,
            system: 'You are a fashion style assistant. Respond with ONLY valid JSON.',
            messages: [{ role: 'user', content: prompt }],
            user_id: user?.id,
          }),
        });
        clearTimeout(zaman);
        return res;
      } catch (e) {
        clearTimeout(zaman);
        throw e;
      }
    };

    try {
      // Parse single response
      const parseResponse = async (res: Response): Promise<any> => {
        if (res.status === 429) {
          let body: any = null;
          try { body = await res.json(); } catch {}
          if (body?.error === 'monthly_limit_exceeded') throw new Error('USER_LIMIT_EXCEEDED');
        }
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`API ${res.status}: ${errText.slice(0, 100)}`);
        }
        const data = await res.json();
        if (data.error) throw new Error(`Claude: ${data.error.message}`);
        if (!data.content?.[0]?.text) throw new Error('No response text');
        const metin = data.content[0].text;
        const bas = metin.indexOf('{');
        const son = metin.lastIndexOf('}') + 1;
        if (bas === -1 || son === 0) throw new Error('JSON not found');
        return JSON.parse(metin.slice(bas, son));
      };

      // Resolve item names from the correct group
      const resolveItems = (kombin: any, grup: Kiyafet[]) => ({
        ...kombin,
        parcalar: kombin.parcalar.map((p: any) => {
          const idx = Number(p);
          if (!isNaN(idx) && idx >= 1 && idx <= grup.length) return grup[idx - 1].ad;
          return String(p);
        }),
      });

      // Make 3 API calls in parallel with allSettled — partial failure is OK
      const results = await Promise.allSettled([
        callApi(prompt1).then(parseResponse),
        callApi(prompt2).then(parseResponse),
        callApi(prompt3).then(parseResponse),
      ]);

      const turler = dil === 'en' ? ['Work', 'Casual', 'Social'] : ['İş', 'Günlük', 'Sosyal'];
      const gruplar = [grup1, grup2, grup3];
      const resolved: Kombin[] = [];

      for (let i = 0; i < 3; i++) {
        const result = results[i];
        let kombin: Kombin | null = null;

        if (result.status === 'fulfilled') {
          try {
            kombin = resolveItems(result.value, gruplar[i]);
          } catch (parseErr) {
            const error = handleError(parseErr);
            logError(error, `outfits.kombin${i + 1}.parse`);
          }
        } else {
          const error = handleError(result.reason);
          logError(error, `outfits.kombin${i + 1}.api`);
        }

        // Fallback: eğer API başarısız olursa, random seçilmiş kıyafetlerle kombin oluştur
        if (!kombin && gruplar[i].length > 0) {
          const shuffled = [...gruplar[i]].sort(() => Math.random() - 0.5);
          const sayı = Math.min(2 + Math.floor(Math.random() * 2), shuffled.length);
          kombin = {
            baslik: dil === 'en' ? 'Generated Outfit' : 'Oluşturulmuş Kombin',
            tur: turler[i],
            parcalar: shuffled.slice(0, sayı).map((k) => k.ad),
            neden: dil === 'en' ? 'Auto-generated outfit' : 'Otomatik oluşturulmuş kombin',
          };
        }

        if (kombin) resolved.push(kombin);
      }

      // En azından 1 kombin olması gerekli
      if (resolved.length === 0) {
        throw new Error(dil === 'en' ? 'Could not create any outfits' : 'Kombin oluşturulamadı');
      }

      setKombinler(resolved);
      streakGuncelle().then(setStreak);
      takipEt(Olaylar.KOMBIN_OLUSTURULDU, { kombin_sayisi: resolved.length });
      await kombinKullan();
      const hak2 = await kalanHakAl(isPro);
      setKalanHak(hak2.isPro ? null : hak2.kalan);
      kullanimYenile();

    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      if (raw === 'USER_LIMIT_EXCEEDED') {
        setUpsellGoster(true);
        setHata(dil === 'en'
          ? 'Monthly free outfit suggestions used up. Upgrade to Pro for unlimited.'
          : 'Bu ay ücretsiz kombin önerilerin doldu. Sınırsız için Pro\'ya geç.');
      } else {
        const error = handleError(e);
        logError(error, 'outfits.kombinOner');
        setHata(`Kombin hatası: ${error.userMessage}`);
      }
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

  // Stil skoru — seciliKombin burada tanımlı olduğu için useEffect buraya taşındı
  useEffect(() => {
    if (!seciliKombin) { setStilSkor(null); return; }
    setStilSkor(stilPuaniHesapla(seciliKombin, kiyafetler, hava));
  }, [seciliKombin, kiyafetler, hava]);

  const skor      = seciliKombin ? renkUyumSkoru(seciliKombin.parcalar) : 0;
  const skorRenk  = skor >= 80 ? '#27AE60' : skor >= 60 ? '#F39C12' : '#E74C3C';
  const skorEtiket = dil === 'en'
    ? (skor >= 90 ? 'Perfect' : skor >= 75 ? 'Great'  : skor >= 60 ? 'Good' : 'Mismatch')
    : (skor >= 90 ? 'Mükemmel' : skor >= 75 ? 'Harika' : skor >= 60 ? 'İyi'  : 'Uyumsuz');

  // Midnight gradient theme overrides — sadece karanlik mode'da
  const camKart   = karanlik ? 'rgba(255,255,255,0.04)' : renkler.kart;
  const camSinir  = karanlik ? 'rgba(0,212,255,0.14)'   : renkler.sinir;

  return (
    <View style={[styles.container, { backgroundColor: karanlik ? '#000' : renkler.bg2 }]}>
      <StatusBar barStyle={renkler.statusBar} backgroundColor={karanlik ? 'transparent' : renkler.bg} translucent={karanlik} />
      {karanlik && <MidnightSky durum={hava ? durumModu(hava.durum) : 'clear-night'} />}

      {!wardrobeAkisi && (<>
      <View style={[styles.header, { backgroundColor: 'transparent', borderBottomColor: karanlik ? 'transparent' : renkler.sinir }]}>
        <TouchableOpacity onPress={() => router.push('/takvim' as any)}>
          <Text style={[styles.geri, { color: renkler.metin }]}>📅</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { color: renkler.metin }]}>{t.bugunkuKombinler}</Text>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={temaToggle}
            accessibilityLabel={karanlik ? 'Açık moda geç' : 'Koyu moda geç'}
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 20 }}>{karanlik ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => dilDegistir(dil === 'tr' ? 'en' : 'tr')}
            accessibilityLabel={dil === 'tr' ? 'Switch to English' : 'Türkçeye geç'}
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: renkler.metin, letterSpacing: 0.5 }}>
              {dil === 'tr' ? 'TR' : 'EN'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setUrlModalAcik(true)} accessibilityLabel="URL'den dene" accessibilityRole="button">
            <Text style={{ fontSize: 18 }}>🔗</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={baslat} accessibilityLabel="Yenile" accessibilityRole="button">
            <Text style={[styles.yenile, { color: aksanRenk }]}>↺</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
      {kullanim && kullanim.tier === 'free' && (() => {
        const tryOnLeft = kalanHakHesapla(kullanim, 'tryon');
        const sugLeft   = kalanHakHesapla(kullanim, 'suggestion');
        const renkT = kalanRenk(tryOnLeft, kullanim.limits.tryon);
        const renkS = kalanRenk(sugLeft,   kullanim.limits.suggestion);
        const dolu  = tryOnLeft === 0 && sugLeft === 0;
        return (
          <TouchableOpacity
            style={[styles.freemiumBant, dolu && { borderColor: '#E74C3C', borderWidth: 1 }]}
            onPress={() => router.push('/subscription' as any)}
          >
            <View style={{ flexDirection: 'row', gap: 14, flex: 1, flexWrap: 'wrap' }}>
              <Text style={[styles.freemiumBantText, { color: renkT }]}>
                👗 {tryOnLeft}/{kullanim.limits.tryon} {dil === 'en' ? 'try-on' : 'deneme'}
              </Text>
              <Text style={[styles.freemiumBantText, { color: renkS }]}>
                ✨ {sugLeft}/{kullanim.limits.suggestion} {dil === 'en' ? 'outfits' : 'öneri'}
              </Text>
            </View>
            <Text style={styles.freemiumBantCta}>
              {dolu ? (dil === 'en' ? 'Upgrade →' : 'Yükselt →') : (dil === 'en' ? 'PRO →' : 'PRO →')}
            </Text>
          </TouchableOpacity>
        );
      })()}

      <View style={[styles.havaDurumu, { backgroundColor: camKart, borderColor: camSinir, borderWidth: karanlik ? 1 : 0, overflow: 'hidden' }]}>
        {hava && !karanlik && (
          <HavaAnimasyon
            durum={durumModu(
              hava.durum,
              new Date().getHours() < 6 || new Date().getHours() >= 20,
            )}
          />
        )}
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
        <>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.95 }}>
          <View
            style={[styles.avatarBolum, { backgroundColor: camKart, borderColor: camSinir, borderWidth: karanlik ? 1 : 0 }]}
            {...panResponder.panHandlers}
          >
            {seciliKombin && (
              <Animated.View style={[styles.avatarSatir, { transform: [{ translateX: slideAnim }] }]}>
                <View style={{ alignItems: 'center' }}>
                <View style={styles.avatarOrtala}>
                  {(() => {
                    const hasFoto = !!profil?.profilFoto;
                    const has3D   = !!avatarGlbUri;

                    const _esle = (keys: string[]) => parcaEsle(seciliKombin, keys);
                    const _renk = (ad: string | null) => kiyafetRenkBul(ad, kiyafetler);
                    const disParca  = _esle(['mont','kaban','trençkot','trenkot','yağmurluk','yagmurluk','hırka','hirka','coat','jacket','raincoat','cardigan','blazer','trench','parka','overcoat']);
                    const ustParca  = _esle(['gömlek','gomlek','tişört','tisort','kazak','bluz','ceket','sweatshirt','hoodie','shirt','t-shirt','tshirt','sweater','blouse','top','polo','turtleneck','knit']);
                    const altParca  = _esle(['pantolon','etek','şort','short','jean','takim','takım','elbise','pants','trousers','skirt','shorts','jeans','dress','suit','chinos','leggings','culottes']);
                    const ayakParca = _esle(['ayakkabı','ayakkabi','bot','sneaker','loafer','sandalet','çizme','cizme','shoes','boots','sneakers','loafers','sandals','heels','flats','mules','oxfords']);

                    // 3D modu: ücretli, GLB gerekli
                    if (gorselMod === '3d' && has3D) {
                      return (
                        <ThreeDInline
                          glbUrl={avatarGlbUri!}
                          width={DISP_W}
                          height={DISP_H}
                          onTap={() => setViewer3D({ visible: true, glbUrl: avatarGlbUri!, baslik: 'Avatar' })}
                          ustRenk={_renk(disParca ?? ustParca)}
                          altRenk={_renk(altParca)}
                          ayakRenk={_renk(ayakParca)}
                        />
                      );
                    }

                    // Fotoğraf modu: arka plansız PNG (rembg sonrası) direkt karta otur
                    if (hasFoto) {
                      return (
                        <Image
                          source={{ uri: profil!.profilFoto! }}
                          style={{ width: DISP_W, height: DISP_H }}
                          resizeMode="contain"
                        />
                      );
                    }

                    // SVG fallback
                    return <AvatarSVG kombin={seciliKombin} profil={profil} kiyafetler={kiyafetler} />;
                  })()}

                </View>

                  {/* Fotoğraf / 3D geçiş butonu - fotoğrafın altında */}
                  {profil?.profilFoto && avatarGlbUri && (
                    <View style={styles.gorselToggle}>
                      <TouchableOpacity
                        style={[styles.gorselToggleBtn, gorselMod === 'foto' && { backgroundColor: 'rgba(0,212,255,0.25)' }]}
                        onPress={() => setGorselMod('foto')}
                      >
                        <Text style={styles.gorselToggleIkon}>📷</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.gorselToggleBtn, gorselMod === '3d' && { backgroundColor: 'rgba(0,212,255,0.25)' }]}
                        onPress={() => {
                          if (!can3D()) { setUpsellGoster(true); return; }
                          setGorselMod('3d');
                        }}
                      >
                        <Text style={styles.gorselToggleIkon}>🎮</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <View style={styles.avatarBilgi}>
                  <Text style={[styles.avatarBaslik, { color: renkler.metin }]}>{seciliKombin.baslik}</Text>
                  <View style={[styles.badge, { backgroundColor: renkler.chip }]}>
                    <Text style={[styles.badgeText, { color: renkler.metin2 }]}>{seciliKombin.tur}</Text>
                  </View>
                  <Text style={[styles.avatarNeden, { color: renkler.metin2 }]} numberOfLines={3}>{seciliKombin.neden}</Text>
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
            <View style={[styles.parcalarBolum, { backgroundColor: camKart, borderColor: camSinir, borderWidth: karanlik ? 1 : 0 }]}>
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
                      <Text style={[styles.parcaText, { color: renkler.metin }]} numberOfLines={1}>{p}</Text>
                      <TouchableOpacity
                        style={styles.swapBtn}
                        onPress={() => setSwapModal({ parcaIndex: i })}
                      >
                        <Text style={styles.swapBtnText}>↻</Text>
                      </TouchableOpacity>
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
                onPress={() => setTryOn({ visible: true, adim: 'sec', sonucUri: null, hata: null, modelFoto: profil?.profilFoto ?? null, secilenParcalar: [], adimMetni: '' })}
              >
                <Text style={[styles.paylasButonText, { color: '#00D4FF' }]}>
                  {dil === 'en' ? '👗 Try On' : '👗 Dene'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ikonBtn, { borderColor: '#27AE60' }]}
                onPress={feedePaylash}
                disabled={feedPaylasiyor}
              >
                <Text style={{ fontSize: feedPaylasiyor ? 13 : 18 }}>
                  {feedPaylasiyor ? '...' : '🌍'}
                </Text>
              </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.secButon, { backgroundColor: renkler.btnPrimary, marginTop: 8 }]}
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
                      { text: dil === 'en' ? '🌍 Share to Community' : '🌍 Topluluğa Paylaş', onPress: feedePaylash },
                      { text: 'OK' },
                    ],
                  );
                }}
              >
                <Text style={[styles.secButonText, { color: renkler.btnPrimaryMetin }]}>{t.buKombiniSec}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Kombin Oluştur butonu */}
          <TouchableOpacity
            style={[styles.customBuilderBtn, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}
            onPress={() => { setCustomSecili([]); setCustomAcik(true); }}
          >
            <Text style={[styles.customBuilderBtnText, { color: renkler.metin }]}>
              ✦ {dil === 'en' ? 'Build Your Own Outfit' : 'Kendi Kombinini Oluştur'}
            </Text>
            <Text style={[styles.customBuilderBtnAlt, { color: renkler.metin2 }]}>
              {dil === 'en' ? 'Mix any items, try on virtually' : 'İstediğin parçaları seç, sanal dene'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </>
      )}
      </ScrollView>
      </>)}

      {/* ── PARÇA DEĞİŞTİR MODAL ── */}
      <Modal
        visible={!!swapModal}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={() => setSwapModal(null)}
      >
        <View style={[styles.tryOnModal, { backgroundColor: renkler.bg }]}>
          <View style={styles.tryOnHeader}>
            <Text style={[styles.tryOnBaslik, { color: renkler.metin }]}>
              {dil === 'en' ? '↻ Replace Piece' : '↻ Parçayı Değiştir'}
            </Text>
            <TouchableOpacity onPress={() => setSwapModal(null)}>
              <Text style={[styles.tryOnKapat, { color: renkler.metin2 }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={[{ color: renkler.metin2, fontSize: 13, paddingHorizontal: 20, marginBottom: 12 }]}>
            {dil === 'en'
              ? `Replacing: "${swapModal !== null ? seciliKombin?.parcalar[swapModal.parcaIndex] : ''}" — pick a replacement`
              : `"${swapModal !== null ? seciliKombin?.parcalar[swapModal.parcaIndex] : ''}" yerine seç`}
          </Text>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 32 }}>
            {kiyafetler.map(k => (
              <TouchableOpacity
                key={k.id}
                style={[styles.swapKiyafetSatir, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}
                onPress={() => swapModal !== null && parcaDegistir(swapModal.parcaIndex, k.ad)}
              >
                {k.foto
                  ? <Image source={{ uri: k.foto }} style={styles.swapKiyafetFoto} />
                  : <View style={[styles.swapKiyafetFotoYok, { backgroundColor: renkler.chip }]}>
                      <Text style={{ fontSize: 18 }}>{k.ad.charAt(0)}</Text>
                    </View>
                }
                <View style={{ flex: 1 }}>
                  <Text style={[{ color: renkler.metin, fontWeight: '600', fontSize: 14 }]}>{k.ad}</Text>
                  <Text style={[{ color: renkler.metin2, fontSize: 12 }]}>{k.tur} · {k.sezon}</Text>
                </View>
                <Text style={{ color: '#00D4FF', fontSize: 20 }}>→</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* ── KOMBİN OLUŞTUR MODAL ── */}
      <Modal
        visible={customAcik}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={() => setCustomAcik(false)}
      >
        <View style={[styles.tryOnModal, { backgroundColor: renkler.bg }]}>
          <View style={styles.tryOnHeader}>
            <Text style={[styles.tryOnBaslik, { color: renkler.metin }]}>
              {dil === 'en' ? '✦ Build Outfit' : '✦ Kombin Oluştur'}
            </Text>
            <TouchableOpacity onPress={() => setCustomAcik(false)}>
              <Text style={[styles.tryOnKapat, { color: renkler.metin2 }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Seçilen parçalar şeridi */}
          {customSecili.length > 0 && (
            <View style={[styles.customSeciliSerit, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
                {customSecili.map((id, i) => {
                  const k = kiyafetler.find(x => x.id === id);
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.customSeciliChip, { backgroundColor: renkler.chip }]}
                      onPress={() => setCustomSecili(s => s.filter(x => x !== id))}
                    >
                      {k?.foto
                        ? <Image source={{ uri: k.foto }} style={{ width: 36, height: 36, borderRadius: 8 }} />
                        : <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: renkler.sinir, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 16 }}>{k?.ad?.charAt(0) ?? '?'}</Text>
                          </View>
                      }
                      <Text style={{ color: renkler.metin, fontSize: 11, maxWidth: 60 }} numberOfLines={2}>{k?.ad ?? ''}</Text>
                      <Text style={{ color: '#E74C3C', fontSize: 11, fontWeight: '700' }}>✕</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Gardırop listesi */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingTop: 12, paddingBottom: 120 }}>
            <Text style={[{ color: renkler.metin2, fontSize: 12, marginBottom: 4 }]}>
              {dil === 'en' ? 'Tap to add / tap again to remove' : 'Eklemek için dokun, çıkarmak için tekrar dokun'}
            </Text>
            {kiyafetler.map(k => {
              const secili = customSecili.includes(k.id);
              return (
                <TouchableOpacity
                  key={k.id}
                  style={[styles.swapKiyafetSatir, {
                    backgroundColor: secili ? 'rgba(0,212,255,0.12)' : renkler.kart,
                    borderColor: secili ? '#00D4FF' : renkler.sinir,
                    borderWidth: secili ? 1.5 : 1,
                  }]}
                  onPress={() => setCustomSecili(s =>
                    s.includes(k.id) ? s.filter(x => x !== k.id) : [...s, k.id]
                  )}
                >
                  {k.foto
                    ? <Image source={{ uri: k.foto }} style={styles.swapKiyafetFoto} />
                    : <View style={[styles.swapKiyafetFotoYok, { backgroundColor: renkler.chip }]}>
                        <Text style={{ fontSize: 18 }}>{k.ad.charAt(0)}</Text>
                      </View>
                  }
                  <View style={{ flex: 1 }}>
                    <Text style={[{ color: renkler.metin, fontWeight: '600', fontSize: 14 }]}>{k.ad}</Text>
                    <Text style={[{ color: renkler.metin2, fontSize: 12 }]}>{k.tur} · {k.sezon}</Text>
                  </View>
                  <Text style={{ fontSize: 22 }}>{secili ? '✓' : '+'}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Alt butonlar */}
          {customSecili.length > 0 && (
            <View style={[styles.customAltButonlar, { backgroundColor: renkler.bg, borderTopColor: renkler.sinir }]}>
              <Text style={[{ color: renkler.metin2, fontSize: 12, textAlign: 'center', marginBottom: 10 }]}>
                {customSecili.length} {dil === 'en' ? 'items selected' : 'parça seçildi'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={[styles.customDeneBtn, { borderColor: '#00D4FF', borderWidth: 1.5, flex: 1 }]}
                  onPress={() => {
                    setCustomAcik(false);
                    setTryOn({
                      visible: true, adim: 'sec', sonucUri: null, hata: null,
                      modelFoto: profil?.profilFoto ?? null,
                      secilenParcalar: customSecili.map(id => kiyafetler.find(x => x.id === id)?.ad ?? '').filter(Boolean),
                      adimMetni: '',
                    });
                  }}
                >
                  <Text style={{ color: '#00D4FF', fontWeight: '700', fontSize: 15 }}>
                    👗 {dil === 'en' ? 'Virtual Try-On' : 'Sanal Dene'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.customDeneBtn, { backgroundColor: renkler.btnPrimary, flex: 1 }]}
                  onPress={async () => {
                    const yeniKombin: Kombin = {
                      baslik: dil === 'en' ? 'My Outfit' : 'Benim Kombinim',
                      tur: dil === 'en' ? 'Custom' : 'Özel',
                      parcalar: customSecili.map(id => kiyafetler.find(x => x.id === id)?.ad ?? '').filter(Boolean),
                      neden: dil === 'en' ? 'Curated by you' : 'Senin seçimin',
                    };
                    setKombinler(prev => [yeniKombin, ...prev]);
                    setSeciliIndex(0);
                    setCustomAcik(false);
                  }}
                >
                  <Text style={{ color: renkler.btnPrimaryMetin, fontWeight: '700', fontSize: 15 }}>
                    ✓ {dil === 'en' ? 'Add to Outfits' : 'Kombinlere Ekle'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* ── VIRTUAL TRY-ON MODAL ── */}
      <Modal
        visible={tryOn.visible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={() => tryOnKapat()}
      >
        <View style={[styles.tryOnModal, { backgroundColor: renkler.bg }]}>
          <View style={styles.tryOnHeader}>
            <Text style={[styles.tryOnBaslik, { color: renkler.metin }]}>
              {dil === 'en' ? '👗 Virtual Try-On' : '👗 Sanal Deneme'}
            </Text>
            <TouchableOpacity onPress={() => tryOnKapat()}>
              <Text style={[styles.tryOnKapat, { color: renkler.metin2 }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {tryOn.adim === 'sec' && (seciliKombin || tryOn.secilenParcalar.length > 0) && (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tryOnIcPadding}>
              {/* Model photo picker */}
              <View style={[styles.tryOnModelBolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
                <TouchableOpacity style={styles.tryOnModelFotoBtn} onPress={tryOnModelFotoSec}>
                  {tryOn.modelFoto ? (
                    <Image source={{ uri: tryOn.modelFoto }} style={styles.tryOnModelFoto} resizeMode="cover" />
                  ) : (
                    <View style={[styles.tryOnModelFotoYok, { backgroundColor: renkler.chip }]}>
                      <Text style={{ fontSize: 28 }}>👤</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.tryOnModelBaslik, { color: renkler.metin }]}>
                    {dil === 'en' ? 'Your photo' : 'Senin fotoğrafın'}
                  </Text>
                  <Text style={[styles.tryOnModelAciklama, { color: renkler.metin2 }]}>
                    {dil === 'en'
                      ? '✅ Full body · standing · head to toe'
                      : '✅ Tam boy · ayakta · baştan ayağa'}
                  </Text>
                  <Text style={[styles.tryOnModelAciklama, { color: 'rgba(231,76,60,0.8)', fontSize: 11 }]}>
                    {dil === 'en'
                      ? '❌ No selfies or sitting poses'
                      : '❌ Selfie veya oturma pozu olmasın'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.tryOnModelDegistirBtn, { borderColor: '#00D4FF' }]}
                    onPress={tryOnModelFotoSec}
                  >
                    <Text style={{ color: '#00D4FF', fontSize: 12, fontWeight: '600' }}>
                      {tryOn.modelFoto
                        ? (dil === 'en' ? 'Change photo' : 'Fotoğrafı değiştir')
                        : (dil === 'en' ? '+ Add photo' : '+ Fotoğraf ekle')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.tryOnAciklama, { color: renkler.metin2, marginTop: 16 }]}>
                {dil === 'en'
                  ? 'Select one or more garments to try on:'
                  : 'Denemek istediğin parçaları seç:'}
              </Text>
              {(() => {
                // Custom builder'dan gelince seçili parçaları göster; yoksa mevcut kombinin parçalarını
                const kaynak = tryOn.secilenParcalar.length > 0 &&
                  tryOn.secilenParcalar.some(p => !seciliKombin?.parcalar.includes(p))
                    ? tryOn.secilenParcalar
                    : (seciliKombin?.parcalar ?? []);
                return kaynak;
              })().map((p, i) => {
                const aranan = p.toLowerCase();
                const eslesme = kiyafetler.find(k => {
                  const kAd = k.ad?.toLowerCase() ?? '';
                  return kAd === aranan || aranan.includes(kAd) || kAd.includes(aranan);
                });
                const secili = tryOn.secilenParcalar.includes(p);
                const fotoVar = !!eslesme?.foto;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.tryOnParcaBtn,
                      { backgroundColor: renkler.kart, borderColor: secili ? '#00D4FF' : renkler.sinir },
                      secili && { borderWidth: 1.5 },
                    ]}
                    onPress={() => parcaToggle(p)}
                    activeOpacity={0.7}
                  >
                    {eslesme?.foto
                      ? <Image source={{ uri: eslesme.foto }} style={styles.tryOnParcaFoto} />
                      : (
                        <View style={[styles.tryOnParcaFotoYok, { backgroundColor: renkler.chip, alignItems: 'center', justifyContent: 'center' }]}>
                          <Text style={{ fontSize: 22 }}>🪄</Text>
                        </View>
                      )
                    }
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tryOnParcaAd, { color: renkler.metin }]}>{p}</Text>
                      {!fotoVar && (
                        <Text style={{ color: '#00D4FF', fontSize: 10 }}>
                          {dil === 'en' ? '🪄 AI will generate photo' : '🪄 AI fotoğraf üretecek'}
                        </Text>
                      )}
                    </View>
                    <View style={[
                      styles.tryOnCheckbox,
                      { borderColor: secili ? '#00D4FF' : renkler.sinir },
                      secili && { backgroundColor: '#00D4FF' },
                    ]}>
                      {secili && <Text style={{ color: '#000', fontSize: 11, fontWeight: '800' }}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Dene butonu */}
              {tryOn.secilenParcalar.length > 0 && (
                <TouchableOpacity
                  style={[styles.tryOnDeneBtn, { backgroundColor: '#00D4FF' }]}
                  onPress={() => tryOnZincir(tryOn.secilenParcalar, tryOn.modelFoto)}
                >
                  <Text style={styles.tryOnDeneBtnText}>
                    {tryOn.secilenParcalar.length === 1
                      ? (dil === 'en' ? '👗 Try On' : '👗 Dene')
                      : (dil === 'en'
                          ? `👗 Try On (${tryOn.secilenParcalar.length} items)`
                          : `👗 Kombin Dene (${tryOn.secilenParcalar.length} parça)`)}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {tryOn.adim === 'yukleniyor' && (
            <View style={styles.tryOnYukleniyor}>
              <ActivityIndicator size="large" color="#00D4FF" />
              <Text style={[styles.tryOnYukleniyorText, { color: renkler.metin }]}>
                {dil === 'en' ? 'True AI is dressing you up...' : 'True AI kıyafeti sana giydiriyor...'}
              </Text>
              {tryOn.adimMetni ? (
                <Text style={[styles.tryOnYukleniyorAlt, { color: '#00D4FF' }]}>
                  {tryOn.adimMetni}
                </Text>
              ) : null}
              <Text style={[styles.tryOnYukleniyorAlt, { color: renkler.metin2 }]}>
                {dil === 'en' ? '~30–60 sec. Please wait...' : '~30–60 saniye. Lütfen bekle...'}
              </Text>
              <TouchableOpacity
                style={[styles.tryOnTekrar, { backgroundColor: 'transparent', borderWidth: 1, borderColor: renkler.sinir, marginTop: 16 }]}
                onPress={() => setTryOn(s => ({ ...s, adim: 'sec', hata: null, sonucUri: null, adimMetni: '' }))}
              >
                <Text style={{ color: renkler.metin2, fontWeight: '600', fontSize: 14 }}>
                  {dil === 'en' ? '✕ Cancel' : '✕ Vazgeç'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {tryOn.adim === 'sonuc' && (
            <View style={{ flex: 1 }}>
              {(tryOn.hata || !tryOn.sonucUri) ? (
                <View style={styles.tryOnHata}>
                  <Text style={styles.tryOnHataIkon}>⚠️</Text>
                  <Text style={[styles.tryOnHataText, { color: renkler.metin2 }]}>
                    {tryOn.hata || (dil === 'en' ? 'No result received. Check Fashn API key.' : 'Sonuç gelmedi. Fashn API key kontrol et.')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.tryOnTekrar, { backgroundColor: renkler.btnPrimary }]}
                    onPress={() => setTryOn(s => ({ ...s, adim: 'sec', hata: null, sonucUri: null }))}
                  >
                    <Text style={{ color: renkler.btnPrimaryMetin, fontWeight: '600' }}>
                      {dil === 'en' ? 'Try Again' : 'Tekrar Dene'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <View style={{ position: 'relative', flex: 1 }}>
                    <Image
                      source={{ uri: tryOn.sonucUri! }}
                      style={styles.tryOnSonucGorsel}
                      resizeMode="contain"
                      onLoadStart={() => setTryOnImgLoading(true)}
                      onLoadEnd={() => setTryOnImgLoading(false)}
                      onError={() => {
                        setTryOnImgLoading(false);
                        setTryOn(s => ({ ...s, hata: `Görsel yüklenemedi. URL: ${s.sonucUri?.slice(0, 100)}` }));
                      }}
                    />
                    {tryOnImgLoading && (
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={NEON} />
                      </View>
                    )}
                  </View>
                  {/* DEBUG: URL göster — sonuç beyazsa tarayıcıda kontrol et */}
                  <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                    <Text style={{ color: renkler.metin2, fontSize: 10, marginBottom: 4 }} numberOfLines={2}>
                      URL: {tryOn.sonucUri}
                    </Text>
                    <TouchableOpacity onPress={() => Linking.openURL(tryOn.sonucUri!)}>
                      <Text style={{ color: NEON, fontSize: 12, textDecorationLine: 'underline', marginBottom: 4 }}>
                        {dil === 'en' ? 'Open in browser' : 'Tarayıcıda aç'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={[styles.tryOnTekrarBtn, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}
                    onPress={() => setTryOn(s => ({ ...s, adim: 'sec', sonucUri: null, hata: null }))}
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

      {/* ── URL'DEN TRY-ON MODAL ── */}
      <Modal
        visible={urlModalAcik}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={() => { setUrlModalAcik(false); setUrlOnizleme(null); setUrlInput(''); setUrlHata(null); }}
      >
        <View style={{ flex: 1, backgroundColor: renkler.bg, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Text style={{ color: renkler.metin, fontSize: 20, fontWeight: '700' }}>
              {dil === 'en' ? '🔗 Try from URL' : '🔗 Markadan Dene'}
            </Text>
            <TouchableOpacity onPress={() => { setUrlModalAcik(false); setUrlOnizleme(null); setUrlInput(''); setUrlHata(null); }}>
              <Text style={{ color: renkler.metin2, fontSize: 22 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: renkler.metin2, fontSize: 13, marginBottom: 10 }}>
            {dil === 'en'
              ? 'Paste a product link from Trendyol, ZARA, H&M, LCW etc.'
              : 'Trendyol, ZARA, H&M, LCW vb. bir ürün linki yapıştır.'}
          </Text>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            <TextInput
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="https://www.trendyol.com/..."
              placeholderTextColor={renkler.metin2}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={{
                flex: 1, backgroundColor: renkler.kart, color: renkler.metin,
                borderWidth: 1, borderColor: renkler.sinir, borderRadius: 10,
                paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
              }}
            />
            <TouchableOpacity
              onPress={urlOnizle}
              disabled={urlYukleniyor || !urlInput.trim()}
              style={{
                backgroundColor: NEON, paddingHorizontal: 16, justifyContent: 'center',
                borderRadius: 10, opacity: urlYukleniyor || !urlInput.trim() ? 0.5 : 1,
              }}
            >
              {urlYukleniyor
                ? <ActivityIndicator color="#000" />
                : <Text style={{ color: '#000', fontWeight: '700', fontSize: 13 }}>
                    {dil === 'en' ? 'Preview' : 'Önizle'}
                  </Text>}
            </TouchableOpacity>
          </View>

          {urlHata && (
            <Text style={{ color: '#E74C3C', fontSize: 13, marginBottom: 12 }}>⚠️ {urlHata}</Text>
          )}

          {urlOnizleme && (
            <View style={{ backgroundColor: renkler.kart, borderRadius: 14, padding: 14, gap: 10 }}>
              <Image
                source={{ uri: urlOnizleme.image }}
                style={{ width: '100%', height: 320, borderRadius: 10, backgroundColor: '#0A0F1A' }}
                resizeMode="contain"
              />
              {urlOnizleme.title && (
                <Text style={{ color: renkler.metin, fontSize: 15, fontWeight: '600' }} numberOfLines={2}>
                  {urlOnizleme.title}
                </Text>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {urlOnizleme.brand && (
                  <Text style={{ color: renkler.metin2, fontSize: 12 }}>{urlOnizleme.brand}</Text>
                )}
                {urlOnizleme.price && (
                  <Text style={{ color: NEON, fontSize: 14, fontWeight: '700' }}>
                    {urlOnizleme.price}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={urldenDene}
                style={{ backgroundColor: NEON, paddingVertical: 14, borderRadius: 50, alignItems: 'center', marginTop: 4 }}
              >
                <Text style={{ color: '#000', fontWeight: '800', fontSize: 15 }}>
                  👗 {dil === 'en' ? 'Virtual Try-On' : 'Sanal Dene'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Share Menu Modal */}
      <Modal visible={shareMenuAcik} transparent animationType="slide" onRequestClose={() => setShareMenuAcik(false)}>
        <TouchableOpacity style={shareS.overlay} activeOpacity={1} onPress={() => setShareMenuAcik(false)}>
          <TouchableOpacity activeOpacity={1} style={shareS.sheet}>
            <View style={shareS.handle} />
            <Text style={shareS.baslik}>{dil === 'tr' ? 'Kombini Paylaş' : 'Share Outfit'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>

            {/* Share Card Preview */}
            {seciliKombin && (
              <View ref={shareKartiRef} collapsable={false} style={{ alignSelf: 'center', marginBottom: 20 }}>
                <ShareKarti
                  kombin={seciliKombin}
                  havaDerece={hava?.derece}
                  havaDurum={hava?.durum}
                  dil={dil}
                />
              </View>
            )}

            <TouchableOpacity
              style={[shareS.btn, { backgroundColor: '#00D4FF' }]}
              onPress={() => paylasResim(shareKartiRef as any)}
              disabled={paylasiyor}
            >
              <Text style={[shareS.btnMetin, { color: '#000' }]}>
                {paylasiyor ? '...' : (dil === 'tr' ? '📤 Kart Olarak Paylaş' : '📤 Share as Card')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[shareS.btn, { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)' }]}
              onPress={() => paylasResim(viewShotRef as any)}
              disabled={paylasiyor}
            >
              <Text style={shareS.btnMetin}>
                {dil === 'tr' ? '🖼 Tam Görünüm Paylaş' : '🖼 Share Full View'}
              </Text>
            </TouchableOpacity>

            {/* Story hidden ref */}
            {seciliKombin && (
              <View ref={storyKartiRef} collapsable={false} style={{ position: 'absolute', top: -9999, left: -9999 }}>
                <StoryKarti
                  kombin={seciliKombin}
                  havaDerece={hava?.derece}
                  havaDurum={hava?.durum}
                  dil={dil}
                />
              </View>
            )}

            <TouchableOpacity
              style={[shareS.btn, { backgroundColor: 'rgba(131,58,180,0.15)', borderWidth: 0.5, borderColor: 'rgba(193,53,132,0.5)' }]}
              onPress={() => paylasResim(storyKartiRef as any)}
              disabled={paylasiyor}
            >
              <Text style={[shareS.btnMetin, { color: '#C13584' }]}>
                {paylasiyor ? '...' : (dil === 'tr' ? '📱 Instagram Story Paylaş' : '📱 Share as Instagram Story')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[shareS.btn, { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)' }]}
              onPress={paylasMetin}
            >
              <Text style={shareS.btnMetin}>
                {dil === 'tr' ? '📋 Metni Kopyala' : '📋 Copy Text'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[shareS.btn, { backgroundColor: 'rgba(37,211,102,0.12)', borderWidth: 0.5, borderColor: 'rgba(37,211,102,0.4)' }]}
              onPress={() => {
                if (!seciliKombin) return;
                const metin = `${seciliKombin.baslik}\n\n${seciliKombin.parcalar.join(', ')}\n\nxmobile ile stilini keşfet 👗`;
                Linking.openURL(`whatsapp://send?text=${encodeURIComponent(metin)}`);
              }}
            >
              <Text style={[shareS.btnMetin, { color: '#25D366' }]}>
                {dil === 'tr' ? '💬 WhatsApp\'ta Paylaş' : '💬 Share on WhatsApp'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[shareS.btn, { backgroundColor: 'rgba(39,174,96,0.15)', borderWidth: 0.5, borderColor: '#27AE60' }]}
              onPress={() => { setShareMenuAcik(false); feedePaylash(); }}
              disabled={feedPaylasiyor}
            >
              <Text style={[shareS.btnMetin, { color: '#2ED573' }]}>
                {feedPaylasiyor ? '...' : (dil === 'tr' ? '🌍 Keşfete Paylaş' : '🌍 Share to Discover')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={shareS.iptal} onPress={() => setShareMenuAcik(false)}>
              <Text style={shareS.iptalMetin}>{dil === 'tr' ? 'İptal' : 'Cancel'}</Text>
            </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const shareS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0D0D0D', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40, maxHeight: '90%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 16 },
  baslik: { fontSize: 17, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 20 },
  btn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10, alignItems: 'center' },
  btnMetin: { fontSize: 15, fontWeight: '600', color: '#fff' },
  iptal: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  iptalMetin: { fontSize: 15, color: 'rgba(255,255,255,0.45)' },
});

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
    marginHorizontal: 16, marginBottom: 12, borderRadius: 20, padding: 20,
    gap: 14, minHeight: 90,
  },
  havaIkon:       { fontSize: 38 },
  havaDerece:     { fontSize: 18, fontWeight: '700' },
  havaNot:        { fontSize: 13, marginTop: 3 },
  havaSehir:      { fontSize: 14, fontWeight: '500' },
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
  gorselToggle:   { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 6 },
  gorselToggleBtn:{ borderRadius: 12, padding: 4, backgroundColor: 'rgba(0,0,0,0.18)' },
  gorselToggleIkon:{ fontSize: 14 },
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
  altButonSatir:  { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  ikonBtn:        { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
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
  swapBtn:            { backgroundColor: 'rgba(255,165,0,0.15)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, marginRight: 4 },
  swapBtnText:        { fontSize: 14, color: '#FFA500', fontWeight: '700' },
  swapKiyafetSatir:   { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, gap: 12 },
  swapKiyafetFoto:    { width: 52, height: 52, borderRadius: 10 },
  swapKiyafetFotoYok: { width: 52, height: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  customBuilderBtn:   { margin: 16, marginTop: 8, padding: 18, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 4 },
  customBuilderBtnText: { fontSize: 16, fontWeight: '700' },
  customBuilderBtnAlt:  { fontSize: 12 },
  customSeciliSerit:  { paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1 },
  customSeciliChip:   { alignItems: 'center', gap: 4, padding: 6, borderRadius: 10, width: 76 },
  customAltButonlar:  { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 32, borderTopWidth: 1 },
  customDeneBtn:      { paddingVertical: 14, borderRadius: 50, alignItems: 'center' },
  tryOnCheckbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  tryOnDeneBtn: {
    marginTop: 16, borderRadius: 50, paddingVertical: 14,
    alignItems: 'center',
  },
  tryOnDeneBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  tryOnModelBolum: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  tryOnModelFotoBtn: {},
  tryOnModelFoto:    { width: 60, height: 80, borderRadius: 10 },
  tryOnModelFotoYok: { width: 60, height: 80, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tryOnModelBaslik:  { fontSize: 14, fontWeight: '600' },
  tryOnModelAciklama:{ fontSize: 11, lineHeight: 16 },
  tryOnModelDegistirBtn: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginTop: 4 },
  streakBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginTop: 8, marginBottom: 4,
    borderRadius: 16, borderWidth: 0.5, paddingHorizontal: 16, paddingVertical: 10,
  },
  streakItem:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakAtes:    { fontSize: 24 },
  streakSayi:    { fontSize: 18, fontWeight: '800' },
  streakLabel:   { fontSize: 10, marginTop: 1 },
  streakDivider: { width: 0.5, height: 32, marginHorizontal: 4 },
  rozetChip:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 0.5 },

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
