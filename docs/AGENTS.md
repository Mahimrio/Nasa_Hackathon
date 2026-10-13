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

### Frontend Delivery Dashboard (Tier 4 — Next.js 16)
- **Framework & Architecture:** Next.js 16 App Router in `ui/` conforming to `docs/DESIGN_ARCHITECTURE.md`. Modular components organized under `ui/app/components/` (`AppHeader`, `PageContextBar`, `RiverMapPanel`, `HarvestDecisionPanel`, `HydrographPanel`, `ValidationMetricsPanel`, `OperationalLimitsPanel`, `ReachInspectorModal`, `AdvisoryBulletinModal`, `ModelArchitectureModal`).
- **Data Hydration:** The UI reads purely static JSON fixtures from `ui/public/data/*.json` (generated via `python scripts/export_json.py`). Zero runtime Python server or live API calls required during judging demos.
- **Recharts & Dynamic Timeline:** Recharts renders stage and rainfall hyetographs with analytical uncertainty bands (`upper`/`lower`). Time slider and replay engine (1x, 2x, 5x) scrub index across `event_timeseries.json`.
- **Styling & Depth:** Complete design token implementation in `ui/app/globals.css` with atmospheric gradients, glassmorphism (`backdrop-filter: blur(18px)`), restrained neumorphism, and vector river flow and gauge sonar animations.
- **No Hardcoded Dates/Metrics:** Dates, timestamps, and performance metrics must be dynamically parsed from exported JSON data files, never hardcoded (Trap B10 / Trap C1).
- **Bilingual Interface:** Every user-facing label, advisory text, metric sub-label, and tooltip supports instantaneous English (`en`) and Bengali (`bn`) toggling.
- **Accessibility & CVD:** Use CVD-safe palette (WCAG AA $\ge 4.5:1$) and `@media (prefers-reduced-motion: reduce)` support. Status flags must use icon + text label + color (never color alone, per §4.3).
- **Limits Panel:** The operational limits panel must remain permanently visible on screen (Trap C3).

## 3. Project Status & Work Orders
- **P1-SWOT (Real NASA SWOT Ingestion):** **DONE** (Quality gating, slope SNR filtering, SWORD v16 pre-screening, `--mode real` support).
- **P2-IMERG (Real GPM IMERG & BWDB Gauge Ingestion):** **DONE** (30-min end-of-interval shift, BST to UTC conversion, rolling median filter, GeoJSON sub-basins).
- **P3-MANNING (Manning Roughness Real Calibration):** **DONE** (Stage-dependent filter $>z_{bed}+0.5\text{m}$, bounded optimization $[0.025, 0.10]$, inverse-variance weighting, pre-event time split Jan 2024 – Mar 2026, diagnostic plots).
- **P4-ROUTING (Real Hydrodynamic Routing & Uncertainty):** **DONE** (Dynamic wave celerity $c = \frac{5}{3}V_{mean} \approx 1.50\text{ m/s}$, 25.9h lag, 4-sub-reach cascade, $\pm 0.18\text{ m}$ uncertainty propagation, data-driven peak date `.idxmax()`, $4 \times 3$ sensitivity analysis).
- **P5-VALIDATION (Scientific Validation & Baseline Benchmarking):** **DONE** (15-min tolerance alignment `pd.merge_asof`, strict test-period Apr 1 – May 31, 2026 restriction, NSE = `0.73` vs `-0.15` baseline, KGE = `0.68`, PBIAS = `+1.9%`, Timing Error = `-2.0 h`, Warning Lead Time = `22.5 h`, report & plots in `data/processed/validation_plots/`).
- **P6-DASHBOARD (Dashboard Real Data Integration):** **DONE** (3-line hydrograph with baseline, $\pm 0.18\text{ m}$ uncertainty envelope, amber dashed danger line, CVD-safe continuous Cividis reach map, SWOT asterisks, slope hatching, dynamic travel time & IMERG timestamps, permanent limits, 0 console errors, `npm run build` static compilation passing with code 0).
- **Test Suite Status:** **33/33** pytest unit tests pass cleanly in 7.46s (`python -m pytest tests/ -v`).
- **Current Active Task:** **P7-INTERACTIVE-MAP** (Interactive Leaflet/Mapbox Geographic Integration) or **WO-010** (Release QA & submission compliance audit).
- **Pending Human Verification:**
  - `[OPEN]` Official NASA Space Apps challenge title publication (Oct 28).
  - `[OPEN]` Local Lead qualification pre-screening confirmation.

## 4. Definition of Done
- **Data (R4):** Real sample inspected, fill values handled, fixture saved, `docs/SOURCES.md` updated.
- **Science (R3):** Formulas checked against peer-reviewed literature, units verified, limits stated in `docs/DECISIONS.md` and Limits Panel.
- **Backend (R5):** Contract written, offline fallback verified, test suite passing with 100% green tests.
- **Frontend (R6/R7):** Next.js App Router bound to JSON exports, CVD-safe Cividis colormap, bilingual toggle, limits panel permanently visible, zero console errors.
- **Compliance (R9):** All sources cited in `docs/SOURCES.md`, licenses confirmed, zero banned content, `docs/AI_USE_LOG.md` and `docs/AGENTS.md` kept strictly up-to-date.

