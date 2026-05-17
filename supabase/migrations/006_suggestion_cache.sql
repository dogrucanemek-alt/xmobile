-- Outfit suggestion cache: aynı (system + messages + model) için Claude'a tekrar gitmeyelim.
-- Cross-user cache (kombin önerileri PII içermiyor — generic stil prompt'ları).
-- TTL: 7 gün (yeni sezon/trend güncellemeleri için yeterince taze).

CREATE TABLE IF NOT EXISTS suggestion_cache (
  cache_key   TEXT PRIMARY KEY,
  response    JSONB NOT NULL,
  hit_count   INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_suggestion_cache_expires ON suggestion_cache (expires_at);

ALTER TABLE suggestion_cache ENABLE ROW LEVEL SECURITY;
-- Sadece SERVICE_KEY

CREATE OR REPLACE FUNCTION suggestion_cache_hit(p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_response JSONB;
BEGIN
  SELECT response INTO v_response
  FROM suggestion_cache
  WHERE cache_key = p_key AND expires_at > now();

  IF v_response IS NOT NULL THEN
    UPDATE suggestion_cache SET hit_count = hit_count + 1 WHERE cache_key = p_key;
  END IF;

  RETURN v_response;
END;
$$;

GRANT EXECUTE ON FUNCTION suggestion_cache_hit TO service_role;

CREATE OR REPLACE FUNCTION suggestion_cache_cleanup()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM suggestion_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION suggestion_cache_cleanup TO service_role;
