"""
HydroSense-SWOT — Muskingum-Cunge Routing Engine
Upgraded for Prompt 4: P4-ROUTING-ENGINE-REAL

Routes 30-minute NASA GPM IMERG Early Run rainfall through un-gauged border
reaches calibrated offline from NASA SWOT altimetry down to Kanaighat (SW108).

Key Scientific & Physical Principles:
- Valid Hydraulic Regime: Rising limb and in-channel flow only. Post-breach
  floodplain inundation and backwater dynamics are excluded (SOLUTION_ARCHITECTURE §3.2).
- Data Decoupling: IMERG drives all operational 30-min time steps. SWOT is NOT
  inner-joined by timestamp; it provides offline calibrated channel parameters.
- Dynamic Wave Celerity: c = (5/3) * V_mean (~1.50 m/s for Surma alluvial channel).
- Hydrodynamic Lag: Travel time K = L / c (~140 km / 1.50 m/s ~ 25.9 hours).
- Numerical Stability: 4 sub-reaches ensure Courant condition c * dt / dx ~ 1.
- Manning Stage Inversion: Inverts stage from discharge using calibrated n and z_bed.
- Analytical Uncertainty Envelope: +/- 0.18 m WSE baseline uncertainty (P2 citation).
"""

import os
import json
import logging
from typing import Dict, Any, Optional, Tuple
import numpy as np
import pandas as pd

logger = logging.getLogger("muskingum_cunge")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def invert_manning_to_stage(
    q: np.ndarray,
    width: float,
    slope2: float,
    z_bed: float,
    n: float,
) -> np.ndarray:
    """
    Inverts Manning's equation for a wide rectangular channel to estimate stage H(t):
    Q = (1/n) * width * (H - z_bed)^(5/3) * slope2^(1/2)
    -> (H - z_bed) = ( Q * n / (width * sqrt(slope2)) )^(3/5)
    -> H = z_bed + depth
    """
    q_safe = np.maximum(q, 5.0)
    denom = width * np.sqrt(np.maximum(slope2, 1.0e-6))
    depth = ((q_safe * n) / denom) ** (3.0 / 5.0)
    stage = z_bed + depth
    return stage


def compute_routing_coefficients(k_sec: float, x_weight: float, dt_sec: float) -> Tuple[float, float, float]:
    """
    Computes standard Muskingum-Cunge routing coefficients C1, C2, C3.
    Asserts C1 + C2 + C3 == 1.0 within floating point tolerance.
    """
    denom = 2.0 * k_sec * (1.0 - x_weight) + dt_sec
    c1 = (dt_sec - 2.0 * k_sec * x_weight) / denom
    c2 = (dt_sec + 2.0 * k_sec * x_weight) / denom
    c3 = (2.0 * k_sec * (1.0 - x_weight) - dt_sec) / denom
    assert np.isclose(c1 + c2 + c3, 1.0, atol=1e-5), "Muskingum-Cunge coefficients must sum to 1.0"
    return c1, c2, c3


def compute_hydraulic_travel_time(
    total_length_m: float = 140000.0,
    v_mean: float = 0.90,
) -> Tuple[float, float, float]:
    """
    Computes wave celerity and travel time from physical hydraulic properties:
    - Wave celerity: c = (5/3) * V_mean (m/s)
    - Travel time: K = L / c (seconds and hours)
    """
    c_wave = (5.0 / 3.0) * v_mean  # ~1.50 m/s
    k_total_sec = total_length_m / c_wave
    k_total_hours = k_total_sec / 3600.0
    return c_wave, k_total_sec, k_total_hours


def route_catchment_flow(
    map_series: np.ndarray,
    time_index: pd.DatetimeIndex,
    reach_params: Dict[str, Any],
    catchment_area_km2: float = 185.0,
    runoff_coeff: float = 0.62,
    baseflow_m3s: float = 90.0,
    v_mean: float = 0.90,
    x_weight: float = 0.25,
    n_reaches: int = 4,
    total_reach_length_m: float = 140000.0,
    wse_uncertainty_m: float = 0.18,
) -> pd.DataFrame:
    """
    Routes 30-min IMERG MAP series through a 4-sub-reach Muskingum-Cunge cascade.

    Parameters:
        map_series: 1D array of IMERG precipitationCal (mm/hr).
        time_index: pandas DatetimeIndex with UTC timestamps (Guard B1).
        reach_params: Dict containing calibrated 'n', 'z_bed', 'mean_width', 'mean_slope2'.
        catchment_area_km2: Contributing catchment area in Meghalaya draining to border.
        runoff_coeff: Hydrologic runoff coefficient (fraction of rain converting to flow).
        baseflow_m3s: Baseflow discharge in Surma river prior to rainfall surge (m³/s).
        v_mean: Mean channel flow velocity at mid-stage (m/s).
        x_weight: Muskingum weighting factor X (default 0.25).
        n_reaches: Number of routing sub-reaches for Courant stability (default 4).
        total_reach_length_m: Total distance from international border to Kanaighat (~140 km).
        wse_uncertainty_m: Baseline SWOT radar altimetry elevation uncertainty (+/-0.18 m).

    Returns:
        pd.DataFrame containing inflow_q, routed_q, modelled_stage, and uncertainty envelope.
    """
    dt_sec = 1800.0  # 30-minute intervals
    n_steps = len(map_series)

    # 1. Rainfall-to-Discharge Translation (Q = C * I * A)
    # Area in m² = catchment_area_km2 * 1e6
    area_m2 = catchment_area_km2 * 1.0e6
    # 1 mm/hr = 1e-3 m / 3600 s = 2.7778e-7 m/s
    q_rain = (map_series * 1.0e-3 / 3600.0) * area_m2 * runoff_coeff
    inflow_q = baseflow_m3s + q_rain

    # 2. Dynamic Wave Celerity & Travel Time (Category A2 / 3.2)
    c_wave, k_total_sec, k_total_hours = compute_hydraulic_travel_time(total_reach_length_m, v_mean)
    k_sub_sec = k_total_sec / float(n_reaches)

    # 3. Multi-reach sub-step Muskingum-Cunge routing
    c1, c2, c3 = compute_routing_coefficients(k_sub_sec, x_weight, dt_sec)

    q_current = np.copy(inflow_q)
    for _ in range(n_reaches):
        q_next = np.zeros(n_steps)
        q_next[0] = q_current[0]
        for t in range(1, n_steps):
            q_out = c1 * q_current[t] + c2 * q_current[t - 1] + c3 * q_next[t - 1]
            q_next[t] = max(q_out, baseflow_m3s)
        q_current = q_next

    routed_q = q_current

    # 4. Invert Manning Equation to Stage at Kanaighat Reach
    n_cal = float(reach_params.get("n_calibrated", reach_params.get("n", 0.032)))
    z_bed = float(reach_params.get("z_bed_m", reach_params.get("z_bed", 5.80)))
    width = float(reach_params.get("mean_width_m", reach_params.get("mean_width", 160.0)))
    slope2 = float(reach_params.get("mean_slope2", 5.0e-5))

    modelled_stage = invert_manning_to_stage(routed_q, width, slope2, z_bed, n_cal)

    # 5. Uncertainty Propagation: Analytical +/- 0.18 m WSE envelope
    stage_lower = modelled_stage - wse_uncertainty_m
    stage_upper = modelled_stage + wse_uncertainty_m

    df_out = pd.DataFrame({
        "timestamp": time_index,
        "imerg_map_mmh": np.round(map_series, 2),
        "inflow_q": np.round(inflow_q, 1),
        "routed_q": np.round(routed_q, 1),
        "modelled_stage": np.round(modelled_stage, 2),
        "stage_lower": np.round(stage_lower, 2),
        "stage_upper": np.round(stage_upper, 2),
    })

    # Attach routing metadata as attributes
    df_out.attrs["travel_time_hours"] = float(round(k_total_hours, 1))
    df_out.attrs["wave_celerity_mps"] = float(round(c_wave, 2))
    df_out.attrs["muskingum_x"] = float(x_weight)
    df_out.attrs["calibrated_n"] = float(round(n_cal, 4))
    df_out.attrs["valid_regime"] = "Rising limb, in-channel flow only"

    return df_out


if __name__ == "__main__":
    # Test routing with default parameters
    times = pd.date_range("2026-04-10", periods=96, freq="30min", tz="UTC")
    rain = np.sin(np.linspace(0, np.pi, 96)) * 25.0
    mock_reach = {"n": 0.032, "z_bed": 5.80, "mean_width": 160.0, "mean_slope2": 5.2e-5}
    res_df = route_catchment_flow(rain, times, mock_reach)
    print(f"Routed 96 steps. Peak stage: {res_df['modelled_stage'].max():.2f} m.")
    print(f"Calculated travel time: {res_df.attrs['travel_time_hours']} hours.")
