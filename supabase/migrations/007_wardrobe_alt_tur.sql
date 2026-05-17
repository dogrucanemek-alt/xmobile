-- 007_wardrobe_alt_tur.sql
-- Aksesuar alt-tipi: Şapka, Kravat, Atkı, Saat, Kemer, Gözlük, Çanta, Takı, Eldiven, Diğer
-- yalnız tur = 'Aksesuar' olan satırlar için anlamlı; diğer satırlarda NULL kalır.

ALTER TABLE wardrobe_items
  ADD COLUMN IF NOT EXISTS alt_tur TEXT;

-- PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
