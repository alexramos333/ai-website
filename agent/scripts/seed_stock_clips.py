"""
Seed the stock_clips table by scanning the Cloudflare R2 bucket.

Reads filenames from the R2 stock-clips/ prefix, extracts tags from
dash-separated words in each filename, and upserts rows into Supabase.

Usage:
    cd agent
    pip install -r requirements.txt
    python scripts/seed_stock_clips.py
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

import boto3
from dotenv import load_dotenv
from supabase import create_client

# ── Load environment ────────────────────────────────────────────
ENV_PATH = Path(__file__).resolve().parents[2] / ".env.local"
load_dotenv(ENV_PATH)

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
R2_ACCESS_KEY = os.environ["R2_ACCESS_KEY_ID"]
R2_SECRET_KEY = os.environ["R2_SECRET_ACCESS_KEY"]
R2_ENDPOINT = os.environ["R2_ENDPOINT_URL"]
R2_PUBLIC_URL = os.environ["R2_PUBLIC_URL"].rstrip("/")

BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "video-agent-storage")
PREFIX = "stock-clips/"

# Words to skip when generating tags (too generic)
SKIP_WORDS = {"mp4", "mov", "webm", "avi", "clip", "video", "stock", "bg", "background"}


def extract_tags(filename: str) -> list[str]:
    """Extract meaningful tags from a dash-separated filename.

    Example: 'space-nebula-blue-001.mp4' -> ['space', 'nebula', 'blue']
    """
    stem = Path(filename).stem  # strip extension
    parts = re.split(r"[-_]", stem.lower())
    tags = [p for p in parts if p and not p.isdigit() and p not in SKIP_WORDS]
    return list(dict.fromkeys(tags))  # deduplicate, preserve order


def main() -> None:
    # ── Connect to R2 ───────────────────────────────────────────
    s3 = boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        region_name="auto",
    )

    # ── List objects in stock-clips/ ────────────────────────────
    paginator = s3.get_paginator("list_objects_v2")
    clips: list[dict] = []

    for page in paginator.paginate(Bucket=BUCKET_NAME, Prefix=PREFIX):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            filename = key.removeprefix(PREFIX)

            # Skip directory markers and non-video files
            if not filename or not filename.lower().endswith((".mp4", ".mov", ".webm")):
                continue

            r2_url = f"{R2_PUBLIC_URL}/{key}"
            tags = extract_tags(filename)

            clips.append(
                {
                    "filename": filename,
                    "r2_url": r2_url,
                    "tags": tags,
                    "duration_seconds": 0,  # will be updated later if needed
                    "width": 1080,
                    "height": 1920,
                    "active": True,
                }
            )

    if not clips:
        print(f"No video files found in {BUCKET_NAME}/{PREFIX}")
        sys.exit(1)

    print(f"Found {len(clips)} stock clips in R2")

    # ── Upsert into Supabase ────────────────────────────────────
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Check existing clips to avoid duplicates
    existing = supabase.table("stock_clips").select("filename").execute()
    existing_filenames = {row["filename"] for row in existing.data}

    new_clips = [c for c in clips if c["filename"] not in existing_filenames]

    if not new_clips:
        print("All clips already seeded. Nothing to insert.")
        return

    # Insert in batches of 50
    batch_size = 50
    inserted = 0
    for i in range(0, len(new_clips), batch_size):
        batch = new_clips[i : i + batch_size]
        result = supabase.table("stock_clips").insert(batch).execute()
        inserted += len(result.data)
        print(f"  Inserted batch {i // batch_size + 1}: {len(result.data)} clips")

    print(f"Done! Seeded {inserted} new stock clips ({len(existing_filenames)} already existed)")


if __name__ == "__main__":
    main()
