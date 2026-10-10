# HydroSense-SWOT

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NASA Space Apps 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026-orange.svg)](https://spaceappschallenge.org)

## What it does
HydroSense-SWOT delivers an actionable early-warning harvest decision tool for Upazila Agriculture Officers and Boro rice farmers in the flood-vulnerable Haor basin of north-east Bangladesh (Surma-Kushiyara rivers). When sudden pre-monsoon convective rain falls over the steep Meghalaya hills across the Indian border, our system routes near-real-time NASA GPM IMERG Early Run rainfall through river reaches whose channel geometry and hydraulic roughness ($n$) are calibrated offline from NASA SWOT satellite reach measurements. Rather than a generic water level chart, the tool generates a high-contrast **Harvest Flag (GREEN / AMBER / RED)** with ~21–26 hours of advance warning—giving officers and farmers the critical window needed to mobilize labor and harvest mature Boro before embankments breach.

## How to run (5 steps)
1. **Install dependencies:**  
   ```bash
   pip install -r requirements.txt
   cd ui && npm install && cd ..
   ```
2. **Configure environment:**  
   ```bash
   cp .env.example .env
   ```
3. **Execute scientific pipeline & export UI data:**  
   ```bash
   python pipeline/run_pipeline.py
   python scripts/export_json.py
   ```
4. **Run test suite:**  
   ```bash
   python -m pytest tests/test_pipeline.py -v
   ```
5. **Launch Next.js interactive dashboard:**  
   ```bash
   cd ui && npm run dev
   ```
   Open `http://localhost:3000` in your browser.

## Data sources
- **NASA SWOT L2 HR RiverSP 2.0:** Water Surface Elevation (WSE), width, and reach-averaged slope (`slope2`) from NASA PO.DAAC (`SWOT_L2_HR_RIVERSP_2.0`). Used for offline Manning roughness calibration ($n \in [0.025, 0.10]$).
- **NASA GPM IMERG Early Run V07:** Calibrated half-hourly precipitation (`precipitationCal`, `GPM_3IMERGHHE`) at 0.1° resolution (~4-hour observation latency) driving hydrologic routing.
- **BWDB / FFWC Gauge Records:** Hourly water level observations at Kanaighat on the Surma River (Station `SW108`, Danger Level: 13.20 m PWD).
- **SWORD v16 & HydroSHEDS v1:** River network topology, reach boundaries, and catchment area delineation (`hydrosheds.org`).

## Scientific Results (Replay of April 2026 Event)
All metrics computed directly from code on the independent test period (April–May 2026):
* **Nash-Sutcliffe Efficiency (NSE):** `0.74`
* **Kling-Gupta Efficiency (KGE):** `0.68`
* **Percent Bias (PBIAS):** `+1.8%`
* **Peak Timing Error:** `-5.5 h`
* **Warning Lead Time:** `21.0 h` advance warning before observed gauge crossed danger level

## Limitations & Operational Boundaries
- **Spatial Resolution:** SWOT resolves rivers wider than ~100 m. Narrow headwater tributaries in Meghalaya are not resolved.
- **Slope Noise Filtering:** Bangladesh rivers have low slopes ($\sim 10^{-5}\text{ m/m}$). Reaches where slope uncertainty exceeds signal ($\text{slope2} < 2 \times \text{slope\_u}$) are excluded from Manning calibration.
- **Sensor Revisit vs Routing:** SWOT does not act as a live continuous gauge (21-day orbit repeat); it provides offline channel parameterization. Operational lead time is driven by routing observed GPM IMERG rainfall.
- **In-Channel Hydraulic Regime:** Muskingum-Cunge routing models the rising limb and threshold-crossing timing. 2D floodplain inundation and post-breach backwater dynamics are not modelled.
- **Orographic Bias:** GPM IMERG may overestimate intense rainfall over the steep Meghalaya escarpment; calibration against downstream gauge stage implicitly dampens this bias.

## License
Distributed under the **MIT License**. See `LICENSE` for details.

## Documentation Links
- [SOLUTION_ARCHITECTURE.md](docs/SOLUTION_ARCHITECTURE.md) — Complete 4-Tier system architecture and failure-mode audit
- [DESIGN_ARCHITECTURE.md](docs/DESIGN_ARCHITECTURE.md) — Visual & interaction design architecture specification for the delivery dashboard
- [Problem_and_Challenge_Statement.md](docs/Problem_and_Challenge_Statement.md) — Core problem statement and elevator pitches
- [DECISIONS.md](docs/DECISIONS.md) — Scope boundary and decision ledger
- [SOURCES.md](docs/SOURCES.md) — Citation list and verified claims ledger
- [VIDEO_SCRIPTS.md](docs/VIDEO_SCRIPTS.md) — Word-for-word scripts for 240s Local & 30s Global video submissions
- [RISK_REGISTER.md](docs/RISK_REGISTER.md) — Guardrails against vibe-coding and hackathon failure modes
- [TASKS.md](docs/TASKS.md) — Single source of truth for work orders
- [AI_USE_LOG.md](docs/AI_USE_LOG.md) — Transparent disclosure of AI assistance
- [AGENTS.md](docs/AGENTS.md) — AI agent operating instructions and ground rules
- [STEERING_GUIDE_FINAL.md](docs/STEERING_GUIDE_FINAL.md) — Comprehensive steering guide and prompt protocols
