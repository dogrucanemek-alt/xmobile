-- 008_wardrobe_photos_bucket.sql
-- KRİTİK BUG FIX: wardrobe-photos bucket'ı hiç oluşturulmamış, tüm kıyafet upload'ları sessizce
-- fail ediyor (wardrobeSync.ts return null). Kullanıcı cihazını kaybederse fotoğraflar uçar.
--
-- Bu migration:
--   1. 'wardrobe-photos' bucket'ı public read olarak oluşturur
--   2. RLS policy'leri ekler: user kendi klasörüne insert/update/delete edebilir, herkes okuyabilir
--   3. Mevcut wardrobe_items satırları için foto_url=null olanlar — kullanıcı yeniden upload yapınca syncKaydet doğru çalışacak

-- ── BUCKET ────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('wardrobe-photos', 'wardrobe-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ── POLICIES ──────────────────────────────────────────────────────────────────
-- Önce eski (varsa) policy'leri temizle — idempotent
DROP POLICY IF EXISTS "wardrobe-photos: public read"      ON storage.objects;
DROP POLICY IF EXISTS "wardrobe-photos: user upload own"  ON storage.objects;
DROP POLICY IF EXISTS "wardrobe-photos: user update own"  ON storage.objects;
DROP POLICY IF EXISTS "wardrobe-photos: user delete own"  ON storage.objects;

CREATE POLICY "wardrobe-photos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'wardrobe-photos');

CREATE POLICY "wardrobe-photos: user upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'wardrobe-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "wardrobe-photos: user update own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'wardrobe-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "wardrobe-photos: user delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'wardrobe-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
