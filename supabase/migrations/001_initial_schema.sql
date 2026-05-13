-- xmobile Supabase Schema
-- Run this in Supabase SQL editor to set up the database

-- ── PROFILES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles"  ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ── POSTS ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baslik      TEXT NOT NULL,
  tur         TEXT,
  parcalar    TEXT[] DEFAULT '{}',
  neden       TEXT,
  gorsel_url  TEXT,
  hava_derece NUMERIC,
  hava_durum  TEXT,
  like_count  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view posts"     ON posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own post" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own post" ON posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System can update like count" ON posts FOR UPDATE USING (true);

-- Index for feed ordering
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);

-- ── LIKES ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  post_id  UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view likes"      ON likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- ── OUTFIT IMAGES STORAGE ─────────────────────────────────────────────────────
-- Run in Storage tab: create bucket "outfit-posts" with public access

-- ── LIKE FUNCTIONS ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_likes(pid UUID)
RETURNS VOID AS $$
  UPDATE posts SET like_count = like_count + 1 WHERE id = pid;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_likes(pid UUID)
RETURNS VOID AS $$
  UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = pid;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ── FEED QUERY (for reference) ────────────────────────────────────────────────
-- SELECT
--   posts.*,
--   profiles.display_name
-- FROM posts
-- LEFT JOIN profiles ON posts.user_id = profiles.id
-- ORDER BY posts.created_at DESC
-- LIMIT 20 OFFSET 0;
