# Agent Operations

## Daily Schedule

The agent runs daily at **9 AM ET (13:00 UTC)** via GitHub Actions cron.

Each run:
1. Creates an `agent_runs` record with `status='running'`
2. Discovers trending topic (Apify + Perplexity + Claude)
3. Generates blog article + video script (Claude Sonnet)
4. Synthesizes voiceover (ElevenLabs)
5. Selects stock clips + generates Veo clips (if within budget)
6. Assembles video (Shotstack)
7. Publishes article with video to Supabase
8. Updates `agent_runs` with `status='completed'` or `status='failed'`

## Monitoring

### Agent Runs Table

Query `agent_runs` in Supabase to see run history:

```sql
SELECT id, status, topic, run_date, duration_ms, error_message
FROM agent_runs
ORDER BY created_at DESC
LIMIT 10;
```

### Progress Log

Each run appends timestamped progress messages:

```sql
SELECT progress_log FROM agent_runs WHERE id = '<run-id>';
```

### Cost Tracking

Costs are stored in `agent_runs.cost_breakdown` (JSONB):

```sql
SELECT run_date, cost_breakdown
FROM agent_runs
WHERE status = 'completed'
ORDER BY created_at DESC;
```

## Cost Controls

| Control | Limit | Enforcement |
|---------|-------|-------------|
| Veo monthly spend | $15.00 (configurable) | Checked before each Veo generation |
| Shotstack daily renders | 3 (configurable) | Checked at pipeline start |
| Claude tokens | ~4K per article, ~1.5K per script | Set via `max_tokens` parameter |

### Veo Monthly Spend

```sql
SELECT SUM(cost_usd) as monthly_spend
FROM veo_usage
WHERE created_at >= date_trunc('month', now());
```

## Manual Trigger

Via GitHub Actions UI:
1. Go to Actions > "Zodiak Video Agent"
2. Click "Run workflow"
3. Optionally set topic override or dry run
4. Monitor the run in the Actions log

Via CLI (local):
```bash
cd agent
python run.py --topic "Your topic here"
python run.py --dry-run  # Test without API calls
```
