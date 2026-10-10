# AI USE LOG — HydroSense-SWOT

In compliance with NASA Space Apps Challenge 2026 guidelines and the project steering protocol, all AI assistance and model interactions are transparently documented here.

---

| Date | Contributor | Tool / Model | Role | Task Description | Where Output is Used | Reviewed By (Human) | Errors / Corrections Made |
|---|---|---|---|---|---|---|---|
| 2026-10-09 | Dev Lead | Gemini 3.8 Flash (High) | R4 Data Engineer | Generated realistic, scientifically constrained NetCDF/CSV test fixtures for SWOT reaches, IMERG MAP, and Kanaighat gauge | `scripts/generate_fixtures.py`, `data/fixtures/` | Team Lead | Corrected `datetime64[us, UTC]` NetCDF encoding incompatibility with pandas 3.0 / numpy 2.5 |
| 2026-10-09 | Dev Lead | Gemini 3.8 Flash (High) | R3 Scientist | Implemented Manning roughness calibration with bounded optimization and slope noise filter | `pipeline/manning_calibration.py` | Hydrology Lead | Verified bounds $[0.025, 0.10]$ and exclusion of low-flow passes |
| 2026-10-09 | Dev Lead | Gemini 3.8 Flash (High) | R3 Scientist | Implemented Muskingum-Cunge hydrologic routing, wave celerity computation, and Manning stage inversion | `pipeline/muskingum_cunge.py` | Hydrology Lead | Adjusted contributing catchment area from 2400 km² to 185 km² for Kanaighat tributary to match realistic peak flood stage (13.78m vs 13.90m observed) |
| 2026-10-09 | Dev Lead | Gemini 3.8 Flash (High) | R7 UX Designer | Implemented Harvest Flag logic (GREEN / AMBER / RED) with bilingual advisory text (English / বাংলা) | `pipeline/harvest_flag.py` | Dev Lead | Confirmed threshold ratios (AMBER at 80% danger level, RED at 100%) |
| 2026-10-09 | Dev Lead | Gemini 3.8 Flash (High) | R3 / R9 | Implemented performance metric evaluation (NSE, KGE, PBIAS, timing error, lead time) with 2dp formatting | `pipeline/metrics.py` | Hydrology Lead | Fixed `resample('1h').mean()` on non-numeric columns in pandas 3.0 |
| 2026-10-09 | Dev Lead | Gemini 3.8 Flash (High) | R5 Backend / R10 QA | Built and executed Minimum Viable Pipeline (MVP) runner verifying all 7 architectural gates and wrote test suite | `pipeline/run_pipeline.py`, `tests/test_pipeline.py` | Team Lead | Passed 6 pytest unit tests in 0.90s; verified all 7 steps end-to-end |
| 2026-10-09 | Docs Lead | Gemini 3.8 Flash (High) | R9 Compliance | Formatted and created core state and compliance documents (`DECISIONS.md`, `TASKS.md`, `SOURCES.md`, `RISK_REGISTER.md`, `AGENTS.md`, `README.md`) | Workspace root | Team Lead | None |
| 2026-10-09 | Dev Lead | Gemini 3.8 Flash (High) | R5 Backend | Built JSON pipeline exporter converting NetCDF/CSV outputs into static files for client consumption | `scripts/export_json.py`, `ui/public/data/` | Pipeline Lead | Verified JSON files load synchronously in Next.js |
| 2026-10-09 | Dev Lead | Gemini 3.8 Flash (High) | R6 Frontend / R7 UX | Scaffolded Next.js 16 app with design system CSS, Recharts hydrograph, reach SVG map, bilingual toggling, and limits panel | `ui/app/globals.css`, `ui/app/layout.js`, `ui/app/page.js` | Team Lead | Verified in browser subagent; zero console errors |
| 2026-10-09 | Pitch Lead | Gemini 3.8 Flash (High) | R8 Storyteller | Generated compliant 30s Global and 240s Local video scripts and screen recording guidelines strictly based on `SOURCES.md` | `VIDEO_SCRIPTS.md` | Team Lead | Verified word counts and alignment with Bangladesh Participants Guide |
| 2026-10-09 | Dev Lead | Gemini 3.8 Flash (High) | R5 / R10 | Initialized Git repository with proper `.gitignore`, rebased onto remote, and pushed to `Mahimrio/Nasa_Hackathon` | `.gitignore`, GitHub repo | Team Lead | Verified clean working tree and tracked files |
