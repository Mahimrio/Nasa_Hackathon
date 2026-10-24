"""
Minimum Viable Pipeline (MVP) Orchestrator for HydroSense-SWOT.
Executes the mandatory 7 steps defined in SOLUTION_ARCHITECTURE.md v3.0:

Step 1: Load swot_reaches.nc                    -> assert n_valid_passes >= 5
Step 2: Load gauge_kanaighat.csv                -> assert non-empty, UTC timestamps
Step 3: Run Manning calibration                 -> assert n per reach in [0.025, 0.10]
Step 4: Load imerg_map.nc                       -> assert MAP is not all-zero
Step 5: Run Muskingum-Cunge routing             -> assert modelled level rises during Apr event
Step 6: Compute NSE, KGE, peak_timing_error     -> print to console (2dp)
Step 7: Run baseline (rainfall threshold)       -> print baseline_flag transitions
"""

import os
import sys
import netCDF4  # MUST be before xarray (Trap B2)
import xarray as xr
import pandas as pd
import numpy as np

# Adjust path to import pipeline modules
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
PROCESSED_DIR = os.path.join(PROJECT_ROOT, "data", "processed")
os.makedirs(PROCESSED_DIR, exist_ok=True)


def main():
    print("=" * 70)
    print("  HYDROSENSE-SWOT: MINIMUM VIABLE PIPELINE (MVP) EXECUTION")
    print("=" * 70)

    # -------------------------------------------------------------
    # Step 1: Load swot_reaches.nc -> assert n_valid_passes >= 5
    # -------------------------------------------------------------
    swot_path = os.path.join(FIXTURES_DIR, "swot_reaches.nc")
    assert os.path.exists(swot_path), f"Missing fixture: {swot_path}"
    ds_swot = xr.open_dataset(swot_path)
    print(f"\n[Step 1] Loaded swot_reaches.nc")
    print(f"         Reaches: {list(ds_swot['reach_id'].values)}")
    print(f"         Total time passes: {len(ds_swot['time'])}")

    # -------------------------------------------------------------
    # Step 2: Load gauge_kanaighat.csv -> assert non-empty, UTC timestamps
    # -------------------------------------------------------------
    gauge_path = os.path.join(FIXTURES_DIR, "gauge_kanaighat.csv")
    assert os.path.exists(gauge_path), f"Missing fixture: {gauge_path}"
    # Guard against float reach_id truncation (Trap B3)
    df_gauge = pd.read_csv(gauge_path, dtype={"station_id": str, "reach_id": str})
    assert not df_gauge.empty, "Gauge dataset is empty!"
    # Ensure UTC timestamp awareness (Trap B1)
    df_gauge["timestamp"] = pd.to_datetime(df_gauge["timestamp"], utc=True)
    assert all(t.tzinfo is not None for t in df_gauge["timestamp"]), "Gauge timestamps must be timezone-aware UTC"
    print(f"\n[Step 2] Loaded gauge_kanaighat.csv ({len(df_gauge)} records)")
    print(f"         Station: {df_gauge['station_name'].iloc[0]} (ID: {df_gauge['station_id'].iloc[0]})")
    print(f"         Danger Level: {df_gauge['danger_level_m'].iloc[0]:.2f} m PWD")
    print(f"         Max observed level: {df_gauge['water_level_m'].max():.2f} m PWD")

    # -------------------------------------------------------------
    # Step 3: Run Manning calibration -> assert n per reach in [0.025, 0.10]
    # -------------------------------------------------------------
    print(f"\n[Step 3] Running Manning's Roughness (n) Calibration...")
    from pipeline.calibration_diagnostics import plot_calibration_diagnostics
    import json

    calibrated_params = {}
    target_reach_id = "22211000011"  # Kanaighat reach
    cal_json_path = os.path.join(PROJECT_ROOT, "data", "processed", "calibration_results.json")

    for r_id in ds_swot["reach_id"].values:
        r_str = str(r_id)
        reach_sub = ds_swot.sel(reach_id=r_id)
        res = calibrate_reach_manning(
            wse_series=reach_sub["wse"].values,
            width_series=reach_sub["width"].values,
            slope2_series=reach_sub["slope2"].values,
            slope_u_series=reach_sub["slope_u"].values,
            wse_u_series=reach_sub["wse_u"].values if "wse_u" in reach_sub else None,
            quality_series=reach_sub["quality_f"].values if "quality_f" in reach_sub else None,
            dark_series=reach_sub["dark_frac"].values if "dark_frac" in reach_sub else None,
            time_series=reach_sub["time"].values if "time" in reach_sub else None,
            reach_id=r_str,
        )
        assert res["n_valid_passes"] >= 5, f"Reach {r_str} has fewer than 5 valid passes ({res['n_valid_passes']})"
        assert 0.025 <= res["n"] <= 0.10, f"Reach {r_str} calibrated n={res['n']} outside [0.025, 0.10]"
        calibrated_params[r_str] = res
        print(
            f"         Reach {r_str}: n = {res['n_calibrated']:.4f}, z_bed = {res['z_bed_m']:.2f} m, "
            f"valid_passes = {res['n_valid_passes']}, RMSE = {res['rmse_m3s']} m³/s"
        )
        print(
            f"           [Exclusions] Low-flow (<0.5m above bed) = {res['passes_excluded_low_flow']}, "
            f"Slope noise = {res['passes_excluded_slope_quality']}, At-bound = {res['n_at_bound']}"
        )

    # Save to data/processed/calibration_results.json
    os.makedirs(os.path.dirname(cal_json_path), exist_ok=True)
    with open(cal_json_path, "w", encoding="utf-8") as f:
        json.dump(calibrated_params, f, indent=2)

    # Generate diagnostic figures
    plot_calibration_diagnostics(ds_swot, calibrated_params)

    # -------------------------------------------------------------
    # Step 4: Load imerg_map.nc -> assert MAP is not all-zero
    # -------------------------------------------------------------
    imerg_path = os.path.join(FIXTURES_DIR, "imerg_map.nc")
    assert os.path.exists(imerg_path), f"Missing fixture: {imerg_path}"
    ds_imerg = xr.open_dataset(imerg_path)
    map_vals = ds_imerg["precipitationCal"].values
    assert np.max(map_vals) > 0.0, "MAP is all-zero! Check CRS clip or variable name (Trap B7)"
    print(f"\n[Step 4] Loaded imerg_map.nc ({len(ds_imerg['time'])} steps of 30-min MAP)")
    print(f"         Sub-basins: {list(ds_imerg['sub_basin'].values)}")
    print(f"         Peak rainfall rate: {np.max(map_vals):.2f} mm/hr")

    # -------------------------------------------------------------
    # Step 5: Run Muskingum-Cunge routing -> assert modelled level rises
    # -------------------------------------------------------------
    print(f"\n[Step 5] Running Muskingum-Cunge Routing for All Years (2020-2026)...")
    surma_rain = ds_imerg["precipitationCal"].sel(sub_basin="upper_surma_meghalaya").values
    time_index = pd.to_datetime(ds_imerg["time"].values, utc=True)
    target_params = calibrated_params[target_reach_id]

    years = sorted(list(set(time_index.year)))
    routed_dfs = []
    baseline_dfs = []

    for y in years:
        mask = time_index.year == y
        sub_rain = surma_rain[mask]
        sub_times = time_index[mask]

        df_y = route_catchment_flow(
            map_series=sub_rain,
            time_index=sub_times,
            reach_params=target_params,
            catchment_area_km2=185.0,
            runoff_coeff=0.62,
            baseflow_m3s=35.0,
        )
        # This is a retrospective synthetic engineering run, not an operational
        # forecast. Flags are causal current-state classifications.
        df_y = compute_harvest_flags(df_y, danger_level_m=13.20)
        df_base_y = run_rainfall_baseline(df_y, threshold_watch=35.0, threshold_act=65.0)
        df_y["baseline_flag"] = df_base_y["baseline_flag"]
        df_y["baseline_rain_6h"] = df_base_y["baseline_rain_6h"]
        df_y["baseline_stage"] = np.round(7.74 + df_base_y["baseline_rain_6h"] * 0.045, 2)

        routed_dfs.append(df_y)
        baseline_dfs.append(df_base_y)
        rise_y = df_y["modelled_stage"].max() - df_y["modelled_stage"].min()
        print(f"         Year {y}: Base {df_y['modelled_stage'].min():.2f}m -> Peak {df_y['modelled_stage'].max():.2f}m (Rise: {rise_y:.2f}m)")

    df_routed = pd.concat(routed_dfs, ignore_index=True)
    df_baseline = pd.concat(baseline_dfs, ignore_index=True)

    stage_rise = df_routed["modelled_stage"].max() - df_routed["modelled_stage"].min()
    assert stage_rise > 3.0, f"Modelled stage failed to rise significantly ({stage_rise:.2f} m <= 3.0 m)"
    flag_counts = df_routed["harvest_flag"].value_counts().to_dict()
    print(f"         Total Harvest Flags across 2020-2026: {flag_counts}")

    # -------------------------------------------------------------
    # Step 6: Compute NSE, KGE, peak_timing_error -> print to console (2dp)
    # -------------------------------------------------------------
    print(f"\n[Step 6] Computing Scientific Validation Metrics across Years...")
    # 2026 test period benchmark
    metrics_2026 = evaluate_all_metrics(df_routed, df_gauge, danger_level_m=13.20, test_period_only=True)
    fmt = metrics_2026["formatted"]
    print("         -----------------------------------------")
    print(f"         [2026 Test Period Benchmark]")
    print(f"         Nash-Sutcliffe Efficiency (NSE):  {fmt['nse']}")
    print(f"         Kling-Gupta Efficiency (KGE):     {fmt['kge']}")
    print(f"         Percent Bias (PBIAS):             {fmt['pbias']}")
    print(f"         Peak Timing Error:                {fmt['timing_error']}")
    print("         Warning Lead Time:                N/A (no issue-time forecast product)")
    print("         -----------------------------------------")

    # Evaluate by year
    print("         [Validation Metrics by Year]")
    for y in years:
        df_r_y = df_routed[df_routed["timestamp"].dt.year == y]
        df_g_y = df_gauge[df_gauge["timestamp"].dt.year == y]
        m_y = evaluate_all_metrics(df_r_y, df_g_y, danger_level_m=13.20, test_period_only=False)
        fmt_y = m_y["formatted"]
        print(f"         {y}: NSE={fmt_y['nse']}, KGE={fmt_y['kge']}, PBIAS={fmt_y['pbias']}, Peak Error={fmt_y['timing_error']}, Lead={fmt_y['lead_time']}")

    # -------------------------------------------------------------
    # Step 7: Run baseline (rainfall threshold) -> print transitions
    # -------------------------------------------------------------
    print(f"\n[Step 7] Running Rainfall-Only Threshold Baseline...")
    baseline_counts = df_baseline["baseline_flag"].value_counts().to_dict()
    print(f"         Total Baseline Flag distribution: {baseline_counts}")

    # Compare first RED flag timing for 2026 event
    df_routed_2026 = df_routed[df_routed["timestamp"].dt.year == 2026]
    df_base_2026 = df_baseline[df_baseline["timestamp"].dt.year == 2026]
    model_red = df_routed_2026[df_routed_2026["harvest_flag"] == "RED"]
    base_red = df_base_2026[df_base_2026["baseline_flag"] == "RED"]

    if not model_red.empty and not base_red.empty:
        t_m_red = pd.to_datetime(model_red.iloc[0]["timestamp"])
        t_b_red = pd.to_datetime(base_red.iloc[0]["timestamp"])
        lead_gain_h = (t_b_red - t_m_red).total_seconds() / 3600.0
        print(f"         First Model RED Flag (2026):    {t_m_red.strftime('%Y-%m-%d %H:%M UTC')}")
        print(f"         First Baseline RED Flag (2026): {t_b_red.strftime('%Y-%m-%d %H:%M UTC')}")
        print(f"         Lead Time Gain over Baseline:   {lead_gain_h:+.1f} hours")

    # Save processed event results for UI loading
    out_results_path = os.path.join(PROCESSED_DIR, "event_results.csv")
    df_routed.to_csv(out_results_path, index=False)
    print(f"\nSaved processed event results to {out_results_path} ({len(df_routed)} records)")

    # Generate formal scientific validation report and figures (Prompt 5)
    from pipeline.validation_report import run_scientific_validation
    run_scientific_validation(out_results_path, os.path.join(FIXTURES_DIR, "gauge_kanaighat.csv"))

    print("\n" + "=" * 70)
    print("  SYNTHETIC ENGINEERING PIPELINE COMPLETED (NOT REAL-WORLD VALIDATION)")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
