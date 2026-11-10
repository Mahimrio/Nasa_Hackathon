"""Unit tests for Gilbert (1987) rank-based Sen slope confidence intervals.

Closes Finding F-14:
Verifies Gilbert (1987) 1-based rank to 0-based Python array index conversion:
Rank M1 corresponds to slopes_sorted[m1 - 1] (the M1-th order statistic D_(M1)).
Rank M2 corresponds to slopes_sorted[m2 - 1] (the M2-th order statistic D_(M2)).
"""
import math
import numpy as np
import pytest
from trend_explorer.analysis import compute_sens_kendall_ci as compute_sen_kendall_ci


def test_gilbert_ci_known_series():
    """Verify compute_sen_kendall_ci against hand-computed rank bounds."""
    # Ordered slope differences (10 values, D_(1) = 10.0 to D_(10) = 100.0)
    slopes = np.array([10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0, 100.0])
    n_prime = len(slopes)
    var_star = 4.0  # std = 2.0
    alpha = 0.05    # z = 1.95996, half_width ≈ 3.9199

    # Gilbert (1987, p. 218):
    # M1 = floor((N' - z*sqrt(Var*)) / 2) = floor((10 - 3.9199) / 2) = floor(3.04) = 3
    # M2 = ceil((N' + z*sqrt(Var*)) / 2) + 1 = ceil((10 + 3.9199) / 2) + 1 = ceil(6.96) + 1 = 8
    #
    # Order statistics:
    # Rank 1: slopes[0] = 10.0
    # Rank 2: slopes[1] = 20.0
    # Rank 3 (M1): slopes[2] = 30.0 -> idx_low = M1 - 1 = 2
    # Rank 8 (M2): slopes[7] = 80.0 -> idx_high = M2 - 1 = 7

    ci_low, ci_high = compute_sen_kendall_ci(slopes, var_star, alpha=alpha)
    assert ci_low == 30.0, f"Expected 30.0 (3rd order statistic), got {ci_low}"
    assert ci_high == 80.0, f"Expected 80.0 (8th order statistic), got {ci_high}"


def test_gilbert_ci_edge_cases():
    """Verify Gilbert CI handles small samples and degenerate variance gracefully."""
    empty = np.array([])
    low, high = compute_sen_kendall_ci(empty, 1.0)
    assert math.isnan(low) and math.isnan(high)

    single = np.array([5.0])
    low, high = compute_sen_kendall_ci(single, 0.0)
    assert math.isnan(low) and math.isnan(high)
