"""Unit tests verifying warning lead time calculation and sign preservation.

Closes Finding F-12 from docs/REMEDIATION_PLAN.md:
- Preserves negative signs for late warnings (e.g. -36.5 h).
- Returns None when no warning was issued or danger level was never crossed.
- Robust to unordered input timestamps.
"""
import pandas as pd
import pytest
from pipeline.metrics import compute_warning_lead_time


def test_positive_lead_time_for_advance_warning():
    """Verify positive lead time when RED flag precedes danger level crossing."""
    flags = pd.DataFrame({
        "timestamp": pd.to_datetime(["2026-04-15 00:00:00Z", "2026-04-15 06:00:00Z"]),
        "harvest_flag": ["GREEN", "RED"],
    })
    obs = pd.DataFrame({
        "timestamp": pd.to_datetime(["2026-04-15 00:00:00Z", "2026-04-15 18:00:00Z"]),
        "water_level_m": [10.0, 13.5],  # Crosses 13.20m at 18:00
    })

    # Warning at 06:00, danger crossed at 18:00 -> +12.0 hours
    lead = compute_warning_lead_time(flags, obs, danger_level_m=13.20)
    assert lead == 12.0


def test_negative_lead_time_for_late_warning():
    """Verify negative lead time when RED flag is issued after danger level crossing."""
    flags = pd.DataFrame({
        "timestamp": pd.to_datetime(["2026-04-15 00:00:00Z", "2026-04-16 00:00:00Z"]),
        "harvest_flag": ["GREEN", "RED"],  # RED issued at 2026-04-16 00:00
    })
    obs = pd.DataFrame({
        "timestamp": pd.to_datetime(["2026-04-15 00:00:00Z", "2026-04-15 12:00:00Z"]),
        "water_level_m": [10.0, 13.5],  # Crosses 13.20m at 2026-04-15 12:00 (12h BEFORE red flag)
    })

    # Warning at Apr 16 00:00, danger crossed Apr 15 12:00 -> -12.0 hours
    lead = compute_warning_lead_time(flags, obs, danger_level_m=13.20)
    assert lead == -12.0


def test_returns_none_when_no_red_flag_or_no_crossing():
    """Verify None returned when conditions for lead time are not met."""
    green_flags = pd.DataFrame({
        "timestamp": pd.to_datetime(["2026-04-15 00:00:00Z"]),
        "harvest_flag": ["GREEN"],
    })
    safe_obs = pd.DataFrame({
        "timestamp": pd.to_datetime(["2026-04-15 00:00:00Z"]),
        "water_level_m": [10.0],
    })

    # No RED flag
    assert compute_warning_lead_time(green_flags, safe_obs) is None

    # RED flag present, but stage never crosses danger level
    red_flags = pd.DataFrame({
        "timestamp": pd.to_datetime(["2026-04-15 00:00:00Z"]),
        "harvest_flag": ["RED"],
    })
    assert compute_warning_lead_time(red_flags, safe_obs) is None

    # Empty inputs
    assert compute_warning_lead_time(pd.DataFrame(), safe_obs) is None
    assert compute_warning_lead_time(red_flags, pd.DataFrame()) is None


def test_lead_time_sorts_unordered_timestamps():
    """Verify compute_warning_lead_time handles unordered timestamps correctly."""
    # Rows deliberately shuffled
    flags = pd.DataFrame({
        "timestamp": pd.to_datetime(["2026-04-15 12:00:00Z", "2026-04-15 04:00:00Z", "2026-04-15 08:00:00Z"]),
        "harvest_flag": ["RED", "GREEN", "RED"],  # Earliest RED is at 08:00
    })
    obs = pd.DataFrame({
        "timestamp": pd.to_datetime(["2026-04-15 20:00:00Z", "2026-04-15 14:00:00Z"]),
        "water_level_m": [14.0, 13.5],  # Earliest danger crossing is at 14:00
    })

    # Earliest RED: 08:00; Earliest danger: 14:00 -> +6.0 hours
    lead = compute_warning_lead_time(flags, obs, danger_level_m=13.20)
    assert lead == 6.0

