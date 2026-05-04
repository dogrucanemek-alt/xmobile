import { Text, View, StyleSheet, StatusBar, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFIL_KEY = 'xmobile_profil';

const TEN_RENKLERI = [
  { ad: 'Açık', renk: '#FDDBB4' },
  { ad: 'Buğday', renk: '#E8B887' },
  { ad: 'Esmer', renk: '#C68642' },
  { ad: 'Koyu', renk: '#8D5524' },
];

const SAC_RENKLERI = [
  { ad: 'Siyah', renk: '#1A1A1A' },
  { ad: 'Kahve', renk: '#6B3A2A' },
  { ad: 'Sarı', renk: '#D4A843' },
  { ad: 'Kızıl', renk: '#A0391E' },
  { ad: 'Gri', renk: '#808080' },
];

const GOZ_RENKLERI = [
  { ad: 'Kahve', renk: '#6B3A2A' },
  { ad: 'Yeşil', renk: '#4A7C59' },
  { ad: 'Mavi', renk: '#4A7CB5' },
  { ad: 'Siyah', renk: '#1A1A1A' },
];

export default function Profile() {
  const router = useRouter();
  const [tenRengi, setTenRengi] = useState('#FDDBB4');
  const [sacRengi, setSacRengi] = useState('#1A1A1A');
  const [gozRengi, setGozRengi] = useState('#6B3A2A');
  const [boy, setBoy] = useState('175');
  const [kilo, setKilo] = useState('70');
  const [cinsiyet, setCinsiyet] = useState('Erkek');

  useEffect(() => {
    yukle();
  }, []);

  const yukle = async () => {
    try {
      const kayitli = await AsyncStorage.getItem(PROFIL_KEY);
      if (kayitli) {
        const p = JSON.parse(kayitli);
        setTenRengi(p.tenRengi || '#FDDBB4');
        setSacRengi(p.sacRengi || '#1A1A1A');
        setGozRengi(p.gozRengi || '#6B3A2A');
        setBoy(p.boy || '175');
        setKilo(p.kilo || '70');
        setCinsiyet(p.cinsiyet || 'Erkek');
      }
    } catch (e) {}
  };

  const kaydet = async () => {
    const profil = { tenRengi, sacRengi, gozRengi, boy, kilo, cinsiyet };
    await AsyncStorage.setItem(PROFIL_KEY, JSON.stringify(profil));
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9F9" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.geri}>İptal</Text>
        </TouchableOpacity>
        <Text style={styles.baslik}>Profilim</Text>
        <TouchableOpacity onPress={kaydet}>
          <Text style={styles.kaydet}>Kaydet</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.liste}>

        {/* Avatar Önizleme */}
        <View style={styles.onizleme}>
          <View style={styles.avatarWrap}>
            {/* Saç */}
            <View style={[styles.sac, { backgroundColor: sacRengi }]} />
            {/* Baş */}
            <View style={[styles.bas, { backgroundColor: tenRengi }]}>
              {/* Gözler */}
              <View style={styles.gozlerSatir}>
                <View style={[styles.goz, { backgroundColor: gozRengi }]} />
                <View style={[styles.goz, { backgroundColor: gozRengi }]} />
              </View>
              {/* Ağız */}
              <View style={styles.agiz} />
            </View>
            {/* Boyun */}
            <View style={[styles.boyun, { backgroundColor: tenRengi }]} />
            {/* Gövde */}
            <View style={styles.govde} />
            {/* Kollar */}
            <View style={styles.kolSol} />
            <View style={styles.kolSag} />
            {/* Bacaklar */}
            <View style={styles.bacakSol} />
            <View style={styles.bacakSag} />
            {/* Ayakkabılar */}
            <View style={styles.ayakSol} />
            <View style={styles.ayakSag} />
          </View>
          <Text style={styles.onizlemeText}>Avatarın</Text>
        </View>

        {/* Cinsiyet */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Cinsiyet</Text>
          <View style={styles.chipGrup}>
            {['Erkek', 'Kadın'].map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, cinsiyet === c && styles.chipSecili]}
                onPress={() => setCinsiyet(c)}
              >
                <Text style={[styles.chipText, cinsiyet === c && styles.chipTextSecili]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ten Rengi */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Ten Rengi</Text>
          <View style={styles.renkGrup}>
            {TEN_RENKLERI.map(r => (
              <TouchableOpacity
                key={r.ad}
                style={[styles.renkDaire, { backgroundColor: r.renk },
                  tenRengi === r.renk && styles.renkSecili]}
                onPress={() => setTenRengi(r.renk)}
              >
                {tenRengi === r.renk && <Text style={styles.renkTik}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Saç Rengi */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Saç Rengi</Text>
          <View style={styles.renkGrup}>
            {SAC_RENKLERI.map(r => (
              <TouchableOpacity
                key={r.ad}
                style={[styles.renkDaire, { backgroundColor: r.renk },
                  sacRengi === r.renk && styles.renkSecili]}
                onPress={() => setSacRengi(r.renk)}
              >
                {sacRengi === r.renk && <Text style={[styles.renkTik, { color: '#FFFFFF' }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Göz Rengi */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Göz Rengi</Text>
          <View style={styles.renkGrup}>
            {GOZ_RENKLERI.map(r => (
              <TouchableOpacity
                key={r.ad}
                style={[styles.renkDaire, { backgroundColor: r.renk },
                  gozRengi === r.renk && styles.renkSecili]}
                onPress={() => setGozRengi(r.renk)}
              >
                {gozRengi === r.renk && <Text style={[styles.renkTik, { color: '#FFFFFF' }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Boy & Kilo */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Ölçüler</Text>
          <View style={styles.olcuSatir}>
            <View style={styles.olcuInput}>
              <Text style={styles.olcuLabel}>Boy (cm)</Text>
              <TextInput
                style={styles.input}
                value={boy}
                onChangeText={setBoy}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            <View style={styles.olcuInput}>
              <Text style={styles.olcuLabel}>Kilo (kg)</Text>
              <TextInput
                style={styles.input}
                value={kilo}
                onChangeText={setKilo}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5',
  },
  geri: { color: '#000000', fontSize: 16 },
  baslik: { color: '#000000', fontSize: 17, fontWeight: '600' },
  kaydet: { color: '#000000', fontSize: 16, fontWeight: '600' },
  onizleme: {
    backgroundColor: '#FFFFFF', margin: 16, borderRadius: 14,
    padding: 24, borderWidth: 0.5, borderColor: '#EEEEEE', alignItems: 'center',
  },
  avatarWrap: { width: 100, height: 180, position: 'relative', marginBottom: 12 },
  sac: {
    position: 'absolute', top: 0, left: 22, width: 56, height: 20,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  bas: {
    position: 'absolute', top: 8, left: 22, width: 56, height: 52,
    borderRadius: 28, alignItems: 'center', justifyContent: 'center',
  },
  gozlerSatir: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  goz: { width: 8, height: 8, borderRadius: 4 },
  agiz: {
    width: 16, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  boyun: {
    position: 'absolute', top: 57, left: 43, width: 14, height: 10,
  },
  govde: {
    position: 'absolute', top: 65, left: 20, width: 60, height: 55,
    borderRadius: 6, backgroundColor: '#4A90D9',
  },
  kolSol: {
    position: 'absolute', top: 67, left: 4, width: 18, height: 45,
    borderRadius: 8, backgroundColor: '#4A90D9',
  },
  kolSag: {
    position: 'absolute', top: 67, right: 4, width: 18, height: 45,
    borderRadius: 8, backgroundColor: '#4A90D9',
  },
  bacakSol: {
    position: 'absolute', top: 118, left: 20, width: 26, height: 45,
    borderRadius: 6, backgroundColor: '#2C3E50',
  },
  bacakSag: {
    position: 'absolute', top: 118, left: 54, width: 26, height: 45,
    borderRadius: 6, backgroundColor: '#2C3E50',
  },
  ayakSol: {
    position: 'absolute', top: 160, left: 16, width: 30, height: 10,
    borderRadius: 4, backgroundColor: '#1A1A1A',
  },
  ayakSag: {
    position: 'absolute', top: 160, left: 50, width: 30, height: 10,
    borderRadius: 4, backgroundColor: '#1A1A1A',
  },
  onizlemeText: { color: '#999999', fontSize: 13 },
  bolum: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, padding: 18, borderWidth: 0.5, borderColor: '#EEEEEE',
  },
  bolumBaslik: { fontSize: 13, color: '#999999', marginBottom: 12 },
  chipGrup: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#F5F5F5', borderWidth: 0.5, borderColor: '#EEEEEE',
  },
  chipSecili: { backgroundColor: '#000000', borderColor: '#000000' },
  chipText: { fontSize: 14, color: '#666666' },
  chipTextSecili: { color: '#FFFFFF' },
  renkGrup: { flexDirection: 'row', gap: 12 },
  renkDaire: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#EEEEEE',
  },
  renkSecili: { borderWidth: 3, borderColor: '#000000' },
  renkTik: { fontSize: 16, color: '#000000', fontWeight: 'bold' },
  olcuSatir: { flexDirection: 'row', gap: 16 },
  olcuInput: { flex: 1 },
  olcuLabel: { fontSize: 12, color: '#999999', marginBottom: 8 },
  input: {
    fontSize: 18, fontWeight: '600', color: '#000000',
    borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5',
    paddingVertical: 8, textAlign: 'center',
  },
});