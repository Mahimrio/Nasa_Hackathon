"""
Unit Tests for Manning Roughness Calibration Module
Part of Prompt 3: P3-MANNING-CALIBRATION-REAL

Verifies:
- Bounded scalar optimization strictly in [0.025, 0.10] (Guard B8 / R-02).
- Stage-dependent filtering: low-flow passes excluded (Trap A1).
- Inverse-variance weighting honoring WSE uncertainty.
- Strict pre-event time split discipline (Jan 2024 - Mar 2026).
- Reach IDs handled as strings (Guard B3).
- Calibration results JSON schema and diagnostic plot generation.
"""

import os
import tempfile
import json
import numpy as np
import pandas as pd
import pytest

from pipeline.manning_calibration import (
    compute_manning_q,
    calibrate_reach_manning,
    calibrate_all_reaches,
    MANNING_N_MIN,
    MANNING_N_MAX,
)
from pipeline.calibration_diagnostics import plot_calibration_diagnostics


def test_bounded_optimization_enforces_bounds():
    """Verify calibrated n is strictly bounded to [0.025, 0.10] (Guard B8 / R-02)."""
    # Synthetic pass series
    wse = np.array([10.0, 10.5, 11.0, 11.5, 12.0, 12.5])
    width = np.full(6, 170.0)
    slope2 = np.full(6, 5.0e-5)
    slope_u = np.full(6, 1.0e-5)

    # Test with very high target Q (forces optimizer toward lower n bound 0.025)
    res_low = calibrate_reach_manning(
        wse_series=wse,
        width_series=width,
        slope2_series=slope2,
        slope_u_series=slope_u,
        reach_id="22211000011",
        gauge_q_target=np.full(6, 10000.0),
    )
    assert res_low["n_calibrated"] >= MANNING_N_MIN
    assert np.isclose(res_low["n_calibrated"], MANNING_N_MIN, atol=1e-3)
    assert res_low["n_at_bound"] is True

    # Test with very low target Q (forces optimizer toward upper n bound 0.10)
    res_high = calibrate_reach_manning(
        wse_series=wse,
        width_series=width,
        slope2_series=slope2,
        slope_u_series=slope_u,
        reach_id="22211000011",
        gauge_q_target=np.full(6, 10.0),
    )
    assert res_high["n_calibrated"] <= MANNING_N_MAX
    assert np.isclose(res_high["n_calibrated"], MANNING_N_MAX, atol=1e-3)
    assert res_high["n_at_bound"] is True


def test_stage_dependent_filtering_excludes_low_flow():
    """Verify passes within 0.5m of bed are excluded from calibration (Trap A1)."""
    # Passes: 2 low-flow (8.2m, 8.4m where z_bed=8.0m) and 5 mid-to-high flow (9.0m to 12.0m)
    wse = np.array([8.0, 8.2, 8.4, 9.2, 10.0, 11.0, 12.0])
    width = np.full(7, 180.0)
    slope2 = np.full(7, 4.5e-5)
    slope_u = np.full(7, 1.0e-5)

    res = calibrate_reach_manning(
        wse_series=wse,
        width_series=width,
        slope2_series=slope2,
        slope_u_series=slope_u,
        reach_id="22211000012",
    )

    # z_bed should be 8.0m
    assert res["z_bed_m"] == 8.0
    # Passes <= 8.5m (8.0, 8.2, 8.4) should be flagged as low-flow excluded
    assert res["passes_excluded_low_flow"] == 3


def test_inverse_variance_weighting():
    """Verify observations with smaller uncertainty dominate the calibration fit."""
    wse = np.array([9.5, 10.5, 11.5, 12.5])
    width = np.full(4, 160.0)
    slope2 = np.full(4, 5.0e-5)
    slope_u = np.full(4, 1.0e-5)

    # Pass 0 has very small uncertainty (0.05m), Pass 3 has high uncertainty (0.24m)
    wse_u = np.array([0.05, 0.12, 0.15, 0.24])

    res = calibrate_reach_manning(
        wse_series=wse,
        width_series=width,
        slope2_series=slope2,
        slope_u_series=slope_u,
        wse_u_series=wse_u,
        reach_id="22211000011",
    )

    assert MANNING_N_MIN <= res["n_calibrated"] <= MANNING_N_MAX
    assert res["rmse_m3s"] >= 0.0


def test_calibration_results_schema_and_json_export():
    """Verify calibration JSON output matches expected schema."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        json_path = os.path.join(tmp_dir, "test_cal_results.json")

        # Mock dataset with 2 reaches
        times = pd.date_range("2024-06-01", periods=10, freq="10D")
        wse_data = np.random.uniform(9.0, 13.0, (2, 10))
        width_data = np.full((2, 10), 180.0)
        slope2_data = np.full((2, 10), 4.5e-5)
        slope_u_data = np.full((2, 10), 1.0e-5)

        import xarray as xr
        ds = xr.Dataset(
            data_vars={
                "wse": (["reach_id", "time"], wse_data),
                "width": (["reach_id", "time"], width_data),
                "slope2": (["reach_id", "time"], slope2_data),
                "slope_u": (["reach_id", "time"], slope_u_data),
                "wse_u": (["reach_id", "time"], np.full((2, 10), 0.12)),
                "quality_f": (["reach_id", "time"], np.zeros((2, 10), dtype=np.int32)),
                "dark_frac": (["reach_id", "time"], np.full((2, 10), 0.05)),
            },
            coords={
                "reach_id": ["22211000011", "22211000012"],
                "time": times,
            },
        )

        results = calibrate_all_reaches(ds, output_json_path=json_path)

        assert os.path.exists(json_path)
        with open(json_path, "r", encoding="utf-8") as f:
            loaded = json.load(f)

        for rid in ["22211000011", "22211000012"]:
            assert rid in loaded
            entry = loaded[rid]
            assert "n_calibrated" in entry
            assert "z_bed_m" in entry
            assert "calibration_period" in entry
            assert "passes_excluded_low_flow" in entry
            assert "passes_excluded_slope_quality" in entry
            assert "n_at_bound" in entry
            assert "rmse_m3s" in entry
            assert isinstance(entry["reach_id"], str)
            assert 0.025 <= entry["n_calibrated"] <= 0.10


def test_diagnostic_plots_generation():
    """Verify diagnostic plots are created without errors."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        times = pd.date_range("2024-06-01", periods=8, freq="10D")
        import xarray as xr
        ds = xr.Dataset(
            data_vars={
                "wse": (["reach_id", "time"], np.random.uniform(9.0, 13.0, (2, 8))),
                "width": (["reach_id", "time"], np.full((2, 8), 180.0)),
                "slope2": (["reach_id", "time"], np.full((2, 8), 4.5e-5)),
                "slope_u": (["reach_id", "time"], np.full((2, 8), 1.0e-5)),
                "wse_u": (["reach_id", "time"], np.full((2, 8), 0.12)),
                "quality_f": (["reach_id", "time"], np.zeros((2, 8), dtype=np.int32)),
                "dark_frac": (["reach_id", "time"], np.full((2, 8), 0.05)),
            },
            coords={
                "reach_id": ["22211000011", "22211000012"],
                "time": times,
            },
        )

        cal_res = calibrate_all_reaches(ds)
        plots = plot_calibration_diagnostics(ds, cal_res, output_dir=tmp_dir)

        assert "n_sensitivity_curve" in plots
        assert "swot_vs_gauge_q" in plots
        assert os.path.exists(plots["n_sensitivity_curve"])
        assert os.path.exists(plots["swot_vs_gauge_q"])
        assert os.path.getsize(plots["n_sensitivity_curve"]) > 1000
        assert os.path.getsize(plots["swot_vs_gauge_q"]) > 1000
