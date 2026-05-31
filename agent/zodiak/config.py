"""Configuration loader for the Zodiak Video Agent.

Loads environment variables from the repository root .env.local file
and validates that all required variables are present.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv


def _mask_key(value: str) -> str:
    """Mask an API key for safe logging (show first 6 chars)."""
    if len(value) <= 6:
        return "***"
    return value[:6] + "***"


@dataclass(frozen=True)
class SupabaseConfig:
    url: str
    service_role_key: str
    default_author_id: str


@dataclass(frozen=True)
class AnthropicConfig:
    api_key: str
    model: str = "claude-sonnet-4-5-20250929"


@dataclass(frozen=True)
class ApifyConfig:
    api_token: str


@dataclass(frozen=True)
class PerplexityConfig:
    api_key: str
    model: str = "sonar-pro"


@dataclass(frozen=True)
class ElevenLabsConfig:
    api_key: str
    voice_id: str
    model: str = "eleven_multilingual_v2"
    stability: float = 0.5
    similarity_boost: float = 0.75


@dataclass(frozen=True)
class VeoConfig:
    api_key: str
    credentials_path: str = ""
    monthly_spend_cap: float = 15.0


@dataclass(frozen=True)
class ShotstackConfig:
    api_key_sandbox: str
    api_key_production: str
    env: str = "sandbox"  # "sandbox" or "production"
    daily_render_cap: int = 3

    @property
    def api_key(self) -> str:
        if self.env == "production":
            return self.api_key_production
        return self.api_key_sandbox


@dataclass(frozen=True)
class R2Config:
    access_key_id: str
    secret_access_key: str
    endpoint_url: str
    public_url: str
    bucket_name: str = "video-agent-storage"


@dataclass(frozen=True)
class AgentConfig:
    supabase: SupabaseConfig
    anthropic: AnthropicConfig
    apify: ApifyConfig
    perplexity: PerplexityConfig
    elevenlabs: ElevenLabsConfig
    veo: VeoConfig
    shotstack: ShotstackConfig
    r2: R2Config
    dry_run: bool = False
    phase: str | None = None
    topic_override: str | None = None

    # Computed fields
    _masked_keys: dict[str, str] = field(default_factory=dict, repr=False)

    def log_summary(self) -> dict[str, str]:
        """Return a safe-to-log summary of configured services."""
        return {
            "supabase_url": self.supabase.url,
            "anthropic_key": _mask_key(self.anthropic.api_key),
            "apify_key": _mask_key(self.apify.api_token),
            "perplexity_key": _mask_key(self.perplexity.api_key),
            "elevenlabs_key": _mask_key(self.elevenlabs.api_key),
            "elevenlabs_voice": self.elevenlabs.voice_id,
            "shotstack_env": self.shotstack.env,
            "r2_bucket": self.r2.bucket_name,
            "veo_cap": f"${self.veo.monthly_spend_cap:.2f}",
            "dry_run": str(self.dry_run),
        }


def _require(name: str) -> str:
    """Get a required environment variable or raise with a clear message."""
    value = os.environ.get(name)
    if not value:
        raise EnvironmentError(f"Required environment variable {name} is not set")
    return value


def load_config(
    *,
    dry_run: bool = False,
    phase: str | None = None,
    topic_override: str | None = None,
) -> AgentConfig:
    """Load and validate all configuration from .env.local.

    Raises EnvironmentError if any required variables are missing.
    """
    # Load .env.local from repo root
    env_path = Path(__file__).resolve().parents[2] / ".env.local"
    if env_path.exists():
        load_dotenv(env_path, override=False)

    # Also check for env vars passed directly (e.g. from GitHub Actions)
    missing: list[str] = []

    def get(name: str) -> str:
        val = os.environ.get(name, "")
        if not val:
            missing.append(name)
        return val

    # Gather all required vars
    supabase_url = get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = get("SUPABASE_SERVICE_ROLE_KEY")
    author_id = get("DEFAULT_AUTHOR_ID")
    anthropic_key = get("ANTHROPIC_API_KEY_ZODIAK_AGENT")
    apify_token = get("APIFY_API_TOKEN")
    perplexity_key = get("PERPLEXITY_API_KEY")
    elevenlabs_key = get("ELEVENLABS_API_KEY")
    elevenlabs_voice = get("ELEVENLABS_VOICE_ID")
    gemini_key = get("GEMINI_API_KEY")
    gcp_creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
    shotstack_sandbox = get("SHOTSTACK_API_KEY_SANDBOX")
    shotstack_prod = get("SHOTSTACK_API_KEY_PRODUCTION")
    r2_access = get("R2_ACCESS_KEY_ID")
    r2_secret = get("R2_SECRET_ACCESS_KEY")
    r2_endpoint = get("R2_ENDPOINT_URL")
    r2_public = get("R2_PUBLIC_URL")

    if missing:
        raise EnvironmentError(
            f"Missing {len(missing)} required environment variable(s):\n"
            + "\n".join(f"  - {name}" for name in missing)
        )

    # Optional vars with defaults
    veo_cap = float(os.environ.get("VEO_MONTHLY_SPEND_CAP", "15.0"))
    shotstack_env = os.environ.get("SHOTSTACK_ENV", "sandbox")
    shotstack_daily_cap = int(os.environ.get("SHOTSTACK_DAILY_RENDER_CAP", "3"))
    r2_bucket = os.environ.get("R2_BUCKET_NAME", "video-agent-storage")
    anthropic_model = os.environ.get("ZODIAK_MODEL", "claude-sonnet-4-5-20250929")

    return AgentConfig(
        supabase=SupabaseConfig(
            url=supabase_url,
            service_role_key=supabase_key,
            default_author_id=author_id,
        ),
        anthropic=AnthropicConfig(api_key=anthropic_key, model=anthropic_model),
        apify=ApifyConfig(api_token=apify_token),
        perplexity=PerplexityConfig(api_key=perplexity_key),
        elevenlabs=ElevenLabsConfig(
            api_key=elevenlabs_key,
            voice_id=elevenlabs_voice,
        ),
        veo=VeoConfig(api_key=gemini_key, credentials_path=gcp_creds, monthly_spend_cap=veo_cap),
        shotstack=ShotstackConfig(
            api_key_sandbox=shotstack_sandbox,
            api_key_production=shotstack_prod,
            env=shotstack_env,
            daily_render_cap=shotstack_daily_cap,
        ),
        r2=R2Config(
            access_key_id=r2_access,
            secret_access_key=r2_secret,
            endpoint_url=r2_endpoint,
            public_url=r2_public.rstrip("/"),
            bucket_name=r2_bucket,
        ),
        dry_run=dry_run,
        phase=phase,
        topic_override=topic_override,
    )
