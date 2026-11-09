"""Run fail-closed multi-zone Trend Explorer analysis on a verified IMERG Final file.

Usage
-----
    python scripts/run_trend_analysis.py \
        --input  data/trends/imerg_sylhet_2001_2025.nc \
        [--manifest data/trends/PROVENANCE.json] \
        [--output  ui/public/data/trend_summary.json]

The script exits with code 1 if:
  * The input file is missing.
  * Provenance validation fails (provenance != REAL, wrong product, bad checksum).
  * No complete seasons are found.

It never falls back to synthetic data.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from trend_explorer.analysis import (
    TrendInputError,
    export_multi_zone_analysis,
    open_verified_imerg_daily,
)

_DEFAULT_OUTPUT = ROOT / "ui" / "public" / "data" / "trend_summary.json"
_DEFAULT_MANIFEST = ROOT / "data" / "trends" / "PROVENANCE.json"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Analyse verified GPM IMERG Final daily rainfall trends across 3 zones"
    )
    parser.add_argument(
        "--input",
        required=True,
        type=Path,
        help="Local provenance=REAL IMERG Final daily NetCDF file",
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=None,
        help=(
            "Path to PROVENANCE.json manifest for checksum verification "
            f"(default: {_DEFAULT_MANIFEST} if it exists)"
        ),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=_DEFAULT_OUTPUT,
        help=f"Output JSON path (default: {_DEFAULT_OUTPUT})",
    )
    args = parser.parse_args()

    # Resolve default manifest path only when no --manifest arg given
    manifest_path: Path | None = args.manifest
    if manifest_path is None and _DEFAULT_MANIFEST.is_file():
        manifest_path = _DEFAULT_MANIFEST

    try:
        ds = open_verified_imerg_daily(args.input, manifest_path=manifest_path)
        result = export_multi_zone_analysis(
            ds, args.output, file_path=args.input, manifest_path=manifest_path
        )
    except FileNotFoundError as exc:
        print(f"TREND ANALYSIS FAILED CLOSED (file not found): {exc}", file=sys.stderr)
        return 1
    except TrendInputError as exc:
        print(f"TREND ANALYSIS FAILED CLOSED (provenance/data error): {exc}", file=sys.stderr)
        return 1
    except Exception as exc:  # noqa: BLE001
        print(f"TREND ANALYSIS FAILED CLOSED (unexpected error): {exc}", file=sys.stderr)
        return 1

    n_zones = len(result.get("zones", []))
    computed = sum(
        1 for z in result.get("zones", []) if z.get("status") == "COMPUTED"
    )
    print(f"TREND ANALYSIS COMPLETE: {args.output}")
    print(f"  Zones: {n_zones} total, {computed} computed, {n_zones - computed} insufficient")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
