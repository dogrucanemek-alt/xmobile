-- Paylaşılan kombinlerin parçaları + affiliate ürün linkleri
CREATE TABLE IF NOT EXISTS post_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parca_adi     TEXT NOT NULL,
  marka         TEXT,
  urun_url      TEXT,
  fiyat         NUMERIC(10,2),
  para_birimi   TEXT DEFAULT 'TRY',
  affiliate_kod TEXT,
  resim_url     TEXT,
  sira          INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_items_post_id ON post_items(post_id);

ALTER TABLE post_items ENABLE ROW LEVEL SECURITY;

-- Public read (keşfet'te görünür)
CREATE POLICY "Public can read post_items"
  ON post_items FOR SELECT
  TO public
  USING (true);

-- Sadece post sahibi ekleyip silebilir
CREATE POLICY "Owner can insert post_items"
  ON post_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM posts WHERE posts.id = post_items.post_id AND posts.user_id = auth.uid())
  );

CREATE POLICY "Owner can update post_items"
  ON post_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM posts WHERE posts.id = post_items.post_id AND posts.user_id = auth.uid())
  );

CREATE POLICY "Owner can delete post_items"
  ON post_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM posts WHERE posts.id = post_items.post_id AND posts.user_id = auth.uid())
  );
