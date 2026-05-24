"""Main pipeline orchestrator: ties all phases together into a single run."""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any

from zodiak.clients.anthropic_client import ClaudeClient
from zodiak.clients.apify_client import ApifyTrendClient
from zodiak.clients.elevenlabs_client import VoiceoverClient
from zodiak.clients.perplexity_client import PerplexityClient
from zodiak.clients.shotstack_client import ShotstackClient
from zodiak.clients.veo_client import VeoClient
from zodiak.config import AgentConfig
from zodiak.db import AgentDB
from zodiak.logger import get_logger
from zodiak.pipeline.clip_selector import generate_veo_clips, select_clips
from zodiak.pipeline.content_gen import generate_blog_article, generate_video_script
from zodiak.pipeline.publisher import publish_article
from zodiak.pipeline.trend_discovery import discover_trending_topic
from zodiak.pipeline.video_assembly import assemble_video
from zodiak.pipeline.voiceover import synthesize_voiceover
from zodiak.storage import R2Storage

log = get_logger(__name__)


def run(*, config: AgentConfig, run_id: str, db: AgentDB) -> dict[str, Any]:
    """Execute the full video agent pipeline.

    Phases:
        1. Trend discovery → topic selection
        2. Content generation → blog article + video script
        3. Voiceover synthesis → ElevenLabs MP3
        4. Clip selection → stock + optional Veo clips
        5. Video assembly → Shotstack render
        6. Publish → articles table

    Returns a summary dict with article_id, slug, video_url.
    """
    start_time = time.monotonic()
    run_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    costs: dict[str, float] = {}

    # ── Init clients ───────────────────────────────────────────
    claude = ClaudeClient(config.anthropic)
    apify = ApifyTrendClient(config.apify)
    perplexity = PerplexityClient(config.perplexity)
    voiceover_client = VoiceoverClient(config.elevenlabs)
    veo = VeoClient(config.veo)
    shotstack = ShotstackClient(config.shotstack)
    storage = R2Storage(config.r2)

    # ── Check daily render cap ─────────────────────────────────
    today_renders = db.get_today_render_count()
    if today_renders >= config.shotstack.daily_render_cap:
        raise RuntimeError(
            f"Daily render cap reached ({today_renders}/{config.shotstack.daily_render_cap})"
        )

    # ── Phase 1: Trend Discovery ───────────────────────────────
    db.append_progress(run_id, "Phase 1: Discovering trending topics...")
    log.info("phase_start", phase="trend_discovery")

    topic_data = discover_trending_topic(
        apify=apify,
        perplexity=perplexity,
        claude=claude,
        db=db,
        topic_override=config.topic_override,
    )

    topic = topic_data["topic"]
    angle = topic_data["angle"]
    keywords = topic_data.get("target_keywords", [])
    video_hook = topic_data.get("video_hook", "")

    db.set_run_topic(run_id, topic)
    db.append_progress(run_id, f"Topic selected: {topic}")
    log.info("phase_complete", phase="trend_discovery", topic=topic)

    # ── Phase 2: Content Generation ────────────────────────────
    db.append_progress(run_id, "Phase 2: Generating blog article + video script...")
    log.info("phase_start", phase="content_generation")

    article = generate_blog_article(
        claude=claude,
        topic=topic,
        angle=angle,
        keywords=keywords,
    )

    script = generate_video_script(
        claude=claude,
        topic=topic,
        angle=angle,
        video_hook=video_hook,
    )

    slug = article["slug"]
    db.append_progress(run_id, f"Article: {article['title'][:60]}")
    log.info("phase_complete", phase="content_generation", slug=slug)

    # ── Phase 3: Voiceover ─────────────────────────────────────
    db.append_progress(run_id, "Phase 3: Synthesizing voiceover...")
    log.info("phase_start", phase="voiceover")

    voiceover = synthesize_voiceover(
        client=voiceover_client,
        storage=storage,
        script_text=script["script_text"],
        run_date=run_date,
        slug=slug,
    )

    total_duration = script.get("estimated_duration_seconds", 45)
    db.append_progress(run_id, f"Voiceover: {voiceover['size_bytes']} bytes")
    log.info("phase_complete", phase="voiceover", url=voiceover["url"][:80])

    # ── Phase 4: Clip Selection + Veo ──────────────────────────
    db.append_progress(run_id, "Phase 4: Selecting video clips...")
    log.info("phase_start", phase="clip_selection")

    scene_descriptions = script.get("scene_descriptions", [])

    clips = select_clips(
        db=db,
        scene_descriptions=scene_descriptions,
        keywords=keywords,
        target_duration=total_duration,
    )

    # Try Veo for supplementary clips
    veo_clips = generate_veo_clips(
        veo=veo,
        db=db,
        storage=storage,
        run_id=run_id,
        run_date=run_date,
        scene_descriptions=scene_descriptions,
        monthly_cap=config.veo.monthly_spend_cap,
    )

    if veo_clips:
        # Prepend Veo clips (they're typically higher quality)
        for vc in veo_clips:
            clips.insert(0, {
                "r2_url": vc["r2_url"],
                "clip_duration": vc["duration"],
                "filename": "veo-generated",
                "tags": [],
            })

    db.append_progress(run_id, f"Clips: {len(clips)} stock + {len(veo_clips)} veo")
    log.info("phase_complete", phase="clip_selection", stock=len(clips), veo=len(veo_clips))

    if not clips:
        raise RuntimeError("No video clips available — cannot assemble video")

    # ── Phase 5: Video Assembly ────────────────────────────────
    db.append_progress(run_id, "Phase 5: Assembling video via Shotstack...")
    log.info("phase_start", phase="video_assembly")

    caption_words = script.get("caption_words", script["script_text"].split())

    video_result = assemble_video(
        shotstack=shotstack,
        storage=storage,
        voiceover_url=voiceover["url"],
        clips=clips,
        caption_words=caption_words,
        total_duration=total_duration,
        run_date=run_date,
        slug=slug,
    )

    db.append_progress(run_id, "Video assembled and uploaded to R2")
    log.info("phase_complete", phase="video_assembly")

    # ── Phase 6: Publish ───────────────────────────────────────
    db.append_progress(run_id, "Phase 6: Publishing article...")
    log.info("phase_start", phase="publish")

    result = publish_article(
        db=db,
        article=article,
        video_url=video_result["video_url"],
        video_thumbnail_url=video_result.get("thumbnail_url"),
        video_duration=int(total_duration),
    )

    duration_ms = int((time.monotonic() - start_time) * 1000)
    db.append_progress(run_id, f"Published: /blog/{result['slug']}")
    log.info(
        "pipeline_complete",
        article_id=result["id"],
        slug=result["slug"],
        duration_ms=duration_ms,
    )

    return {
        "article_id": result["id"],
        "slug": result["slug"],
        "video_url": video_result["video_url"],
        "duration_ms": duration_ms,
        "costs": costs,
    }
