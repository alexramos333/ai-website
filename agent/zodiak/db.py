"""Supabase database client wrapper for the Zodiak Video Agent.

Uses the service_role key to bypass RLS for agent operations.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from supabase import Client, create_client

from zodiak.config import SupabaseConfig
from zodiak.logger import get_logger

log = get_logger(__name__)


class AgentDB:
    """Typed wrapper around Supabase for agent-specific operations."""

    def __init__(self, config: SupabaseConfig) -> None:
        self._client: Client = create_client(config.url, config.service_role_key)
        self._author_id = config.default_author_id

    # ── Agent runs ──────────────────────────────────────────────

    def create_run(self, trigger_type: str = "manual") -> str:
        """Create a new agent_runs row. Returns the run ID."""
        result = (
            self._client.table("agent_runs")
            .insert({"status": "running", "trigger_type": trigger_type})
            .execute()
        )
        run_id = result.data[0]["id"]
        log.info("agent_run_created", run_id=run_id, trigger_type=trigger_type)
        return run_id

    def update_run(self, run_id: str, **fields: Any) -> None:
        """Update an agent_runs row with arbitrary fields."""
        self._client.table("agent_runs").update(fields).eq("id", run_id).execute()

    def complete_run(
        self,
        run_id: str,
        *,
        article_id: str | None = None,
        duration_ms: int | None = None,
        cost_breakdown: dict[str, float] | None = None,
    ) -> None:
        """Mark a run as completed."""
        data: dict[str, Any] = {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
        if article_id:
            data["article_id"] = article_id
        if duration_ms is not None:
            data["duration_ms"] = duration_ms
        if cost_breakdown:
            data["cost_breakdown"] = cost_breakdown
        self.update_run(run_id, **data)
        log.info("agent_run_completed", run_id=run_id)

    def fail_run(self, run_id: str, error_message: str) -> None:
        """Mark a run as failed."""
        self.update_run(
            run_id,
            status="failed",
            error_message=error_message[:2000],  # truncate long errors
            completed_at=datetime.now(timezone.utc).isoformat(),
        )
        log.error("agent_run_failed", run_id=run_id, error=error_message[:200])

    def append_progress(self, run_id: str, message: str) -> None:
        """Append a message to the run's progress_log array."""
        timestamp = datetime.now(timezone.utc).strftime("%H:%M:%S")
        entry = f"[{timestamp}] {message}"
        # Fetch current log, append in Python, then update
        result = (
            self._client.table("agent_runs")
            .select("progress_log")
            .eq("id", run_id)
            .single()
            .execute()
        )
        current_log = result.data.get("progress_log") or []
        current_log.append(entry)
        self.update_run(run_id, progress_log=current_log)

    def set_run_topic(self, run_id: str, topic: str) -> None:
        """Set the topic for a run."""
        self.update_run(run_id, topic=topic)

    # ── Stock clips ─────────────────────────────────────────────

    def get_stock_clips(
        self, tags: list[str] | None = None, limit: int = 15
    ) -> list[dict[str, Any]]:
        """Get active stock clips, optionally filtered by tag overlap."""
        query = self._client.table("stock_clips").select("*").eq("active", True)

        if tags:
            # Postgres array overlap: tags && ARRAY[...]
            query = query.overlaps("tags", tags)

        result = query.limit(limit).execute()
        clips = result.data

        # If we didn't get enough with tag matching, fill with random
        if tags and len(clips) < 12:
            log.info(
                "clip_fallback",
                matched=len(clips),
                reason="insufficient tag matches, adding random clips",
            )
            existing_ids = {c["id"] for c in clips}
            fallback = (
                self._client.table("stock_clips")
                .select("*")
                .eq("active", True)
                .limit(limit - len(clips))
                .execute()
            )
            for clip in fallback.data:
                if clip["id"] not in existing_ids:
                    clips.append(clip)

        return clips[:limit]

    # ── Articles ────────────────────────────────────────────────

    def get_recent_article_titles(self, limit: int = 10) -> list[str]:
        """Get the most recent published article titles (for dedup)."""
        result = (
            self._client.table("articles")
            .select("title")
            .eq("published", True)
            .order("published_at", desc=True)
            .limit(limit)
            .execute()
        )
        return [row["title"] for row in result.data]

    def insert_article(
        self,
        *,
        title: str,
        slug: str,
        content: str,
        excerpt: str,
        meta_title: str,
        meta_description: str,
        og_image: str,
        tags: list[str],
        video_url: str | None = None,
        video_thumbnail_url: str | None = None,
        video_duration: int | None = None,
    ) -> dict[str, Any]:
        """Insert a new article into the articles table."""
        data: dict[str, Any] = {
            "title": title,
            "slug": slug,
            "content": content,
            "excerpt": excerpt,
            "meta_title": meta_title,
            "meta_description": meta_description,
            "og_image": og_image,
            "tags": tags,
            "author_id": self._author_id,
            "published": True,
            "published_at": datetime.now(timezone.utc).isoformat(),
        }
        if video_url:
            data["video_url"] = video_url
        if video_thumbnail_url:
            data["video_thumbnail_url"] = video_thumbnail_url
        if video_duration is not None:
            data["video_duration"] = video_duration

        result = self._client.table("articles").insert(data).select("id, slug").execute()
        row = result.data[0]
        log.info("article_inserted", slug=row["slug"], has_video=bool(video_url))
        return row

    def slug_exists(self, slug: str) -> bool:
        """Check if an article slug already exists."""
        result = (
            self._client.table("articles")
            .select("id")
            .eq("slug", slug)
            .limit(1)
            .execute()
        )
        return len(result.data) > 0

    # ── Veo usage ───────────────────────────────────────────────

    def get_veo_monthly_spend(self) -> float:
        """Get total Veo spend for the current month."""
        first_of_month = datetime.now(timezone.utc).strftime("%Y-%m-01")
        result = (
            self._client.table("veo_usage")
            .select("cost_usd")
            .gte("created_at", first_of_month)
            .execute()
        )
        return sum(float(row["cost_usd"]) for row in result.data)

    def log_veo_usage(
        self, run_id: str, cost_usd: float, prompt: str, video_url: str | None = None
    ) -> None:
        """Log a Veo generation to the veo_usage table."""
        self._client.table("veo_usage").insert(
            {
                "run_id": run_id,
                "cost_usd": cost_usd,
                "prompt": prompt,
                "video_url": video_url,
            }
        ).execute()
        log.info("veo_usage_logged", run_id=run_id, cost_usd=cost_usd)

    # ── Daily render count ──────────────────────────────────────

    def get_today_render_count(self) -> int:
        """Count how many agent runs completed today (for daily caps)."""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        result = (
            self._client.table("agent_runs")
            .select("id", count="exact")
            .eq("run_date", today)
            .in_("status", ["completed", "running"])
            .execute()
        )
        return result.count or 0
