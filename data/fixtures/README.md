# HydroSense-SWOT Data Fixtures

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

> **Note:** These fixtures serve **Module 1 (Operational Flood Warning)**. Module 2 (Haor Rainfall Trend Explorer) operates on 26-year historical NASA GPM IMERG Final Run V07 data, which will reside in an isolated `data/trends/` directory to preserve these operational fixtures intact.
