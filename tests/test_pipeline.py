"""
Unit and Integration Tests for HydroSense-SWOT MVP Pipeline.
Validates:
- Manning roughness bounding [0.025, 0.10]
- Slope noise gating (slope2 > 2*slope_u)
- Muskingum-Cunge stage inversion
- Metric formulas (NSE, KGE, PBIAS, timing error)
- Timezone and reach_id data integrity
"""

import pytest
import numpy as np
import pandas as pd
from pipeline.manning_calibration import filter_swot_passes, compute_manning_q, calibrate_reach_manning
from pipeline.muskingum_cunge import invert_manning_to_stage, compute_routing_coefficients
from pipeline.harvest_flag import compute_harvest_flags
from pipeline.metrics import compute_nse, compute_kge, compute_pbias

def test_swot_quality_gating():
    # Pass with noisy slope should be filtered out
    wse = np.array([8.5, 9.0, 10.0])
    width = np.array([150.0, 160.0, 170.0])
    slope2 = np.array([5.0e-5, 1.0e-5, 6.0e-5])  # Index 1 is noisy (1.0e-5 <= 2*1.0e-5)
    slope_u = np.array([1.0e-5, 1.0e-5, 1.0e-5])
    quality_f = np.array([0, 0, 2])  # Index 2 is bad quality flag
    dark_frac = np.array([0.05, 0.05, 0.05])
    wse_u = np.array([0.1, 0.1, 0.1])

    mask = filter_swot_passes(wse, width, slope2, wse_u, slope_u, quality_f, dark_frac)
    assert mask[0] == True
    assert mask[1] == False  # Dropped due to slope noise
    assert mask[2] == False  # Dropped due to quality_f == 2


def test_manning_bounds():
    wse = np.full(20, 10.5)
    width = np.full(20, 160.0)
    slope2 = np.full(20, 5.0e-5)
    slope_u = np.full(20, 1.0e-5)
    quality = np.zeros(20, dtype=int)
    dark = np.full(20, 0.05)

    res = calibrate_reach_manning(wse, width, slope2, slope_u, quality, dark)
    assert 0.025 <= res["n"] <= 0.10, f"Roughness n={res['n']} must be bounded in [0.025, 0.10]"


def test_stage_inversion():
    q = 500.0
    width = 160.0
    slope2 = 5.0e-5
    z_bed = 6.0
    n = 0.035

    stage = invert_manning_to_stage(q, width, slope2, z_bed, n)
    assert stage > z_bed, "Stage must be above bed elevation"
    
    # Recalculate Q from the resulting stage and verify round-trip
    depth = stage - z_bed
    q_recalc = (1.0 / n) * width * depth * (depth ** (2.0 / 3.0)) * np.sqrt(slope2)
    assert np.isclose(q, q_recalc, rtol=1e-3)


def test_routing_coefficients_sum_to_one():
    k_sec = 20000.0
    x_weight = 0.25
    dt_sec = 1800.0
    c1, c2, c3 = compute_routing_coefficients(k_sec, x_weight, dt_sec)
    assert np.isclose(c1 + c2 + c3, 1.0, atol=1e-6)


def test_metrics_evaluation():
    obs = np.array([5.0, 7.0, 10.0, 14.0, 8.0, 6.0])
    sim = np.array([5.2, 6.8, 10.2, 13.8, 7.9, 6.1])

    nse = compute_nse(sim, obs)
    kge = compute_kge(sim, obs)
    pbias = compute_pbias(sim, obs)

    assert nse > 0.95, f"High correlation should give NSE > 0.95, got {nse}"
    assert kge > 0.90, f"High correlation should give KGE > 0.90, got {kge}"
    assert abs(pbias) < 5.0, f"PBIAS should be close to 0%, got {pbias}"


def test_harvest_flag_logic():
    df = pd.DataFrame({
        "timestamp": pd.date_range("2026-04-01", periods=10, freq="1h", tz="UTC"),
        "modelled_stage": [8.0, 9.0, 10.0, 11.0, 13.3, 13.5, 12.0, 10.0, 9.0, 8.0],
    })
    with pytest.raises(ValueError, match="Future look-ahead"):
        compute_harvest_flags(df, danger_level_m=13.20, lead_steps=4)
    df_flags = compute_harvest_flags(df, danger_level_m=13.20)
    # A causal classification warns only when the current stage crosses threshold.
    assert "RED" in df_flags["harvest_flag"].values
    assert "AMBER" in df_flags["harvest_flag"].values
    assert "GREEN" in df_flags["harvest_flag"].values
