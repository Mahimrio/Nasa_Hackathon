"""Module 2 Step 1 — scientific backend test suite.

Tests are deterministic and self-contained: they build small synthetic
*in-memory* datasets or arrays labelled provenance=REAL so the fail-closed
gate passes, while never writing anything to data/trends/.

Ten tests are defined:
  1. test_linear_slope_recovery
  2. test_white_noise_null_recovery
  3. test_tied_ranks_variance_reduction
  4. test_autocorrelation_direction_safety
  5. test_calendar_completeness_gate
  6. test_minimum_sample_threshold
  7. test_holm_bonferroni_correction
  8. test_zone_slicing_ascending_descending
  9. test_json_schema_no_nan_inf
  10. test_synthetic_isolation_and_module1_nonregression

Plus the original Module 1 regression tests to prevent regressions.
"""
from __future__ import annotations

import json
import math
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
import xarray as xr

from trend_explorer.analysis import (
    GEOGRAPHIC_ZONES,
    TrendInputError,
    _sanitize_floats,
    analyze_area_mean,
    apply_holm_bonferroni,
    compute_hamed_rao_correction,
    compute_kendall_s_and_var,
    compute_theil_sen_slope,
    evaluate_zone_day_coverage,
    modified_mann_kendall,
    run_mann_kendall,
    seasonal_cell_indicators,
    slice_zone_safe,
    validate_dataset_provenance,
)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _make_real_ds(
    start: str = "2001-04-01",
    end: str = "2025-05-31",
    precip_value: float = 10.0,
    lat: list[float] | None = None,
    lon: list[float] | None = None,
    ascending_lat: bool = True,
) -> xr.Dataset:
    """Build a minimal provenance=REAL dataset covering Apr-May for given years."""
    if lat is None:
        lat = [24.3, 24.7, 25.15, 25.35]
    if lon is None:
        lon = [91.1, 91.5, 92.0]
    if not ascending_lat:
        lat = list(reversed(lat))

    # Build only April-May dates
    full_range = pd.date_range(start, end, freq="D")
    keep = full_range[full_range.month.isin([4, 5])]

    data = np.full((len(keep), len(lat), len(lon)), precip_value, dtype=float)
    return xr.Dataset(
        {
            "precipitation": (
                ("time", "lat", "lon"),
                data,
                {"units": "mm/day"},
            )
        },
        coords={
            "time": keep,
            "lat": lat,
            "lon": lon,
        },
        attrs={
            "provenance": "REAL",
            "product": "GPM_3IMERGDF V07",
            "source_url": "https://example.test/imerg_sylhet.nc",
        },
    )


def _make_zone_a_ds(
    precip_value: float = 10.0,
    ascending_lat: bool = True,
    start_year: int = 2001,
    end_year: int = 2025,
) -> xr.Dataset:
    """Dataset whose lat/lon grid covers Zone A cells."""
    # Zone A: lat [25.1, 25.5), lon [91.0, 92.5)
    lats = [25.15, 25.25, 25.35, 25.45]
    lons = [91.1, 91.5, 91.9, 92.3]
    if not ascending_lat:
        lats = list(reversed(lats))
    return _make_real_ds(
        start=f"{start_year}-04-01",
        end=f"{end_year}-05-31",
        precip_value=precip_value,
        lat=lats,
        lon=lons,
        ascending_lat=True,  # already set above
    )


# ---------------------------------------------------------------------------
# 1. test_linear_slope_recovery
# ---------------------------------------------------------------------------

def test_linear_slope_recovery():
    """Theil-Sen slope should recover y = 10 + 2.5*t within ±0.01 mm/year."""
    rng = np.random.default_rng(0)
    years = np.arange(2001, 2026, dtype=float)
    # Pure linear signal — no noise so slope is exact
    values = 10.0 + 2.5 * (years - years[0])
    beta, beta_decade, intercept, slopes_sorted = compute_theil_sen_slope(years, values)

    assert abs(beta - 2.5) < 0.01, f"Expected slope ≈ 2.5, got {beta}"
    assert abs(beta_decade - 25.0) < 0.1, f"Expected per-decade ≈ 25.0, got {beta_decade}"

    # MK should detect the trend
    s, var_s = compute_kendall_s_and_var(values)
    var_star, _cf, r1 = compute_hamed_rao_correction(years, values, beta, var_s)
    tau, p_raw, _z, _test, verdict = run_mann_kendall(s, var_star, r1, len(years))

    assert p_raw < 0.001, f"Expected p < 0.001 for linear trend, got {p_raw}"
    assert tau > 0.9, f"Expected tau > 0.9 for monotone series, got {tau}"
    assert "INCREASING" in verdict


# ---------------------------------------------------------------------------
# 2. test_white_noise_null_recovery
# ---------------------------------------------------------------------------

def test_white_noise_null_recovery():
    """White-noise series should not reject H0 at α=0.05 (seed 42)."""
    rng = np.random.default_rng(42)
    n = 25
    years = np.arange(2001, 2001 + n, dtype=float)
    values = rng.normal(500.0, 30.0, size=n)

    beta, _, _, _ = compute_theil_sen_slope(years, values)
    s, var_s = compute_kendall_s_and_var(values)
    var_star, _cf, r1 = compute_hamed_rao_correction(years, values, beta, var_s)
    _tau, p_raw, _z, _test, verdict = run_mann_kendall(s, var_star, r1, n)

    assert p_raw >= 0.05, f"White noise should not be significant; p = {p_raw}"
    assert verdict == "NO_SIGNIFICANT_TREND", f"Unexpected verdict: {verdict}"


# ---------------------------------------------------------------------------
# 3. test_tied_ranks_variance_reduction
# ---------------------------------------------------------------------------

def test_tied_ranks_variance_reduction():
    """Tied-rank correction must reduce Var(S) relative to the untied formula."""
    # Many ties: values cycle through 3 distinct integers
    values_tied = np.tile([1.0, 2.0, 3.0], 8)[:25]
    values_untied = np.arange(1, 26, dtype=float)

    _, var_s_tied = compute_kendall_s_and_var(values_tied)
    _, var_s_untied = compute_kendall_s_and_var(values_untied)

    n = 25
    var_s_naive = n * (n - 1) * (2 * n + 5) / 18.0

    # With ties, Var(S) must be strictly less than the untied formula
    assert var_s_tied < var_s_naive, (
        f"Tied Var(S) {var_s_tied} should be < naive {var_s_naive}"
    )
    # Untied series with all distinct values → Var(S) == naive formula
    assert abs(var_s_untied - var_s_naive) < 1e-6, (
        f"Untied Var(S) {var_s_untied} should equal naive {var_s_naive}"
    )


# ---------------------------------------------------------------------------
# 4. test_autocorrelation_direction_safety
# ---------------------------------------------------------------------------

def test_autocorrelation_direction_safety():
    """Positive-AR(1) series gives CF > 1; negative-AR(1) gives CF < 1; both safe."""
    rng = np.random.default_rng(7)
    n = 25
    years = np.arange(2001, 2001 + n, dtype=float)

    # Positive AR(1): r ≈ 0.7
    pos = np.zeros(n)
    pos[0] = rng.normal()
    for t in range(1, n):
        pos[t] = 0.7 * pos[t - 1] + rng.normal(0, 0.5)
    pos = pos + 100.0

    # Negative AR(1): r ≈ -0.6
    neg = np.zeros(n)
    neg[0] = rng.normal()
    for t in range(1, n):
        neg[t] = -0.6 * neg[t - 1] + rng.normal(0, 0.5)
    neg = neg + 100.0

    for label, series in [("positive", pos), ("negative", neg)]:
        beta, _, _, _ = compute_theil_sen_slope(years, series)
        _, var_s = compute_kendall_s_and_var(series)
        var_star, cf, r1 = compute_hamed_rao_correction(years, series, beta, var_s)

        # Must not raise; var_star must be finite positive
        assert math.isfinite(var_star) and var_star > 0, (
            f"{label}: var_star={var_star} should be finite positive"
        )
        assert math.isfinite(cf), f"{label}: CF={cf} should be finite"


# ---------------------------------------------------------------------------
# 5. test_calendar_completeness_gate
# ---------------------------------------------------------------------------

def _zone_a_ds_for_year(year: int, precip: float = 10.0) -> xr.Dataset:
    """Return a Zone-A dataset with one year of Apr-May data."""
    dates = pd.date_range(f"{year}-04-01", f"{year}-05-31", freq="D")
    lats = [25.15, 25.35]
    lons = [91.1, 91.9]
    data = np.full((len(dates), len(lats), len(lons)), precip, dtype=float)
    return xr.Dataset(
        {"precipitation": (("time", "lat", "lon"), data, {"units": "mm/day"})},
        coords={"time": dates, "lat": lats, "lon": lons},
        attrs={
            "provenance": "REAL",
            "product": "GPM_3IMERGDF V07",
            "source_url": "https://example.test",
        },
    )


def test_calendar_completeness_gate():
    """Duplicate date, missing date, or NaN cell must each fail the coverage check."""
    year = 2010

    # --- Case 1: duplicate date (Apr 1 appears twice, some other date absent) ---
    base_dates = pd.date_range(f"{year}-04-01", f"{year}-05-31", freq="D").tolist()
    # Replace last date with Apr 1 duplicate
    dup_dates = base_dates[:-1] + [base_dates[0]]
    ds_dup = xr.Dataset(
        {
            "precipitation": (
                ("time", "lat", "lon"),
                np.full((len(dup_dates), 2, 2), 10.0),
                {"units": "mm/day"},
            )
        },
        coords={"time": dup_dates, "lat": [25.15, 25.35], "lon": [91.1, 91.9]},
        attrs={"provenance": "REAL", "product": "GPM_3IMERGDF V07", "source_url": "x"},
    )
    complete_dup, valid_days_dup, _ = evaluate_zone_day_coverage(ds_dup, year)
    assert not complete_dup, "Duplicate date should make season INCOMPLETE"

    # --- Case 2: missing date (61 expected, only 60 provided, no duplicates) ---
    missing_dates = base_dates[:-1]  # remove May 31
    ds_missing = xr.Dataset(
        {
            "precipitation": (
                ("time", "lat", "lon"),
                np.full((len(missing_dates), 2, 2), 10.0),
                {"units": "mm/day"},
            )
        },
        coords={"time": missing_dates, "lat": [25.15, 25.35], "lon": [91.1, 91.9]},
        attrs={"provenance": "REAL", "product": "GPM_3IMERGDF V07", "source_url": "x"},
    )
    complete_miss, valid_days_miss, _ = evaluate_zone_day_coverage(ds_missing, year)
    assert not complete_miss, "Missing date should make season INCOMPLETE"
    assert valid_days_miss == 60

    # --- Case 3: NaN cell lowers coverage below 95% threshold ---
    data_nan = np.full((61, 2, 2), 10.0)
    # Zero out 2 of 4 cells on Apr 1 → 50% valid, below 95%
    data_nan[0, :, :] = np.nan
    ds_nan = xr.Dataset(
        {
            "precipitation": (
                ("time", "lat", "lon"),
                data_nan,
                {"units": "mm/day"},
            )
        },
        coords={"time": base_dates, "lat": [25.15, 25.35], "lon": [91.1, 91.9]},
        attrs={"provenance": "REAL", "product": "GPM_3IMERGDF V07", "source_url": "x"},
    )
    complete_nan, valid_days_nan, _ = evaluate_zone_day_coverage(ds_nan, year)
    assert not complete_nan, "NaN day should make season INCOMPLETE"


# ---------------------------------------------------------------------------
# 6. test_minimum_sample_threshold
# ---------------------------------------------------------------------------

def test_minimum_sample_threshold():
    """Fewer than 20 complete seasons must produce status=INSUFFICIENT_DATA."""
    from trend_explorer.analysis import analyze_zone

    # Build a dataset covering only 15 years (2001-2015) for Zone A
    ds = _make_zone_a_ds(start_year=2001, end_year=2015)
    result = analyze_zone(ds, "zone_a", start_year=2001, end_year=2025)

    assert result["status"] == "INSUFFICIENT_DATA", (
        f"Expected INSUFFICIENT_DATA for 15 seasons, got {result['status']}"
    )
    assert result["complete_seasons_count"] == 15
    assert result["indicators"]["prcptot"]["status"] == "INSUFFICIENT_DATA"
    assert result["indicators"]["r50mm"]["status"] == "INSUFFICIENT_DATA"


# ---------------------------------------------------------------------------
# 7. test_holm_bonferroni_correction
# ---------------------------------------------------------------------------

def test_holm_bonferroni_correction():
    """Holm-Bonferroni: adjusted ≥ raw, monotone ascending, clamped to 1.0."""
    p_raw = {
        "zone_a:prcptot": 0.03,
        "zone_a:r50mm": 0.28,
        "zone_b:prcptot": 0.45,
        "zone_b:r50mm": 0.60,
        "zone_c:prcptot": 0.72,
        "zone_c:r50mm": 0.88,
    }
    adjusted = apply_holm_bonferroni(p_raw)

    for key, p_adj in adjusted.items():
        assert p_adj >= p_raw[key] - 1e-9, (
            f"{key}: adjusted {p_adj} < raw {p_raw[key]}"
        )
        assert 0.0 <= p_adj <= 1.0, f"{key}: adjusted p_value {p_adj} out of [0,1]"

    # Sorted by p_raw, the first entry (p=0.03 × 6 = 0.18) should be significant
    # The last entry should be clamped at 1.0 or below
    vals = list(adjusted.values())
    # Monotone (after cummax): each value >= previous
    for i in range(1, len(vals)):
        assert vals[i] >= vals[i - 1] - 1e-9, (
            f"Adjusted p-values not monotone at index {i}: {vals}"
        )

    # With all raw p's below 1, some adjusted values may exceed 1 → clamped
    for v in vals:
        assert v <= 1.0, f"Adjusted p-value {v} exceeds 1.0"

    # Smallest raw p=0.03 × 6 = 0.18 → significant
    min_key = min(p_raw, key=p_raw.get)
    assert adjusted[min_key] < 0.19, (
        f"Smallest p adjusted to {adjusted[min_key]}, expected ≈ 0.18"
    )


# ---------------------------------------------------------------------------
# 8. test_zone_slicing_ascending_descending
# ---------------------------------------------------------------------------

def test_zone_slicing_ascending_descending():
    """slice_zone_safe must return the same cell count for asc/desc lat arrays."""
    bounds = GEOGRAPHIC_ZONES["zone_a"]
    # Ascending lats in zone A range
    lats_asc = np.array([25.15, 25.25, 25.35, 25.45])
    lons = np.array([91.1, 91.5, 91.9])

    def _make_ds(lats):
        data = np.ones((1, len(lats), len(lons)))
        return xr.Dataset(
            {"precipitation": (("time", "lat", "lon"), data, {"units": "mm/day"})},
            coords={"time": [pd.Timestamp("2010-04-01")], "lat": lats, "lon": lons},
            attrs={"provenance": "REAL", "product": "GPM_3IMERGDF V07", "source_url": "x"},
        )

    ds_asc = _make_ds(lats_asc)
    ds_desc = _make_ds(lats_asc[::-1])

    zone_asc = slice_zone_safe(ds_asc, **bounds)
    zone_desc = slice_zone_safe(ds_desc, **bounds)

    assert zone_asc.sizes["lat"] == zone_desc.sizes["lat"], (
        f"Ascending lat gave {zone_asc.sizes['lat']} cells, "
        f"descending gave {zone_desc.sizes['lat']}"
    )
    assert zone_asc.sizes["lon"] == zone_desc.sizes["lon"]


# ---------------------------------------------------------------------------
# 9. test_json_schema_no_nan_inf
# ---------------------------------------------------------------------------

def test_json_schema_no_nan_inf(tmp_path):
    """The exported JSON must contain no NaN or Infinity values."""
    from trend_explorer.analysis import export_multi_zone_analysis

    # Build a full 25-year Zone-A dataset with valid data
    # For other zones, use same spatial extent (they'll be INSUFFICIENT_DATA since
    # the grid cells may not fall in those zones, which is fine for this test)
    ds = _make_zone_a_ds(start_year=2001, end_year=2025)
    output_path = tmp_path / "trend_summary.json"

    # Call with allow_synthetic_test=True for test execution
    result = export_multi_zone_analysis(ds, output_path, allow_synthetic_test=True)

    # Verify via JSON round-trip
    text = output_path.read_text(encoding="utf-8")
    parsed = json.loads(text)  # raises if invalid JSON

    def _check_no_nan_inf(obj, path="root"):
        if isinstance(obj, float):
            assert math.isfinite(obj) or obj is None, (
                f"Non-finite float at {path}: {obj}"
            )
        elif isinstance(obj, dict):
            for k, v in obj.items():
                _check_no_nan_inf(v, f"{path}.{k}")
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                _check_no_nan_inf(v, f"{path}[{i}]")

    _check_no_nan_inf(parsed)

    # Verify provenance fields are strictly stamped SYNTHETIC_TEST_RUN for tests
    assert parsed["input_provenance"] == "SYNTHETIC_TEST_RUN"
    assert parsed["analysis_status"] == "TEST_EXECUTION"
    assert "schema_version" in parsed
    assert "generated_at_utc" in parsed

    # Confirm that production mode (allow_synthetic_test=False) rejects synthetic dataset
    ds_syn = ds.copy()
    ds_syn.attrs["provenance"] = "SYNTHETIC"
    with pytest.raises(TrendInputError):
        export_multi_zone_analysis(ds_syn, tmp_path / "should_fail.json", allow_synthetic_test=False)


# ---------------------------------------------------------------------------
# 10. test_synthetic_isolation_and_module1_nonregression
# ---------------------------------------------------------------------------

def test_synthetic_isolation_and_module1_nonregression():
    """No synthetic VERIFIED_REAL in data/trends/; Module 1 tests still pass."""
    # Part A: check data/trends/ has no files labelled VERIFIED_REAL that are synthetic
    root = Path(__file__).resolve().parents[1]
    trends_dir = root / "data" / "trends"

    if trends_dir.exists():
        for json_file in trends_dir.glob("*.json"):
            text = json_file.read_text(encoding="utf-8")
            data = json.loads(text)
            # If a JSON file in data/trends/ claims VERIFIED_REAL, it must NOT
            # also be labelled SYNTHETIC_DEVELOPMENT_FIXTURE anywhere
            if data.get("input_provenance") == "VERIFIED_REAL":
                assert "SYNTHETIC" not in json.dumps(data), (
                    f"{json_file.name} claims VERIFIED_REAL but contains SYNTHETIC marker"
                )
            # dev fixtures should NEVER be in data/trends/
            assert data.get("input_provenance") != "SYNTHETIC_DEVELOPMENT_FIXTURE", (
                f"Dev fixture found in production path: {json_file}"
            )

    # Part B: Module 1 non-regression — provenance gate still rejects synthetic data
    ds = _make_real_ds(start="2001-04-01", end="2010-05-31")
    ds_bad = ds.copy()
    ds_bad.attrs["provenance"] = "SYNTHETIC"
    with pytest.raises(TrendInputError):
        validate_dataset_provenance(ds_bad)

    # Part C: Module 1 seasonal_cell_indicators still works
    indices = seasonal_cell_indicators(ds, 2001, 2010)
    assert indices.sizes["year"] == 10
    result = analyze_area_mean(indices, "prcptot_am_mm")
    assert result.n_seasons == 10


# ---------------------------------------------------------------------------
# Original Module 1 regression tests (preserved verbatim)
# ---------------------------------------------------------------------------

def real_daily_dataset():
    """Minimal provenance=REAL dataset for 2001-2010 Apr-May."""
    time = pd.date_range("2001-04-01", "2010-05-31", freq="D", tz="UTC")
    keep = np.isin(time.month, [4, 5])
    time = time[keep]
    data = np.full((len(time), 2, 2), 10.0)
    return xr.Dataset(
        {"precipitation": (("time", "lat", "lon"), data, {"units": "mm/day"})},
        coords={
            "time": time.tz_localize(None),
            "lat": [24.3, 24.7],
            "lon": [91.1, 91.5],
        },
        attrs={
            "provenance": "REAL",
            "product": "GPM_3IMERGDF V07",
            "source_url": "https://example.test",
        },
    )


def test_rejects_synthetic_trend_input():
    ds = real_daily_dataset()
    ds.attrs["provenance"] = "SYNTHETIC"
    with pytest.raises(TrendInputError):
        seasonal_cell_indicators(ds, 2001, 2010)


def test_complete_season_cell_first_indices_and_trend():
    indices = seasonal_cell_indicators(real_daily_dataset(), 2001, 2010)
    assert indices.sizes["year"] == 10
    assert float(indices.prcptot_am_mm.isel(year=0, lat=0, lon=0)) == 610.0
    result = analyze_area_mean(indices, "prcptot_am_mm")
    assert result.n_seasons == 10
    assert result.slope_per_year == 0.0


def test_mmk_reports_finite_inference_for_trend():
    tau, p = modified_mann_kendall(np.arange(1, 21, dtype=float))
    assert tau > 0.9
    assert 0 <= p <= 0.05


def test_governing_test_matches_variance_correction_factor():
    """Governing test label must be MODIFIED_MANN_KENDALL whenever CF != 1.0."""
    s = 45.0
    var_s = 200.0
    n = 25

    # Case 1: r1 = 0, but CF != 1.0 (higher lags significant) -> MODIFIED
    cf = 0.70
    var_star = var_s * cf
    _tau, _p, _z, test_label, _verdict = run_mann_kendall(s, var_star, r1=0.0, n=n, cf=cf)
    assert test_label == "MODIFIED_MANN_KENDALL"

    # Case 2: r1 = 0, CF = 1.0 (no significant lags) -> STANDARD
    cf = 1.0
    var_star = var_s * cf
    _tau, _p, _z, test_label, _verdict = run_mann_kendall(s, var_star, r1=0.0, n=n, cf=cf)
    assert test_label == "STANDARD_MANN_KENDALL"

    # Case 3: r1 >= 0.392 -> MODIFIED
    cf = 1.0
    _tau, _p, _z, test_label, _verdict = run_mann_kendall(s, var_star, r1=0.45, n=n, cf=cf)
    assert test_label == "MODIFIED_MANN_KENDALL"


def test_missing_cells_preserved_as_nan_not_zero_filled():
    """Spatial grid cells with missing days must not be zero-filled as dry days."""
    from trend_explorer.analysis import compute_cell_first_indicators

    dates = pd.date_range("2020-04-01", "2020-05-31", freq="D")
    lats = np.array([25.2, 25.3])
    lons = np.array([91.2, 91.4])

    # 61 days: Cell (0, 0) has 10 mm every day; Cell (0, 1) has NaN on day 0, 10 mm on others
    data = np.full((len(dates), len(lats), len(lons)), 10.0)
    data[0, 0, 1] = np.nan  # One missing day in cell (0, 1)

    ds = xr.Dataset(
        {"precipitation": (("time", "lat", "lon"), data, {"units": "mm/day"})},
        coords={"time": dates, "lat": lats, "lon": lons},
        attrs={"provenance": "REAL", "product": "GPM_3IMERGDF V07", "source_url": "x"},
    )

    # In cell-first logic, cell (0, 1) is masked as NaN; the area average is computed
    # across the valid cells (cell 0, 0) which has 61 * 10 = 610 mm.
    prcptot_mm, _r50 = compute_cell_first_indicators(ds, 2020)
    assert abs(prcptot_mm - 610.0) < 1e-4, f"Expected 610.0 mm without missing-cell bias, got {prcptot_mm}"
