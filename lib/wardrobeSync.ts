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
    if (error) return null;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch {
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
    sezon: r.sezon,
    foto: r.foto_url ?? null,
    fiyat: r.fiyat ?? undefined,
  }));
}

export async function syncKaydet(userId: string, k: Kiyafet): Promise<void> {
  let fotoUrl = k.foto;
  if (fotoUrl && (fotoUrl.startsWith('file://') || fotoUrl.startsWith('content://'))) {
    const uploaded = await fotoYukle(userId, k.id, fotoUrl);
    if (uploaded) fotoUrl = uploaded;
  }
  await supabase.from('wardrobe_items').upsert({
    item_id: k.id,
    user_id: userId,
    ad: k.ad,
    tur: k.tur,
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
