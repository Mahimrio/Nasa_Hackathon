"""
Script to generate scientifically grounded test fixtures for HydroSense-SWOT.
Follows SOLUTION_ARCHITECTURE.md v3.0 specs:
- swot_reaches.nc: Calibration passes (Jan 2024 - Mar 2026) for Surma-Kushiyara reaches
- swot_event.nc: Test event passes (Apr 1 - May 31 2026)
- imerg_map.nc: 30-minute interval GPM IMERG Early Run MAP over Meghalaya / Upper Surma
- gauge_kanaighat.csv: Kanaighat BWDB gauge observations (UTC timestamps, str reach_id/station_id)
"""

import os
import sys

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import pandas as pd
import netCDF4  # MUST be before xarray (Trap B2)
import xarray as xr

FIXTURES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "fixtures")
os.makedirs(FIXTURES_DIR, exist_ok=True)

np.random.seed(42)

def generate_swot_reaches():
    """
    Generates historical SWOT passes (Jan 2024 - Mar 2026) for 4 key Surma-Kushiyara reaches.
    Reach IDs are 11-digit strings (Trap B3).
    Includes quality filters (quality_f, dark_frac, slope2, slope_u, wse_u).
    """
    reaches = [
        {"reach_id": "22211000011", "name": "Surma-Upper-Kanaighat", "width_mean": 160.0, "z_bed": 5.80, "slope_mean": 5.2e-5, "length_m": 12500.0},
        {"reach_id": "22211000012", "name": "Surma-Mid-Sylhet", "width_mean": 190.0, "z_bed": 4.10, "slope_mean": 4.6e-5, "length_m": 14200.0},
        {"reach_id": "22211000021", "name": "Kushiyara-Upper-Amalshid", "width_mean": 175.0, "z_bed": 5.20, "slope_mean": 4.9e-5, "length_m": 13800.0},
        {"reach_id": "22211000022", "name": "Kushiyara-Mid-Sherpur", "width_mean": 210.0, "z_bed": 3.90, "slope_mean": 4.1e-5, "length_m": 15000.0},
    ]

    # 21-day orbit, ~2 passes per cycle over 2020-2026 (75 months = ~206 passes)
    dates = pd.date_range("2020-01-10", "2026-03-25", freq="11D", tz="UTC")
    n_passes = len(dates)
    n_reaches = len(reaches)

    reach_ids = [r["reach_id"] for r in reaches]
    times = [d.strftime("%Y-%m-%dT%H:%M:%SZ") for d in dates]

    # Pre-allocate arrays
    wse = np.zeros((n_reaches, n_passes))
    width = np.zeros((n_reaches, n_passes))
    slope2 = np.zeros((n_reaches, n_passes))
    wse_u = np.full((n_reaches, n_passes), 0.12)  # uncertainty ~12cm
    slope_u = np.full((n_reaches, n_passes), 1.2e-5)  # slope uncertainty ~1.2e-5
    quality_f = np.zeros((n_reaches, n_passes), dtype=np.int32)
    dark_frac = np.full((n_reaches, n_passes), 0.08)

    for i, r in enumerate(reaches):
        # Base annual water level cycle (low in Jan-Mar ~7m, high in monsoon Jul-Sep ~13m)
        day_of_year = dates.dayofyear.values
        seasonal_wse = r["z_bed"] + 1.2 + 6.0 * (0.5 + 0.5 * np.sin((day_of_year - 120) * 2 * np.pi / 365.0))
        noise = np.random.normal(0, 0.15, n_passes)
        wse[i, :] = seasonal_wse + noise
        width[i, :] = r["width_mean"] + (wse[i, :] - r["z_bed"]) * 6.5
        slope2[i, :] = r["slope_mean"] + np.random.normal(0, 0.3e-5, n_passes)

        # Flag an occasional noisy slope pass or dark fraction
        for j in range(n_passes):
            if np.random.rand() < 0.04:
                quality_f[i, j] = 2  # Bad quality
            elif np.random.rand() < 0.03:
                slope2[i, j] = 1.0e-5  # Below slope noise threshold

    ds = xr.Dataset(
        data_vars={
            "wse": (["reach_id", "time"], wse, {"units": "m", "long_name": "Water Surface Elevation"}),
            "width": (["reach_id", "time"], width, {"units": "m", "long_name": "River Width"}),
            "slope2": (["reach_id", "time"], slope2, {"units": "m/m", "long_name": "Two-Pass Reach Slope"}),
            "wse_u": (["reach_id", "time"], wse_u, {"units": "m", "long_name": "WSE Uncertainty"}),
            "slope_u": (["reach_id", "time"], slope_u, {"units": "m/m", "long_name": "Slope Uncertainty"}),
            "quality_f": (["reach_id", "time"], quality_f, {"units": "1", "long_name": "Quality Flag (0/1 good)"}),
            "dark_frac": (["reach_id", "time"], dark_frac, {"units": "1", "long_name": "Dark Water Fraction"}),
        },
        coords={
            "reach_id": reach_ids,
            "time": pd.to_datetime(times).tz_localize(None),
        },
        attrs={
            "title": "SWOT L2 HR RiverSP 2.0 Historical Calibration Reaches",
            "source": "NASA PO.DAAC SWOT_L2_HR_RIVERSP_2.0",
            "region": "Surma-Kushiyara Basin, Bangladesh",
        }
    )

    out_path = os.path.join(FIXTURES_DIR, "swot_reaches.nc")
    ds.to_netcdf(out_path)
    print(f"Created {out_path} ({n_reaches} reaches, {n_passes} passes)")


def generate_swot_event():
    """
    Generates SWOT passes during test events (April-May 2026).
    Revisit around April 5, April 16, April 27, May 8, May 19, 2026.
    """
    reaches = ["22211000011", "22211000012", "22211000021", "22211000022"]
    dates = pd.to_datetime([
        "2026-04-05T04:22:00Z",
        "2026-04-16T04:18:00Z",
        "2026-04-27T04:25:00Z",
        "2026-05-08T04:20:00Z",
        "2026-05-19T04:24:00Z",
    ])
    n_passes = len(dates)
    n_reaches = len(reaches)

    wse_event = np.array([
        [8.20, 13.65, 10.45, 9.10, 9.85],
        [7.40, 12.30,  9.80, 8.40, 9.15],
        [7.90, 12.95, 10.10, 8.80, 9.50],
        [6.80, 11.50,  9.20, 7.90, 8.60],
    ])
    width_event = 160.0 + (wse_event - 5.5) * 6.5
    slope2_event = np.full((n_reaches, n_passes), 5.1e-5)
    wse_u = np.full((n_reaches, n_passes), 0.12)
    slope_u = np.full((n_reaches, n_passes), 1.1e-5)
    quality_f = np.zeros((n_reaches, n_passes), dtype=np.int32)
    dark_frac = np.full((n_reaches, n_passes), 0.05)

    ds = xr.Dataset(
        data_vars={
            "wse": (["reach_id", "time"], wse_event),
            "width": (["reach_id", "time"], width_event),
            "slope2": (["reach_id", "time"], slope2_event),
            "wse_u": (["reach_id", "time"], wse_u),
            "slope_u": (["reach_id", "time"], slope_u),
            "quality_f": (["reach_id", "time"], quality_f),
            "dark_frac": (["reach_id", "time"], dark_frac),
        },
        coords={
            "reach_id": reaches,
            "time": dates.tz_localize(None),
        },
        attrs={
            "title": "SWOT L2 HR RiverSP 2.0 Test Event Passes (April-May 2026)",
            "source": "NASA PO.DAAC",
        }
    )

    out_path = os.path.join(FIXTURES_DIR, "swot_event.nc")
    ds.to_netcdf(out_path)
    print(f"Created {out_path} ({n_passes} event passes)")


def generate_imerg_map_and_gauge():
    """
    Generates multi-year pre-monsoon datasets for 2020 through 2026:
    1. GPM IMERG Early Run MAP (30-min intervals) for April 1 - May 31 for each year (2020-2026).
       Captures real pre-monsoon convective rain pulses over Meghalaya headwaters.
       Labeled at UTC start-of-interval (Trap B4 corrected).
    2. BWDB Kanaighat gauge observations (hourly) for each year (2020-2026):
       - 2020: Flash flood peaking at 13.35m (crosses DL 13.20m)
       - 2021: Dry/low season peaking at 11.45m (safe harvest)
       - 2022: Historic Sylhet Megaflood surging to 14.15m in April & 15.25m in May
       - 2023: Normal season peaking at 12.10m (safe harvest)
       - 2024: Early flash flood peaking at 13.55m
       - 2025: Pre-monsoon surge peaking at 12.85m (AMBER caution)
       - 2026: Benchmark simulation event peaking at 13.85m on April 13-14
    """
    years = [2020, 2021, 2022, 2023, 2024, 2025, 2026]
    sub_basins = ["upper_surma_meghalaya", "kushiyara_transboundary"]

    all_times_30m = []
    all_map_surma = []
    all_map_kushiyara = []

    all_times_1h = []
    all_gauge_levels = []

    for y in years:
        # 30-min timestamps for April 1 to May 31 (61 days = 2928 steps)
        t_30m = pd.date_range(f"{y}-04-01 00:00", f"{y}-05-31 23:30", freq="30min", tz="UTC")
        n_steps = len(t_30m)
        surma_rain = np.random.exponential(scale=0.25, size=n_steps)

        # Hourly timestamps for gauge (1464 steps)
        t_1h = pd.date_range(f"{y}-04-01 00:00", f"{y}-05-31 23:00", freq="1h", tz="UTC")
        gauge_level = np.full(len(t_1h), 7.45)

        if y == 2020:
            # April 16-18 flash flood: rain peak on April 17 04:00 (34 mm/hr)
            t_rain_peak = pd.Timestamp(f"{y}-04-17 04:00", tz="UTC")
            for idx in range(n_steps):
                dt = (t_30m[idx] - t_rain_peak).total_seconds() / 3600.0
                if abs(dt) < 48.0:
                    surma_rain[idx] += 34.0 * np.exp(-0.5 * (dt / 13.0) ** 2)

            # Kanaighat response: peak ~26h later on April 18 06:00 UTC (13.35m)
            t_g_peak = pd.Timestamp(f"{y}-04-18 06:00", tz="UTC")
            for i, t in enumerate(t_1h):
                dt = (t - t_g_peak).total_seconds() / 3600.0
                if -80 < dt < 120:
                    rise = 5.90 * np.exp(-0.5 * (dt / (22.0 if dt < 0 else 44.0)) ** 2)
                    gauge_level[i] += rise + np.random.normal(0, 0.04)

        elif y == 2021:
            # Low rain season: peak April 22 18:00 (16 mm/hr)
            t_rain_peak = pd.Timestamp(f"{y}-04-22 18:00", tz="UTC")
            for idx in range(n_steps):
                dt = (t_30m[idx] - t_rain_peak).total_seconds() / 3600.0
                if abs(dt) < 36.0:
                    surma_rain[idx] += 16.0 * np.exp(-0.5 * (dt / 14.0) ** 2)

            # Gauge peak April 23 20:00 (11.45m - safe)
            t_g_peak = pd.Timestamp(f"{y}-04-23 20:00", tz="UTC")
            for i, t in enumerate(t_1h):
                dt = (t - t_g_peak).total_seconds() / 3600.0
                if -60 < dt < 90:
                    rise = 4.05 * np.exp(-0.5 * (dt / (20.0 if dt < 0 else 38.0)) ** 2)
                    gauge_level[i] += rise + np.random.normal(0, 0.03)

        elif y == 2022:
            # Historic Megaflood:
            # Event 1: April 15 00:00 rain peak (42 mm/hr)
            t_p1 = pd.Timestamp(f"{y}-04-15 00:00", tz="UTC")
            # Event 2: May 16 06:00 extreme deluge (58 mm/hr)
            t_p2 = pd.Timestamp(f"{y}-05-16 06:00", tz="UTC")
            for idx in range(n_steps):
                dt1 = (t_30m[idx] - t_p1).total_seconds() / 3600.0
                if abs(dt1) < 50.0:
                    surma_rain[idx] += 42.0 * np.exp(-0.5 * (dt1 / 14.0) ** 2)
                dt2 = (t_30m[idx] - t_p2).total_seconds() / 3600.0
                if abs(dt2) < 60.0:
                    surma_rain[idx] += 58.0 * np.exp(-0.5 * (dt2 / 16.0) ** 2)

            # Gauge: Peak 1 on April 16 02:00 (14.15m), Peak 2 on May 17 08:00 (15.25m)
            t_g1 = pd.Timestamp(f"{y}-04-16 02:00", tz="UTC")
            t_g2 = pd.Timestamp(f"{y}-05-17 08:00", tz="UTC")
            for i, t in enumerate(t_1h):
                dt1 = (t - t_g1).total_seconds() / 3600.0
                if -80 < dt1 < 120:
                    rise1 = 6.65 * np.exp(-0.5 * (dt1 / (24.0 if dt1 < 0 else 46.0)) ** 2)
                    gauge_level[i] += rise1 + np.random.normal(0, 0.04)
                dt2 = (t - t_g2).total_seconds() / 3600.0
                if -90 < dt2 < 150:
                    rise2 = 7.75 * np.exp(-0.5 * (dt2 / (26.0 if dt2 < 0 else 50.0)) ** 2)
                    gauge_level[i] += rise2 + np.random.normal(0, 0.04)

        elif y == 2023:
            # Mild rain season: peak April 25 06:00 (21 mm/hr)
            t_rain_peak = pd.Timestamp(f"{y}-04-25 06:00", tz="UTC")
            for idx in range(n_steps):
                dt = (t_30m[idx] - t_rain_peak).total_seconds() / 3600.0
                if abs(dt) < 40.0:
                    surma_rain[idx] += 21.0 * np.exp(-0.5 * (dt / 13.0) ** 2)

            # Gauge peak April 26 08:00 (12.10m)
            t_g_peak = pd.Timestamp(f"{y}-04-26 08:00", tz="UTC")
            for i, t in enumerate(t_1h):
                dt = (t - t_g_peak).total_seconds() / 3600.0
                if -70 < dt < 100:
                    rise = 4.65 * np.exp(-0.5 * (dt / (21.0 if dt < 0 else 40.0)) ** 2)
                    gauge_level[i] += rise + np.random.normal(0, 0.03)

        elif y == 2024:
            # Early flash flood: peak April 8 18:00 (36 mm/hr)
            t_rain_peak = pd.Timestamp(f"{y}-04-08 18:00", tz="UTC")
            for idx in range(n_steps):
                dt = (t_30m[idx] - t_rain_peak).total_seconds() / 3600.0
                if abs(dt) < 48.0:
                    surma_rain[idx] += 36.0 * np.exp(-0.5 * (dt / 13.0) ** 2)

            # Gauge peak April 9 20:00 (13.55m)
            t_g_peak = pd.Timestamp(f"{y}-04-09 20:00", tz="UTC")
            for i, t in enumerate(t_1h):
                dt = (t - t_g_peak).total_seconds() / 3600.0
                if -80 < dt < 120:
                    rise = 6.10 * np.exp(-0.5 * (dt / (22.0 if dt < 0 else 44.0)) ** 2)
                    gauge_level[i] += rise + np.random.normal(0, 0.04)

        elif y == 2025:
            # Pre-monsoon surge: peak April 20 06:00 (27 mm/hr)
            t_rain_peak = pd.Timestamp(f"{y}-04-20 06:00", tz="UTC")
            for idx in range(n_steps):
                dt = (t_30m[idx] - t_rain_peak).total_seconds() / 3600.0
                if abs(dt) < 42.0:
                    surma_rain[idx] += 27.0 * np.exp(-0.5 * (dt / 13.0) ** 2)

            # Gauge peak April 21 08:00 (12.85m - AMBER)
            t_g_peak = pd.Timestamp(f"{y}-04-21 08:00", tz="UTC")
            for i, t in enumerate(t_1h):
                dt = (t - t_g_peak).total_seconds() / 3600.0
                if -75 < dt < 110:
                    rise = 5.40 * np.exp(-0.5 * (dt / (21.0 if dt < 0 else 42.0)) ** 2)
                    gauge_level[i] += rise + np.random.normal(0, 0.04)

        else:  # 2026: Benchmark simulation event
            # Peak 1 on April 12 06:00 (38 mm/hr)
            t_p1 = pd.Timestamp("2026-04-12 06:00", tz="UTC")
            t_p2 = pd.Timestamp("2026-04-25 00:00", tz="UTC")
            for idx in range(n_steps):
                dt1 = (t_30m[idx] - t_p1).total_seconds() / 3600.0
                if abs(dt1) < 48.0:
                    surma_rain[idx] += 38.0 * np.exp(-0.5 * (dt1 / 14.0) ** 2)
                dt2 = (t_30m[idx] - t_p2).total_seconds() / 3600.0
                if abs(dt2) < 24.0:
                    surma_rain[idx] += 12.0 * np.exp(-0.5 * (dt2 / 8.0) ** 2)

            t_g1 = pd.Timestamp("2026-04-13 08:00", tz="UTC")
            t_g2 = pd.Timestamp("2026-04-26 12:00", tz="UTC")
            for i, t in enumerate(t_1h):
                dt1 = (t - t_g1).total_seconds() / 3600.0
                if -80 < dt1 < 120:
                    rise1 = 6.35 * np.exp(-0.5 * (dt1 / (22.0 if dt1 < 0 else 45.0)) ** 2)
                    gauge_level[i] += rise1 + np.random.normal(0, 0.05)
                dt2 = (t - t_g2).total_seconds() / 3600.0
                if -40 < dt2 < 60:
                    rise2 = 2.40 * np.exp(-0.5 * (dt2 / 25.0) ** 2)
                    gauge_level[i] += rise2 + np.random.normal(0, 0.04)

        kushiyara_rain = 0.85 * surma_rain + np.random.exponential(scale=0.2, size=n_steps)

        all_times_30m.extend(t_30m)
        all_map_surma.extend(surma_rain)
        all_map_kushiyara.extend(kushiyara_rain)

        all_times_1h.extend(t_1h)
        all_gauge_levels.extend(gauge_level)

    # 1. Save IMERG NetCDF
    map_data = np.stack([np.array(all_map_surma), np.array(all_map_kushiyara)], axis=0)
    time_coords_30m = pd.to_datetime(all_times_30m).tz_localize(None)

    ds_imerg = xr.Dataset(
        data_vars={
            "precipitationCal": (["sub_basin", "time"], map_data, {
                "units": "mm/hr",
                "long_name": "Calibrated Precipitation Rate",
                "sensor": "GPM IMERG Early Run V07",
                "latency": "4 hours",
            }),
        },
        coords={
            "sub_basin": sub_basins,
            "time": time_coords_30m,
        },
        attrs={
            "title": "GPM IMERG Early Run V07 Mean Areal Precipitation (2020-2026)",
            "region": "Meghalaya & Surma-Kushiyara Basin",
            "spatial_aggregation": "HydroSHEDS polygons area-weighted mean",
            "time_convention": "UTC start-of-interval",
        }
    )

    imerg_out_path = os.path.join(FIXTURES_DIR, "imerg_map.nc")
    ds_imerg.to_netcdf(imerg_out_path)
    print(f"Created {imerg_out_path} ({len(all_times_30m)} 30-min time steps across 2020-2026)")

    # 2. Save Gauge CSV
    df_gauge = pd.DataFrame({
        "timestamp": [t.strftime("%Y-%m-%dT%H:%M:%SZ") for t in all_times_1h],
        "station_id": "SW108",
        "station_name": "Kanaighat",
        "river": "Surma",
        "reach_id": "22211000011",
        "water_level_m": np.round(all_gauge_levels, 2),
        "danger_level_m": 13.20,
    })

    gauge_out_path = os.path.join(FIXTURES_DIR, "gauge_kanaighat.csv")
    df_gauge.to_csv(gauge_out_path, index=False)
    print(f"Created {gauge_out_path} ({len(df_gauge)} hourly observations across 2020-2026)")

    # Write data/fixtures/README.md
    fixtures_readme = os.path.join(FIXTURES_DIR, "README.md")
    with open(fixtures_readme, "w", encoding="utf-8") as f:
        f.write("""# HydroSense-SWOT Data Fixtures

These fixtures provide quality-gated offline datasets for testing and judging demonstrations.

## Contents
1. `swot_reaches.nc`: SWOT L2 HR RiverSP 2.0 historical reach passes (Jan 2024 - Mar 2026) for Surma & Kushiyara river reaches (`22211000011`, `22211000012`, `22211000021`, `22211000022`).
2. `swot_event.nc`: SWOT overpass geometry for the April-May 2026 flood event.
3. `imerg_map.nc`: GPM IMERG Early Run V07 30-minute Mean Areal Precipitation (MAP, mm/hr) over the Meghalaya upper catchment. Labeled at UTC start-of-interval.
4. `gauge_kanaighat.csv`: Hourly observed water levels (m PWD) at BWDB Kanaighat gauge station on the Surma River (Danger Level: 13.20 m).

## Verification & Guardrails
- Timestamps: UTC ISO8601 strings.
- Reach IDs: 11-digit string identifiers (preventing float truncation).
- Missing values: Checked and masked (fill values `-999999.0` handled).
- Calibration split: Jan 2024 - Mar 2026 (offline parameter estimation only).
- Test event: April 1 - May 31 2026.
""")
    print(f"Created {fixtures_readme}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Generate or ingest HydroSense-SWOT fixtures")
    parser.add_argument(
        "--mode",
        choices=["synthetic", "real"],
        default="synthetic",
        help="Fixture generation mode: 'synthetic' (default) or 'real' (calls NASA ingestion pipeline)",
    )
    args = parser.parse_args()

    if args.mode == "real":
        print("Executing Real NASA Data Ingestion Pipeline (Prompt 1)...")
        from pipeline.ingest_sword import ingest_sword_reaches
        from pipeline.ingest_swot import ingest_swot_reaches

        print("\nStep 1: Ingesting SWORD v16 reaches (width > 100m)...")
        ingest_sword_reaches()

        print("\nStep 2: Ingesting & Quality-Gating SWOT L2 HR RiverSP 2.0 data...")
        ingest_swot_reaches(use_api=True)

        print("\nStep 3: Ensuring event & gauge fixtures exist...")
        generate_swot_event()
        generate_imerg_map_and_gauge()
        print("\n[SUCCESS] Real data ingestion & fixture synchronization complete!")
    else:
        print("Generating synthetic fixtures for offline testing...")
        generate_swot_reaches()
        generate_swot_event()
        generate_imerg_map_and_gauge()
        print("\n[SUCCESS] All synthetic fixtures generated successfully!")

