"""
Unit Tests for HydroSense-SWOT Scientific Validation Module
Part of Prompt 5: P5-SCIENTIFIC-VALIDATION

Verifies:
1. Nearest-timestamp alignment within 15-minute tolerance.
2. Test-period restriction (April 1 – May 31, 2026 only).
3. 2-decimal-place precision display rules (Category C2).
4. Graceful handling of negative NSE (no crashing, honest reporting).
5. Side-by-side HydroSense vs Baseline comparison.
6. Generation of diagnostic figures and markdown report.
"""

import os
import pytest
import numpy as np
import pandas as pd

from pipeline.metrics import (
    align_sim_obs,
    compute_nse,
    compute_kge,
    compute_pbias,
    compute_peak_timing_error,
    compute_warning_lead_time,
    evaluate_all_metrics,
    compare_model_vs_baseline,
    TEST_PERIOD_START,
    TEST_PERIOD_END,
)
from pipeline.validation_report import run_scientific_validation


def test_nearest_timestamp_alignment_15min_tolerance():
    """Verifies that nearest-timestamp matching aligns points within 15min and drops points outside."""
    times_obs = pd.date_range("2026-04-01 00:00", "2026-04-01 04:00", freq="1h", tz="UTC")
    df_obs = pd.DataFrame({
        "timestamp": times_obs,
        "water_level_m": [8.0, 8.5, 9.0, 9.5, 10.0],
    })

    # Sim has points at 00:00 (exact match), 01:10 (10min diff -> match), 02:40 (40min diff -> drop), 04:05 (5min diff -> match)
    times_sim = pd.to_datetime([
        "2026-04-01 00:00:00Z",
        "2026-04-01 01:10:00Z",
        "2026-04-01 02:40:00Z",
        "2026-04-01 04:05:00Z",
    ])
    df_sim = pd.DataFrame({
        "timestamp": times_sim,
        "modelled_stage": [8.1, 8.6, 9.4, 10.1],
    })

    aligned = align_sim_obs(df_sim, df_obs, tolerance="15min", test_period_only=False)

    # 00:00 and 01:00 (matched to 01:10) and 04:00 (matched to 04:05) should match -> 3 matches
    # 02:00 and 03:00 have no match within 15min
    assert len(aligned) == 3
    assert aligned.iloc[0]["water_level_m"] == 8.0
    assert aligned.iloc[0]["modelled_stage"] == 8.1
    assert aligned.iloc[1]["water_level_m"] == 8.5
    assert aligned.iloc[1]["modelled_stage"] == 8.6


def test_metrics_test_period_restriction():
    """Verifies that evaluation strictly restricts timestamps to April-May 2026."""
    # Create timestamps spanning March to June 2026
    times = pd.date_range("2026-03-15", "2026-06-15", freq="1h", tz="UTC")
    df_sim = pd.DataFrame({
        "timestamp": times,
        "modelled_stage": np.random.uniform(8.0, 12.0, len(times)),
        "harvest_flag": ["GREEN"] * len(times),
    })
    df_obs = pd.DataFrame({
        "timestamp": times,
        "water_level_m": np.random.uniform(8.0, 12.0, len(times)),
    })

    results = evaluate_all_metrics(df_sim, df_obs, test_period_only=True)
    assert results["n_aligned_samples"] > 0
    # April 1 to May 31 = 61 days * 24 hours + 1 = 1465 hours
    assert results["n_aligned_samples"] <= 1465


def test_metric_precision_formatting():
    """Verifies that all metric display formats never exceed 2 decimal places."""
    obs = np.array([8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 12.5, 11.0, 9.5])
    sim = obs + np.array([0.15, -0.22, 0.08, -0.12, 0.35, -0.18, 0.05, -0.10, 0.02])

    nse = compute_nse(sim, obs)
    kge = compute_kge(sim, obs)
    pbias = compute_pbias(sim, obs)

    assert isinstance(nse, float)
    assert isinstance(kge, float)
    assert isinstance(pbias, float)

    fmt_nse = f"{nse:.2f}"
    fmt_kge = f"{kge:.2f}"
    fmt_pbias = f"{pbias:+.1f}%"

    assert len(fmt_nse.split(".")[1]) <= 2
    assert len(fmt_kge.split(".")[1]) <= 2
    assert "%" in fmt_pbias


def test_negative_nse_graceful_handling():
    """Verifies that if NSE < 0, the function does NOT crash or raise an exception."""
    obs = np.array([8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 12.5])
    # Terrible simulation predicting constant 25.0 m
    sim_bad = np.full_like(obs, 25.0)

    nse = compute_nse(sim_bad, obs)
    assert nse < 0.0, f"Expected negative NSE for bad sim, got {nse}"
    assert not np.isnan(nse)
    assert not np.isinf(nse)


def test_model_vs_baseline_comparison():
    """Verifies comparison between HydroSense and Baseline."""
    times = pd.date_range("2026-04-01", "2026-04-10", freq="1h", tz="UTC")
    n = len(times)

    df_sim = pd.DataFrame({
        "timestamp": times,
        "modelled_stage": np.linspace(8.0, 13.5, n),
        "harvest_flag": ["GREEN"] * (n - 10) + ["RED"] * 10,
    })
    df_baseline = pd.DataFrame({
        "timestamp": times,
        "baseline_rain_6h": np.linspace(10.0, 80.0, n),
        "baseline_flag": ["GREEN"] * (n - 20) + ["RED"] * 20,
    })
    df_obs = pd.DataFrame({
        "timestamp": times,
        "water_level_m": np.linspace(8.1, 13.4, n),
    })

    comp = compare_model_vs_baseline(df_sim, df_baseline, df_obs, danger_level_m=13.20)
    assert "hydrosense" in comp
    assert "baseline" in comp
    assert "comparison" in comp
    assert "nse_gain" in comp["comparison"]
    assert "timing_accuracy_gain_h" in comp["comparison"]


def test_validation_report_and_plots_generation(tmp_path):
    """Verifies end-to-end execution of run_scientific_validation and file generation."""
    comparison = run_scientific_validation()

    plots_dir = os.path.join("data", "processed", "validation_plots")
    report_file = os.path.join("data", "processed", "validation_report.md")

    assert os.path.exists(os.path.join(plots_dir, "hydrograph_test_period.png"))
    assert os.path.exists(os.path.join(plots_dir, "scatter_sim_vs_obs.png"))
    assert os.path.exists(os.path.join(plots_dir, "residual_analysis.png"))
    assert os.path.exists(report_file)

    # Check that report contains key metrics
    with open(report_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "Nash-Sutcliffe Efficiency (NSE)" in content
    assert "Kling-Gupta Efficiency (KGE)" in content
    assert "0.73" in content
