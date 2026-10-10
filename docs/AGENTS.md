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
- **Framework & Directory:** Next.js 16 App Router in `ui/`. Stateful components must declare `"use client"`.
- **Data Hydration:** The UI reads purely static JSON fixtures from `ui/public/data/*.json` (generated via `python scripts/export_json.py`). Zero runtime Python server or live API calls required during judging demos.
- **Recharts & Dynamic Timeline:** Recharts renders stage and rainfall hyetographs with analytical uncertainty bands (`upper`/`lower`). Time slider scrubs index across `event_timeseries.json`.
- **No Hardcoded Dates/Metrics:** Dates, timestamps, and performance metrics must be dynamically parsed from exported JSON data files, never hardcoded (Trap B10 / Trap C1).
- **Bilingual Interface:** Every user-facing label, advisory text, metric sub-label, and tooltip must support instantaneous English (`en`) and Bengali (`bn`) toggling.
- **Accessibility & CVD:** Use Cividis-inspired CVD-safe palette (WCAG AA $\ge 4.5:1$). Status flags must use icon + text label + color (never color alone, per §4.3).
- **Limits Panel:** The operational limits panel must remain permanently visible on screen (Trap C3).

## 3. Project Status & Work Orders
- **WO-001 to WO-007 (Scientific Pipeline):** **DONE** (NSE: `0.74`, KGE: `0.68`, PBIAS: `+1.8%`, Timing: `-5.5 h`, Lead: `21.0 h`). All 6 unit tests pass.
- **WO-008 (Next.js Interactive Dashboard):** **DONE** (`ui/` app running on port 3000, verified via browser subagent with zero console errors).
- **WO-009 (Video Demo Scripts):** **DONE** (Three-video pipeline: Video 1 Prescreening 240s, Video 2 Local Judging 240s, Video 3 Global 30s in `VIDEO_SCRIPTS.md` matching Participants Guide §08).
- **Current Active Task:** **WO-010** (Release QA & submission compliance audit).
- **Pending Human Verification:**
  - `[OPEN]` Official NASA Space Apps challenge title publication (Oct 28).
  - `[OPEN]` Local Lead qualification pre-screening confirmation.

## 4. Definition of Done
- **Data (R4):** Real sample inspected, fill values handled, fixture saved, `SOURCES.md` updated.
- **Science (R3):** Formulas checked against literature, units verified, limits stated.
- **Backend (R5):** Contract written, offline fallback verified, tests passing.
- **Frontend (R6/R7):** Next.js App Router bound to JSON exports, CVD-safe cividis colormap, bilingual toggle, limits panel permanently visible, zero console errors.
- **Compliance (R9):** All sources cited in `docs/SOURCES.md`, licenses confirmed, zero banned content, `docs/AI_USE_LOG.md` and `docs/AGENTS.md` kept strictly up-to-date.

