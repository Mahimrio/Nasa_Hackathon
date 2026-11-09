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


def validate_real_pipeline_inputs(
    real_dir: str | Path,
    expected_files: dict[str, str] | None = None,
) -> dict[str, Any]:
    """
    Validates data/real provenance manifest and physical files (Fail-Closed):
    1. PROVENANCE.json must exist in real_dir.
    2. Manifest must parse and have schema_version '1.0' (or '1.0.0').
    3. Every declared dataset must have provenance == 'REAL'.
       (SYNTHETIC, MIXED, UNKNOWN strictly rejected).
    4. Required files (SWOT, Gauge, IMERG) must be present in the manifest.
    5. Each required dataset must have complete source metadata:
       source_organization, product_version, source_url, retrieval_timestamp, source_identifiers, license.
    6. Each file must exist on disk and its cryptographic SHA-256 must match the manifest.
    7. Raises ProvenanceError on any failure.
    """
    real_path = Path(real_dir)
    manifest_file = real_path / "PROVENANCE.json"
    if not manifest_file.is_file():
        raise ProvenanceError(f"Missing real-data provenance manifest: {manifest_file}")

    try:
        payload = json.loads(manifest_file.read_text(encoding="utf-8"))
    except Exception as exc:
        raise ProvenanceError(f"Corrupt real-data manifest {manifest_file}: {exc}")

    if not isinstance(payload, dict):
        raise ProvenanceError("PROVENANCE.json must be a JSON object")

    datasets = payload.get("datasets")
    if not isinstance(datasets, list) or len(datasets) == 0:
        raise ProvenanceError("Real manifest contains no datasets list or is empty")

    declared_by_name: dict[str, dict[str, Any]] = {}
    for record in datasets:
        # Check that provenance is strictly REAL
        if record.get("provenance") != "REAL":
            raise ProvenanceError(
                f"Real mode strictly rejects non-REAL provenance: found '{record.get('provenance')}' in {record.get('file_path')}"
            )
        # Validate path safety: must resolve strictly inside real_path without traversal, absolute paths, or fixture references
        raw_fp = str(record.get("file_path", "")).replace("\\", "/")
        if not raw_fp:
            raise ProvenanceError("Record file_path cannot be empty")
        fp_obj = Path(raw_fp)
        if fp_obj.is_absolute():
            raise ProvenanceError(f"Absolute paths forbidden in real manifest: '{raw_fp}'")
        if ".." in fp_obj.parts:
            raise ProvenanceError(f"Directory traversal forbidden in real manifest: '{raw_fp}'")
        if "fixtures" in fp_obj.parts or "data/fixtures" in raw_fp:
            raise ProvenanceError(f"Real manifest strictly forbidden from referencing fixture paths: '{raw_fp}'")

        target_on_disk = (real_path / fp_obj.name).resolve()
        real_resolved = real_path.resolve()
        try:
            target_on_disk.relative_to(real_resolved)
        except ValueError:
            raise ProvenanceError(f"Real manifest path escapes real directory: '{raw_fp}'")

        if not target_on_disk.is_file():
            raise ProvenanceError(f"Declared real file is missing inside {real_path}: {fp_obj.name}")

        validate_record(record)
        actual_sha = sha256_file(target_on_disk)
        if actual_sha.lower() != str(record.get("sha256", "")).lower():
            raise ProvenanceError(
                f"Checksum mismatch for {target_on_disk.name}: expected {record.get('sha256')}, got {actual_sha}"
            )

        declared_by_name[target_on_disk.name] = {
            "record": record,
            "path": str(target_on_disk),
            "sha256": actual_sha,
        }

    # Ensure required real files are present in the manifest
    required = expected_files or {
        "swot": "swot_reaches.nc",
        "gauge": "gauge_sw266.csv",
        "imerg": "imerg_map.nc",
    }
    missing_required = []
    resolved_paths: dict[str, str] = {}
    for role, fname in required.items():
        if fname not in declared_by_name:
            missing_required.append(f"{role} ({fname})")
        else:
            resolved_paths[role] = declared_by_name[fname]["path"]

    if missing_required:
        raise ProvenanceError(
            f"Real manifest lacks required production datasets: {', '.join(missing_required)}"
        )

    return {
        "manifest": payload,
        "resolved_paths": resolved_paths,
        "declared_files": declared_by_name,
    }

