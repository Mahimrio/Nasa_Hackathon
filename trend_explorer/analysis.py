"""Multi-zone, fail-closed rainfall trend analysis for verified IMERG Final data.

Scientific specification: Module 2 Step 1, schema v2.2.0.

Design invariants
-----------------
* Never generates synthetic production records; fail-closed on missing real data.
* Cell-first indicator computation followed by cos(lat) area-weighting.
* Theil-Sen slope uses actual year deltas, not index differences.
* Kendall variance includes tied-rank correction (critical for discrete R50mm).
* Hamed-Rao autocorrelation correction computed on ranks of detrended residuals;
  all significant lags k=1..n-1 included; CF may be <1 (negative autocorrelation
  is valid).
* Holm-Bonferroni applied across the full 6-test family (3 zones × 2 indicators).
* Sen-Kendall rank CI uses Gilbert (1987) 1-indexed formulas.
* Minimum sample gate: ≥20 of 25 possible seasons required per zone.
* Spatial coverage: ≥95 % valid cells required for a day to count as valid.
* Zone membership by cell-centre, half-open intervals; ascending/descending lat
  coordinates both handled.
* No NaN or Infinity values written to the JSON output.
"""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import xarray as xr
from scipy.stats import norm


# ---------------------------------------------------------------------------
# Public exception
# ---------------------------------------------------------------------------

class TrendInputError(ValueError):
    """Raised when input data fail provenance or completeness checks."""


# ---------------------------------------------------------------------------
# Geographic zone definitions
# ---------------------------------------------------------------------------

GEOGRAPHIC_ZONES: dict[str, dict[str, Any]] = {
    "zone_a": {
        "name": "Meghalaya Southern Slopes (Transboundary Quadrant Zone A)",
        "lat_min": 25.1, "lat_max": 25.5,
        "lon_min": 91.0, "lon_max": 92.5,
        "type": "transboundary_coordinate_quadrant",
        "description": (
            "Transboundary lat/lon bounding box (25.1°-25.5°N, 91.0°-92.5°E) capturing the "
            "steep southern orographic escarpment of the Meghalaya plateau generating rapid "
            "surface runoff into the northern Surma river headwaters."
        ),
    },
    "zone_b": {
        "name": "Barak/Kushiyara Inflow Corridor (Transboundary Quadrant Zone B)",
        "lat_min": 24.5, "lat_max": 25.1,
        "lon_min": 92.5, "lon_max": 93.5,
        "type": "transboundary_coordinate_quadrant",
        "description": (
            "Transboundary lat/lon bounding box (24.5°-25.1°N, 92.5°-93.5°E) capturing the "
            "eastern cross-border inflow corridor through Assam/Tripura borderlands discharging "
            "into the Kushiyara river system."
        ),
    },
    "zone_c": {
        "name": "Central Sylhet Haor Depression (Internal Basin Quadrant Zone C)",
        "lat_min": 24.2, "lat_max": 25.0,
        "lon_min": 90.8, "lon_max": 91.8,
        "type": "internal_basin_coordinate_quadrant",
        "description": (
            "Internal basin depression bounding box (24.2°-25.0°N, 90.8°-91.8°E) capturing the "
            "low-elevation floodplain wetlands of Sylhet, Sunamganj, and Netrokona where flash "
            "floods pond over Boro rice fields."
        ),
    },
}

# Study period
_START_YEAR: int = 2001
_END_YEAR: int = 2025
_MIN_SEASONS: int = 20          # predeclared project threshold
_MIN_SEASONS_FOR_MK: int = 8    # absolute floor for sensible statistics
_COVERAGE_THRESHOLD: float = 0.95  # fraction of valid cells required per day
_LAG1_THRESHOLD: float = 0.392  # |r1| threshold to switch to modified MK
_SIGNIFICANT_LAG_THRESHOLD_MULTIPLIER: float = 1.96  # for |ρ_k| > 1.96/√n
_MIN_PAIRS_FOR_LAG: int = 10    # minimum overlapping pairs to include a lag


# ---------------------------------------------------------------------------
# Provenance validation
# ---------------------------------------------------------------------------

def _sha256_of_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def validate_dataset_provenance(
    ds: xr.Dataset,
    file_path: str | Path | None = None,
    manifest_path: str | Path | None = None,
) -> None:
    """Fail-closed provenance gate.

    Checks:
    1. ds.attrs["provenance"] == "REAL"
    2. ds.attrs["product"] contains "GPM_3IMERGDF"
    3. ds.attrs["source_url"] is non-empty
    4. "precipitation" variable present with expected units
    5. If manifest_path provided: verify file checksum against manifest
    """
    provenance = str(ds.attrs.get("provenance", "")).upper()
    if provenance != "REAL":
        raise TrendInputError(
            "Trend analysis accepts only provenance=REAL datasets; "
            f"got '{ds.attrs.get('provenance', '(missing)')}'. "
            "Synthetic or unknown inputs are rejected."
        )

    product = str(ds.attrs.get("product", ""))
    if "GPM_3IMERGDF" not in product:
        raise TrendInputError(
            f"Dataset product must contain 'GPM_3IMERGDF'; got '{product}'."
        )

    source_url = str(ds.attrs.get("source_url", "")).strip()
    if not source_url:
        raise TrendInputError(
            "Dataset must have a non-empty 'source_url' attribute."
        )

    if "precipitation" not in ds:
        raise TrendInputError(
            "Variable 'precipitation' is required (not precipitationCal)."
        )
    units = ds["precipitation"].attrs.get("units", "")
    if units not in {"mm/day", "mm d-1"}:
        raise TrendInputError(
            f"precipitation must have units 'mm/day' or 'mm d-1'; got '{units}'."
        )

    # Optional checksum verification against manifest
    if manifest_path is not None and file_path is not None:
        manifest_path = Path(manifest_path)
        file_path = Path(file_path)
        if manifest_path.is_file():
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            expected_sha = manifest.get("files", {}).get(
                file_path.name, manifest.get(file_path.name)
            )
            if expected_sha:
                actual_sha = _sha256_of_file(file_path)
                if actual_sha.lower() != expected_sha.lower():
                    raise TrendInputError(
                        f"SHA-256 checksum mismatch for '{file_path.name}': "
                        f"expected {expected_sha}, got {actual_sha}. "
                        "The file may have been modified after retrieval."
                    )


def open_verified_imerg_daily(
    path: str | Path,
    manifest_path: str | Path | None = None,
) -> xr.Dataset:
    """Open a local verified IMERG Final daily extract without network fallback."""
    path = Path(path)
    if not path.is_file():
        raise FileNotFoundError(
            f"Verified IMERG Final file not found: {path}\n"
            "Trend analysis is fail-closed: provide a real NASA data file."
        )
    ds = xr.open_dataset(path)
    validate_dataset_provenance(ds, file_path=path, manifest_path=manifest_path)
    return ds


# ---------------------------------------------------------------------------
# Zone slicing (ascending or descending latitude)
# ---------------------------------------------------------------------------

def slice_zone_safe(
    ds: xr.Dataset,
    lat_min: float,
    lat_max: float,
    lon_min: float,
    lon_max: float,
    **_kwargs: Any,
) -> xr.Dataset:
    """Extract a geographic sub-region using cell-centre, half-open intervals.

    Half-open convention: lat_min <= lat_centre < lat_max (same for lon).
    Handles both ascending and descending latitude coordinate orders.
    A cell can belong to at most one zone because zones use non-overlapping
    half-open intervals.
    """
    lats = ds["lat"].values.astype(float)
    lons = ds["lon"].values.astype(float)

    lat_mask = (lats >= lat_min) & (lats < lat_max)
    lon_mask = (lons >= lon_min) & (lons < lon_max)

    lat_indices = np.flatnonzero(lat_mask)
    lon_indices = np.flatnonzero(lon_mask)

    if lat_indices.size == 0 or lon_indices.size == 0:
        raise TrendInputError(
            f"No grid cells found in zone bounds "
            f"lat=[{lat_min},{lat_max}) lon=[{lon_min},{lon_max}). "
            "Check dataset coverage."
        )

    return ds.isel(lat=lat_indices, lon=lon_indices)


# ---------------------------------------------------------------------------
# Daily completeness evaluation
# ---------------------------------------------------------------------------

def _build_expected_dates(year: int) -> set[pd.Timestamp]:
    """Return the set of 61 dates: April 1 through May 31 for the given year."""
    return set(pd.date_range(f"{year}-04-01", f"{year}-05-31", freq="D"))


def evaluate_zone_day_coverage(
    zone_ds: xr.Dataset,
    year: int,
) -> tuple[bool, int, set]:
    """Check completeness for a single zone-year.

    A day is valid when:
    - Exactly one record exists for that date.
    - ≥95 % of grid cells have non-NaN precipitation values.

    Returns
    -------
    complete : bool
        True when every one of the 61 expected dates is valid.
    valid_days : int
        Number of dates that passed both checks.
    expected_dates : set[pd.Timestamp]
        The full set of expected dates (April 1 – May 31).
    """
    precip = zone_ds["precipitation"]
    time_raw = precip["time"].values
    times = pd.DatetimeIndex(pd.to_datetime(time_raw)).normalize()
    # Strip timezone so comparison with naive pd.Timestamp works
    times = times.tz_localize(None) if times.tz is not None else times

    expected_dates = _build_expected_dates(year)
    valid_days = 0

    for date in expected_dates:
        date_norm = pd.Timestamp(date).normalize()
        indices = np.flatnonzero(times == date_norm)
        # Reject duplicate date or missing date
        if len(indices) != 1:
            continue
        day_data = precip.isel(time=int(indices[0]))
        total_cells = day_data.size
        if total_cells == 0:
            continue
        valid_cells = int(np.sum(np.isfinite(day_data.values)))
        if valid_cells / total_cells >= _COVERAGE_THRESHOLD:
            valid_days += 1

    return valid_days == len(expected_dates), valid_days, expected_dates


# ---------------------------------------------------------------------------
# Cell-first indicator computation with cos(lat) weighting
# ---------------------------------------------------------------------------

def compute_cell_first_indicators(
    zone_ds: xr.Dataset,
    year: int,
) -> tuple[float, float]:
    """Compute PRCPTOT and R50mm with cell-first logic and cos(lat) area-weighting.

    Parameters
    ----------
    zone_ds : xr.Dataset
        Zone-masked dataset (all 61 April-May days presumed complete).
    year : int
        The season year.

    Returns
    -------
    prcptot_mm : float
        Area-weighted mean of per-cell Apr-May total precipitation (P ≥ 1.0 mm/day).
    r50mm_days : float
        Area-weighted mean of per-cell count of heavy-rain days (P ≥ 50.0 mm/day).
    """
    precip = zone_ds["precipitation"]
    time_raw = precip["time"].values
    times = pd.DatetimeIndex(pd.to_datetime(time_raw)).normalize()
    times = times.tz_localize(None) if times.tz is not None else times

    # Select only April-May days for this year
    mask = np.array([
        (t.year == year and t.month in (4, 5)) for t in times
    ])
    season = precip.isel(time=np.flatnonzero(mask))  # shape (61, nlat, nlon)

    p = season.values.astype(float)  # (time, lat, lon)

    # Missing-data preservation (fails closed against turning NaNs into 0.0 dry days):
    # Any cell with missing (NaN) values on any day of the 61-day season is masked as NaN,
    # rather than treating missing days as 0.0 mm (dry days).
    cell_has_nan = np.isnan(p).any(axis=0)  # shape (nlat, nlon)

    # For valid cells, accumulate wet-day precipitation (P >= 1.0 mm/day) and heavy days (P >= 50.0 mm/day)
    wet_p = np.where(p >= 1.0, p, 0.0)
    prcptot_raw = np.sum(wet_p, axis=0)  # shape (nlat, nlon)
    prcptot_cell = np.where(cell_has_nan, np.nan, prcptot_raw)

    r50_raw = np.sum((p >= 50.0).astype(float), axis=0)  # shape (nlat, nlon)
    r50mm_cell = np.where(cell_has_nan, np.nan, r50_raw)

    # Cos(lat) area weights
    lats = zone_ds["lat"].values.astype(float)
    weights = np.cos(np.deg2rad(lats))  # (nlat,)
    # Broadcast to (nlat, nlon)
    weight_grid = np.outer(weights, np.ones(prcptot_cell.shape[1]))

    # Area-weighting only over spatial cells with complete seasonal observations
    valid_spatial_mask = np.isfinite(prcptot_cell) & np.isfinite(r50mm_cell)
    if not np.any(valid_spatial_mask):
        raise TrendInputError(
            f"No valid spatial grid cells with 100% complete seasonal record in year {year}."
        )

    prcptot_mm = float(
        np.average(prcptot_cell[valid_spatial_mask], weights=weight_grid[valid_spatial_mask])
    )
    r50mm_days = float(
        np.average(r50mm_cell[valid_spatial_mask], weights=weight_grid[valid_spatial_mask])
    )

    return prcptot_mm, r50mm_days


# ---------------------------------------------------------------------------
# Theil-Sen slope (actual year deltas)
# ---------------------------------------------------------------------------

def compute_theil_sen_slope(
    years_arr: np.ndarray,
    values_arr: np.ndarray,
) -> tuple[float, float, float, np.ndarray]:
    """Compute Theil-Sen slope using actual year deltas.

    Returns
    -------
    beta_per_year : float
    beta_per_decade : float
    intercept : float
        Median of (y_i - beta * year_i).
    slopes_sorted : np.ndarray
        All N*(N-1)/2 pairwise slopes, sorted ascending.
    """
    years_arr = np.asarray(years_arr, dtype=float)
    values_arr = np.asarray(values_arr, dtype=float)
    n = len(years_arr)
    slopes: list[float] = []
    for i in range(n - 1):
        for j in range(i + 1, n):
            dy = values_arr[j] - values_arr[i]
            dx = years_arr[j] - years_arr[i]
            if dx != 0.0:
                slopes.append(dy / dx)
    slopes_sorted = np.sort(slopes)
    beta_per_year = float(np.median(slopes_sorted))
    intercept = float(np.median(values_arr - beta_per_year * years_arr))
    return beta_per_year, beta_per_year * 10.0, intercept, slopes_sorted


# ---------------------------------------------------------------------------
# Sen-Kendall confidence interval (Gilbert 1987)
# ---------------------------------------------------------------------------

def compute_sens_kendall_ci(
    slopes_sorted: np.ndarray,
    var_star_s: float,
    alpha: float = 0.05,
) -> tuple[float, float]:
    """Gilbert (1987) rank-based confidence interval for the Theil-Sen slope.

    Uses the corrected variance Var*(S) from the modified Mann-Kendall test.

    Parameters
    ----------
    slopes_sorted : sorted array of N' = N*(N-1)/2 pairwise slopes.
    var_star_s : corrected Kendall variance.
    alpha : significance level (default 0.05 → 95 % CI).

    Returns
    -------
    ci_low, ci_high : float
    """
    n_prime = len(slopes_sorted)
    if n_prime == 0 or var_star_s <= 0:
        return float("nan"), float("nan")

    z_alpha2 = norm.ppf(1.0 - alpha / 2.0)
    half_width = z_alpha2 * math.sqrt(var_star_s)

    # 1-indexed M1, M2 (Gilbert 1987)
    m1 = max(1, math.floor((n_prime - half_width) / 2.0))
    m2 = min(n_prime, math.ceil((n_prime + half_width) / 2.0) + 1)

    # Convert from 1-indexed Gilbert (1987) ranks to 0-indexed Python array indices:
    # Rank M1 corresponds to slopes_sorted[m1 - 1]; Rank M2 corresponds to slopes_sorted[m2 - 1].
    idx_low = min(n_prime - 1, max(0, m1 - 1))
    idx_high = min(n_prime - 1, max(0, m2 - 1))

    return float(slopes_sorted[idx_low]), float(slopes_sorted[idx_high])


# ---------------------------------------------------------------------------
# Kendall S and variance with tied-rank correction
# ---------------------------------------------------------------------------

def compute_kendall_s_and_var(values: np.ndarray) -> tuple[float, float]:
    """Compute Mann-Kendall S statistic and its variance with tied-rank correction.

    The tied-rank correction is critical for discrete indicators (R50mm).

    Returns
    -------
    S : float
        Sum of signs of all pairwise differences.
    Var_S : float
        Variance of S under H0, with tied-rank correction.
    """
    x = np.asarray(values, dtype=float)
    n = len(x)

    s = 0.0
    for i in range(n - 1):
        for j in range(i + 1, n):
            s += float(np.sign(x[j] - x[i]))

    # Tied-rank correction term: Σ t*(t-1)*(2t+5) for each tie group of size t
    tie_correction = 0.0
    unique_vals, counts = np.unique(x, return_counts=True)
    for t in counts:
        if t > 1:
            tie_correction += t * (t - 1) * (2 * t + 5)

    var_s = (n * (n - 1) * (2 * n + 5) - tie_correction) / 18.0
    var_s = max(var_s, np.finfo(float).eps)

    return s, var_s


# ---------------------------------------------------------------------------
# Hamed-Rao autocorrelation correction
# ---------------------------------------------------------------------------

def compute_hamed_rao_correction(
    years_arr: np.ndarray,
    values_arr: np.ndarray,
    beta: float,
    var_s: float,
) -> tuple[float, float, float]:
    """Full Hamed-Rao (1998) multi-lag variance correction.

    Autocorrelation is computed on the **ranks** of detrended residuals:
        e_t = y_t - beta * (year_t - year_0)

    For each lag k, only consecutive calendar-year pairs are used if years are
    gapped (i.e., pairs where year_j - year_i == k). A lag is included only
    when |ρ_k| > 1.96/√n AND ≥10 pairs are available.

    CF may be <1 (negative autocorrelation is scientifically valid).

    Returns
    -------
    var_star : float
        Corrected variance Var*(S) = max(Var_S * CF, eps).
    CF : float
        Correction factor (may be <1).
    r1 : float
        Lag-1 autocorrelation coefficient.
    """
    years_arr = np.asarray(years_arr, dtype=float)
    values_arr = np.asarray(values_arr, dtype=float)
    n = len(values_arr)
    year_0 = years_arr[0]

    # Detrend and rank residuals
    residuals = values_arr - beta * (years_arr - year_0)
    ranks = pd.Series(residuals).rank().to_numpy(dtype=float)

    threshold = _SIGNIFICANT_LAG_THRESHOLD_MULTIPLIER / math.sqrt(n)
    r1 = 0.0
    correction_sum = 0.0

    for k in range(1, n):
        # Collect pairs where actual year difference == k
        left_ranks: list[float] = []
        right_ranks: list[float] = []
        for i in range(n):
            for j in range(n):
                if j > i and abs(years_arr[j] - years_arr[i]) == k:
                    left_ranks.append(ranks[i])
                    right_ranks.append(ranks[j])

        if len(left_ranks) < _MIN_PAIRS_FOR_LAG:
            continue

        lr = np.array(left_ranks, dtype=float)
        rr = np.array(right_ranks, dtype=float)
        std_l = float(np.std(lr))
        std_r = float(np.std(rr))
        if std_l == 0.0 or std_r == 0.0:
            rho_k = 0.0
        else:
            rho_k = float(np.corrcoef(lr, rr)[0, 1])

        if not math.isfinite(rho_k) or abs(rho_k) <= threshold:
            rho_k = 0.0

        if k == 1:
            r1 = rho_k

        if rho_k != 0.0:
            n_k = n - k
            # Hamed-Rao weight: (n-k)(n-k-1)(n-k-2)
            weight = n_k * (n_k - 1) * (n_k - 2)
            correction_sum += weight * rho_k

    cf = 1.0 + (2.0 / (n * (n - 1) * (n - 2))) * correction_sum
    var_star = max(var_s * cf, np.finfo(float).eps)
    return var_star, cf, r1


# ---------------------------------------------------------------------------
# Mann-Kendall test
# ---------------------------------------------------------------------------

def run_mann_kendall(
    s: float,
    var_star: float,
    r1: float,
    n: int,
    cf: float = 1.0,
) -> tuple[float, float, float, str, str]:
    """Compute Mann-Kendall Z, p-value, tau, and governing test label.

    Uses continuity correction (subtract sign(S) before dividing by σ).

    Parameters
    ----------
    s : MK statistic S.
    var_star : corrected variance Var*(S).
    r1 : lag-1 autocorrelation on detrended ranks.
    n : number of observations.
    cf : Hamed-Rao variance correction factor CF = Var*(S) / Var(S).

    Returns
    -------
    tau : float    Kendall tau = S / (n*(n-1)/2).
    p_raw : float  Two-sided p-value.
    z : float      Test statistic.
    governing_test : str
    verdict : str
    """
    pairs = n * (n - 1) / 2.0
    tau = s / pairs if pairs > 0 else 0.0

    if s == 0.0:
        z = 0.0
    else:
        z = (s - math.copysign(1.0, s)) / math.sqrt(var_star)

    p_raw = float(2.0 * norm.sf(abs(z)))
    p_raw = min(p_raw, 1.0)

    # When Hamed & Rao (1998) variance correction is applied (CF != 1.0) or |r1| >= threshold,
    # the governing test is the Modified Mann-Kendall test.
    # When no significant serial correlation exists (CF == 1.0), it is the Standard Mann-Kendall test.
    governing_test = (
        "MODIFIED_MANN_KENDALL"
        if (abs(cf - 1.0) > 1e-4 or abs(r1) >= _LAG1_THRESHOLD)
        else "STANDARD_MANN_KENDALL"
    )

    if p_raw < 0.05:
        direction = "INCREASING" if s > 0 else "DECREASING"
        verdict = f"SIGNIFICANT_{direction}_TREND"
    else:
        verdict = "NO_SIGNIFICANT_TREND"

    return float(tau), p_raw, float(z), governing_test, verdict


# ---------------------------------------------------------------------------
# Holm-Bonferroni correction
# ---------------------------------------------------------------------------

def apply_holm_bonferroni(p_values_dict: dict[str, float]) -> dict[str, float]:
    """Apply Holm-Bonferroni step-down correction to a family of p-values.

    Parameters
    ----------
    p_values_dict : {test_key: p_raw, ...}

    Returns
    -------
    {test_key: p_adjusted, ...}

    The adjusted p-values are guaranteed to be monotone (cumulative max) and
    clamped to 1.0.
    """
    keys = list(p_values_dict.keys())
    p_raw = [p_values_dict[k] for k in keys]
    k_total = len(p_raw)

    # Sort ascending by p-value
    order = np.argsort(p_raw)
    sorted_keys = [keys[i] for i in order]
    sorted_p = [p_raw[i] for i in order]

    adjusted: list[float] = []
    for rank_0based, p in enumerate(sorted_p):
        rank_1based = rank_0based + 1
        adj = p * (k_total - rank_1based + 1)
        adjusted.append(min(adj, 1.0))

    # Enforce monotonicity via cumulative max
    for i in range(1, len(adjusted)):
        adjusted[i] = max(adjusted[i], adjusted[i - 1])

    result = {k: min(v, 1.0) for k, v in zip(sorted_keys, adjusted)}
    return result


# ---------------------------------------------------------------------------
# Single-zone analysis
# ---------------------------------------------------------------------------

def analyze_zone(
    ds: xr.Dataset,
    zone_id: str,
    start_year: int = _START_YEAR,
    end_year: int = _END_YEAR,
) -> dict[str, Any]:
    """Analyse one geographic zone across all study years.

    Returns a dict matching the zone-level schema (v2.2.0):
    {
        "zone_id": str,
        "status": "COMPUTED" | "INSUFFICIENT_DATA",
        "complete_seasons_count": int,
        "incomplete_seasons": [...],
        "indicators": {
            "prcptot": {...trend fields...},
            "r50mm": {...trend fields...},
        },
        "annual_series": [
            {"year": int, "prcptot_observed": float|null, "r50mm_observed": float|null,
             "prcptot_fitted": float|null, "r50mm_fitted": float|null,
             "season_complete": bool},
            ...
        ],
    }
    """
    bounds = GEOGRAPHIC_ZONES[zone_id]
    zone_ds = slice_zone_safe(
        ds,
        lat_min=bounds["lat_min"], lat_max=bounds["lat_max"],
        lon_min=bounds["lon_min"], lon_max=bounds["lon_max"],
    )

    all_years = list(range(start_year, end_year + 1))
    prcptot_obs: dict[int, float] = {}
    r50mm_obs: dict[int, float] = {}
    incomplete_seasons: list[dict[str, Any]] = []

    for year in all_years:
        complete, valid_days, expected_dates = evaluate_zone_day_coverage(zone_ds, year)
        if not complete:
            incomplete_seasons.append({
                "year": year,
                "valid_days": valid_days,
                "expected_days": len(expected_dates),
                "reason": "INSUFFICIENT_COVERAGE",
            })
            continue
        prcptot_mm, r50mm_days = compute_cell_first_indicators(zone_ds, year)
        prcptot_obs[year] = prcptot_mm
        r50mm_obs[year] = r50mm_days

    complete_seasons_count = len(prcptot_obs)
    insufficient = complete_seasons_count < _MIN_SEASONS

    if insufficient or complete_seasons_count < _MIN_SEASONS_FOR_MK:
        annual_series = [
            {
                "year": y,
                "prcptot_observed": prcptot_obs.get(y),
                "r50mm_observed": r50mm_obs.get(y),
                "prcptot_fitted": None,
                "r50mm_fitted": None,
                "season_complete": y in prcptot_obs,
            }
            for y in all_years
        ]
        return {
            "zone_id": zone_id,
            "status": "INSUFFICIENT_DATA",
            "complete_seasons_count": complete_seasons_count,
            "minimum_seasons_required": _MIN_SEASONS,
            "incomplete_seasons": incomplete_seasons,
            "indicators": {
                "prcptot": {"status": "INSUFFICIENT_DATA"},
                "r50mm": {"status": "INSUFFICIENT_DATA"},
            },
            "annual_series": annual_series,
        }

    # --- Statistical computation for each indicator ---
    indicators_out: dict[str, Any] = {}
    # Store for Holm-Bonferroni: keyed as "zone_id:indicator_id"
    p_raw_store: dict[str, float] = {}

    for indicator_id, obs_dict in [("prcptot", prcptot_obs), ("r50mm", r50mm_obs)]:
        complete_years = sorted(obs_dict.keys())
        years_arr = np.array(complete_years, dtype=float)
        values_arr = np.array([obs_dict[y] for y in complete_years], dtype=float)
        n = len(years_arr)

        beta, beta_decade, intercept, slopes_sorted = compute_theil_sen_slope(
            years_arr, values_arr
        )
        s, var_s = compute_kendall_s_and_var(values_arr)
        var_star, cf, r1 = compute_hamed_rao_correction(
            years_arr, values_arr, beta, var_s
        )
        ci_low, ci_high = compute_sens_kendall_ci(slopes_sorted, var_star)
        tau, p_raw, z_stat, governing_test, verdict = run_mann_kendall(
            s, var_star, r1, n, cf=cf
        )

        p_raw_store[f"{zone_id}:{indicator_id}"] = p_raw

        # Fitted values on complete years
        fitted = {y: beta * float(y) + intercept for y in complete_years}

        indicators_out[indicator_id] = {
            "status": "COMPUTED",
            "n_complete_seasons": n,
            "slope_per_year": beta,
            "slope_per_decade": beta_decade,
            "slope_ci_low_per_year": ci_low,
            "slope_ci_high_per_year": ci_high,
            "slope_ci_note": (
                "Confidence interval for the Sen slope estimate; "
                "not a per-year uncertainty band."
            ),
            "kendall_s": s,
            "kendall_var_s": var_s,
            "kendall_var_s_star": var_star,
            "correction_factor_cf": cf,
            "r1_lag1_autocorr": r1,
            "governing_test": governing_test,
            "kendall_tau": tau,
            "z_statistic": z_stat,
            "p_value_raw": p_raw,
            # p_value_adjusted filled in after Holm step
            "p_value_adjusted": None,
            "is_significant": None,
            "significance_note": (
                "is_significant refers to p_value_adjusted at α=0.05; "
                "Holm-Bonferroni applied across 6 tests (3 zones × 2 indicators)."
            ),
            "verdict": verdict,
            "fitted": fitted,
        }

    # --- Build annual_series ---
    # We need fitted values from both indicators; compute intercepts from final beta
    prcptot_meta = indicators_out["prcptot"]
    r50mm_meta = indicators_out["r50mm"]

    annual_series: list[dict[str, Any]] = []
    for year in all_years:
        in_complete = year in prcptot_obs
        yr_f = float(year)
        prcptot_fitted = (
            prcptot_meta["fitted"].get(year) if in_complete else None
        )
        r50mm_fitted = (
            r50mm_meta["fitted"].get(year) if in_complete else None
        )
        annual_series.append({
            "year": year,
            "prcptot_observed": prcptot_obs.get(year),
            "r50mm_observed": r50mm_obs.get(year),
            "prcptot_fitted": prcptot_fitted,
            "r50mm_fitted": r50mm_fitted,
            "season_complete": in_complete,
        })

    # Strip internal "fitted" dict before returning (it was a build artifact)
    for ind in indicators_out.values():
        ind.pop("fitted", None)
        ind["annual_series"] = annual_series

    return {
        "zone_id": zone_id,
        "status": "COMPUTED",
        "complete_seasons_count": complete_seasons_count,
        "minimum_seasons_required": _MIN_SEASONS,
        "incomplete_seasons": incomplete_seasons,
        "indicators": indicators_out,
        "annual_series": annual_series,
        "_p_raw_store": p_raw_store,
    }


# ---------------------------------------------------------------------------
# Multi-zone export
# ---------------------------------------------------------------------------

def _sanitize_floats(obj: Any) -> Any:
    """Recursively replace NaN/Infinity with None for JSON-safe output."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, dict):
        return {k: _sanitize_floats(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize_floats(v) for v in obj]
    return obj


def export_multi_zone_analysis(
    ds: xr.Dataset,
    output_path: str | Path,
    file_path: str | Path | None = None,
    manifest_path: str | Path | None = None,
    allow_synthetic_test: bool = False,
) -> dict[str, Any]:
    """Run the full 3-zone trend analysis and write the JSON output.

    Parameters
    ----------
    ds : xr.Dataset
        Precipitation dataset.
    output_path : Path or str
        Destination path for JSON output.
    file_path : Path or str, optional
        Source file path for SHA-256 integrity verification against manifest.
    manifest_path : Path or str, optional
        Path to PROVENANCE.json manifest.
    allow_synthetic_test : bool, default False
        Test-only flag. When True, accepts synthetic test datasets and strictly
        stamps output as 'SYNTHETIC_TEST_RUN' / 'TEST_EXECUTION'.
        When False (production), enforces provenance=REAL, checks checksum,
        and stamps 'VERIFIED_REAL' / 'COMPUTED'.
    """
    if not allow_synthetic_test:
        validate_dataset_provenance(ds, file_path=file_path, manifest_path=manifest_path)
        out_provenance = "VERIFIED_REAL"
        out_status = "COMPUTED"
    else:
        out_provenance = "SYNTHETIC_TEST_RUN"
        out_status = "TEST_EXECUTION"

    zone_results: list[dict[str, Any]] = []
    all_p_raw: dict[str, float] = {}

    for zone_id in GEOGRAPHIC_ZONES:
        try:
            zone_data = analyze_zone(ds, zone_id)
        except TrendInputError as exc:
            # Zone has no overlapping grid cells — treat as INSUFFICIENT_DATA
            zone_data = {
                "zone_id": zone_id,
                "status": "INSUFFICIENT_DATA",
                "complete_seasons_count": 0,
                "minimum_seasons_required": _MIN_SEASONS,
                "incomplete_seasons": [],
                "insufficient_reason": str(exc),
                "indicators": {
                    "prcptot": {"status": "INSUFFICIENT_DATA"},
                    "r50mm": {"status": "INSUFFICIENT_DATA"},
                },
                "annual_series": [],
            }
        # Collect raw p-values for Holm correction
        p_store = zone_data.pop("_p_raw_store", {})
        all_p_raw.update(p_store)
        zone_results.append(zone_data)

    # Apply Holm-Bonferroni only over tests that actually have a p-value
    if all_p_raw:
        adjusted = apply_holm_bonferroni(all_p_raw)
        for zone_data in zone_results:
            zone_id = zone_data["zone_id"]
            for indicator_id in ("prcptot", "r50mm"):
                ind = zone_data["indicators"].get(indicator_id, {})
                if ind.get("status") == "COMPUTED":
                    key = f"{zone_id}:{indicator_id}"
                    p_adj = adjusted.get(key)
                    ind["p_value_adjusted"] = p_adj
                    ind["is_significant"] = (
                        bool(p_adj < 0.05) if p_adj is not None else None
                    )
                    ind["multiple_testing_correction"] = "Holm-Bonferroni"
                    ind["multiple_testing_family_size"] = len(all_p_raw)

    output: dict[str, Any] = {
        "schema_version": "2.2.0",
        "generated_at_utc": pd.Timestamp.now("UTC").isoformat(),
        "input_provenance": out_provenance,
        "analysis_status": out_status,
        "study_period": {"start_year": _START_YEAR, "end_year": _END_YEAR},
        "study_region": "Sylhet Division, Bangladesh (Haor Basin / SWOT overpass region)",
        "indicators": {
            "prcptot": {
                "id": "prcptot",
                "threshold_mm_per_day": 1.0,
                "description": "Apr-May total precipitation on wet days (P ≥ 1 mm/day), mm",
            },
            "r50mm": {
                "id": "r50mm",
                "threshold_mm_per_day": 50.0,
                "description": "Count of Apr-May heavy-rain days (P ≥ 50 mm/day), days",
            },
        },
        "spatial_coverage_policy": {
            "minimum_valid_cell_fraction": _COVERAGE_THRESHOLD,
            "zone_membership": "half-open intervals on cell centres; no cell can belong to two zones",
            "weighting": "cos(latitude) area weights applied after cell-first accumulation",
        },
        "statistical_methods": {
            "slope_estimator": "Theil-Sen (actual year deltas)",
            "slope_ci": "Gilbert (1987) rank bounds at 95% using Var*(S)",
            "trend_test": "Mann-Kendall with Hamed-Rao (1998) multi-lag rank autocorrelation correction",
            "kendall_variance": "Tied-rank correction included",
            "autocorrelation_basis": "Ranks of detrended residuals; consecutive calendar-year pairs for lag estimation",
            "significance_level": 0.05,
            "multiple_testing": "Holm-Bonferroni over 6 tests (3 zones × 2 indicators)",
        },
        "minimum_seasons": _MIN_SEASONS,
        "minimum_seasons_basis": "Predeclared project threshold; not a WMO guideline",
        "data_completeness_policy": (
            "A season is complete when all 61 Apr-May days are present (no duplicates) "
            "and each day has ≥95% valid cells. Incomplete seasons are retained in "
            "annual_series with season_complete=false."
        ),
        "limitations": (
            "Area-weighted zone indicators do not establish causality or predict "
            "individual floods. Spatial dependence across zones and multiple-area "
            "inference require explicit extension. Source authenticity depends on "
            "the retrieval record and reviewable provenance; SHA-256 verifies "
            "file integrity only."
        ),
        "zones": zone_results,
    }

    output = _sanitize_floats(output)
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    return output


# ---------------------------------------------------------------------------
# Legacy single-zone compatibility shims (Module 1 callers)
# ---------------------------------------------------------------------------

def _require_real_dataset(ds: xr.Dataset) -> None:
    """Backward-compatibility shim used by Module 1 tests."""
    validate_dataset_provenance(ds)


def seasonal_cell_indicators(
    ds: xr.Dataset,
    start_year: int = _START_YEAR,
    end_year: int = _END_YEAR,
) -> xr.Dataset:
    """Backward-compatibility shim for Module 1 test suite.

    Computes cell-first Apr-May PRCPTOT and R50mm across the full spatial
    extent of ds (no zone partitioning). Complete-season policy: exactly 61
    dates, every cell non-NaN.

    Returns an xr.Dataset with dimensions (year, lat, lon).
    """
    validate_dataset_provenance(ds)
    precip = ds["precipitation"]
    time = pd.DatetimeIndex(pd.to_datetime(precip["time"].values))
    time = time.tz_localize(None) if time.tz is not None else time
    expected_days = 61
    per_year = []
    missing_years = []

    for year in range(start_year, end_year + 1):
        mask = np.array(
            [t.year == year and t.month in (4, 5) for t in time]
        )
        indices = np.flatnonzero(mask)
        season = precip.isel(time=indices)
        if season.sizes.get("time", 0) != expected_days or bool(season.isnull().any()):
            missing_years.append(year)
            continue
        total = season.sum("time", skipna=False).expand_dims(year=[year])
        r50 = (season >= 50.0).sum("time").expand_dims(year=[year])
        per_year.append(xr.Dataset({"prcptot_am_mm": total, "r50mm_am_days": r50}))

    if not per_year:
        raise TrendInputError(
            "No complete Apr-May seasons are available for trend analysis."
        )
    result = xr.concat(per_year, dim="year")
    result.attrs.update({
        "provenance": "REAL",
        "missing_years": json.dumps(missing_years),
        "completeness_policy": "61 of 61 April-May daily values required per cell/season",
        "processing_history": "cell-first seasonal indices from verified IMERG Final daily precipitation",
    })
    return result


def modified_mann_kendall(values: np.ndarray) -> tuple[float, float]:
    """Backward-compatibility shim for Module 1 test suite.

    Returns (tau, p_value) using the full pipeline.
    """
    x = np.asarray(values, dtype=float)
    x = x[np.isfinite(x)]
    n = len(x)
    if n < _MIN_SEASONS_FOR_MK:
        return float("nan"), float("nan")
    years_arr = np.arange(n, dtype=float)
    s, var_s = compute_kendall_s_and_var(x)
    beta, _, _, _ = compute_theil_sen_slope(years_arr, x)
    var_star, _cf, r1 = compute_hamed_rao_correction(years_arr, x, beta, var_s)
    tau, p_raw, _z, _test, _verdict = run_mann_kendall(s, var_star, r1, n, cf=_cf)
    return tau, p_raw


def analyze_area_mean(indices: xr.Dataset, variable: str) -> Any:
    """Backward-compatibility shim for Module 1 tests.

    Returns a TrendResult-like object with the same fields as the original.
    """
    if variable not in indices:
        raise TrendInputError(f"Indicator not present: {variable}")
    spatial_dims = [d for d in indices[variable].dims if d != "year"]
    series = indices[variable].mean(spatial_dims, skipna=False).values.astype(float)
    years = indices["year"].values.astype(float)
    valid = np.isfinite(series)
    missing = [int(y) for y in years[~valid]]
    n = int(valid.sum())

    class _Compat:
        pass

    result = _Compat()
    result.indicator = variable
    result.n_seasons = n
    result.missing_years = missing

    if n < _MIN_SEASONS_FOR_MK:
        result.slope_per_year = None
        result.slope_ci_low = None
        result.slope_ci_high = None
        result.mk_tau = None
        result.mk_p_value = None
        result.significant_at_005 = None
        return result

    years_valid = years[valid]
    series_valid = series[valid]
    beta, _, _, slopes_sorted = compute_theil_sen_slope(years_valid, series_valid)
    s, var_s = compute_kendall_s_and_var(series_valid)
    var_star, _cf, r1 = compute_hamed_rao_correction(years_valid, series_valid, beta, var_s)
    ci_low, ci_high = compute_sens_kendall_ci(slopes_sorted, var_star)
    tau, p_raw, _z, _test, _verdict = run_mann_kendall(s, var_star, r1, n, cf=_cf)

    result.slope_per_year = float(beta)
    result.slope_ci_low = float(ci_low) if math.isfinite(ci_low) else None
    result.slope_ci_high = float(ci_high) if math.isfinite(ci_high) else None
    result.mk_tau = float(tau)
    result.mk_p_value = float(p_raw)
    result.significant_at_005 = bool(p_raw < 0.05)
    result.as_dict = lambda: {
        "indicator": result.indicator,
        "n_seasons": result.n_seasons,
        "slope_per_year": result.slope_per_year,
        "slope_ci_low": result.slope_ci_low,
        "slope_ci_high": result.slope_ci_high,
        "mk_tau": result.mk_tau,
        "mk_p_value": result.mk_p_value,
        "significant_at_005": result.significant_at_005,
        "missing_years": result.missing_years,
    }
    return result


def export_analysis(indices: xr.Dataset, output_path: str | Path) -> dict[str, Any]:
    """Backward-compatibility shim for Module 1 run script."""
    results = [
        analyze_area_mean(indices, name).as_dict()
        for name in ("prcptot_am_mm", "r50mm_am_days")
    ]
    output = {
        "provenance": "REAL",
        "analysis_type": "historical_trend_analysis",
        "method": (
            "cell-first complete-season indices; Theil-Sen slope; "
            "modified Mann-Kendall variance correction"
        ),
        "results": results,
        "limitations": (
            "Area mean does not establish causality or predict individual floods; "
            "spatial dependence and multiple-area inference require explicit extension."
        ),
    }
    output = _sanitize_floats(output)
    Path(output_path).write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    return output
