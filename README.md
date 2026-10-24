# HydroSense-SWOT

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NASA Space Apps 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026-orange.svg)](https://spaceappschallenge.org)

## Architecture & Project Modules

HydroSense-SWOT is structured into two distinct, decoupled components:

* **Module 1 — Operational Haor Flood-Warning & Harvest Decision System `[IMPLEMENTED]`:**  
  Delivers an actionable early-warning harvest decision tool for Upazila Agriculture Officers (UAOs) and Boro rice farmers in the flood-vulnerable Haor basin of north-east Bangladesh (Surma-Kushiyara rivers). When sudden pre-monsoon convective rain falls over the steep Meghalaya hills across the Indian border, the pipeline routes near-real-time NASA GPM IMERG Early Run rainfall through river reaches whose channel geometry and hydraulic roughness ($n$) are calibrated offline from NASA SWOT satellite reach measurements. Generates a high-contrast **Harvest Flag (GREEN / AMBER / RED)** with ~21–26 hours of advance warning before floodwaters cross the 13.20 m PWD danger level at Kanaighat.
* **Module 2 — Haor Rainfall Trend Explorer `[PLANNED / PROPOSED RESEARCH]`:**  
  A simplified, rainfall-first Minimum Viable Product (MVP) designed to investigate long-term environmental change in upstream catchments influencing the Haor region. Addresses the core question: *“Has pre-monsoon rainfall changed over time in selected upstream areas influencing Bangladesh’s Haor region? If so, where, by how much, and what statistical evidence supports the observed trend?”* Focuses on the 26-year historical NASA GPM IMERG Final Run V07 record (1998–2025) using non-parametric Theil-Sen slope estimation and autocorrelation-corrected Mann-Kendall trend testing.

> **Challenge Alignment Status:** Proposed alignment with NASA Space Apps Challenge 2026: *“Be An Earth System Trend Detective!”* remains **provisional**. Full challenge resource packages and participant terms remain pending official NASA release. The rainfall-only MVP focuses on precipitation indicators ($PRCPTOT$ and $R50mm$); potential challenge gaps regarding multi-variable Earth science selection will be evaluated when official materials are published.

---

## What it does
HydroSense-SWOT addresses the pre-monsoon flash-flood crisis in northeastern Bangladesh, where overtopping embankments frequently destroy ripening Boro rice. The operational dashboard (Module 1) provides a day-level event rail, selected-day readout, single editable hour-skip control, pinned current replay date, and a layout-stable English/Bengali interface for rapid agricultural triage. Module 2 provides decadal retrospective context for agricultural extension planners without confounding long-term climatology with 24–48h operational flood prediction.

The dashboard reflows for tablet and phone screens. Journey navigation stays visible on tablet, while the phone menu keeps navigation, language, theme, connection status, and advisory controls accessible without crowding the top bar. The operational limitations panel has a smooth, reduced-motion-aware disclosure, and a shared bilingual footer summarizes the mission and data provenance.

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
4. **Run test suite (40 unit tests):**  
   ```bash
   python -m pytest tests/ -v
   ```
5. **Launch Next.js interactive dashboard:**  
   ```bash
   cd ui && npm run dev
   ```
   Open `http://localhost:3000` in your browser.
   The interface adapts from desktop through narrow phone widths, including a touch-friendly mobile menu, animated limitations disclosure, and a source-focused footer.

## Data Sources

### Module 1: Operational Flood Warning `[IMPLEMENTED]`
- **NASA SWOT L2 HR RiverSP 2.0:** Water Surface Elevation (WSE), width, and reach-averaged slope (`slope2`) from NASA PO.DAAC (`SWOT_L2_HR_RIVERSP_2.0`). Used for offline Manning roughness calibration ($n \in [0.025, 0.10]$).
- **NASA GPM IMERG Early Run V07:** Calibrated half-hourly precipitation (`precipitationCal`, `GPM_3IMERGHHE`) at 0.1° resolution (~4-hour observation latency) driving near-real-time hydrologic routing.
- **BWDB / FFWC Gauge Records:** Hourly water level observations at Kanaighat on the Surma River (Official Station ID: `SW266`, Internal Pipeline Alias: `SW108`, Danger Level: 13.20 m PWD / equivalent to 12.75 m MSL via +0.45m datum shift).
- **SWORD v16 & HydroSHEDS v1:** River network topology, reach boundaries, and catchment area delineation (`hydrosheds.org`).
- **OpenStreetMap & OpenFreeMap:** Authoritative high-density river centerline geometry (OSM relations `5904030` Surma, `5904029` Kushiyara) rendered on the colorblind-accessible OpenFreeMap Positron basemap.

### Module 2: Haor Rainfall Trend Explorer `[PLANNED / PROPOSED RESEARCH]`
- **NASA GPM IMERG Final Run V07 (`GPM_3IMERGDF` / `GPM_3IMERGM`):** Research-grade daily and monthly global precipitation (0.1° grid, ~3.5-month latency), retrospectively reprocessed and gauge-adjusted via the Global Precipitation Climatology Centre (GPCC) from **January 1998 to 2025**. (Note: Early Run is invalid for multi-decadal climatological trends due to sensor drift and lack of monthly surface gauge adjustment).

## Scientific Performance & Audit Status

### Module 1 Hydrologic Routing (Replay of April–May 2026 Test Event) `[IMPLEMENTED]`
Evaluated on the frozen test period (April 1 – May 31, 2026) using 15-minute tolerance alignment against BWDB Kanaighat gauge records:
* **Nash-Sutcliffe Efficiency (NSE):** `0.73`
* **Kling-Gupta Efficiency (KGE):** `0.68`
* **Percent Bias (PBIAS):** `+1.9%`
* **Peak Timing Error:** `-2.0 h`
* **Warning Lead Time:** `22.5 h` advance warning before observed gauge crossed danger level ($13.20\text{ m PWD}$)

> **Scientific Audit Notice `[PARTIALLY IMPLEMENTED / UNDER AUDIT]`:**  
> A recent read-only code audit identified two unresolved issues in the validation scripts:
> 1. In `pipeline/validation_report.py`, the baseline comparison subroutine inadvertently evaluates the simulated series against itself (`df_sim` passed for both arguments), distorting the reported baseline NSE and timing delta.
> 2. In `pipeline/run_pipeline.py`, a hardcoded `lead_steps=48` parameter overrides the calibrated physical travel time of 25.9 hours.
> The reported model metrics above ($NSE = 0.73$, $KGE = 0.68$, $Lead = 22.5\text{ h}$) are computed directly from the fixture simulation, but comparative claims against the rainfall baseline remain **unresolved pending dedicated code re-benchmarking**.

### Module 2 Trend Explorer Methodology `[PROPOSED RESEARCH]`
- **Indicators:** Primary: Pre-monsoon total accumulation ($PRCPTOT_{AM}$, April 1 – May 31). Secondary: Heavy rainfall day count ($R50mm_{AM}$, days with daily rainfall $\ge 50\text{ mm}$).
- **Trend Estimation:** Non-parametric Theil-Sen slope estimator ($\beta$, mm/yr) with analytical 95% Sen-Kendall confidence intervals.
- **Significance & QC:** Modified Mann-Kendall (MMK Hamed & Rao 1998) test with variance correction factor $\text{Var}^*(S)$ accounting for serial autocorrelation ($|r_1| \ge 0.392$), with standard MK reported as sensitivity.
- **Findings Claim Boundary:** The project makes **no pre-supposition of trend direction or significance**. All outputs will reflect empirical execution on genuine GPM IMERG Final Run data.

## Limitations & Operational Boundaries
- **Strict Epistemological Separation:** Historical rainfall trends do **NOT** prove that flood frequency is increasing, do **NOT** predict the date or magnitude of the next flood event, and do **NOT** alter real-time flood warning accuracy.
- **SWOT Mission Lifetime:** NASA SWOT launched in December 2022 (~2.5–3 years of science data). Under WMO climatological standards ($\ge 30$ years), **SWOT cannot be used for multi-decadal trend detection**. Its role is strictly hydraulic channel geometry calibration.
- **Spatial Resolution & Headwaters:** SWOT resolves rivers wider than ~100 m. Narrow headwater tributaries in Meghalaya are not resolved.
- **Slope Noise Filtering:** Bangladesh rivers have low slopes ($\sim 10^{-5}\text{ m/m}$). Reaches where slope uncertainty exceeds signal ($\text{slope2} < 2 \times \text{slope\_u}$) are excluded from Manning calibration.
- **Sensor Revisit vs Routing:** SWOT does not act as a live continuous gauge (21-day orbit repeat); it provides offline channel parameterization. Operational lead time is driven by routing observed GPM IMERG rainfall.
- **In-Channel Hydraulic Regime:** Muskingum-Cunge routing models the rising limb and threshold-crossing timing. 2D floodplain inundation and post-breach backwater dynamics are not modelled.
- **Orographic Bias:** GPM IMERG may overestimate intense rainfall over the steep Meghalaya escarpment; calibration against downstream gauge stage implicitly dampens this bias.
- *Detailed specification:* See the always-discoverable [Operational Limits Panel specification](docs/DESIGN_ARCHITECTURE.md#operational-limits-panel) and [SOLUTION_ARCHITECTURE.md §4.1](docs/SOLUTION_ARCHITECTURE.md).

## Citation & Team
- **Team:** AUSTrology
- **Hackathon:** NASA International Space Apps Challenge 2026
- **Project:** HydroSense-SWOT — Near-Real-Time Hydrologic Routing with NASA SWOT & GPM IMERG
- **Team Members:**
  - Fazle Rabbi Mugdho — Systems & Backend Algorithm Developer
  - Mahim Abdullah Rianto — Data Infrastructure & Pipeline Developer
  - Taisha Tasnim Triti — Geospatial & Domain Researcher
  - Samia Rahman Arpita — Technical Quality & Compliance Specialist
  - Redwana Binte Jaman Tonima — Product Impact & Media Strategist
  - Arko Saha — Frontend & Product Experience Developer

## License
Distributed under the **MIT License**. See `LICENSE` for details.

## Documentation Links
- [SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md) — Pre-submission compliance and NASA Space Apps rules checklist
- [PRODUCT.md](PRODUCT.md) — Product specification, users, mission, and module positioning
- [DESIGN.md](DESIGN.md) — Calm, professional agrarian design system tokens and typography
- [HYDROSENSE_BUILD_PROMPTS.md](docs/HYDROSENSE_BUILD_PROMPTS.md) — Module 1 verified engineering prompts (P1–P8)
- [MODULE_2_BUILD_PROMPTS.md](docs/MODULE_2_BUILD_PROMPTS.md) — Module 2 verified engineering prompts (P-T1–P-T8)
- [validation_report.md](data/processed/validation_report.md) — Formal scientific validation report with diagnostic figures
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

