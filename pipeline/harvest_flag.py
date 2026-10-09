"""
Harvest Decision Flag Module for HydroSense-SWOT.
Follows SOLUTION_ARCHITECTURE.md v3.0 Section 3.4 & Tier 4:
- Computes operational Harvest Flag based on threshold crossing timing
- Warning states: GREEN (Wait / অপেক্ষা করুন), AMBER (Prepare / প্রস্তুতি নিন), RED (Harvest Now / দ্রুত ধান কাটুন)
- Danger level for Surma at Kanaighat: 13.20 m PWD
"""

import numpy as np
import pandas as pd

def compute_harvest_flags(df_routing, danger_level_m=13.20, lead_steps=48):
    """
    Computes harvest flags by looking ahead by lead_steps (default 48 steps * 30 min = 24 hours).
    
    Parameters:
    - df_routing: DataFrame containing 'modelled_stage'
    - danger_level_m: Flood threshold in meters (default 13.20m for Kanaighat)
    - lead_steps: Number of forward time steps to evaluate future crest
    
    Returns:
    - Updated DataFrame with 'harvest_flag', 'future_stage', 'advisory_en', 'advisory_bn'
    """
    df = df_routing.copy()
    n = len(df)
    stages = df["modelled_stage"].values

    future_stage = np.zeros(n)
    for i in range(n):
        # Look forward within the routing window
        end_idx = min(i + lead_steps, n)
        future_stage[i] = np.max(stages[i:end_idx])

    amber_threshold = 0.80 * danger_level_m  # 10.56 m

    flags = []
    adv_en = []
    adv_bn = []

    for f_lvl in future_stage:
        if f_lvl >= danger_level_m:
            flags.append("RED")
            adv_en.append("CRITICAL: Surge breach imminent within 24h. Harvest mature Boro immediately.")
            adv_bn.append("জরুরি: আগামী ২৪ ঘণ্টার মধ্যে বাঁধ উপচে পড়ার আশঙ্কা। এখনই ধান কাটুন।")
        elif f_lvl >= amber_threshold:
            flags.append("AMBER")
            adv_en.append("WATCH: River rising rapidly. Prepare labor and harvest within 12-24 hours.")
            adv_bn.append("সতর্কতা: নদীর পানি দ্রুত বাড়ছে। ১২-২৪ ঘণ্টার মধ্যে ধান কাটার প্রস্তুতি নিন।")
        else:
            flags.append("GREEN")
            adv_en.append("NORMAL: Water level within safe channel capacity. No immediate harvest required.")
            adv_bn.append("স্বাভাবিক: পানি বিপৎসীমার নিচে। তাৎক্ষণিক ধান কাটার প্রয়োজন নেই।")

    df["future_stage"] = np.round(future_stage, 2)
    df["harvest_flag"] = flags
    df["advisory_en"] = adv_en
    df["advisory_bn"] = adv_bn

    return df
