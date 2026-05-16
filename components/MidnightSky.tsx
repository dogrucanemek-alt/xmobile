import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, RadialGradient } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');

export type GokyuzuModu =
  | 'clear-day' | 'clear-night'
  | 'clouds' | 'rain' | 'drizzle' | 'snow'
  | 'thunder' | 'mist' | 'sunrise' | 'sunset' | 'none';

// Tüm modlar dark-readable: alt %50 koyu, üst kısımdan ipucu ver, glow ile karakter ekle
const GRADIENT: Record<GokyuzuModu, { stops: [string, string, string, string]; glow?: { color: string; cx: string; cy: string; opacity?: number } }> = {
  'clear-night': {
    stops: ['#0a1730', '#070e22', '#040814', '#000000'],
    glow: { color: '#00d4ff', cx: '80%', cy: '12%', opacity: 0.22 },
  },
  'clear-day': {
    // koyu deniz-mavi + üstte sıcak güneş halesi
    stops: ['#1e4068', '#0f2848', '#06162c', '#000000'],
    glow: { color: '#ffd068', cx: '82%', cy: '10%', opacity: 0.42 },
  },
  'clouds': {
    // gri-mavi pus, glow yok keskin değil
    stops: ['#2a3340', '#1a2028', '#0e1218', '#000000'],
    glow: { color: '#8a96a8', cx: '50%', cy: '8%', opacity: 0.18 },
  },
  'rain': {
    // koyu petrol mavi
    stops: ['#1a2a3a', '#0e1824', '#070c14', '#000000'],
    glow: { color: '#4a6890', cx: '50%', cy: '15%', opacity: 0.18 },
  },
  'drizzle': {
    stops: ['#202e3e', '#121b28', '#080d14', '#000000'],
    glow: { color: '#5a7898', cx: '50%', cy: '12%', opacity: 0.16 },
  },
  'snow': {
    // soğuk çelik mavi + beyaz halesi
    stops: ['#2a3a52', '#16223a', '#0a1124', '#000000'],
    glow: { color: '#dee8f4', cx: '50%', cy: '10%', opacity: 0.20 },
  },
  'thunder': {
    // gerilimli mor-siyah
    stops: ['#15152a', '#0a0a18', '#04040e', '#000000'],
    glow: { color: '#7a5aff', cx: '50%', cy: '18%', opacity: 0.28 },
  },
  'mist': {
    // ışıksız gri kül
    stops: ['#252a32', '#171a20', '#0d0f14', '#000000'],
    glow: { color: '#a8b4c0', cx: '50%', cy: '12%', opacity: 0.14 },
  },
  'sunrise': {
    // koyu lacivert + sol üstte turuncu hale
    stops: ['#1a1a44', '#0e0e2a', '#070718', '#000000'],
    glow: { color: '#ffae5a', cx: '18%', cy: '14%', opacity: 0.42 },
  },
  'sunset': {
    // koyu eflatun + sağda pembe hale
    stops: ['#241032', '#160a22', '#0a0512', '#000000'],
    glow: { color: '#ff7a8a', cx: '82%', cy: '18%', opacity: 0.42 },
  },
  'none': {
    stops: ['#0a1730', '#070e22', '#040814', '#000000'],
    glow: { color: '#00d4ff', cx: '80%', cy: '12%', opacity: 0.22 },
  },
};

function Yildiz({ x, y, delay, boyut }: { x: number; y: number; delay: number; boyut: number }) {
  const op = useRef(new Animated.Value(0.2)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(op, { toValue: 0.85, duration: 1400, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.2,  duration: 1400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, op]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x, top: y,
        width: boyut, height: boyut,
        borderRadius: boyut / 2,
        backgroundColor: '#fff',
        opacity: op,
      }}
    />
  );
}

// Güneş halkası — clear-day & sunrise/sunset için
function GunesHalkasi({ renk, cx, cy }: { renk: string; cx: number; cy: number }) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const op    = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.15, duration: 4000, useNativeDriver: true }),
          Animated.timing(op,    { toValue: 0.85, duration: 4000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 0.9, duration: 4000, useNativeDriver: true }),
          Animated.timing(op,    { toValue: 0.55, duration: 4000, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, op]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: cx - 60, top: cy - 60,
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: renk,
        opacity: op,
        transform: [{ scale }],
      }}
    />
  );
}

export default function MidnightSky({ durum = 'clear-night' }: { durum?: GokyuzuModu }) {
  const config = GRADIENT[durum] ?? GRADIENT['clear-night'];
  const yildizGoster = durum === 'clear-night' || durum === 'thunder';
  const gunesGoster  = durum === 'clear-day' || durum === 'sunrise' || durum === 'sunset';

  const yildizlar = useMemo(
    () =>
      Array.from({ length: 42 }).map((_, i) => ({
        x: (i * 73) % SW,
        y: (i * 47) % Math.round(SH * 0.55),
        delay: (i * 191) % 3500,
        boyut: 1 + ((i * 7) % 3),
      })),
    [],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`bg_${durum}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"    stopColor={config.stops[0]} stopOpacity="1" />
            <Stop offset="0.35" stopColor={config.stops[1]} stopOpacity="1" />
            <Stop offset="0.7"  stopColor={config.stops[2]} stopOpacity="1" />
            <Stop offset="1"    stopColor={config.stops[3]} stopOpacity="1" />
          </LinearGradient>
          {config.glow && (
            <RadialGradient id={`glow_${durum}`} cx={config.glow.cx} cy={config.glow.cy} rx="55%" ry="35%">
              <Stop offset="0"   stopColor={config.glow.color} stopOpacity={String(config.glow.opacity ?? 0.22)} />
              <Stop offset="0.6" stopColor={config.glow.color} stopOpacity="0.05" />
              <Stop offset="1"   stopColor={config.glow.color} stopOpacity="0" />
            </RadialGradient>
          )}
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#bg_${durum})`} />
        {config.glow && <Rect x="0" y="0" width="100%" height="100%" fill={`url(#glow_${durum})`} />}
      </Svg>
      {gunesGoster && config.glow && (
        <GunesHalkasi
          renk={config.glow.color}
          cx={SW * (parseFloat(config.glow.cx) / 100)}
          cy={SH * (parseFloat(config.glow.cy) / 100)}
        />
      )}
      {yildizGoster && yildizlar.map((s, i) => <Yildiz key={i} {...s} />)}
    </View>
  );
}
