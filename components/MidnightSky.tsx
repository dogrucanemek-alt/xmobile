import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Rect, RadialGradient } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');

export type GokyuzuModu =
  | 'clear-day' | 'clear-night'
  | 'clouds' | 'rain' | 'drizzle' | 'snow'
  | 'thunder' | 'mist' | 'sunrise' | 'sunset' | 'none';

// Daha kontrastlı gradient'ler — üst stop'lar belirgin görünür, alt %30 derin siyah
const GRADIENT: Record<GokyuzuModu, { stops: [string, string, string, string]; glow?: { color: string; cx: string; cy: string; opacity?: number } }> = {
  'clear-night': {
    stops: ['#1a2f5c', '#0e1a36', '#050a18', '#000000'],
    glow: { color: '#00d4ff', cx: '80%', cy: '12%', opacity: 0.30 },
  },
  'clear-day': {
    stops: ['#2a5c98', '#16386a', '#0a1c3c', '#000000'],
    glow: { color: '#ffd068', cx: '82%', cy: '10%', opacity: 0.52 },
  },
  'clouds': {
    stops: ['#4a5b72', '#2a3645', '#141a22', '#000000'],
    glow: { color: '#c0ccd8', cx: '50%', cy: '6%', opacity: 0.28 },
  },
  'rain': {
    stops: ['#2c4258', '#162538', '#0a121e', '#000000'],
    glow: { color: '#6a8ab0', cx: '50%', cy: '12%', opacity: 0.26 },
  },
  'drizzle': {
    stops: ['#36475a', '#1c2838', '#0e151f', '#000000'],
    glow: { color: '#7a98b8', cx: '50%', cy: '12%', opacity: 0.24 },
  },
  'snow': {
    stops: ['#4c6688', '#243a5e', '#101a32', '#000000'],
    glow: { color: '#dee8f4', cx: '50%', cy: '10%', opacity: 0.32 },
  },
  'thunder': {
    stops: ['#2a2a48', '#15152a', '#06061a', '#000000'],
    glow: { color: '#9a7aff', cx: '50%', cy: '18%', opacity: 0.38 },
  },
  'mist': {
    stops: ['#3c4452', '#1f242e', '#0e1218', '#000000'],
    glow: { color: '#b8c0cc', cx: '50%', cy: '12%', opacity: 0.22 },
  },
  'sunrise': {
    stops: ['#2c2868', '#16124a', '#0a0828', '#000000'],
    glow: { color: '#ffae5a', cx: '18%', cy: '14%', opacity: 0.52 },
  },
  'sunset': {
    stops: ['#3a1850', '#221038', '#100620', '#000000'],
    glow: { color: '#ff7a8a', cx: '82%', cy: '18%', opacity: 0.52 },
  },
  'none': {
    stops: ['#1a2f5c', '#0e1a36', '#050a18', '#000000'],
    glow: { color: '#00d4ff', cx: '80%', cy: '12%', opacity: 0.30 },
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

// Atmosferik bulut — full-screen, çok yumuşak, yavaş kayan büyük bulut
function AtmosferBulutu({ y, width, sure, opacity, delay = 0, renk = '#ffffff' }: { y: number; width: number; sure: number; opacity: number; delay?: number; renk?: string }) {
  const x = useRef(new Animated.Value(-width)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(x, { toValue: SW + width, duration: sure, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(x, { toValue: -width, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, sure, width, x]);
  const fill = renk;
  const h = width * 0.55;
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: y, opacity, transform: [{ translateX: x }] }}
    >
      <Svg width={width} height={h} viewBox="0 0 100 55">
        <Circle cx="22" cy="35" r="18" fill={fill} />
        <Circle cx="40" cy="22" r="22" fill={fill} />
        <Circle cx="60" cy="20" r="25" fill={fill} />
        <Circle cx="80" cy="32" r="20" fill={fill} />
      </Svg>
    </Animated.View>
  );
}

// Yağmur damlası — full-screen yüksekliğinde düşer
function YagmurDamlasi({ x, delay, sure, renk = 'rgba(180,210,255,0.42)' }: { x: number; delay: number; sure: number; renk?: string }) {
  const y = useRef(new Animated.Value(-30)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, { toValue: SH * 0.7, duration: sure, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(y, { toValue: -30, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, sure, y]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', left: x, top: 0,
        width: 1.2, height: 16, backgroundColor: renk, borderRadius: 1,
        transform: [{ translateY: y }],
      }}
    />
  );
}

// Kar tanesi
function KarTanesi({ x, delay, sure }: { x: number; delay: number; sure: number }) {
  const y = useRef(new Animated.Value(-10)).current;
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loopY = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, { toValue: SH * 0.7, duration: sure, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(y, { toValue: -10, duration: 0, useNativeDriver: true }),
      ]),
    );
    const loopX = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 12, duration: sure / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: -12, duration: sure / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loopY.start(); loopX.start();
    return () => { loopY.stop(); loopX.stop(); };
  }, [delay, sure, y, drift]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', left: x, top: 0,
        width: 4, height: 4, borderRadius: 2,
        backgroundColor: '#fff', opacity: 0.7,
        transform: [{ translateY: y }, { translateX: drift }],
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
  const yildizGoster  = durum === 'clear-night';
  const gunesGoster   = durum === 'clear-day' || durum === 'sunrise' || durum === 'sunset';
  const bulutGoster   = durum === 'clouds' || durum === 'mist' || durum === 'rain' || durum === 'drizzle' || durum === 'thunder';
  const yagmurGoster  = durum === 'rain' || durum === 'thunder';
  const cisentiGoster = durum === 'drizzle';
  const karGoster     = durum === 'snow';

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

  const yagmurlar = useMemo(
    () =>
      Array.from({ length: 36 }).map((_, i) => ({
        x: (i * 31) % SW,
        delay: (i * 137) % 1800,
        sure: 900 + ((i * 53) % 600),
      })),
    [],
  );

  const cisentiler = useMemo(
    () =>
      Array.from({ length: 50 }).map((_, i) => ({
        x: (i * 23) % SW,
        delay: (i * 89) % 2500,
        sure: 1500 + ((i * 41) % 700),
      })),
    [],
  );

  const karlar = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        x: (i * 37) % SW,
        delay: (i * 211) % 3000,
        sure: 4500 + ((i * 113) % 2500),
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

      {bulutGoster && (
        <>
          <AtmosferBulutu y={SH * 0.05} width={SW * 0.65} sure={48000} opacity={0.10} delay={0} />
          <AtmosferBulutu y={SH * 0.14} width={SW * 0.45} sure={36000} opacity={0.07} delay={6000} />
          <AtmosferBulutu y={SH * 0.22} width={SW * 0.75} sure={56000} opacity={0.08} delay={14000} />
        </>
      )}

      {yagmurGoster && yagmurlar.map((d, i) => <YagmurDamlasi key={`r${i}`} {...d} />)}

      {cisentiGoster && cisentiler.map((d, i) => (
        <YagmurDamlasi key={`d${i}`} x={d.x} delay={d.delay} sure={d.sure} renk="rgba(180,210,255,0.28)" />
      ))}

      {karGoster && karlar.map((d, i) => <KarTanesi key={`s${i}`} {...d} />)}
    </View>
  );
}
