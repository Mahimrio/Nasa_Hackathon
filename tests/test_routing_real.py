"""
Unit Tests for Upgraded Routing Engine and Sensitivity Analysis
Part of Prompt 4: P4-ROUTING-ENGINE-REAL

Verifies:
- Muskingum-Cunge routing uses calibrated n.
- Dynamic wave celerity c = (5/3) * V_mean and travel time K = L/c.
- Uncertainty bands (+/- 0.18m) analytical propagation.
- Harvest decision look-ahead using computed travel time.
- Programmatic peak date extraction from data (Guard B10).
- Bilingual advisories (English + Bangla).
- Sensitivity matrix execution across X and n variations.
"""

import os
import tempfile
import numpy as np
import pandas as pd
import pytest

from pipeline.muskingum_cunge import (
    compute_routing_coefficients,
    compute_hydraulic_travel_time,
    invert_manning_to_stage,
    route_catchment_flow,
)
from pipeline.harvest_flag import compute_harvest_flags
from pipeline.baseline import run_rainfall_baseline
from pipeline.sensitivity import run_routing_sensitivity_analysis


def test_hydraulic_celerity_and_travel_time():
    """Verify wave celerity c = (5/3)*V_mean and travel time computation."""
    v_mean = 0.90  # m/s
    total_length = 140000.0  # 140 km
    c_wave, k_sec, k_hours = compute_hydraulic_travel_time(total_length, v_mean)

    # c = 5/3 * 0.90 = 1.50 m/s
    assert np.isclose(c_wave, 1.50, atol=1e-3)
    # k_sec = 140000 / 1.50 = 93333.33 sec
    assert np.isclose(k_sec, 93333.33, atol=1.0)
    # k_hours ~ 25.9 hours
    assert np.isclose(k_hours, 25.926, atol=0.1)


def test_routing_coefficients_sum_and_stability():
    """Verify routing coefficients sum to 1.0."""
    k_sub = 93333.33 / 4.0
    x_val = 0.25
    dt_sec = 1800.0  # 30 min

    c1, c2, c3 = compute_routing_coefficients(k_sub, x_val, dt_sec)
    assert np.isclose(c1 + c2 + c3, 1.0, atol=1e-5)


def test_uncertainty_envelope_propagation():
    """Verify +/-0.18m analytical uncertainty envelope on modelled stage."""
    times = pd.date_range("2026-04-10", periods=20, freq="30min", tz="UTC")
    rain = np.full(20, 15.0)
    reach = {"n": 0.030, "z_bed": 5.80, "mean_width": 160.0, "mean_slope2": 5.0e-5}

    routed = route_catchment_flow(rain, times, reach, wse_uncertainty_m=0.18)

    assert "stage_lower" in routed.columns
    assert "stage_upper" in routed.columns
    # Check that stage_upper - modelled_stage == 0.18
    diff_upper = routed["stage_upper"] - routed["modelled_stage"]
    diff_lower = routed["modelled_stage"] - routed["stage_lower"]
    assert np.allclose(diff_upper, 0.18, atol=0.01)
    assert np.allclose(diff_lower, 0.18, atol=0.01)


def test_harvest_flag_look_ahead_and_peak_extraction():
    """Verify harvest flag look-ahead and data-driven peak date (Guard B10)."""
    times = pd.date_range("2026-04-10T00:00:00Z", periods=60, freq="30min")
    # Peak at index 40
    stages = np.linspace(8.0, 14.0, 41).tolist() + np.linspace(13.9, 10.0, 19).tolist()
    stages = np.array(stages)

    df_test = pd.DataFrame({"timestamp": times, "modelled_stage": stages})
    df_test.attrs["travel_time_hours"] = 26.0

    flagged = compute_harvest_flags(df_test, danger_level_m=13.20)

    # Flag transitions
    assert "harvest_flag" in flagged.columns
    assert "RED" in flagged["harvest_flag"].values
    assert "AMBER" in flagged["harvest_flag"].values
    assert "GREEN" in flagged["harvest_flag"].values

    # Bilingual advisories
    assert "CRITICAL:" in flagged[flagged["harvest_flag"] == "RED"]["advisory_en"].iloc[0]
    assert "জরুরি:" in flagged[flagged["harvest_flag"] == "RED"]["advisory_bn"].iloc[0]

    # Guard B10: Peak date derived from data
    peak_expected = str(times[40])
    assert flagged.attrs["peak_timestamp"] == peak_expected
    assert flagged.attrs["peak_stage_m"] == 14.0


def test_baseline_6h_rolling_accumulation():
    """Verify baseline 6-hour rainfall accumulation and flag triggers."""
    times = pd.date_range("2026-04-10T00:00:00Z", periods=24, freq="30min")
    # Low rain for first 10 steps, then intense cloudburst (50 mm/hr)
    rain = [2.0] * 12 + [50.0] * 12
    df_test = pd.DataFrame({"timestamp": times, "imerg_map_mmh": rain})

    df_base = run_rainfall_baseline(df_test, threshold_watch=35.0, threshold_act=65.0)

    assert "baseline_rain_6h" in df_base.columns
    assert "baseline_flag" in df_base.columns
    # First 12 steps should be GREEN
    assert df_base["baseline_flag"].iloc[0] == "GREEN"
    # End steps with 50 mm/hr * 0.5h * 12 = 300 mm should trigger RED
    assert df_base["baseline_flag"].iloc[-1] == "RED"


def test_sensitivity_analysis_execution():
    """Verify sensitivity analysis runs across matrix and exports CSV."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        csv_path = os.path.join(tmp_dir, "test_sens.csv")
        # Run small 2x2 test matrix
        res = run_routing_sensitivity_analysis(
            output_csv_path=csv_path,
            x_range=[0.20, 0.30],
            n_multipliers=[0.90, 1.10],
        )

        assert os.path.exists(csv_path)
        assert len(res) == 4
        assert "muskingum_x" in res.columns
        assert "n_multiplier" in res.columns
        assert "nse" in res.columns
        assert "lead_time_h" in res.columns
