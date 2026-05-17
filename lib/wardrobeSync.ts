import { supabase } from './supabase';
import * as FileSystem from './fileSystem';
import type { Kiyafet } from './types';

const BUCKET = 'wardrobe-photos';

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function fotoYukle(userId: string, id: number, localUri: string): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
    const bytes = base64ToUint8Array(base64);
    const path = `${userId}/${id}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
    if (error) {
      // Sessiz fail kullanıcının data loss riskine sebep oluyordu — log + telemetri
      console.warn('[wardrobeSync] Storage upload failed:', error.message, 'path:', path);
      return null;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.warn('[wardrobeSync] fotoYukle exception:', e);
    return null;
  }
}

export async function syncYukle(userId: string): Promise<Kiyafet[]> {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map(r => ({
    id: r.item_id,
    ad: r.ad,
    tur: r.tur,
    altTur: r.alt_tur ?? undefined,
    sezon: r.sezon,
    foto: r.foto_url ?? null,
    fiyat: r.fiyat ?? undefined,
  }));
}

export async function syncKaydet(userId: string, k: Kiyafet): Promise<void> {
  let fotoUrl = k.foto;
  if (fotoUrl && (fotoUrl.startsWith('file://') || fotoUrl.startsWith('content://'))) {
    const uploaded = await fotoYukle(userId, k.id, fotoUrl);
    if (uploaded) {
      fotoUrl = uploaded;
    } else {
      // Upload başarısız: geçersiz local path'i DB'ye yazma
      // (başka cihazda/sandbox'ta bu path bulunamaz)
      fotoUrl = null;
    }
  }
  await supabase.from('wardrobe_items').upsert({
    item_id: k.id,
    user_id: userId,
    ad: k.ad,
    tur: k.tur,
    alt_tur: k.altTur ?? null,
    sezon: k.sezon,
    foto_url: fotoUrl ?? null,
    fiyat: k.fiyat ?? null,
  }, { onConflict: 'item_id,user_id' });
}

export async function syncSil(userId: string, id: number): Promise<void> {
  await supabase.from('wardrobe_items').delete().eq('item_id', id).eq('user_id', userId);
  await supabase.storage.from(BUCKET).remove([`${userId}/${id}.jpg`]);
}

export async function syncTumunuYukle(userId: string, kiyafetler: Kiyafet[]): Promise<void> {
  for (const k of kiyafetler) {
    await syncKaydet(userId, k);
  }
}

/**
 * Bucket eksikliği gibi geçmiş upload fail'leri sonrası DB'de foto_url=null kalan
 * kıyafetleri, cihazda hâlâ lokal kopya varsa yeniden Storage'a yükle.
 * Wardrobe ilk açılışta best-effort çağrılır — fail olursa sessizce devam.
 */
export async function syncBackfillFotos(userId: string, kiyafetler: Kiyafet[]): Promise<number> {
  let basarili = 0;
  for (const k of kiyafetler) {
    if (!k.foto) continue;
    // Sadece henüz Storage'a yüklenmemiş lokal path'ler için
    if (k.foto.startsWith('http')) continue;
    if (!k.foto.startsWith('file://') && !k.foto.startsWith('content://')) continue;
    try {
      const uploaded = await fotoYukle(userId, k.id, k.foto);
      if (uploaded) {
        await supabase.from('wardrobe_items')
          .update({ foto_url: uploaded })
          .eq('item_id', k.id)
          .eq('user_id', userId);
        basarili++;
      }
    } catch (e) {
      console.warn('[wardrobeSync] backfill failed for item', k.id, e);
    }
  }
  return basarili;
}
