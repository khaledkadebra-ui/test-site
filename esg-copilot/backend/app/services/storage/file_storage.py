"""
File Storage Service — ESG Copilot
Abstracts local disk vs. S3/R2 so swap is one config change.
"""

import os
import uuid
import hashlib
import logging
from pathlib import Path
from typing import BinaryIO

from app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".pdf", ".xlsx", ".xls", ".csv"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB


class StorageError(Exception):
    pass


class FileStorage:
    """
    Upload and retrieve documents.
    Backend selected via STORAGE_BACKEND env var: 'local' or 's3'.
    """

    def __init__(self):
        self.backend = settings.STORAGE_BACKEND
        if self.backend == "local":
            self._local_root = Path(settings.LOCAL_STORAGE_PATH)
            self._local_root.mkdir(parents=True, exist_ok=True)
        elif self.backend == "s3":
            import boto3
            self._s3 = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
            )
            self._bucket = settings.S3_BUCKET_NAME
        else:
            raise StorageError(f"Unknown STORAGE_BACKEND: {self.backend}")

    def validate(self, filename: str, size_bytes: int) -> None:
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise StorageError(f"File type '{ext}' not allowed. Allowed: {sorted(ALLOWED_EXTENSIONS)}")
        if size_bytes > MAX_FILE_SIZE_BYTES:
            raise StorageError(f"File exceeds {MAX_FILE_SIZE_BYTES // (1024*1024)} MB limit")

    def upload(self, file: BinaryIO, original_filename: str, company_id: str) -> tuple[str, int]:
        """
        Upload file and return (storage_path, size_bytes).
        storage_path is an opaque key — never expose raw S3 paths to clients.
        """
        content = file.read()
        size = len(content)
        self.validate(original_filename, size)

        ext = Path(original_filename).suffix.lower()
        # Randomised key — no guessable paths
        storage_key = f"companies/{company_id}/docs/{uuid.uuid4().hex}{ext}"

        if self.backend == "local":
            dest = self._local_root / storage_key
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(content)
            logger.info("Stored file locally: %s (%d bytes)", dest, size)

        elif self.backend == "s3":
            self._s3.put_object(
                Bucket=self._bucket,
                Key=storage_key,
                Body=content,
                ServerSideEncryption="AES256",
                ContentType=_content_type(ext),
                Metadata={"company_id": company_id, "original_name": original_filename},
            )
            logger.info("Uploaded to S3: s3://%s/%s (%d bytes)", self._bucket, storage_key, size)

        return storage_key, size

    def read(self, storage_key: str) -> bytes:
        """Retrieve file content by its storage key."""
        if self.backend == "local":
            path = self._local_root / storage_key
            if not path.exists():
                raise StorageError(f"File not found: {storage_key}")
            return path.read_bytes()

        elif self.backend == "s3":
            obj = self._s3.get_object(Bucket=self._bucket, Key=storage_key)
            return obj["Body"].read()

    def delete(self, storage_key: str) -> None:
        if self.backend == "local":
            path = self._local_root / storage_key
            path.unlink(missing_ok=True)
        elif self.backend == "s3":
            self._s3.delete_object(Bucket=self._bucket, Key=storage_key)
        logger.info("Deleted file: %s", storage_key)

    def presigned_url(self, storage_key: str, expires_in: int = 3600) -> str:
        """Generate a temporary download URL (S3 only; local returns a relative path)."""
        if self.backend == "s3":
            return self._s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": storage_key},
                ExpiresIn=expires_in,
            )
        # Local dev: just return the path (handled by a static file mount or direct read)
        return f"/dev/files/{storage_key}"


def _content_type(ext: str) -> str:
    return {
        ".pdf": "application/pdf",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".xls": "application/vnd.ms-excel",
        ".csv": "text/csv",
    }.get(ext, "application/octet-stream")


# Module-level singleton
_storage: FileStorage | None = None


def get_storage() -> FileStorage:
    global _storage
    if _storage is None:
        _storage = FileStorage()
    return _storage
