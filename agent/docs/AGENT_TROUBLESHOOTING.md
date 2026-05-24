# Agent Troubleshooting

## Common Failures

### Config Error: Missing environment variables

**Symptom:** Agent exits immediately with `EnvironmentError`

**Fix:** Ensure all required env vars are set. Check `.env.local` locally or GitHub Actions secrets for CI. The error message lists which variables are missing.

### Apify Timeout / Fallback Topics

**Symptom:** Log shows `apify_fallback` warning

**Cause:** TikTok trends scraper timed out (>60s) or returned empty results.

**Impact:** Non-fatal. Agent falls back to curated topics from `zodiak/fallback_topics.json`. Content will still be generated, just from pre-defined topics rather than live trends.

### Voiceover Failure

**Symptom:** `agent_failed` with ElevenLabs error

**Cause:** ElevenLabs API error, invalid voice ID, or quota exceeded.

**Fix:** Check ElevenLabs dashboard for quota. Verify `ELEVENLABS_VOICE_ID` is valid. This is a fatal error — no video can be produced without voiceover.

### No Stock Clips Available

**Symptom:** `RuntimeError: No video clips available`

**Cause:** `stock_clips` table is empty or all clips are `active=false`.

**Fix:** Run the seed script to populate stock clips:
```bash
cd agent
python scripts/seed_stock_clips.py
```

### Veo Budget Exceeded

**Symptom:** Log shows `veo_skip_cap`

**Impact:** Non-fatal. Agent uses only stock clips. Veo clips are supplementary.

**Fix:** Wait for next month or increase `VEO_MONTHLY_SPEND_CAP`.

### Shotstack Render Timeout

**Symptom:** `TimeoutError` from Shotstack client after 5 minutes

**Cause:** Shotstack render queue is backed up or edit JSON is too complex.

**Fix:** Check Shotstack dashboard for render status. The agent has a 5-minute timeout with 10-second polling. If renders consistently timeout, simplify the edit (fewer clips, shorter duration).

### Daily Render Cap Reached

**Symptom:** `RuntimeError: Daily render cap reached`

**Cause:** Already ran the maximum number of renders today.

**Fix:** Wait until tomorrow, or increase `SHOTSTACK_DAILY_RENDER_CAP`.

### Slug Collision

**Symptom:** Log shows `slug_collision_resolved`

**Impact:** Non-fatal. The slug gets a date suffix appended (e.g., `my-article-2026-05-19`).

### Supabase Insert Error

**Symptom:** `agent_failed` with Supabase/PostgreSQL error

**Cause:** RLS policy blocking insert, missing required columns, or constraint violation.

**Fix:** Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (bypasses RLS). Check that the migration has been applied (video columns exist on `articles` table).

## Checking Run Status

```sql
-- Last 5 runs
SELECT id, status, topic, duration_ms, error_message, created_at
FROM agent_runs
ORDER BY created_at DESC
LIMIT 5;

-- Failed runs this week
SELECT id, topic, error_message, created_at
FROM agent_runs
WHERE status = 'failed'
  AND created_at >= now() - interval '7 days';
```

## Rerunning a Failed Run

```bash
# Rerun with the same topic that failed
python run.py --topic "The topic that failed"

# Or let it discover a new topic
python run.py
```

Failed runs are recorded in `agent_runs` with `status='failed'` and `error_message`. A new run creates a fresh record — it does not retry the old one.
