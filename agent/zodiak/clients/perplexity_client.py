"""Perplexity API client for topic research."""

from __future__ import annotations

from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from zodiak.config import PerplexityConfig
from zodiak.logger import get_logger

log = get_logger(__name__)

PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"


class PerplexityClient:
    """Research topics using the Perplexity API."""

    def __init__(self, config: PerplexityConfig) -> None:
        self._api_key = config.api_key
        self._model = config.model

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=4, max=30),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.HTTPStatusError)),
    )
    def research_topic(self, topic: str) -> str:
        """Research a topic and return a summary with fresh data."""
        system_prompt = (
            "You are a trend research assistant specializing in AI and digital marketing. "
            "Summarize what's trending about this topic. Include specific statistics, "
            "recent news, and why this matters now. Be concise but data-rich."
        )

        with httpx.Client(timeout=30) as client:
            response = client.post(
                PERPLEXITY_API_URL,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self._model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"What's trending right now about: {topic}"},
                    ],
                    "max_tokens": 1000,
                },
            )
            response.raise_for_status()

        data = response.json()
        content = data["choices"][0]["message"]["content"]
        log.info("perplexity_research_complete", topic=topic[:50], response_length=len(content))
        return content
