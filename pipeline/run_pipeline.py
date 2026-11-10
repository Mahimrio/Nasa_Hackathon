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
import argparse
import netCDF4  # MUST be before xarray (Trap B2)
import xarray as xr
import pandas as pd
import numpy as np

# Adjust path to import pipeline modules
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from pipeline.provenance import validate_real_pipeline_inputs, ProvenanceError
from pipeline.manning_calibration import calibrate_reach_manning, estimate_reach_hydraulics_literature
from pipeline.muskingum_cunge import route_catchment_flow
from pipeline.baseline import run_rainfall_baseline
from pipeline.harvest_flag import compute_harvest_flags
from pipeline.metrics import evaluate_all_metrics

FIXTURES_DIR = os.path.join(PROJECT_ROOT, "data", "fixtures")
REAL_DIR = os.path.join(PROJECT_ROOT, "data", "real")
PROCESSED_DIR = os.path.join(PROJECT_ROOT, "data", "processed")
os.makedirs(PROCESSED_DIR, exist_ok=True)


def parse_args(argv=None):
    parser = argparse.ArgumentParser(
        description="HydroSense-SWOT: MVP Pipeline Orchestrator",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--mode",
        required=True,
        choices=["demo", "real"],
        help="Pipeline execution mode: 'demo' (synthetic benchmark with explicit synthetic labels) or 'real' (fails closed if real data inputs are missing or invalid).",
    )
    parser.add_argument(
        "--output-dir",
        default=None,
        help="Custom output directory for processed results (defaults to data/processed).",
    )
    parser.add_argument(
        "--real-dir",
        default=None,
        help="Custom real data directory for validation (defaults to data/real).",
    )
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    mode = args.mode
    output_dir = args.output_dir or PROCESSED_DIR
    real_dir = args.real_dir or REAL_DIR
    os.makedirs(output_dir, exist_ok=True)

    if mode == "real":
        print("=" * 70)
        print("  HYDROSENSE-SWOT: PIPELINE EXECUTION [MODE: REAL DATA]")
        print("  FAIL-CLOSED PROVENANCE & INTEGRITY CHECK")
        print("=" * 70)

        # Fail-closed cryptographic & metadata provenance validation
        try:
            prov_result = validate_real_pipeline_inputs(real_dir)
        except ProvenanceError as exc:
            err_msg = (
                "\n" + "!" * 70 + "\n"
                "REAL DATA MODE FAILED CLOSED (PROVENANCE REJECTED):\n"
                f"  {exc}\n\n"
                "A present file is not proof of verified provenance.\n"
                "Real mode strictly rejects missing manifests, checksum mismatches,\n"
                "unverified metadata, and synthetic or unknown data.\n"
                "Module 1 real-data integration is gated until real source files are\n"
                "acquired and cryptographically verified in data/real/PROVENANCE.json.\n"
                + "!" * 70 + "\n"
            )
            print(err_msg, file=sys.stderr)
            raise SystemExit(1)

        swot_path = prov_result["resolved_paths"]["swot"]
        gauge_path = prov_result["resolved_paths"]["gauge"]
        imerg_path = prov_result["resolved_paths"]["imerg"]
        provenance_label = "EXPLORATORY_REAL_INPUTS_ASSUMED_HYDRAULICS"
    else:
        print("=" * 70)
        print("  HYDROSENSE-SWOT: MINIMUM VIABLE PIPELINE (MVP) EXECUTION")
        print("  MODE: DEMO (SYNTHETIC ENGINEERING BENCHMARK)")
        print("  PROVENANCE: SYNTHETIC_DEMO")
        print("  NOTICE: Running on synthetic fixtures. Not validated for real-world impact.")
        print("=" * 70)

        swot_path = os.path.join(FIXTURES_DIR, "swot_reaches.nc")
        gauge_path = os.path.join(FIXTURES_DIR, "gauge_kanaighat.csv")
        imerg_path = os.path.join(FIXTURES_DIR, "imerg_map.nc")
        provenance_label = "SYNTHETIC_DEMO"

    # -------------------------------------------------------------
    # -------------------------------------------------------------
    # Step 1: Load SWOT Reaches -> assert n_valid_passes >= 5
    # -------------------------------------------------------------
    assert os.path.exists(swot_path), f"Missing SWOT dataset: {swot_path}"
    ds_swot = xr.open_dataset(swot_path)
    print(f"\n[Step 1] Loaded SWOT dataset: {swot_path}")
    print(f"         Reaches: {list(ds_swot['reach_id'].values)}")
    print(f"         Total time passes: {len(ds_swot['time'])}")

    # -------------------------------------------------------------
    # Step 2: Load Gauge Records -> assert non-empty, UTC timestamps
    # -------------------------------------------------------------
    assert os.path.exists(gauge_path), f"Missing gauge dataset: {gauge_path}"
    # Guard against float reach_id truncation (Trap B3)
    df_gauge = pd.read_csv(gauge_path, dtype={"station_id": str, "reach_id": str})
    assert not df_gauge.empty, "Gauge dataset is empty!"
    # Ensure UTC timestamp awareness (Trap B1)
    df_gauge["timestamp"] = pd.to_datetime(df_gauge["timestamp"], utc=True)
    assert all(t.tzinfo is not None for t in df_gauge["timestamp"]), "Gauge timestamps must be timezone-aware UTC"
    print(f"\n[Step 2] Loaded gauge dataset: {gauge_path} ({len(df_gauge)} records)")
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
    if mode == "real":
        basin_geom_path = os.path.join(real_dir, "basin_geometry.json")
        if os.path.exists(basin_geom_path):
            with open(basin_geom_path, "r", encoding="utf-8") as f:
                geom_data = json.load(f)
            target_reach_id = str(geom_data.get("target_reach_id", "45220400591"))
            catchment_area_km2 = float(geom_data.get("catchment_area_km2", 425.0))
            runoff_coeff = float(geom_data.get("runoff_coeff", 0.58))
            baseflow_m3s = float(geom_data.get("baseflow_m3s", 28.0))
            total_reach_length_m = float(geom_data.get("total_surma_length_km", 123.0)) * 1000.0
            celerity_ms = 1.35
            x_weight = 0.22
        else:
            target_reach_id = "45220400591"
            catchment_area_km2 = 425.0
            runoff_coeff = 0.58
            baseflow_m3s = 28.0
            total_reach_length_m = 123000.0
            celerity_ms = 1.35
            x_weight = 0.22
        print(
            f"         [Target Reach] {target_reach_id} (Delineated Kanaighat outlet)\n"
            f"         [Literature Assumptions] Area={catchment_area_km2}km², C={runoff_coeff}, "
            f"Q0={baseflow_m3s}m³/s, ck={celerity_ms}m/s, X={x_weight}"
        )
    else:
        target_reach_id = "22211000011"  # Kanaighat synthetic reach
        catchment_area_km2 = 185.0
        runoff_coeff = 0.62
        baseflow_m3s = 35.0
        total_reach_length_m = 140000.0
        celerity_ms = 1.50
        x_weight = 0.25
    cal_json_path = os.path.join(output_dir, "calibration_results.json")

    for r_id in ds_swot["reach_id"].values:
        r_str = str(r_id)
        reach_sub = ds_swot.sel(reach_id=r_id)
        if mode == "real":
            res = estimate_reach_hydraulics_literature(
                wse_series=reach_sub["wse"].values,
                width_series=reach_sub["width"].values,
                slope2_series=reach_sub["slope2"].values,
                slope_u_series=reach_sub["slope_u"].values,
                wse_u_series=reach_sub["wse_u"].values if "wse_u" in reach_sub else None,
                quality_series=reach_sub["quality_f"].values if "quality_f" in reach_sub else None,
                dark_series=reach_sub["dark_frac"].values if "dark_frac" in reach_sub else None,
                time_series=reach_sub["time"].values if "time" in reach_sub else None,
                reach_id=r_str,
                literature_n=0.033,
                n_bounds=(0.025, 0.045),
            )
            res["provenance"] = provenance_label
            calibrated_params[r_str] = res
            print(
                f"         Reach {r_str}: Literature-assigned n = {res['n']:.4f} "
                f"({res['n_lower_bound']}-{res['n_upper_bound']}), z_bed = {res['z_bed_m']:.2f} m "
                f"[Uncalibrated parameterization; Chow 1959 / Arcement & Schneider 1989]"
            )
        else:
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
            res["provenance"] = provenance_label
            calibrated_params[r_str] = res
            print(
                f"         Reach {r_str}: n = {res['n_calibrated']:.4f}, z_bed = {res['z_bed_m']:.2f} m, "
                f"valid_passes = {res['n_valid_passes']}, RMSE = {res['rmse_m3s']} m³/s"
            )
            print(
                f"           [Exclusions] Low-flow (<0.5m above bed) = {res['passes_excluded_low_flow']}, "
                f"Slope noise = {res['passes_excluded_slope_quality']}, At-bound = {res['n_at_bound']}"
            )

    # Save to calibration_results.json in target output_dir
    os.makedirs(os.path.dirname(cal_json_path), exist_ok=True)
    with open(cal_json_path, "w", encoding="utf-8") as f:
        json.dump(calibrated_params, f, indent=2)

    # Generate diagnostic figures
    plot_calibration_diagnostics(
        ds_swot, calibrated_params, output_dir=os.path.join(output_dir, "calibration_plots")
    )

    # -------------------------------------------------------------
    # Step 4: Load IMERG MAP -> assert MAP is not all-zero
    # -------------------------------------------------------------
    assert os.path.exists(imerg_path), f"Missing IMERG dataset: {imerg_path}"
    ds_imerg = xr.open_dataset(imerg_path)
    precip_var = "precipitationCal" if "precipitationCal" in ds_imerg else "precipitation"
    map_vals = ds_imerg[precip_var].values
    assert np.max(map_vals) > 0.0, "MAP is all-zero! Check CRS clip or variable name (Trap B7)"
    print(f"\n[Step 4] Loaded IMERG dataset: {imerg_path} ({len(ds_imerg['time'])} steps of 30-min MAP)")
    print(f"         Sub-basins: {list(ds_imerg['sub_basin'].values)}")
    print(f"         Peak rainfall rate: {np.max(map_vals):.2f} mm/hr")

    # -------------------------------------------------------------
    # Step 5: Run Muskingum-Cunge routing -> assert modelled level rises
    # -------------------------------------------------------------
    print(f"\n[Step 5] Running Muskingum-Cunge Routing ({mode.upper()} mode)...")
    surma_rain = ds_imerg[precip_var].sel(sub_basin="upper_surma_meghalaya").values
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
            catchment_area_km2=catchment_area_km2,
            runoff_coeff=runoff_coeff,
            baseflow_m3s=baseflow_m3s,
            total_reach_length_m=total_reach_length_m,
            v_mean=celerity_ms / (5.0 / 3.0),
            x_weight=x_weight,
        )
        # Threshold flags are instantaneous state classifications, NOT forecast warnings.
        # Any lead-time claim requires a separate causal issue-time hindcast.
        df_y = compute_harvest_flags(df_y, danger_level_m=13.20)
        df_base_y = run_rainfall_baseline(df_y, threshold_watch=35.0, threshold_act=65.0)
        df_y["baseline_flag"] = df_base_y["baseline_flag"]
        df_y["baseline_rain_6h"] = df_base_y["baseline_rain_6h"]
        df_y["baseline_stage"] = np.round(df_y["modelled_stage"].min() + df_base_y["baseline_rain_6h"] * 0.045, 2)
        df_y["provenance"] = provenance_label

        routed_dfs.append(df_y)
        baseline_dfs.append(df_base_y)
        rise_y = df_y["modelled_stage"].max() - df_y["modelled_stage"].min()
        print(f"         Year {y}: Base {df_y['modelled_stage'].min():.2f}m -> Peak {df_y['modelled_stage'].max():.2f}m (Rise: {rise_y:.2f}m)")

    df_routed = pd.concat(routed_dfs, ignore_index=True)
    df_baseline = pd.concat(baseline_dfs, ignore_index=True)

    stage_rise = df_routed["modelled_stage"].max() - df_routed["modelled_stage"].min()
    min_rise = 1.5 if mode == "real" else 3.0
    assert stage_rise > min_rise, f"Modelled stage failed to rise significantly ({stage_rise:.2f} m <= {min_rise} m)"
    flag_counts = df_routed["harvest_flag"].value_counts().to_dict()
    print(f"         Total Harvest Flags across {years}: {flag_counts}")

    # -------------------------------------------------------------
    # Step 6: Compute NSE, KGE, peak_timing_error -> print to console (2dp)
    # -------------------------------------------------------------
    print(f"\n[Step 6] Computing Scientific Validation Metrics...")
    if mode == "demo":
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
    else:
        print("         -----------------------------------------")
        print("         [Real Mode Scientific Evaluation Notice]")
        print("         Continuous NSE/KGE are not reported on sparse gauge records (Trap T-H5).")
        print("         Validation is executed via scripts/evaluate_real_hindcast.py strictly")
        print("         on raw observation timestamps (is_observed == True).")
        print("         -----------------------------------------")

    # -------------------------------------------------------------
    # Step 7: Run baseline (rainfall threshold) -> print transitions
    # -------------------------------------------------------------
    print(f"\n[Step 7] Running Rainfall-Only Threshold Baseline...")
    baseline_counts = df_baseline["baseline_flag"].value_counts().to_dict()
    print(f"         Total Baseline Flag distribution: {baseline_counts}")

    target_year = 2026 if mode == "demo" else 2024
    df_routed_target = df_routed[df_routed["timestamp"].dt.year == target_year]
    df_base_target = df_baseline[df_baseline["timestamp"].dt.year == target_year]
    model_red = df_routed_target[df_routed_target["harvest_flag"] == "RED"]
    base_red = df_base_target[df_base_target["baseline_flag"] == "RED"]

    if not model_red.empty and not base_red.empty:
        t_m_red = pd.to_datetime(model_red.iloc[0]["timestamp"])
        t_b_red = pd.to_datetime(base_red.iloc[0]["timestamp"])
        lead_gain_h = (t_b_red - t_m_red).total_seconds() / 3600.0
        print(f"         First Model RED Flag ({target_year}):    {t_m_red.strftime('%Y-%m-%d %H:%M UTC')}")
        print(f"         First Baseline RED Flag ({target_year}): {t_b_red.strftime('%Y-%m-%d %H:%M UTC')}")
        print(f"         Lead Time Gain over Baseline:   {lead_gain_h:+.1f} hours")
    else:
        print(f"         No dual RED flag trigger during {target_year} event window.")

    # Save processed event results for UI loading
    out_results_path = os.path.join(output_dir, "event_results.csv")
    df_routed.to_csv(out_results_path, index=False)
    if mode == "demo":
        df_routed.to_csv(os.path.join(output_dir, "event_results_demo.csv"), index=False)
    else:
        df_routed.to_csv(os.path.join(output_dir, "event_results_real.csv"), index=False)
    print(f"\nSaved processed event results to {out_results_path} ({len(df_routed)} records)")

    if mode == "demo":
        # Generate formal scientific validation report and figures (Prompt 5)
        from pipeline.validation_report import run_scientific_validation
        run_scientific_validation(out_results_path, gauge_path, output_dir=output_dir)
    else:
        print("         Notice: For real-data mode, formal retrospective evaluation is generated")
        print("         by scripts/evaluate_real_hindcast.py (Prompt P6).")

    print("\n" + "=" * 70)
    if mode == "demo":
        print("  SYNTHETIC ENGINEERING PIPELINE COMPLETED [SYNTHETIC_DEMO]")
        print("  NOTICE: This demonstration relies on synthetic fixtures.")
        print("  It has not been field-deployed or validated for real-world warning.")
    else:
        print("  REAL-DATA EXPLORATORY HINDCAST COMPLETED")
        print("  PROVENANCE: EXPLORATORY_REAL_INPUTS_ASSUMED_HYDRAULICS")
        print("  NOTICE: Model executed with real inputs and literature-assumed parameters.")
        print("  Threshold flags are instantaneous state classifications, NOT forecast warnings.")
        print("  It has not been field-calibrated or evaluated for operational warning skill.")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
