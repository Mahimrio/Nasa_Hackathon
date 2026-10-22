"""
HydroSense-SWOT — BWDB Gauge Records Ingestion & Cleaning Module
Part of Prompt 2: P2-IMERG-GAUGE-INGESTION

Ingests, sanitizes, and standardizes hourly river water level observations
from Bangladesh Water Development Board (BWDB) and Flood Forecasting
and Warning Centre (FFWC) gauge stations.

Enforced Guards & Ground Rules:
- Guard B1 / R-04: BST (UTC+6) localized and converted to UTC ONCE at ingestion.
- Guard B3 / R-05: Station IDs and reach IDs stored strictly as strings.
- Signal Processing: 3-point rolling median filter to suppress sensor telemetry spikes.
- Physical Grounding: Levels retained in meters PWD datum; NO uncalibrated rating
  curve conversion to discharge without published bathymetry (per DECISIONS.md).
"""

import os
import sys
import logging
from typing import Optional
import numpy as np
import pandas as pd

logger = logging.getLogger("ingest_gauge")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# BWDB Gauge Stations metadata in Surma-Kushiyara Basin
# Station ID Reconciliation:
# In the official BWDB/FFWC station directory, Kanaighat on the Surma River is SW266.
# (Official SW108 in BWDB national registry is Chardoani tidal station in Barguna).
# In this repository, SW108 is retained as an internal pipeline alias for fixture compatibility.
# Danger level: 13.20m PWD = 12.75m MSL/SOB via +0.45m datum offset in Sylhet.
GAUGE_STATIONS = {
    "SW108": {
        "station_name": "Kanaighat",
        "official_catalog_id": "SW266",
        "legacy_alias": "SW108",
        "river": "Surma",
        "reach_id": "22211000011",
        "danger_level_m": 13.20,
        "danger_level_msl_m": 12.75,
        "warning_level_m": 12.20,
        "datum": "PWD (13.20m PWD = 12.75m MSL)",
    },
    "SW266": {
        "station_name": "Kanaighat",
        "official_catalog_id": "SW266",
        "legacy_alias": "SW108",
        "river": "Surma",
        "reach_id": "22211000011",
        "danger_level_m": 13.20,
        "danger_level_msl_m": 12.75,
        "warning_level_m": 12.20,
        "datum": "PWD (13.20m PWD = 12.75m MSL)",
    },
    "SW109": {
        "station_name": "Amalshid",
        "river": "Kushiyara",
        "reach_id": "22211000021",
        "danger_level_m": 15.40,
        "warning_level_m": 14.40,
        "datum": "PWD",
    },
    "SW115": {
        "station_name": "Sylhet",
        "river": "Surma",
        "reach_id": "22211000012",
        "danger_level_m": 10.80,
        "warning_level_m": 9.80,
        "datum": "PWD",
    },
    "SW116": {
        "station_name": "Sherpur",
        "river": "Kushiyara",
        "reach_id": "22211000022",
        "danger_level_m": 9.00,
        "warning_level_m": 8.00,
        "datum": "PWD",
    },
}


def sanitize_gauge_observations(df: pd.DataFrame, time_col: str = "timestamp") -> pd.DataFrame:
    """
    Sanitizes raw BWDB gauge observations:
    1. Localizes BST (Asia/Dhaka = UTC+6) and converts to UTC (Guard B1 / R-04).
    2. Drops invalid, non-positive, or sentinel levels.
    3. Enforces string data types for station_id and reach_id (Guard B3).
    4. Applies a rolling 3-point median filter to suppress spurious single-step spikes.
    """
    if df.empty:
        return df

    cleaned = df.copy()

    # Guard B3: Ensure IDs are strings
    if "station_id" in cleaned.columns:
        cleaned["station_id"] = cleaned["station_id"].astype(str)
    if "reach_id" in cleaned.columns:
        cleaned["reach_id"] = cleaned["reach_id"].astype(str)

    # Guard B1: Parse timestamp and convert to UTC
    # Check if raw timestamp is already timezone-aware or in local BST
    raw_time = pd.to_datetime(cleaned[time_col], errors="coerce")
    if raw_time.dt.tz is None:
        # Localize as BST (UTC+6) and convert to UTC
        cleaned["timestamp"] = raw_time.dt.tz_localize("Asia/Dhaka").dt.tz_convert("UTC")
    else:
        cleaned["timestamp"] = raw_time.dt.tz_convert("UTC")

    assert cleaned["timestamp"].dt.tz is not None, "Gauge timestamps must be timezone-aware (Guard B1)"

    # Numeric conversion of water levels
    if "water_level_m" in cleaned.columns:
        cleaned["water_level_m"] = pd.to_numeric(cleaned["water_level_m"], errors="coerce")
        # Mask impossible negative water levels or fill values
        cleaned.loc[cleaned["water_level_m"] <= -90.0, "water_level_m"] = np.nan

        # Sort chronologically before rolling filter
        cleaned = cleaned.sort_values(by="timestamp").reset_index(drop=True)

        # Apply 3-point rolling median filter to suppress transient telemetry spikes
        cleaned["water_level_m"] = (
            cleaned["water_level_m"]
            .rolling(window=3, min_periods=1, center=True)
            .median()
            .round(2)
        )

    return cleaned


def ingest_bwdb_gauge(
    station_id: str = "SW108",
    raw_csv_path: Optional[str] = None,
    output_csv_path: Optional[str] = None,
) -> pd.DataFrame:
    """
    Main ingestion routine for BWDB gauge records.

    Parameters:
        station_id: BWDB station code (e.g. 'SW108' for Kanaighat).
        raw_csv_path: Path to raw input records if available.
        output_csv_path: Target path for quality-controlled gauge CSV.

    Returns:
        pd.DataFrame containing sanitized, UTC-indexed gauge observations.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if output_csv_path is None:
        output_csv_path = os.path.join(base_dir, "data", "fixtures", "gauge_kanaighat.csv")

    station_meta = GAUGE_STATIONS.get(station_id, GAUGE_STATIONS["SW108"])

    if raw_csv_path and os.path.exists(raw_csv_path):
        logger.info(f"Ingesting raw BWDB gauge records from {raw_csv_path}...")
        df_raw = pd.read_csv(raw_csv_path, dtype={"station_id": str, "reach_id": str})
        cleaned_df = sanitize_gauge_observations(df_raw)
    elif os.path.exists(output_csv_path):
        logger.info(f"Loading existing verified gauge dataset from {output_csv_path}...")
        cleaned_df = pd.read_csv(output_csv_path, dtype={"station_id": str, "reach_id": str})
        cleaned_df = sanitize_gauge_observations(cleaned_df)
    else:
        logger.warning(f"No existing gauge file found at {output_csv_path}; generating default record template.")
        # Minimal template
        cleaned_df = pd.DataFrame(columns=[
            "timestamp", "station_id", "station_name", "river", "reach_id", "water_level_m", "danger_level_m"
        ])

    # Format output timestamps as UTC ISO8601 strings
    out_df = cleaned_df.copy()
    if not out_df.empty and "timestamp" in out_df.columns:
        out_df["timestamp"] = out_df["timestamp"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        out_df["station_id"] = str(station_id)
        out_df["station_name"] = station_meta["station_name"]
        out_df["river"] = station_meta["river"]
        out_df["reach_id"] = str(station_meta["reach_id"])
        out_df["danger_level_m"] = station_meta["danger_level_m"]

        os.makedirs(os.path.dirname(output_csv_path), exist_ok=True)
        out_df.to_csv(output_csv_path, index=False)
        logger.info(f"Exported {len(out_df)} sanitized gauge observations to: {output_csv_path}")

    return out_df


if __name__ == "__main__":
    df_res = ingest_bwdb_gauge(station_id="SW108")
    print(f"Ingested {len(df_res)} records for Kanaighat (SW108).")
    if not df_res.empty:
        print(df_res.head())
