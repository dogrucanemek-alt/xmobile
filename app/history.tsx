import React, { useEffect, useState, useCallback } from 'react';
import {
  Text, View, StyleSheet, StatusBar, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../lib/context';
import type { KombinKayit } from '../lib/types';

export const GECMIS_KEY = 'xmobile_gecmis';

const tarihFormat = (iso: string, dil: 'tr' | 'en') => {
  const d = new Date(iso);
  return d.toLocaleDateString(dil === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
};

const saatFormat = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

export default function History() {
  const router = useRouter();
  const { renkler, dil } = useApp();
  const [kayitlar, setKayitlar] = useState<KombinKayit[]>([]);
  const [filtre, setFiltre] = useState<'tumü' | 'favoriler'>('tumü');

  const yukle = async () => {
    const kayitli = await AsyncStorage.getItem(GECMIS_KEY);
    const liste: KombinKayit[] = kayitli ? JSON.parse(kayitli) : [];
    setKayitlar(liste.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime()));
  };

  useFocusEffect(useCallback(() => { yukle(); }, []));

  const favoriToggle = async (id: string) => {
    const yeni = kayitlar.map(k => k.id === id ? { ...k, favori: !k.favori } : k);
    setKayitlar(yeni);
    await AsyncStorage.setItem(GECMIS_KEY, JSON.stringify(yeni));
  };

  const sil = (id: string) => {
    Alert.alert(
      dil === 'en' ? 'Delete' : 'Sil',
      dil === 'en' ? 'Remove this outfit from history?' : 'Bu kombin geçmişten silinsin mi?',
      [
        { text: dil === 'en' ? 'Cancel' : 'Vazgeç', style: 'cancel' },
        {
          text: dil === 'en' ? 'Delete' : 'Sil', style: 'destructive',
          onPress: async () => {
            const yeni = kayitlar.filter(k => k.id !== id);
            setKayitlar(yeni);
            await AsyncStorage.setItem(GECMIS_KEY, JSON.stringify(yeni));
          },
        },
      ],
    );
  };

  const tumunuSil = () => {
    Alert.alert(
      dil === 'en' ? 'Clear All' : 'Tümünü Temizle',
      dil === 'en' ? 'Delete entire outfit history?' : 'Tüm kombin geçmişi silinsin mi?',
      [
        { text: dil === 'en' ? 'Cancel' : 'Vazgeç', style: 'cancel' },
        {
          text: dil === 'en' ? 'Clear' : 'Temizle', style: 'destructive',
          onPress: async () => {
            setKayitlar([]);
            await AsyncStorage.removeItem(GECMIS_KEY);
          },
        },
      ],
    );
  };

  const goster = filtre === 'favoriler' ? kayitlar.filter(k => k.favori) : kayitlar;

  return (
    <View style={[styles.container, { backgroundColor: renkler.bg2 }]}>
      <StatusBar barStyle={renkler.statusBar} backgroundColor={renkler.bg} />

      <View style={[styles.header, { backgroundColor: renkler.bg, borderBottomColor: renkler.sinir }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.geri, { color: renkler.metin }]}>
            {dil === 'en' ? '‹ Back' : '‹ Geri'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { color: renkler.metin }]}>
          {dil === 'en' ? 'History' : 'Geçmiş'}
        </Text>
        {kayitlar.length > 0 ? (
          <TouchableOpacity onPress={tumunuSil}>
            <Text style={[styles.temizle, { color: '#FF3B30' }]}>
              {dil === 'en' ? 'Clear' : 'Temizle'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      {/* Filtre */}
      <View style={[styles.filtreBar, { backgroundColor: renkler.bg, borderBottomColor: renkler.sinir }]}>
        {(['tumü', 'favoriler'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filtreBtn, filtre === f && { backgroundColor: renkler.btnPrimary, borderRadius: 20 }]}
            onPress={() => setFiltre(f)}
          >
            <Text style={[styles.filtreBtnText, { color: filtre === f ? renkler.btnPrimaryMetin : renkler.metin2 }]}>
              {f === 'tumü'
                ? (dil === 'en' ? `All  (${kayitlar.length})` : `Tümü  (${kayitlar.length})`)
                : (dil === 'en' ? `★  Favorites  (${kayitlar.filter(k => k.favori).length})` : `★  Favoriler  (${kayitlar.filter(k => k.favori).length})`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {goster.length === 0 ? (
        <View style={styles.bos}>
          <Text style={styles.bosIkon}>{filtre === 'favoriler' ? '★' : '📋'}</Text>
          <Text style={[styles.bosBaslik, { color: renkler.metin }]}>
            {filtre === 'favoriler'
              ? (dil === 'en' ? 'No favorites yet' : 'Henüz favori yok')
              : (dil === 'en' ? 'No outfit history yet' : 'Henüz kombin geçmişi yok')}
          </Text>
          <Text style={[styles.bosAlt, { color: renkler.metin2 }]}>
            {dil === 'en'
              ? 'Select an outfit from the Outfits screen to save it here.'
              : 'Outfits ekranından bir kombin seçerek buraya kaydedebilirsin.'}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ height: 12 }} />
          {goster.map(kayit => (
            <View
              key={kayit.id}
              style={[styles.kart, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}
            >
              {/* Üst satır: tarih + aksiyon butonları */}
              <View style={styles.kartUst}>
                <View>
                  <Text style={[styles.tarih, { color: renkler.metin2 }]}>
                    {tarihFormat(kayit.tarih, dil)}
                  </Text>
                  <Text style={[styles.saat, { color: renkler.metin2 }]}>
                    {saatFormat(kayit.tarih)}
                    {kayit.hava ? `  ·  ${kayit.hava.derece}°C ${kayit.hava.durum}` : ''}
                  </Text>
                </View>
                <View style={styles.aksiyon}>
                  <TouchableOpacity onPress={() => favoriToggle(kayit.id)} style={styles.aksiyonBtn}>
                    <Text style={[styles.yildiz, { color: kayit.favori ? '#F5A623' : renkler.metin2 }]}>
                      {kayit.favori ? '★' : '☆'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => sil(kayit.id)} style={styles.aksiyonBtn}>
                    <Text style={[styles.silBtn, { color: renkler.metin2 }]}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Kombin başlık + rozet */}
              <View style={styles.kartOrta}>
                <Text style={[styles.kombinBaslik, { color: renkler.metin }]}>
                  {kayit.kombin.baslik}
                </Text>
                <View style={[styles.badge, { backgroundColor: renkler.chip }]}>
                  <Text style={[styles.badgeText, { color: renkler.metin2 }]}>
                    {kayit.kombin.tur}
                  </Text>
                </View>
              </View>

              {/* Parçalar */}
              <View style={styles.parcalar}>
                {kayit.kombin.parcalar.map((p, i) => (
                  <View key={i} style={[styles.parcaChip, { backgroundColor: renkler.chip }]}>
                    <Text style={[styles.parcaText, { color: renkler.metin }]}>{p}</Text>
                  </View>
                ))}
              </View>

              {/* Açıklama */}
              <Text style={[styles.neden, { color: renkler.metin2 }]}>
                {kayit.kombin.neden}
              </Text>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 0.5,
  },
  geri:         { fontSize: 16 },
  baslik:       { fontSize: 17, fontWeight: '600' },
  temizle:      { fontSize: 14, fontWeight: '500' },
  filtreBar: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
    gap: 8, borderBottomWidth: 0.5,
  },
  filtreBtn:    { paddingHorizontal: 16, paddingVertical: 7 },
  filtreBtnText:{ fontSize: 13, fontWeight: '500' },
  bos:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  bosIkon:      { fontSize: 48 },
  bosBaslik:    { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  bosAlt:       { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  kart: {
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 16, borderWidth: 0.5,
  },
  kartUst:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  tarih:        { fontSize: 13, fontWeight: '600' },
  saat:         { fontSize: 12, marginTop: 2 },
  aksiyon:      { flexDirection: 'row', gap: 4 },
  aksiyonBtn:   { padding: 6 },
  yildiz:       { fontSize: 22 },
  silBtn:       { fontSize: 16 },
  kartOrta:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  kombinBaslik: { fontSize: 15, fontWeight: '700', flex: 1 },
  badge:        { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:    { fontSize: 11 },
  parcalar:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  parcaChip:    { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  parcaText:    { fontSize: 12 },
  neden:        { fontSize: 12, lineHeight: 18 },
});
