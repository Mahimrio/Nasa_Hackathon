"""
Scientific Performance Evaluation Metrics for HydroSense-SWOT.
Follows SOLUTION_ARCHITECTURE.md v3.0 Section 3.5:
- NSE (Nash-Sutcliffe Efficiency): 2 decimal places (f"{nse:.2f}")
- KGE (Kling-Gupta Efficiency): 2 decimal places (f"{kge:.2f}")
- PBIAS (Percent Bias): 1 decimal place with sign (f"{pbias:+.1f}%")
- Peak timing error (hours): f"{dte:+.1f} h"
- Lead time: f"{lead:.1f} h"
- Mandatory rule: No over-precision (never display more than 2 decimal places).
"""

import numpy as np
import pandas as pd

def compute_nse(sim, obs):
    """Computes Nash-Sutcliffe Efficiency (NSE)."""
    sim = np.asarray(sim)
    obs = np.asarray(obs)
    valid = (~np.isnan(sim)) & (~np.isnan(obs))
    s, o = sim[valid], obs[valid]
    if len(o) < 2:
        return np.nan
    denom = np.sum((o - np.mean(o)) ** 2)
    if denom == 0:
        return np.nan
    numer = np.sum((o - s) ** 2)
    return 1.0 - (numer / denom)


def compute_kge(sim, obs):
    """Computes Kling-Gupta Efficiency (KGE, Gupta et al. 2009)."""
    sim = np.asarray(sim)
    obs = np.asarray(obs)
    valid = (~np.isnan(sim)) & (~np.isnan(obs))
    s, o = sim[valid], obs[valid]
    if len(o) < 2:
        return np.nan
    std_s = np.std(s)
    std_o = np.std(o)
    mean_s = np.mean(s)
    mean_o = np.mean(o)
    if std_s == 0 or std_o == 0 or mean_o == 0:
        return np.nan

    r = np.corrcoef(s, o)[0, 1]
    alpha = std_s / std_o
    beta = mean_s / mean_o
    kge = 1.0 - np.sqrt((r - 1.0) ** 2 + (alpha - 1.0) ** 2 + (beta - 1.0) ** 2)
    return kge


def compute_pbias(sim, obs):
    """Computes Percent Bias (PBIAS %)."""
    sim = np.asarray(sim)
    obs = np.asarray(obs)
    valid = (~np.isnan(sim)) & (~np.isnan(obs))
    s, o = sim[valid], obs[valid]
    sum_o = np.sum(o)
    if sum_o == 0:
        return np.nan
    return (np.sum(s - o) / sum_o) * 100.0


def compute_peak_timing_error(df_sim, df_obs, sim_col="modelled_stage", obs_col="water_level_m"):
    """Computes timing error in hours between simulated peak and observed peak."""
    t_sim_peak = df_sim.loc[df_sim[sim_col].idxmax(), "timestamp"]
    t_obs_peak = df_obs.loc[df_obs[obs_col].idxmax(), "timestamp"]
    diff_h = (pd.to_datetime(t_sim_peak) - pd.to_datetime(t_obs_peak)).total_seconds() / 3600.0
    return diff_h, t_sim_peak, t_obs_peak


def compute_warning_lead_time(df_flags, df_obs, danger_level_m=13.20):
    """
    Computes advance lead time (hours):
    Time between first RED warning flag and the moment observed gauge crosses danger level.
    """
    # First RED flag
    red_flags = df_flags[df_flags["harvest_flag"] == "RED"]
    if red_flags.empty:
        return 0.0

    t_first_red = pd.to_datetime(red_flags.iloc[0]["timestamp"])

    # First observed crossing of danger level
    obs_exceed = df_obs[df_obs["water_level_m"] >= danger_level_m]
    if obs_exceed.empty:
        return 0.0

    t_obs_danger = pd.to_datetime(obs_exceed.iloc[0]["timestamp"])
    lead_time_h = (t_obs_danger - t_first_red).total_seconds() / 3600.0
    return max(lead_time_h, 0.0)


def evaluate_all_metrics(df_sim, df_obs, danger_level_m=13.20):
    """
    Aligns simulation and observation on common hourly timestamps and evaluates full metric suite.
    """
    # Resample or align to hourly timestamps using numeric column only
    sim_hourly = df_sim[["timestamp", "modelled_stage"]].set_index("timestamp").resample("1h").mean().reset_index()
    merged = pd.merge(sim_hourly, df_obs[["timestamp", "water_level_m"]], on="timestamp", how="inner")

    sim_vals = merged["modelled_stage"].values
    obs_vals = merged["water_level_m"].values

    nse = compute_nse(sim_vals, obs_vals)
    kge = compute_kge(sim_vals, obs_vals)
    pbias = compute_pbias(sim_vals, obs_vals)
    dte, t_sim_p, t_obs_p = compute_peak_timing_error(df_sim, df_obs)
    lead_h = compute_warning_lead_time(df_sim, df_obs, danger_level_m)

    return {
        "nse": nse,
        "kge": kge,
        "pbias": pbias,
        "timing_error_h": dte,
        "lead_time_h": lead_h,
        "t_sim_peak": t_sim_p,
        "t_obs_peak": t_obs_p,
        "formatted": {
            "nse": f"{nse:.2f}",
            "kge": f"{kge:.2f}",
            "pbias": f"{pbias:+.1f}%",
            "timing_error": f"{dte:+.1f} h",
            "lead_time": f"{lead_h:.1f} h",
        }
    }
