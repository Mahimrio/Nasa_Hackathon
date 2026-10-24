"""Reproducible, fail-closed rainfall trend analysis for verified IMERG Final data.

The module deliberately has no download fallback and never creates synthetic
production records. It calculates April--May indicators cell-first, retains
only complete seasons, and reports a variance-corrected Mann--Kendall test.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import xarray as xr
from scipy.stats import norm, theilslopes


class TrendInputError(ValueError):
    pass


@dataclass(frozen=True)
class TrendResult:
    indicator: str
    n_seasons: int
    slope_per_year: float | None
    slope_ci_low: float | None
    slope_ci_high: float | None
    mk_tau: float | None
    mk_p_value: float | None
    significant_at_005: bool | None
    missing_years: list[int]

    def as_dict(self) -> dict[str, Any]:
        return self.__dict__.copy()


def _require_real_dataset(ds: xr.Dataset) -> None:
    provenance = str(ds.attrs.get("provenance", "")).upper()
    if provenance != "REAL":
        raise TrendInputError("Trend analysis accepts only provenance=REAL datasets; synthetic or unknown inputs are rejected.")
    if not ds.attrs.get("product") or not ds.attrs.get("source_url"):
        raise TrendInputError("Verified source product and source_url metadata are required.")


def open_verified_imerg_daily(path: str | Path) -> xr.Dataset:
    """Open a local, verified IMERG Final daily extract without network fallback."""
    path = Path(path)
    if not path.is_file():
        raise FileNotFoundError(f"Verified IMERG Final file not found: {path}")
    ds = xr.open_dataset(path)
    _require_real_dataset(ds)
    if "precipitation" not in ds:
        raise TrendInputError("IMERG Final daily variable 'precipitation' is required (not precipitationCal).")
    if ds["precipitation"].attrs.get("units") not in {"mm/day", "mm d-1", "mm/day"}:
        raise TrendInputError("IMERG Final precipitation must be in mm/day.")
    return ds


def seasonal_cell_indicators(ds: xr.Dataset, start_year: int = 2001, end_year: int = 2025) -> xr.Dataset:
    """Calculate cell-first Apr--May PRCPTOT and R50mm with complete-season policy."""
    _require_real_dataset(ds)
    precip = ds["precipitation"]
    time = pd.DatetimeIndex(pd.to_datetime(precip["time"].values, utc=True))
    expected_days = 61
    per_year = []
    missing_years = []
    for year in range(start_year, end_year + 1):
        mask = (time.year == year) & np.isin(time.month, [4, 5])
        season = precip.isel(time=np.flatnonzero(mask))
        if season.sizes.get("time", 0) != expected_days or bool(season.isnull().any()):
            missing_years.append(year)
            continue
        total = season.sum("time", skipna=False).expand_dims(year=[year])
        r50 = (season >= 50.0).sum("time").expand_dims(year=[year])
        per_year.append(xr.Dataset({"prcptot_am_mm": total, "r50mm_am_days": r50}))
    if not per_year:
        raise TrendInputError("No complete Apr--May seasons are available for trend analysis.")
    result = xr.concat(per_year, dim="year")
    result.attrs.update({
        "provenance": "REAL",
        "missing_years": json.dumps(missing_years),
        "completeness_policy": "61 of 61 April-May daily values required per cell/season",
        "processing_history": "cell-first seasonal indices from verified IMERG Final daily precipitation",
    })
    return result


def modified_mann_kendall(values: np.ndarray) -> tuple[float, float]:
    """Hamed--Rao-style variance correction for autocorrelated annual values.

    Returns Kendall tau and a two-sided normal-approximation p value. The
    effective variance uses significant autocorrelation lags, avoiding a claim
    that unadjusted independent-observation inference is valid.
    """
    x = np.asarray(values, dtype=float)
    x = x[np.isfinite(x)]
    n = len(x)
    if n < 8:
        return float("nan"), float("nan")
    s = sum(np.sign(x[j] - x[i]) for i in range(n - 1) for j in range(i + 1, n))
    tau = s / (n * (n - 1) / 2)
    var_s = n * (n - 1) * (2 * n + 5) / 18
    ranks = pd.Series(x).rank().to_numpy()
    rho = []
    threshold = norm.ppf(0.975) / np.sqrt(n)
    for lag in range(1, n - 1):
        left, right = ranks[:-lag], ranks[lag:]
        r = 0.0 if np.std(left) == 0 or np.std(right) == 0 else np.corrcoef(left, right)[0, 1]
        rho.append(r if np.isfinite(r) and abs(r) > threshold else 0.0)
    correction = 1 + (2 / (n * (n - 1) * (n - 2))) * sum((n - k) * (n - k - 1) * (n - k - 2) * r for k, r in enumerate(rho, 1))
    corrected_var = max(var_s * correction, np.finfo(float).eps)
    z = (s - np.sign(s)) / np.sqrt(corrected_var) if s else 0.0
    return float(tau), float(2 * norm.sf(abs(z)))


def analyze_area_mean(indices: xr.Dataset, variable: str) -> TrendResult:
    if variable not in indices:
        raise TrendInputError(f"Indicator not present: {variable}")
    spatial_dims = [d for d in indices[variable].dims if d != "year"]
    series = indices[variable].mean(spatial_dims, skipna=False).values.astype(float)
    years = indices["year"].values.astype(float)
    valid = np.isfinite(series)
    missing = [int(y) for y in years[~valid]]
    if valid.sum() < 8:
        return TrendResult(variable, int(valid.sum()), None, None, None, None, None, None, missing)
    slope, _intercept, lo, hi = theilslopes(series[valid], years[valid], 0.95)
    tau, p = modified_mann_kendall(series[valid])
    return TrendResult(variable, int(valid.sum()), float(slope), float(lo), float(hi), tau, p, bool(p < 0.05), missing)


def export_analysis(indices: xr.Dataset, output_path: str | Path) -> dict[str, Any]:
    results = [analyze_area_mean(indices, name).as_dict() for name in ("prcptot_am_mm", "r50mm_am_days")]
    output = {"provenance": "REAL", "analysis_type": "historical_trend_analysis", "method": "cell-first complete-season indices; Theil-Sen slope; modified Mann-Kendall variance correction", "results": results, "limitations": "Area mean does not establish causality or predict individual floods; spatial dependence and multiple-area inference require explicit extension."}
    Path(output_path).write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    return output
