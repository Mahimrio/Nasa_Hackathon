"""
Unit and integration tests for Module 1 Real-Data Pipeline and Retrospective Hindcast Evaluation.
Verifies compliance with MODULE_1_REAL_DATA_BUILD_PROMPTS.md.
"""

import os
import json
import pytest
import numpy as np
import pandas as pd
from pathlib import Path

from pipeline.provenance import validate_real_pipeline_inputs
from scripts.evaluate_real_hindcast import align_sparse_observations, compute_metrics

PROJECT_ROOT = Path(__file__).resolve().parent.parent
REAL_DIR = os.path.join(PROJECT_ROOT, "data", "real")
PROCESSED_DIR = os.path.join(PROJECT_ROOT, "data", "processed")
EVIDENCE_DIR = os.path.join(PROJECT_ROOT, "docs", "evidence")


def test_real_provenance_manifest_complete():
    """Verifies that data/real passes strict fail-closed provenance validation."""
    prov = validate_real_pipeline_inputs(REAL_DIR)
    assert "resolved_paths" in prov
    assert "swot" in prov["resolved_paths"]
    assert "gauge" in prov["resolved_paths"]
    assert "imerg" in prov["resolved_paths"]
    assert all(os.path.exists(p) for p in prov["resolved_paths"].values())


def test_basin_geometry_topology():
    """Verifies independently delineated basin geometry without synthetic 185 km² benchmark."""
    geom_file = os.path.join(REAL_DIR, "basin_geometry.json")
    assert os.path.exists(geom_file)
    with open(geom_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data["target_reach_id"] == "45220400591"
    assert data["catchment_area_km2"] > 200.0  # Independently delineated quickflow
    assert "macro_barak_basin_km2" in data
    assert data["total_surma_length_km"] > 100.0
    assert len(data["reaches"]) >= 19


def test_sparse_gauge_protocol_alignment():
    """Verifies alignment retains only is_observed == True points without interpolation."""
    gauge_file = os.path.join(REAL_DIR, "gauge_sw266.csv")
    assert os.path.exists(gauge_file)
    df_obs = pd.read_csv(gauge_file)
    assert all(df_obs["is_observed"] == True)
    assert all(df_obs["is_interpolated"] == False)

    # Synthetic simulation for testing alignment
    times = pd.date_range("2024-05-26", "2024-06-04", freq="30min", tz="UTC")
    df_sim = pd.DataFrame(
        {
            "timestamp": times,
            "modelled_stage": 4.5 + np.sin(np.linspace(0, 3.14, len(times))) * 2.5,
            "routed_q": np.linspace(30.0, 300.0, len(times)),
        }
    )

    aligned = align_sparse_observations(df_sim, df_obs, tolerance_minutes=15)
    assert not aligned.empty
    assert all(aligned["is_observed"] == True)
    assert "obs_rise_m" in aligned
    assert "sim_rise_m" in aligned
    assert "residual_rise_m" in aligned


def test_hindcast_report_and_figures_generated():
    """Verifies that retrospective hindcast report and figures are generated with required disclosures."""
    report_path = os.path.join(EVIDENCE_DIR, "real_hindcast_report.md")
    fig_path = os.path.join(
        EVIDENCE_DIR, "figures", "real_hindcast_stage_comparison.png"
    )

    assert os.path.exists(report_path), "Missing real_hindcast_report.md"
    assert os.path.exists(fig_path), "Missing real_hindcast_stage_comparison.png"

    with open(report_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Verify status tiers
    assert "Tier 1" in content
    assert "Tier 2" in content
    assert "Tier 3" in content
    assert "Tier 4" in content
    assert "NOT ESTABLISHED" in content

    # Verify mandatory disclosures
    assert "WGS84 ellipsoid" in content
    assert "Public Works Department (PWD)" in content
    assert "relative stage anomalies" in content or "relative stage-rise" in content
    assert "provisional literature assumptions" in content
    assert (
        "Continuous metrics (NSE, KGE) are prohibited" in content
        or "Continuous Metrics (NSE, KGE)" in content
    )
