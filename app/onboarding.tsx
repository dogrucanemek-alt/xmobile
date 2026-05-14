import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  Dimensions, FlatList, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Rect, Path, Ellipse, Line } from 'react-native-svg';
import { useApp } from '../lib/context';

const DIL_KEY = 'xmobile_dil';

export const ONBOARDING_KEY = 'xmobile_onboarding_done';

const CYAN = '#00D4FF';
const { width } = Dimensions.get('window');

// ── İllüstrasyonlar ────────────────────────────────────────────────────────
function IllustrationWardrobe() {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      {/* Gardırop gövdesi */}
      <Rect x={20} y={30} width={160} height={140} rx={12} fill="rgba(0,212,255,0.08)" stroke={CYAN} strokeWidth={1.5} />
      {/* Orta bölme */}
      <Line x1={100} y1={30} x2={100} y2={170} stroke={CYAN} strokeWidth={1} strokeOpacity={0.4} />
      {/* Üst raf */}
      <Rect x={28} y={50} width={64} height={8} rx={4} fill="rgba(0,212,255,0.25)" />
      <Rect x={108} y={50} width={64} height={8} rx={4} fill="rgba(0,212,255,0.25)" />
      {/* Askılı kıyafetler sol */}
      <Path d="M 48 70 Q 48 62 60 62 Q 72 62 72 70" stroke={CYAN} strokeWidth={1.5} fill="none" />
      <Rect x={40} y={70} width={40} height={50} rx={6} fill="rgba(0,212,255,0.15)" stroke={CYAN} strokeWidth={1} />
      {/* Askılı kıyafetler sağ */}
      <Path d="M 118 70 Q 118 62 130 62 Q 142 62 142 70" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} fill="none" />
      <Rect x={110} y={70} width={40} height={50} rx={6} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      {/* Çekmece */}
      <Rect x={28} y={138} width={64} height={22} rx={6} fill="rgba(0,212,255,0.1)" stroke={CYAN} strokeWidth={1} strokeOpacity={0.5} />
      <Rect x={108} y={138} width={64} height={22} rx={6} fill="rgba(0,212,255,0.1)" stroke={CYAN} strokeWidth={1} strokeOpacity={0.5} />
      <Circle cx={60} cy={149} r={3} fill={CYAN} opacity={0.6} />
      <Circle cx={140} cy={149} r={3} fill={CYAN} opacity={0.6} />
      {/* Parlama */}
      <Path d="M 148 38 L 156 46" stroke={CYAN} strokeWidth={1} strokeOpacity={0.6} />
      <Path d="M 152 38 L 152 46" stroke={CYAN} strokeWidth={1} strokeOpacity={0.4} />
      <Path d="M 148 42 L 156 42" stroke={CYAN} strokeWidth={1} strokeOpacity={0.4} />
    </Svg>
  );
}

function IllustrationCamera() {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      {/* Telefon */}
      <Rect x={55} y={20} width={90} height={160} rx={16} fill="rgba(0,212,255,0.06)" stroke={CYAN} strokeWidth={1.5} />
      {/* Kamera lensi */}
      <Circle cx={100} cy={90} r={35} fill="rgba(0,212,255,0.1)" stroke={CYAN} strokeWidth={1.5} />
      <Circle cx={100} cy={90} r={24} fill="rgba(0,212,255,0.15)" stroke={CYAN} strokeWidth={1} strokeOpacity={0.6} />
      <Circle cx={100} cy={90} r={14} fill="rgba(0,212,255,0.25)" />
      <Circle cx={107} cy={83} r={4} fill="rgba(255,255,255,0.3)" />
      {/* Ekran alt kısmı */}
      <Rect x={68} y={140} width={64} height={8} rx={4} fill="rgba(0,212,255,0.15)" />
      <Rect x={82} y={155} width={36} height={8} rx={4} fill="rgba(0,212,255,0.1)" />
      {/* Flash */}
      <Circle cx={138} cy={35} r={5} fill={CYAN} opacity={0.7} />
      {/* AI etiket */}
      <Rect x={115} y={108} width={32} height={16} rx={8} fill={CYAN} />
      <Path d="M 121 116 L 131 116 M 126 111 L 126 121" stroke="#000" strokeWidth={1.5} />
    </Svg>
  );
}

function IllustrationChat() {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      {/* Sparkle orb */}
      <Circle cx={100} cy={80} r={40} fill="rgba(0,212,255,0.08)" stroke={CYAN} strokeWidth={1.5} />
      <Circle cx={100} cy={80} r={26} fill="rgba(0,212,255,0.14)" stroke={CYAN} strokeWidth={1} strokeOpacity={0.5} />
      <Path d="M 88 72 L 112 72 M 88 80 L 106 80 M 88 88 L 100 88" stroke={CYAN} strokeWidth={2} strokeLinecap="round" />
      {/* Chat bubble sol */}
      <Rect x={20} y={135} width={90} height={32} rx={16} fill="rgba(0,212,255,0.12)" stroke={CYAN} strokeWidth={1} />
      <Path d="M 36 167 L 28 178 L 52 167" fill="rgba(0,212,255,0.12)" stroke={CYAN} strokeWidth={1} />
      <Rect x={30} y={144} width={60} height={6} rx={3} fill={CYAN} opacity={0.5} />
      <Rect x={30} y={153} width={42} height={6} rx={3} fill={CYAN} opacity={0.3} />
      {/* Chat bubble sağ */}
      <Rect x={96} y={128} width={84} height={28} rx={14} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      <Path d="M 164 156 L 174 164 L 148 156" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      <Rect x={106} y={137} width={54} height={5} rx={2.5} fill="rgba(255,255,255,0.25)" />
      <Rect x={106} y={145} width={38} height={5} rx={2.5} fill="rgba(255,255,255,0.15)" />
      {/* Bağlantı */}
      <Path d="M 100 120 L 100 108" stroke={CYAN} strokeWidth={1} strokeDasharray="3,3" strokeOpacity={0.5} />
    </Svg>
  );
}

function IllustrationAI() {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      {/* Beyin/AI merkezi */}
      <Circle cx={100} cy={90} r={45} fill="rgba(0,212,255,0.08)" stroke={CYAN} strokeWidth={1.5} />
      {/* İç daireler */}
      <Circle cx={100} cy={90} r={30} fill="rgba(0,212,255,0.12)" stroke={CYAN} strokeWidth={1} strokeOpacity={0.5} />
      <Circle cx={100} cy={90} r={15} fill="rgba(0,212,255,0.2)" />
      {/* X harfi */}
      <Path d="M 91 81 L 109 99 M 109 81 L 91 99" stroke={CYAN} strokeWidth={3} strokeLinecap="round" />
      {/* Bağlantı çizgileri */}
      <Line x1={100} y1={45} x2={100} y2={25} stroke={CYAN} strokeWidth={1} strokeOpacity={0.5} />
      <Circle cx={100} cy={22} r={5} fill={CYAN} opacity={0.7} />
      <Line x1={145} y1={90} x2={165} y2={90} stroke={CYAN} strokeWidth={1} strokeOpacity={0.5} />
      <Circle cx={168} cy={90} r={5} fill={CYAN} opacity={0.7} />
      <Line x1={55} y1={90} x2={35} y2={90} stroke={CYAN} strokeWidth={1} strokeOpacity={0.5} />
      <Circle cx={32} cy={90} r={5} fill={CYAN} opacity={0.7} />
      <Line x1={132} y1={58} x2={148} y2={42} stroke={CYAN} strokeWidth={1} strokeOpacity={0.5} />
      <Circle cx={151} cy={39} r={5} fill={CYAN} opacity={0.7} />
      <Line x1={68} y1={58} x2={52} y2={42} stroke={CYAN} strokeWidth={1} strokeOpacity={0.5} />
      <Circle cx={49} cy={39} r={5} fill={CYAN} opacity={0.7} />
      {/* Alt ikon: hava */}
      <Path d="M 72 155 Q 85 145 100 150 Q 115 155 128 145" stroke={CYAN} strokeWidth={1.5} fill="none" strokeOpacity={0.7} strokeLinecap="round" />
      <Circle cx={65} cy={155} r={6} fill="rgba(0,212,255,0.2)" stroke={CYAN} strokeWidth={1} />
      <Text style={{ fontSize: 10 }} />
    </Svg>
  );
}

// ── Slayt verileri ──────────────────────────────────────────────────────────
const SLIDES = {
  tr: [
    {
      title: 'Gardırobun\nArtık Zeki',
      subtitle: 'Kıyafetlerini bir kez ekle, yapay zeka her sabah ne giyeceğini söylesin.',
      Illustration: IllustrationWardrobe,
    },
    {
      title: 'Fotoğrafla\nEkle',
      subtitle: 'Kıyafetini fotoğrafla — AI markayı, rengi ve türü otomatik tanır.',
      Illustration: IllustrationCamera,
    },
    {
      title: 'Hava Durumuna\nGöre Kombin',
      subtitle: 'Her gün dışarıdaki havayı analiz eder, tarzına uygun kombini önerir.',
      Illustration: IllustrationAI,
    },
    {
      title: 'Kişisel\nModa AI\'ın',
      subtitle: 'Gardırobunu bilen AI stilistin her an hazır. Sor, dinle, kombini hazırla.',
      Illustration: IllustrationChat,
    },
  ],
  en: [
    {
      title: 'Your Wardrobe\nGets Smarter',
      subtitle: 'Add your clothes once, and AI will tell you what to wear every morning.',
      Illustration: IllustrationWardrobe,
    },
    {
      title: 'Add with\na Photo',
      subtitle: 'Photograph your clothing — AI automatically recognizes brand, color, and type.',
      Illustration: IllustrationCamera,
    },
    {
      title: 'Outfit Based\non Weather',
      subtitle: 'Analyzes daily weather and suggests outfits that match your style.',
      Illustration: IllustrationAI,
    },
    {
      title: 'Your Personal\nStyle AI',
      subtitle: 'An AI stylist that knows your wardrobe is always ready. Ask, listen, get dressed.',
      Illustration: IllustrationChat,
    },
  ],
};

export default function Onboarding() {
  const router = useRouter();
  const { dil, dilDegistir } = useApp();
  const [dilSecildi, setDilSecildi] = useState(false);
  const slides = SLIDES[dil];
  const [aktif, setAktif] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const ileri = () => {
    if (aktif < slides.length - 1) {
      const sonraki = aktif + 1;
      flatRef.current?.scrollToIndex({ index: sonraki, animated: true });
      setAktif(sonraki);
    } else {
      bitir();
    }
  };

  const bitir = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    // Store'a göndermeden önce '/login' yap
    router.replace(__DEV__ ? '/(tabs)/outfits' : '/login' as any);
  };

  const dilSec = async (d: 'tr' | 'en') => {
    await AsyncStorage.setItem(DIL_KEY, d);
    dilDegistir(d);
    setDilSecildi(true);
  };

  // ── Dil seçim ekranı ──────────────────────────────────────────────────────
  if (!dilSecildi) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.dilEkran}>
          <View style={styles.logoDaire}>
            <Text style={styles.logoHarf}>x</Text>
          </View>
          <Text style={styles.dilBaslik}>xmobile</Text>
          <Text style={styles.dilAlt}>Choose your language / Dil seç</Text>
          <View style={styles.dilButonlar}>
            <TouchableOpacity style={styles.dilBtn} onPress={() => dilSec('tr')}>
              <Text style={styles.dilBayrак}>🇹🇷</Text>
              <Text style={styles.dilAd}>Türkçe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dilBtn} onPress={() => dilSec('en')}>
              <Text style={styles.dilBayrак}>🇺🇸</Text>
              <Text style={styles.dilAd}>English</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Atla */}
      {aktif < slides.length - 1 && (
        <TouchableOpacity style={styles.atlaBtn} onPress={bitir}>
          <Text style={styles.atlaText}>{dil === 'tr' ? 'Atla' : 'Skip'}</Text>
        </TouchableOpacity>
      )}

      {/* Slaytlar */}
      <Animated.FlatList
        ref={flatRef}
        data={slides}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setAktif(idx);
        }}
        renderItem={({ item }) => (
          <View style={styles.slayt}>
            <View style={styles.illustrasyon}>
              <item.Illustration />
            </View>
            <Text style={styles.baslik}>{item.title}</Text>
            <Text style={styles.altBaslik}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Nokta göstergesi */}
      <View style={styles.noktalar}>
        {slides.map((_, i) => {
          const genislik = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          const opaklık = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [0.35, 1, 0.35],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={i}
              style={[styles.nokta, { width: genislik, opacity: opaklık }]}
            />
          );
        })}
      </View>

      {/* İleri / Başla butonu */}
      <View style={styles.altBlok}>
        <TouchableOpacity style={styles.btn} onPress={ileri} activeOpacity={0.85}>
          <Text style={styles.btnText}>
            {aktif === slides.length - 1
              ? (dil === 'tr' ? 'Başla →' : 'Get Started →')
              : (dil === 'tr' ? 'İleri →' : 'Next →')
            }
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#000' },

  // Dil seçim ekranı
  dilEkran: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12,
  },
  logoDaire: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(0,212,255,0.1)', borderWidth: 1.5,
    borderColor: CYAN, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  logoHarf:  { fontSize: 36, fontWeight: '800', color: CYAN, letterSpacing: -1 },
  dilBaslik: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  dilAlt:    { fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: 16 },
  dilButonlar: { flexDirection: 'row', gap: 16, marginTop: 8 },
  dilBtn: {
    flex: 1, alignItems: 'center', gap: 10, paddingVertical: 24, paddingHorizontal: 20,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  dilBayrак: { fontSize: 40 },
  dilAd:     { fontSize: 16, fontWeight: '700', color: '#fff' },

  atlaBtn:      { position: 'absolute', top: 60, right: 28, zIndex: 10 },
  atlaText:     { color: 'rgba(255,255,255,0.45)', fontSize: 15 },

  slayt: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  illustrasyon: {
    width: 200,
    height: 200,
    marginBottom: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baslik: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  altBaslik: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 24,
  },

  noktalar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  nokta: {
    height: 8,
    borderRadius: 4,
    backgroundColor: CYAN,
  },

  altBlok: {
    paddingHorizontal: 28,
    paddingBottom: 52,
  },
  btn: {
    backgroundColor: CYAN,
    paddingVertical: 18,
    borderRadius: 50,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.3,
  },
});
