"""
Baseline Rainfall-Only Threshold Module for HydroSense-SWOT.
Follows SOLUTION_ARCHITECTURE.md v3.0 Section 3.3:
- Computes 6-hour rolling accumulated rainfall over Meghalaya
- Applies historical thresholding for AMBER (watch) and RED (act)
- Provides benchmark against which the SWOT-calibrated hydrologic routing is evaluated
"""

import numpy as np
import pandas as pd

def run_rainfall_baseline(df_routing, threshold_watch=35.0, threshold_act=65.0):
    """
    Computes 6-hour rolling rainfall accumulation and baseline warning flags.
    
    Parameters:
    - df_routing: DataFrame containing 'timestamp' and 'imerg_map_mmh' (at 30-min steps)
    - threshold_watch: 6-hour rainfall in mm triggering AMBER alert
    - threshold_act: 6-hour rainfall in mm triggering RED alert
    
    Returns:
    - Series or DataFrame with baseline_rain_6h and baseline_flag ('GREEN', 'AMBER', 'RED')
    """
    df = df_routing.copy()
    # 30-min steps -> 12 periods = 6 hours
    # precipitationCal is in mm/hr, so rainfall per 30-min step is mm/hr * 0.5 h
    rain_per_step = df["imerg_map_mmh"] * 0.5
    rolling_6h = rain_per_step.rolling(window=12, min_periods=1).sum()

    flags = []
    for val in rolling_6h:
        if val >= threshold_act:
            flags.append("RED")
        elif val >= threshold_watch:
            flags.append("AMBER")
        else:
            flags.append("GREEN")

    df["baseline_rain_6h"] = np.round(rolling_6h, 1)
    df["baseline_flag"] = flags
    return df
