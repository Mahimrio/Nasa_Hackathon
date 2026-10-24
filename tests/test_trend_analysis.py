import numpy as np
import pandas as pd
import pytest
import xarray as xr

from trend_explorer.analysis import TrendInputError, analyze_area_mean, modified_mann_kendall, seasonal_cell_indicators


def real_daily_dataset():
    time = pd.date_range("2001-04-01", "2010-05-31", freq="D", tz="UTC")
    keep = np.isin(time.month, [4, 5])
    time = time[keep]
    data = np.full((len(time), 2, 2), 10.0)
    return xr.Dataset({"precipitation": (("time", "lat", "lon"), data, {"units": "mm/day"})}, coords={"time": time.tz_localize(None), "lat": [24, 25], "lon": [91, 92]}, attrs={"provenance": "REAL", "product": "GPM_3IMERGDF V07", "source_url": "https://example.test"})


def test_rejects_synthetic_trend_input():
    ds = real_daily_dataset()
    ds.attrs["provenance"] = "SYNTHETIC"
    with pytest.raises(TrendInputError):
        seasonal_cell_indicators(ds, 2001, 2010)


def test_complete_season_cell_first_indices_and_trend():
    indices = seasonal_cell_indicators(real_daily_dataset(), 2001, 2010)
    assert indices.sizes["year"] == 10
    assert float(indices.prcptot_am_mm.isel(year=0, lat=0, lon=0)) == 610.0
    result = analyze_area_mean(indices, "prcptot_am_mm")
    assert result.n_seasons == 10
    assert result.slope_per_year == 0.0


def test_mmk_reports_finite_inference_for_trend():
    tau, p = modified_mann_kendall(np.arange(1, 21, dtype=float))
    assert tau > 0.9
    assert 0 <= p <= 0.05
