#!/usr/bin/env python3
"""Zodiak Video Agent — CLI entry point.

Usage:
    python run.py                          # Full pipeline
    python run.py --dry-run                # Skip all external API calls
    python run.py --phase trend            # Run only trend discovery
    python run.py --topic "AI agents"      # Override topic selection
"""

from __future__ import annotations

import argparse
import sys
import time

from zodiak.config import load_config
from zodiak.db import AgentDB
from zodiak.logger import get_logger, setup_logging
from zodiak.pipeline import orchestrator

log = get_logger(__name__)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Zodiak Video Agent")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run without making external API calls",
    )
    parser.add_argument(
        "--phase",
        choices=["trend", "content", "voiceover", "clips", "video", "publish"],
        help="Run only a specific phase (for testing)",
    )
    parser.add_argument(
        "--topic",
        type=str,
        help="Override topic selection with a specific topic",
    )
    parser.add_argument(
        "--trigger",
        choices=["cron", "manual", "test"],
        default="manual",
        help="Trigger type for the agent_runs record",
    )
    return parser.parse_args()


def main() -> int:
    """Run the Zodiak Video Agent pipeline."""
    setup_logging()
    args = parse_args()

    log.info("agent_start", dry_run=args.dry_run, phase=args.phase, topic=args.topic)

    # Load and validate configuration
    try:
        config = load_config(
            dry_run=args.dry_run,
            phase=args.phase,
            topic_override=args.topic,
        )
    except EnvironmentError as exc:
        log.error("config_error", error=str(exc))
        print(f"\nConfiguration error:\n{exc}", file=sys.stderr)
        return 1

    log.info("config_loaded", **config.log_summary())

    # Initialize database client
    db = AgentDB(config.supabase)

    # Create agent_runs record
    run_id = db.create_run(trigger_type=args.trigger)
    log.info("run_created", run_id=run_id)

    start_time = time.monotonic()

    try:
        if args.dry_run:
            log.info("dry_run_mode", msg="Skipping pipeline — dry run")
            db.append_progress(run_id, "Dry run — no API calls made")
            db.complete_run(run_id, duration_ms=0)
            print("Dry run completed successfully.")
            return 0

        result = orchestrator.run(config=config, run_id=run_id, db=db)

        duration_ms = int((time.monotonic() - start_time) * 1000)
        db.complete_run(
            run_id,
            article_id=result.get("article_id"),
            duration_ms=duration_ms,
            cost_breakdown=result.get("costs"),
        )

        log.info(
            "agent_complete",
            run_id=run_id,
            article_id=result.get("article_id"),
            slug=result.get("slug"),
            duration_ms=duration_ms,
        )
        print(f"Pipeline completed. Article: /blog/{result.get('slug')}")
        return 0

    except Exception as exc:
        duration_ms = int((time.monotonic() - start_time) * 1000)
        error_msg = f"{type(exc).__name__}: {exc}"
        db.fail_run(run_id, error_msg)
        log.error("agent_failed", run_id=run_id, error=error_msg, duration_ms=duration_ms)
        print(f"\nPipeline failed: {error_msg}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
