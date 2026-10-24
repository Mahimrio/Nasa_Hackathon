"""
HydroSense-SWOT — Routing Sensitivity Analysis Module
Part of Prompt 4: P4-ROUTING-ENGINE-REAL

Systematically tests model sensitivity to:
1. Muskingum weighting factor X in [0.20, 0.25, 0.30, 0.35]
2. Manning roughness coefficient n variations: [-10%, base, +10%]

Reports:
- Nash-Sutcliffe Efficiency (NSE)
- Kling-Gupta Efficiency (KGE)
- Percent Bias (PBIAS)
- Peak timing error (hours)
- Warning lead time (hours)

Output:
- data/processed/sensitivity_results.csv
"""

import os
import sys
from pathlib import Path
import json
import logging
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd

# Add workspace root to sys.path if needed
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Guard B2: NetCDF4 import MUST precede xarray
import netCDF4
import xarray as xr

from pipeline.muskingum_cunge import route_catchment_flow
from pipeline.harvest_flag import compute_harvest_flags
from pipeline.metrics import evaluate_all_metrics

logger = logging.getLogger("sensitivity")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def run_routing_sensitivity_analysis(
    output_csv_path: Optional[str] = None,
    x_range: Optional[List[float]] = None,
    n_multipliers: Optional[List[float]] = None,
) -> pd.DataFrame:
    """
    Executes 2D sensitivity analysis over Muskingum X and Manning n.

    Parameters:
        output_csv_path: Path to save sensitivity_results.csv.
        x_range: List of X parameters to test (default: [0.20, 0.25, 0.30, 0.35]).
        n_multipliers: Multipliers for calibrated roughness (default: [0.90, 1.00, 1.10]).

    Returns:
        pd.DataFrame containing sensitivity metrics across all combinations.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if output_csv_path is None:
        output_csv_path = os.path.join(base_dir, "data", "processed", "sensitivity_results.csv")

    if x_range is None:
        x_range = [0.20, 0.25, 0.30, 0.35]

    if n_multipliers is None:
        n_multipliers = [0.90, 1.00, 1.10]

    imerg_nc_path = os.path.join(base_dir, "data", "fixtures", "imerg_map.nc")
    gauge_csv_path = os.path.join(base_dir, "data", "fixtures", "gauge_kanaighat.csv")
    cal_json_path = os.path.join(base_dir, "data", "processed", "calibration_results.json")

    # Load IMERG rainfall forcing
    ds_imerg = xr.open_dataset(imerg_nc_path)
    map_series = ds_imerg["precipitationCal"].sel(sub_basin="upper_surma_meghalaya").values
    time_index = pd.to_datetime(ds_imerg["time"].values, utc=True)

    # Load observed gauge records
    df_gauge = pd.read_csv(gauge_csv_path, dtype={"station_id": str, "reach_id": str})
    df_gauge["timestamp"] = pd.to_datetime(df_gauge["timestamp"], utc=True)

    # Load calibrated reach parameters
    target_reach_id = "22211000011"
    if os.path.exists(cal_json_path):
        with open(cal_json_path, "r", encoding="utf-8") as f:
            cal_data = json.load(f)
        reach_params_base = cal_data.get(target_reach_id, {
            "n_calibrated": 0.0294, "z_bed_m": 6.82, "mean_width_m": 184.9, "mean_slope2": 5.16e-5
        })
    else:
        reach_params_base = {
            "n_calibrated": 0.0294, "z_bed_m": 6.82, "mean_width_m": 184.9, "mean_slope2": 5.16e-5
        }

    base_n = float(reach_params_base.get("n_calibrated", 0.0294))
    results = []

    logger.info(f"Running sensitivity matrix: {len(x_range)} X values x {len(n_multipliers)} n multipliers...")

    for x_val in x_range:
        for n_mult in n_multipliers:
            n_trial = base_n * n_mult
            trial_params = dict(reach_params_base)
            trial_params["n_calibrated"] = n_trial
            trial_params["n"] = n_trial

            # 1. Run routing
            df_routed = route_catchment_flow(
                map_series=map_series,
                time_index=time_index,
                reach_params=trial_params,
                x_weight=x_val,
            )

            # 2. Run harvest flags
            df_flagged = compute_harvest_flags(df_routed)

            # 3. Evaluate metrics against observed Kanaighat gauge
            metrics = evaluate_all_metrics(df_flagged, df_gauge, danger_level_m=13.20)

            results.append({
                "muskingum_x": round(x_val, 2),
                "n_multiplier": round(n_mult, 2),
                "n_value": round(n_trial, 4),
                "nse": round(metrics["nse"], 2),
                "kge": round(metrics["kge"], 2),
                "pbias_pct": round(metrics["pbias"], 1),
                "timing_error_h": round(metrics["timing_error_h"], 1),
                "lead_time_h": round(metrics["lead_time_h"], 1) if metrics["lead_time_h"] is not None else None,
            })

    df_results = pd.DataFrame(results)
    os.makedirs(os.path.dirname(output_csv_path), exist_ok=True)
    df_results.to_csv(output_csv_path, index=False)

    logger.info(f"Saved {len(df_results)} sensitivity runs to: {output_csv_path}")
    return df_results


if __name__ == "__main__":
    df_sens = run_routing_sensitivity_analysis()
    print("\nSensitivity Analysis Results:")
    print(df_sens.to_string(index=False))
