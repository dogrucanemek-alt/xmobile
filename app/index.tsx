import { Text, View, StyleSheet, StatusBar, TouchableOpacity, Modal, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../lib/context';
import { useAuth } from '../lib/authContext';
import { ONBOARDING_KEY } from './onboarding';

const CYAN = '#00D4FF';
const KVKK_KEY = 'xmobile_kvkk_onay';
// Store'a göndermeden önce false yap
const DEV_SKIP_LOGIN = true;

export default function Index() {
  const router = useRouter();
  const { renkler, dil } = useApp();
  const { session, yukleniyor } = useAuth();
  const [kvkkGoster, setKvkkGoster] = useState(false);

  useEffect(() => {
    if (yukleniyor) return;
    AsyncStorage.multiGet([KVKK_KEY, ONBOARDING_KEY]).then(([kvkk, onb]) => {
      if (!kvkk[1]) { setKvkkGoster(true); return; }
      if (!onb[1])  { router.replace('/onboarding'); return; }
      if (!session && !__DEV__ && !DEV_SKIP_LOGIN) { router.replace('/login' as any); return; }
      router.replace('/outfits' as any);
    });
  }, [yukleniyor, session]);

  const kvkkKabul = async () => {
    await AsyncStorage.setItem(KVKK_KEY, 'true');
    setKvkkGoster(false);
    const onb = await AsyncStorage.getItem(ONBOARDING_KEY);
    if (!onb) { router.replace('/onboarding'); return; }
    if (!session && !__DEV__ && !DEV_SKIP_LOGIN) { router.replace('/login' as any); return; }
    router.replace('/outfits' as any);
  };

  const kvkkReddet = () => {
    Alert.alert(
      dil === 'en' ? 'Required' : 'Zorunlu',
      dil === 'en' ? 'You must accept to use the app.' : 'Uygulamayı kullanmak için onay gereklidir.',
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: renkler.bg }]}>
      <StatusBar barStyle={renkler.statusBar} backgroundColor={renkler.bg} />

      <Modal visible={kvkkGoster} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
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
