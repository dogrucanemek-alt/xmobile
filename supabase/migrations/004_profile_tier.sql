-- Profile'a abonelik seviyesi ekle. RevenueCat webhook'u veya manuel update ile değişir.
-- Default 'free', Pro upgrade'de 'pro' olur.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free';

CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles (subscription_tier);

-- Helper: kullanıcının tier'ını döndürür. Yoksa 'free' varsayar.
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT subscription_tier FROM profiles WHERE id::text = p_user_id),
    'free'
  );
$$;

GRANT EXECUTE ON FUNCTION get_user_tier TO service_role, authenticated;
