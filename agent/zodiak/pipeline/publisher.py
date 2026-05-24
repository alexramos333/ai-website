"""Blog publisher: write article + video to the articles table.

This is the agent's own publishing logic — separate from the existing
webhook at src/app/api/webhooks/ai-article/route.ts (which is NOT modified).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from zodiak.db import AgentDB
from zodiak.logger import get_logger

log = get_logger(__name__)


def publish_article(
    *,
    db: AgentDB,
    article: dict[str, Any],
    video_url: str | None = None,
    video_thumbnail_url: str | None = None,
    video_duration: int | None = None,
) -> dict[str, Any]:
    """Publish a blog article with optional video to the articles table.

    Args:
        db: Database client.
        article: Dict with title, content_html, excerpt, meta_title,
                 meta_description, tags, slug.
        video_url: R2 URL of the final video (None for text-only).
        video_thumbnail_url: R2 URL of the video thumbnail.
        video_duration: Video duration in seconds.

    Returns the inserted article data (id, slug).
    """
    slug = article["slug"]

    # Ensure slug is unique — append date if collision
    if db.slug_exists(slug):
        date_suffix = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        slug = f"{slug}-{date_suffix}"
        log.info("slug_collision_resolved", original=article["slug"], new=slug)

    # Use video thumbnail as og_image if no separate image
    og_image = video_thumbnail_url or article.get("og_image", "")

    result = db.insert_article(
        title=article["title"],
        slug=slug,
        content=article["content_html"],
        excerpt=article["excerpt"],
        meta_title=article["meta_title"],
        meta_description=article["meta_description"],
        og_image=og_image,
        tags=article["tags"],
        video_url=video_url,
        video_thumbnail_url=video_thumbnail_url,
        video_duration=video_duration,
    )

    log.info(
        "article_published",
        article_id=result["id"],
        slug=result["slug"],
        has_video=bool(video_url),
    )
    return result
