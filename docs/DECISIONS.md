# DECISIONS — HydroSense-SWOT

**Challenge (exact title + link):**  
[OPEN — to be confirmed Oct 28 when official statements are published; candidate fit: *Field Shift: Adapting Farms with NASA Data* or *Be An Earth System Trend Detective!*]

**Award target (quote the award wording):**  
"Local Impact: The solution demonstrating the greatest potential for local impact."  
*(Secondary contender: "Best Use of Data: The solution that best makes space data accessible, or applies it uniquely.")*

**Elevator Sentence (verbatim from architecture):**  
> A Sunamganj upazila agriculture officer opens a phone screen. One flag tells her whether the Surma river is likely to breach before the Boro is ready to cut. That flag comes from SWOT measurements of river width, height and slope, combined with rainfall that fell on the Meghalaya hills four hours ago.

**Creative brief:**  
* **User:** Upazila Agriculture Officer in Sunamganj / Sylhet (Haor basin, Bangladesh).
* **Tension:** April pre-monsoon flash floods breach embankments right before Boro rice ripens. Cut immature crop (reduced yield) or wait and risk losing 100% (~214,000 tonnes lost in April 2026).
* **Our angle:** Route near-real-time GPM IMERG Early Run rainfall through un-gauged border reaches parameterized offline by NASA SWOT satellite river geometry (width, stage, slope2).
* **Signature moment:** Dragging the event slider across April 10–13: Meghalaya rain pulses flash, the Harvest Flag turns RED ~22.5 hours before the local gauge breaches the 13.20m danger level (NSE 0.73, Peak Timing -2.0h).
* **What we deliberately won't do:** Will NOT claim real-time continuous SWOT monitoring, will NOT model 2D floodplain inundation, will NOT resolve narrow channels < 100m.

**Visual idea (one sentence):**  
A high-contrast hydrological mission dashboard combining a CVD-safe cividis reach map, an authoritative single-glance Harvest Flag badge, and an interactive hydrograph with analytical uncertainty bands.

**Scope IN (The Vertical Slice):**
1. NASA SWOT L2 HR RiverSP 2.0 reach ingestion and quality-gated offline Manning calibration ($n \in [0.025, 0.10]$).
2. GPM IMERG Early Run 30-min MAP routing via 4-sub-reach Muskingum-Cunge down the Surma corridor to Kanaighat.
3. Automated Harvest Flag generation (GREEN / AMBER / RED) with bilingual advisory (English / বাংলা).
4. Rigorous verification against BWDB Kanaighat gauge data during the historic April 2026 event reporting NSE (0.73), KGE (0.68), PBIAS (+1.9%), timing error (-2.0h), and lead time (22.5h) formatted to 2 decimal places.
5. Always-visible Limits Panel acknowledging all physical constraints and assumptions.

**Scope OUT:**
1. Multi-basin dropdown switching (restricted strictly to Surma-Kushiyara Haor corridor).
2. Live NASA API calls during live judging (cached fixtures are primary to prevent venue WiFi failures).
3. 2D hydrodynamic hydrodynamic inundation modeling / backwater physics.
4. Rainfall forecasting beyond observed satellite data (IMERG Early Run is observed rainfall, not forecast).
5. Fake or hard-coded performance metrics.

**Data Sources:**
- **NASA SWOT L2 HR RiverSP 2.0** | PO.DAAC / Hydrocron | Open Access | `earthaccess` & offline fixture | Verified by MVP runner.
- **NASA GPM IMERG Early Run V07** | GES DISC `GPM_3IMERGHHE` | Open Access | OPeNDAP & offline fixture | Verified by MVP runner.
- **BWDB / FFWC River Stage Data** | Bangladesh Water Development Board | Public records | Kanaighat station `SW108` | Verified by MVP runner.
- **SWORD v16 & HydroSHEDS v1** | hydrosheds.org | Open Access | Shapefile / geojson | Verified.

**Owners:**
- R0 Scope Guardian: Team Lead
- R3 Validity Auditor: Hydrology Lead
- R4 Data Engineer: Pipeline Lead
- R5/R6 Frontend & Backend: Dev Lead
- R8 Storyteller: Pitch Lead
- R9 Compliance: Documentation Lead

**Feature freeze:** Saturday Nov 14, 08:00 (Hour 23 of Hackathon).

---

## Decision Log

| Date | Decision | Alternatives rejected | Why | Cost to reverse | Owner |
|---|---|---|---|---|---|
| 2026-10-08 | Decouple SWOT passes from IMERG time steps | Inner-joining SWOT and IMERG on common timestamps | SWOT revisits are ~7–10 days; IMERG is 30-min. Inner-joining drops 99% of rain data. SWOT must be used for offline parameter calibration only. | High (pipeline restructure) | R3/R4 |
| 2026-10-08 | Use reach-averaged `slope2` instead of node `slope` | Using node-level `slope` | SWOT node slope has extreme noise exceeding signal on low-gradient (~1e-5) Bangladesh rivers. | Medium | R3 |
| 2026-10-09 | Bound Manning $n$ to $[0.025, 0.10]$ with `method='bounded'` | Unconstrained least squares | Unbounded optimization produces unphysical negative or giant $n$ values. | Low | R4 |
| 2026-10-09 | Use cividis color palette for reach risk map | Jet / Rainbow color maps | Cividis is mathematically optimized for color vision deficiency (CVD) and greyscale printing. | Low | R7 |
| 2026-10-09 | Display metrics to exactly 2 decimal places | Printing 6 decimal places | Over-precision signals fake / hardcoded numbers to judges. | Low | R9/R10 |
| 2026-10-09 | Migrate Tier 4 UI from Streamlit to Next.js 16 | Streamlit Python UI | Next.js offers client-side slider reactivity without script reruns, custom CVD-safe SVG maps, native bilingual toggling, and superior mobile presentation. | Low | R6/R7 |
| 2026-10-11 | Relocate documentation markdown files into `docs/` | Flat root directory clutter | Establishes clean repository root with only README.md at top-level; keeps documentation modular | Low | R9 |
| 2026-10-11 | Implement complete dashboard redesign per `docs/DESIGN_ARCHITECTURE.md` | Monolithic single-file dashboard or generic admin templates | Implements glassmorphism, restrained neumorphism, 8:4 hero River Map + Harvest Decision rail, Recharts hydrograph with timeline playback, modular components, and reach inspection while preserving 100% scientific pipeline integrity | Low | R6/R7 |
| 2026-10-13 | Apply 6 scientific quality gates on SWOT passes | Ingesting raw unfiltered SWOT observations | KaRIn radar phase noise produces erroneous negative/excessive slopes on reaches < 100m; slope SNR > 2 and width >= 100m are strictly required. | Low | R4 |
| 2026-10-13 | Shift IMERG half-hour timestamps back 30 minutes | Using raw IMERG file timestamps directly | IMERG timestamps label the END of the accumulation interval (00:30 means 00:00 to 00:30); shifting back 30min aligns rainfall with the start of the routing step (Guard B4). | Low | R4 |
| 2026-10-13 | Enforce stage-dependent Manning calibration filter | Calibrating on all water levels including dry season | In alluvial rivers, effective roughness drops at flood stage due to submergence; calibrating during low flow ($WSE \le z_{bed} + 0.5m$) overestimates flood roughness. | Low | R3 |
| 2026-10-13 | Discretize routing into 4 sub-reaches with dynamic wave celerity | Single reach routing over 140 km | Single reach creates negative Muskingum coefficient $C_0$ when $\Delta t < 2KX$; 4 sub-reaches preserve numerical stability, non-negative coefficients, and dynamic $c = \frac{5}{3} V_{mean} \approx 1.50\text{ m/s}$. | Low | R3/R5 |
| 2026-10-13 | Perform scientific validation on test period with 15min tolerance | Resampling without nearest-neighbor tolerance | `pd.merge_asof` with 15min tolerance provides mathematically rigorous alignment between 30min simulation and hourly gauge readings on Apr 1 – May 31, 2026. | Low | R3/R10 |
| 2026-10-13 | Integrate real pipeline data exports into Next.js dashboard (Prompt 6) | Retaining mock placeholders or static numbers | Upgraded UI with 3-line hydrograph (modelled, observed, baseline), analytical $\pm 0.18\text{m}$ uncertainty fill, amber dashed 13.20m danger line, CVD-safe continuous Cividis reach map, SWOT asterisks, slope hatching, dynamic travel time & IMERG timestamps, and permanent limits. | Low | R6/R7 |
| 2026-10-22 | Reconcile Kanaighat Gauge Station ID (SW266 vs SW108) and Vertical Datum (PWD vs MSL) | Silently renaming to SW266 and breaking pipeline fixtures, or retaining SW108 without explanation | In official BWDB/FFWC station directories, Kanaighat on the Surma River is cataloged as SW266 (SW108 is Chardoani tidal station in Barguna). SW108 was inherited as an internal project model code. Both are reconciled transparently: SW266 is designated official catalog ID and SW108 retained as model alias. Furthermore, FFWC lists danger level as 12.75 m MSL while BWDB benchmarks use 13.20 m PWD; in Sylhet, PWD datum is +0.45m relative to MSL/SOB, so 13.20m PWD and 12.75m MSL represent the exact same physical water level. | Low | R3/R9 |
| 2026-10-22 | Align river highlight geometries to authentic OpenStreetMap river relations (OSM 5904030 & 5904029) | Using 8-point coarse straight-line approximations or manual screen tracing | Coarse segments cut across dry land and hills; replacing with true meander centerlines rooted at Amalshid bifurcation (24.875912°N, 92.489126°E) and passing directly through stationary Kanaighat gauge (24.9980°N, 92.2594°E) ensures realistic visual alignment on the OpenFreeMap Positron basemap. Sliced into Surma Reaches 11/12 (469 and 398 vertices) and Kushiyara Reaches 21/22 (451 and 401 vertices) with explicit GeoJSON [lon, lat] to Leaflet [lat, lon] conversion, preserving all SWORD v16 reach IDs and routing logic. | Low | R6/R7 |
| 2026-10-22 | Replace the Forecast timeline popover and ±1h controls with a day rail plus one inline editable skip control, and pin the current replay date above the chart | Keeping the popover, preset chips, and ±1h buttons | The user requested one real-time customizable skip and a clearer date; one editable control reduces interaction cost and visual noise, the selected-day readout now sits with navigation, and the pinned bar keeps replay context visible. UTC formatting and wrapping context controls also remove the date mismatch and mobile overflow. | Low | R6/R7 |
| 2026-10-22 | Consolidate the page context into the topbar brand lockup and make the EN/BN switch layout-stable | Keeping the separate page-title block and allowing translated labels to resize topbar items | The page title, HAOR BASIN badge, and tagline duplicated the brand block and consumed vertical space. A three-line brand lockup removes the duplicate block; fixed desktop column widths (>=1366px), a fixed-width advisory button, and a no-wrap mobile nav with hidden step badges at 375-600px keep the language toggle and topbar actions from moving when the language changes. | Low | R6/R7 |


---

## Scope Change Requests

| Date | Request | Cost (hours) | What gets cut | Verdict |
|---|---|---|---|---|
| 2026-10-09 | Add 2D hydrodynamic inundation map | 14 hours | Core routing validation & video rehearsal | **REJECTED** (Out of scope per architecture) |
