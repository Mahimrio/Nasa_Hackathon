"""Provenance contracts for HydroSense data and derived artifacts.

This module deliberately treats a checksum as an identity check, not proof of
an upstream claim.  Callers must supply source records for ``REAL`` data.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

VALID_PROVENANCE = {"REAL", "SYNTHETIC", "MIXED", "UNKNOWN"}
REQUIRED_FIELDS = {
    "dataset_id", "provenance", "file_path", "sha256", "variables",
    "units", "temporal_coverage", "processing_history", "limitations",
}


class ProvenanceError(ValueError):
    """Raised when data would be presented with incomplete provenance."""


def sha256_file(path: str | Path) -> str:
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_record(record: dict[str, Any], root: str | Path | None = None) -> None:
    missing = REQUIRED_FIELDS - set(record)
    if missing:
        raise ProvenanceError(f"Missing provenance fields: {sorted(missing)}")
    if record["provenance"] not in VALID_PROVENANCE:
        raise ProvenanceError(f"Invalid provenance classification: {record['provenance']!r}")
    if not isinstance(record["sha256"], str) or len(record["sha256"]) != 64:
        raise ProvenanceError("A SHA-256 checksum is required")
    if record["provenance"] == "REAL":
        for key in ("source_organization", "product_version", "source_url", "retrieval_timestamp", "source_identifiers", "license"):
            if not record.get(key):
                raise ProvenanceError(f"REAL record lacks {key}")
    if record["provenance"] == "SYNTHETIC":
        for key in ("generator", "generator_version", "random_seed"):
            if key not in record:
                raise ProvenanceError(f"SYNTHETIC record lacks {key}")
    if root is not None:
        path = Path(root) / record["file_path"]
        if not path.is_file():
            raise ProvenanceError(f"Manifest file is missing: {record['file_path']}")
        if sha256_file(path) != record["sha256"]:
            raise ProvenanceError(f"Checksum mismatch: {record['file_path']}")


def validate_manifest(manifest_path: str | Path, root: str | Path | None = None) -> dict[str, Any]:
    manifest_path = Path(manifest_path)
    payload = json.loads(manifest_path.read_text(encoding="utf-8"))
    if payload.get("schema_version") != "1.0" or not isinstance(payload.get("datasets"), list):
        raise ProvenanceError("Unsupported or malformed provenance manifest")
    resolved_root = Path(root) if root else manifest_path.parents[2]
    seen: set[str] = set()
    for record in payload["datasets"]:
        validate_record(record, resolved_root)
        if record["file_path"] in seen:
            raise ProvenanceError(f"Duplicate manifest path: {record['file_path']}")
        seen.add(record["file_path"])
    return payload


def write_manifest(output: str | Path, datasets: list[dict[str, Any]], root: str | Path, generated_at: str | None = None) -> Path:
    root_path = Path(root)
    prepared = []
    for record in datasets:
        item = dict(record)
        item["sha256"] = sha256_file(root_path / item["file_path"])
        validate_record(item, root_path)
        prepared.append(item)
    payload = {
        "schema_version": "1.0",
        "generated_at": generated_at or datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "datasets": prepared,
    }
    target = Path(output)
    target.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return target
