#!/usr/bin/env python3
"""Probe ALL assets (clips + voiceover) via Shotstack's probe API.

Identifies exactly which asset(s) are failing and reports codec details.
"""

import sys
from pathlib import Path
from urllib.parse import quote, urlparse, urlunparse

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from zodiak.config import load_config
from zodiak.db import AgentDB


def encode_url(url: str) -> str:
    parsed = urlparse(url)
    encoded_path = quote(parsed.path, safe="/")
    return urlunparse(parsed._replace(path=encoded_path))


def probe_url(client: httpx.Client, api_key: str, base_url: str, name: str, url: str) -> bool:
    """Probe a single URL. Returns True if valid."""
    encoded = encode_url(url)
    probe_endpoint = f"{base_url}/probe/{quote(encoded, safe='')}"

    print(f"\n--- {name} ---")
    print(f"  URL: {encoded[:100]}...")

    resp = client.get(probe_endpoint, headers={"x-api-key": api_key})

    if resp.status_code == 200:
        data = resp.json().get("response", {})
        metadata = data.get("metadata", {})
        streams = metadata.get("streams", [])
        fmt = metadata.get("format", {})

        print(f"  Status: OK")
        print(f"  Format: {fmt.get('format_name', 'unknown')}")
        print(f"  Duration: {fmt.get('duration', 'unknown')}s")
        print(f"  Size: {fmt.get('size', 'unknown')} bytes")

        for stream in streams:
            codec = stream.get("codec_name", "unknown")
            codec_type = stream.get("codec_type", "unknown")
            if codec_type == "video":
                w = stream.get("width", "?")
                h = stream.get("height", "?")
                print(f"  Video: {codec} {w}x{h}")
                if codec in ("hevc", "h265"):
                    print(f"  *** WARNING: Still HEVC! CDN may be serving cached version ***")
            elif codec_type == "audio":
                sr = stream.get("sample_rate", "?")
                channels = stream.get("channels", "?")
                print(f"  Audio: {codec} {sr}Hz {channels}ch")
        return True
    else:
        print(f"  FAILED: {resp.status_code}")
        print(f"  Body: {resp.text[:300]}")
        return False


def main():
    cfg = load_config(dry_run=True)
    api_key = cfg.shotstack.api_key
    base_url = "https://api.shotstack.io/stage"

    db = AgentDB(cfg.supabase)

    # Get all active clips
    clips = db.get_stock_clips(limit=50)
    print(f"Found {len(clips)} stock clips to probe")

    # Also probe the most recent voiceover (if any exist in R2)
    # Check for the voiceover from the last run
    voiceover_url = f"{cfg.r2.public_url}/voiceovers/2026-05-24/ai-agents-for-business-automation-the-complete-2026-guide-to-intelligent-workfor.mp3"

    ok_count = 0
    fail_count = 0
    hevc_count = 0

    with httpx.Client(timeout=30) as client:
        # Probe voiceover first
        print("\n" + "=" * 60)
        print("VOICEOVER PROBE")
        print("=" * 60)
        if probe_url(client, api_key, base_url, "voiceover.mp3", voiceover_url):
            ok_count += 1
        else:
            fail_count += 1
            print("  *** VOICEOVER IS THE PROBLEM ***")

        # Probe all clips
        print("\n" + "=" * 60)
        print("STOCK CLIP PROBES")
        print("=" * 60)

        for clip in clips:
            success = probe_url(
                client, api_key, base_url, clip["filename"], clip["r2_url"]
            )
            if success:
                ok_count += 1
            else:
                fail_count += 1

    print("\n" + "=" * 60)
    print(f"RESULTS: {ok_count} OK, {fail_count} FAILED")
    if fail_count > 0:
        print("^^^ The FAILED assets above are causing the Shotstack render to break")
    print("=" * 60)


if __name__ == "__main__":
    main()
