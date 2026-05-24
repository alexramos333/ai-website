"""ElevenLabs client for voiceover synthesis using cloned voice."""

from __future__ import annotations

import io

from elevenlabs import ElevenLabs
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from zodiak.config import ElevenLabsConfig
from zodiak.logger import get_logger

log = get_logger(__name__)


class VoiceoverClient:
    """Synthesize voiceover audio from text using ElevenLabs."""

    def __init__(self, config: ElevenLabsConfig) -> None:
        self._client = ElevenLabs(api_key=config.api_key)
        self._voice_id = config.voice_id
        self._model = config.model
        self._stability = config.stability
        self._similarity_boost = config.similarity_boost

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=4, max=60),
    )
    def synthesize(self, text: str) -> bytes:
        """Convert text to speech and return MP3 audio bytes."""
        log.info("voiceover_start", text_length=len(text), voice_id=self._voice_id)

        audio_generator = self._client.text_to_speech.convert(
            voice_id=self._voice_id,
            text=text,
            model_id=self._model,
            voice_settings={
                "stability": self._stability,
                "similarity_boost": self._similarity_boost,
            },
            output_format="mp3_44100_128",
        )

        # Collect all chunks into bytes
        buffer = io.BytesIO()
        for chunk in audio_generator:
            buffer.write(chunk)

        audio_bytes = buffer.getvalue()
        log.info("voiceover_complete", size_bytes=len(audio_bytes))
        return audio_bytes
