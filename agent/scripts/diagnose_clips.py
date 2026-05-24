#!/usr/bin/env python3
"""Diagnose stock clips by probing them via Shotstack's probe API."""

import sys
from pathlib import Path
from urllib.parse import quote, urlparse, urlunparse

import httpx

# Add parent to path so we can import zodiak
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from zodiak.config import load_config

def encode_url(url: str) -> str:
    parsed = urlparse(url)
    encoded_path = quote(parsed.path, safe="/")
    return urlunparse(parsed._replace(path=encoded_path))

def main():
    cfg = load_config(dry_run=True)

    # Get Shotstack API key
    api_key = cfg.shotstack.api_key
    base_url = "https://api.shotstack.io/stage"

    # Get a few clips from DB
    from zodiak.db import AgentDB
    db = AgentDB(cfg.supabase)
    clips = db.get_stock_clips(limit=5)

    # Also test the voiceover URL from the last run
    test_urls = []
    for c in clips:
        test_urls.append(("clip", c["filename"], c["r2_url"]))

    print(f"Testing {len(test_urls)} assets via Shotstack probe API...\n")

    with httpx.Client(timeout=30) as client:
        for asset_type, name, url in test_urls:
            encoded = encode_url(url)
            probe_url = f"{base_url}/probe/{quote(encoded, safe='')}"

            print(f"--- {name} ---")
            print(f"  URL: {encoded[:80]}...")

            resp = client.get(probe_url, headers={"x-api-key": api_key})

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
                    elif codec_type == "audio":
                        sr = stream.get("sample_rate", "?")
                        print(f"  Audio: {codec} {sr}Hz")
            else:
                print(f"  FAILED: {resp.status_code}")
                print(f"  Body: {resp.text[:300]}")

            print()

if __name__ == "__main__":
    main()
