# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router), Vanilla CSS Design System with custom tokens, Recharts for scientific hydrograph time-series, SVG vector river flow engine, Lucide React icons.

## Users

- **Primary User:** Upazila Agriculture Officers (UAOs), Department of Agricultural Extension (DAE) field agronomists, and local disaster committee leads in Sunamganj and Sylhet (Haor basin, northeastern Bangladesh).
- **Situation:** Mid-April pre-monsoon season when Boro rice (the region's single annual staple crop) is 80–90% mature and intense cloudbursts strike the un-gauged Meghalaya hills across the international border.
- **Job to be Done:** Decide whether to mobilize emergency harvesting combines and order farmers to cut immature Boro crops immediately (sacrificing 10–20% yield) or wait for full ripening while facing catastrophic 100% crop loss from flash-flood embankment overtopping.

## Product Purpose

HydroSense-SWOT bridges the critical upstream observational gap between transboundary Meghalaya rainfall and vulnerable downstream Haor wetlands. It transforms complex satellite data into an authoritative, single-glance decision framework ("Harvest Decision Flag": GREEN / AMBER / RED) for rapid agricultural triage, protecting vulnerable farming livelihoods. Success means an agriculture officer can inspect the interface in 3 seconds, evaluate the hydrodynamic basis, and formulate community harvest advisories before floodwaters overwhelm low-lying polders.

## Positioning

HydroSense-SWOT unifies two complementary Earth-observation capabilities into a single cohesive platform for Bangladesh's Haor region:

1. **Module 1 — Operational Haor Flood-Routing & Decision Support System `[DUAL-MODE: DEMO & VERIFIED REAL]`:** Routes satellite precipitation through border river reaches parameterized from NASA SWOT Ka-band radar interferometry. Operates in two distinct modes: an offline synthetic demonstration mode (`--mode demo`) for UI and logic testing, and a verified real-data mode (`--mode real`) integrating authentic NASA SWOT Version D reach shapefiles, NASA GPM IMERG Early (`3B-HHR-E`), and official BWDB Kanaighat (`SW266`) gauge observations under strict fail-closed cryptographic provenance.
2. **Module 2 — Haor Rainfall Trend Explorer `[IMPLEMENTED - FAIL-CLOSED ON REAL DATA]`:** Evaluates 25 complete pre-monsoon seasons (2001–2025, 1,525 daily granules) of research-quality NASA GPM IMERG Final Run precipitation data to determine whether pre-monsoon precipitation volume ($PRCPTOT_{AM}$) or extreme storm frequency ($R50mm_{AM}$) has changed with statistical significance in transboundary quadrant zones. (Locked alignment with NASA Space Apps Challenge 2026: *“Be An Earth System Trend Detective!”* per `docs/DECISIONS.md`).

## Implementation & Validation Status

- **Implemented `[CONFIRMED]`:**
  - **Dual-Mode Pipeline Execution:** Supported via `--mode demo` (synthetic engineering scenarios) and `--mode real` (fail-closed verified NASA & BWDB ingestion).
  - **Real SWOT & SWORD Ingestion:** 19 official Surma River reaches (`45220400501` to `45220400591`, $123.0\text{ km}$ length) from SWORD v16 / SWOT RiverSP Version D shapefiles, with target outlet at Kanaighat (`45220400591`).
  - **Independently Delineated Catchment:** Local Meghalaya quickflow area ($425\text{ km}^2$) and transboundary Barak macro-basin ($26,200\text{ km}^2$) replacing legacy synthetic benchmarks.
  - **Literature Hydraulic Parameterization with Physical Uncertainty:** Literature-assigned Manning's $n = 0.033$ with bounds $[0.025, 0.045]$ (Chow 1959; Arcement & Schneider 1989), low-flow bed level proxy ($z_{\text{bed}} = 3.56\text{ m}$), and sensitivity analysis across $n, C, Q_0, c_k$.
  - **Retrospective Flash Flood Hindcast:** Evaluated against 40 raw, independent BWDB SW266 gauge observations during the May 28 – June 4, 2024 flash flood event (relative stage-rise MAE = $1.50\text{ m}$, observed peak = $14.15\text{ m PWD}$, peak timing window = May 31 00:00–03:00 UTC).
  - **Automated 3-tier Harvest Flag logic:** GREEN (Normal), AMBER (Caution / 80% danger level), RED (Critical Harvest / 100% danger level at $13.20\text{ m PWD}$). Flags are instantaneous state classifications; operational lead times are strictly disclaimed without an issue-time forecast product.
  - **Bilingual localization (English / বাংলা):** 100% key parity across headers, metric cards, harvest directives, and modal dialogs.
  - **Full Automated Test Suite:** 93/93 unit and integration tests passing hermetically (`python -m pytest tests/`).
  - **Frontend Delivery Dashboard:** Compiled cleanly in Next.js 16 App Router across `/` (Overview & Map), `/forecast` (Hydrograph), `/advisory` (Action Bulletins), and `/trends` (Module 2 Trend Explorer).
- **Proposed Research `[PROPOSED RESEARCH]`:**
  - Multi-sensor soil moisture integration (SMAP/GLDAS) and causal issue-time hindcast experiments to rigorously evaluate predictive operational lead time.

## Operating Context

- **Operating Environment:** Low-bandwidth mobile and laptop screens in district agricultural extension offices, field stations, and disaster control rooms in northeastern Bangladesh.
- **Cognitive Load:** High stress during pre-monsoon storm windows with conflicting rumors and urgent farmer distress calls. Requires zero clutter, instant visual hierarchy, and bilingual (English and বাংলা) clarity.
- **Data Rhythm:** 30-minute operational time steps for flood warning; GPM IMERG Early Run observations refreshed at ~4-hour satellite latency; offline SWOT passes updating reach roughness calibrations every 21-day orbital cycle; multi-decadal annual time series for trend analysis.

## Capabilities and Constraints

- **Physical Constraints:**
  - SWOT orbital repeat period is 21 days; SWOT is used for offline geometric parameterization and hydraulic calibration, not continuous real-time telemetry.
  - Channels narrower than 100 m are not resolved by SWOT HR RiverSP.
  - 1D channel routing; 2D floodplain inundation and localized embankment breaches are not explicitly modeled.
  - IMERG Early Run reflects satellite-observed precipitation (~4-hour latency), not predictive numerical weather forecast models.
  - Historical rainfall trends provide retrospective risk context; they do **NOT** prove increasing flood occurrence, do **NOT** predict the next flood date, and do **NOT** alter real-time flood warning accuracy.

## Brand Commitments

- **Tone & Identity:** Cinematic scientific instrument, authoritative, calm, high-precision, empathetic to agrarian stakes.
- **Palette Principles:** CVD-safe cividis/cyan/navy hierarchy; emerald strictly for safe conditions; amber/crimson reserved exclusively for hydrological alert states.
- **Name:** HydroSense-SWOT.

## Evidence on Hand

- NASA SWOT Level 2 High-Rate River Single-Pass Vector Version D (`SWOT_L2_HR_RiverSP_reach_D`, PO.DAAC DOI: `10.5067/SWOT-RIVSP-D`).
- NASA GPM IMERG Early Run V07B (`GPM_3IMERGHHE`, prefix `3B-HHR-E`, ~4-hour latency, operational routing).
- NASA GPM IMERG Final Run V07 (`GPM_3IMERGDF`, 2001–2025, GPCC gauge-adjusted, climatology).
- Bangladesh Water Development Board (BWDB) Kanaighat gauge records (Station `SW266`, Danger Level 13.20 m PWD = 12.75 m MSL).
- Independently delineated SWORD v16 Asia river topology (19 Surma reaches, 123 km length, 425 km² quickflow area) in `data/real/basin_geometry.json`.
- Verified real-data retrospective hindcast report: May 28 – June 4, 2024 flash flood event evaluated strictly on raw observation timestamps in `docs/evidence/real_hindcast_report.md`.
- Published research: Haor Basin Flash Flood Assessment (*J. Environ. Sci. & Nat. Resour.* 2019; 149,224 ha lost in Sunamganj).

## Product Principles

1. **A Scientific Instrument, Not a Toy:** Prioritize data integrity, verifiable units, analytical uncertainty bounds, and explicit physical assumptions over superficial visual decoration.
2. **Instant Decision Clarity:** UAOs must understand harvest urgency within 3 seconds; primary status indicators (GREEN / AMBER / RED) must dominate visual hierarchy.
3. **Transparent Operational Limits:** Never conceal model boundaries; keep calibration bounds, satellite latency, and reach limits visible and accessible.
4. **Cultural & Linguistic Resonance:** Bilingual English and Bengali terminology crafted for real agricultural extension workflows in rural Bangladesh.
5. **Fail-Safe Offline Reliability:** Mission-critical cached data fixtures ensure smooth operation during regional internet disruptions.

## Accessibility & Inclusion

- Color-vision deficiency (CVD) safety: Statuses communicate through distinct icons, shapes, and typography in addition to color.
- High contrast agricultural light-theme telemetry (#F5F8FA canvas, #FFFFFF cards, #173B57 navy text) suitable for field operation under direct sunlight or dim power-outage environments.
- Fully semantic HTML, ARIA dialog and live regions for screen readers, and clear Bengali typography via Noto Sans Bengali.
