"""
JSON Data Exporter for HydroSense-SWOT Next.js Frontend.
Converts all pipeline outputs into structured JSON files that the
Next.js dashboard can import as static data.

Exports:
1. event_timeseries.json  — Full 30-min routing time series (modelled stage, flags, rainfall, baseline)
2. gauge_observations.json — Hourly observed gauge data for hydrograph overlay
3. calibration_summary.json — Manning n, z_bed, reach metadata per reach
4. metrics_summary.json — NSE, KGE, PBIAS, timing error, lead time (formatted)
5. reach_metadata.json — Reach IDs, names, locations, widths for the map component
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import netCDF4  # MUST be before xarray (Trap B2)
import xarray as xr

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from pipeline.manning_calibration import calibrate_reach_manning
from pipeline.muskingum_cunge import route_catchment_flow
from pipeline.baseline import run_rainfall_baseline
from pipeline.harvest_flag import compute_harvest_flags
from pipeline.metrics import evaluate_all_metrics

FIXTURES_DIR = os.path.join(PROJECT_ROOT, "data", "fixtures")
JSON_DIR = os.path.join(PROJECT_ROOT, "ui", "public", "data")
os.makedirs(JSON_DIR, exist_ok=True)


# Reach metadata with approximate geographic positions for the map
REACH_META = [
    {
        "reach_id": "22211000011",
        "name": "Surma Upper (Kanaighat)",
        "name_bn": "সুরমা উচ্চ (কানাইঘাট)",
        "river": "Surma",
        "lat": 24.9980,
        "lon": 92.2594,
        "width_mean_m": 160,
        "length_m": 12500,
        "has_gauge": True,
        "gauge_station": "SW108 Kanaighat",
        "danger_level_m": 13.20,
    },
    {
        "reach_id": "22211000012",
        "name": "Surma Mid (Sylhet)",
        "name_bn": "সুরমা মধ্য (সিলেট)",
        "river": "Surma",
        "lat": 24.90,
        "lon": 91.87,
        "width_mean_m": 190,
        "length_m": 14200,
        "has_gauge": False,
        "gauge_station": None,
        "danger_level_m": None,
    },
    {
        "reach_id": "22211000021",
        "name": "Kushiyara Upper (Amalshid)",
        "name_bn": "কুশিয়ারা উচ্চ (আমলশীদ)",
        "river": "Kushiyara",
        "lat": 24.95,
        "lon": 92.10,
        "width_mean_m": 175,
        "length_m": 13800,
        "has_gauge": False,
        "gauge_station": None,
        "danger_level_m": None,
    },
    {
        "reach_id": "22211000022",
        "name": "Kushiyara Mid (Sherpur)",
        "name_bn": "কুশিয়ারা মধ্য (শেরপুর)",
        "river": "Kushiyara",
        "lat": 24.82,
        "lon": 91.72,
        "width_mean_m": 210,
        "length_m": 15000,
        "has_gauge": False,
        "gauge_station": None,
        "danger_level_m": None,
    },
]


def main():
    print("=" * 60)
    print("  EXPORTING PIPELINE DATA TO JSON FOR NEXT.JS")
    print("=" * 60)

    # ---- 1. Run calibration ----
    ds_swot = xr.open_dataset(os.path.join(FIXTURES_DIR, "swot_reaches.nc"))
    calibrated = {}
    for r_id in ds_swot["reach_id"].values:
        r_str = str(r_id)
        sub = ds_swot.sel(reach_id=r_id)
        res = calibrate_reach_manning(
            sub["wse"].values, sub["width"].values, sub["slope2"].values,
            sub["slope_u"].values, sub["quality_f"].values, sub["dark_frac"].values,
        )
        calibrated[r_str] = res

    # ---- 2. Run routing ----
    ds_imerg = xr.open_dataset(os.path.join(FIXTURES_DIR, "imerg_map.nc"))
    surma_rain = ds_imerg["precipitationCal"].sel(sub_basin="upper_surma_meghalaya").values
    time_index = pd.to_datetime(ds_imerg["time"].values, utc=True)
    target_params = calibrated["22211000011"]

    df_routed = route_catchment_flow(
        map_series=surma_rain, time_index=time_index,
        reach_params=target_params,
        catchment_area_km2=185.0, runoff_coeff=0.62, baseflow_m3s=35.0,
    )
    df_routed = compute_harvest_flags(df_routed, danger_level_m=13.20, lead_steps=48)
    df_baseline = run_rainfall_baseline(df_routed, threshold_watch=35.0, threshold_act=65.0)
    df_routed["baseline_flag"] = df_baseline["baseline_flag"]
    df_routed["baseline_rain_6h"] = df_baseline["baseline_rain_6h"]
    df_routed["baseline_stage"] = np.round(7.74 + df_baseline["baseline_rain_6h"] * 0.045, 2)

    # ---- 3. Load gauge ----
    df_gauge = pd.read_csv(
        os.path.join(FIXTURES_DIR, "gauge_kanaighat.csv"),
        dtype={"station_id": str, "reach_id": str},
    )
    df_gauge["timestamp"] = pd.to_datetime(df_gauge["timestamp"], utc=True)

    # ---- 4. Compute metrics & baseline comparison ----
    from pipeline.metrics import compare_model_vs_baseline
    comparison = compare_model_vs_baseline(df_routed, df_baseline, df_gauge, danger_level_m=13.20)
    hs_m = comparison["hydrosense"]
    base_m = comparison["baseline"]

    # ================ EXPORT JSON FILES ================

    # A. Event Timeseries — downsample to hourly for performance (2928 -> 1464 points)
    df_export = df_routed.copy()
    df_export["timestamp"] = df_export["timestamp"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    # Take every 2nd row (hourly from 30-min)
    df_hourly = df_export.iloc[::2].reset_index(drop=True)
    event_ts = df_hourly.to_dict(orient="records")
    with open(os.path.join(JSON_DIR, "event_timeseries.json"), "w", encoding="utf-8") as f:
        json.dump(event_ts, f, ensure_ascii=False)
    print(f"  [1/5] event_timeseries.json ({len(event_ts)} hourly records)")

    # B. Gauge Observations
    df_g_export = df_gauge[["timestamp", "water_level_m", "danger_level_m"]].copy()
    df_g_export["timestamp"] = df_g_export["timestamp"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    gauge_records = df_g_export.to_dict(orient="records")
    with open(os.path.join(JSON_DIR, "gauge_observations.json"), "w", encoding="utf-8") as f:
        json.dump(gauge_records, f, ensure_ascii=False)
    print(f"  [2/5] gauge_observations.json ({len(gauge_records)} records)")

    # C. Calibration Summary
    cal_summary = {}
    for r_id, params in calibrated.items():
        cal_summary[r_id] = {
            "n": round(params["n"], 4),
            "z_bed": round(params["z_bed"], 2),
            "n_valid_passes": params["n_valid_passes"],
            "mean_slope2": float(f"{params['mean_slope2']:.2e}"),
            "mean_width": round(params["mean_width"], 1),
        }
    with open(os.path.join(JSON_DIR, "calibration_summary.json"), "w", encoding="utf-8") as f:
        json.dump(cal_summary, f, indent=2, ensure_ascii=False)
    print(f"  [3/5] calibration_summary.json ({len(cal_summary)} reaches)")

    # D. Metrics Summary
    metrics_out = {
        "nse": round(hs_m["nse"], 2) if hs_m["nse"] is not None else None,
        "kge": round(hs_m["kge"], 2) if hs_m["kge"] is not None else None,
        "pbias": round(hs_m["pbias"], 1) if hs_m["pbias"] is not None else None,
        "timing_error_h": round(hs_m["timing_error_h"], 1),
        "lead_time_h": round(hs_m["lead_time_h"], 1),
        "formatted": hs_m["formatted"],
        "baseline": {
            "nse": round(base_m["nse"], 2) if base_m["nse"] is not None else None,
            "kge": round(base_m["kge"], 2) if base_m["kge"] is not None else None,
            "pbias": round(base_m["pbias"], 1) if base_m["pbias"] is not None else None,
            "timing_error_h": round(base_m["timing_error_h"], 1),
            "lead_time_h": round(base_m["lead_time_h"], 1),
            "formatted": base_m["formatted"],
        },
        "comparison": comparison["comparison"],
        "danger_level_m": 13.20,
        "travel_time_h": 25.9,
        "imerg_latency_h": 4.0,
        "swot_last_geometry_date": "2026-03-25",
        "calibration_period": "Jan 2024 – Mar 2026",
        "test_period": "Apr 1 – May 31, 2026",
    }
    with open(os.path.join(JSON_DIR, "metrics_summary.json"), "w", encoding="utf-8") as f:
        json.dump(metrics_out, f, indent=2, ensure_ascii=False)
    print(f"  [4/5] metrics_summary.json")

    # E. Reach Metadata (for map rendering)
    for rm in REACH_META:
        r_id = rm["reach_id"]
        if r_id in calibrated:
            rm["calibrated_n"] = round(calibrated[r_id]["n"], 4)
            rm["z_bed"] = round(calibrated[r_id]["z_bed"], 2)
            rm["slope_quality"] = "good" if calibrated[r_id]["mean_slope2"] > 2e-5 else "uncertain"
        else:
            rm["calibrated_n"] = None
            rm["z_bed"] = None
            rm["slope_quality"] = "unknown"

    with open(os.path.join(JSON_DIR, "reach_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(REACH_META, f, indent=2, ensure_ascii=False)
    print(f"  [5/5] reach_metadata.json ({len(REACH_META)} reaches)")

    # F. Sensitivity Results (if available)
    sens_csv = os.path.join(PROJECT_ROOT, "data", "processed", "sensitivity_results.csv")
    if os.path.exists(sens_csv):
        df_sens = pd.read_csv(sens_csv)
        sens_records = df_sens.to_dict(orient="records")
        with open(os.path.join(JSON_DIR, "sensitivity_results.json"), "w", encoding="utf-8") as f:
            json.dump(sens_records, f, indent=2)
        print(f"  [Bonus] sensitivity_results.json ({len(sens_records)} runs)")

    print("\n  All JSON files exported to: " + JSON_DIR)
    print("=" * 60)


if __name__ == "__main__":
    main()
