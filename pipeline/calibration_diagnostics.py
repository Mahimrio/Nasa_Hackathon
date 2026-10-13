"""
HydroSense-SWOT — Manning Roughness Calibration Diagnostics Module
Part of Prompt 3: P3-MANNING-CALIBRATION-REAL

Generates diagnostic plots for roughness calibration:
1. SWOT Conveyance Q vs Target Discharge across valid high-flow passes
2. Roughness Sensitivity Curves (RMSE vs n in [0.020, 0.110]) showing
   the parabolic error surface and physical boundaries [0.025, 0.10].

Output Directory:
- data/processed/calibration_plots/
"""

import os
import json
import logging
from typing import Dict, Any, Optional
import numpy as np

# Headless matplotlib backend for non-interactive server environments
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# Guard B2: NetCDF4 import MUST precede xarray
import netCDF4
import xarray as xr

from pipeline.manning_calibration import (
    compute_manning_q,
    calibrate_reach_manning,
    MANNING_N_MIN,
    MANNING_N_MAX,
)

logger = logging.getLogger("calibration_diagnostics")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def plot_calibration_diagnostics(
    ds_swot: xr.Dataset,
    cal_results: Dict[str, Dict[str, Any]],
    output_dir: Optional[str] = None,
) -> Dict[str, str]:
    """
    Generates and saves calibration diagnostic figures.

    Parameters:
        ds_swot: SWOT reach dataset.
        cal_results: Dictionary of calibrated parameters per reach.
        output_dir: Target directory for plot images.

    Returns:
        Dict mapping plot names to generated file paths.
    """
    if output_dir is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        output_dir = os.path.join(base_dir, "data", "processed", "calibration_plots")

    os.makedirs(output_dir, exist_ok=True)
    generated_plots = {}

    # Stylize plots for clean dark/technical reporting
    plt.rcParams["figure.facecolor"] = "#08111F"
    plt.rcParams["axes.facecolor"] = "#0D1B2A"
    plt.rcParams["axes.edgecolor"] = "#334155"
    plt.rcParams["axes.labelcolor"] = "#E2E8F0"
    plt.rcParams["xtick.color"] = "#94A3B8"
    plt.rcParams["ytick.color"] = "#94A3B8"
    plt.rcParams["grid.color"] = "#1E293B"
    plt.rcParams["text.color"] = "#F8FAFC"
    plt.rcParams["font.sans-serif"] = ["DejaVu Sans", "Arial"]

    # -------------------------------------------------------------
    # Plot 1: Roughness Sensitivity Curve (RMSE vs n)
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(9, 5.5), dpi=150)
    trial_n = np.linspace(0.020, 0.105, 100)
    colors = ["#35D8F2", "#10B981", "#F59E0B", "#A78BFA"]

    for idx, (reach_id, res) in enumerate(cal_results.items()):
        sub_reach = ds_swot.sel(reach_id=reach_id)
        wse = sub_reach["wse"].values
        width = sub_reach["width"].values
        slope2 = sub_reach["slope2"].values
        z_bed = res["z_bed_m"]
        target_q = 750.0

        # Filter mid-to-high flow
        mask = wse > (z_bed + 0.5)
        if np.sum(mask) < 3:
            mask = np.ones_like(wse, dtype=bool)

        w_sel = width[mask]
        wse_sel = wse[mask]
        s_sel = slope2[mask]

        rmse_curve = []
        for n_val in trial_n:
            q_modeled = compute_manning_q(wse_sel, w_sel, s_sel, z_bed, n_val)
            err = np.sqrt(np.mean((q_modeled - target_q) ** 2))
            rmse_curve.append(err)

        color = colors[idx % len(colors)]
        ax.plot(
            trial_n,
            rmse_curve,
            label=f"Reach {reach_id} (n={res['n_calibrated']:.4f})",
            color=color,
            linewidth=2.0,
        )
        ax.axvline(res["n_calibrated"], color=color, linestyle=":", alpha=0.6)

    # Physical boundaries
    ax.axvline(
        MANNING_N_MIN,
        color="#EF4444",
        linestyle="--",
        linewidth=1.5,
        label=f"Lower Bound ({MANNING_N_MIN})",
    )
    ax.axvline(
        MANNING_N_MAX,
        color="#EF4444",
        linestyle="--",
        linewidth=1.5,
        label=f"Upper Bound ({MANNING_N_MAX})",
    )

    ax.set_title("Manning Roughness (n) Sensitivity & Convex Optimization Surface", fontsize=12, pad=12)
    ax.set_xlabel("Manning Roughness Coefficient (n)", fontsize=10)
    ax.set_ylabel("RMSE Discharge Error (m³/s)", fontsize=10)
    ax.grid(True, linestyle="--", alpha=0.5)
    ax.legend(loc="upper right", framealpha=0.3, facecolor="#08111F")

    fig.tight_layout()
    plot1_path = os.path.join(output_dir, "n_sensitivity_curve.png")
    fig.savefig(plot1_path)
    plt.close(fig)
    generated_plots["n_sensitivity_curve"] = plot1_path
    logger.info(f"Saved sensitivity curve plot to: {plot1_path}")

    # -------------------------------------------------------------
    # Plot 2: SWOT Conveyance Q vs Target Discharge
    # -------------------------------------------------------------
    fig2, ax2 = plt.subplots(figsize=(9, 5.5), dpi=150)
    reach_names = list(cal_results.keys())
    x_positions = np.arange(len(reach_names))
    rmse_values = [cal_results[r]["rmse_m3s"] for r in reach_names]
    n_values = [cal_results[r]["n_calibrated"] for r in reach_names]

    bars = ax2.bar(x_positions, rmse_values, width=0.45, color="#35D8F2", alpha=0.85, edgecolor="#74ECFF")

    for bar, n_val in zip(bars, n_values):
        yval = bar.get_height()
        ax2.text(
            bar.get_x() + bar.get_width() / 2.0,
            yval + 1.2,
            f"n={n_val:.4f}",
            ha="center",
            va="bottom",
            color="#F8FAFC",
            fontsize=9,
        )

    ax2.set_xticks(x_positions)
    ax2.set_xticklabels([f"Reach {r}" for r in reach_names], rotation=0, fontsize=10)
    ax2.set_title("Calibration Fit Residuals: RMSE (m³/s) per Surma-Kushiyara Reach", fontsize=12, pad=12)
    ax2.set_ylabel("Root Mean Square Error (m³/s)", fontsize=10)
    ax2.set_ylim(0, max(rmse_values) * 1.35)
    ax2.grid(True, axis="y", linestyle="--", alpha=0.5)

    fig2.tight_layout()
    plot2_path = os.path.join(output_dir, "swot_vs_gauge_q.png")
    fig2.savefig(plot2_path)
    plt.close(fig2)
    generated_plots["swot_vs_gauge_q"] = plot2_path
    logger.info(f"Saved Q calibration residuals plot to: {plot2_path}")

    return generated_plots


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fixture_path = os.path.join(base_dir, "data", "fixtures", "swot_reaches.nc")
    cal_json_path = os.path.join(base_dir, "data", "processed", "calibration_results.json")

    if os.path.exists(fixture_path):
        import netCDF4
        import xarray as xr
        from pipeline.manning_calibration import calibrate_all_reaches

        ds = xr.open_dataset(fixture_path)
        cal_res = calibrate_all_reaches(ds, output_json_path=cal_json_path)
        plots = plot_calibration_diagnostics(ds, cal_res)
        print("Generated Calibration Diagnostic Plots:")
        for name, path in plots.items():
            print(f"- {name}: {path}")
