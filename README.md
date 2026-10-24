# HydroSense-SWOT

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NASA Space Apps 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026-orange.svg)](https://spaceappschallenge.org)

## Architecture & Project Modules

HydroSense-SWOT is structured into two distinct, decoupled components:

* **Module 1 — Flood-routing demonstration `[SYNTHETIC ENGINEERING TEST]`:**  
  The checked-in dashboard uses generated rainfall, stage, and SWOT-shaped scenarios. It demonstrates software behavior only; it is not an operational warning system, real data replay, or validated forecast.
* **Module 2 — Haor Rainfall Trend Explorer `[IMPLEMENTED, AWAITING REAL DATA]`:**  
  A fail-closed analysis module for provenance-verified NASA GPM IMERG Final daily extracts. It computes cell-first April–May PRCPTOT and R50mm, Theil–Sen slopes, and autocorrelation-adjusted Mann–Kendall inference. It produces no result until authentic input is supplied.

> **Challenge Alignment Status:** Alignment with NASA Space Apps Challenge 2026: *“Be An Earth System Trend Detective!”* is **locked and verified** (see [`docs/DECISIONS.md`](docs/DECISIONS.md) and [`docs/evidence/challenge_criteria_map.md`](docs/evidence/challenge_criteria_map.md)). The rainfall-first MVP focuses on precipitation indicators ($PRCPTOT$ and $R50mm$) using cell-first aggregation, Theil-Sen slope, and Modified Mann-Kendall trend testing under autocorrelation.

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
   python3 pipeline/run_pipeline.py
   python3 scripts/export_json.py
   ./scripts/audit_provenance.py
   ```
4. **Run test suite (48 unit tests):**  
   ```bash
   python3 -m pytest tests/ -v
   ```
5. **Launch Next.js interactive dashboard:**  
   ```bash
   cd ui && npm run dev
   ```
   Open `http://localhost:3000` in your browser.
   The interface adapts from desktop through narrow phone widths, including a touch-friendly mobile menu, animated limitations disclosure, and a source-focused footer.

## Data Sources

### Module 1: Synthetic engineering fixtures
- The bundled SWOT-, GPM-, and gauge-shaped files are all `SYNTHETIC`; see `data/fixtures/PROVENANCE.json`.
- Candidate real sources are documented, but no bundled artifact represents a NASA, BWDB, or FFWC retrieval.
- **SWORD v16 & HydroSHEDS v1:** River network topology, reach boundaries, and catchment area delineation (`hydrosheds.org`).
- **OpenStreetMap & OpenFreeMap:** Authoritative high-density river centerline geometry (OSM relations `5904030` Surma, `5904029` Kushiyara) rendered on the colorblind-accessible OpenFreeMap Positron basemap.

### Module 2: Haor Rainfall Trend Explorer `[AWAITING VERIFIED INPUT]`
- **NASA GPM IMERG Final Run V07 (`GPM_3IMERGDF` / `GPM_3IMERGM`):** Research-grade daily and monthly global precipitation (0.1° grid, ~3.5-month latency), retrospectively reprocessed and gauge-adjusted via the Global Precipitation Climatology Centre (GPCC) from **January 1998 to 2025**. (Note: Early Run is invalid for multi-decadal climatological trends due to sensor drift and lack of monthly surface gauge adjustment).

## Scientific Performance & Audit Status

### Module 1 Hydrologic Routing `[SYNTHETIC ENGINEERING TEST]`
Metrics produced from the bundled scenarios are engineering diagnostics only.
They are not independent observations, predictive skill, or warning lead-time evidence.

> **Scientific Audit Notice `[AUDITED & VERIFIED]`:**  
> The baseline comparison subroutine was audited and re-benchmarked: the prior `df_sim` self-comparison in `pipeline/validation_report.py` was resolved, true persistence and threshold baselines are evaluated against the benchmark event, and warning lead time is reported honestly as N/A in the absence of an operational issue-time product. Detailed findings are documented in [`docs/evidence/evaluation_split_baseline_and_metrics.md`](docs/evidence/evaluation_split_baseline_and_metrics.md) and [`docs/evidence/leakage_prevention_and_lead_time_trace.md`](docs/evidence/leakage_prevention_and_lead_time_trace.md).

### Module 2 Trend Explorer Methodology `[IMPLEMENTED; REAL INPUT REQUIRED]`
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
# Data-status correction (2026-10-24)

The checked-in HydroSense fixtures are **SYNTHETIC**. They are generated
scenarios, not NASA SWOT/GPM retrievals or BWDB/FFWC observations. Dashboard
metrics are synthetic engineering checks, not independent validation or
operational forecast skill. Run `./scripts/audit_provenance.py` or
`python3 scripts/audit_provenance.py` to validate the fixture manifest and public
metric label. Real-data ingestion currently fails closed when authenticated,
verifiable source inputs are unavailable.
