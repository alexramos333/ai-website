"""Claude Sonnet client for content generation.

Uses ANTHROPIC_API_KEY_ZODIAK_AGENT — separate from the existing blog generator's key.
"""

from __future__ import annotations

import json
from typing import Any

import anthropic
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from zodiak.config import AnthropicConfig
from zodiak.logger import get_logger

log = get_logger(__name__)


class ClaudeClient:
    """Wrapper around the Anthropic SDK for the video agent."""

    def __init__(self, config: AnthropicConfig) -> None:
        self._client = anthropic.Anthropic(api_key=config.api_key)
        self._model = config.model

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=4, max=60),
        retry=retry_if_exception_type((anthropic.APITimeoutError, anthropic.APIStatusError)),
    )
    def generate(
        self,
        *,
        system: str,
        user_prompt: str,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> str:
        """Send a prompt to Claude and return the text response."""
        response = self._client.messages.create(
            model=self._model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system,
            messages=[{"role": "user", "content": user_prompt}],
        )
        text = response.content[0].text
        log.info(
            "claude_response",
            model=self._model,
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
            stop_reason=response.stop_reason,
        )
        return text

    def generate_json(
        self,
        *,
        system: str,
        user_prompt: str,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> dict[str, Any]:
        """Send a prompt and parse the response as JSON."""
        text = self.generate(
            system=system,
            user_prompt=user_prompt,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        # Strip markdown code fences if present
        cleaned = text.strip()
        if cleaned.startswith("```"):
            # Remove ```json or ``` at start and ``` at end
            lines = cleaned.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            cleaned = "\n".join(lines)

        return json.loads(cleaned)
