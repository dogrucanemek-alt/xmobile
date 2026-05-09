import { supabase } from './supabase';

export interface SocialPost {
  id: string;
  user_id: string;
  baslik: string;
  tur: string | null;
  parcalar: string[];
  neden: string | null;
  gorsel_url: string | null;
  hava_derece: number | null;
  hava_durum: string | null;
  like_count: number;
  created_at: string;
  profiles?: { display_name: string | null } | null;
}

export async function profilEnsure(userId: string, email: string): Promise<void> {
  await supabase.from('profiles').upsert(
    { id: userId, display_name: email.split('@')[0] },
    { onConflict: 'id', ignoreDuplicates: true },
  );
}

async function gorselYukle(localUri: string, userId: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const path = `${userId}/${Date.now()}.png`;

  const { error } = await supabase.storage
    .from('outfit-posts')
    .upload(path, arrayBuffer, { contentType: 'image/png', upsert: false });

  if (error) throw new Error(error.message);
  return supabase.storage.from('outfit-posts').getPublicUrl(path).data.publicUrl;
}

export async function postOlustur(params: {
  userId: string;
  email: string;
  baslik: string;
  tur: string;
  parcalar: string[];
  neden: string;
  gorselUri: string | null;
  havaDerece?: number | null;
  havaDurum?: string | null;
}): Promise<void> {
  await profilEnsure(params.userId, params.email);

  let gorsel_url: string | null = null;
  if (params.gorselUri) {
    gorsel_url = await gorselYukle(params.gorselUri, params.userId);
  }

  const { error } = await supabase.from('posts').insert({
    user_id:     params.userId,
    baslik:      params.baslik,
    tur:         params.tur,
    parcalar:    params.parcalar,
    neden:       params.neden,
    gorsel_url,
    hava_derece: params.havaDerece ?? null,
    hava_durum:  params.havaDurum  ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function postListesiAl(limit = 20, offset = 0): Promise<SocialPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(display_name)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return (data ?? []) as SocialPost[];
}

export async function begeniToggle(postId: string, userId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
    await supabase.rpc('decrement_likes', { pid: postId });
    return false;
  } else {
    await supabase.from('likes').insert({ post_id: postId, user_id: userId });
    await supabase.rpc('increment_likes', { pid: postId });
    return true;
  }
}

export async function kullaniciBegendimi(postId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}
