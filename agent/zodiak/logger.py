"""Structured JSON logging for the Zodiak Video Agent.

Uses structlog for structured, machine-readable logs to stdout.
In production (GitHub Actions), outputs JSON. Locally, uses console renderer.
"""

from __future__ import annotations

import os
import sys

import structlog


def setup_logging(*, json_output: bool | None = None) -> None:
    """Configure structlog for the agent.

    Args:
        json_output: Force JSON output. If None, auto-detect based on
                     CI environment variable (GitHub Actions sets CI=true).
    """
    if json_output is None:
        json_output = os.environ.get("CI", "").lower() == "true"

    processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if json_output:
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer(colors=sys.stdout.isatty()))

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(0),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a named logger instance."""
    return structlog.get_logger(module=name)
