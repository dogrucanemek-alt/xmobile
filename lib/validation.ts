import { z } from 'zod';

// Kıyafet validation
export const KiyafetSchema = z.object({
  id: z.number().int().positive(),
  ad: z.string().min(1).max(100),
  tur: z.enum(['Üst', 'Alt', 'Dış Giyim', 'Ayakkabı', 'Aksesuar']),
  altTur: z.enum(['Şapka', 'Kravat', 'Atkı', 'Saat', 'Kemer', 'Gözlük', 'Çanta', 'Takı', 'Eldiven', 'Diğer']).optional(),
  sezon: z.enum(['Tüm Sezon', 'İlkbahar', 'Yaz', 'Sonbahar', 'Kış']),
  foto: z.string().url().nullable().optional(),
  renk: z.string().max(50).optional(),
  fiyat: z.number().positive().optional(),
  satinamlaTarihi: z.string().datetime().optional(),
});

export type KiyafetValidated = z.infer<typeof KiyafetSchema>;

// Profil validation
export const ProfilSchema = z.object({
  tenRengi: z.string().regex(/^#[0-9A-F]{6}$/i),
  sacRengi: z.string().regex(/^#[0-9A-F]{6}$/i),
  gozRengi: z.string().regex(/^#[0-9A-F]{6}$/i),
  boy: z.string().min(1).max(10),
  kilo: z.string().min(1).max(10),
  cinsiyet: z.enum(['Erkek', 'Kadın']),
  profilFoto: z.string().url().nullable(),
  sacStili: z.enum(['kisa', 'orta', 'uzun']).optional(),
  sakal: z.enum(['yok', 'var']).optional(),
  avatarUrl: z.string().url().optional(),
  avatarGlbPath: z.string().optional(),
});

export type ProfilValidated = z.infer<typeof ProfilSchema>;

// Kombin validation
export const KombinSchema = z.object({
  baslik: z.string().min(1).max(100),
  tur: z.enum(['Üst', 'Alt', 'Dış Giyim', 'Ayakkabı', 'Aksesuar']),
  parcalar: z.array(z.string()).min(1).max(10),
  neden: z.string().min(1).max(500),
  favori: z.boolean().optional(),
});

export type KombinValidated = z.infer<typeof KombinSchema>;

// HavaDurumu validation
export const HavaDurumuSchema = z.object({
  derece: z.number().min(-50).max(60),
  durum: z.string().min(1).max(50),
  nem: z.number().min(0).max(100),
  hissedilen: z.number().min(-50).max(60),
});

export type HavaDurumuValidated = z.infer<typeof HavaDurumuSchema>;

// KombinKayit validation
export const KombinKayitSchema = z.object({
  id: z.string().uuid().optional(),
  tarih: z.string().datetime(),
  kombin: KombinSchema,
  favori: z.boolean(),
  hava: z.object({
    derece: z.number(),
    durum: z.string(),
  }).optional(),
});

export type KombinKayitValidated = z.infer<typeof KombinKayitSchema>;

// MeshyGorev validation
export const MeshyGorevSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'SUCCEEDED', 'FAILED', 'EXPIRED']),
  glbUrl: z.string().url().optional(),
  progress: z.number().min(0).max(100).optional(),
});

export type MeshyGorevValidated = z.infer<typeof MeshyGorevSchema>;

// MeshyCacheGirdisi validation
export const MeshyCacheGirdisiSchema = z.object({
  glbUrl: z.string().url(),
  olusturuldu: z.number().int().positive(),
});

export type MeshyCacheGirdisiValidated = z.infer<typeof MeshyCacheGirdisiSchema>;

// Utility function to safely parse with fallback
export function validateKiyafet(data: unknown): KiyafetValidated | null {
  try {
    return KiyafetSchema.parse(data);
  } catch (e) {
    return null;
  }
}

export function validateProfil(data: unknown): ProfilValidated | null {
  try {
    return ProfilSchema.parse(data);
  } catch (e) {
    return null;
  }
}

export function validateKombin(data: unknown): KombinValidated | null {
  try {
    return KombinSchema.parse(data);
  } catch (e) {
    return null;
  }
}

export function validateHavaDurumu(data: unknown): HavaDurumuValidated | null {
  try {
    return HavaDurumuSchema.parse(data);
  } catch (e) {
    return null;
  }
}

export function validateKombinKayit(data: unknown): KombinKayitValidated | null {
  try {
    return KombinKayitSchema.parse(data);
  } catch (e) {
    return null;
  }
}

export function validateMeshyGorev(data: unknown): MeshyGorevValidated | null {
  try {
    return MeshyGorevSchema.parse(data);
  } catch (e) {
    return null;
  }
}

export function validateMeshyCacheGirdisi(data: unknown): MeshyCacheGirdisiValidated | null {
  try {
    return MeshyCacheGirdisiSchema.parse(data);
  } catch (e) {
    return null;
  }
}

// Array validators
export function validateKiyafetArray(data: unknown): KiyafetValidated[] {
  try {
    return z.array(KiyafetSchema).parse(data);
  } catch (e) {
    return [];
  }
}

export function validateKombinKayitArray(data: unknown): KombinKayitValidated[] {
  try {
    return z.array(KombinKayitSchema).parse(data);
  } catch (e) {
    return [];
  }
}
