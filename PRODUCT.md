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

Unlike conventional flood forecasts that rely on sparse downstream river gauges or uncalibrated runoff models without cross-border channel geometry, HydroSense-SWOT routes near-real-time NASA GPM IMERG Early Run satellite rainfall through un-gauged border river reaches whose physical hydraulic conveyance (Manning roughness, width, water surface elevation, and reach slope) is parameterized offline using NASA SWOT Ka-band radar interferometry.

## Operating Context

- **Operating Environment:** Low-bandwidth mobile and laptop screens in district agricultural extension offices, field stations, and disaster control rooms in northeastern Bangladesh.
- **Cognitive Load:** High stress during pre-monsoon storm windows with conflicting rumors and urgent farmer distress calls. Requires zero clutter, instant visual hierarchy, and bilingual (English and বাংলা) clarity.
- **Data Rhythm:** 30-minute operational time steps; GPM IMERG Early Run observations refreshed at ~4-hour satellite latency; offline SWOT passes updating reach roughness calibrations every 21-day orbital cycle.

## Capabilities and Constraints

- **Confirmed Capabilities:**
  - Automated Manning roughness calibration ($n \in [0.025, 0.10]$) on 4 SWOT river reaches (`22211000011`, `22211000012`, `22211000021`, `22211000022`).
  - 4-sub-reach Muskingum-Cunge hydrologic routing down the Surma corridor to the BWDB Kanaighat gauge station (SW108).
  - Automated 3-tier Harvest Flag logic (GREEN: Normal, AMBER: Caution / 80% danger level, RED: Critical Harvest / 100% danger level at 13.20 m PWD).
  - Bilingual localization (English / বাংলা) across headers, metric cards, harvest directives, and modal dialogs.
  - Interactive event replay controls with scrubber, reach inspector, and live hydrodynamic verification statistics (NSE, KGE, PBIAS).
- **Physical Constraints:**
  - SWOT orbital repeat period is 21 days; SWOT is used for offline geometric parameterization and hydraulic calibration, not continuous real-time telemetry.
  - Channels narrower than 100 m are not resolved by SWOT HR RiverSP.
  - 1D channel routing; 2D floodplain inundation and localized embankment breaches are not explicitly modeled.
  - IMERG Early Run reflects satellite-observed precipitation (~4-hour latency), not predictive numerical weather forecast models.

## Brand Commitments

- **Tone & Identity:** Cinematic scientific instrument, authoritative, calm, high-precision, empathetic to agrarian stakes.
- **Palette Principles:** CVD-safe cividis/cyan/navy hierarchy; emerald strictly for safe conditions; amber/crimson reserved exclusively for hydrological alert states.
- **Name:** HydroSense-SWOT.

## Evidence on Hand

- NASA SWOT L2 HR RiverSP 2.0 (PO.DAAC Collection C2799438271-POCLOUD).
- NASA GPM IMERG Early Run V07B (`GPM_3IMERGHHE`, ~4-hour latency).
- Bangladesh Water Development Board (BWDB) Kanaighat gauge records (Station SW108, Danger Level 13.20 m PWD).
- Verified historical validation event: April 10–13, 2026 transboundary flash flood replay.
- Published research: Haor Basin Flash Flood Assessment (*J. Environ. Sci. & Nat. Resour.* 2019; 149,224 ha lost in Sunamganj).
- Verified model performance: NSE 0.73, KGE 0.68, PBIAS +1.9%, Timing Error -2.0 h, Lead Time 22.5 h (vs NSE -0.15 and Timing Error -24.0 h for rainfall baseline).

## Product Principles

1. **A Scientific Instrument, Not a Toy:** Prioritize data integrity, verifiable units, analytical uncertainty bounds, and explicit physical assumptions over superficial visual decoration.
2. **Instant Decision Clarity:** UAOs must understand harvest urgency within 3 seconds; primary status indicators (GREEN / AMBER / RED) must dominate visual hierarchy.
3. **Transparent Operational Limits:** Never conceal model boundaries; keep calibration bounds, satellite latency, and reach limits visible and accessible.
4. **Cultural & Linguistic Resonance:** Bilingual English and Bengali terminology crafted for real agricultural extension workflows in rural Bangladesh.
5. **Fail-Safe Offline Reliability:** Mission-critical cached data fixtures ensure smooth operation during regional internet disruptions.

## Accessibility & Inclusion

- Color-vision deficiency (CVD) safety: Statuses communicate through distinct icons, shapes, and typography in addition to color.
- High contrast dark-mode telemetry suitable for field operation under direct sunlight or dim power-outage environments.
- Fully semantic HTML, ARIA dialog and live regions for screen readers, and clear Bengali typography via Noto Sans Bengali.
