"""Deterministic, offline unit tests for trend_explorer/ingest_imerg.py.

All tests run completely offline without requiring NASA network access or live
Earthdata credentials by using mocks and synthetic in-memory fixtures.

Tests:
  1. test_calendar_date_generation_1525_days
  2. test_opendap_url_construction
  3. test_fail_closed_without_credentials
  4. test_fill_value_sanitization_and_cf_attributes
  5. test_annual_chunk_validation_and_sha256
  6. test_handoff_contract_compatibility_with_analysis_engine
"""
from __future__ import annotations

import os
from datetime import date
from pathlib import Path
from unittest.mock import patch

import numpy as np
import pandas as pd
import pytest
import xarray as xr

from trend_explorer.analysis import (
    GEOGRAPHIC_ZONES,
    slice_zone_safe,
    validate_dataset_provenance,
)
from trend_explorer.ingest_imerg import (
    END_YEAR,
    EXPECTED_DAYS_PER_SEASON,
    OPENDAP_BASE,
    START_YEAR,
    STUDY_LAT_MIN,
    STUDY_LAT_MAX,
    STUDY_LON_MIN,
    STUDY_LON_MAX,
    TOTAL_EXPECTED_GRANULES,
    _build_all_season_dates,
    _build_season_dates,
    _get_netrc_credentials,
    _granule_opendap_url,
    _ingest_one_year,
    _is_chunk_valid,
    _require_earthdata_credentials,
    _sha256_bytes,
    _sha256_file,
    _subset_one_day,
    discover_season_granules,
    probe_single_granule,
)


# ---------------------------------------------------------------------------
# 1. Date range generation (1525 days)
# ---------------------------------------------------------------------------

def test_calendar_date_generation_1525_days():
    """Verify exactly 61 days per season (Apr 1 - May 31) across 2001-2025 = 1525 dates."""
    dates_2001 = _build_season_dates(2001)
    assert len(dates_2001) == EXPECTED_DAYS_PER_SEASON
    assert dates_2001[0] == date(2001, 4, 1)
    assert dates_2001[-1] == date(2001, 5, 31)

    all_dates = _build_all_season_dates(START_YEAR, END_YEAR)
    assert len(all_dates) == 25
    total_days = sum(len(d_list) for d_list in all_dates.values())
    assert total_days == TOTAL_EXPECTED_GRANULES, f"Expected 1525 days, got {total_days}"

    # Confirm leap years (e.g., 2004, 2008, 2024) still have exactly 61 April-May days
    for leap_yr in (2004, 2008, 2012, 2016, 2020, 2024):
        leap_dates = _build_season_dates(leap_yr)
        assert len(leap_dates) == 61
        assert leap_dates[0] == date(leap_yr, 4, 1)
        assert leap_dates[-1] == date(leap_yr, 5, 31)


# ---------------------------------------------------------------------------
# 2. OPeNDAP URL construction
# ---------------------------------------------------------------------------

def test_opendap_url_construction():
    """Verify OPeNDAP URL includes the day-of-year (DOY) and expected granule name."""
    # April 1 in a non-leap year (e.g., 2001) is DOY 91 (31 Jan + 28 Feb + 31 Mar + 1 Apr)
    d = date(2001, 4, 1)
    url = _granule_opendap_url(d)
    assert url.startswith(OPENDAP_BASE)
    assert "2001/091/" in url
    assert "3B-DAY.MS.MRG.3IMERG.20010401-S000000-E235959.V07B.nc4" in url

    # May 31 in a leap year (e.g., 2004) is DOY 152 (31+29+31+30+31)
    d_leap = date(2004, 5, 31)
    url_leap = _granule_opendap_url(d_leap)
    assert "2004/152/" in url_leap
    assert "3B-DAY.MS.MRG.3IMERG.20040531-S000000-E235959.V07B.nc4" in url_leap


# ---------------------------------------------------------------------------
# 3. Fail-closed without credentials
# ---------------------------------------------------------------------------

def test_fail_closed_without_credentials():
    """Verify _require_earthdata_credentials exits with code 1 if credentials are missing."""
    with patch.dict(os.environ, {}, clear=True):
        with pytest.raises(SystemExit) as exc:
            _require_earthdata_credentials(load_env=False)
        assert exc.value.code == 1

    # Valid credentials pass
    with patch.dict(os.environ, {"EARTHDATA_USERNAME": "test_user_valid", "EARTHDATA_PASSWORD": "test_password_valid"}):
        u, p = _require_earthdata_credentials(load_env=False)
        assert u == "test_user_valid"
        assert p == "test_password_valid"


# ---------------------------------------------------------------------------
# 4. Fill-value sanitization and CF coordinate attributes
# ---------------------------------------------------------------------------

def test_fill_value_sanitization_and_cf_attributes():
    """Verify fill values (-9999.9, negative) convert to NaN and CF attributes attach."""
    # Mock global dataset returned by xr.open_dataset
    lats = np.linspace(20.0, 30.0, 101)  # 0.1 deg
    lons = np.linspace(85.0, 95.0, 101)
    precip_raw = np.full((1, len(lats), len(lons)), 25.0)
    # Add negative and -9999.9 fill values inside the study area
    precip_raw[0, 50, 50] = -9999.9
    precip_raw[0, 51, 51] = -1.0

    mock_ds = xr.Dataset(
        {"precipitation": (("time", "lat", "lon"), precip_raw)},
        coords={"time": [pd.Timestamp("2001-04-01")], "lat": lats, "lon": lons},
    )

    with patch("xarray.open_dataset", return_value=mock_ds):
        result = _subset_one_day("dummy_url")

    # Lat and lon should be sliced to study bounding box [24.0, 26.0] and [90.0, 93.5]
    assert result["lat"].min() >= STUDY_LAT_MIN
    assert result["lat"].max() <= STUDY_LAT_MAX
    assert result["lon"].min() >= STUDY_LON_MIN
    assert result["lon"].max() <= STUDY_LON_MAX

    # Verify CF attributes
    assert result["lat"].attrs["units"] == "degrees_north"
    assert result["lon"].attrs["units"] == "degrees_east"
    assert result["precipitation"].attrs["units"] == "mm/day"

    # Verify fill values became NaN
    p_vals = result["precipitation"].values
    assert np.isnan(p_vals[0, 10, 10]) or not np.any(p_vals < 0.0)
    assert not np.any(p_vals == -9999.9)


# ---------------------------------------------------------------------------
# 5. Annual chunk validation and SHA-256 caching
# ---------------------------------------------------------------------------

def test_annual_chunk_validation_and_sha256(tmp_path):
    """Verify _is_chunk_valid verifies 61-day size and SHA-256 match."""
    staging_dir = tmp_path / "staging"
    staging_dir.mkdir()

    with patch("trend_explorer.ingest_imerg.STAGING_DIR", staging_dir):
        # Case A: Missing chunk returns False
        assert not _is_chunk_valid(2001)

        # Case B: Incomplete chunk (<61 days) returns False
        incomplete_dates = pd.date_range("2001-04-01", "2001-04-30", freq="D")
        ds_incomplete = xr.Dataset(
            {"precipitation": (("time", "lat", "lon"), np.ones((len(incomplete_dates), 2, 2)))},
            coords={"time": incomplete_dates, "lat": [24.5, 25.5], "lon": [91.0, 92.0]},
        )
        nc_path = staging_dir / "imerg_am_2001.nc"
        sha_path = staging_dir / "imerg_am_2001.sha256"
        ds_incomplete.to_netcdf(nc_path)
        sha_path.write_text(_sha256_file(nc_path), encoding="utf-8")
        assert not _is_chunk_valid(2001)

        # Case C: Complete chunk (61 days) with matching SHA returns True
        full_dates = pd.date_range("2001-04-01", "2001-05-31", freq="D")
        ds_complete = xr.Dataset(
            {"precipitation": (("time", "lat", "lon"), np.ones((61, 2, 2)))},
            coords={"time": full_dates, "lat": [24.5, 25.5], "lon": [91.0, 92.0]},
        )
        ds_complete.to_netcdf(nc_path)
        sha_path.write_text(_sha256_file(nc_path), encoding="utf-8")
        assert _is_chunk_valid(2001)

        # Case D: Corrupt checksum returns False
        sha_path.write_text("corrupted_sha256_hash", encoding="utf-8")
        assert not _is_chunk_valid(2001)


# ---------------------------------------------------------------------------
# 6. Handoff contract compatibility with analysis engine
# ---------------------------------------------------------------------------

def test_handoff_contract_compatibility_with_analysis_engine():
    """Verify that an assembled NetCDF dataset satisfies validate_dataset_provenance and slice_zone_safe."""
    # Build a synthetic dataset with the exact schema written by ingest_imerg_final
    dates = pd.date_range("2001-04-01", "2001-05-31", freq="D")
    lats = np.arange(24.0, 26.05, 0.1)
    lons = np.arange(90.0, 93.55, 0.1)
    data = np.full((len(dates), len(lats), len(lons)), 15.0, dtype=float)

    ds = xr.Dataset(
        {"precipitation": (("time", "lat", "lon"), data, {"units": "mm/day"})},
        coords={"time": dates, "lat": lats, "lon": lons},
        attrs={
            "provenance": "REAL",
            "product": "GPM_3IMERGDF V07",
            "product_version": "07B",
            "source_url": OPENDAP_BASE,
            "doi": "10.5067/GPM/IMERGDF/DAY/07",
        },
    )

    # 1. validate_dataset_provenance must pass without raising
    validate_dataset_provenance(ds)

    # 2. All 3 geographic zones must be safely sliceable
    for zone_id, bounds in GEOGRAPHIC_ZONES.items():
        zone_ds = slice_zone_safe(
            ds,
            lat_min=bounds["lat_min"],
            lat_max=bounds["lat_max"],
            lon_min=bounds["lon_min"],
            lon_max=bounds["lon_max"],
        )
        assert zone_ds.sizes["lat"] > 0, f"Zone {zone_id} had 0 lat cells"
        assert zone_ds.sizes["lon"] > 0, f"Zone {zone_id} had 0 lon cells"


# ---------------------------------------------------------------------------
# 7. Probe single granule verification (mocked offline)
# ---------------------------------------------------------------------------

def test_probe_single_granule_mocked():
    """Verify probe_single_granule executes non-destructively and parses metrics."""
    target_d = date(2024, 4, 1)
    lats = np.arange(24.0, 26.05, 0.1)
    lons = np.arange(90.0, 93.55, 0.1)
    mock_precip = np.full((1, len(lats), len(lons)), 25.4, dtype=float)

    mock_ds = xr.Dataset(
        {"precipitation": (("time", "lat", "lon"), mock_precip, {"units": "mm/day"})},
        coords={"time": [pd.Timestamp("2024-04-01")], "lat": lats, "lon": lons},
    )

    mock_cmr_result = [{
        "meta": {
            "concept-id": "G3228672370-GES_DISC",
            "native-id": "GPM_3IMERGDF.07:3B-DAY.MS.MRG.3IMERG.20240401-S000000-E235959.V07B.nc4",
        },
        "umm": {
            "RelatedUrls": [{
                "URL": "https://opendap.earthdata.nasa.gov/collections/C2723754864-GES_DISC/granules/GPM_3IMERGDF.07%3A3B-DAY.MS.MRG.3IMERG.20240401-S000000-E235959.V07B.nc4",
                "Type": "OPENDAP DATA",
            }],
        },
        "data_links": lambda: ["https://data.gesdisc.earthdata.nasa.gov/data/GPM_L3/GPM_3IMERGDF.07/2024/04/3B-DAY.MS.MRG.3IMERG.20240401-S000000-E235959.V07B.nc4"],
    }]

    with patch("earthaccess.search_data", return_value=mock_cmr_result), \
         patch("trend_explorer.ingest_imerg._require_earthdata_credentials", return_value=("test_user", "test_pass")), \
         patch("trend_explorer.ingest_imerg._login_earthdata"), \
         patch("trend_explorer.ingest_imerg._subset_one_day", return_value=mock_ds):

        result = probe_single_granule(target_date=target_d, load_env=False)

    assert result["status"] == "SUCCESS"
    assert result["date"] == "2024-04-01"
    assert result["concept_id"] == "G3228672370-GES_DISC"
    assert result["valid_points_count"] == len(lats) * len(lons)
    assert abs(result["mean_precipitation_mm_day"] - 25.4) < 1e-4
    assert result["lat_range"][0] == 24.0
    assert result["lon_range"][0] == 90.0
    assert "subset_payload_sha256" in result
    assert result["checksum_type"] == "subset_precipitation_float32_payload"


# ---------------------------------------------------------------------------
# 8. NetRC Credential Support and Fail-Closed CMR Tests
# ---------------------------------------------------------------------------

def test_netrc_credential_resolution():
    """Verify credentials configured in ~/.netrc are detected and accepted when env is empty."""
    with patch.dict(os.environ, {}, clear=True):
        with patch("trend_explorer.ingest_imerg._get_netrc_credentials", return_value=("netrc_user", "netrc_secret")):
            u, p = _require_earthdata_credentials(load_env=False)
            assert u == "netrc_user"
            assert p == "netrc_secret"


def test_discover_season_granules_fail_closed_on_incomplete_results():
    """Verify discover_season_granules fails closed if CMR returns fewer than 61 granules."""
    # Return 60 granules instead of required 61
    mock_results = [{"meta": {}, "umm": {}, "data_links": lambda: []}] * 60
    with patch("earthaccess.search_data", return_value=mock_results):
        with pytest.raises(RuntimeError) as exc_info:
            discover_season_granules(2024)
        assert "expected 61" in str(exc_info.value).lower()


def test_ingest_one_year_fail_closed_on_missing_cmr(tmp_path):
    """Verify _ingest_one_year halts immediately if CMR lacks record for a date (never records UNKNOWN_CMR_ID)."""
    staging_dir = tmp_path / "staging"
    staging_dir.mkdir()

    # Mock CMR returning empty list
    with patch("trend_explorer.ingest_imerg.STAGING_DIR", staging_dir), \
         patch("trend_explorer.ingest_imerg.discover_season_granules", side_effect=RuntimeError("CMR search failed")):
        records = []
        with pytest.raises(RuntimeError) as exc_info:
            _ingest_one_year(2024, records)
        assert "CMR" in str(exc_info.value)
        # Verify no fake/unknown CMR records were recorded
        assert len(records) == 0


def test_probe_single_granule_fails_closed_on_cmr_endpoint_error():
    """Verify probe_single_granule exits with code 1 if OPeNDAP retrieval fails (no fallback)."""
    target_d = date(2024, 4, 1)
    mock_cmr_result = [{
        "meta": {
            "concept-id": "G3228672370-GES_DISC",
            "native-id": "GPM_3IMERGDF.07:3B-DAY.MS.MRG.3IMERG.20240401-S000000-E235959.V07B.nc4",
        },
        "umm": {
            "RelatedUrls": [{
                "URL": "https://opendap.earthdata.nasa.gov/collections/C2723754864-GES_DISC/granules/GPM_3IMERGDF.07%3A3B-DAY.MS.MRG.3IMERG.20240401-S000000-E235959.V07B.nc4",
                "Type": "OPENDAP DATA",
            }],
        },
        "data_links": lambda: [],
    }]

    with patch("earthaccess.search_data", return_value=mock_cmr_result), \
         patch("trend_explorer.ingest_imerg._require_earthdata_credentials", return_value=("test_user", "test_pass")), \
         patch("trend_explorer.ingest_imerg._login_earthdata"), \
         patch("trend_explorer.ingest_imerg._subset_one_day", side_effect=ConnectionError("OPeNDAP connection refused")):

        with pytest.raises(SystemExit) as exc:
            probe_single_granule(target_date=target_d, load_env=False)
        assert exc.value.code == 1



