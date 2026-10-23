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

HydroSense-SWOT bridges the critical upstream observational gap between transboundary Meghalaya rainfall and vulnerable downstream Haor wetlands. It transforms complex satellite data into an authoritative, single-glance decision framework ("Harvest Decision Flag": GREEN / AMBER / RED) with 20–30 hours of actionable lead time, protecting hundreds of thousands of farming livelihoods. Success means an agriculture officer can look at the interface in 3 seconds, trust the hydrodynamic basis, and trigger community harvest advisories before floodwaters cross the border gauge.

## Positioning

HydroSense-SWOT unifies two complementary Earth-observation capabilities into a single cohesive platform for Bangladesh's Haor region:

1. **Module 1 — Operational Haor Flood-Warning System `[IMPLEMENTED]`:** Routes near-real-time NASA GPM IMERG Early Run satellite rainfall through un-gauged border river reaches whose physical hydraulic conveyance (Manning roughness, width, water surface elevation, and reach slope) is parameterized offline using NASA SWOT Ka-band radar interferometry, generating rapid 20–30h harvest decision advisories.
2. **Module 2 — Haor Rainfall Trend Explorer `[PLANNED / PROPOSED RESEARCH]`:** Evaluates 26+ years of research-quality NASA GPM IMERG Final Run precipitation data (1998–2025) to determine whether pre-monsoon precipitation volume ($PRCPTOT_{AM}$) or extreme storm frequency ($R50mm_{AM}$) has changed with statistical significance in upstream catchments. (Provisional alignment with NASA Space Apps Challenge 2026: *“Be An Earth System Trend Detective!”*).

## Implementation & Validation Status

- **Implemented `[CONFIRMED]`:**
  - Automated Manning roughness calibration ($n \in [0.025, 0.10]$) on 4 SWOT river reaches (`22211000011`, `22211000012`, `22211000021`, `22211000022`).
  - 4-sub-reach Muskingum-Cunge hydrologic routing down the Surma corridor to the BWDB Kanaighat gauge station (SW108/SW266).
  - Automated 3-tier Harvest Flag logic (GREEN: Normal, AMBER: Caution / 80% danger level, RED: Critical Harvest / 100% danger level at 13.20 m PWD).
  - Bilingual localization (English / বাংলা) across headers, metric cards, harvest directives, and modal dialogs.
  - Interactive event replay controls with day rail, custom skip, reach inspector, and live hydrodynamic verification statistics.
- **Partially Implemented / Under Audit `[UNRESOLVED]`:**
  - Validation report baseline comparison subroutine (`pipeline/validation_report.py`) and lookahead step configuration (`pipeline/run_pipeline.py`) are under active audit due to a script-level parameter bug; comparative gains vs baseline require re-benchmarking.
- **Planned `[PLANNED]`:**
  - Rainfall-first Trend Explorer MVP backend: Ingestion of NASA GPM IMERG Final Run V07 (`GPM_3IMERGDF`), calculation of April–May $PRCPTOT$ and $R50mm$ indicators using cell-first protocol, Theil-Sen slope estimation with analytical 95% CI, and Modified Mann-Kendall (Hamed & Rao 1998) autocorrelation-corrected trend testing.
- **Proposed Research `[PROPOSED RESEARCH]`:**
  - Analysis of spatial trend heterogeneity between the steep Meghalaya escarpment and lowland Haor wetlands, and evaluation of potential multi-variable challenge extensions (e.g., soil moisture proxies) upon full NASA challenge resource publication.

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

- NASA SWOT L2 HR RiverSP 2.0 (PO.DAAC Collection C2799438271-POCLOUD).
- NASA GPM IMERG Early Run V07B (`GPM_3IMERGHHE`, ~4-hour latency, operational routing).
- NASA GPM IMERG Final Run V07 (`GPM_3IMERGDF` / `GPM_3IMERGM`, 1998–2025, GPCC gauge-adjusted, climatology).
- Bangladesh Water Development Board (BWDB) Kanaighat gauge records (Station SW108/SW266, Danger Level 13.20 m PWD).
- Verified historical validation event: April 1 – May 31, 2026 transboundary flash flood replay.
- Published research: Haor Basin Flash Flood Assessment (*J. Environ. Sci. & Nat. Resour.* 2019; 149,224 ha lost in Sunamganj).
- Verified model performance on April–May 2026 test event: NSE 0.73, KGE 0.68, PBIAS +1.9%, Timing Error -2.0 h, Lead Time 22.5 h. (Note: Baseline comparison metrics are undergoing formal re-audit).

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
