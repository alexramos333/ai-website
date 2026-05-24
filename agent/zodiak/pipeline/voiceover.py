"""Voiceover synthesis pipeline: text → ElevenLabs → R2 upload."""

from __future__ import annotations

from zodiak.clients.elevenlabs_client import VoiceoverClient
from zodiak.logger import get_logger
from zodiak.storage import R2Storage

log = get_logger(__name__)


def synthesize_voiceover(
    *,
    client: VoiceoverClient,
    storage: R2Storage,
    script_text: str,
    run_date: str,
    slug: str,
) -> dict[str, str | float]:
    """Synthesize voiceover and upload to R2.

    Returns dict with: url, r2_key, size_bytes.
    Raises on failure (voiceover is required for video).
    """
    log.info("voiceover_pipeline_start", slug=slug, text_length=len(script_text))

    # Synthesize speech
    audio_bytes = client.synthesize(script_text)

    # Upload to R2
    r2_key = f"voiceovers/{run_date}/{slug}.mp3"
    url = storage.upload_bytes(audio_bytes, r2_key, content_type="audio/mpeg")

    result = {
        "url": url,
        "r2_key": r2_key,
        "size_bytes": len(audio_bytes),
    }

    log.info("voiceover_pipeline_complete", **result)
    return result
