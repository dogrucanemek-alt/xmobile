import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useApp } from '../lib/context';

const CYAN = '#00D4FF';

export default function Login() {
  const router = useRouter();
  const { renkler, dil } = useApp();
  const [email, setEmail]         = useState('');
  const [gonderildi, setGonderildi] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  const tr = dil === 'tr';

  // Magic link tıklandıktan sonra session gelince ana ekrana geç
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace('/(tabs)/outfits' as any);
    });
    return () => subscription.unsubscribe();
  }, []);

  const magicLinkGonder = async () => {
    if (!email.trim()) return;
    setYukleniyor(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: 'xmobile://login',
      },
    });
    setYukleniyor(false);
    if (error) {
      Alert.alert(tr ? 'Hata' : 'Error', error.message);
    } else {
      setGonderildi(true);
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

      {/* Logo */}
      <View style={styles.logo}>
        <View style={styles.xKutu}>
          <Text style={styles.xHarf}>X</Text>
        </View>
        <Text style={[styles.marka, { color: renkler.metin }]}>XMOBILE</Text>
      </View>

      {gonderildi ? (
        <View style={styles.onay}>
          <Text style={styles.onayIcon}>✉️</Text>
          <Text style={[styles.onayBaslik, { color: renkler.metin }]}>
            {tr ? 'E-postanı kontrol et' : 'Check your email'}
          </Text>
          <Text style={[styles.onayAlt, { color: renkler.metin2 }]}>
            {tr
              ? `${email} adresine giriş linki gönderdik.`
              : `We sent a login link to ${email}.`}
          </Text>
          <TouchableOpacity onPress={() => setGonderildi(false)} style={{ marginTop: 24 }}>
            <Text style={{ color: CYAN, fontSize: 14 }}>
              {tr ? 'Farklı e-posta dene' : 'Try different email'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={[styles.baslik, { color: renkler.metin }]}>
            {tr ? 'Giriş Yap' : 'Sign In'}
          </Text>
          <Text style={[styles.altBaslik, { color: renkler.metin2 }]}>
            {tr
              ? 'E-postanı gir, sana giriş linki gönderelim.'
              : 'Enter your email and we\'ll send you a login link.'}
          </Text>

          <TextInput
            style={[styles.input, {
              backgroundColor: renkler.kart,
              borderColor: renkler.sinir,
              color: renkler.metin,
            }]}
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
            onPress={magicLinkGonder}
            disabled={yukleniyor}
            activeOpacity={0.85}
          >
            {yukleniyor
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.btnPrimaryText}>
                  {tr ? 'Giriş Linki Gönder →' : 'Send Login Link →'}
                </Text>
            }
          </TouchableOpacity>

          <View style={styles.ayrac}>
            <View style={[styles.ayracCizgi, { backgroundColor: renkler.sinir }]} />
            <Text style={[styles.ayracText, { color: renkler.metin2 }]}>
              {tr ? 'veya' : 'or'}
            </Text>
            <View style={[styles.ayracCizgi, { backgroundColor: renkler.sinir }]} />
          </View>

          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={50}
              style={styles.appleBtn}
              onPress={appleIleGiris}
            />
          )}
        </View>
      )}
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

  ayrac:        { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  ayracCizgi:   { flex: 1, height: 1 },
  ayracText:    { fontSize: 13, marginHorizontal: 16 },

  appleBtn:     { width: '100%', height: 56 },

  onay:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  onayIcon:     { fontSize: 56, marginBottom: 24 },
  onayBaslik:   { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  onayAlt:      { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
