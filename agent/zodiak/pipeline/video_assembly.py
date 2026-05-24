"""Video assembly pipeline: build Shotstack Edit JSON and render."""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlencode, urlparse, urlunparse

from zodiak.clients.shotstack_client import ShotstackClient
from zodiak.logger import get_logger
from zodiak.storage import R2Storage

log = get_logger(__name__)

# Shotstack Edit constants
OUTPUT_WIDTH = 1080
OUTPUT_HEIGHT = 1920
FPS = 30
FADE_DURATION = 0.3


def _encode_url(url: str) -> str:
    """Percent-encode spaces and special chars in the URL path.

    Also adds a cache-busting query param to bypass CDN caching
    (ensures Shotstack fetches the latest version from R2).
    """
    parsed = urlparse(url)
    encoded_path = quote(parsed.path, safe="/")
    # Add cache-busting param to bypass CDN cached HEVC versions
    cache_bust = urlencode({"v": int(time.time())})
    new_query = f"{parsed.query}&{cache_bust}" if parsed.query else cache_bust
    return urlunparse(parsed._replace(path=encoded_path, query=new_query))


def build_edit(
    *,
    voiceover_url: str,
    clips: list[dict[str, Any]],
    caption_words: list[str],
    total_duration: float,
) -> dict[str, Any]:
    """Build a Shotstack Edit JSON for a vertical video with captions.

    Args:
        voiceover_url: Public R2 URL of the voiceover MP3.
        clips: List of clip dicts with r2_url and clip_duration.
        caption_words: List of words for karaoke-style captions.
        total_duration: Total video duration in seconds.
    """
    # ── Track 1: B-roll clips ───────────────────────────────────
    video_clips = []
    offset = 0.0

    for clip in clips:
        video_clips.append(
            {
                "asset": {
                    "type": "video",
                    "src": _encode_url(clip["r2_url"]),
                    "trim": 0,
                    "transcode": True,
                },
                "start": offset,
                "length": clip["clip_duration"],
                "fit": "cover",
                "transition": {
                    "in": "fade",
                    "out": "fade",
                },
            }
        )
        offset += clip["clip_duration"] - FADE_DURATION  # overlap for fade

    # ── Track 2: Voiceover audio ────────────────────────────────
    audio_clip = {
        "alias": "voiceover",
        "asset": {
            "type": "audio",
            "src": _encode_url(voiceover_url),
        },
        "start": 0,
        "length": total_duration,
    }

    # ── Track 3: Rich Captions ──────────────────────────────────
    caption_clip = {
        "asset": {
            "type": "caption",
            "src": "alias://voiceover",
            "font": {
                "family": "Montserrat ExtraBold",
                "size": 42,
                "color": "#ffffff",
            },
            "background": {
                "color": "#000000",
                "padding": 8,
                "borderRadius": 4,
                "opacity": 0.6,
            },
        },
        "start": 0,
        "length": total_duration,
        "position": "bottom",
        "offset": {
            "y": -0.15,
        },
    }

    # ── Assemble the edit ───────────────────────────────────────
    edit = {
        "timeline": {
            "tracks": [
                {"clips": [caption_clip]},  # Top: captions
                {"clips": [audio_clip]},  # Middle: audio
                {"clips": video_clips},  # Bottom: b-roll
            ],
        },
        "output": {
            "format": "mp4",
            "fps": FPS,
            "size": {
                "width": OUTPUT_WIDTH,
                "height": OUTPUT_HEIGHT,
            },
            "quality": "high",
        },
    }

    log.info(
        "edit_built",
        clip_count=len(video_clips),
        total_duration=total_duration,
        caption_words=len(caption_words),
    )
    return edit


def assemble_video(
    *,
    shotstack: ShotstackClient,
    storage: R2Storage,
    voiceover_url: str,
    clips: list[dict[str, Any]],
    caption_words: list[str],
    total_duration: float,
    run_date: str,
    slug: str,
) -> dict[str, str]:
    """Build, render, and upload the final video.

    Returns dict with: video_url, thumbnail_url.
    """
    log.info("video_assembly_start", slug=slug)

    # Build the Shotstack edit JSON
    edit = build_edit(
        voiceover_url=voiceover_url,
        clips=clips,
        caption_words=caption_words,
        total_duration=total_duration,
    )

    # Dump edit JSON to file for debugging
    debug_path = Path(f"/tmp/shotstack-edit-{slug}.json")
    debug_path.write_text(json.dumps(edit, indent=2))
    log.info("edit_json_saved", path=str(debug_path))

    # Submit and wait for render
    shotstack_url = shotstack.render_and_wait(edit)

    # Download rendered video from Shotstack (their URLs expire)
    video_bytes = storage.download_url(shotstack_url)

    # Re-upload to our own R2 bucket
    video_key = f"final-videos/{run_date}/{slug}.mp4"
    video_url = storage.upload_bytes(video_bytes, video_key, content_type="video/mp4")

    # Generate thumbnail (use first frame — for now, upload a placeholder)
    # In production, Shotstack can provide a thumbnail via their API
    thumbnail_url = ""  # Will be populated if Shotstack provides one

    result = {
        "video_url": video_url,
        "thumbnail_url": thumbnail_url,
    }

    log.info("video_assembly_complete", video_url=video_url[:80])
    return result
