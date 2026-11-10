"""Unit tests verifying Muskingum-Cunge routing regime validity and physical constraints.

Closes Findings F-4 and F-5 from docs/REMEDIATION_PLAN.md:
- Dynamically derived sub-reach count satisfies the Courant condition (C ~ 1.0).
- Routing coefficients C1, C2, C3 are strictly non-negative (no negative damping).
- Scheme operates within the physical Muskingum validity window 2KX <= dt <= 2K(1-X).
"""
import pytest
import numpy as np
from pipeline.muskingum_cunge import (
    compute_routing_coefficients,
    compute_hydraulic_travel_time,
    compute_subreach_count,
    validate_routing_regime,
)


def test_routing_coefficients_sum_to_one():
    """Verify C1 + C2 + C3 == 1.0 across a range of physical parameters."""
    for k_sec in [1000.0, 1800.0, 3600.0]:
        for x in [0.20, 0.25, 0.30]:
            for dt in [900.0, 1800.0, 3600.0]:
                c1, c2, c3 = compute_routing_coefficients(k_sec, x, dt)
                assert np.isclose(c1 + c2 + c3, 1.0, atol=1e-5)


def test_subreach_count_ensures_non_negative_coefficients():
    """Verify compute_subreach_count prevents negative C1 for default channel."""
    total_length = 140000.0  # 140 km
    v_mean = 0.90
    dt_sec = 1800.0  # 30 min
    x_weight = 0.25

    c_wave, k_total_sec, _ = compute_hydraulic_travel_time(total_length, v_mean)
    n_sub = compute_subreach_count(total_length, c_wave, dt_sec, x_weight)

    # For default geometry, N should be ~52
    assert n_sub >= 50

    k_sub = k_total_sec / float(n_sub)
    dx = total_length / float(n_sub)

    # Validate regime passes without error
    validate_routing_regime(k_sub, x_weight, dt_sec, c_wave, dx)

    c1, c2, c3 = compute_routing_coefficients(k_sub, x_weight, dt_sec)
    assert c1 >= 0.0, f"C1 is negative: {c1}"
    assert c2 >= 0.0, f"C2 is negative: {c2}"
    assert c3 >= 0.0, f"C3 is negative: {c3}"


def test_routing_regime_rejects_non_physical_window():
    """Verify validate_routing_regime raises ValueError when dt < 2KX."""
    k_sec = 23333.33  # Old 4-subreach K
    x_weight = 0.25   # 2KX = 11666s
    dt_sec = 1800.0   # 1800s < 11666s (violates validity window)
    c_wave = 1.50
    dx = 35000.0

    with pytest.raises(ValueError, match="Muskingum invalid"):
        validate_routing_regime(k_sec, x_weight, dt_sec, c_wave, dx)


def test_courant_number_near_unity():
    """Verify that derived subreach count achieves Courant number ~ 1.0."""
    total_length = 140000.0
    v_mean = 0.90
    dt_sec = 1800.0
    x_weight = 0.25

    c_wave, _, _ = compute_hydraulic_travel_time(total_length, v_mean)
    n_sub = compute_subreach_count(total_length, c_wave, dt_sec, x_weight)
    dx = total_length / float(n_sub)
    courant = c_wave * dt_sec / dx

    assert 0.95 <= courant <= 1.05, f"Courant number {courant:.3f} outside [0.95, 1.05]"

