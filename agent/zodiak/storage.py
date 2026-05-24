"""Cloudflare R2 storage client for uploading/downloading media files."""

from __future__ import annotations

from pathlib import Path

import boto3
import httpx

from zodiak.config import R2Config
from zodiak.logger import get_logger

log = get_logger(__name__)


class R2Storage:
    """Upload and download files from Cloudflare R2."""

    def __init__(self, config: R2Config) -> None:
        self._config = config
        self._client = boto3.client(
            "s3",
            endpoint_url=config.endpoint_url,
            aws_access_key_id=config.access_key_id,
            aws_secret_access_key=config.secret_access_key,
            region_name="auto",
        )

    def upload_file(self, local_path: str | Path, r2_key: str, content_type: str = "") -> str:
        """Upload a local file to R2.

        Returns the public URL of the uploaded file.
        """
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type

        self._client.upload_file(
            str(local_path),
            self._config.bucket_name,
            r2_key,
            ExtraArgs=extra_args,
        )
        url = f"{self._config.public_url}/{r2_key}"
        log.info("r2_upload_complete", key=r2_key, url=url)
        return url

    def upload_bytes(self, data: bytes, r2_key: str, content_type: str = "") -> str:
        """Upload raw bytes to R2.

        Returns the public URL of the uploaded file.
        """
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type

        self._client.put_object(
            Bucket=self._config.bucket_name,
            Key=r2_key,
            Body=data,
            **extra_args,
        )
        url = f"{self._config.public_url}/{r2_key}"
        log.info("r2_upload_complete", key=r2_key, size_bytes=len(data))
        return url

    def download_url(self, url: str) -> bytes:
        """Download a file from any URL and return its bytes."""
        with httpx.Client(timeout=120) as client:
            response = client.get(url)
            response.raise_for_status()
            log.info("download_complete", url=url[:80], size_bytes=len(response.content))
            return response.content
