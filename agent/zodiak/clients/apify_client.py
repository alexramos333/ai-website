"""Apify client for TikTok trending topic discovery."""

from __future__ import annotations

from typing import Any

from apify_client import ApifyClient as _ApifyClient
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from zodiak.config import ApifyConfig
from zodiak.logger import get_logger

log = get_logger(__name__)


class ApifyTrendClient:
    """Fetch TikTok trending data via Apify actors."""

    ACTOR_ID = "clockworks/tiktok-trends-scraper"
    TIMEOUT_SECS = 60

    def __init__(self, config: ApifyConfig) -> None:
        self._client = _ApifyClient(token=config.api_token)

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=2, min=4, max=30),
    )
    def fetch_trends(self, search_queries: list[str] | None = None) -> list[dict[str, Any]]:
        """Run the TikTok trends scraper and return trending items."""
        if search_queries is None:
            search_queries = ["AI marketing", "AI tools", "ChatGPT tips", "AI automation"]

        log.info("apify_trends_start", queries=search_queries)

        run_input = {
            "searchQueries": search_queries,
            "maxItems": 20,
        }

        run = self._client.actor(self.ACTOR_ID).call(
            run_input=run_input,
            timeout_secs=self.TIMEOUT_SECS,
        )

        items = list(self._client.dataset(run["defaultDatasetId"]).iterate_items())
        log.info("apify_trends_complete", item_count=len(items))
        return items
