"""Content generation: SEO blog article + video script via Claude Sonnet.

This is the video agent's OWN content generation — completely separate from
the existing Google Sheets-triggered SEO article pipeline.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

import markdown as md

from zodiak.clients.anthropic_client import ClaudeClient
from zodiak.logger import get_logger

log = get_logger(__name__)

BLOG_SYSTEM = """You are an expert SEO content writer specializing in AI and digital marketing.
Write a comprehensive, engaging blog article about the given topic.

Requirements:
- 1200-1800 words
- Compelling H1 title
- Opening hook paragraph
- 3-5 H2 sections with practical content
- Include specific examples, statistics, or actionable tips
- Conclusion with a call to action
- Write in a professional but conversational tone

Output format — respond with a JSON object:
{
  "title": "The SEO-optimized article title",
  "content_markdown": "The full article in Markdown (H2/H3 headings, bullet points, etc.)",
  "excerpt": "A 150-200 character excerpt for previews",
  "meta_title": "SEO meta title (under 60 characters)",
  "meta_description": "SEO meta description (under 160 characters)",
  "tags": ["tag1", "tag2", "tag3"]
}"""

VIDEO_SCRIPT_SYSTEM = """You are a viral short-form video scriptwriter.
Write a 30-60 second video script (150-200 spoken words) for the given topic.

Requirements:
- Hook in the first 3 seconds that stops the scroll
- Conversational, energetic language
- Pattern interrupt around the 15-second mark
- One clear takeaway the viewer remembers
- Soft CTA pointing to the full blog article
- Script should work as voiceover with stock footage b-roll

Output format — respond with a JSON object:
{
  "script_text": "The full script as spoken text (no stage directions)",
  "scene_descriptions": [
    "Visual description for scene 1 (first 5 seconds)",
    "Visual description for scene 2 (next 5-10 seconds)",
    ...
  ],
  "caption_words": ["word1", "word2", ...],
  "estimated_duration_seconds": 45
}"""


def generate_blog_article(
    *,
    claude: ClaudeClient,
    topic: str,
    angle: str,
    keywords: list[str],
    research_context: str = "",
) -> dict[str, Any]:
    """Generate an SEO-optimized blog article.

    Returns dict with: title, content_html, excerpt, meta_title, meta_description, tags, slug.
    """
    today = datetime.now(timezone.utc).strftime("%B %d, %Y")

    user_prompt = f"""Topic: {topic}
Angle: {angle}
Target keywords: {', '.join(keywords)}
Today's date: {today}

{f'Research context:{chr(10)}{research_context}' if research_context else ''}

Write the blog article. Return JSON only."""

    result = claude.generate_json(
        system=BLOG_SYSTEM,
        user_prompt=user_prompt,
        max_tokens=4096,
        temperature=0.7,
    )

    # Convert Markdown to HTML
    content_markdown = result.get("content_markdown", "")
    content_html = md.markdown(
        content_markdown,
        extensions=["extra", "toc", "sane_lists"],
    )

    # Generate slug from title
    slug = _slugify(result["title"])

    article = {
        "title": result["title"],
        "content_html": content_html,
        "content_markdown": content_markdown,
        "excerpt": result.get("excerpt", ""),
        "meta_title": result.get("meta_title", result["title"][:60]),
        "meta_description": result.get("meta_description", ""),
        "tags": result.get("tags", keywords[:5]),
        "slug": slug,
    }

    log.info(
        "blog_article_generated",
        title=article["title"][:80],
        word_count=len(content_markdown.split()),
        tag_count=len(article["tags"]),
    )
    return article


def generate_video_script(
    *,
    claude: ClaudeClient,
    topic: str,
    angle: str,
    video_hook: str,
) -> dict[str, Any]:
    """Generate a 30-60 second video script.

    Returns dict with: script_text, scene_descriptions, caption_words, estimated_duration_seconds.
    """
    user_prompt = f"""Topic: {topic}
Angle: {angle}
Opening hook idea: {video_hook}

Write the video script. Return JSON only."""

    result = claude.generate_json(
        system=VIDEO_SCRIPT_SYSTEM,
        user_prompt=user_prompt,
        max_tokens=1500,
        temperature=0.8,
    )

    word_count = len(result.get("script_text", "").split())
    log.info(
        "video_script_generated",
        word_count=word_count,
        scenes=len(result.get("scene_descriptions", [])),
        est_duration=result.get("estimated_duration_seconds", 0),
    )
    return result


def _slugify(text: str) -> str:
    """Generate a URL-safe slug from text."""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    slug = slug.strip("-")
    return slug[:80]
