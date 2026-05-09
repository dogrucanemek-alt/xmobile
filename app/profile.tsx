import { Text, View, StyleSheet, StatusBar, TouchableOpacity, ScrollView, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { copyAsync, documentDirectory } from '../lib/fileSystem';
import { useApp } from '../lib/context';
import ThreeDViewer from '../components/ThreeDViewer';

const PROFIL_KEY = 'xmobile_profil';

const TEN_RENKLERI = [
  { adTR: 'Açık',   adEN: 'Light',  renk: '#FDDBB4' },
  { adTR: 'Buğday', adEN: 'Wheat',  renk: '#E8B887' },
  { adTR: 'Esmer',  adEN: 'Tan',    renk: '#C68642' },
  { adTR: 'Koyu',   adEN: 'Dark',   renk: '#8D5524' },
];

const SAC_RENKLERI = [
  { adTR: 'Siyah', adEN: 'Black',  renk: '#1A1A1A' },
  { adTR: 'Kahve', adEN: 'Brown',  renk: '#6B3A2A' },
  { adTR: 'Sarı',  adEN: 'Blonde', renk: '#D4A843' },
  { adTR: 'Kızıl', adEN: 'Red',    renk: '#A0391E' },
  { adTR: 'Gri',   adEN: 'Grey',   renk: '#808080' },
];

const GOZ_RENKLERI = [
  { adTR: 'Kahve', adEN: 'Brown', renk: '#6B3A2A' },
  { adTR: 'Yeşil', adEN: 'Green', renk: '#4A7C59' },
  { adTR: 'Mavi',  adEN: 'Blue',  renk: '#4A7CB5' },
  { adTR: 'Siyah', adEN: 'Black', renk: '#1A1A1A' },
];

export default function Profile() {
  const router = useRouter();
  const { t, renkler, aksanRenk, dil, clearAvatarGlb, loadAvatarGlb, avatarGlbUri } = useApp();

  const [tenRengi,    setTenRengi]    = useState('#FDDBB4');
  const [sacRengi,    setSacRengi]    = useState('#1A1A1A');
  const [gozRengi,    setGozRengi]    = useState('#6B3A2A');
  const [boy,         setBoy]         = useState('175');
  const [kilo,        setKilo]        = useState('70');
  const [cinsiyet,    setCinsiyet]    = useState('Erkek');
  const [profilFoto,  setProfilFoto]  = useState<string | null>(null);
  const [sacStili,    setSacStili]    = useState('orta');
  const [sakal,       setSakal]       = useState('yok');
  const [avatarGlbPath, setAvatarGlbPath] = useState<string | null>(null);
  const [viewer3D,      setViewer3D]      = useState(false);
  const [glbYukleniyor, setGlbYukleniyor] = useState(false);

  useEffect(() => { yukle(); }, []);

  const glbSec = async () => {
    try {
      const sonuc = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
      if (sonuc.canceled) return;
      const dosya = sonuc.assets[0];
      if (!dosya.name.toLowerCase().endsWith('.glb')) {
        Alert.alert('Hata', 'Sadece .glb dosyaları destekleniyor');
        return;
      }
      setGlbYukleniyor(true);
      const hedef = (documentDirectory ?? '') + 'avatar.glb';
      await copyAsync({ from: dosya.uri, to: hedef });
      setAvatarGlbPath(hedef);
      clearAvatarGlb();
      const profil = { tenRengi, sacRengi, gozRengi, boy, kilo, cinsiyet, profilFoto, sacStili, sakal, avatarGlbPath: hedef };
      await AsyncStorage.setItem('xmobile_profil', JSON.stringify(profil));
    } catch {
      Alert.alert('Hata', 'Dosya yüklenemedi');
    } finally {
      setGlbYukleniyor(false);
    }
  };

  const yukle = async () => {
    try {
      const kayitli = await AsyncStorage.getItem(PROFIL_KEY);
      if (kayitli) {
        const p = JSON.parse(kayitli);
        setTenRengi(p.tenRengi    || '#FDDBB4');
        setSacRengi(p.sacRengi    || '#1A1A1A');
        setGozRengi(p.gozRengi    || '#6B3A2A');
        setBoy(p.boy               || '175');
        setKilo(p.kilo             || '70');
        setCinsiyet(p.cinsiyet     || 'Erkek');
        setProfilFoto(p.profilFoto   || null);
        setSacStili(p.sacStili       || 'orta');
        setSakal(p.sakal             || 'yok');
        setAvatarGlbPath(p.avatarGlbPath || null);
      }
    } catch (e) {
      console.warn('Profil yüklenemedi:', e);
    }
  };

  const kaydet = async () => {
    if (!boy || !kilo) {
      Alert.alert(dil === 'en' ? 'Missing Info' : 'Eksik Bilgi', dil === 'en' ? 'Please enter height and weight.' : 'Boy ve kilo alanlarını doldurun.');
      return;
    }
    const profil = { tenRengi, sacRengi, gozRengi, boy, kilo, cinsiyet, profilFoto, sacStili, sakal, avatarGlbPath };
    await AsyncStorage.setItem(PROFIL_KEY, JSON.stringify(profil));
    Alert.alert(
      dil === 'en' ? 'Saved ✓' : 'Kaydedildi ✓',
      dil === 'en' ? 'Your profile has been updated.' : 'Profilin güncellendi.',
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  const fotografSec = async () => {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) return;
    const sonuc = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!sonuc.canceled) {
      setProfilFoto(sonuc.assets[0].uri);
    }
  };

  const fotografCek = async () => {
    const izin = await ImagePicker.requestCameraPermissionsAsync();
    if (!izin.granted) return;
    const sonuc = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!sonuc.canceled) {
      setProfilFoto(sonuc.assets[0].uri);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: renkler.bg2 }]}>
      <StatusBar barStyle={renkler.statusBar} backgroundColor={renkler.bg} />

      <View style={[styles.header, { backgroundColor: renkler.bg, borderBottomColor: renkler.sinir }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.geri, { color: renkler.metin }]}>{t.iptal}</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { color: renkler.metin }]}>
          {dil === 'en' ? 'My Profile' : 'Profilim'}
        </Text>
        <TouchableOpacity onPress={kaydet}>
          <Text style={[styles.kaydetBtn, { color: aksanRenk }]}>{t.kaydet}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.liste}>

        {/* ── Profil Fotoğrafı ── */}
        <Text style={[styles.bolumEtiket, { color: renkler.metin2 }]}>
          {dil === 'en' ? 'PROFILE PHOTO' : 'PROFİL FOTOĞRAFI'}
        </Text>
        <View style={[styles.fotoBolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <TouchableOpacity onPress={fotografSec}>
            {profilFoto ? (
              <Image source={{ uri: profilFoto }} style={styles.profilFoto} />
            ) : (
              <View style={[styles.profilFotoPlaceholder, { backgroundColor: renkler.chip }]}>
                <Text style={styles.profilFotoIcon}>👤</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.fotoBtnGrup}>
            <TouchableOpacity
              style={[styles.fotoBtn, { backgroundColor: renkler.btnPrimary }]}
              onPress={fotografSec}
            >
              <Text style={[styles.fotoBtnText, { color: renkler.btnPrimaryMetin }]}>
                {dil === 'en' ? '📁 Gallery' : '📁 Galeri'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fotoBtn, { backgroundColor: renkler.chip, borderWidth: 0.5, borderColor: renkler.sinir }]}
              onPress={fotografCek}
            >
              <Text style={[styles.fotoBtnText, { color: renkler.metin }]}>
                {dil === 'en' ? '📷 Camera' : '📷 Kamera'}
              </Text>
            </TouchableOpacity>
          </View>
          {profilFoto && (
            <TouchableOpacity onPress={() => setProfilFoto(null)}>
              <Text style={styles.fotoCikar}>
                {dil === 'en' ? 'Remove Photo' : 'Fotoğrafı Kaldır'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 3D Avatar ── */}
        <Text style={[styles.bolumEtiket, { color: renkler.metin2 }]}>
          {dil === 'en' ? '3D AVATAR' : '3D AVATAR'}
        </Text>
        <View style={[styles.avatarBolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          {/* 2D önizleme — sadece GLB yoksa göster */}
          {!avatarGlbPath && (
            <View style={styles.avatarWrap}>
              <View style={[styles.sac,   { backgroundColor: sacRengi }]} />
              <View style={[styles.bas,   { backgroundColor: tenRengi }]}>
                <View style={styles.gozlerSatir}>
                  <View style={[styles.goz, { backgroundColor: gozRengi }]} />
                  <View style={[styles.goz, { backgroundColor: gozRengi }]} />
                </View>
                <View style={styles.agiz} />
              </View>
              <View style={[styles.boyun, { backgroundColor: tenRengi }]} />
              <View style={styles.govde} />
              <View style={styles.kolSol} />
              <View style={styles.kolSag} />
              <View style={styles.bacakSol} />
              <View style={styles.bacakSag} />
              <View style={styles.ayakSol} />
              <View style={styles.ayakSag} />
            </View>
          )}

          {avatarGlbPath ? (
            <View style={styles.glbBilgi}>
              <Text style={styles.glbIkon}>📦</Text>
              <Text style={[styles.glbAd, { color: renkler.metin }]}>avatar.glb</Text>
              <Text style={[styles.glbAlt, { color: renkler.metin2 }]}>
                {dil === 'en' ? '3D model loaded' : '3D model yüklendi'}
              </Text>
            </View>
          ) : (
            <Text style={[styles.avatarAciklama, { color: renkler.metin2 }]}>
              {dil === 'en'
                ? 'Upload a .glb file to use a 3D avatar in outfit suggestions.'
                : 'Kombin önerilerinde 3D avatar kullanmak için .glb dosyası yükle.'}
            </Text>
          )}

          <View style={styles.avatarBtnGrup}>
            <TouchableOpacity
              style={[styles.avatarBtn, { backgroundColor: renkler.btnPrimary }]}
              onPress={glbSec}
              disabled={glbYukleniyor}
            >
              {glbYukleniyor
                ? <ActivityIndicator color={renkler.btnPrimaryMetin} size="small" />
                : <Text style={[styles.avatarBtnText, { color: renkler.btnPrimaryMetin }]}>
                    {avatarGlbPath
                      ? (dil === 'en' ? 'Change .glb' : '.glb Değiştir')
                      : (dil === 'en' ? 'Upload .glb' : '.glb Yükle')}
                  </Text>
              }
            </TouchableOpacity>
            {avatarGlbPath && (
              <TouchableOpacity
                style={[styles.avatarBtn, { backgroundColor: 'rgba(0,212,255,0.12)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.35)' }]}
                onPress={async () => {
                  setGlbYukleniyor(true);
                  await loadAvatarGlb(avatarGlbPath);
                  setGlbYukleniyor(false);
                  setViewer3D(true);
                }}
                disabled={glbYukleniyor}
              >
                <Text style={[styles.avatarBtnText, { color: '#00D4FF' }]}>
                  {dil === 'en' ? '▶ Preview' : '▶ Önizle'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Cinsiyet */}
        <View style={[styles.bolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.bolumBaslik, { color: renkler.metin2 }]}>
            {dil === 'en' ? 'Gender' : 'Cinsiyet'}
          </Text>
          <View style={styles.chipGrup}>
            {[{ tr: 'Erkek', en: 'Male' }, { tr: 'Kadın', en: 'Female' }].map(c => (
              <TouchableOpacity
                key={c.tr}
                style={[styles.chip, { backgroundColor: renkler.chip, borderColor: renkler.sinir },
                  cinsiyet === c.tr && { backgroundColor: renkler.btnPrimary, borderColor: renkler.btnPrimary }
                ]}
                onPress={() => setCinsiyet(c.tr)}
              >
                <Text style={[styles.chipText, { color: renkler.metin2 },
                  cinsiyet === c.tr && { color: renkler.btnPrimaryMetin }
                ]}>
                  {dil === 'en' ? c.en : c.tr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ten Rengi */}
        <View style={[styles.bolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.bolumBaslik, { color: renkler.metin2 }]}>
            {dil === 'en' ? 'Skin Tone' : 'Ten Rengi'}
          </Text>
          <View style={styles.renkGrup}>
            {TEN_RENKLERI.map(r => (
              <TouchableOpacity
                key={r.renk}
                style={[styles.renkDaire, { backgroundColor: r.renk },
                  tenRengi === r.renk && styles.renkSecili
                ]}
                onPress={() => setTenRengi(r.renk)}
              >
                {tenRengi === r.renk && <Text style={styles.renkTik}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Saç Rengi */}
        <View style={[styles.bolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.bolumBaslik, { color: renkler.metin2 }]}>
            {dil === 'en' ? 'Hair Color' : 'Saç Rengi'}
          </Text>
          <View style={styles.renkGrup}>
            {SAC_RENKLERI.map(r => (
              <TouchableOpacity
                key={r.renk}
                style={[styles.renkDaire, { backgroundColor: r.renk },
                  sacRengi === r.renk && styles.renkSecili
                ]}
                onPress={() => setSacRengi(r.renk)}
              >
                {sacRengi === r.renk && <Text style={[styles.renkTik, { color: '#FFFFFF' }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Göz Rengi */}
        <View style={[styles.bolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.bolumBaslik, { color: renkler.metin2 }]}>
            {dil === 'en' ? 'Eye Color' : 'Göz Rengi'}
          </Text>
          <View style={styles.renkGrup}>
            {GOZ_RENKLERI.map(r => (
              <TouchableOpacity
                key={r.renk}
                style={[styles.renkDaire, { backgroundColor: r.renk },
                  gozRengi === r.renk && styles.renkSecili
                ]}
                onPress={() => setGozRengi(r.renk)}
              >
                {gozRengi === r.renk && <Text style={[styles.renkTik, { color: '#FFFFFF' }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Boy & Kilo */}
        <View style={[styles.bolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.bolumBaslik, { color: renkler.metin2 }]}>
            {dil === 'en' ? 'Measurements' : 'Ölçüler'}
          </Text>
          <View style={styles.olcuSatir}>
            <View style={styles.olcuInput}>
              <Text style={[styles.olcuLabel, { color: renkler.metin2 }]}>
                {dil === 'en' ? 'Height (cm)' : 'Boy (cm)'}
              </Text>
              <TextInput
                style={[styles.input, { color: renkler.metin, borderBottomColor: renkler.sinir }]}
                value={boy}
                onChangeText={(v) => setBoy(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={3}
                placeholderTextColor={renkler.metin2}
              />
            </View>
            <View style={styles.olcuInput}>
              <Text style={[styles.olcuLabel, { color: renkler.metin2 }]}>
                {dil === 'en' ? 'Weight (kg)' : 'Kilo (kg)'}
              </Text>
              <TextInput
                style={[styles.input, { color: renkler.metin, borderBottomColor: renkler.sinir }]}
                value={kilo}
                onChangeText={(v) => setKilo(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={3}
                placeholderTextColor={renkler.metin2}
              />
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {avatarGlbUri && viewer3D && (
        <ThreeDViewer
          visible={viewer3D}
          glbUrl={avatarGlbUri}
          baslik={dil === 'en' ? '3D Avatar' : '3D Avatarım'}
          onKapat={() => setViewer3D(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:             { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 0.5,
  },
  geri:                  { fontSize: 16 },
  baslik:                { fontSize: 17, fontWeight: '600' },
  kaydetBtn:             { fontSize: 16, fontWeight: '600' },
  liste:                 { flex: 1 },
  bolumEtiket: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    marginHorizontal: 20, marginTop: 20, marginBottom: 6,
  },
  fotoBolum: {
    marginHorizontal: 16, marginBottom: 4, borderRadius: 14, padding: 24,
    borderWidth: 0.5, alignItems: 'center', gap: 14,
  },
  profilFoto:            { width: 100, height: 100, borderRadius: 50 },
  profilFotoPlaceholder: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  profilFotoIcon:        { fontSize: 42 },
  fotoBtnGrup:           { flexDirection: 'row', gap: 10 },
  fotoBtn:               { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  fotoBtnText:           { fontSize: 14, fontWeight: '500' },
  fotoCikar:             { color: '#FF3B30', fontSize: 13 },
  avatarBolum: {
    marginHorizontal: 16, marginBottom: 4, borderRadius: 14, padding: 20,
    borderWidth: 0.5, alignItems: 'center', gap: 14,
  },
  avatarWrap:            { width: 90, height: 160, position: 'relative' },
  sac:                   { position: 'absolute', top: 0, left: 22, width: 56, height: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  bas:                   { position: 'absolute', top: 8, left: 22, width: 56, height: 52, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  gozlerSatir:           { flexDirection: 'row', gap: 10, marginBottom: 6 },
  goz:                   { width: 8, height: 8, borderRadius: 4 },
  agiz:                  { width: 16, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.2)' },
  boyun:                 { position: 'absolute', top: 57, left: 43, width: 14, height: 10 },
  govde:                 { position: 'absolute', top: 65, left: 20, width: 60, height: 55, borderRadius: 6, backgroundColor: '#4A90D9' },
  kolSol:                { position: 'absolute', top: 67, left: 4,  width: 18, height: 45, borderRadius: 8, backgroundColor: '#4A90D9' },
  kolSag:                { position: 'absolute', top: 67, right: 4, width: 18, height: 45, borderRadius: 8, backgroundColor: '#4A90D9' },
  bacakSol:              { position: 'absolute', top: 118, left: 20, width: 26, height: 45, borderRadius: 6, backgroundColor: '#2C3E50' },
  bacakSag:              { position: 'absolute', top: 118, left: 54, width: 26, height: 45, borderRadius: 6, backgroundColor: '#2C3E50' },
  ayakSol:               { position: 'absolute', top: 160, left: 16, width: 30, height: 10, borderRadius: 4, backgroundColor: '#1A1A1A' },
  ayakSag:               { position: 'absolute', top: 160, left: 50, width: 30, height: 10, borderRadius: 4, backgroundColor: '#1A1A1A' },
  glbBilgi:     { alignItems: 'center', gap: 4 },
  glbIkon:      { fontSize: 36 },
  glbAd:        { fontSize: 15, fontWeight: '600' },
  glbAlt:       { fontSize: 12 },
  avatarAciklama: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  avatarBtnGrup:  { flexDirection: 'row', gap: 10 },
  avatarBtn:      { paddingHorizontal: 22, paddingVertical: 11, borderRadius: 22, minWidth: 110, alignItems: 'center' },
  avatarBtnText:  { fontSize: 14, fontWeight: '600' },
  bolum: {
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, padding: 18, borderWidth: 0.5,
  },
  bolumBaslik:           { fontSize: 13, marginBottom: 12 },
  chipGrup:              { flexDirection: 'row', gap: 8 },
  chip:                  { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 0.5 },
  chipText:              { fontSize: 14 },
  renkGrup:              { flexDirection: 'row', gap: 12 },
  renkDaire:             { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEEEEE' },
  renkSecili:            { borderWidth: 3, borderColor: '#000000' },
  renkTik:               { fontSize: 16, color: '#000000', fontWeight: 'bold' },
  olcuSatir:             { flexDirection: 'row', gap: 16 },
  olcuInput:             { flex: 1 },
  olcuLabel:             { fontSize: 12, marginBottom: 8 },
  input:                 { fontSize: 18, fontWeight: '600', borderBottomWidth: 0.5, paddingVertical: 8, textAlign: 'center' },
});