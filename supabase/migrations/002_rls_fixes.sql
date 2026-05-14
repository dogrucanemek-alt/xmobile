-- Fix RLS Policies for xmobile
-- Run this in Supabase SQL editor

-- ── PROFILES: Stricter rules ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
-- Keep update/insert policies as is (users can only edit own)

-- ── POSTS: Fix update policy ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "System can update like count" ON posts;
-- Like count is updated via function, not direct update. Don't allow direct updates.
CREATE POLICY "Users can update own post" ON posts FOR UPDATE
  USING (auth.uid() = user_id);

-- ── LIKES: Stricter access rules ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
-- Users can only view their own likes
CREATE POLICY "Users can view own likes" ON likes FOR SELECT
  USING (auth.uid() = user_id);

-- Keep insert/delete policies (users manage own likes)

-- ── POSTS: Add like_count trigger (safer than direct update) ────────────────
DROP TRIGGER IF EXISTS update_post_likes_trigger ON likes;
DROP FUNCTION IF EXISTS update_post_likes_func();

CREATE OR REPLACE FUNCTION update_post_likes_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_post_likes_trigger
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_func();

-- ── Verify policies are set ──────────────────────────────────────────────────
-- SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
