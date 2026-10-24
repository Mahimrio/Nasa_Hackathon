#!/usr/bin/env python3
"""Fail-closed provenance audit for fixtures and their public dashboard exports."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from pipeline.provenance import ProvenanceError, validate_manifest


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate HydroSense provenance manifest and public export labels")
    parser.add_argument("--manifest", default=ROOT / "data/fixtures/PROVENANCE.json", type=Path)
    parser.add_argument("--root", default=ROOT, type=Path, help="Root directory for resolving relative file paths in manifest")
    args = parser.parse_args()
    try:
        manifest = validate_manifest(args.manifest, args.root)
        public_metrics_path = args.root / "ui/public/data/metrics_summary.json"
        if not public_metrics_path.is_file() and args.root != ROOT:
            public_metrics_path = ROOT / "ui/public/data/metrics_summary.json"
        public_metrics = json.loads(public_metrics_path.read_text(encoding="utf-8"))
        if public_metrics.get("provenance") != "SYNTHETIC":
            raise ProvenanceError("Public metric export is not explicitly SYNTHETIC")
        if public_metrics.get("validation_category") != "synthetic_engineering_test":
            raise ProvenanceError("Public metrics imply unsupported real-world validation")
    except (OSError, json.JSONDecodeError, ProvenanceError) as exc:
        print(f"PROVENANCE AUDIT FAILED: {exc}", file=sys.stderr)
        return 1
    print(f"PROVENANCE AUDIT PASSED: {len(manifest['datasets'])} files, all checksums and labels match")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
