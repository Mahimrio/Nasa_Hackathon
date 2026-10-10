# TASKS (Single Source of Truth)

**Now doing:** WO-010 (Release QA & submission compliance audit)  
**Blocked (needs a human):** 
- [OPEN] Official challenge statement release on Oct 28 (NASA SMD).
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
| **WO-008** | Interactive Delivery Interface (Web Dashboard) | R6 Frontend | Dev Lead | **DONE** | Hour 22 | Reach map (cividis), Harvest Flag card, hydrograph with uncertainty, time slider, permanent Limits Panel | Next.js 16 app built in `ui/`, verified via browser subagent |
| **WO-009** | Video demo scripts (Three-video pipeline) | R8 Storyteller | Pitch Lead | **DONE** | Hour 28 | Scripts written strictly from `SOURCES.md` claims | Complete scripts for Video 1 (240s prescreening), Video 2 (240s local demo), and Video 3 (30s global) in `VIDEO_SCRIPTS.md` |
| **WO-010** | Release QA & submission compliance audit | R10 QA | Team Lead | **TODO** | Hour 36 | Clean-checkout run, offline fixture test, public repo check, no banned content | 2 hours before deadline |

---

## Detailed Work Orders

### WO-006: End-to-End Minimum Viable Pipeline (MVP)
* **Goal:** Execute the 7-step data pipeline end-to-end.
* **Why it matters:** Guarantees scientific validity before any UI work begins (avoids Trap C1).
* **Role:** R5 Backend Engineer / R10 QA.
* **Result:** PASSED. NSE: 0.74, KGE: 0.68, PBIAS: +1.8%, Timing Error: -5.5h, Warning Lead Time: 21.0h.

### WO-008: Interactive Delivery Interface (Web Dashboard)
* **Goal:** Deliver single-screen dashboard for Sunamganj Upazila Agriculture Officer.
* **Why it matters:** Fulfills Presentation & Relevance scoring criteria.
* **Role:** R6 Frontend & Data-Viz Engineer + R7 UX Designer.
* **Result:** PASSED. Built Next.js 16 App Router application (`ui/`) with cividis-styled reach map SVG, Recharts hydrograph with dynamic ±0.18m uncertainty band, time slider driving timeseries snapshots, harvest advisory card with EN/বাংলা toggle, 5 scientific validation metrics, and permanently visible operational limits panel. Verified in live browser.

### WO-009: Video Demo Scripts (Next Step)
* **Goal:** Write word-for-word scripts for the 240s local qualification video and 30s global elevator pitch.
* **Why it matters:** Fulfills Presentation and Communication scoring criteria.
* **Role:** R8 Storyteller / Pitch Lead.
* **Done When:** Scripts written strictly adhering to verified claims in `SOURCES.md`, timed to exact duration bounds.
