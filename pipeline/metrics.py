"""
HydroSense-SWOT — Scientific Performance Evaluation & Validation Metrics Module
Upgraded for Prompt 5: P5-SCIENTIFIC-VALIDATION

Implements rigorous scientific validation comparing model output and baseline
predictions against real BWDB gauge observations during the April-May 2026 test period.

Key Principles Enforced:
- Test-Period Discipline: Metrics evaluated on the test period ONLY (Apr 1 - May 31, 2026).
- 15-Minute Tolerance Alignment: Nearest-timestamp matching within 15-minute tolerance.
- Precision Discipline (Category C2): Round all displayed metrics to 2 decimal places max
  (NSE/KGE to 2dp, PBIAS to 1dp, timing and lead to 1dp).
- Graceful Degradation: If NSE < 0, records and reports the value honestly without stopping.
- Baseline Benchmark: Computes metrics for both HydroSense and Rainfall-Only Baseline.
"""

import logging
from typing import Dict, Any, Optional, Tuple
import numpy as np
import pandas as pd

logger = logging.getLogger("metrics")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Test Period Boundaries (Prompt 5 requirement)
TEST_PERIOD_START = "2026-04-01T00:00:00Z"
TEST_PERIOD_END = "2026-05-31T23:59:59Z"
KANAIGHAT_DANGER_LEVEL_M = 13.20


def align_sim_obs(
    df_sim: pd.DataFrame,
    df_obs: pd.DataFrame,
    tolerance: str = "15min",
    test_period_only: bool = True,
    start_date: str = TEST_PERIOD_START,
    end_date: str = TEST_PERIOD_END,
    sim_col: str = "modelled_stage",
    obs_col: str = "water_level_m",
) -> pd.DataFrame:
    """
    Aligns simulated and observed time series using nearest-timestamp matching
    within the specified tolerance window (Prompt 5 requirement).

    Parameters:
        df_sim: DataFrame with 'timestamp' and sim_col.
        df_obs: DataFrame with 'timestamp' and obs_col.
        tolerance: Matching tolerance (default '15min').
        test_period_only: If True, filters strictly to [start_date, end_date].
        start_date: Test period start ISO timestamp.
        end_date: Test period end ISO timestamp.
        sim_col: Name of simulated water level column.
        obs_col: Name of observed water level column.

    Returns:
        pd.DataFrame containing aligned timestamps, sim, and obs.
    """
    s_df = df_sim.copy()
    o_df = df_obs.copy()

    s_df["timestamp"] = pd.to_datetime(s_df["timestamp"], utc=True).astype("datetime64[ns, UTC]")
    o_df["timestamp"] = pd.to_datetime(o_df["timestamp"], utc=True).astype("datetime64[ns, UTC]")

    s_df = s_df.sort_values("timestamp").reset_index(drop=True)
    o_df = o_df.sort_values("timestamp").reset_index(drop=True)

    # Filter to test period only
    if test_period_only:
        t_start = pd.to_datetime(start_date, utc=True)
        t_end = pd.to_datetime(end_date, utc=True)
        s_df = s_df[(s_df["timestamp"] >= t_start) & (s_df["timestamp"] <= t_end)]
        o_df = o_df[(o_df["timestamp"] >= t_start) & (o_df["timestamp"] <= t_end)]

    # Use merge_asof with nearest direction and tolerance
    # Match observation points to nearest simulation points
    aligned = pd.merge_asof(
        o_df[["timestamp", obs_col]],
        s_df[["timestamp", sim_col]],
        on="timestamp",
        tolerance=pd.Timedelta(tolerance),
        direction="nearest",
    )

    # Drop unaligned or NaN entries
    aligned = aligned.dropna(subset=[obs_col, sim_col]).reset_index(drop=True)
    return aligned


def compute_nse(sim: np.ndarray, obs: np.ndarray) -> float:
    """
    Computes Nash-Sutcliffe Efficiency (NSE):
    NSE = 1 - [ sum((sim - obs)^2) / sum((obs - mean(obs))^2) ]
    Gracefully handles negative values without raising exceptions.
    """
    s = np.asarray(sim, dtype=np.float64)
    o = np.asarray(obs, dtype=np.float64)
    valid = (~np.isnan(s)) & (~np.isnan(o))
    s, o = s[valid], o[valid]

    if len(o) < 2:
        return float("nan")

    denom = np.sum((o - np.mean(o)) ** 2)
    if denom == 0:
        return float("nan")

    numer = np.sum((o - s) ** 2)
    nse = 1.0 - (numer / denom)
    return float(nse)


def compute_kge(sim: np.ndarray, obs: np.ndarray) -> float:
    """
    Computes Kling-Gupta Efficiency (KGE; Gupta et al. 2009):
    KGE = 1 - sqrt((r - 1)^2 + (alpha - 1)^2 + (beta - 1)^2)
    where:
      r = Pearson correlation coefficient
      alpha = std(sim) / std(obs) (variability ratio)
      beta = mean(sim) / mean(obs) (bias ratio)
    """
    s = np.asarray(sim, dtype=np.float64)
    o = np.asarray(obs, dtype=np.float64)
    valid = (~np.isnan(s)) & (~np.isnan(o))
    s, o = s[valid], o[valid]

    if len(o) < 2:
        return float("nan")

    std_s = float(np.std(s))
    std_o = float(np.std(o))
    mean_s = float(np.mean(s))
    mean_o = float(np.mean(o))

    if std_s == 0 or std_o == 0 or mean_o == 0:
        return float("nan")

    r = float(np.corrcoef(s, o)[0, 1])
    alpha = std_s / std_o
    beta = mean_s / mean_o

    kge = 1.0 - np.sqrt((r - 1.0) ** 2 + (alpha - 1.0) ** 2 + (beta - 1.0) ** 2)
    return float(kge)


def compute_pbias(sim: np.ndarray, obs: np.ndarray) -> float:
    """
    Computes Percent Bias (PBIAS %):
    PBIAS = [ sum(sim - obs) / sum(obs) ] * 100
    """
    s = np.asarray(sim, dtype=np.float64)
    o = np.asarray(obs, dtype=np.float64)
    valid = (~np.isnan(s)) & (~np.isnan(o))
    s, o = s[valid], o[valid]

    sum_o = np.sum(o)
    if sum_o == 0 or len(o) == 0:
        return float("nan")

    pbias = (np.sum(s - o) / sum_o) * 100.0
    return float(pbias)


def compute_peak_timing_error(
    df_sim: pd.DataFrame,
    df_obs: pd.DataFrame,
    sim_col: str = "modelled_stage",
    obs_col: str = "water_level_m",
) -> Tuple[float, str, str]:
    """
    Computes timing error in hours between simulated peak and observed peak:
    error_h = (t_sim_peak - t_obs_peak) in hours.
    Negative error indicates simulated peak arrived earlier than observation.
    """
    idx_sim_peak = df_sim[sim_col].idxmax()
    idx_obs_peak = df_obs[obs_col].idxmax()

    t_sim_peak = df_sim.loc[idx_sim_peak, "timestamp"]
    t_obs_peak = df_obs.loc[idx_obs_peak, "timestamp"]

    dt_sim = pd.to_datetime(t_sim_peak, utc=True)
    dt_obs = pd.to_datetime(t_obs_peak, utc=True)

    diff_h = (dt_sim - dt_obs).total_seconds() / 3600.0
    return float(diff_h), str(t_sim_peak), str(t_obs_peak)


def compute_warning_lead_time(
    df_flags: pd.DataFrame,
    df_obs: pd.DataFrame,
    danger_level_m: float = KANAIGHAT_DANGER_LEVEL_M,
    flag_col: str = "harvest_flag",
    obs_col: str = "water_level_m",
) -> float:
    """
    Computes advance warning lead time in hours:
    Time from the FIRST RED warning flag to the moment observed gauge crosses danger level.
    """
    red_rows = df_flags[df_flags[flag_col] == "RED"]
    if red_rows.empty:
        return 0.0

    t_first_red = pd.to_datetime(red_rows.iloc[0]["timestamp"], utc=True)

    obs_exceed = df_obs[df_obs[obs_col] >= danger_level_m]
    if obs_exceed.empty:
        return 0.0

    t_obs_danger = pd.to_datetime(obs_exceed.iloc[0]["timestamp"], utc=True)
    lead_time_h = (t_obs_danger - t_first_red).total_seconds() / 3600.0
    return float(max(lead_time_h, 0.0))


def compute_baseline_stage_proxy(
    df_baseline: pd.DataFrame,
    base_level: float = 7.74,
    scale_factor: float = 0.045,
) -> pd.Series:
    """
    Computes a rainfall-accumulation stage proxy for baseline metric benchmarking:
    baseline_stage(t) = base_level + baseline_rain_6h * scale_factor
    Represents what a naive hydrologist without river routing would estimate from rainfall.
    """
    if "baseline_rain_6h" in df_baseline.columns:
        rain_6h = df_baseline["baseline_rain_6h"]
    elif "imerg_map_mmh" in df_baseline.columns:
        rain_6h = df_baseline["imerg_map_mmh"] * 3.0
    else:
        rain_6h = pd.Series(0.0, index=df_baseline.index)
    return base_level + rain_6h * scale_factor


def evaluate_all_metrics(
    df_sim: pd.DataFrame,
    df_obs: pd.DataFrame,
    danger_level_m: float = KANAIGHAT_DANGER_LEVEL_M,
    test_period_only: bool = True,
    start_date: str = TEST_PERIOD_START,
    end_date: str = TEST_PERIOD_END,
    sim_col: str = "modelled_stage",
    obs_col: str = "water_level_m",
    flag_col: str = "harvest_flag",
    operational_forecast: bool = False,
) -> Dict[str, Any]:
    """
    Evaluates the full 5-metric scientific suite on the test period using
    15-minute tolerance alignment.

    Enforces 2-decimal-place maximum display formatting (Category C2).
    """
    # 1. 15-minute tolerance alignment
    aligned = align_sim_obs(
        df_sim=df_sim,
        df_obs=df_obs,
        tolerance="15min",
        test_period_only=test_period_only,
        start_date=start_date,
        end_date=end_date,
        sim_col=sim_col,
        obs_col=obs_col,
    )

    sim_vals = aligned[sim_col].values
    obs_vals = aligned[obs_col].values

    # 2. Compute 5 primary metrics
    nse = compute_nse(sim_vals, obs_vals)
    kge = compute_kge(sim_vals, obs_vals)
    pbias = compute_pbias(sim_vals, obs_vals)

    # 3. Peak timing error on test period
    s_period = df_sim.copy()
    s_period["timestamp"] = pd.to_datetime(s_period["timestamp"], utc=True)
    o_period = df_obs.copy()
    o_period["timestamp"] = pd.to_datetime(o_period["timestamp"], utc=True)

    if test_period_only:
        t_s = pd.to_datetime(start_date, utc=True)
        t_e = pd.to_datetime(end_date, utc=True)
        s_period = s_period[(s_period["timestamp"] >= t_s) & (s_period["timestamp"] <= t_e)]
        o_period = o_period[(o_period["timestamp"] >= t_s) & (o_period["timestamp"] <= t_e)]

    dte, t_sim_p, t_obs_p = compute_peak_timing_error(
        s_period, o_period, sim_col=sim_col, obs_col=obs_col
    )

    # Warning lead time is meaningful only for issue-time forecast products.
    # A reconstructed historical series cannot establish operational lead time.
    lead_h = compute_warning_lead_time(df_flags=s_period, df_obs=o_period, danger_level_m=danger_level_m,
                                       flag_col=flag_col, obs_col=obs_col) if operational_forecast else None

    return {
        "nse": float(nse) if not np.isnan(nse) else None,
        "kge": float(kge) if not np.isnan(kge) else None,
        "pbias": float(pbias) if not np.isnan(pbias) else None,
        "timing_error_h": float(dte),
        "lead_time_h": float(lead_h) if lead_h is not None else None,
        "warning_lead_status": "operational forecast required" if lead_h is None else "computed from issue-time alerts",
        "t_sim_peak": t_sim_p,
        "t_obs_peak": t_obs_p,
        "n_aligned_samples": len(aligned),
        "test_period": {
            "start": start_date,
            "end": end_date,
        },
        "formatted": {
            "nse": f"{nse:.2f}" if not np.isnan(nse) else "N/A",
            "kge": f"{kge:.2f}" if not np.isnan(kge) else "N/A",
            "pbias": f"{pbias:+.1f}%" if not np.isnan(pbias) else "N/A",
            "timing_error": f"{dte:+.1f} h",
            "lead_time": f"{lead_h:.1f} h" if lead_h is not None else "N/A",
        },
    }


def compare_model_vs_baseline(
    df_sim: pd.DataFrame,
    df_baseline: pd.DataFrame,
    df_obs: pd.DataFrame,
    danger_level_m: float = KANAIGHAT_DANGER_LEVEL_M,
    test_period_only: bool = True,
) -> Dict[str, Any]:
    """
    Computes a side-by-side comparison between HydroSense (SWOT-calibrated routing)
    and Rainfall-Only Baseline across all 5 scientific metrics.

    Highlights what SWOT adds over baseline:
    - Superior hydrograph timing (accounts for hydrodynamic travel time lag)
    - Hydraulic attenuation of peak rates
    - Reliable warning lead time without false flood alerts
    """
    # 1. HydroSense metrics
    m_hydrosense = evaluate_all_metrics(
        df_sim=df_sim,
        df_obs=df_obs,
        danger_level_m=danger_level_m,
        test_period_only=test_period_only,
        sim_col="modelled_stage",
        flag_col="harvest_flag",
    )

    # 2. Baseline metrics
    df_base_eval = df_baseline.copy()
    if "baseline_stage" not in df_base_eval.columns:
        df_base_eval["baseline_stage"] = compute_baseline_stage_proxy(df_base_eval)

    m_baseline = evaluate_all_metrics(
        df_sim=df_base_eval,
        df_obs=df_obs,
        danger_level_m=danger_level_m,
        test_period_only=test_period_only,
        sim_col="baseline_stage",
        flag_col="baseline_flag" if "baseline_flag" in df_base_eval.columns else "harvest_flag",
    )

    # 3. Comparative delta
    nse_model = m_hydrosense["nse"] or 0.0
    nse_base = m_baseline["nse"] or 0.0
    nse_gain = nse_model - nse_base

    timing_gain_h = abs(m_baseline["timing_error_h"]) - abs(m_hydrosense["timing_error_h"])
    lead_gain_h = None

    return {
        "hydrosense": m_hydrosense,
        "baseline": m_baseline,
        "comparison": {
            "nse_gain": round(nse_gain, 2),
            "timing_accuracy_gain_h": round(timing_gain_h, 1),
            "lead_time_delta_h": round(lead_gain_h, 1) if lead_gain_h is not None else None,
            "model_beats_baseline_nse": bool(nse_model > nse_base),
            "swot_value_add": (
                "SWOT channel calibration routes flash-flood surges through physical channel geometry, "
                f"reducing retrospective peak timing error by {timing_gain_h:+.1f}h in this synthetic engineering scenario; "
                "this is not independent or operational forecast validation."
            ),
        },
    }
