-- Try-on result cache: aynı model + garment + kategori için Fashn'a tekrar gitmeyelim.
-- Hash key = SHA256(model_image_signature + garment_image_signature + category).
-- Server-side, SERVICE_KEY ile yazılır. Public READ yok — client doğrudan sorgulamıyor.

CREATE TABLE IF NOT EXISTS tryon_cache (
  cache_key   TEXT PRIMARY KEY,
  result_url  TEXT NOT NULL,
  hit_count   INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_tryon_cache_expires ON tryon_cache (expires_at);

ALTER TABLE tryon_cache ENABLE ROW LEVEL SECURITY;
-- Hiç policy yok → sadece SERVICE_KEY erişebilir (proxy üzerinden)

-- Atomic upsert + hit_count increment
CREATE OR REPLACE FUNCTION tryon_cache_hit(p_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url TEXT;
BEGIN
  SELECT result_url INTO v_url
  FROM tryon_cache
  WHERE cache_key = p_key AND expires_at > now();

  IF v_url IS NOT NULL THEN
    UPDATE tryon_cache SET hit_count = hit_count + 1 WHERE cache_key = p_key;
  END IF;

  RETURN v_url;
END;
$$;

GRANT EXECUTE ON FUNCTION tryon_cache_hit TO service_role;

-- Expire eski cache rows (manuel veya pg_cron ile günde 1 kez)
CREATE OR REPLACE FUNCTION tryon_cache_cleanup()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM tryon_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION tryon_cache_cleanup TO service_role;

-- ─── TRYON_JOBS: provider job_id → cache_key mapping ──────────
-- POST handler insert, GET status handler (on completion) lookup edip cache'e yazar.
CREATE TABLE IF NOT EXISTS tryon_jobs (
  job_id      TEXT PRIMARY KEY,        -- Fashn/Replicate UUID
  cache_key   TEXT NOT NULL,
  user_id     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 day')
);

CREATE INDEX IF NOT EXISTS idx_tryon_jobs_expires ON tryon_jobs (expires_at);

ALTER TABLE tryon_jobs ENABLE ROW LEVEL SECURITY;
-- Sadece SERVICE_KEY
