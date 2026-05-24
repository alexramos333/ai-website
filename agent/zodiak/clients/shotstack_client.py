"""Shotstack client for video assembly with Rich Captions."""

from __future__ import annotations

import time
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from zodiak.config import ShotstackConfig
from zodiak.logger import get_logger

log = get_logger(__name__)

SHOTSTACK_API_BASE = {
    "sandbox": "https://api.shotstack.io/stage",
    "production": "https://api.shotstack.io/v1",
}


class ShotstackClient:
    """Assemble and render videos via the Shotstack API."""

    POLL_INTERVAL = 10  # seconds between render status checks
    RENDER_TIMEOUT = 300  # 5 minutes max wait

    def __init__(self, config: ShotstackConfig) -> None:
        self._api_key = config.api_key
        self._env = config.env
        self._base_url = SHOTSTACK_API_BASE.get(config.env, SHOTSTACK_API_BASE["sandbox"])

    def _headers(self) -> dict[str, str]:
        return {
            "x-api-key": self._api_key,
            "Content-Type": "application/json",
        }

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=2, min=5, max=30),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.HTTPStatusError)),
    )
    def submit_render(self, edit: dict[str, Any]) -> str:
        """Submit an edit for rendering. Returns the render ID."""
        with httpx.Client(timeout=30) as client:
            response = client.post(
                f"{self._base_url}/render",
                headers=self._headers(),
                json=edit,
            )
            response.raise_for_status()

        data = response.json()
        render_id = data["response"]["id"]
        log.info("shotstack_render_submitted", render_id=render_id, env=self._env)
        return render_id

    def poll_render(self, render_id: str) -> dict[str, Any]:
        """Poll until render is complete. Returns the render result."""
        start = time.monotonic()

        with httpx.Client(timeout=30) as client:
            while True:
                elapsed = time.monotonic() - start
                if elapsed > self.RENDER_TIMEOUT:
                    raise TimeoutError(
                        f"Shotstack render {render_id} timed out after {self.RENDER_TIMEOUT}s"
                    )

                response = client.get(
                    f"{self._base_url}/render/{render_id}",
                    headers=self._headers(),
                )
                response.raise_for_status()

                data = response.json()["response"]
                status = data["status"]

                log.info(
                    "shotstack_render_poll",
                    render_id=render_id,
                    status=status,
                    elapsed_s=int(elapsed),
                )

                if status == "done":
                    return data
                if status == "failed":
                    raise RuntimeError(f"Shotstack render failed: {data.get('error', 'unknown')}")

                time.sleep(self.POLL_INTERVAL)

    def render_and_wait(self, edit: dict[str, Any]) -> str:
        """Submit a render and wait for completion. Returns the output URL."""
        render_id = self.submit_render(edit)
        result = self.poll_render(render_id)
        url = result["url"]
        log.info("shotstack_render_complete", render_id=render_id, url=url[:80])
        return url
