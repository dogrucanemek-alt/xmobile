import { Text, View, StyleSheet, StatusBar, TouchableOpacity, Alert, Modal, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../lib/context';
import { useAuth } from '../lib/authContext';
import { ONBOARDING_KEY } from './onboarding';

const CYAN = '#00D4FF';
const KVKK_KEY = 'xmobile_kvkk_onay';

export default function Index() {
  const router = useRouter();
  const { t, renkler, temaToggle, dil, dilDegistir, karanlik } = useApp();
  const { session, yukleniyor } = useAuth();
  const [kvkkGoster, setKvkkGoster] = useState(false);

  useEffect(() => {
    if (yukleniyor) return;
    AsyncStorage.multiGet([KVKK_KEY, ONBOARDING_KEY]).then(([kvkk, onb]) => {
      if (!kvkk[1]) { setKvkkGoster(true); return; }
      if (!onb[1])  { router.replace('/onboarding'); return; }
      if (!session) { router.replace('/login' as any); }
    });
  }, [yukleniyor, session]);

  const kvkkKabul = async () => {
    await AsyncStorage.setItem(KVKK_KEY, 'true');
    setKvkkGoster(false);
    const onb = await AsyncStorage.getItem(ONBOARDING_KEY);
    if (!onb) { router.replace('/onboarding'); return; }
    if (!session) { router.replace('/login' as any); }
  };

  const kvkkReddet = () => {
    Alert.alert(
      dil === 'en' ? 'Required' : 'Zorunlu',
      dil === 'en'
        ? 'You must accept to use the app.'
        : 'Uygulamayı kullanmak için onay gereklidir.',
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: renkler.bg }]}>
      <StatusBar barStyle={renkler.statusBar} backgroundColor={renkler.bg} />

      <Modal visible={kvkkGoster} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.kvkkModal, { backgroundColor: renkler.bg }]}>
          <Text style={[styles.kvkkBaslik, { color: renkler.metin }]}>
            {dil === 'en' ? '🔒 Privacy & Terms' : '🔒 Gizlilik ve Kullanım Koşulları'}
          </Text>
          <ScrollView style={styles.kvkkScroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.kvkkMetin, { color: renkler.metin2 }]}>
              {dil === 'en'
                ? `Welcome to xmobile!\n\nBefore you begin, please read and accept our Privacy Policy and Terms of Use.\n\n• We collect your wardrobe photos and style preferences to provide AI outfit recommendations.\n• Your data is stored securely on your device and our servers.\n• We never sell your personal data to third parties.\n• AI analysis is performed via encrypted API calls.\n• You may delete your account and all data at any time.\n\nBy continuing, you agree to our Privacy Policy and Terms of Use in accordance with KVKK (Turkish Personal Data Protection Law) and GDPR.`
                : `xmobile'a hoş geldiniz!\n\nDevam etmeden önce lütfen Gizlilik Politikamızı ve Kullanım Koşullarımızı okuyup kabul edin.\n\n• Gardırop fotoğraflarınızı ve stil tercihlerinizi AI kombin önerileri sunmak için kullanıyoruz.\n• Verileriniz cihazınızda ve sunucularımızda güvenli şekilde saklanır.\n• Kişisel verileriniz asla üçüncü taraflarla paylaşılmaz.\n• AI analizi şifreli API bağlantıları üzerinden gerçekleştirilir.\n• Hesabınızı ve tüm verilerinizi istediğiniz zaman silebilirsiniz.\n\nDevam ederek KVKK (Kişisel Verilerin Korunması Kanunu) kapsamındaki Gizlilik Politikamızı ve Kullanım Koşullarımızı kabul etmiş olursunuz.`}
            </Text>
            <TouchableOpacity onPress={() => router.push('/privacy' as any)}>
              <Text style={[styles.kvkkLink, { color: CYAN }]}>
                {dil === 'en' ? '→ View Privacy Policy' : '→ Gizlilik Politikasını Görüntüle'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={styles.kvkkButonlar}>
            <TouchableOpacity style={[styles.kvkkRedBtn, { borderColor: renkler.sinir }]} onPress={kvkkReddet}>
              <Text style={[styles.kvkkRedBtnText, { color: renkler.metin2 }]}>
                {dil === 'en' ? 'Decline' : 'Reddet'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.kvkkKabulBtn} onPress={kvkkKabul}>
              <Text style={styles.kvkkKabulBtnText}>
                {dil === 'en' ? 'Accept & Continue' : 'Kabul Et ve Devam Et'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sağ üst kontroller */}
      <View style={styles.ayarlar}>
        <TouchableOpacity style={[styles.ayarBtn, { borderColor: renkler.sinir }]} onPress={temaToggle}>
          <Text style={{ fontSize: 15 }}>{karanlik ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
        <View style={[styles.dilSecici, { borderColor: renkler.sinir }]}>
          {(['tr', 'en'] as const).map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.dilBtn, dil === d && { backgroundColor: CYAN }]}
              onPress={() => dilDegistir(d)}
            >
              <Text style={[styles.dilBtnText, { color: dil === d ? '#000' : renkler.metin2 }]}>
                {d.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logo */}
      <View style={styles.logoBlok}>
        <View style={styles.xKutu}>
          <Text style={styles.xHarf}>X</Text>
        </View>
        <Text style={[styles.marka, { color: renkler.metin }]}>XMOBILE</Text>
        <Text style={styles.altBaslik}>WARDROBE INTELLIGENCE</Text>
      </View>

      {/* Tagline */}
      <View style={styles.orta}>
        <Text style={[styles.tagline, { color: renkler.metin2 }]}>{t.tagline}</Text>
      </View>

      {/* Butonlar */}
      <View style={styles.alt}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => router.push('/wardrobe')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>{t.gardırobunuKur}</Text>
          <Text style={styles.btnArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnSecondary, { borderColor: renkler.sinir }]}
          onPress={() => router.push('/outfits')}
          activeOpacity={0.75}
        >
          <Text style={[styles.btnSecondaryText, { color: renkler.metin2 }]}>
            ✦ {t.kombinOnerisiAl}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnSecondary, { borderColor: renkler.sinir }]}
          onPress={() => router.push('/profile')}
          activeOpacity={0.75}
        >
          <Text style={[styles.btnSecondaryText, { color: renkler.metin2 }]}>
            ◎ {t.profilimDuzenle}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnSecondary, { borderColor: renkler.sinir }]}
          onPress={() => router.push('/import-model' as any)}
          activeOpacity={0.75}
        >
          <Text style={[styles.btnSecondaryText, { color: renkler.metin2 }]}>
            📦 3D Model İçe Aktar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/login' as any)}>
          <Text style={[styles.loginText, { color: renkler.metin2 }]}>
            {t.hesabınVarMı}{' '}
            <Text style={{ color: CYAN, fontWeight: '600' }}>{t.girisYap}</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/privacy' as any)}>
          <Text style={[styles.gizlilikText, { color: renkler.metin2 }]}>
            {dil === 'en' ? 'Privacy Policy' : 'Gizlilik Politikası'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, paddingHorizontal: 28 },
  ayarlar: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
    paddingTop: 60, gap: 10,
  },
  ayarBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  dilSecici:   { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  dilBtn:      { paddingHorizontal: 14, paddingVertical: 9 },
  dilBtnText:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  logoBlok:    { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 20 },
  xKutu: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  xHarf:       { fontSize: 40, fontWeight: '800', color: '#000', letterSpacing: -1 },
  marka:       { fontSize: 13, fontWeight: '800', letterSpacing: 5, marginBottom: 4 },
  altBaslik:   { fontSize: 9, letterSpacing: 4, color: 'rgba(255,255,255,0.35)' },

  orta:        { flex: 1, justifyContent: 'center' },
  tagline:     { fontSize: 15, lineHeight: 25, textAlign: 'center' },

  alt:         { flex: 1, justifyContent: 'center', gap: 10, paddingBottom: 20 },
  btnPrimary: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 17, paddingHorizontal: 28, borderRadius: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: '#000', letterSpacing: 0.3 },
  btnArrow:       { fontSize: 20, color: '#000' },
  btnSecondary: {
    paddingVertical: 15, borderRadius: 50,
    alignItems: 'center', borderWidth: 1,
  },
  btnSecondaryText: { fontSize: 14, fontWeight: '500' },
  loginText:        { textAlign: 'center', fontSize: 13, marginTop: 4 },
  gizlilikText:     { textAlign: 'center', fontSize: 11, marginTop: 2, textDecorationLine: 'underline' },
  kvkkModal:    { flex: 1, padding: 28, paddingTop: 60 },
  kvkkBaslik:   { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  kvkkScroll:   { flex: 1 },
  kvkkMetin:    { fontSize: 14, lineHeight: 22, marginBottom: 16 },
  kvkkLink:     { fontSize: 13, fontWeight: '600', marginBottom: 32, textDecorationLine: 'underline' },
  kvkkButonlar: { flexDirection: 'row', gap: 12, paddingBottom: 24 },
  kvkkRedBtn:   { flex: 1, paddingVertical: 16, borderRadius: 50, alignItems: 'center', borderWidth: 1 },
  kvkkRedBtnText:   { fontSize: 15, fontWeight: '600' },
  kvkkKabulBtn: { flex: 2, paddingVertical: 16, borderRadius: 50, alignItems: 'center', backgroundColor: CYAN },
  kvkkKabulBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
});
