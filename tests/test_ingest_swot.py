"""
Unit Tests for NASA SWOT L2 HR RiverSP 2.0 and SWORD Ingestion Pipeline
Part of Prompt 1: P1-SWOT-DATA-INGESTION

Verifies:
- SWORD pre-screening rejecting reaches < 100m.
- Reach IDs preserved strictly as strings (Guard B3 / R-05).
- Sentinel fill values (-999999.0 / <= -9990.0) replaced with NaN (Guard B6 / R-06).
- UTC timezone awareness and preservation (Guard B1 / R-04).
- Scientific quality gating: quality_f, dark_frac, width, wse_u, slope2 noise filter (Trap A2 / R-01).
- NetCDF4 output dataset dimensions (reach_id, time) and metadata attributes.
"""

import os
import tempfile
import numpy as np
import pandas as pd
import pytest

# Guard B2: NetCDF4 import MUST precede xarray
import netCDF4
import xarray as xr

from pipeline.ingest_sword import ingest_sword_reaches, DEFAULT_SWORD_REACHES, MIN_SWOT_WIDTH_METERS
from pipeline.ingest_swot import (
    sanitize_swot_data,
    apply_swot_quality_gates,
    export_to_netcdf,
    CANONICAL_REACHES,
)


def test_sword_prescreening_width_filter():
    """Verify SWORD reaches narrower than 100m are dropped during pre-screening."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        out_csv = os.path.join(tmp_dir, "sword_test.csv")
        df_screened = ingest_sword_reaches(output_csv_path=out_csv, min_width_m=100.0)

        assert os.path.exists(out_csv)
        assert len(df_screened) > 0

        # All screened reaches must have width >= 100m
        assert (df_screened["width_mean_m"] >= 100.0).all()

        # The tributary with 65m width must be filtered out
        assert "22211000099" not in df_screened["reach_id"].values

        # Ensure reach_id is read as string
        df_read = pd.read_csv(out_csv, dtype={"reach_id": str})
        assert isinstance(df_read["reach_id"].iloc[0], str)
        assert len(df_read["reach_id"].iloc[0]) == 11


def test_sanitize_fill_values_and_reach_id_types():
    """Verify fill values (-999999.0) are replaced by NaN and reach_id is string."""
    raw_data = pd.DataFrame({
        "reach_id": [22211000011, 22211000012],  # Given as integers initially
        "time_str": ["2026-04-10T06:00:00Z", "2026-04-11T06:00:00Z"],
        "wse": [-999999.0, 11.45],  # Fill value on first row
        "width": [180.0, -999999.0],
        "slope2": [0.00005, 0.00004],
        "slope_u": [0.00001, 0.00001],
        "wse_u": [0.10, 0.12],
        "dark_frac": [0.05, 0.08],
        "quality_f": [0, 0],
    })

    cleaned = sanitize_swot_data(raw_data)

    # Guard B3: reach_id must be string
    assert pd.api.types.is_string_dtype(cleaned["reach_id"])
    assert isinstance(cleaned["reach_id"].iloc[0], str)

    # Guard B6: Fill values replaced with NaN
    assert np.isnan(cleaned["wse"].iloc[0])
    assert cleaned["wse"].iloc[1] == 11.45
    assert np.isnan(cleaned["width"].iloc[1])

    # Guard B1: UTC timezone aware
    assert cleaned["time"].dt.tz is not None


def test_scientific_quality_gating():
    """Verify all 6 quality filters per SOLUTION_ARCHITECTURE.md §2.1."""
    test_passes = pd.DataFrame({
        "reach_id": ["22211000011"] * 7,
        "time_str": [
            "2026-04-01T00:00:00Z",
            "2026-04-02T00:00:00Z",
            "2026-04-03T00:00:00Z",
            "2026-04-04T00:00:00Z",
            "2026-04-05T00:00:00Z",
            "2026-04-06T00:00:00Z",
            "2026-04-07T00:00:00Z",
        ],
        "wse": [10.5, 11.0, 10.8, 10.9, 11.2, 11.3, 11.5],
        "width": [160.0, 155.0, 162.0, 85.0, 170.0, 165.0, 160.0],      # Row 3 width < 100m
        "dark_frac": [0.05, 0.08, 0.45, 0.06, 0.05, 0.06, 0.07],        # Row 2 dark_frac > 0.3
        "quality_f": [0, 2, 0, 0, 0, 0, 0],                              # Row 1 quality_f = 2 (bad)
        "wse_u": [0.12, 0.10, 0.11, 0.10, 0.35, 0.12, 0.10],             # Row 4 wse_u > 0.25m
        "slope2": [5.0e-5, 5.0e-5, 5.0e-5, 5.0e-5, 5.0e-5, 8.0e-6, 1.5e-5], # Row 5 slope < 1e-5
        "slope_u": [1.0e-5, 1.0e-5, 1.0e-5, 1.0e-5, 1.0e-5, 1.0e-5, 1.0e-5],# Row 6 slope2 < 2*slope_u
    })

    cleaned = sanitize_swot_data(test_passes)
    gated, stats = apply_swot_quality_gates(cleaned)

    # Only Row 0 passes all filters:
    # Row 1 dropped by quality_f
    # Row 2 dropped by dark_frac
    # Row 3 dropped by width
    # Row 4 dropped by wse_u
    # Row 5 dropped by slope2 < 1e-5
    # Row 6 dropped by slope2 <= 2*slope_u (1.5e-5 <= 2.0e-5)
    assert len(gated) == 1
    assert gated.iloc[0]["time_str"] == "2026-04-01T00:00:00Z"
    assert stats["dropped_quality_f"] == 1
    assert stats["dropped_dark_frac"] == 1
    assert stats["dropped_width"] == 1
    assert stats["dropped_wse_u"] == 1
    assert stats["dropped_slope_noise"] == 2


def test_netcdf_export_schema():
    """Verify NetCDF export matches dimensional schema (reach_id, time)."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        nc_path = os.path.join(tmp_dir, "test_swot.nc")
        data = pd.DataFrame({
            "reach_id": ["22211000011", "22211000012", "22211000011", "22211000012"],
            "time_str": [
                "2026-04-10T00:00:00Z",
                "2026-04-10T00:00:00Z",
                "2026-04-20T00:00:00Z",
                "2026-04-20T00:00:00Z",
            ],
            "wse": [10.5, 9.8, 11.2, 10.4],
            "width": [160.0, 190.0, 168.0, 195.0],
            "slope2": [5.2e-5, 4.6e-5, 5.1e-5, 4.5e-5],
            "slope_u": [1.0e-5, 1.0e-5, 1.0e-5, 1.0e-5],
            "wse_u": [0.12, 0.14, 0.12, 0.13],
            "dark_frac": [0.05, 0.06, 0.05, 0.06],
            "quality_f": [0, 0, 0, 0],
        })

        cleaned = sanitize_swot_data(data)
        export_to_netcdf(cleaned, nc_path)

        assert os.path.exists(nc_path)
        ds = xr.open_dataset(nc_path)

        assert "reach_id" in ds.dims
        assert "time" in ds.dims
        assert ds.sizes["reach_id"] == 2
        assert ds.sizes["time"] == 2

        for var in ["wse", "width", "slope2", "wse_u", "slope_u", "quality_f", "dark_frac"]:
            assert var in ds.data_vars
            assert ds[var].shape == (2, 2)

        ds.close()
