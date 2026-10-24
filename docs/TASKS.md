# TASKS (Single Source of Truth)

**Now doing:** Submission package complete; all remediation gates, workflows, and audits verified.  
**Blocked (needs a human):** 
- [RESOLVED] Official challenge statement locked: *Be An Earth System Trend Detective!* (mapped to dual-module architecture).
- [OPEN] Local Lead confirmation of pre-screening qualification status.

---

| ID | Work Order | Role | Owner | Status | Due | Done When | Notes |
|---|---|---|---|---|---|---|---|
| **WO-001** | Create scientific data fixtures (`swot_reaches.nc`, `imerg_map.nc`, `gauge_kanaighat.csv`) | R4 Data Engineer | Pipeline Lead | **DONE** | Hour 3 | All 4 fixture files written, NetCDF loadable, UTC timestamps confirmed | Generated via `scripts/generate_fixtures.py` |
| **WO-002** | Manning's roughness ($n$) calibration module | R3 Scientist | Hydrology Lead | **DONE** | Hour 5 | Calibrates $n \in [0.025, 0.10]$ with `method='bounded'`, slope noise filtered | Implemented in `pipeline/manning_calibration.py` |
| **WO-003** | Muskingum-Cunge routing & stage inversion | R3 Scientist | Hydrology Lead | **DONE** | Hour 8 | Inverts stage via Manning, wave celerity ~1.5 m/s, travel time ~26h | Implemented in `pipeline/muskingum_cunge.py` |
| **WO-004** | Harvest flag decision logic & bilingual advisory | R7 UX Designer | Dev Lead | **DONE** | Hour 9 | Flags GREEN / AMBER / RED computed with English & Bangla copy | Implemented in `pipeline/harvest_flag.py` |
| **WO-005** | Scientific validation metrics module | R3 Scientist | Hydrology Lead | **DONE** | Hour 10 | NSE, KGE, PBIAS, timing error, and lead time computed, formatted to 2dp | Implemented in `pipeline/metrics.py` |
| **WO-006** | End-to-end Minimum Viable Pipeline (MVP) runner | R5 Backend | Dev Lead | **DONE** | Hour 11 | `python pipeline/run_pipeline.py` passes all 7 architectural steps | Output: NSE 0.74, KGE 0.68, Lead 21.0h |
| **WO-007** | State files & compliance documentation | R9 Compliance | Docs Lead | **DONE** | Hour 13 | `DECISIONS.md`, `TASKS.md`, `SOURCES.md`, `RISK_REGISTER.md`, `AI_USE_LOG.md`, `AGENTS.md`, `README.md` created | Core state sync |
| **WO-008** | Interactive Delivery Interface (Web Dashboard Redesign) | R6 Frontend | Dev Lead | **DONE** | Hour 22 | Redesigned per `DESIGN_ARCHITECTURE.md`: 8:4 hero River Map + Harvest Decision rail, dual-axis hydrograph with timeline scrubber, modular components, reach inspector, and operational limits | Next.js 16 App Router app in `ui/`, verified via automated browser subagent with 0 console errors |
| **WO-009** | Video demo scripts (Three-video pipeline) | R8 Storyteller | Pitch Lead | **DONE** | Hour 28 | Scripts written strictly from `SOURCES.md` claims | Complete scripts for Video 1 (240s prescreening), Video 2 (240s local demo), and Video 3 (30s global) in `VIDEO_SCRIPTS.md` |
| **P1-SWOT** | Real NASA SWOT RiverSP 2.0 Ingestion (`pipeline/ingest_swot.py`, `pipeline/ingest_sword.py`) | R4 Data Engineer | Pipeline Lead | **DONE** | Hour 30 | Quality gating, slope noise filtering, SWORD pre-screening, `--mode real` support, 10/10 tests pass | Implemented per `HYDROSENSE_BUILD_PROMPTS.md` Prompt 1 |
| **P2-IMERG** | Real NASA GPM IMERG & BWDB Gauge Ingestion (`pipeline/ingest_imerg.py`, `pipeline/ingest_gauge.py`, `pipeline/ingest_hydrosheds.py`) | R4 Data Engineer | Pipeline Lead | **DONE** | Hour 32 | End-of-interval -30min shift, BST to UTC conversion, rolling median filter, GeoJSON sub-basins, 16/16 tests pass | Implemented per `HYDROSENSE_BUILD_PROMPTS.md` Prompt 2 |
| **P3-MANNING** | Manning Roughness Real Calibration (`pipeline/manning_calibration.py`, `pipeline/calibration_diagnostics.py`) | R3 Scientist | Hydrology Lead | **DONE** | Hour 33 | Stage-dependent filtering, bounded optimization [0.025, 0.10], inverse-variance weighting, diagnostic plots, 21/21 tests pass | Implemented per `HYDROSENSE_BUILD_PROMPTS.md` Prompt 3 |
| **P4-ROUTING** | Real Hydrodynamic Routing & Uncertainty Engine (`pipeline/muskingum_cunge.py`, `pipeline/harvest_flag.py`, `pipeline/sensitivity.py`) | R3 Scientist / R5 Backend | Hydrology Lead | **DONE** | Hour 34 | Dynamic wave celerity c=(5/3)V_mean, 25.9h lag, +/-0.18m uncertainty envelope, data-driven peak date, sensitivity matrix, 27/27 tests pass | Implemented per `HYDROSENSE_BUILD_PROMPTS.md` Prompt 4 |
| **P5-VALIDATION** | Scientific Validation & Baseline Benchmarking (`pipeline/metrics.py`, `pipeline/validation_report.py`, `tests/test_validation_real.py`) | R3 Scientist / R5 Backend | Hydrology Lead | **DONE** | Hour 35 | 15min tolerance alignment, test period restriction, 5 metrics (NSE 0.73 vs -0.15 baseline), report and plots generated, 33/33 tests pass | Implemented per `HYDROSENSE_BUILD_PROMPTS.md` Prompt 5 |
| **P6-DASHBOARD** | Dashboard Real Data Integration (`HydrographPanel`, `RiverMapPanel`, `HarvestDecisionPanel`, `ValidationMetricsPanel`, `OperationalLimitsPanel`) | R6 Frontend / R7 UX | Dev Lead | **DONE** | Hour 36 | 3-line hydrograph (modelled, observed, baseline), uncertainty band, amber danger line, CVD-safe Cividis reach map, SWOT asterisks, slope hatching, dynamic travel time & IMERG timestamps, permanent limits, 0 console errors | Implemented per `HYDROSENSE_BUILD_PROMPTS.md` Prompt 6 |
| **P7-MAP** | Interactive Map Enhancement — Leaflet GIS Integration (`InteractiveMapLeaflet.js`, `InteractiveMap.js`, `reach_geometries.json`) | R6 Frontend | Dev Lead | **DONE** | Hour 37 | Real SWOT reach polylines, CartoDB Dark Matter basemap, Cividis risk gradient, HydroSHEDS sub-basins, Kanaighat sonar pin, dual Geographic/Schematic mode toggle, 0 console errors | Implemented per `HYDROSENSE_BUILD_PROMPTS.md` Prompt 7 |
| **WO-011** | Forecast Timeline Day Rail & Unified Skip (`HydrographPanel`, `forecast/page.js`, locales, `globals.css`) | R6 Frontend / R7 UX | Dev Lead | **DONE** | Hour 38 | Day rail with active-day tracking, direct day jumps, selected-day readout below the rail, one inline custom skip control (editable hours, apply arrows, Enter/Shift+Enter, clamping, boundary-disabled), current replay date/stage/step bar above the chart, EN/BN labels, responsive layout, production build pass | Requested follow-up to WO-008; replaced popover/-1h/+1h design after review; verified `npm run build`, headless desktop/mobile, and fixed 390px horizontal overflow |
| **WO-012** | Geographic River Highlight Meanders Repair (`reach_geometries.json`, `build_reach_geometries.py`, `test_geographic_highlights.py`) | R6 Frontend / R10 QA | Dev Lead | **DONE** | Hour 39 | Extracted genuine OSM river relations (5904030 & 5904029) to replace coarse 8-point chords with 1,719 vertices hugging river meanders on Positron basemap, preserved stationary Kanaighat gauge pin (24.9980°N, 92.2594°E), 40/40 tests pass | Fixed river line geometry across Kanaighat, Sylhet, and Amalshid bifurcation; verified visual alignment on live map with 0 errors |
| **WO-013** | Topbar Brand Lockup & Bilingual Switch Stabilization (`AppHeader`, `PageContextBar`, `TelemetryContext`, locales, `globals.css`) | R6 Frontend / R7 UX | Dev Lead | **DONE** | Hour 40 | Page context title, HAOR BASIN badge, and one-line tagline consolidated under the HydroSense/SWOT brand; redundant page-title block removed with `sr-only` H1 retained; replay dates/times localized with `Intl` (`bn-BD`/`en-GB`, UTC, h23); EN/BN switch layout-stable at >=1366px and 375-600px; no page overflow at 1440/1366/1280/1024/768/390; production build passes | CDP verified fixed desktop columns and zero language-toggle shift at 1440/1366/390; no-wrap mobile nav uses hidden step badges at 375-600px. Existing two `react-hooks/set-state-in-effect` ESLint errors remain pre-existing. |
| **WO-014** | Complete UI/UX Improvement, Visual Consistency, & Bilingual Localization across all 3 Pages (`globals.css`, `InteractiveMapLeaflet.js`, `HydrographPanel.js`, `RiverMapPanel.js`, `advisory/page.js`, `forecast/page.js`, locales) | R6 Frontend / R7 UX / Localization | Dev Lead | **DONE** | Hour 42 | Full migration to calm, high-contrast agricultural design tokens (#F5F8FA background, #FFFFFF cards, #173B57/#566B7C text, #287BB5 blue, #B7791F amber, #B4232F red); first-page 5-Second Executive Triage; all 3 pages preserved; 252 nested keys with 100% EN/BN parity; natural agricultural Bangla; Leaflet popups & SVG capsules contrast-fixed; stationary Kanaighat pin (24.9980°N, 92.2594°E) & OSM river meanders preserved; 40/40 pytest tests pass, Next.js build passes, desktop & mobile verified in browser | Verified via headless browser screenshots across English & Bangla on desktop (1440x900) and mobile (390x844). |
| **WO-015** | Documentation Synchronization & Dual-Module Architecture Status Alignment | R9 Compliance / R3 Scientist | Docs Lead | **DONE** | Oct 24 | Updated all project docs (README, PRODUCT, Problem Statement, SOLUTION_ARCHITECTURE, SOURCES, DECISIONS, TASKS, SUBMISSION_CHECKLIST, RISK_REGISTER); established 4 status categories (Implemented, Partially implemented / Under audit, Planned, Proposed research); decoupled Flood Warning from Trend Explorer MVP; annotated baseline comparison discrepancies. | Documentation-only task; zero application code modified. |
| **WO-016** | Scientific Audit & Re-benchmarking of Module 1 Baseline Comparison Subroutine (`pipeline/validation_report.py`, `pipeline/run_pipeline.py`) | R3 Scientist / R5 Backend | Hydrology Lead | **DONE** | Oct 24 | Fixed df_sim self-comparison bug in baseline evaluation, aligned lookahead windowing to physical travel time $K = 25.9\text{ h}$, re-ran test period evaluation, updated validation figures and report. | Evaluated true persistence and threshold baseline; lead time reported honestly as N/A in the absence of an operational issue-time product. Verified in Gate 4. |
| **WO-017** | Implementation of Simplified Rainfall-First Trend Explorer MVP Backend (`trend_explorer/`) | R4 Data / R3 Scientist | Pipeline Lead | **DONE** | Oct 24 | Ingest GPM IMERG Final Run V07 (`GPM_3IMERGDF`, 2001–2025 primary, 1998–2025 sensitivity), compute April–May $PRCPTOT$ and $R50mm$ using cell-first protocol, compute Sen's slope with analytical CI, evaluate Modified Mann-Kendall (Hamed & Rao 1998) under autocorrelation, export un-fabricated JSON. | Implemented fail-closed backend in `trend_explorer/analysis.py` and `scripts/run_trend_analysis.py`. Unit tests in `tests/test_trend_explorer.py` passing (48/48 total). |
| **WO-018** | Frontend Integration of Trend Explorer Mode in Next.js UI (`TrendExplorerViewer.js`, locales, tabs) | R6 Frontend / R7 UX | Dev Lead | **DONE** | Oct 24 | Add top-level mode switch (Flood Warning vs Trend Explorer), render interactive Recharts time series with Sen's slope line and analytical CI, 4 factual statistical cards, authentic bilingual context. | Integrated Next.js route `/trends` (`ui/app/trends/page.js`) with fail-closed data fetching, bilingual text, and clear operational boundaries. Production build clean. |
| **WO-019** | Specification of Module 2 Staged Build Plan (`docs/MODULE_2_BUILD_PROMPTS.md`, `MODULE_2_BUILD_PROMPTS.md`) | R9 Compliance / R5 Backend | Dev Lead | **DONE** | Oct 24 | Finalized 6-stage scientific build specification (Stages 0–5) resolving missing-data policy (100% complete seasons), cell-first indicator aggregation, MMK variance correction for autocorrelation, and organizer prior-work inquiry. | Documentation only; zero application code modified. |
| **WO-020** | Markdown Corpus Audit & Module 2 Alignment Across All Docs | R9 Compliance / R10 QA | Docs Lead | **DONE** | Oct 24 | Verified all 24 project markdown files; synchronized Module 1 build prompts; aligned statistical testing to MMK (Hamed & Rao 1998) across README, PRODUCT, SOLUTION_ARCHITECTURE, SOURCES, RISK_REGISTER; added validation audit banner; 40/40 tests pass. | Complete documentation verification; clean tree. |
| **WO-021** | Responsive Tablet/Mobile Layout and Topbar Alignment (`AppHeader`, locales, `globals.css`) | R6 Frontend / R7 UX | Dev Lead | **DONE** | Oct 24 | Added aligned compact-desktop navigation, persistent tablet tabs with expandable controls, and an accessible phone menu; reflowed mobile context controls and map height; preserved English/Bengali menu labels. | Captured 1440×900, 1170×820, 768×1024, 390×844, and 320×700 in headless Chromium; document width matched viewport in every capture. Physical touch-device behavior remains unverified. |
| **WO-022** | Animated Operational Limits Disclosure and Shared Scientific Footer (`OperationalLimitsPanel`, `DashboardFooter`, locales, `globals.css`) | R6 Frontend / R7 UX | Dev Lead | **DONE** | Oct 24 | Added action-specific SVG expand/collapse states, smooth reduced-motion-aware disclosure, and shared bilingual mission/data-source footer on dashboard, forecast, and advisory routes. | Chromium captures at 1440×900 and 390×844 verified both panel states and zero horizontal overflow; no physical touch-device behavior was tested. |
| **WO-010** | Release QA & submission compliance audit | R10 QA | Team Lead | **DONE** | Oct 24 | Clean-checkout run, offline fixture test, public repo check, no banned content | All 13 evidence artifacts in `docs/evidence/` generated; 48/48 pytest tests pass, ESLint 0 errors, Next.js production build passes; provenance audit passes cleanly. |



---

## Detailed Work Orders

### WO-006: End-to-End Minimum Viable Pipeline (MVP)
* **Goal:** Execute the 7-step data pipeline end-to-end.
* **Why it matters:** Guarantees scientific validity before any UI work begins (avoids Trap C1).
* **Role:** R5 Backend Engineer / R10 QA.
* **Result:** PASSED. NSE: 0.74, KGE: 0.68, PBIAS: +1.8%, Timing Error: -5.5h, Warning Lead Time: 21.0h.

### WO-008: Interactive Delivery Interface (Web Dashboard Redesign)
* **Goal:** Deliver single-screen dashboard for Sunamganj Upazila Agriculture Officer conforming to `DESIGN_ARCHITECTURE.md`.
* **Why it matters:** Fulfills Presentation & Relevance scoring criteria.
* **Role:** R6 Frontend & Data-Viz Engineer + R7 UX Designer.
* **Result:** PASSED. Built and redesigned Next.js 16 App Router application (`ui/`) with modular components (`AppHeader`, `PageContextBar`, `RiverMapPanel`, `HarvestDecisionPanel`, `HydrographPanel`, `ValidationMetricsPanel`, `OperationalLimitsPanel`, `ReachInspectorModal`, `AdvisoryBulletinModal`, `ModelArchitectureModal`). Features glassmorphic surfaces, restrained neumorphism, animated river flow vectors, pulsating sonar gauge marker, synchronized dual hydrograph (inverted rainfall hyetograph + stage curve with ±0.18m uncertainty), timeline scrubber with replay controls (1x, 2x, 5x), reach inspector modal, bilingual EN/বাংলা localization, and permanent operational limits panel. Verified via automated browser subagent with 0 console errors.

### WO-009: Video Demo Scripts
* **Goal:** Write word-for-word scripts for the 240s local qualification video and 30s global elevator pitch.
* **Why it matters:** Fulfills Presentation and Communication scoring criteria.
* **Role:** R8 Storyteller / Pitch Lead.
* **Done When:** Scripts written strictly adhering to verified claims in `SOURCES.md`, timed to exact duration bounds.
* **Result:** PASSED. Completed scripts for Video 1 (240s prescreening), Video 2 (240s local demo), and Video 3 (30s global) in `VIDEO_SCRIPTS.md`.

### WO-010: Release QA & Submission Compliance Audit
* **Goal:** Complete exhaustive release verification, provenance audit, lint/build testing, and evidence archiving.
* **Why it matters:** Guarantees submission integrity and prevents disqualification under Space Apps rules.
* **Role:** R10 QA / Team Lead.
* **Result:** PASSED. All 13 evidence artifacts authored in `docs/evidence/`. Executed `./scripts/audit_provenance.py` (0 errors), `pytest tests/` (48/48 passed), `npm run lint` (0 errors), `npm run build` (all 8 static routes compiled cleanly). Scorecard Section 6 signed off at 9.23/10 internal readiness.

### WO-016: Scientific Audit & Re-benchmarking of Module 1 Baseline Comparison
* **Goal:** Audit and resolve baseline comparison logic in `pipeline/validation_report.py` and `pipeline/metrics.py`.
* **Why it matters:** Eliminates distorted comparisons where simulated series was self-compared, ensuring physical and statistical validity.
* **Role:** R3 Hydrology Scientist / R5 Backend.
* **Result:** PASSED. Evaluated true persistence and threshold baselines; documented in `docs/evidence/evaluation_split_baseline_and_metrics.md`. Warning lead time documented honestly as N/A in the absence of an operational issue-time product.

### WO-017: Implementation of Simplified Rainfall-First Trend Explorer MVP Backend
* **Goal:** Build fail-closed Python analysis backend for decadal GPM IMERG Final Run precipitation data.
* **Why it matters:** Direct technical answer to NASA Space Apps 2026 *Be An Earth System Trend Detective!* challenge.
* **Role:** R4 Data Engineer / R3 Hydrology Scientist.
* **Result:** PASSED. Implemented in `trend_explorer/analysis.py` and `scripts/run_trend_analysis.py`. Computes cell-first $PRCPTOT_{AM}$ and $R50mm_{AM}$, Theil-Sen slope, and Modified Mann-Kendall test. Fails closed with zero synthetic data generation when genuine NetCDF granules are absent. Covered by hermetic unit tests in `tests/test_trend_explorer.py`.

### WO-018: Frontend Integration of Trend Explorer Mode in Next.js UI
* **Goal:** Deliver user interface for Haor Rainfall Trend Explorer conforming to accessibility and design tokens.
* **Why it matters:** Enables decision-makers to inspect long-term climate trend methodology with bilingual clarity.
* **Role:** R6 Frontend / R7 UX.
* **Result:** PASSED. Created `ui/app/trends/page.js` with fail-closed data fetching, responsive glass-panel layout, bilingual English/Bangla text, and explicit operational limitations. Compiles cleanly in Next.js production build.

