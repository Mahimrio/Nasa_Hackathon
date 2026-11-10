"""
HydroSense-SWOT — Module 1 JSON export bridge (pipeline -> Next.js static data).

The dashboard reads only the static JSON in ``ui/public/data/``. This script is
the single place where pipeline artefacts become those files, and it enforces an
explicit provenance split so the UI can never silently present synthetic
engineering output as real NASA/BWDB evidence:

  --mode demo   data/fixtures/*                                  -> SYNTHETIC
  --mode real   data/real/* + data/processed/event_results_real.csv
                + data/processed/real_hindcast_metrics.json
                + data/processed/calibration_results_real.json
                                                     -> EXPLORATORY_REAL_INPUTS_ASSUMED_HYDRAULICS

Real mode never opens ``data/fixtures/``. It fails closed if any real artefact is
missing, so a destructive demo run cannot leak synthetic numbers into the
real-data dashboard.

Real-mode honesty rules (docs/MODULE_1_REAL_DATA_BUILD_PROMPTS.md):
  * NSE / KGE are exported as ``null``. The BWDB SW266 record is sparse and
    cannot support continuous hydrograph skill scores (Trap T-H5).
  * Manning n is a literature assumption, not a calibration result.
  * z_bed is the minimum SWOT WSE, an unresolved lower bound on bed elevation.
  * Threshold flags are retrospective state classifications, not warnings.
"""

import argparse
import json
import os
import sys

import numpy as np
import pandas as pd
import netCDF4  # MUST be before xarray (Trap B2)
import xarray as xr

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from pipeline.provenance import sha256_file, validate_real_pipeline_inputs

FIXTURES_DIR = os.path.join(PROJECT_ROOT, "data", "fixtures")
REAL_DIR = os.path.join(PROJECT_ROOT, "data", "real")
PROCESSED_DIR = os.path.join(PROJECT_ROOT, "data", "processed")
JSON_DIR = os.path.join(PROJECT_ROOT, "ui", "public", "data")

DEMO_PROVENANCE = "SYNTHETIC"
REAL_PROVENANCE = "EXPLORATORY_REAL_INPUTS_ASSUMED_HYDRAULICS"

DANGER_LEVEL_M = 13.20

# Standard Bangla river names used by the Surma/Kushiyara system.
BN_RIVER_NAMES = {
    "Surma": "সুরমা",
    "Kushiyara": "কুশিয়ারা",
    "Barak": "বরাক",
    "Kalni": "কলনী",
    "Gang": "গাং",
}

DEMO_DISCLOSURES = [
    "Synthetic fixture scenario only; not independent validation or operational forecast skill.",
    "Reach IDs, gauge series, and precipitation are constructed for engineering tests.",
    "Do not cite these numbers as evidence of real-world model performance.",
]

REAL_DISCLOSURES = [
    "Inputs are real NASA SWOT RiverSP, NASA GPM IMERG Early and BWDB SW266 records.",
    "Hydraulic parameters are provisional literature assumptions, not observational calibration.",
    "Bed elevation is an unresolved proxy (minimum SWOT WSE), not surveyed bathymetry.",
    "NSE/KGE are omitted: the sparse BWDB gauge cannot support continuous skill scores.",
    "Threshold flags are retrospective state classifications, not predictive warnings.",
    "Absolute PWD danger-level crossing is unverified without a geodetic leveling tie.",
    "The 425 km2 local basin omits transboundary Barak macro-inflow (>26,000 km2).",
]


# --------------------------------------------------------------------------- #
# Reach metadata used only by demo mode. Real mode derives metadata from
# data/real/basin_geometry.json (SWORD v16 reach IDs 4522040xxxx).
# --------------------------------------------------------------------------- #
DEMO_REACH_META = [
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
        "gauge_station": "SW266 Kanaighat",
        "danger_level_m": DANGER_LEVEL_M,
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


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _dump(path: str, payload, indent=None) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        if indent is None:
            json.dump(payload, fh, ensure_ascii=False)
        else:
            json.dump(payload, fh, indent=indent, ensure_ascii=False)


def _iso(series: pd.Series) -> pd.Series:
    return pd.to_datetime(series, utc=True).dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _require(paths) -> None:
    missing = [p for p in paths if not os.path.exists(p)]
    if missing:
        raise FileNotFoundError(
            "Real-mode export requires these artefacts; missing:\n  - "
            + "\n  - ".join(missing)
            + "\nRun: python pipeline/run_pipeline.py --mode real && "
            "python scripts/evaluate_real_hindcast.py"
        )


def _write_manifest(out_dir: str, mode: str, provenance: str, sources, disclosures) -> None:
    manifest = {
        "mode": mode,
        "provenance": provenance,
        "generated_utc": pd.Timestamp.utcnow().isoformat(),
        "generator": "scripts/export_json.py",
        "sources": [
            {
                "path": os.path.relpath(path, PROJECT_ROOT).replace("\\", "/"),
                "sha256": sha256_file(path) if os.path.exists(path) else None,
            }
            for path in sources
        ],
        "disclosures": disclosures,
    }
    _dump(os.path.join(out_dir, "export_manifest.json"), manifest, indent=2)


def _export_timeseries(df_routed: pd.DataFrame, out_dir: str) -> int:
    df = df_routed.copy()
    df["timestamp"] = _iso(df["timestamp"])
    # 30-min routing -> hourly for payload size, matching the UI chart window.
    df_hourly = df.iloc[::2].reset_index(drop=True)
    records = json.loads(df_hourly.to_json(orient="records", date_format="iso"))
    _dump(os.path.join(out_dir, "event_timeseries.json"), records)
    return len(records)


# --------------------------------------------------------------------------- #
# Demo export (unchanged scientific content, corrected provenance labels)
# --------------------------------------------------------------------------- #
def export_demo(out_dir: str = JSON_DIR) -> None:
    from pipeline.manning_calibration import calibrate_reach_manning
    from pipeline.muskingum_cunge import route_catchment_flow
    from pipeline.baseline import run_rainfall_baseline
    from pipeline.harvest_flag import compute_harvest_flags
    from pipeline.metrics import compare_model_vs_baseline

    print("=" * 60)
    print("  EXPORT MODE: DEMO (SYNTHETIC FIXTURES)")
    print("=" * 60)

    ds_swot = xr.open_dataset(os.path.join(FIXTURES_DIR, "swot_reaches.nc"))
    calibrated = {}
    for r_id in ds_swot["reach_id"].values:
        r_str = str(r_id)
        sub = ds_swot.sel(reach_id=r_id)
        calibrated[r_str] = calibrate_reach_manning(
            sub["wse"].values,
            sub["width"].values,
            sub["slope2"].values,
            sub["slope_u"].values,
            sub["quality_f"].values,
            sub["dark_frac"].values,
        )

    ds_imerg = xr.open_dataset(os.path.join(FIXTURES_DIR, "imerg_map.nc"))
    surma_rain = ds_imerg["precipitationCal"].sel(sub_basin="upper_surma_meghalaya").values
    time_index = pd.to_datetime(ds_imerg["time"].values, utc=True)
    target_params = calibrated["22211000011"]

    years = sorted(set(time_index.year))
    routed_dfs, baseline_dfs = [], []
    for year in years:
        mask = time_index.year == year
        df_y = route_catchment_flow(
            map_series=surma_rain[mask],
            time_index=time_index[mask],
            reach_params=target_params,
            catchment_area_km2=185.0,
            runoff_coeff=0.62,
            baseflow_m3s=35.0,
        )
        df_y = compute_harvest_flags(df_y, danger_level_m=DANGER_LEVEL_M)
        df_base_y = run_rainfall_baseline(df_y, threshold_watch=35.0, threshold_act=65.0)
        df_y["baseline_flag"] = df_base_y["baseline_flag"]
        df_y["baseline_rain_6h"] = df_base_y["baseline_rain_6h"]
        df_y["baseline_stage"] = np.round(7.74 + df_base_y["baseline_rain_6h"] * 0.045, 2)
        routed_dfs.append(df_y)
        baseline_dfs.append(df_base_y)

    df_routed = pd.concat(routed_dfs, ignore_index=True)
    df_baseline = pd.concat(baseline_dfs, ignore_index=True)

    df_gauge = pd.read_csv(
        os.path.join(FIXTURES_DIR, "gauge_kanaighat.csv"),
        dtype={"station_id": str, "reach_id": str},
    )
    df_gauge["timestamp"] = pd.to_datetime(df_gauge["timestamp"], utc=True)

    comparison = compare_model_vs_baseline(
        df_routed, df_baseline, df_gauge, danger_level_m=DANGER_LEVEL_M, test_period_only=True
    )
    hs_m, base_m = comparison["hydrosense"], comparison["baseline"]

    by_year = {}
    for year in years:
        comp_y = compare_model_vs_baseline(
            df_routed[df_routed["timestamp"].dt.year == year],
            df_baseline[df_baseline["timestamp"].dt.year == year],
            df_gauge[df_gauge["timestamp"].dt.year == year],
            danger_level_m=DANGER_LEVEL_M,
            test_period_only=False,
        )["hydrosense"]
        by_year[str(year)] = {
            "nse": round(comp_y["nse"], 2) if comp_y["nse"] is not None else None,
            "kge": round(comp_y["kge"], 2) if comp_y["kge"] is not None else None,
            "pbias": round(comp_y["pbias"], 1) if comp_y["pbias"] is not None else None,
            "timing_error_h": round(comp_y["timing_error_h"], 1),
            "lead_time_h": round(comp_y["lead_time_h"], 1) if comp_y["lead_time_h"] is not None else None,
            "formatted": comp_y["formatted"],
        }

    n_ts = _export_timeseries(df_routed, out_dir)
    print(f"  [1/6] event_timeseries.json ({n_ts} hourly records, 2020-2026)")

    gauge_out = df_gauge[["timestamp", "water_level_m", "danger_level_m"]].copy()
    gauge_out["timestamp"] = _iso(gauge_out["timestamp"])
    _dump(os.path.join(out_dir, "gauge_observations.json"), json.loads(gauge_out.to_json(orient="records")))
    print(f"  [2/6] gauge_observations.json ({len(gauge_out)} records)")

    cal_summary = {
        r_id: {
            "n": round(p["n"], 4),
            "z_bed": round(p["z_bed"], 2),
            "n_valid_passes": p["n_valid_passes"],
            "mean_slope2": float(f"{p['mean_slope2']:.2e}"),
            "mean_width": round(p["mean_width"], 1),
            "parameter_status": "synthetic_fixture_calibration",
        }
        for r_id, p in calibrated.items()
    }
    _dump(os.path.join(out_dir, "calibration_summary.json"), cal_summary, indent=2)
    print(f"  [3/6] calibration_summary.json ({len(cal_summary)} reaches)")

    metrics_out = {
        "provenance": DEMO_PROVENANCE,
        "validation_category": "synthetic_engineering_test",
        "is_observationally_calibrated": False,
        "limitations": DEMO_DISCLOSURES[0],
        "nse": round(hs_m["nse"], 2) if hs_m["nse"] is not None else None,
        "kge": round(hs_m["kge"], 2) if hs_m["kge"] is not None else None,
        "pbias": round(hs_m["pbias"], 1) if hs_m["pbias"] is not None else None,
        "timing_error_h": round(hs_m["timing_error_h"], 1),
        "lead_time_h": round(hs_m["lead_time_h"], 1) if hs_m["lead_time_h"] is not None else None,
        "formatted": hs_m["formatted"],
        "baseline": {
            "nse": round(base_m["nse"], 2) if base_m["nse"] is not None else None,
            "kge": round(base_m["kge"], 2) if base_m["kge"] is not None else None,
            "pbias": round(base_m["pbias"], 1) if base_m["pbias"] is not None else None,
            "timing_error_h": round(base_m["timing_error_h"], 1),
            "lead_time_h": round(base_m["lead_time_h"], 1) if base_m["lead_time_h"] is not None else None,
            "formatted": base_m["formatted"],
        },
        "comparison": comparison["comparison"],
        "by_year": by_year,
        "available_years": years,
        "danger_level_m": DANGER_LEVEL_M,
        "travel_time_h": 25.9,
        "imerg_latency_h": 4.0,
        "swot_last_geometry_date": "2026-03-25",
        "calibration_period": "Synthetic scenario calibration window",
        "test_period": "Synthetic April-May scenario; not an independent holdout",
        "disclosures": DEMO_DISCLOSURES,
    }
    _dump(os.path.join(out_dir, "metrics_summary.json"), metrics_out, indent=2)
    print(f"  [4/6] metrics_summary.json ({len(years)} synthetic years)")

    for rm in DEMO_REACH_META:
        params = calibrated.get(rm["reach_id"])
        rm["calibrated_n"] = round(params["n"], 4) if params else None
        rm["z_bed"] = round(params["z_bed"], 2) if params else None
        rm["slope_quality"] = (
            "good" if params and params["mean_slope2"] > 2e-5 else ("uncertain" if params else "unknown")
        )
        rm["parameter_status"] = "synthetic_fixture_calibration"
    _dump(os.path.join(out_dir, "reach_metadata.json"), DEMO_REACH_META, indent=2)
    print(f"  [5/6] reach_metadata.json ({len(DEMO_REACH_META)} reaches)")

    _write_manifest(
        out_dir,
        "demo",
        DEMO_PROVENANCE,
        [
            os.path.join(FIXTURES_DIR, "swot_reaches.nc"),
            os.path.join(FIXTURES_DIR, "imerg_map.nc"),
            os.path.join(FIXTURES_DIR, "gauge_kanaighat.csv"),
        ],
        DEMO_DISCLOSURES,
    )
    print("  [6/6] export_manifest.json (demo provenance)")


# --------------------------------------------------------------------------- #
# Real export
# --------------------------------------------------------------------------- #
def export_real(out_dir: str = JSON_DIR, real_dir: str = REAL_DIR, processed_dir: str = PROCESSED_DIR) -> None:
    print("=" * 60)
    print("  EXPORT MODE: REAL (NASA SWOT + GPM IMERG + BWDB SW266)")
    print("=" * 60)

    prov = validate_real_pipeline_inputs(real_dir)
    resolved = prov["resolved_paths"]

    geom_path = os.path.join(real_dir, "basin_geometry.json")
    event_path = os.path.join(processed_dir, "event_results_real.csv")
    metrics_path = os.path.join(processed_dir, "real_hindcast_metrics.json")
    cal_path = os.path.join(processed_dir, "calibration_results_real.json")
    _require([geom_path, event_path, metrics_path, cal_path])

    with open(geom_path, "r", encoding="utf-8") as fh:
        geom = json.load(fh)
    with open(metrics_path, "r", encoding="utf-8") as fh:
        hindcast = json.load(fh)
    with open(cal_path, "r", encoding="utf-8") as fh:
        calibration = json.load(fh)

    target_reach = str(geom.get("target_reach_id", hindcast.get("target_reach_id")))

    df_routed = pd.read_csv(event_path)
    df_routed["timestamp"] = pd.to_datetime(df_routed["timestamp"], utc=True)

    # Fail closed: the real export must never ship synthetic-labelled rows.
    labels = {str(v).upper() for v in df_routed["provenance"].dropna().unique()}
    if any("SYNTHETIC" in label for label in labels):
        raise ValueError(
            f"event_results_real.csv contains synthetic provenance labels {sorted(labels)}. "
            "Re-run: python pipeline/run_pipeline.py --mode real"
        )

    df_gauge = pd.read_csv(
        resolved["gauge"], dtype={"station_id": str, "reach_id": str}
    )
    df_gauge["timestamp"] = pd.to_datetime(df_gauge["timestamp"], utc=True)

    years = sorted(df_routed["timestamp"].dt.year.unique().tolist())
    period_start = df_routed["timestamp"].min()
    period_end = df_routed["timestamp"].max()

    # ---- 1. Event timeseries -------------------------------------------- #
    n_ts = _export_timeseries(df_routed, out_dir)
    print(f"  [1/6] event_timeseries.json ({n_ts} hourly records, {period_start.date()} -> {period_end.date()})")

    # ---- 2. Gauge observations (raw discrete readings only) ------------- #
    gauge_out = df_gauge[df_gauge["is_observed"] == True][
        ["timestamp", "water_level_m", "danger_level_m", "is_observed", "station_id"]
    ].copy()
    gauge_out["timestamp"] = _iso(gauge_out["timestamp"])
    _dump(os.path.join(out_dir, "gauge_observations.json"), json.loads(gauge_out.to_json(orient="records")))
    print(f"  [2/6] gauge_observations.json ({len(gauge_out)} raw BWDB observations, no interpolation)")

    # ---- 3. Calibration summary (literature assumptions) ---------------- #
    cal_summary = {}
    for r_id, params in calibration.items():
        cal_summary[str(r_id)] = {
            "n": params.get("n"),
            "n_calibrated": params.get("n_calibrated"),
            "n_lower_bound": params.get("n_lower_bound"),
            "n_upper_bound": params.get("n_upper_bound"),
            "z_bed": params.get("z_bed"),
            "z_bed_status": params.get("z_bed_status", "unresolved_assumed_from_low_wse"),
            "z_bed_uncertainty_m": params.get("z_bed_uncertainty_m"),
            "n_valid_passes": params.get("n_valid_passes"),
            "mean_slope2": params.get("mean_slope2"),
            "mean_width": params.get("mean_width"),
            "parameter_status": "provisional_literature_assumption",
            "calibration_period": params.get(
                "calibration_period",
                "Literature reference (Chow 1959; Arcement & Schneider 1989)",
            ),
        }
    _dump(os.path.join(out_dir, "calibration_summary.json"), cal_summary, indent=2)
    print(f"  [3/6] calibration_summary.json ({len(cal_summary)} reaches, literature n not fitted)")

    # ---- 4. Metrics summary (no NSE/KGE) -------------------------------- #
    m = hindcast.get("metrics", {}) or {}
    formatted = {
        "nse": "N/A",
        "kge": "N/A",
        "mae": f"{m.get('mae_relative_rise_m', float('nan')):.2f} m",
        "rmse": f"{m.get('rmse_relative_rise_m', float('nan')):.2f} m",
        "bias": f"{m.get('bias_relative_rise_m', float('nan')):+.2f} m",
        "peak_difference": f"{m.get('peak_stage_difference_m', float('nan')):+.2f} m",
        "lead_time": "N/A",
    }
    metrics_out = {
        "provenance": REAL_PROVENANCE,
        "validation_category": "retrospective_exploratory_hindcast",
        "status_tier": 3,
        "status_label": "Retrospective Exploratory Hindcast",
        "operational_forecast_skill_established": False,
        "is_observationally_calibrated": False,
        "limitations": REAL_DISCLOSURES[0],
        "nse": None,
        "kge": None,
        "pbias": None,
        "timing_error_h": None,
        "lead_time_h": None,
        "continuous_metrics_notice": hindcast.get(
            "continuous_metrics_notice",
            "Continuous NSE/KGE omitted per sparse gauge protocol (Trap T-H5).",
        ),
        "formatted": formatted,
        "real_hindcast": hindcast,
        "event_period": {
            "start": period_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "end": period_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
        },
        "available_years": years,
        "danger_level_m": DANGER_LEVEL_M,
        "target_reach_id": target_reach,
        "gauge_station": "SW266 Kanaighat",
        "datum": hindcast.get("datum"),
        "calibration_period": "Literature reference (Chow 1959; Arcement & Schneider 1989); not observational calibration",
        "test_period": "28 May - 4 June 2024 retrospective hindcast (Surma flash flood)",
        "disclosures": hindcast.get("disclosures", REAL_DISCLOSURES),
    }
    _dump(os.path.join(out_dir, "metrics_summary.json"), metrics_out, indent=2)
    print("  [4/6] metrics_summary.json (provenance=EXPLORATORY_REAL_INPUTS_ASSUMED_HYDRAULICS, nse=null)")

    # ---- 5. Reach metadata (real SWORD v16 reach IDs) ------------------- #
    reach_meta = []
    for r_id, reach in geom.get("reaches", {}).items():
        r_id = str(r_id)
        river = reach.get("river_name", "Surma")
        params = cal_summary.get(r_id, {})
        reach_meta.append(
            {
                "reach_id": r_id,
                "name": f"{river} — reach {r_id}",
                "name_bn": f"{BN_RIVER_NAMES.get(river, river)} — রিচ {r_id}",
                "river": river,
                "lat": reach.get("p_lat"),
                "lon": reach.get("p_lon"),
                "width_mean_m": reach.get("width_m"),
                "length_m": reach.get("length_m"),
                "has_gauge": r_id == target_reach,
                "gauge_station": "SW266 Kanaighat" if r_id == target_reach else None,
                "danger_level_m": DANGER_LEVEL_M if r_id == target_reach else None,
                "calibrated_n": params.get("n"),
                "n_lower_bound": params.get("n_lower_bound"),
                "n_upper_bound": params.get("n_upper_bound"),
                "z_bed": params.get("z_bed"),
                "z_bed_status": params.get("z_bed_status"),
                "slope_quality": "good" if (params.get("mean_slope2") or 0) > 2e-5 else "uncertain",
                "parameter_status": "provisional_literature_assumption",
            }
        )
    _dump(os.path.join(out_dir, "reach_metadata.json"), reach_meta, indent=2)
    print(f"  [5/6] reach_metadata.json ({len(reach_meta)} SWORD v16 reaches, target={target_reach})")

    # ---- 6. Manifest ---------------------------------------------------- #
    _write_manifest(
        out_dir,
        "real",
        REAL_PROVENANCE,
        [resolved["swot"], resolved["imerg"], resolved["gauge"], geom_path, event_path, metrics_path, cal_path],
        REAL_DISCLOSURES,
    )
    print("  [6/6] export_manifest.json (real provenance + SHA-256 of every source)")


# --------------------------------------------------------------------------- #
def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="Export HydroSense-SWOT pipeline data as UI JSON.")
    parser.add_argument(
        "--mode",
        choices=["demo", "real"],
        default="demo",
        help="Provenance mode. 'real' reads data/real/* and never touches data/fixtures/.",
    )
    parser.add_argument("--out-dir", default=None, help=f"Output directory (default: {JSON_DIR})")
    parser.add_argument("--real-dir", default=None, help=f"Real input directory (default: {REAL_DIR})")
    parser.add_argument("--processed-dir", default=None, help=f"Processed directory (default: {PROCESSED_DIR})")
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    out_dir = args.out_dir or JSON_DIR
    os.makedirs(out_dir, exist_ok=True)

    if args.mode == "real":
        export_real(
            out_dir=out_dir,
            real_dir=args.real_dir or REAL_DIR,
            processed_dir=args.processed_dir or PROCESSED_DIR,
        )
    else:
        if args.mode != "demo":
            raise SystemExit(f"Unsupported mode: {args.mode}")
        export_demo(out_dir=out_dir)

    print("\n  All JSON files exported to: " + out_dir)
    print("=" * 60)


if __name__ == "__main__":
    main()
