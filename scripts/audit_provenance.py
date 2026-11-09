#!/usr/bin/env python3
"""Fail-closed provenance audit for fixtures and their public dashboard exports.

Validates both Module 1 and Module 2 compliance:
  1. Module 1: data/fixtures/PROVENANCE.json checksums & metrics_summary.json labels.
  2. Module 2: data/trends/ directory isolation and PROVENANCE.json integrity.
  3. UI export: ui/public/data/trend_summary.json read-only provenance check.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from pipeline.provenance import ProvenanceError, validate_manifest


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def audit_module2_trends(root: Path) -> int:
    """Audit data/trends/ isolation and ui/public/data/trend_summary.json labels.

    Returns the count of verified trends files.
    """
    trends_dir = root / "data" / "trends"
    verified_count = 0

    # 1. Audit data/trends/ directory if present
    if trends_dir.is_dir():
        allowed_templates = {"PROVENANCE.json.template", ".gitkeep", "__init__.py"}
        manifest_file = trends_dir / "PROVENANCE.json"

        if manifest_file.is_file():
            try:
                manifest_data = json.loads(manifest_file.read_text(encoding="utf-8"))
            except Exception as exc:
                raise ProvenanceError(f"Corrupt data/trends/PROVENANCE.json: {exc}")

            declared_files = manifest_data.get("files", {})
            if "final_dataset_path" in manifest_data and "final_dataset_sha256" in manifest_data:
                target_name = Path(manifest_data["final_dataset_path"]).name
                declared_files[target_name] = manifest_data["final_dataset_sha256"]

            for p in trends_dir.iterdir():
                if p.name in allowed_templates or p.name == "PROVENANCE.json":
                    continue
                if p.is_dir():
                    continue
                if p.name not in declared_files:
                    raise ProvenanceError(
                        f"Unregistered file found in data/trends/: {p.name}. "
                        "All production data must be declared in PROVENANCE.json."
                    )
                # Verify checksum
                actual_sha = _sha256_file(p)
                expected_sha = declared_files[p.name]
                if actual_sha.lower() != expected_sha.lower():
                    raise ProvenanceError(
                        f"SHA-256 checksum mismatch for data/trends/{p.name}: "
                        f"expected {expected_sha}, got {actual_sha}."
                    )
                verified_count += 1
        else:
            # No PROVENANCE.json yet — confirm only allowed template/scaffolding files exist
            for p in trends_dir.iterdir():
                if p.name not in allowed_templates and not p.is_dir():
                    raise ProvenanceError(
                        f"Unverified data file found in data/trends/ without PROVENANCE.json: {p.name}"
                    )

    # 2. Read-only audit of public trend summary export if present
    trend_summary_path = root / "ui" / "public" / "data" / "trend_summary.json"

    if trend_summary_path.is_file():
        try:
            trend_data = json.loads(trend_summary_path.read_text(encoding="utf-8"))
        except Exception as exc:
            raise ProvenanceError(f"Corrupt ui/public/data/trend_summary.json: {exc}")

        # Support both root-level and metadata-nested provenance/status
        meta = trend_data.get("metadata", {})
        prov_root = trend_data.get("input_provenance")
        prov_meta = meta.get("input_provenance")

        status_root = trend_data.get("analysis_status")
        status_meta = meta.get("analysis_status")

        if prov_root and prov_meta and prov_root != prov_meta:
            raise ProvenanceError(
                f"Conflicting input_provenance in trend_summary: '{prov_root}' vs '{prov_meta}'"
            )
        if status_root and status_meta and status_root != status_meta:
            raise ProvenanceError(
                f"Conflicting analysis_status in trend_summary: '{status_root}' vs '{status_meta}'"
            )

        prov = prov_meta or prov_root
        status = status_meta or status_root

        valid_provenances = {"SYNTHETIC_DEVELOPMENT_FIXTURE", "VERIFIED_REAL"}
        if prov not in valid_provenances:
            raise ProvenanceError(
                f"Invalid trend_summary input_provenance: '{prov}'. "
                f"Must be one of {valid_provenances}."
            )

        if prov == "SYNTHETIC_DEVELOPMENT_FIXTURE":
            if status != "DEVELOPMENT_PREVIEW":
                raise ProvenanceError(
                    "SYNTHETIC_DEVELOPMENT_FIXTURE must have analysis_status='DEVELOPMENT_PREVIEW'. "
                    f"Got '{status}'. Development fixtures must never claim COMPUTED status."
                )
        elif prov == "VERIFIED_REAL":
            if status != "COMPUTED":
                raise ProvenanceError(
                    f"VERIFIED_REAL must have analysis_status='COMPUTED'. Got '{status}'."
                )

        verified_count += 1

    return verified_count


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate HydroSense provenance manifests and public export labels"
    )
    parser.add_argument(
        "--manifest", default=ROOT / "data/fixtures/PROVENANCE.json", type=Path
    )
    parser.add_argument(
        "--root", default=ROOT, type=Path,
        help="Root directory for resolving relative file paths in manifest"
    )
    args = parser.parse_args()
    try:
        # Module 1 Fixtures Audit
        manifest = validate_manifest(args.manifest, args.root)
        public_metrics_path = args.root / "ui/public/data/metrics_summary.json"
        if not public_metrics_path.is_file() and args.root != ROOT:
            public_metrics_path = ROOT / "ui/public/data/metrics_summary.json"
        public_metrics = json.loads(public_metrics_path.read_text(encoding="utf-8"))
        if public_metrics.get("provenance") != "SYNTHETIC":
            raise ProvenanceError("Public metric export is not explicitly SYNTHETIC")
        if public_metrics.get("validation_category") != "synthetic_engineering_test":
            raise ProvenanceError("Public metrics imply unsupported real-world validation")

        # Module 2 Trends Audit
        mod2_count = audit_module2_trends(args.root)

    except (OSError, json.JSONDecodeError, ProvenanceError) as exc:
        print(f"PROVENANCE AUDIT FAILED: {exc}", file=sys.stderr)
        return 1

    total_files = len(manifest["datasets"]) + mod2_count
    print(
        f"PROVENANCE AUDIT PASSED: {total_files} files verified across Modules 1 & 2, "
        "all checksums and labels match"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
