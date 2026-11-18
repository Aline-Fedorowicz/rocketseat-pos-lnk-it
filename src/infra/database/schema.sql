CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY,
  original_url TEXT NOT NULL,
  short_code VARCHAR(32) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS link_accesses (
  id UUID PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES links (id) ON DELETE CASCADE,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  referer TEXT
);

CREATE INDEX IF NOT EXISTS link_accesses_link_id_accessed_at_idx
  ON link_accesses (link_id, accessed_at DESC);
