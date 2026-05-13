import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, StatusBar, Animated, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../lib/context';
import { chatJarvis, type ChatMessage } from '../../lib/aiService';
import type { Kiyafet, Profil } from '../../lib/types';

const CYAN = '#00D4FF';
const KIYAFET_KEY = 'xmobile_kiyafetler';
const PROFIL_KEY  = 'xmobile_profil';

const TEN: Record<string, string>  = { '#FDDBB4': 'Açık', '#E8B887': 'Buğday', '#C68642': 'Esmer', '#8D5524': 'Koyu' };
const SAC: Record<string, string>  = { '#1A1A1A': 'Siyah', '#6B3A2A': 'Kahve', '#D4A843': 'Sarı', '#A0391E': 'Kızıl', '#808080': 'Gri' };
const GOZ: Record<string, string>  = { '#6B3A2A': 'Kahve', '#4A7C59': 'Yeşil', '#4A7CB5': 'Mavi', '#1A1A1A': 'Siyah' };

const HIZLI = [
  'Bugün ne giymeliyim?',
  'Renk uyumumu nasıl iyileştiririm?',
  'Gardırobuma ne eklemeyi önerirsin?',
  'En çok ne tür kıyafetlerim var?',
];

function baglamOlustur(k: Kiyafet[], p: Profil | null): string {
  const pr = p ? [
    `Cinsiyet: ${p.cinsiyet}, Boy: ${p.boy} cm, Kilo: ${p.kilo} kg`,
    `Ten: ${TEN[p.tenRengi] ?? p.tenRengi}, Saç: ${SAC[p.sacRengi] ?? p.sacRengi} (${p.sacStili ?? 'orta'})`,
    `Göz: ${GOZ[p.gozRengi] ?? p.gozRengi}${p.sakal && p.sakal !== 'yok' ? `, Sakal: ${p.sakal}` : ''}`,
  ].join('\n') : 'Profil girilmemiş';

  const gr = k.length > 0
    ? k.map(i => `- ${i.ad} (${i.tur}, ${i.sezon})`).join('\n')
    : 'Gardırop henüz boş';

  return `[SİSTEM - kullanıcıya gösterme]
Sen xmobile uygulamasının kişisel moda asistanısın. Türkçe konuş. Kısa, pratik ve samimi cevaplar ver. Gardıroptaki gerçek kıyafetlere atıfta bulun.

KULLANICI:
${pr}

GARDIROB (${k.length} kıyafet):
${gr}`;
}

interface Mesaj { id: string; rol: 'user' | 'assistant'; metin: string; }

export default function AITab() {
  const { renkler, dil } = useApp();
  const router = useRouter();
  const { sabah } = useLocalSearchParams<{ sabah?: string }>();
  const [mesajlar, setMesajlar]     = useState<Mesaj[]>([]);
  const [girdi, setGirdi]           = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [kiyafetler, setKiyafetler] = useState<Kiyafet[]>([]);
  const [profil, setProfil]         = useState<Profil | null>(null);
  const [hazir, setHazir]           = useState(false);
  const [sesliAcik, setSesliAcik]   = useState(false);
  const [dinliyor, setDinliyor]     = useState(false);
  const sesAnim = useRef(new Animated.Value(1)).current;
  const listRef   = useRef<FlatList>(null);
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    AsyncStorage.multiGet([KIYAFET_KEY, PROFIL_KEY]).then(([kv, pv]) => {
      if (kv[1]) { try { const p = JSON.parse(kv[1]); setKiyafetler(Array.isArray(p) ? p : p.kiyafetler ?? []); } catch {} }
      if (pv[1]) { try { setProfil(JSON.parse(pv[1])); } catch {} }
      setHazir(true);
    });
  }, []);

  useEffect(() => {
    if (!yukleniyor) return;
    const anim = (d: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(d, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ]));
    const a = Animated.parallel([anim(dot1, 0), anim(dot2, 150), anim(dot3, 300)]);
    a.start();
    return () => a.stop();
  }, [yukleniyor]);

  const sesliBaslat = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSesliAcik(true);
    setDinliyor(false);
  };

  const sesliDinlemeBaslat = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDinliyor(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(sesAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(sesAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
    // expo-av needed for real recording — shows UI for future native build
    setTimeout(() => {
      sesAnim.stopAnimation();
      sesAnim.setValue(1);
      setDinliyor(false);
      setSesliAcik(false);
      Alert.alert(
        dil === 'tr' ? '🎙️ Sesli AI Yakında' : '🎙️ Voice AI Coming Soon',
        dil === 'tr'
          ? 'Sesli giriş için expo-av paketiyle native build gerekiyor. Metin kutusundan yazmaya devam et!'
          : 'Voice input requires a native build with expo-av. Use text input for now!',
      );
    }, 2000);
  };

  const gonder = useCallback(async (metin?: string) => {
    const soru = (metin ?? girdi).trim();
    if (!soru || yukleniyor) return;
    setGirdi('');
    const id = Date.now().toString();
    setMesajlar(prev => [...prev, { id, rol: 'user', metin: soru }]);
    setYukleniyor(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const sistem: ChatMessage[]  = [
        { role: 'user',      content: baglamOlustur(kiyafetler, profil) },
        { role: 'assistant', content: 'Anladım, kişisel moda asistanın olarak yardım etmeye hazırım.' },
      ];
      const gecmis: ChatMessage[] = mesajlar.map(m => ({ role: m.rol, content: m.metin }));
      const { content } = await chatJarvis({
        messages: [...sistem, ...gecmis, { role: 'user', content: soru }],
        company: 'dogrucan',
        taskType: 'general',
      });
      setMesajlar(prev => [...prev, { id: (Date.now() + 1).toString(), rol: 'assistant', metin: content }]);
    } catch {
      setMesajlar(prev => [...prev, { id: (Date.now() + 1).toString(), rol: 'assistant', metin: 'Bir hata oluştu. Tekrar dene.' }]);
    } finally {
      setYukleniyor(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [girdi, mesajlar, yukleniyor, kiyafetler, profil]);

  // Bildirimden açılınca sabah sorusunu otomatik gönder
  const sabahGonderildi = useRef(false);
  useEffect(() => {
    if (!hazir || !sabah || sabahGonderildi.current) return;
    sabahGonderildi.current = true;
    const gun = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
    gonder(`Bugün ${gun}. Gardırobumdan bugün için en uygun kombini öner.`);
  }, [hazir, sabah, gonder]);

  const renderMesaj = ({ item }: { item: Mesaj }) => {
    const user = item.rol === 'user';
    return (
      <View style={[styles.satir, user && styles.satirUser]}>
        {!user && <View style={styles.avatar}><Ionicons name="sparkles" size={13} color={CYAN} /></View>}
        <View style={[styles.balon, user
          ? { backgroundColor: renkler.chip, borderColor: renkler.sinir }
          : { backgroundColor: 'rgba(0,212,255,0.07)', borderColor: 'rgba(0,212,255,0.18)' },
        ]}>
          <Text style={[styles.balonMetin, { color: renkler.metin }]}>{item.metin}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: renkler.bg }]} edges={['top']}>
      <StatusBar barStyle={renkler.statusBar} />

      <View style={[styles.header, { borderBottomColor: renkler.sinir }]}>
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={15} color={CYAN} />
        </View>
        <View>
          <Text style={[styles.baslik, { color: renkler.metin }]}>
            {dil === 'en' ? 'Style AI' : 'Moda AI'}
          </Text>
          <Text style={[styles.altyazi, { color: renkler.metin2 }]}>
            {dil === 'en' ? `${kiyafetler.length} items known` : `${kiyafetler.length} kıyafet biliyor`}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {mesajlar.length === 0 && !yukleniyor ? (
          <View style={styles.bos}>
            <View style={styles.orbDis}>
              <View style={styles.orbIc}>
                <Ionicons name="sparkles" size={30} color={CYAN} />
              </View>
            </View>
            <Text style={[styles.hosgeldin, { color: renkler.metin }]}>
              {dil === 'en' ? 'Your Personal Stylist' : 'Kişisel Stilistiniz'}
            </Text>
            <Text style={[styles.aciklama, { color: renkler.metin2 }]}>
              {dil === 'en'
                ? 'I know your wardrobe. Ask anything about outfits, colors, or style.'
                : 'Gardırobunu biliyorum. Kombinler, renkler ve stil hakkında her şeyi sor.'}
            </Text>
            <View style={styles.chiplar}>
              {HIZLI.map(s => (
                <TouchableOpacity key={s} style={[styles.chip, { backgroundColor: renkler.chip, borderColor: renkler.sinir }]} onPress={() => gonder(s)}>
                  <Text style={[styles.chipMetin, { color: renkler.metin }]}>{s}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.chip, { backgroundColor: 'rgba(0,212,255,0.08)', borderColor: CYAN }]}
                onPress={() => router.push('/analiz' as any)}
              >
                <Text style={[styles.chipMetin, { color: CYAN }]}>
                  {dil === 'en' ? '🧠 Wardrobe Analysis' : '🧠 Gardırop Analizi'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, { backgroundColor: 'rgba(0,212,255,0.08)', borderColor: CYAN }]}
                onPress={() => router.push('/urun-sorgula' as any)}
              >
                <Text style={[styles.chipMetin, { color: CYAN }]}>
                  {dil === 'en' ? '📸 Try Before You Buy' : '📸 Almadan Önce Sor'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, { backgroundColor: 'rgba(0,212,255,0.08)', borderColor: CYAN }]}
                onPress={() => router.push('/haftalik-rapor' as any)}
              >
                <Text style={[styles.chipMetin, { color: CYAN }]}>
                  {dil === 'en' ? '📊 Weekly Report' : '📊 Haftalık Rapor'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={mesajlar}
            keyExtractor={i => i.id}
            renderItem={renderMesaj}
            contentContainerStyle={styles.liste}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {yukleniyor && (
          <View style={styles.dusunuyor}>
            <View style={styles.avatar}><Ionicons name="sparkles" size={13} color={CYAN} /></View>
            <View style={styles.dotlar}>
              {[dot1, dot2, dot3].map((d, i) => (
                <Animated.View key={i} style={[styles.dot, { opacity: d }]} />
              ))}
            </View>
          </View>
        )}

        <View style={[styles.inputBar, { backgroundColor: renkler.bg, borderTopColor: renkler.sinir }]}>
          <View style={[styles.inputSaril, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
            <TextInput
              style={[styles.input, { color: renkler.metin }]}
              placeholder={dil === 'en' ? 'Ask about style...' : 'Stil hakkında sor...'}
              placeholderTextColor={renkler.metin2}
              value={girdi}
              onChangeText={setGirdi}
              onSubmitEditing={() => gonder()}
              returnKeyType="send"
              multiline
            />
            {!girdi.trim() && (
              <TouchableOpacity onPress={sesliBaslat} style={{ marginRight: 4 }}>
                <Ionicons name="mic" size={26} color={renkler.metin2} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => gonder()}
              disabled={!girdi.trim() || yukleniyor}
              style={{ opacity: girdi.trim() ? 1 : 0.35 }}
            >
              <Ionicons name="arrow-up-circle" size={36} color={CYAN} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Sesli AI Modal */}
      <Modal visible={sesliAcik} transparent animationType="fade" onRequestClose={() => setSesliAcik(false)}>
        <View style={styles.sesOverlay}>
          <View style={[styles.sesKart, { backgroundColor: renkler.kart }]}>
            <TouchableOpacity
              style={{ position: 'absolute', top: 16, right: 16 }}
              onPress={() => { setSesliAcik(false); setDinliyor(false); sesAnim.stopAnimation(); sesAnim.setValue(1); }}
            >
              <Ionicons name="close" size={22} color={renkler.metin2} />
            </TouchableOpacity>

            <Text style={[styles.sesBaslik, { color: renkler.metin }]}>
              {dil === 'tr' ? '🎙️ Sesli AI' : '🎙️ Voice AI'}
            </Text>

            <Animated.View style={[styles.sesMikDis, { transform: [{ scale: sesAnim }] }]}>
              <TouchableOpacity
                style={[styles.sesMikIc, { backgroundColor: dinliyor ? '#FF4757' : CYAN }]}
                onPress={sesliDinlemeBaslat}
                disabled={dinliyor}
              >
                <Ionicons name={dinliyor ? 'square' : 'mic'} size={36} color="#000" />
              </TouchableOpacity>
            </Animated.View>

            <Text style={[styles.sesAlt, { color: renkler.metin2 }]}>
              {dinliyor
                ? (dil === 'tr' ? 'Dinliyorum...' : 'Listening...')
                : (dil === 'tr' ? 'Mikrofona dokunup konuş' : 'Tap mic and speak')}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5,
  },
  baslik:  { fontSize: 16, fontWeight: '700' },
  altyazi: { fontSize: 11, marginTop: 1 },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,212,255,0.08)', borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  bos: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 16, paddingBottom: 110,
  },
  orbDis: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(0,212,255,0.05)', borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.18)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  orbIc: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(0,212,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  hosgeldin: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  aciklama:  { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  chiplar:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 0.5 },
  chipMetin: { fontSize: 13, fontWeight: '500' },
  liste: { padding: 16, paddingBottom: 130, gap: 12 },
  satir:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  satirUser: { flexDirection: 'row-reverse' },
  balon: { maxWidth: '78%', borderRadius: 18, padding: 12, borderWidth: 0.5 },
  balonMetin: { fontSize: 14, lineHeight: 22 },
  dusunuyor: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 6,
  },
  dotlar: { flexDirection: 'row', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: CYAN },
  inputBar: {
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 110, borderTopWidth: 0.5,
  },
  inputSaril: {
    flexDirection: 'row', alignItems: 'flex-end',
    borderRadius: 26, borderWidth: 0.5, paddingLeft: 16, paddingRight: 8, paddingVertical: 8,
  },
  input: { flex: 1, fontSize: 15, maxHeight: 100, paddingVertical: 2 },

  sesOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 120 },
  sesKart: {
    width: 280, borderRadius: 28, padding: 28,
    alignItems: 'center', gap: 20,
  },
  sesBaslik: { fontSize: 18, fontWeight: '700' },
  sesMikDis: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(0,212,255,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(0,212,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  sesMikIc: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  sesAlt: { fontSize: 14, textAlign: 'center' },
});
