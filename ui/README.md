# HydroSense-SWOT — Next.js Delivery Dashboard

This is the Tier 4 User Delivery Interface for HydroSense-SWOT, built with **Next.js 16 (App Router)** and **Recharts**, conforming to the authoritative specification in [docs/DESIGN_ARCHITECTURE.md](../docs/DESIGN_ARCHITECTURE.md).

## Overview
The dashboard provides Upazila Agriculture Officers in the flood-prone Haor basin (Sunamganj & Sylhet, Bangladesh) with an actionable, single-glance early warning tool for Boro rice harvest decisions.

> **Project Modules & UI Roadmap:**
> - **Module 1 (Operational Flood Warning) `[IMPLEMENTED]`:** Currently active interface across `/dashboard`, `/forecast`, and `/advisory`, rendering 30-minute hydraulic routing replay, 5-second triage, and harvest directives.
> - **Module 2 (Haor Rainfall Trend Explorer) `[IMPLEMENTED - FAIL-CLOSED ON REAL DATA]`:** Active interface at `/trends`, providing decadal retrospective analysis of NASA GPM IMERG Final Run precipitation data ($PRCPTOT$ and $R50mm$) with cell-first aggregation, Theil-Sen slope, and Modified Mann-Kendall test under serial autocorrelation.

### Core Features & Architecture
- **Cartographic River Reach Map (`RiverMapPanel.js`):** Hero geospatial visualization of the Surma-Kushiyara river network featuring:
  - High-density OSM river relations (5904030 Surma, 5904029 Kushiyara) hugging natural meanders.
  - Stationary BWDB Kanaighat gauge station pin (`SW266` / `SW108`) at 24.9980°N, 92.2594°E.
  - Meghalaya mountain plateau relief shading and Haor depression wetland contours.
  - 120 km SWOT satellite ground track footprint overlay.
  - Interactive reach selection linking directly to the hydraulic inspector.
- **Harvest Decision Engine (`HarvestDecisionPanel.js`):** Prominent glowing status indicator (NORMAL / WATCH / CRITICAL) with:
  - Bilingual agricultural advisory (English / বাংলা) instructing immediate or scheduled harvest.
  - Physical water column progress bar comparing modelled stage against the 13.20 m PWD danger level.
  - Monospace hydraulic telemetry readout (Modelled stage, danger level, clearance buffer, BWDB observed level, wave travel time ~25.9h, warning lead time 22.5h).
- **Synchronized Dual Hydrograph (`HydrographPanel.js`):**
  - Inverted GPM IMERG Early Run rainfall hyetograph (mm/h) with cyan-to-blue gradient bars.
  - Main stage hydrograph with modelled water levels, BWDB observed gauge readings, and dynamic $\pm 0.18\text{ m}$ analytical uncertainty envelope.
  - Operational danger level reference line (13.20 m PWD).
  - Current-time vertical reference cursor line.
  - Full simulation replay engine with Play/Pause loop, 1x/2x/5x speed selector, single editable hour-skip control, and day rail.
- **Scientific Validation Benchmarks (`ValidationMetricsPanel.js`):** 5-column metric cards:
  - NSE (`0.73`), KGE (`0.68`), PBIAS (`+1.9%`), Peak Timing Error (`-2.0 h`), and Warning Lead Time (`22.5 h`).
  - Interactive infomorphism definition popovers explaining formulas and benchmark criteria on hover.
  - *Audit note:* Baseline comparison logic audited and verified against true persistence/threshold benchmark (`docs/evidence/evaluation_split_baseline_and_metrics.md`).
- **Operational Limits Panel (`OperationalLimitsPanel.js`):** Expanded by default with a persistent, accessible heading and control; its physical constraints can be collapsed, covering SWOT spatial resolution (>100 m), slope noise filtering, IMERG orographic bias, and routing regime.
- **Interactive Modals:**
  - `ReachInspectorModal.js`: Detailed SWOT hydraulic profile (Manning $n$, bed elevation $z_{bed}$, channel width, length, slope quality, overpass pass count).
  - `AdvisoryBulletinModal.js`: Formatted, printable emergency harvest advisory bulletin for field dispatch.
  - `ModelArchitectureModal.js`: Educational dialog breaking down the 4-tier hydrologic routing framework.

## Visual & Motion Design System
- **Design Tokens:** Defined centrally in `ui/app/globals.css` following `DESIGN_ARCHITECTURE.md` (Calm, high-contrast light theme: `#F5F8FA` canvas, `#FFFFFF` cards, `#173B57` text, `#287BB5` river blue).
- **Accessibility & Motion:** Full `@media (prefers-reduced-motion: reduce)` compliance and CVD-safe semantic palette (Green `#34805A`, Amber `#B7791F`, Red `#B4232F`).
- **Bilingual Parity:** 100% parity across English and Bengali (`Noto Sans Bengali`) with zero clipping.

## Data Consumption
The UI consumes static JSON files exported directly by the scientific pipeline into `public/data/`:
- `event_timeseries.json` — 30-min hydrologic routing time series (stage, rainfall, flag, inflow, routed Q)
- `gauge_observations.json` — BWDB Kanaighat observed water levels
- `calibration_summary.json` — SWOT Manning's $n$ calibration records per reach
- `metrics_summary.json` — Quantitative scientific evaluation metrics (NSE, KGE, etc.)
- `reach_metadata.json` — SWORD reach dimensions and coordinates

To update or regenerate the JSON data from pipeline output:
```bash
python ../scripts/export_json.py
```

## Running the Dashboard
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

To verify production build and linting:
```bash
npm run build
npm run lint
```
