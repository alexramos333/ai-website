# Zodiak Video Agent

Fully automated daily AI agent that discovers trending AI/marketing topics, generates a blog article + 30-60 second video, and publishes both to the website.

## Architecture

```
Apify TikTok Trends
       │
       ▼
Perplexity Research ──► Claude Topic Selection
                              │
                    ┌─────────┼─────────┐
                    ▼                   ▼
            Blog Article         Video Script
            (Claude Sonnet)      (Claude Sonnet)
                    │                   │
                    │            ┌──────┼──────┐
                    │            ▼             ▼
                    │      ElevenLabs    Stock Clips
                    │      Voiceover    + Veo Clips
                    │            │             │
                    │            └──────┬──────┘
                    │                   ▼
                    │            Shotstack Video
                    │            Assembly
                    │                   │
                    └─────────┬─────────┘
                              ▼
                    Supabase articles table
                    + Cloudflare R2 storage
```

## Setup

### Prerequisites

- Python 3.12+
- Access to: Supabase, Anthropic, Apify, Perplexity, ElevenLabs, Google Cloud (Veo), Shotstack, Cloudflare R2

### Install

```bash
cd agent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Environment Variables

The agent reads from the repo root `.env.local` file. Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin access) |
| `DEFAULT_AUTHOR_ID` | UUID of the default article author |
| `ANTHROPIC_API_KEY_ZODIAK_AGENT` | Anthropic API key (separate from blog generator) |
| `APIFY_API_TOKEN` | Apify API token for TikTok trends |
| `PERPLEXITY_API_KEY` | Perplexity API key for research |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for voiceover |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account JSON |
| `SHOTSTACK_API_KEY_SANDBOX` | Shotstack sandbox API key |
| `SHOTSTACK_API_KEY_PRODUCTION` | Shotstack production API key |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret key |
| `R2_ENDPOINT_URL` | R2 S3-compatible endpoint |
| `R2_PUBLIC_URL` | R2 public URL for serving media |

Optional:

| Variable | Default | Description |
|----------|---------|-------------|
| `VEO_MONTHLY_SPEND_CAP` | `15.0` | Monthly Veo spend cap in USD |
| `SHOTSTACK_ENV` | `sandbox` | `sandbox` or `production` |
| `SHOTSTACK_DAILY_RENDER_CAP` | `3` | Max renders per day |
| `R2_BUCKET_NAME` | `video-agent-storage` | R2 bucket name |
| `ZODIAK_MODEL` | `claude-sonnet-4-5-20250929` | Claude model ID |

## Usage

```bash
# Full pipeline
python run.py

# Dry run (no API calls)
python run.py --dry-run

# Override topic
python run.py --topic "AI agents in 2026"

# Specific trigger type
python run.py --trigger cron
```

## GitHub Actions

The workflow at `.github/workflows/video-agent.yml` runs the agent daily at 9 AM ET. It can also be triggered manually via `workflow_dispatch` with optional topic override and dry run inputs.

To enable the daily schedule, uncomment the `schedule` block in the workflow file.

## Relationship to SEO Blog Article Generator

This agent is a **completely separate system** from the existing SEO Blog Article Generator. Both publish to the same `articles` table in Supabase, but:

- The SEO generator is triggered manually via Google Sheets
- The video agent runs automatically via daily cron
- They use **different** Anthropic API keys
- Articles with `video_url IS NOT NULL` were created by this agent
- Articles with `video_url IS NULL` were created by the SEO generator
- Neither system modifies the other's code
