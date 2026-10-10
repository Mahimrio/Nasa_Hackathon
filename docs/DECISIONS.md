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
* **Signature moment:** Dragging the event slider across April 10–13: Meghalaya rain pulses flash, the Harvest Flag turns RED ~21 hours before the local gauge breaches the 13.20m danger level.
* **What we deliberately won't do:** Will NOT claim real-time continuous SWOT monitoring, will NOT model 2D floodplain inundation, will NOT resolve narrow channels < 100m.

**Visual idea (one sentence):**  
A high-contrast hydrological mission dashboard combining a CVD-safe cividis reach map, an authoritative single-glance Harvest Flag badge, and an interactive hydrograph with analytical uncertainty bands.

**Scope IN (The Vertical Slice):**
1. NASA SWOT L2 HR RiverSP 2.0 reach ingestion and quality-gated offline Manning calibration ($n \in [0.025, 0.10]$).
2. GPM IMERG Early Run 30-min MAP routing via 4-sub-reach Muskingum-Cunge down the Surma corridor to Kanaighat.
3. Automated Harvest Flag generation (GREEN / AMBER / RED) with bilingual advisory (English / বাংলা).
4. Rigorous verification against BWDB Kanaighat gauge data during the historic April 2026 event reporting NSE, KGE, PBIAS, timing error, and lead time (formatted to 2 decimal places).
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

---

## Scope Change Requests

| Date | Request | Cost (hours) | What gets cut | Verdict |
|---|---|---|---|---|
| 2026-10-09 | Add 2D hydrodynamic inundation map | 14 hours | Core routing validation & video rehearsal | **REJECTED** (Out of scope per architecture) |
