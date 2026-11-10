r"""Identifiability demonstration test for Manning roughness calibration.

Closes Finding F-2 from docs/REMEDIATION_PLAN.md:
Demonstrates that when calibrating against an assumed constant target, the optimal
roughness n* is purely a scale factor between SWOT geometry and the assumed target:
n* \propto 1 / target_q.

This proves that true roughness identifiability requires real observed discharge data,
justifying the fail-closed refusal when gauge_q_target is None.
"""
import numpy as np
import pytest
from pipeline.manning_calibration import calibrate_reach_manning


def test_identifiability_target_sweep():
    """Verify n* scales monotonically as 1/target_q across reachable discharge targets."""
    n_pts = 30
    wse = np.linspace(8.0, 11.5, n_pts)
    width = np.full(n_pts, 160.0)
    slope2 = np.full(n_pts, 5.0e-5)
    slope_u = np.full(n_pts, 1.0e-5)
    wse_u = np.full(n_pts, 0.12)

    # Targets within reachable conveyance range for this geometry to avoid pinning at 0.025 bound
    targets = [50.0, 80.0, 120.0]
    n_opts = []

    for tq in targets:
        target_series = np.full(n_pts, tq)
        res = calibrate_reach_manning(
            wse_series=wse,
            width_series=width,
            slope2_series=slope2,
            slope_u_series=slope_u,
            wse_u_series=wse_u,
            gauge_q_target=target_series,
            reach_id="22211000011",
        )
        assert res["calibration_status"] == "CALIBRATED_TO_TARGET"
        assert res["n_calibrated"] is not None
        n_opts.append(res["n_calibrated"])

    # Monotonicity: larger discharge requires smaller roughness (n* ∝ 1/target)
    assert n_opts[0] > n_opts[1] > n_opts[2], (
        f"Expected n* to decrease with increasing target Q, got {n_opts} for {targets}"
    )

    # Approximate inverse proportionality: n* * target ≈ constant
    products = [n * t for n, t in zip(n_opts, targets)]
    mean_prod = np.mean(products)
    for p in products:
        assert np.isclose(p, mean_prod, rtol=0.15), (
            f"Expected n* * target to be roughly constant, got products {products}"
        )
