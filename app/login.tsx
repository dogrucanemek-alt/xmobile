import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useApp } from '../lib/context';

const CYAN = '#00D4FF';
const DEV_SKIP_LOGIN = true; // Store'a göndermeden önce false yap

export default function Login() {
  const router = useRouter();
  const { renkler, dil } = useApp();
  const [email, setEmail]       = useState('');
  const [kod, setKod]           = useState('');
  const [kodGonderildi, setKodGonderildi] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  const tr = dil === 'tr';

  useEffect(() => {
    if (DEV_SKIP_LOGIN || __DEV__) {
      router.replace('/(tabs)/outfits' as any);
      return;
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace('/(tabs)/outfits' as any);
    });
    return () => subscription.unsubscribe();
  }, []);

  const kodGonder = async () => {
    if (!email.trim()) return;
    setYukleniyor(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setYukleniyor(false);
    if (error) {
      Alert.alert(tr ? 'Hata' : 'Error', error.message);
    } else {
      setKodGonderildi(true);
    }
  };

  const kodDogrula = async () => {
    if (kod.trim().length < 6) return;
    setYukleniyor(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: kod.trim(),
      type: 'email',
    });
    setYukleniyor(false);
    if (error) {
      Alert.alert(tr ? 'Hatalı Kod' : 'Invalid Code', tr ? 'Kodu kontrol et ve tekrar dene.' : 'Check the code and try again.');
    }
  };

  const appleIleGiris = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
      });
      if (error) Alert.alert(tr ? 'Hata' : 'Error', error.message);
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert(tr ? 'Hata' : 'Error', e.message);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: renkler.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={renkler.statusBar} backgroundColor={renkler.bg} />

      <View style={styles.logo}>
        <View style={styles.xKutu}>
          <Text style={styles.xHarf}>X</Text>
        </View>
        <Text style={[styles.marka, { color: renkler.metin }]}>XMOBILE</Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.baslik, { color: renkler.metin }]}>
          {tr ? 'Giriş Yap' : 'Sign In'}
        </Text>

        {Platform.OS === 'ios' ? (
          <>
            <Text style={[styles.altBaslik, { color: renkler.metin2 }]}>
              {tr ? 'Apple hesabınla güvenli giriş yap.' : 'Sign in securely with your Apple account.'}
            </Text>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={50}
              style={styles.appleBtn}
              onPress={appleIleGiris}
            />
          </>
        ) : kodGonderildi ? (
          <>
            <Text style={[styles.altBaslik, { color: renkler.metin2 }]}>
              {tr ? `${email} adresine 6 haneli kod gönderdik.` : `We sent a 6-digit code to ${email}.`}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: renkler.kart, borderColor: renkler.sinir, color: renkler.metin }]}
              placeholder={tr ? 'Doğrulama kodu' : 'Verification code'}
              placeholderTextColor={renkler.metin2}
              value={kod}
              onChangeText={setKod}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.btnPrimary, yukleniyor && { opacity: 0.7 }]}
              onPress={kodDogrula}
              disabled={yukleniyor}
              activeOpacity={0.85}
            >
              {yukleniyor
                ? <ActivityIndicator color="#000" />
                : <Text style={styles.btnPrimaryText}>{tr ? 'Giriş Yap →' : 'Sign In →'}</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setKodGonderildi(false); setKod(''); }} style={styles.geriBtn}>
              <Text style={{ color: CYAN, fontSize: 14 }}>
                {tr ? 'Farklı e-posta dene' : 'Try different email'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.altBaslik, { color: renkler.metin2 }]}>
              {tr ? 'E-postanı gir, sana kod gönderelim.' : 'Enter your email and we\'ll send you a code.'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: renkler.kart, borderColor: renkler.sinir, color: renkler.metin }]}
              placeholder={tr ? 'E-posta adresi' : 'Email address'}
              placeholderTextColor={renkler.metin2}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.btnPrimary, yukleniyor && { opacity: 0.7 }]}
              onPress={kodGonder}
              disabled={yukleniyor}
              activeOpacity={0.85}
            >
              {yukleniyor
                ? <ActivityIndicator color="#000" />
                : <Text style={styles.btnPrimaryText}>{tr ? 'Kod Gönder →' : 'Send Code →'}</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, paddingHorizontal: 28 },

  logo:         { alignItems: 'center', paddingTop: 100, marginBottom: 48 },
  xKutu: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  xHarf:        { fontSize: 36, fontWeight: '800', color: '#000' },
  marka:        { fontSize: 13, fontWeight: '800', letterSpacing: 5 },

  form:         { flex: 1 },
  baslik:       { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  altBaslik:    { fontSize: 15, lineHeight: 22, marginBottom: 32 },

  input: {
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 16,
    fontSize: 16, marginBottom: 16,
  },
  btnPrimary: {
    backgroundColor: CYAN, paddingVertical: 18,
    borderRadius: 50, alignItems: 'center', marginBottom: 24,
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: '#000' },

  appleBtn:     { width: '100%', height: 56 },
  geriBtn:      { alignItems: 'center', marginTop: 8 },
});
