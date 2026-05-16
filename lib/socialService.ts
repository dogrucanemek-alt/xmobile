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
  post_items?: PostItem[];
}

export interface PostItem {
  id?: string;
  post_id?: string;
  parca_adi: string;
  marka?: string | null;
  urun_url?: string | null;
  fiyat?: number | null;
  para_birimi?: string | null;
  affiliate_kod?: string | null;
  resim_url?: string | null;
  sira?: number;
}

export async function postItemsAl(postId: string): Promise<PostItem[]> {
  const { data, error } = await supabase
    .from('post_items')
    .select('*')
    .eq('post_id', postId)
    .order('sira', { ascending: true });
  if (error) return [];
  return (data ?? []) as PostItem[];
}

export async function postItemEkle(postId: string, item: PostItem): Promise<PostItem | null> {
  const { data, error } = await supabase
    .from('post_items')
    .insert({
      post_id: postId,
      parca_adi: item.parca_adi,
      marka: item.marka ?? null,
      urun_url: item.urun_url ?? null,
      fiyat: item.fiyat ?? null,
      para_birimi: item.para_birimi ?? 'TRY',
      affiliate_kod: item.affiliate_kod ?? null,
      resim_url: item.resim_url ?? null,
      sira: item.sira ?? 0,
    })
    .select()
    .maybeSingle();
  if (error) return null;
  return data as PostItem;
}

export async function postItemSil(itemId: string): Promise<void> {
  await supabase.from('post_items').delete().eq('id', itemId);
}

// URL'den marka adını çıkar (otomatik doldurma için)
export function markaAdiCikar(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').replace(/\.com.*$/i, '').replace(/\.com\.tr$/i, '');
    return host.charAt(0).toUpperCase() + host.slice(1);
  } catch {
    return '';
  }
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
  const { data: postsData, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  if (!postsData || postsData.length === 0) return [];

  // Profilleri ayrıca çek (posts→profiles direkt FK olmadığı için embed ambiguous)
  const userIds = Array.from(new Set(postsData.map((p: any) => p.user_id).filter(Boolean)));
  let profileMap = new Map<string, { display_name: string | null }>();
  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);
    profileMap = new Map((profilesData ?? []).map((p: any) => [p.id as string, { display_name: p.display_name }]));
  }

  // Post items (ürün linkleri) — paralel fetch
  const postIds = postsData.map((p: any) => p.id);
  let itemMap = new Map<string, PostItem[]>();
  if (postIds.length > 0) {
    const { data: itemsData } = await supabase
      .from('post_items')
      .select('*')
      .in('post_id', postIds);
    if (itemsData) {
      for (const it of itemsData as PostItem[]) {
        if (!it.post_id) continue;
        const list = itemMap.get(it.post_id) ?? [];
        list.push(it);
        itemMap.set(it.post_id, list);
      }
    }
  }

  return postsData.map((p: any) => ({
    ...p,
    profiles: profileMap.get(p.user_id) ?? null,
    post_items: itemMap.get(p.id) ?? [],
  })) as SocialPost[];
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
