"""Google Veo client for supplementary video clip generation via google-genai."""

from __future__ import annotations

import os
import time

from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from zodiak.config import VeoConfig
from zodiak.logger import get_logger

log = get_logger(__name__)


class VeoClient:
    """Generate supplementary video clips using Google Veo via the genai SDK."""

    COST_PER_SECOND = 0.03  # $0.03/sec for Veo at 720p

    def __init__(self, config: VeoConfig) -> None:
        self._api_key = config.api_key
        self._credentials_path = config.credentials_path
        self._monthly_cap = config.monthly_spend_cap

        # Set credentials path for Google Cloud SDK (fallback)
        if self._credentials_path:
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = self._credentials_path

    def estimate_cost(self, duration_seconds: int) -> float:
        """Estimate the cost of generating a clip."""
        return duration_seconds * self.COST_PER_SECOND

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=2, min=10, max=60),
    )
    def generate_clip(
        self,
        prompt: str,
        duration_seconds: int = 5,
    ) -> bytes | None:
        """Generate a video clip from a text prompt.

        Returns MP4 bytes on success, None if generation fails or is skipped.
        """
        try:
            from google import genai
            from google.genai import types

            log.info("veo_generate_start", prompt=prompt[:80], duration=duration_seconds)

            client = genai.Client(api_key=self._api_key)

            operation = client.models.generate_videos(
                model="veo-2.0-generate-001",
                prompt=prompt,
                config=types.GenerateVideosConfig(
                    number_of_videos=1,
                    duration_seconds=duration_seconds,
                    resolution="720p",
                ),
            )

            # Poll until complete
            while not operation.done:
                log.info("veo_poll", prompt=prompt[:40])
                time.sleep(10)
                operation = client.operations.get(operation)

            if operation.result and operation.result.generated_videos:
                video = operation.result.generated_videos[0]
                video_data = video.video.video_bytes
                if video_data:
                    log.info("veo_generate_complete", size_bytes=len(video_data))
                    return video_data

            log.warning("veo_generate_empty", prompt=prompt[:80])
            return None

        except ImportError:
            log.warning("veo_import_error", msg="google-genai not installed")
            return None
        except Exception as exc:
            log.error("veo_generate_error", error=str(exc)[:200])
            raise
