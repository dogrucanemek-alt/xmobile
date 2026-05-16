import { Text, View, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../lib/context';
import { useAuth } from '../lib/authContext';
import { ONBOARDING_KEY } from './onboarding';

const KVKK_KEY = 'xmobile_kvkk_onay';
// Store'a göndermeden önce false yap
const DEV_SKIP_LOGIN = true;

export default function Index() {
  const router = useRouter();
  const { renkler } = useApp();
  const { session, yukleniyor } = useAuth();

  useEffect(() => {
    if (yukleniyor) return;
    // LegalCheck (_layout.tsx) zaten /legal'e yönlendiriyor; buraya ulaşıldıysa onaylanmış demektir.
    // Sadece legacy migration ve sonraki ekrana yönlendirme.
    AsyncStorage.multiGet([KVKK_KEY, ONBOARDING_KEY, 'legal_agreed']).then(([kvkk, onb, legal]) => {
      if (legal[1] && !kvkk[1]) AsyncStorage.setItem(KVKK_KEY, 'true').catch(() => {});
      if (!onb[1])  { router.replace('/onboarding'); return; }
      if (!session && !__DEV__ && !DEV_SKIP_LOGIN) { router.replace('/login' as any); return; }
      router.replace('/outfits' as any);
    });
  }, [yukleniyor, session]);

  return (
    <View style={[styles.container, { backgroundColor: renkler.bg }]}>
      <StatusBar barStyle={renkler.statusBar} backgroundColor={renkler.bg} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
