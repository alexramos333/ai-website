-- ============================================================
-- 004_video_agent_tables.sql
-- Zodiak Video Agent: video columns on articles + new tables
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ============================================================
-- 1. ADD VIDEO COLUMNS TO EXISTING ARTICLES TABLE
--    These are nullable so existing rows get NULL (zero impact)
-- ============================================================

ALTER TABLE articles ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS video_duration INTEGER; -- seconds

-- ============================================================
-- 2. STOCK CLIPS TABLE
--    Index of pre-uploaded stock footage in Cloudflare R2
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_clips (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename         TEXT NOT NULL,
  r2_url           TEXT NOT NULL,
  tags             TEXT[] NOT NULL DEFAULT '{}',
  duration_seconds NUMERIC(5,2) NOT NULL DEFAULT 0,
  width            INTEGER NOT NULL DEFAULT 1080,
  height           INTEGER NOT NULL DEFAULT 1920,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE stock_clips ENABLE ROW LEVEL SECURITY;

-- Active clips readable by everyone (agent uses service_role anyway)
CREATE POLICY "Active clips are viewable by everyone"
  ON stock_clips FOR SELECT
  USING (active = TRUE);

-- Admins can manage all clips
CREATE POLICY "Admins can manage stock_clips"
  ON stock_clips FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- GIN index for fast tag overlap queries
CREATE INDEX idx_stock_clips_tags ON stock_clips USING GIN (tags);
CREATE INDEX idx_stock_clips_active ON stock_clips (active);

-- ============================================================
-- 3. AGENT RUNS TABLE
--    Tracks each daily agent run for monitoring and debugging
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  run_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  trigger_type    TEXT NOT NULL DEFAULT 'cron'
    CHECK (trigger_type IN ('cron', 'manual', 'test')),
  article_id      UUID REFERENCES articles(id) ON DELETE SET NULL,
  topic           TEXT,
  duration_ms     INTEGER,
  cost_breakdown  JSONB NOT NULL DEFAULT '{}',
  progress_log    TEXT[] NOT NULL DEFAULT '{}',
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view agent_runs"
  ON agent_runs FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage agent_runs"
  ON agent_runs FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE INDEX idx_agent_runs_status ON agent_runs (status);
CREATE INDEX idx_agent_runs_date ON agent_runs (run_date DESC);

-- ============================================================
-- 4. VEO USAGE TABLE
--    Tracks Google Veo spend for monthly cap enforcement
-- ============================================================

CREATE TABLE IF NOT EXISTS veo_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      UUID REFERENCES agent_runs(id) ON DELETE CASCADE,
  cost_usd    NUMERIC(6,4) NOT NULL,
  prompt      TEXT NOT NULL,
  video_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE veo_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view veo_usage"
  ON veo_usage FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage veo_usage"
  ON veo_usage FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
