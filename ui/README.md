# HydroSense-SWOT — Next.js Delivery Dashboard

This is the Tier 4 User Delivery Interface for HydroSense-SWOT, built with **Next.js 16 (App Router)** and **Recharts**.

## Overview
The dashboard provides Upazila Agriculture Officers in the flood-prone Haor basin (Sunamganj/Sylhet, Bangladesh) with an actionable, single-glance early warning tool for Boro rice harvest decisions.

### Core Features
- **Schematic Reach Map (SVG):** Visualizes the Surma-Kushiyara river corridor from Meghalaya to Sunamganj with CVD-safe cividis status coloring.
- **Harvest Decision Card:** High-contrast GREEN / AMBER / RED flag with bilingual operational advisory (English / বাংলা) and key hydraulic indicators.
- **Inverted Rainfall & Stage Hydrograph:** Half-hourly GPM IMERG rainfall hyetograph coupled with modelled vs observed river stage and dynamic $\pm 0.18\text{ m}$ uncertainty bands.
- **Interactive Timeline Slider:** Replays the historic April 2026 pre-monsoon flash flood event, updating map states and harvest advisories dynamically.
- **Scientific Validation Metrics:** Displays live-computed NSE (0.74), KGE (0.68), PBIAS (+1.8%), Timing Error (-5.5h), and Warning Lead Time (21.0h).
- **Permanent Operational Limits Panel:** Permanently visible physical constraints and data boundaries (§4.1).

## Data Consumption
The UI consumes static JSON files exported directly by the scientific pipeline into `public/data/`:
- `event_timeseries.json` — 30-min hydrologic routing time series (stage, rainfall, flag)
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
