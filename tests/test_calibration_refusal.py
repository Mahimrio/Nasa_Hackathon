"""Unit tests verifying fail-closed Manning calibration refusal when no observed target exists.

Closes Findings F-1 and F-2 from docs/REMEDIATION_PLAN.md:
- Refuses to calibrate without observed discharge target (returns NOT_CALIBRATED).
- Resolves effective roughness safely without leaking None to downstream calculations.
"""
import numpy as np
import pytest
from pipeline.manning_calibration import (
    calibrate_reach_manning,
    resolve_n,
    LITERATURE_N,
)


def test_calibration_refuses_without_target_discharge():
    """Verify calibrate_reach_manning refuses to calibrate when target_q is None."""
    n_pts = 20
    wse = np.linspace(8.0, 12.0, n_pts)
    width = np.full(n_pts, 160.0)
    slope2 = np.full(n_pts, 5.0e-5)
    slope_u = np.full(n_pts, 1.0e-5)
    wse_u = np.full(n_pts, 0.12)

    res = calibrate_reach_manning(
        wse_series=wse,
        width_series=width,
        slope2_series=slope2,
        slope_u_series=slope_u,
        wse_u_series=wse_u,
        gauge_q_target=None,  # No observation target supplied
        reach_id="22211000011",
    )

    assert res["calibration_status"] == "NOT_CALIBRATED"
    assert res["n_calibrated"] is None
    assert res["n_effective"] == LITERATURE_N
    assert res["rmse_m3s"] is None
    assert res["is_observationally_calibrated"] is False
    assert res["provenance"] == "NO_OBSERVED_DISCHARGE"
    assert res["z_bed_source"] == "min_wse_lower_bound"
    assert res["z_bed_bias_direction"] == "stage_overestimated"


def test_resolve_n_authoritative_resolution():
    """Verify resolve_n handles calibrated, literature, and fallback schemas safely."""
    # Case 1: Real calibrated result
    assert resolve_n({"n_calibrated": 0.0315, "n_effective": 0.0315}) == 0.0315

    # Case 2: Refused calibration with n_calibrated=None
    assert resolve_n({"n_calibrated": None, "n_effective": 0.033}) == 0.033

    # Case 3: Legacy dictionary with 'n'
    assert resolve_n({"n": 0.035}) == 0.035

    # Case 4: Empty dictionary or non-dict
    assert resolve_n({}) == LITERATURE_N
    assert resolve_n(None) == LITERATURE_N

