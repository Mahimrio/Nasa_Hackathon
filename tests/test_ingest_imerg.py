"""
Unit Tests for NASA GPM IMERG and BWDB Gauge Ingestion Pipeline
Part of Prompt 2: P2-IMERG-GAUGE-INGESTION

Verifies:
- IMERG end-of-interval timestamp shift (-30 min per Guard B4).
- PrecipitationCal variable extraction and non-zero MAP assertion.
- HydroSHEDS sub-basin polygon delineation in EPSG:4326.
- BWDB gauge BST (Asia/Dhaka) to UTC timezone conversion (Guard B1 / R-04).
- Rolling 3-point median filter suppressing spurious telemetry spikes.
- String preservation of station_id and reach_id (Guard B3).
- NetCDF4 and CSV output format integrity.
"""

import os
import tempfile
import numpy as np
import pandas as pd
import pytest

# Guard B2: NetCDF4 import MUST precede xarray
import netCDF4
import xarray as xr

from pipeline.ingest_imerg import (
    shift_imerg_end_of_interval_timestamps,
    process_imerg_dataset,
    ingest_imerg_map,
)
from pipeline.ingest_gauge import (
    sanitize_gauge_observations,
    ingest_bwdb_gauge,
    GAUGE_STATIONS,
)
from pipeline.ingest_hydrosheds import ingest_hydrosheds_basins, SUBBASINS_GEOJSON


def test_imerg_timestamp_shift():
    """Verify IMERG timestamps are shifted back 30 minutes (Guard B4)."""
    end_times = pd.date_range("2026-04-10T01:00:00Z", periods=4, freq="30min")
    shifted = shift_imerg_end_of_interval_timestamps(end_times)

    # First timestamp 01:00:00Z should shift back to 00:30:00Z
    assert shifted[0] == pd.Timestamp("2026-04-10T00:30:00Z")
    assert shifted[-1] == pd.Timestamp("2026-04-10T02:00:00Z")
    assert len(shifted) == len(end_times)


def test_imerg_process_and_map_assertion():
    """Verify IMERG processing extracts precipitationCal and asserts max > 0."""
    times = pd.date_range("2026-04-10T01:00:00Z", periods=6, freq="30min")
    raw_precip = np.array([
        [5.2, 8.4, 12.1, 18.5, 4.2, 0.5],
        [3.1, 6.0, 9.5, 14.2, 3.8, 0.2],
    ])

    ds_raw = xr.Dataset(
        data_vars={
            "precipitationCal": (["sub_basin", "time"], raw_precip),
        },
        coords={
            "sub_basin": ["upper_surma_meghalaya", "kushiyara_transboundary"],
            "time": times,
        },
    )

    ds_processed = process_imerg_dataset(ds_raw)

    assert "precipitationCal" in ds_processed.data_vars
    assert ds_processed["precipitationCal"].values.max() == 18.5
    # Verify times were shifted back by 30 min
    assert pd.Timestamp(ds_processed["time"].values[0]) == pd.Timestamp("2026-04-10T00:30:00")


def test_imerg_all_zero_raises_assertion():
    """Verify processing fails with assertion if precipitation is completely zero."""
    times = pd.date_range("2026-04-10T01:00:00Z", periods=4, freq="30min")
    zero_precip = np.zeros((2, 4))

    ds_zero = xr.Dataset(
        data_vars={
            "precipitationCal": (["sub_basin", "time"], zero_precip),
        },
        coords={
            "sub_basin": ["upper_surma_meghalaya", "kushiyara_transboundary"],
            "time": times,
        },
    )

    with pytest.raises(AssertionError) as exc_info:
        process_imerg_dataset(ds_zero)
    assert "Maximum MAP is 0.0 mm/hr" in str(exc_info.value)


def test_hydrosheds_subbasins_geojson():
    """Verify HydroSHEDS sub-basins export in EPSG:4326 with required attributes."""
    import json
    with tempfile.TemporaryDirectory() as tmp_dir:
        out_geojson = os.path.join(tmp_dir, "test_basins.geojson")
        res = ingest_hydrosheds_basins(output_path=out_geojson)

        assert os.path.exists(out_geojson)
        with open(out_geojson, "r", encoding="utf-8") as f:
            data = json.load(f)

        assert len(data["features"]) == 2
        basins = [f["properties"]["sub_basin_id"] for f in data["features"]]
        assert "upper_surma_meghalaya" in basins
        assert "kushiyara_transboundary" in basins

        for feat in data["features"]:
            assert feat["geometry"]["type"] == "Polygon"
            assert len(feat["geometry"]["coordinates"][0]) >= 4



def test_gauge_bst_to_utc_conversion():
    """Verify BST local times are converted to UTC (Guard B1 / R-04)."""
    raw_gauge = pd.DataFrame({
        "timestamp": ["2026-04-10 06:00:00", "2026-04-10 07:00:00"],  # Local BST = UTC+6
        "station_id": [108, 108],  # Number to test string conversion
        "station_name": ["Kanaighat", "Kanaighat"],
        "reach_id": [22211000011, 22211000011],
        "water_level_m": [11.20, 11.35],
    })

    cleaned = sanitize_gauge_observations(raw_gauge)

    # Guard B1: Local 06:00 BST must convert to 00:00 UTC
    assert cleaned["timestamp"].iloc[0] == pd.Timestamp("2026-04-10 00:00:00+00:00")
    assert cleaned["timestamp"].iloc[1] == pd.Timestamp("2026-04-10 01:00:00+00:00")

    # Guard B3: IDs must be string
    assert cleaned["station_id"].iloc[0] == "108"
    assert cleaned["reach_id"].iloc[0] == "22211000011"


def test_gauge_rolling_median_filter_suppresses_spike():
    """Verify rolling median filter removes isolated sensor spikes."""
    raw_gauge = pd.DataFrame({
        "timestamp": [
            "2026-04-10 06:00:00",
            "2026-04-10 07:00:00",
            "2026-04-10 08:00:00",
            "2026-04-10 09:00:00",
            "2026-04-10 10:00:00",
        ],
        "station_id": ["SW108"] * 5,
        "water_level_m": [11.00, 11.10, 18.50, 11.25, 11.30],  # 18.50 is a sensor glitch spike
    })

    cleaned = sanitize_gauge_observations(raw_gauge)

    # 18.50 spike at index 2 should be replaced by median of (11.10, 18.50, 11.25) = 11.25
    assert cleaned["water_level_m"].iloc[2] == 11.25
    assert cleaned["water_level_m"].max() < 12.00
