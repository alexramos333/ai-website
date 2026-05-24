#!/usr/bin/env python3
"""Re-encode all stock clips from HEVC to H.264 and re-upload to R2.

This fixes Shotstack render failures caused by HEVC input files.
All clips are normalized to H.264, 1080x1920 vertical, AAC audio.

Requirements: ffmpeg must be installed (brew install ffmpeg)
"""

import subprocess
import sys
import tempfile
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from zodiak.config import load_config
from zodiak.db import AgentDB
from zodiak.storage import R2Storage


def reencode_clip(input_path: Path, output_path: Path) -> bool:
    """Re-encode a clip to H.264 1080x1920 using ffmpeg."""
    cmd = [
        "ffmpeg", "-y",
        "-i", str(input_path),
        "-c:v", "libx264",
        "-crf", "18",
        "-preset", "medium",
        "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:-1:-1:color=black",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        str(output_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ffmpeg error: {result.stderr[-300:]}")
        return False
    return True


def main():
    # Check ffmpeg
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
    except FileNotFoundError:
        print("ffmpeg not found. Install with: brew install ffmpeg")
        sys.exit(1)

    cfg = load_config(dry_run=True)
    db = AgentDB(cfg.supabase)
    storage = R2Storage(cfg.r2)

    clips = db.get_stock_clips(limit=50)
    print(f"Found {len(clips)} stock clips to re-encode\n")

    success = 0
    failed = 0

    for clip in clips:
        filename = clip["filename"]
        r2_url = clip["r2_url"]
        clip_id = clip["id"]

        print(f"Processing: {filename}")

        with tempfile.TemporaryDirectory() as tmp:
            input_path = Path(tmp) / "input.mp4"
            output_path = Path(tmp) / "output.mp4"

            # Download from R2
            print("  Downloading...")
            try:
                video_bytes = storage.download_url(r2_url)
                input_path.write_bytes(video_bytes)
            except Exception as e:
                print(f"  Download failed: {e}")
                failed += 1
                continue

            # Re-encode
            print("  Re-encoding to H.264...")
            if not reencode_clip(input_path, output_path):
                failed += 1
                continue

            old_size = input_path.stat().st_size
            new_size = output_path.stat().st_size
            print(f"  Size: {old_size:,} -> {new_size:,} bytes")

            # Upload back to R2 (same key, overwrite)
            r2_key = f"stock-clips/{filename}"
            print(f"  Uploading to R2: {r2_key}")
            try:
                new_url = storage.upload_bytes(
                    output_path.read_bytes(),
                    r2_key,
                    content_type="video/mp4",
                )
                print(f"  Uploaded: {new_url[:80]}...")

                # Update DB if URL changed
                if new_url != r2_url:
                    db._client.table("stock_clips").update(
                        {"r2_url": new_url}
                    ).eq("id", clip_id).execute()
                    print("  DB updated")

                success += 1
            except Exception as e:
                print(f"  Upload failed: {e}")
                failed += 1

        print()

    print(f"\nDone! {success} re-encoded, {failed} failed")


if __name__ == "__main__":
    main()
