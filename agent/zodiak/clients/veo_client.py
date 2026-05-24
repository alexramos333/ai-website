"""Google Veo 3.1 Lite client for supplementary video clip generation."""

from __future__ import annotations

import os
import time

from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from zodiak.config import VeoConfig
from zodiak.logger import get_logger

log = get_logger(__name__)


class VeoClient:
    """Generate supplementary video clips using Google Veo 3.1 Lite."""

    COST_PER_SECOND = 0.03  # $0.03/sec for Veo 3.1 Lite at 720p

    def __init__(self, config: VeoConfig) -> None:
        self._credentials_path = config.credentials_path
        self._monthly_cap = config.monthly_spend_cap

        # Set credentials path for Google Cloud SDK
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
            from google.cloud import aiplatform

            log.info("veo_generate_start", prompt=prompt[:80], duration=duration_seconds)

            # Initialize Vertex AI / Agent Platform client
            aiplatform.init()

            # Use the Veo model for video generation
            # Note: API interface may vary based on SDK version
            model = aiplatform.GenerativeModel("veo-3.1-lite-generate-001")

            response = model.generate_content(
                contents=prompt,
                generation_config={
                    "video_config": {
                        "resolution": "720p",
                        "duration_seconds": duration_seconds,
                        "include_audio": False,
                    }
                },
            )

            if response and hasattr(response, "candidates"):
                video_data = response.candidates[0].content.parts[0].inline_data.data
                log.info("veo_generate_complete", size_bytes=len(video_data))
                return video_data

            log.warning("veo_generate_empty", prompt=prompt[:80])
            return None

        except ImportError:
            log.warning("veo_import_error", msg="google-cloud-aiplatform not installed")
            return None
        except Exception as exc:
            log.error("veo_generate_error", error=str(exc)[:200])
            raise
