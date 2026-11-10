"""Unit tests for Gilbert (1987) rank-based Sen slope confidence intervals.

Closes Finding F-14 from docs/REMEDIATION_PLAN.md:
Verifies Gilbert (1987) rank indexing convention:
idx_low = min(n_prime - 1, max(0, m1))
idx_high = min(n_prime - 1, max(0, m2 - 1))
"""
import math
import numpy as np
import pytest
from trend_explorer.analysis import compute_sens_kendall_ci as compute_sen_kendall_ci


def test_gilbert_ci_known_series():
    """Verify compute_sen_kendall_ci against hand-computed rank bounds."""
    # Ordered slope differences (10 values)
    slopes = np.array([10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0, 100.0])
    n_prime = len(slopes)
    var_star = 4.0  # std = 2.0
    alpha = 0.05    # z = 1.95996, half_width ≈ 3.9199

    # m1 = floor((10 - 3.9199) / 2) = floor(3.04) = 3
    # m2 = ceil((10 + 3.9199) / 2) + 1 = ceil(6.96) + 1 = 8
    # idx_low = 3 -> slopes[3] = 40.0
    # idx_high = 7 -> slopes[7] = 80.0

    ci_low, ci_high = compute_sen_kendall_ci(slopes, var_star, alpha=alpha)
    assert ci_low == 40.0
    assert ci_high == 80.0


def test_gilbert_ci_edge_cases():
    """Verify Gilbert CI handles small samples and degenerate variance gracefully."""
    empty = np.array([])
    low, high = compute_sen_kendall_ci(empty, 1.0)
    assert math.isnan(low) and math.isnan(high)

    single = np.array([5.0])
    low, high = compute_sen_kendall_ci(single, 0.0)
    assert math.isnan(low) and math.isnan(high)
