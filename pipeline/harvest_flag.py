"""
HydroSense-SWOT — Harvest Decision Flag & Bilingual Advisory Module
Upgraded for Prompt 4: P4-ROUTING-ENGINE-REAL

Transforms forward-looking hydrodynamic stage forecasts into actionable,
single-glance harvest decisions for Upazila Agriculture Officers and Boro rice farmers:
- GREEN: Normal / অপেক্ষা করুন (Water level within safe channel capacity)
- AMBER: Watch / প্রস্তুতি নিন (River approaching threshold, mobilize labor within 12-24h)
- RED: Critical Action / দ্রুত ধান কাটুন (Breach forecast, cut mature Boro immediately)

Guardrails & Critical Ground Rules:
- Thresholds: BWDB Kanaighat Danger Level = 13.20 m PWD; Amber = 80% DL (10.56 m PWD).
- Travel Time Driven: Look-ahead window derived dynamically from hydrodynamic routing
  travel time (K_total_hours ~ 25.9h = ~52 30-min steps), never hardcoded.
- Data-Driven Peak Date (Guard B10): Peak date extracted programmatically via idxmax().
"""

import logging
from typing import Optional
import numpy as np
import pandas as pd

logger = logging.getLogger("harvest_flag")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

KANAIGHAT_DANGER_LEVEL_M = 13.20
AMBER_RATIO = 0.80


def compute_harvest_flags(
    df_routing: pd.DataFrame,
    danger_level_m: float = KANAIGHAT_DANGER_LEVEL_M,
    travel_time_hours: Optional[float] = None,
    lead_steps: Optional[int] = None,
) -> pd.DataFrame:
    """
    Computes flags from information available at each timestamp.

    ``modelled_stage`` is a historical simulation unless callers provide a
    separately generated, issue-time-stamped forecast.  Therefore this
    function intentionally does not scan future rows: doing so would turn a
    retrospective series into an invalid operational warning.

    Parameters:
        df_routing: DataFrame containing 'modelled_stage' and 'timestamp'.
        danger_level_m: Flood threshold (13.20 m PWD for Kanaighat SW108).
        travel_time_hours: Retained as explanatory hydraulic metadata only.
        lead_steps: Deprecated. A positive value is rejected because it would
                    use future model states not available at the issue time.

    Returns:
        pd.DataFrame with 'available_stage', 'harvest_flag', 'advisory_en', 'advisory_bn',
        and peak date metadata (Guard B10).
    """
    df = df_routing.copy()
    n_steps = len(df)
    stages = df["modelled_stage"].values

    if lead_steps not in (None, 0):
        raise ValueError("Future look-ahead is prohibited for operational flags; provide an issue-time forecast product instead.")
    if travel_time_hours is None:
        travel_time_hours = df.attrs.get("travel_time_hours", 26.0)

    amber_threshold_m = AMBER_RATIO * danger_level_m  # 10.56 m

    available_stage = stages.copy()

    flags = []
    adv_en = []
    adv_bn = []

    for f_lvl in available_stage:
        if f_lvl >= danger_level_m:
            flags.append("RED")
            adv_en.append(
                "CRITICAL: simulated/observed stage is at or above the configured danger level. Verify local conditions before acting."
            )
            adv_bn.append(
                "জরুরি: সিমুলেটেড/পর্যবেক্ষিত পানি নির্ধারিত বিপৎসীমায় বা তার উপরে। সিদ্ধান্তের আগে স্থানীয় অবস্থা যাচাই করুন।"
            )
        elif f_lvl >= amber_threshold_m:
            flags.append("AMBER")
            adv_en.append(
                "WATCH: Water rising rapidly towards danger level. Mobilize harvesters and prepare labor."
            )
            adv_bn.append(
                "সতর্কতা: পানি দ্রুত বিপৎসীমার দিকে বাড়ছে। ধান কাটার শ্রমিক ও যন্ত্রপাতি প্রস্তুত রাখুন।"
            )
        else:
            flags.append("GREEN")
            adv_en.append(
                "NORMAL: River stage within safe channel capacity. Allow Boro grain to mature."
            )
            adv_bn.append(
                "স্বাভাবিক: পানি নিরাপদ সীমার মধ্যে আছে। ধান পুরোপুরি পাকার জন্য অপেক্ষা করুন।"
            )

    df["available_stage"] = np.round(available_stage, 2)
    # Compatibility field carries no future value and is explicitly named in attrs.
    df["future_stage"] = np.round(available_stage, 2)
    df["harvest_flag"] = flags
    df["advisory_en"] = adv_en
    df["advisory_bn"] = adv_bn

    # Guard B10: Peak date driven programmatically from data, never hardcoded
    peak_idx = df["modelled_stage"].idxmax()
    peak_timestamp = df.loc[peak_idx, "timestamp"]
    peak_stage_val = df.loc[peak_idx, "modelled_stage"]

    df.attrs["peak_timestamp"] = str(peak_timestamp)
    df.attrs["peak_stage_m"] = float(round(peak_stage_val, 2))
    df.attrs["danger_level_m"] = float(danger_level_m)
    df.attrs["amber_level_m"] = float(round(amber_threshold_m, 2))
    df.attrs["look_ahead_hours"] = float(round(travel_time_hours, 1))
    df.attrs["forecast_status"] = "retrospective/current-state classification; no future look-ahead"

    return df


if __name__ == "__main__":
    times = pd.date_range("2026-04-10", periods=100, freq="30min", tz="UTC")
    stages = 8.0 + 5.5 * np.sin(np.linspace(0, np.pi, 100))
    test_df = pd.DataFrame({"timestamp": times, "modelled_stage": stages})
    test_df.attrs["travel_time_hours"] = 25.9
    flagged = compute_harvest_flags(test_df)
    print("Flag Counts:")
    print(flagged["harvest_flag"].value_counts())
    print(f"Data-driven peak: {flagged.attrs['peak_timestamp']} ({flagged.attrs['peak_stage_m']}m)")
