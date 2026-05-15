import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { useApp } from '../lib/context';

export default function Legal() {
  const router = useRouter();
  const { t } = useApp();
  const [agreed, setAgreed] = useState(false);

  const handleAgree = async () => {
    if (!agreed) {
      Alert.alert(
        t('Dikkat'),
        t('Gizlilik Politikasını ve Şartlarını kabul etmelisin'),
        [{ text: 'Tamam', onPress: () => {} }]
      );
      return;
    }
    await AsyncStorage.setItem('legal_agreed', 'true');
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>xmobile</Text>
          <Text style={styles.version}>v1.2.0</Text>
        </View>

        {/* Privacy Policy */}
        <View style={styles.section}>
          <Text style={styles.title}>📋 {t('Gizlilik Politikası')}</Text>
          <Text style={styles.text}>
            {t('xmobile uygulaması, kişisel verilerinizi korur. Kıyafet bilgileri, kombin geçmişi ve profil verileriniz sadece sizin görebilirsiniz.')}{'\n\n'}
            {t('Verileri üçüncü şahıslarla (reklam şirketleri, vb.) paylaşmayız. Sadece hizmet sağlamak için Supabase veri tabanında tutarız.')}{'\n\n'}
            {t('İstediğiniz zaman hesabınızı ve tüm verilerinizi silebilirsiniz.')}
          </Text>
        </View>

        {/* Terms of Service */}
        <View style={styles.section}>
          <Text style={styles.title}>⚖️ {t('Kullanım Şartları')}</Text>
          <Text style={styles.text}>
            {t('1. Bu uygulamayı sadece kişisel, yasal amaçlar için kullanabilirsiniz.')}{'\n\n'}
            {t('2. Diğer kullanıcıların verilerine erişmeye veya değiştirmeye çalışamazsınız.')}{'\n\n'}
            {t('3. Yasadışı, müstehcen veya kötü niyetli içerik yüklemeyin.')}{'\n\n'}
            {t('4. Uygulamayı ters mühendislik, hack veya spam amaçlı kullanmayın.')}{'\n\n'}
            {t('5. Hesabınızın güvenliği sizin sorumluluğunuzdadır.')}
          </Text>
        </View>

        {/* KVKK */}
        <View style={styles.section}>
          <Text style={styles.title}>✅ {t('KVKK Onayı')}</Text>
          <Text style={styles.text}>
            {t('Kişisel Verileri Koruma Kanunu (KVKK) uyarınca, aşağıdakileri onaylıyorum:')}{'\n\n'}
            {t('• Adım, email, profil fotoğrafı gibi temel verilerim işlenmesine izin veriyorum')}{'\n\n'}
            {t('• Gardırop ve kombin verilerim güvenli bir şekilde saklanmasına izin veriyorum')}{'\n\n'}
            {t('• Supabase tarafından host edilmesine onay veriyorum')}{'\n\n'}
            {t('• Istediğim zaman verilerimin silinmesini talep edebileceğimi biliyorum')}
          </Text>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.title}>📧 {t('İletişim')}</Text>
          <Text style={styles.text}>
            {t('Gizlilik hakkında sorularınız için: dogrucanemek@gmail.com')}
          </Text>
        </View>
      </ScrollView>

      {/* Checkbox & Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.checkbox, agreed && styles.checkboxChecked]}
          onPress={() => setAgreed(!agreed)}
          accessible={true}
          accessibilityLabel={t('Şartları kabul et')}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
        >
          <Text style={styles.checkboxText}>{agreed ? '✓' : ''}</Text>
        </TouchableOpacity>
        <Text style={styles.checkboxLabel}>
          {t('Tüm şartları kabul ediyorum')}
        </Text>

        <TouchableOpacity
          style={[styles.button, !agreed && styles.buttonDisabled]}
          disabled={!agreed}
          onPress={handleAgree}
          accessible={true}
          accessibilityLabel={t('Devam Et')}
          accessibilityRole="button"
          accessibilityState={{ disabled: !agreed }}
        >
          <Text style={styles.buttonText}>{t('Devam Et')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060606',
    paddingBottom: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00D4FF',
    fontFamily: 'Cormorant Garamond',
  },
  version: {
    fontSize: 12,
    color: '#7a7484',
    marginTop: 4,
  },
  section: {
    marginBottom: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5F0E8',
    marginBottom: 12,
    fontFamily: 'Space Grotesk',
  },
  text: {
    fontSize: 14,
    color: '#bbb',
    lineHeight: 22,
    fontFamily: 'Space Grotesk',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,212,255,0.1)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#00D4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  checkboxChecked: {
    backgroundColor: '#00D4FF',
  },
  checkboxText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    color: '#bbb',
    fontSize: 14,
    marginBottom: 16,
    fontFamily: 'Space Grotesk',
  },
  button: {
    backgroundColor: '#00D4FF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Space Grotesk',
  },
});
