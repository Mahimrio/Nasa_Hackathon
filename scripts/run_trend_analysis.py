"""Run fail-closed Trend Explorer analysis on a verified local IMERG Final file."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from trend_explorer.analysis import TrendInputError, export_analysis, open_verified_imerg_daily, seasonal_cell_indicators


def main() -> int:
    parser = argparse.ArgumentParser(description="Analyze verified GPM IMERG Final daily rainfall trends")
    parser.add_argument("--input", required=True, type=Path, help="Local provenance=REAL IMERG Final daily NetCDF")
    parser.add_argument("--output", default=ROOT / "ui/public/data/trend_summary.json", type=Path)
    parser.add_argument("--start-year", type=int, default=2001)
    parser.add_argument("--end-year", type=int, default=2025)
    args = parser.parse_args()
    try:
        ds = open_verified_imerg_daily(args.input)
        indices = seasonal_cell_indicators(ds, args.start_year, args.end_year)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        export_analysis(indices, args.output)
    except (OSError, TrendInputError) as exc:
        print(f"TREND ANALYSIS FAILED CLOSED: {exc}", file=sys.stderr)
        return 1
    print(f"TREND ANALYSIS COMPLETE: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
