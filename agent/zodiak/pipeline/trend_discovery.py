"""Trending topic discovery: Apify TikTok + Perplexity + Claude selection."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from zodiak.clients.anthropic_client import ClaudeClient
from zodiak.clients.apify_client import ApifyTrendClient
from zodiak.clients.perplexity_client import PerplexityClient
from zodiak.db import AgentDB
from zodiak.logger import get_logger

log = get_logger(__name__)

FALLBACK_TOPICS_PATH = Path(__file__).parent.parent / "fallback_topics.json"

TOPIC_SELECTION_SYSTEM = """You are an AI content strategist. Your job is to select the single best topic for today's video and blog post.

The topic should be:
1. Currently trending in AI or digital marketing
2. Relevant to business owners and marketers
3. Different from recent articles (avoid repeats)
4. Has a strong visual angle for a 30-60 second video
5. Has enough depth for a 1200-1800 word blog article

Respond with a JSON object:
{
  "topic": "The specific topic title",
  "angle": "The unique angle or hook for this content",
  "target_keywords": ["keyword1", "keyword2", "keyword3"],
  "video_hook": "A compelling 1-sentence hook for the first 3 seconds of the video",
  "reasoning": "Brief explanation of why this topic was selected"
}"""


def discover_trending_topic(
    *,
    apify: ApifyTrendClient,
    perplexity: PerplexityClient,
    claude: ClaudeClient,
    db: AgentDB,
    topic_override: str | None = None,
) -> dict[str, Any]:
    """Run the full trend discovery pipeline.

    Returns a dict with: topic, angle, target_keywords, video_hook.
    """
    # If topic is overridden, skip discovery
    if topic_override:
        log.info("topic_override", topic=topic_override)
        return {
            "topic": topic_override,
            "angle": "Comprehensive overview",
            "target_keywords": topic_override.lower().split(),
            "video_hook": f"Here's what you need to know about {topic_override}",
        }

    # Step 1: Get TikTok trends
    try:
        trends = apify.fetch_trends()
        trend_summary = _summarize_trends(trends)
    except Exception as exc:
        log.warning("apify_fallback", error=str(exc)[:200])
        trend_summary = _load_fallback_topics()

    # Step 2: Research top candidates via Perplexity
    candidates = _extract_candidates(trend_summary)[:3]
    research_results: list[str] = []
    for candidate in candidates:
        try:
            research = perplexity.research_topic(candidate)
            research_results.append(f"## {candidate}\n{research}")
        except Exception as exc:
            log.warning("perplexity_skip", topic=candidate, error=str(exc)[:100])

    # Step 3: Claude selects the best topic
    recent_titles = db.get_recent_article_titles(10)

    user_prompt = f"""Here are today's trending topics from TikTok:
{trend_summary}

Here is detailed research on the top candidates:
{'---'.join(research_results) if research_results else 'No research available.'}

Recent articles already published (AVOID these topics):
{chr(10).join(f'- {t}' for t in recent_titles) if recent_titles else 'None yet.'}

Select the single best topic for today's video and blog post. Return JSON only."""

    result = claude.generate_json(
        system=TOPIC_SELECTION_SYSTEM,
        user_prompt=user_prompt,
        max_tokens=500,
        temperature=0.7,
    )

    log.info("topic_selected", topic=result.get("topic", "unknown"))
    return result


def _summarize_trends(trends: list[dict[str, Any]]) -> str:
    """Extract a readable summary from Apify trend data."""
    summaries = []
    for item in trends[:15]:
        title = item.get("text", item.get("desc", ""))[:200]
        stats = item.get("stats", {})
        views = stats.get("playCount", stats.get("views", 0))
        if title:
            summaries.append(f"- {title} (views: {views:,})" if views else f"- {title}")
    return "\n".join(summaries) if summaries else "No specific trends found."


def _extract_candidates(trend_summary: str) -> list[str]:
    """Extract topic candidates from trend summary."""
    lines = [line.strip("- ").strip() for line in trend_summary.split("\n") if line.strip("- ")]
    # Take the first meaningful phrase from each line
    candidates = []
    for line in lines:
        # Remove view counts
        topic = line.split("(views:")[0].strip()
        if topic and len(topic) > 5:
            candidates.append(topic)
    return candidates[:5]


def _load_fallback_topics() -> str:
    """Load curated fallback topics when Apify fails."""
    if FALLBACK_TOPICS_PATH.exists():
        topics = json.loads(FALLBACK_TOPICS_PATH.read_text())
        return "\n".join(f"- {t}" for t in topics)
    return (
        "- AI agents for business automation\n"
        "- How AI is changing digital marketing in 2026\n"
        "- Building custom AI software for small businesses\n"
        "- AI-powered data analytics trends\n"
        "- The future of AI video content creation"
    )
