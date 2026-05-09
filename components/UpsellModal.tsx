import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface UpsellModalProps {
  visible: boolean;
  onKapat: () => void;
  aylikKullanim?: number;
  limit?: number;
  dil?: 'tr' | 'en';
}

export default function UpsellModal({ visible, onKapat, aylikKullanim, limit, dil = 'tr' }: UpsellModalProps) {
  const router = useRouter();
  const temel = limit !== undefined && limit > 0;
  const tr = dil === 'tr';

  const proGec = () => {
    onKapat();
    router.push('/subscription' as any);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.kart}>
          <Text style={styles.icon}>🧊</Text>
          <Text style={styles.baslik}>{tr ? '3D Görüntüleme' : '3D Visualization'}</Text>
          <Text style={styles.baslik2}>{tr ? 'PRO ÖZELLİĞİ' : 'PRO FEATURE'}</Text>

          {temel ? (
            <Text style={styles.aciklama}>
              {tr
                ? `Bu ay ${aylikKullanim}/${limit} 3D modelini kullandın.\nSınırsız 3D için Pro'ya geç.`
                : `You've used ${aylikKullanim}/${limit} 3D models this month.\nUpgrade to Pro for unlimited 3D.`}
            </Text>
          ) : (
            <Text style={styles.aciklama}>
              {tr
                ? 'Kıyafetlerini gerçek zamanlı döndürülebilir 3D modellerle görselleştir.\n\nÜcretsiz planda bu özellik mevcut değil.'
                : 'Visualize your clothes with real-time rotatable 3D models.\n\nThis feature is not available on the free plan.'}
            </Text>
          )}

          <View style={styles.ozellikler}>
            {(tr
              ? ['Sınırsız 3D model', 'Sınırsız sanal deneme', 'Öncelikli kombin önerisi']
              : ['Unlimited 3D models', 'Unlimited virtual try-on', 'Priority outfit suggestions']
            ).map(o => (
              <View key={o} style={styles.ozellikSatir}>
                <Text style={styles.ozellikIkon}>✓</Text>
                <Text style={styles.ozellikText}>{o}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.proBtn} onPress={proGec}>
            <Text style={styles.proBtnText}>{tr ? "Pro'ya Geç →" : 'Upgrade to Pro →'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onKapat} style={styles.iptalBtn}>
            <Text style={styles.iptalText}>{tr ? 'Şimdi değil' : 'Not now'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  kart: {
    backgroundColor: '#0A0A14', borderRadius: 24,
    padding: 28, alignItems: 'center', width: '100%',
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)',
  },
  icon:       { fontSize: 44, marginBottom: 12 },
  baslik:     { color: '#fff', fontSize: 20, fontWeight: '700' },
  baslik2:    { color: '#00D4FF', fontSize: 11, fontWeight: '600', letterSpacing: 2, marginTop: 4, marginBottom: 16 },
  aciklama:   { color: 'rgba(255,255,255,0.55)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  ozellikler: { alignSelf: 'stretch', marginBottom: 24, gap: 10 },
  ozellikSatir: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ozellikIkon:  { color: '#00D4FF', fontSize: 14, fontWeight: '700', width: 18 },
  ozellikText:  { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  proBtn: {
    backgroundColor: '#00D4FF', borderRadius: 50,
    paddingVertical: 14, paddingHorizontal: 40, width: '100%', alignItems: 'center',
    marginBottom: 12,
  },
  proBtnText:  { color: '#000', fontSize: 16, fontWeight: '700' },
  iptalBtn:    { paddingVertical: 8 },
  iptalText:   { color: 'rgba(255,255,255,0.3)', fontSize: 13 },
});
