"""
Muskingum-Cunge Routing Module for HydroSense-SWOT.
Follows SOLUTION_ARCHITECTURE.md v3.0:
- Valid regime: rising limb, in-channel flow
- Travel time: ~140 km / ~1.5 m/s celerity = ~26 hours lead time
- Routes IMERG MAP-derived upstream discharge through SWOT-calibrated reaches
- Converts routed discharge to water level via Manning inverse
- Computes +/- 0.18 m WSE uncertainty band
"""

import numpy as np
import pandas as pd

def invert_manning_to_stage(q, width, slope2, z_bed, n):
    """
    Inverts Manning's equation for a wide rectangular channel to estimate stage H(t):
    Q = (1/n) * width * (H - z_bed)^(5/3) * slope2^(1/2)
    -> (H - z_bed) = ( Q * n / (width * sqrt(slope2)) )^(3/5)
    -> H = z_bed + depth
    """
    q_safe = np.maximum(q, 10.0)
    denom = width * np.sqrt(np.maximum(slope2, 1.0e-6))
    depth = ( (q_safe * n) / denom ) ** (3.0 / 5.0)
    stage = z_bed + depth
    return stage


def compute_routing_coefficients(k_sec, x_weight, dt_sec):
    """
    Computes standard Muskingum-Cunge routing coefficients C1, C2, C3.
    """
    denom = 2.0 * k_sec * (1.0 - x_weight) + dt_sec
    c1 = (dt_sec - 2.0 * k_sec * x_weight) / denom
    c2 = (dt_sec + 2.0 * k_sec * x_weight) / denom
    c3 = (2.0 * k_sec * (1.0 - x_weight) - dt_sec) / denom
    return c1, c2, c3


def route_catchment_flow(map_series, time_index, reach_params,
                         catchment_area_km2=2400.0, runoff_coeff=0.62, baseflow_m3s=90.0):
    """
    Routes 30-min IMERG MAP through the Upper Surma reach corridor down to Kanaighat.
    
    Parameters:
    - map_series: 1D array of IMERG precipitationCal (mm/hr)
    - time_index: pandas DatetimeIndex (UTC)
    - reach_params: dict containing calibrated 'n', 'z_bed', 'mean_width', 'mean_slope2'
    - catchment_area_km2: upstream catchment area in Meghalaya draining to border (km2)
    - runoff_coeff: hydrologic runoff coefficient
    - baseflow_m3s: dry/pre-event baseflow in Surma river (m3/s)

    Returns:
    - DataFrame with columns: [timestamp, inflow_q, routed_q, modelled_stage, stage_lower, stage_upper]
    """
    dt_sec = 1800.0  # 30-minute intervals
    n_steps = len(map_series)

    # 1. Translate IMERG MAP (mm/hr) to Inflow Hydrograph (m3/s)
    # Area in m2 = catchment_area_km2 * 1e6
    area_m2 = catchment_area_km2 * 1.0e6
    # 1 mm/hr = 1e-3 m / 3600 s = 2.7778e-7 m/s
    q_rain = (map_series * 1.0e-3 / 3600.0) * area_m2 * runoff_coeff
    inflow_q = baseflow_m3s + q_rain

    # 2. Hydraulic geometry and celerity calculation
    # In low-gradient alluvial channel, mean velocity V_mean ~ 0.90 m/s
    v_mean = 0.90  # m/s
    c_wave = (5.0 / 3.0) * v_mean  # wave celerity ~ 1.50 m/s (SOLUTION_ARCHITECTURE.md 3.2)
    total_reach_length_m = 140000.0  # ~140 km from headwater to Kanaighat
    k_total_sec = total_reach_length_m / c_wave  # ~93,333 sec (~25.9 hours hydrodynamic lag)
    x_weight = 0.25

    # 3. Multi-reach sub-step routing
    # Divide 140 km into 4 routing reaches to maintain numerical stability (Courant condition: c*dt/dx ~ 1)
    n_reaches = 4
    k_sub = k_total_sec / n_reaches
    c1, c2, c3 = compute_routing_coefficients(k_sub, x_weight, dt_sec)

    q_current = np.copy(inflow_q)
    for _ in range(n_reaches):
        q_next = np.zeros(n_steps)
        q_next[0] = q_current[0]
        for t in range(1, n_steps):
            q_out = c1 * q_current[t] + c2 * q_current[t - 1] + c3 * q_next[t - 1]
            q_next[t] = max(q_out, baseflow_m3s)
        q_current = q_next

    routed_q = q_current

    # 4. Invert Manning to stage at Kanaighat
    n_cal = reach_params["n"]
    z_bed = reach_params["z_bed"]
    width = reach_params["mean_width"]
    slope2 = reach_params["mean_slope2"]

    modelled_stage = invert_manning_to_stage(routed_q, width, slope2, z_bed, n_cal)

    # Uncertainty propagation: +/- 0.18 m WSE uncertainty (Assumption A1)
    stage_lower = modelled_stage - 0.18
    stage_upper = modelled_stage + 0.18

    df_out = pd.DataFrame({
        "timestamp": time_index,
        "imerg_map_mmh": np.round(map_series, 2),
        "inflow_q": np.round(inflow_q, 1),
        "routed_q": np.round(routed_q, 1),
        "modelled_stage": np.round(modelled_stage, 2),
        "stage_lower": np.round(stage_lower, 2),
        "stage_upper": np.round(stage_upper, 2),
    })

    return df_out
