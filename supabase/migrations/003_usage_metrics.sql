-- Kullanıcı başına günlük AI kullanım sayaçları + maliyet tracking
-- Server-side (SERVICE_KEY) tarafından yazılır, client SELECT ile kendi metriklerini okur.

CREATE TABLE IF NOT EXISTS usage_metrics (
  user_id           TEXT NOT NULL,
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  tryon_count       INT  NOT NULL DEFAULT 0,
  suggestion_count  INT  NOT NULL DEFAULT 0,
  rembg_count       INT  NOT NULL DEFAULT 0,
  dalle_count       INT  NOT NULL DEFAULT 0,
  meshy_count       INT  NOT NULL DEFAULT 0,
  cost_cents        INT  NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_user_date ON usage_metrics (user_id, date DESC);

ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi metriklerini okuyabilir
DROP POLICY IF EXISTS "Users read own metrics" ON usage_metrics;
CREATE POLICY "Users read own metrics" ON usage_metrics
  FOR SELECT USING (auth.uid()::text = user_id);

-- INSERT/UPDATE/DELETE için policy yok → sadece SERVICE_KEY (RLS bypass) yazabilir

-- Atomic upsert + increment fonksiyonu
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id     TEXT,
  p_metric      TEXT,        -- 'tryon' | 'suggestion' | 'rembg' | 'dalle' | 'meshy'
  p_cost_cents  INT DEFAULT 0
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO usage_metrics (user_id, date)
  VALUES (p_user_id, CURRENT_DATE)
  ON CONFLICT (user_id, date) DO NOTHING;

  UPDATE usage_metrics
  SET
    tryon_count       = tryon_count       + CASE WHEN p_metric = 'tryon'      THEN 1 ELSE 0 END,
    suggestion_count  = suggestion_count  + CASE WHEN p_metric = 'suggestion' THEN 1 ELSE 0 END,
    rembg_count       = rembg_count       + CASE WHEN p_metric = 'rembg'      THEN 1 ELSE 0 END,
    dalle_count       = dalle_count       + CASE WHEN p_metric = 'dalle'      THEN 1 ELSE 0 END,
    meshy_count       = meshy_count       + CASE WHEN p_metric = 'meshy'      THEN 1 ELSE 0 END,
    cost_cents        = cost_cents        + p_cost_cents,
    updated_at        = now()
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
END;
$$;

-- Service role'a function execute izni
GRANT EXECUTE ON FUNCTION increment_usage TO service_role;

-- Kullanıcının bu ayki toplam kullanımını getirir (free limit kontrolü için)
CREATE OR REPLACE FUNCTION get_usage_this_month(p_user_id TEXT)
RETURNS TABLE (
  tryon_count       BIGINT,
  suggestion_count  BIGINT,
  rembg_count       BIGINT,
  dalle_count       BIGINT,
  meshy_count       BIGINT,
  cost_cents        BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(tryon_count), 0),
    COALESCE(SUM(suggestion_count), 0),
    COALESCE(SUM(rembg_count), 0),
    COALESCE(SUM(dalle_count), 0),
    COALESCE(SUM(meshy_count), 0),
    COALESCE(SUM(cost_cents), 0)
  FROM usage_metrics
  WHERE user_id = p_user_id
    AND date >= date_trunc('month', CURRENT_DATE)::date;
$$;

GRANT EXECUTE ON FUNCTION get_usage_this_month TO service_role, authenticated;
