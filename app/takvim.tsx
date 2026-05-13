import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../lib/context';
import type { KombinKayit, Kombin } from '../lib/types';
import { GECMIS_KEY } from './history';

const CYAN        = '#00D4FF';
const TAKVIM_KEY  = 'xmobile_takvim';

const AYLAR_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const AYLAR_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const GUNLER_TR = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
const GUNLER_EN = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const GUN_UZUN_TR = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
const GUN_UZUN_EN = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// ISO tarihi YYYY-MM-DD'ye çevir
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Haftanın başı Pazartesi
const haftaBasi = (d: Date) => {
  const gun = new Date(d);
  const g = gun.getDay();
  gun.setDate(gun.getDate() - (g === 0 ? 6 : g - 1));
  return gun;
};

// Ayın ilk günü Pazartesi=0 offset
const ayOffset = (yil: number, ay: number) => {
  const g = new Date(yil, ay, 1).getDay();
  return g === 0 ? 6 : g - 1;
};

const gunSayisi = (yil: number, ay: number) => new Date(yil, ay + 1, 0).getDate();

type TakvimData = Record<string, Kombin>;

export default function Takvim() {
  const router = useRouter();
  const { renkler, dil } = useApp();

  const bugun     = new Date();
  const [secili,  setSecili]  = useState(dateKey(bugun));
  const [ay,      setAy]      = useState(bugun.getMonth());
  const [yil,     setYil]     = useState(bugun.getFullYear());
  const [gecmis,  setGecmis]  = useState<Record<string, Kombin>>({});
  const [takvim,  setTakvim]  = useState<TakvimData>({});
  const [modal,   setModal]   = useState(false);
  const [gecmisListe, setGecmisListe] = useState<KombinKayit[]>([]);

  const veriYukle = useCallback(async () => {
    const [gv, tv] = await AsyncStorage.multiGet([GECMIS_KEY, TAKVIM_KEY]);
    if (gv[1]) {
      try {
        const liste: KombinKayit[] = JSON.parse(gv[1]);
        setGecmisListe(liste.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime()));
        const map: Record<string, Kombin> = {};
        liste.forEach(k => { map[k.tarih.slice(0, 10)] = k.kombin; });
        setGecmis(map);
      } catch { /* corrupt data — ignore */ }
    }
    if (tv[1]) {
      try { setTakvim(JSON.parse(tv[1])); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => { veriYukle(); }, []);

  // Ekrana her dönüşte geçmişi taze oku (outfits'te seçilen kombin anında görünsün)
  useFocusEffect(useCallback(() => { veriYukle(); }, [veriYukle]));

  const kombinAl = (key: string): Kombin | null => gecmis[key] ?? takvim[key] ?? null;
  const gosterge  = (key: string) => !!kombinAl(key);

  const planKaydet = useCallback(async (kombin: Kombin) => {
    const yeni = { ...takvim, [secili]: kombin };
    setTakvim(yeni);
    await AsyncStorage.setItem(TAKVIM_KEY, JSON.stringify(yeni));
    setModal(false);
  }, [takvim, secili]);

  const planSil = useCallback(async () => {
    const { [secili]: _, ...kalan } = takvim;
    setTakvim(kalan);
    await AsyncStorage.setItem(TAKVIM_KEY, JSON.stringify(kalan));
  }, [takvim, secili]);

  // ─── Hafta şeridi ────────────────────────────────────────────────────────────
  const haftaBasiDate = haftaBasi(bugun);
  const haftaGunleri = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(haftaBasiDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  // ─── Ay grid ─────────────────────────────────────────────────────────────────
  const offset  = ayOffset(yil, ay);
  const toplam  = gunSayisi(yil, ay);
  const hucreler: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: toplam }, (_, i) => i + 1),
  ];
  while (hucreler.length % 7 !== 0) hucreler.push(null);

  const gunler = dil === 'en' ? GUNLER_EN : GUNLER_TR;
  const aylar  = dil === 'en' ? AYLAR_EN  : AYLAR_TR;

  const seciliKombin = kombinAl(secili);
  const seciliDate   = new Date(secili + 'T00:00:00');
  const seciliGecmis = !!gecmis[secili];
  const gecmisteMi   = seciliDate < bugun && dateKey(seciliDate) !== dateKey(bugun);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: renkler.bg }]} edges={['top']}>
      <StatusBar barStyle={renkler.statusBar} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: renkler.sinir }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.geri, { color: renkler.metin }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { color: renkler.metin }]}>
          {dil === 'en' ? '📅 Outfit Calendar' : '📅 Kombin Takvimi'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Hafta şeridi ── */}
        <View style={[styles.haftaSerit, { borderBottomColor: renkler.sinir }]}>
          {haftaGunleri.map((d, i) => {
            const key      = dateKey(d);
            const aktif    = key === secili;
            const bugunMu  = key === dateKey(bugun);
            const varMi    = gosterge(key);
            return (
              <TouchableOpacity key={i} style={styles.haftaHucre} onPress={() => {
                setSecili(key);
                setAy(d.getMonth());
                setYil(d.getFullYear());
              }}>
                <Text style={[styles.haftaGunAd, { color: aktif ? CYAN : renkler.metin2 }]}>
                  {gunler[i]}
                </Text>
                <View style={[
                  styles.haftaSayiSaril,
                  aktif && { backgroundColor: CYAN },
                  bugunMu && !aktif && { borderColor: CYAN, borderWidth: 1 },
                ]}>
                  <Text style={[styles.haftaSayi, { color: aktif ? '#000' : renkler.metin }]}>
                    {d.getDate()}
                  </Text>
                </View>
                {varMi && <View style={[styles.nokta, { backgroundColor: aktif ? '#000' : CYAN }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Ay navigasyonu ── */}
        <View style={styles.ayNav}>
          <TouchableOpacity onPress={() => {
            if (ay === 0) { setAy(11); setYil(y => y - 1); }
            else setAy(a => a - 1);
          }}>
            <Text style={[styles.navOk, { color: renkler.metin }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.ayBaslik, { color: renkler.metin }]}>
            {aylar[ay]} {yil}
          </Text>
          <TouchableOpacity onPress={() => {
            if (ay === 11) { setAy(0); setYil(y => y + 1); }
            else setAy(a => a + 1);
          }}>
            <Text style={[styles.navOk, { color: renkler.metin }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Gün başlıkları ── */}
        <View style={styles.gridSatir}>
          {gunler.map(g => (
            <Text key={g} style={[styles.gridGunAd, { color: renkler.metin2 }]}>{g}</Text>
          ))}
        </View>

        {/* ── Ay grid ── */}
        {Array.from({ length: hucreler.length / 7 }, (_, hafta) => (
          <View key={hafta} style={styles.gridSatir}>
            {hucreler.slice(hafta * 7, hafta * 7 + 7).map((gun, i) => {
              if (!gun) return <View key={i} style={styles.gridHucre} />;
              const key     = `${yil}-${String(ay + 1).padStart(2, '0')}-${String(gun).padStart(2, '0')}`;
              const aktif   = key === secili;
              const bugunMu = key === dateKey(bugun);
              const varMi   = gosterge(key);
              return (
                <TouchableOpacity key={i} style={styles.gridHucre} onPress={() => setSecili(key)}>
                  <View style={[
                    styles.gridSayiSaril,
                    aktif  && { backgroundColor: CYAN },
                    bugunMu && !aktif && { borderColor: CYAN, borderWidth: 1 },
                  ]}>
                    <Text style={[styles.gridSayi, {
                      color: aktif ? '#000' : bugunMu ? CYAN : renkler.metin,
                    }]}>{gun}</Text>
                  </View>
                  {varMi && <View style={[styles.nokta, { backgroundColor: aktif ? '#000' : CYAN }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* ── Seçili gün detayı ── */}
        <View style={[styles.detay, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.detayTarih, { color: renkler.metin }]}>
            {seciliDate.getDate()} {aylar[seciliDate.getMonth()]}
            {'  '}
            <Text style={{ color: renkler.metin2, fontSize: 13 }}>
              {(dil === 'en' ? GUN_UZUN_EN : GUN_UZUN_TR)[
                seciliDate.getDay() === 0 ? 6 : seciliDate.getDay() - 1
              ]}
            </Text>
          </Text>

          {seciliKombin ? (
            <View style={{ gap: 8 }}>
              <View style={styles.kombinBaslikSatir}>
                <Text style={[styles.kombinBaslik, { color: renkler.metin }]}>
                  {seciliKombin.baslik}
                </Text>
                {seciliGecmis
                  ? <View style={[styles.badge, { backgroundColor: 'rgba(0,212,255,0.1)' }]}>
                      <Text style={{ fontSize: 10, color: CYAN, fontWeight: '700' }}>
                        {dil === 'en' ? 'WORN' : 'GİYİLDİ'}
                      </Text>
                    </View>
                  : <TouchableOpacity onPress={planSil}>
                      <Text style={{ color: renkler.metin2, fontSize: 18 }}>×</Text>
                    </TouchableOpacity>
                }
              </View>
              <View style={styles.parcalarSatir}>
                {seciliKombin.parcalar.map((p, i) => (
                  <View key={i} style={[styles.parcaBadge, { backgroundColor: renkler.chip }]}>
                    <Text style={[styles.parcaMetin, { color: renkler.metin2 }]}>{p}</Text>
                  </View>
                ))}
              </View>
              {seciliKombin.neden ? (
                <Text style={[styles.neden, { color: renkler.metin2 }]}>{seciliKombin.neden}</Text>
              ) : null}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.planBtn, { borderColor: CYAN }]}
              onPress={() => !gecmisteMi && setModal(true)}
              disabled={gecmisteMi}
            >
              <Text style={{ color: gecmisteMi ? renkler.metin2 : CYAN, fontSize: 15, fontWeight: '600' }}>
                {gecmisteMi
                  ? (dil === 'en' ? 'No outfit recorded' : 'Kayıtlı kombin yok')
                  : (dil === 'en' ? '+ Plan Outfit' : '+ Kombin Planla')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ── Plan Seç Modal ── */}
      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <View style={styles.modalArkaPlan}>
          <View style={[styles.modalIcerik, { backgroundColor: renkler.bg, borderColor: renkler.sinir }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalBaslik, { color: renkler.metin }]}>
                {dil === 'en' ? 'Pick an Outfit' : 'Kombin Seç'}
              </Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Text style={{ color: renkler.metin2, fontSize: 22 }}>×</Text>
              </TouchableOpacity>
            </View>
            {gecmisListe.length === 0 ? (
              <Text style={[{ color: renkler.metin2, textAlign: 'center', marginTop: 32 }]}>
                {dil === 'en' ? 'No past outfits yet.\nGenerate one first.' : 'Henüz geçmiş kombin yok.\nÖnce bir kombin oluştur.'}
              </Text>
            ) : (
              <FlatList
                data={gecmisListe.slice(0, 20)}
                keyExtractor={i => i.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalKart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}
                    onPress={() => planKaydet(item.kombin)}
                  >
                    <Text style={[styles.modalKartBaslik, { color: renkler.metin }]}>{item.kombin.baslik}</Text>
                    <Text style={[styles.modalKartParcalar, { color: renkler.metin2 }]} numberOfLines={1}>
                      {item.kombin.parcalar.join(' · ')}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5,
  },
  geri:   { fontSize: 22 },
  baslik: { fontSize: 17, fontWeight: '700' },

  haftaSerit: {
    flexDirection: 'row', paddingVertical: 12,
    borderBottomWidth: 0.5, paddingHorizontal: 8,
  },
  haftaHucre:    { flex: 1, alignItems: 'center', gap: 4 },
  haftaGunAd:    { fontSize: 11, fontWeight: '600' },
  haftaSayiSaril:{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  haftaSayi:     { fontSize: 14, fontWeight: '700' },

  ayNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14 },
  navOk:    { fontSize: 24, fontWeight: '300' },
  ayBaslik: { fontSize: 16, fontWeight: '700' },

  gridSatir: { flexDirection: 'row', paddingHorizontal: 8 },
  gridGunAd: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', paddingVertical: 6 },
  gridHucre: { flex: 1, alignItems: 'center', paddingVertical: 4, gap: 2 },
  gridSayiSaril: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  gridSayi:      { fontSize: 14, fontWeight: '600' },

  nokta: { width: 5, height: 5, borderRadius: 2.5 },

  detay: {
    margin: 16, borderRadius: 16, borderWidth: 0.5, padding: 18, gap: 10,
  },
  detayTarih:      { fontSize: 17, fontWeight: '700' },
  kombinBaslikSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kombinBaslik:    { fontSize: 15, fontWeight: '700', flex: 1 },
  badge:           { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  parcalarSatir:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  parcaBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  parcaMetin:      { fontSize: 12, fontWeight: '500' },
  neden:           { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  planBtn: {
    borderWidth: 1, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', borderStyle: 'dashed',
  },

  modalArkaPlan:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalIcerik:    { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 0.5, padding: 20, maxHeight: '70%' },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalBaslik:    { fontSize: 17, fontWeight: '700' },
  modalKart:      { borderRadius: 12, borderWidth: 0.5, padding: 14, marginBottom: 8 },
  modalKartBaslik:   { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  modalKartParcalar: { fontSize: 12 },
});
