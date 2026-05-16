import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

type Durum =
  | 'rain'
  | 'drizzle'
  | 'snow'
  | 'thunder'
  | 'clear-day'
  | 'clear-night'
  | 'clouds'
  | 'mist'
  | 'sunrise'
  | 'sunset'
  | 'none';

// OpenWeatherMap durum string'ini bizim moda eşle
export function durumModu(durum: string | undefined, geceMi = false): Durum {
  if (!durum) return 'none';
  const d = durum.toLowerCase();
  const saat = new Date().getHours();

  if (d.includes('thunder') || d.includes('gök gürültü') || d.includes('şimşek')) return 'thunder';
  if (d.includes('snow') || d.includes('kar')) return 'snow';
  if (d.includes('drizzle') || d.includes('çisenti') || d.includes('cisenti')) return 'drizzle';
  if (d.includes('rain') || d.includes('yağmur') || d.includes('yagmur') || d.includes('sağanak')) return 'rain';
  if (d.includes('mist') || d.includes('fog') || d.includes('haze') || d.includes('sis') || d.includes('puslu') || d.includes('duman')) return 'mist';
  if (d.includes('cloud') || d.includes('bulut')) return 'clouds';
  if (d.includes('clear') || d.includes('açık') || d.includes('güneşli')) {
    if (geceMi) return 'clear-night';
    // Gün doğumu / batımı saatlerinde özel mod
    if (saat >= 5 && saat < 8) return 'sunrise';
    if (saat >= 18 && saat < 20) return 'sunset';
    return 'clear-day';
  }
  return 'none';
}

// ── Yağmur damlası
function Damla({ x, delay, sure, renk = 'rgba(180,210,255,0.55)', boy = 12, kalin = 1.5 }: { x: number; delay: number; sure: number; renk?: string; boy?: number; kalin?: number }) {
  const y = useRef(new Animated.Value(-20)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, { toValue: 130, duration: sure, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(y, { toValue: -20, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, sure, y]);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: kalin,
        height: boy,
        backgroundColor: renk,
        borderRadius: 1,
        transform: [{ translateY: y }],
      }}
    />
  );
}

// ── Kar tanesi (drift'li)
function Kar({ x, delay, sure }: { x: number; delay: number; sure: number }) {
  const y = useRef(new Animated.Value(-10)).current;
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loopY = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, { toValue: 130, duration: sure, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(y, { toValue: -10, duration: 0, useNativeDriver: true }),
      ]),
    );
    const loopX = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 8, duration: sure / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: -8, duration: sure / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loopY.start();
    loopX.start();
    return () => { loopY.stop(); loopX.stop(); };
  }, [delay, sure, y, drift]);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: 4,
        height: 4,
        backgroundColor: '#fff',
        borderRadius: 2,
        opacity: 0.85,
        transform: [{ translateY: y }, { translateX: drift }],
      }}
    />
  );
}

// ── Şimşek flash
function SimsekFlash() {
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const flash = () => {
      Animated.sequence([
        Animated.timing(op, { toValue: 0.65, duration: 60, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0, duration: 80, useNativeDriver: true }),
        Animated.delay(80),
        Animated.timing(op, { toValue: 0.45, duration: 50, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    };
    flash();
    const id = setInterval(flash, 4500 + Math.random() * 2000);
    return () => clearInterval(id);
  }, [op]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { backgroundColor: '#e6f0ff', opacity: op }]}
    />
  );
}

// ── Yıldız (gece parıltısı)
function Yildiz({ x, y, delay }: { x: number; y: number; delay: number }) {
  const op = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(op, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, op]);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 2,
        height: 2,
        backgroundColor: '#fff',
        borderRadius: 1,
        opacity: op,
      }}
    />
  );
}

// ── Bulut (SVG: 3 daire + düz alt → tüylü gerçek bulut)
function BulutSurus({ top, width, sure, opacity, delay = 0 }: { top: number; width: number; sure: number; opacity: number; delay?: number }) {
  const x = useRef(new Animated.Value(-width - 20)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(x, { toValue: 360, duration: sure, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(x, { toValue: -width - 20, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, sure, width, x]);
  const yukseklik = width * 0.6;
  const dolgu = `rgba(255,255,255,${opacity})`;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top,
        transform: [{ translateX: x }],
      }}
    >
      <Svg width={width} height={yukseklik} viewBox="0 0 100 60">
        <Circle cx="28" cy="40" r="20" fill={dolgu} />
        <Circle cx="55" cy="26" r="26" fill={dolgu} />
        <Circle cx="78" cy="40" r="20" fill={dolgu} />
        <Rect x="22" y="38" width="62" height="20" fill={dolgu} />
      </Svg>
    </Animated.View>
  );
}

// ── Sis dalgası (yatay yumuşak band, opacity dalgalanır)
function SisDalga({ top, gecikme }: { top: number; gecikme: number }) {
  const op = useRef(new Animated.Value(0.1)).current;
  const x = useRef(new Animated.Value(-60)).current;
  useEffect(() => {
    const opacityLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(gecikme),
        Animated.timing(op, { toValue: 0.4, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.1, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const xLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: 60, duration: 8000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(x, { toValue: -60, duration: 0, useNativeDriver: true }),
      ]),
    );
    opacityLoop.start();
    xLoop.start();
    return () => { opacityLoop.stop(); xLoop.stop(); };
  }, [gecikme, op, x]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top,
        height: 18,
        backgroundColor: '#cdd6e3',
        borderRadius: 18,
        opacity: op,
        transform: [{ translateX: x }],
      }}
    />
  );
}

// ── Güneş ışını halkası (clear-day pulse)
function GunesIsini({ delay = 0, boyut = 80 }: { delay?: number; boyut?: number }) {
  const scale = useRef(new Animated.Value(0.3)).current;
  const op = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.4, duration: 3000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(op,    { toValue: 0,   duration: 3000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.timing(scale, { toValue: 0.3, duration: 0, useNativeDriver: true }),
        Animated.timing(op,    { toValue: 0.5, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, scale, op]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        right: 10,
        top: 6,
        width: boyut,
        height: boyut,
        borderRadius: boyut / 2,
        borderWidth: 2,
        borderColor: 'rgba(255,200,90,0.6)',
        opacity: op,
        transform: [{ scale }],
      }}
    />
  );
}

// ── Gün doğumu/batımı gradient overlay (turuncu-pembe pulse)
function GoldenHour({ icin }: { icin: 'sunrise' | 'sunset' }) {
  const op = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 0.55, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.35, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [op]);
  // Sunrise: sol alttan turuncu; sunset: sağ alttan pembe-mor
  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: icin === 'sunrise' ? 'rgba(255,170,90,0.18)' : 'rgba(220,100,130,0.20)',
            opacity: op,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          [icin === 'sunrise' ? 'left' : 'right']: -10,
          bottom: -20,
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: icin === 'sunrise' ? 'rgba(255,180,80,0.4)' : 'rgba(255,120,100,0.4)',
        }}
      />
    </>
  );
}

export default function HavaAnimasyon({ durum }: { durum: Durum }) {
  // Deterministik pozisyonlar
  const damlalar = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        x: (i * 17) % 320,
        delay: (i * 137) % 1500,
        sure: 700 + ((i * 53) % 500),
      })),
    [],
  );
  const cisentiler = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        x: (i * 11) % 320,
        delay: (i * 89) % 2500,
        sure: 1400 + ((i * 41) % 800),
      })),
    [],
  );
  const karlar = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        x: (i * 19) % 320,
        delay: (i * 211) % 3000,
        sure: 3500 + ((i * 89) % 1500),
      })),
    [],
  );
  const yildizlar = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        x: (i * 23) % 320,
        y: ((i * 31) % 60),
        delay: (i * 173) % 2000,
      })),
    [],
  );

  if (durum === 'none') return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {durum === 'rain' && damlalar.map((d, i) => <Damla key={i} {...d} />)}

      {durum === 'drizzle' && cisentiler.map((d, i) => (
        <Damla key={i} {...d} boy={6} kalin={1} renk="rgba(190,215,255,0.4)" />
      ))}

      {durum === 'thunder' && (
        <>
          {damlalar.map((d, i) => <Damla key={i} {...d} renk="rgba(200,220,255,0.65)" />)}
          <SimsekFlash />
        </>
      )}

      {durum === 'snow' && karlar.map((d, i) => <Kar key={i} {...d} />)}

      {durum === 'clouds' && (
        <>
          <BulutSurus top={8}  width={70} sure={26000} opacity={0.18} />
          <BulutSurus top={30} width={50} sure={22000} opacity={0.10} delay={4000} />
          <BulutSurus top={50} width={90} sure={32000} opacity={0.14} delay={9000} />
        </>
      )}

      {durum === 'mist' && (
        <>
          <SisDalga top={12} gecikme={0} />
          <SisDalga top={32} gecikme={1500} />
          <SisDalga top={52} gecikme={3000} />
        </>
      )}

      {durum === 'clear-night' && yildizlar.map((d, i) => <Yildiz key={i} {...d} />)}

      {durum === 'clear-day' && (
        <>
          <GunesIsini delay={0}    boyut={70} />
          <GunesIsini delay={1500} boyut={90} />
        </>
      )}

      {durum === 'sunrise' && (
        <>
          <GoldenHour icin="sunrise" />
          <GunesIsini delay={0} boyut={60} />
        </>
      )}

      {durum === 'sunset' && (
        <>
          <GoldenHour icin="sunset" />
          <GunesIsini delay={0} boyut={60} />
        </>
      )}
    </View>
  );
}
