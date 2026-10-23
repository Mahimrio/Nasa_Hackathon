# AGENTS.md — AI Agent Operating Instructions

This file serves as the concise operating contract for any AI assistant working on the HydroSense-SWOT repository.

## 1. Core Principles
1. **Never Invent Data or APIs:** Never make up endpoints, variables, dataset names, DOIs, formulas, or numbers. If unsure, mark `[OPEN]` or say "I don't know."
2. **Three-Line Opener:** Open every major answer with:
   `Role · Why (criterion or award served) · Risks guarded against`
3. **Pre-Mortem Requirement:** Before concluding any implementation, list the 3 likeliest failure points and the safeguards built to prevent them.
4. **Disclose AI Contributions:** Always log generated modules in `docs/AI_USE_LOG.md`.
5. **Preserve Scope:** Scope is frozen in `docs/DECISIONS.md`. Do not add features outside the vertical slice without explicit human approval.
6. **Continuous State Synchronization:** Whenever an architectural, stack, or code change is applied, immediately update `docs/AGENTS.md`, `docs/TASKS.md`, `docs/DECISIONS.md`, and `README.md`.

## 2. Technical Ground Rules

### Science & Backend Pipeline (Tiers 1–3)
- **Import Order:** `import netCDF4` MUST precede `import xarray` (Trap B2).
- **Timezones:** Store and process all internal timestamps as timezone-aware UTC ISO8601 strings. Localize once at ingestion.
- **Reach IDs:** SWOT reach IDs are 11-digit numbers. Always read and store them as strings (`dtype={'reach_id': str}`) to prevent float truncation (Trap B3).
- **Quality Gating:** Exclude passes where `slope2 < 2 * slope_u` or `slope2 < 1e-5` to avoid low-gradient slope noise (Trap A2).
- **Roughness Optimization:** Use `scipy.optimize.minimize_scalar(..., bounds=(0.025, 0.10), method='bounded')` (Trap B8).
- **Metrics Formatting:** Never print more than 2 decimal places for evaluation metrics (`f"{nse:.2f}"`, `f"{lead:.1f} h"`) (Trap C2).
- **Offline First:** All demos and pipelines must default to fixtures in `data/fixtures/` to survive venue network instability.

### Climatology & Trend Detection Pipeline (Tier 5 — Module 2)
- **Product & Variable:** Ingest NASA GPM IMERG Final Run V07 Daily (`GPM_3IMERGDF`). The calibrated daily variable is named **`precipitation`** (unit: `mm/day`) — **NEVER** use `precipitationCal` (half-hourly only) (Trap T-G1).
- **Bounding Box Coordinate Order:** `earthaccess` requires longitude-first order: `bounding_box=(90.0, 24.0, 93.5, 26.0)` (Trap T-G2).
- **Zero Synthetic Production Records:** If NASA Earthdata is unreachable, fail closed with exit code 1. **NEVER** write synthetic records to `data/trends/`. Synthetic series are restricted strictly to `tests/fixtures/` (Trap T-G3).
- **100% Complete Seasons:** April 1 to May 31 contains **exactly 61 calendar days in every single year**. Primary 2001–2025 analysis strictly requires all 61 days valid ($61/61$). Never replace missing days with 0.0 or seasonal averages (Trap T-G4).
- **Cell-First Calculation:** Compute $PRCPTOT_i$ and $R50mm_i$ per $0.1^\circ$ grid cell first, then area-weight across the zone. Never average daily rainfall across the zone before thresholding (Trap T-G9).
- **Autocorrelation & Significance:** If detrended rank autocorrelation $|r_1| \ge 1.96/\sqrt{N} \approx 0.392$, significance is governed strictly by **Modified Mann-Kendall (MMK Hamed & Rao 1998)** with variance correction $\text{Var}^*(S)$. Standard MK is reported alongside as sensitivity (Trap T-G7).
- **Decoupled Architecture:** Module 2 lives exclusively in `trend_explorer/` and `data/trends/`. It does not alter `pipeline/run_pipeline.py` or existing Module 1 fixtures (Trap T-G10).

### Frontend Delivery Dashboard (Tier 4 — Next.js 16)
- **Framework & Architecture:** Next.js 16 App Router in `ui/` conforming to `docs/DESIGN_ARCHITECTURE.md`. Modular components organized under `ui/app/components/` (`AppHeader`, `PageContextBar`, `RiverMapPanel`, `HarvestDecisionPanel`, `HydrographPanel`, `ValidationMetricsPanel`, `OperationalLimitsPanel`, `ReachInspectorModal`, `AdvisoryBulletinModal`, `ModelArchitectureModal`, and planned `TrendExplorerViewer`).
- **Data Hydration:** The UI reads purely static JSON fixtures from `ui/public/data/*.json` and `ui/public/data/trends/trend_results.json`. Zero runtime Python server or live API calls required during judging demos.
- **Recharts & Dynamic Timeline:** Recharts renders stage and rainfall hyetographs with analytical uncertainty bands (`upper`/`lower`). Time slider and replay engine (1x, 2x, 5x) scrub index across `event_timeseries.json`.
- **Styling & Depth:** Calm, high-contrast agricultural design system (#F5F8FA background, #FFFFFF cards, #173B57 text, #287BB5 blue, #B7791F amber, #B4232F red) with crisp structural borders and zero distracting neon glows.
- **No Hardcoded Dates/Metrics:** Dates, timestamps, and performance metrics must be dynamically parsed from exported JSON data files, never hardcoded (Trap B10 / Trap C1).
- **Bilingual Interface:** Every user-facing label, advisory text, metric sub-label, and tooltip supports instantaneous English (`en`) and Bengali (`bn`) toggling with 100% key parity (252 keys).
- **Accessibility & CVD:** Use CVD-safe palette (WCAG AA $\ge 4.5:1$) and `@media (prefers-reduced-motion: reduce)` support. Status flags must use icon + text label + color (never color alone, per §4.3).
- **Limits Panel:** The operational limits panel must remain permanently visible on screen (Trap C3).

## 3. Project Status & Work Orders
- **P1-SWOT through P7-MAP:** **DONE** (Full Module 1 hydrological pipeline, SWOT Manning calibration, Muskingum-Cunge routing, validation metrics, Leaflet GIS integration, and OSM meanders).
- **WO-014 (Agrarian UI/UX Redesign & 100% Bilingual Parity):** **DONE** (Complete migration to high-contrast agricultural palette #F5F8FA/#FFFFFF/#173B57, first-page 5-second triage, 252 localized keys with authentic agricultural Bangla, zero contrast bugs).
- **WO-015 (Documentation Synchronization & Dual-Module Architecture):** **DONE** (Re-architectured project into Module 1 Operational Warning and Module 2 Historical Rainfall Trend Explorer; established 4 status tiers; annotated baseline comparison discrepancies as under audit).
- **WO-019 (Module 2 Build Prompts Playbook Specification):** **DONE** (Finalized 8-prompt master specification P-T1 to P-T8 in `docs/MODULE_2_BUILD_PROMPTS.md` and `MODULE_2_BUILD_PROMPTS.md`).
- **Test Suite Status:** **40/40** pytest unit tests pass cleanly in ~7.3s (`python -m pytest tests/ -q`).
- **Current Active Task:** **WO-010** (Release QA & submission compliance audit).
- **Pending Human Verification:**
  - `[OPEN]` Official NASA Space Apps challenge title publication (Oct 28).
  - `[OPEN]` Local Lead qualification pre-screening confirmation & pre-existing code inquiry.

## 4. Definition of Done
- **Data (R4):** Real sample inspected, fill values handled, fixture saved, `docs/SOURCES.md` updated.
- **Science (R3):** Formulas checked against peer-reviewed literature, units verified, limits stated in `docs/DECISIONS.md` and Limits Panel.
- **Backend (R5):** Contract written, offline fallback verified, test suite passing with 100% green tests (40/40).
- **Frontend (R6/R7):** Next.js App Router bound to JSON exports, CVD-safe palette, bilingual toggle, limits panel permanently visible, zero console errors.
- **Compliance (R9):** All sources cited in `docs/SOURCES.md`, licenses confirmed, zero banned content, `docs/AI_USE_LOG.md` and `docs/AGENTS.md` kept strictly up-to-date.


