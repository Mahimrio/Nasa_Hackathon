# HydroSense-SWOT — Next.js Delivery Dashboard

This is the Tier 4 User Delivery Interface for HydroSense-SWOT, built with **Next.js 16 (App Router)** and **Recharts**, conforming to the authoritative specification in [docs/DESIGN_ARCHITECTURE.md](../docs/DESIGN_ARCHITECTURE.md).

## Overview
The dashboard provides Upazila Agriculture Officers in the flood-prone Haor basin (Sunamganj & Sylhet, Bangladesh) with an actionable, single-glance early warning tool for Boro rice harvest decisions.

### Core Features & Architecture
- **Cartographic River Reach Map (`RiverMapPanel.js`):** Hero 8-column geospatial SVG visualization of the Surma-Kushiyara river network featuring:
  - Animated flow particles along calibrated river reaches (`stroke-dashoffset`).
  - Pulsating radar sonar rings at the BWDB SW108 Kanaighat hydrometric gauge station.
  - Meghalaya mountain plateau relief shading and Haor depression wetland contours.
  - 120 km SWOT satellite ground track footprint overlay.
  - Interactive reach selection linking directly to the hydraulic inspector.
- **Harvest Decision Engine (`HarvestDecisionPanel.js`):** Prominent glowing status orb (NORMAL / WATCH / CRITICAL) with:
  - Bilingual agricultural advisory (English / বাংলা) instructing immediate or scheduled harvest.
  - Physical water column progress bar comparing modelled stage against the 13.20 m PWD danger level.
  - Monospace hydraulic telemetry readout (Modelled stage, danger level, clearance buffer, BWDB observed level, wave travel time ~25.9h, warning lead time 21.0h).
- **Synchronized Dual Hydrograph (`HydrographPanel.js`):**
  - Inverted GPM IMERG Early Run rainfall hyetograph (mm/h) with cyan-to-blue gradient bars.
  - Main stage hydrograph with modelled water levels, BWDB observed gauge readings, and dynamic $\pm 0.18\text{ m}$ analytical uncertainty envelope.
  - Operational danger level reference line (13.20 m PWD).
  - Current-time vertical reference cursor line.
  - Full simulation replay engine with Play/Pause loop, 1x/2x/5x speed selector, -1h/+1h stepping, and tactile range scrubber.
- **Scientific Validation Benchmarks (`ValidationMetricsPanel.js`):** 5-column metric cards:
  - NSE (`0.74`), KGE (`0.68`), PBIAS (`+1.8%`), Peak Timing Error (`-5.5 h`), and Warning Lead Time (`21.0 h`).
  - Interactive infomorphism definition popovers explaining formulas and benchmark criteria on hover.
- **Permanent Operational Limits Panel (`OperationalLimitsPanel.js`):** Permanently visible physical constraints (§4.1), covering SWOT spatial resolution (>100 m), slope noise filtering, IMERG orographic bias, and routing regime.
- **Interactive Modals:**
  - `ReachInspectorModal.js`: Detailed SWOT hydraulic profile (Manning $n$, bed elevation $z_{bed}$, channel width, length, slope quality, overpass pass count).
  - `AdvisoryBulletinModal.js`: Formatted, printable emergency harvest advisory bulletin for field dispatch.
  - `ModelArchitectureModal.js`: Educational dialog breaking down the 4-tier hydrologic routing framework.

## Visual & Motion Design System
- **Design Tokens:** Defined centrally in `ui/app/globals.css` following `DESIGN_ARCHITECTURE.md`.
- **Glassmorphism:** Deep navy canvas (`#050A12`) with atmospheric blooms, frosted glass surfaces (`backdrop-filter: blur(18px)`), and top-edge glints.
- **Restrained Neumorphism:** Tactile inset wells (`neu-inset`) and raised surfaces (`neu-raised`) for segmented toggles and controls.
- **Accessibility & Motion:** Full `@media (prefers-reduced-motion: reduce)` compliance and CVD-safe semantic palette (Green `#30E08A`, Amber `#FFC45C`, Red `#FF647C`).

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
