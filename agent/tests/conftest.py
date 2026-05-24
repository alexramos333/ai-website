"""Shared test fixtures and mocks for the Zodiak Video Agent."""

from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock

import pytest

from zodiak.config import (
    AgentConfig,
    AnthropicConfig,
    ApifyConfig,
    ElevenLabsConfig,
    PerplexityConfig,
    R2Config,
    ShotstackConfig,
    SupabaseConfig,
    VeoConfig,
)


@pytest.fixture
def mock_config() -> AgentConfig:
    """A fully populated AgentConfig with test values."""
    return AgentConfig(
        supabase=SupabaseConfig(
            url="https://test.supabase.co",
            service_role_key="test-service-role-key-000000",
            default_author_id="00000000-0000-0000-0000-000000000000",
        ),
        anthropic=AnthropicConfig(api_key="sk-ant-test-000000"),
        apify=ApifyConfig(api_token="apify_test_000000"),
        perplexity=PerplexityConfig(api_key="pplx-test-000000"),
        elevenlabs=ElevenLabsConfig(
            api_key="el-test-000000",
            voice_id="test-voice-id",
        ),
        veo=VeoConfig(
            credentials_path="/tmp/test-gcp-creds.json",
            monthly_spend_cap=15.0,
        ),
        shotstack=ShotstackConfig(
            api_key_sandbox="ss-sandbox-test-000000",
            api_key_production="ss-prod-test-000000",
            env="sandbox",
            daily_render_cap=3,
        ),
        r2=R2Config(
            access_key_id="test-r2-access",
            secret_access_key="test-r2-secret",
            endpoint_url="https://test.r2.cloudflarestorage.com",
            public_url="https://pub-test.r2.dev",
        ),
        dry_run=True,
    )


@pytest.fixture
def mock_db() -> MagicMock:
    """A mocked AgentDB instance."""
    db = MagicMock()
    db.create_run.return_value = "test-run-id-001"
    db.get_recent_article_titles.return_value = [
        "How AI Is Changing Marketing",
        "The Future of AI Agents",
    ]
    db.get_stock_clips.return_value = [
        {
            "id": "clip-001",
            "filename": "tech-abstract-blue-001.mp4",
            "r2_url": "https://pub-test.r2.dev/stock-clips/tech-abstract-blue-001.mp4",
            "tags": ["tech", "abstract", "blue"],
            "duration_seconds": 10,
            "active": True,
        },
        {
            "id": "clip-002",
            "filename": "data-analytics-dashboard-001.mp4",
            "r2_url": "https://pub-test.r2.dev/stock-clips/data-analytics-dashboard-001.mp4",
            "tags": ["data", "analytics", "dashboard"],
            "duration_seconds": 8,
            "active": True,
        },
    ]
    db.slug_exists.return_value = False
    db.get_veo_monthly_spend.return_value = 0.0
    db.get_today_render_count.return_value = 0
    db.insert_article.return_value = {"id": "article-001", "slug": "test-article"}
    return db


@pytest.fixture
def sample_article() -> dict[str, Any]:
    """A sample article dict as returned by content_gen.generate_blog_article."""
    return {
        "title": "How AI Agents Are Transforming Business in 2026",
        "content_html": "<h2>Introduction</h2><p>AI agents are here.</p>",
        "content_markdown": "## Introduction\nAI agents are here.",
        "excerpt": "Discover how AI agents are transforming business workflows.",
        "meta_title": "AI Agents Transform Business 2026",
        "meta_description": "Learn how AI agents are automating workflows and boosting productivity for businesses in 2026.",
        "tags": ["ai", "agents", "business", "automation"],
        "slug": "how-ai-agents-are-transforming-business-in-2026",
    }


@pytest.fixture
def sample_video_script() -> dict[str, Any]:
    """A sample video script dict as returned by content_gen.generate_video_script."""
    return {
        "script_text": "AI agents are changing everything. Here is what you need to know.",
        "scene_descriptions": [
            "Futuristic AI dashboard with glowing data",
            "Person using laptop with AI assistant",
            "Abstract neural network visualization",
        ],
        "caption_words": [
            "AI", "agents", "are", "changing", "everything",
            "Here", "is", "what", "you", "need", "to", "know",
        ],
        "estimated_duration_seconds": 45,
    }
