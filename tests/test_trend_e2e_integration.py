"""Hermetic End-to-End Integration Test for Module 2 Trend Engine.

Scientific specification:
  - Input: Synthetic test data generated deterministically in memory.
  - Storage: All inputs, intermediate arrays, NetCDF files, and exported JSONs
    live strictly in pytest's isolated tmp_path.
  - Zero disk pollution: Nothing is written to data/trends/ or ui/public/data/.
  - Provenance isolation: Output JSON is strictly stamped 'SYNTHETIC_TEST_RUN'
    and 'TEST_EXECUTION'. It must never be labeled 'VERIFIED_REAL' or 'COMPUTED'.
  - Inference tests:
      * Zone A (Meghalaya Ridge): Injected upward signal produces a detected
        positive Theil-Sen slope and SIGNIFICANT_INCREASING_TREND.
      * Zone B (Eastern Inflow): Flat signal produces a near-zero slope and
        verdict NO_SIGNIFICANT_TREND.
      * Holm-Bonferroni: Active comparison count matches the number of computed
        tests (<= 6) with monotone adjusted p-values clamped to 1.0.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
import xarray as xr

from trend_explorer.analysis import (
    GEOGRAPHIC_ZONES,
    export_multi_zone_analysis,
)


def _generate_synthetic_e2e_dataset(
    start_year: int = 2001,
    end_year: int = 2025,
) -> xr.Dataset:
    """Generate 25 years of deterministic synthetic test data covering all 3 zones.

    Grid covers lat 24.0-26.0, lon 90.5-93.5 at 0.1 deg (~21 lats, ~31 lons).
    Seasons: exactly 61 days (April 1 to May 31) per year.
    """
    rng = np.random.default_rng(12345)
    all_dates: list[pd.Timestamp] = []
    for yr in range(start_year, end_year + 1):
        season = pd.date_range(f"{yr}-04-01", f"{yr}-05-31", freq="D")
        all_dates.extend(season)

    times = pd.DatetimeIndex(all_dates)
    lats = np.arange(24.0, 26.05, 0.1)
    lons = np.arange(90.5, 93.55, 0.1)

    n_time = len(times)
    n_lat = len(lats)
    n_lon = len(lons)

    # Base rainfall: 10 mm/day baseline
    data = rng.uniform(5.0, 15.0, size=(n_time, n_lat, n_lon)).astype(float)

    # Inject strong positive trend into Zone A (lat [25.1, 25.5), lon [91.0, 92.5))
    za = GEOGRAPHIC_ZONES["zone_a"]
    lat_mask_a = (lats >= za["lat_min"]) & (lats < za["lat_max"])
    lon_mask_a = (lons >= za["lon_min"]) & (lons < za["lon_max"])

    for i, t in enumerate(times):
        year_offset = t.year - start_year
        # Add 1.5 mm/day per year of trend in Zone A
        trend_increment = 1.5 * year_offset
        data[i, lat_mask_a[:, None] & lon_mask_a[None, :]] += trend_increment

    return xr.Dataset(
        {"precipitation": (("time", "lat", "lon"), data, {"units": "mm/day"})},
        coords={"time": times, "lat": lats, "lon": lons},
        attrs={
            "provenance": "SYNTHETIC_TEST",
            "product": "GPM_3IMERGDF V07",
            "source_url": "https://example.test/mock_opendap",
        },
    )


def test_e2e_pipeline_hermetic_execution(tmp_path):
    """Run the complete pipeline from synthetic dataset to exported JSON in tmp_path."""
    ds = _generate_synthetic_e2e_dataset(2001, 2025)
    output_json = tmp_path / "e2e_trend_summary.json"

    # Export using test-mode flag
    result = export_multi_zone_analysis(
        ds,
        output_path=output_json,
        allow_synthetic_test=True,
    )

    # 1. Output file exists strictly in tmp_path
    assert output_json.is_file(), "Exported JSON was not written to tmp_path"
    raw_text = output_json.read_text(encoding="utf-8")
    parsed = json.loads(raw_text)

    # 2. Provenance is strictly stamped SYNTHETIC_TEST_RUN (never VERIFIED_REAL)
    assert parsed["input_provenance"] == "SYNTHETIC_TEST_RUN"
    assert parsed["analysis_status"] == "TEST_EXECUTION"
    assert "VERIFIED_REAL" not in raw_text
    assert parsed["schema_version"] == "2.2.0"

    # 3. Check for absence of NaN or Infinity throughout the JSON
    def _assert_finite(obj, path="root"):
        if isinstance(obj, float):
            assert math.isfinite(obj), f"Non-finite float at {path}: {obj}"
        elif isinstance(obj, dict):
            for k, v in obj.items():
                _assert_finite(v, f"{path}.{k}")
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                _assert_finite(v, f"{path}[{i}]")

    _assert_finite(parsed)

    # 4. All 3 zones present
    zones = {z["zone_id"]: z for z in parsed["zones"]}
    assert set(zones.keys()) == {"zone_a", "zone_b", "zone_c"}

    # 5. Zone A has detected positive trend in PRCPTOT
    za_prcp = zones["zone_a"]["indicators"]["prcptot"]
    assert za_prcp["status"] == "COMPUTED"
    assert za_prcp["slope_per_year"] > 5.0, (
        f"Zone A expected strong positive slope, got {za_prcp['slope_per_year']}"
    )
    assert za_prcp["p_value_raw"] < 0.05
    assert "INCREASING" in za_prcp["verdict"]

    # 6. Zone B (un-trended) has near-zero slope and NO_SIGNIFICANT_TREND verdict
    zb_prcp = zones["zone_b"]["indicators"]["prcptot"]
    assert zb_prcp["status"] == "COMPUTED"
    assert abs(zb_prcp["slope_per_year"]) < 10.0, (
        f"Zone B expected near-zero slope, got {zb_prcp['slope_per_year']}"
    )
    assert zb_prcp["verdict"] == "NO_SIGNIFICANT_TREND"

    # 7. Multiple-testing correction assertion conditional on computed tests count
    computed_tests = sum(
        1
        for z in parsed["zones"]
        for ind in z["indicators"].values()
        if ind.get("status") == "COMPUTED"
    )
    assert computed_tests == 6, f"Expected 6 active tests, got {computed_tests}"

    for z in parsed["zones"]:
        for ind_name, ind in z["indicators"].items():
            if ind.get("status") == "COMPUTED":
                assert ind["multiple_testing_family_size"] == computed_tests
                assert ind["p_value_adjusted"] >= ind["p_value_raw"] - 1e-9
                assert ind["p_value_adjusted"] <= 1.0

    # 8. Time-series data points are properly formed
    for z in parsed["zones"]:
        series = z["annual_series"]
        assert len(series) == 25
        assert all(s["season_complete"] for s in series)
        for pt in series:
            assert isinstance(pt["year"], int)
            assert isinstance(pt["prcptot_observed"], float)
            assert isinstance(pt["prcptot_fitted"], float)

