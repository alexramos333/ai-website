"""Stock clip selection and optional Veo generation."""

from __future__ import annotations

import random
from typing import Any

from zodiak.clients.veo_client import VeoClient
from zodiak.db import AgentDB
from zodiak.logger import get_logger
from zodiak.storage import R2Storage

log = get_logger(__name__)


def select_clips(
    *,
    db: AgentDB,
    scene_descriptions: list[str],
    keywords: list[str],
    target_duration: float,
) -> list[dict[str, Any]]:
    """Select stock clips matching the video's scene descriptions.

    Returns a list of clip dicts with: r2_url, start_offset, clip_duration.
    """
    log.info(
        "clip_selection_start",
        scene_count=len(scene_descriptions),
        keywords=keywords[:5],
        target_duration=target_duration,
    )

    # Fetch matching clips from DB
    clips = db.get_stock_clips(tags=keywords, limit=20)
    log.info("clips_fetched", count=len(clips))

    if not clips:
        log.warning("no_clips_found", msg="No stock clips available")
        return []

    # Assign clips to fill the target duration
    # Use 4-6 second clips to keep total count low (max ~15 clips)
    selected: list[dict[str, Any]] = []
    remaining_duration = target_duration

    # Shuffle for variety
    random.shuffle(clips)

    while remaining_duration > 0 and clips:
        for clip in clips:
            if remaining_duration <= 0:
                break

            clip_duration = min(random.uniform(4.0, 6.0), remaining_duration)

            selected.append(
                {
                    "r2_url": clip["r2_url"],
                    "filename": clip["filename"],
                    "clip_duration": round(clip_duration, 2),
                    "start_offset": 0,
                    "tags": clip.get("tags", []),
                }
            )
            remaining_duration -= clip_duration

        # If we still need more, loop the clips
        if remaining_duration > 0:
            random.shuffle(clips)

    log.info(
        "clip_selection_complete",
        selected_count=len(selected),
        total_duration=round(target_duration - remaining_duration, 2),
    )
    return selected


def generate_veo_clips(
    *,
    veo: VeoClient,
    db: AgentDB,
    storage: R2Storage,
    run_id: str,
    run_date: str,
    scene_descriptions: list[str],
    monthly_cap: float,
) -> list[dict[str, Any]]:
    """Generate supplementary clips via Veo 3.1 Lite (if within budget).

    Returns a list of generated clip dicts with: r2_url, duration.
    """
    # Check monthly spend
    current_spend = db.get_veo_monthly_spend()
    remaining_budget = monthly_cap - current_spend

    if remaining_budget <= 0:
        log.info("veo_skip_cap", current_spend=current_spend, cap=monthly_cap)
        return []

    # Generate up to 3 clips, 5 seconds each
    clips_to_generate = min(3, len(scene_descriptions))
    cost_per_clip = veo.estimate_cost(5)
    affordable_clips = int(remaining_budget / cost_per_clip)
    clips_to_generate = min(clips_to_generate, affordable_clips)

    if clips_to_generate == 0:
        log.info("veo_skip_budget", remaining_budget=remaining_budget, cost_per_clip=cost_per_clip)
        return []

    generated: list[dict[str, Any]] = []

    for i in range(clips_to_generate):
        prompt = scene_descriptions[i] if i < len(scene_descriptions) else "abstract AI technology"

        try:
            video_bytes = veo.generate_clip(prompt, duration_seconds=5)
            if video_bytes is None:
                continue

            r2_key = f"veo-clips/{run_date}/scene-{i:02d}.mp4"
            url = storage.upload_bytes(video_bytes, r2_key, content_type="video/mp4")

            cost = veo.estimate_cost(5)
            db.log_veo_usage(run_id, cost, prompt, url)

            generated.append({"r2_url": url, "duration": 5, "source": "veo"})
            log.info("veo_clip_generated", scene=i, cost=cost, url=url[:80])

        except Exception as exc:
            log.warning("veo_clip_failed", scene=i, error=str(exc)[:200])
            # Non-fatal: continue with remaining clips

    return generated
