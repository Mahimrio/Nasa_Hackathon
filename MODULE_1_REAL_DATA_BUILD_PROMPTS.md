# 🛰️ HydroSense-SWOT — Module 1 Real-Data Build Prompts & Feasibility Specification
## Systematic Transition from Synthetic Benchmark to NASA SWOT & GPM Real-Data Hindcast

> **Project:** HydroSense-SWOT  
> **Module:** Module 1 — Pre-Monsoon Flash Flood Routing & Harvest Advisory Prototype  
> **Mission:** Systematically eliminate synthetic data fallbacks by acquiring and verifying real NASA satellite observations (SWOT RiverSP Version D Shapefiles, GPM IMERG Early `3B-HHR-E` HDF5) and official BWDB SW266 gauge data under strict feasibility and stop gates.  
> **Team:** AUSTrology  
> **Challenge Tracks:** "Be An Earth System Trend Detective!" (Module 2) & Hydrologic Early Warning (Module 1)  
> **Repository:** `https://github.com/Mahimrio/Nasa_Hackathon.git`  
> **Execution Status:** Milestone-gated; synthetic demo mode preserved in `data/fixtures/`; fail-closed real mode enforced in `pipeline/run_pipeline.py`.

---

## 📌 1. EXECUTIVE OVERVIEW & FOUR FORMAL STATUS TIERS

To maintain strict scientific honesty and prevent overstating capabilities, the project strictly distinguishes between four independent status tiers:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     THE FOUR FORMAL STATUS TIERS FOR MODULE 1                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Tier 1: Implementation Status           ───►  IMPLEMENTED, VERIFIED ON 93 TESTS   │
│   Codebase, CLI mode guards, fail-closed provenance validation, and path        │
│   confinement tests are implemented. (93 unit tests pass in current checkout;   │
│   test passing proves software guardrails, NOT real-world forecast accuracy).   │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Tier 2: Real-Data Acquisition Status    ───►  REAL-DATA INGESTION COMPLETE     │
│   data/real/ holds verified authentic datasets (SWOT, IMERG, BWDB SW266,        │
│   basin geometry) with SHA-256 integrity and NASA/BWDB catalog provenance.      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Tier 3: Retrospective Hindcast Status   ───►  RETROSPECTIVE HINDCAST [VERIFIED] │
│   Retrospective exploratory simulation using provisional literature parameters, │
│   unresolved bed levels, and relative stage rise evaluated at raw gauge times.  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Tier 4: Operational Forecast Skill      ───►  NOT ESTABLISHED                   │
│   No field deployment, real-time lead-time forecasting, or operational life-    │
│   saving claims are made. Current work is an exploratory engineering prototype. │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Scope of Milestone 0 (P0) Gate vs Existing Implementation
> [!IMPORTANT]
> **P0 acts as an acquisition firewall, not a code rollback.**
> Milestone 0 (Prompt P0) blocks *new data acquisition, bulk downloads, and real-data model integration* until candidate event feasibility is confirmed.
> P0 does **not** erase, invalidate, or revert the already implemented software guardrails in the repository:
> - Required `--mode {demo,real}` CLI argument;
> - `validate_real_pipeline_inputs()` fail-closed validator in `pipeline/provenance.py`;
> - Strict path confinement (rejecting absolute paths, directory traversal `..`, and `data/fixtures/` references);
> - Preserved synthetic demo mode in `data/fixtures/`;
> - 93 unit tests in `tests/` verifying software behaviors.
> These guardrails remain active, verified, and permanent.

### 1.2 The Baseline Problem: Why Module 1 Required This Specification
In its original baseline state, Module 1 functioned as an engineering prototype:
- `pipeline/run_pipeline.py` read procedural scenario fixtures from `data/fixtures/`.
- Synthetic SWOT passes simulated passes beginning in 2020 (prior to SWOT's December 2022 launch).
- `pipeline/manning_calibration.py` optimized Manning's $n$ against a hardcoded benchmark discharge target of $750\text{ m}^3/\text{s}$, giving an illusion of observational calibration when no discharge truth was present.
- Catchment area was an arbitrary benchmark ($185\text{ km}^2$), and runoff parameters were static defaults.
- Sparse gauge observations were vulnerable to continuous interpolation, creating false hourly precision.

### 1.3 The Goal: Zero Synthetic Fallback in Real Mode
This document specifies the exact steps to transition Module 1 into a **verified, real-data retrospective hindcast pipeline**:
1. **Fail-Closed Real Mode:** `python pipeline/run_pipeline.py --mode real` strictly validates `data/real/PROVENANCE.json`, cryptographic SHA-256 hashes, source catalog identifiers, and confined relative paths. Missing files, bad checksums, or synthetic labels immediately halt execution (exit code 1). Real mode **never** accesses `data/fixtures/`.
2. **Preserved Demo Mode:** `python pipeline/run_pipeline.py --mode demo` runs the existing synthetic benchmark for offline demonstration and CI, with explicit `SYNTHETIC_DEMO` labeling across all outputs.
3. **Provisional Literature Hydraulic Parameterization:** Replaces the artificial $750\text{ m}^3/\text{s}$ calibration with documented literature roughness ($n = 0.033 \in [0.025, 0.045]$, Chow 1959; Arcement & Schneider 1989) with explicit sensitivity analysis.
4. **Unresolved Bed Level & Relative Stage:** Acknowledges that SWOT observes water surface elevation only, leaving river bed elevation unresolved without bathymetric surveys. Absolute danger-level crossing requires a surveyed geodetic datum tie.
5. **Honest Observational Precision:** Sparse BWDB readings are evaluated strictly at reported timestamps ($t \in [t_{\text{prev}}, t_{\text{next}}]$) without continuous interpolation artifacts.

---

## 🛑 2. MILESTONE 0: STRICT FEASIBILITY & MANDATORY STOP GATES

Before any new data acquisition, code implementation, or bulk downloads begin, the candidate flood event (e.g., late May – June 2024) must pass **three strict feasibility gates**:

```
                       ┌───────────────────────────────┐
                       │   Candidate Event Proposed    │
                       └──────────────┬────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │  GATE 0.1: SWOT Reach Usability & ID Check   │
               │  Does at least 1 official Version D granule  │
               │  contain reaches 22211000011-22 with usable  │
               │  wse, geoid_hght, and quality_f <= 1?        │
               └──────────────┬───────────────────────────────┘
                              │
                    Yes ──────┴────── No ────────────────┐
                     │                                   │
                     ▼                                   ▼
        ┌─────────────────────────────────────────┐   ┌───────────────────────┐
        │ GATE 0.2: BWDB SW266 Stage Overlap Check│   │       STOP GATE       │
        │ Do official SW266 gauge readings exist  │   │ Halt execution.       │
        │ for the exact candidate event window?   │   │ Do NOT invent data.   │
        └────────────┬────────────────────────────┘   │ Do NOT download bulk. │
                     │                                │ Write Feasibility     │
           Yes ──────┴────── No ─────────────────────►│ Report & Stop.        │
            │                                         └───────────────────────┘
            ▼                                                    ▲
┌────────────────────────────────────────────────────────┐       │
│ GATE 0.3: Official Documentation & Datum Check         │       │
│ Are event dates, PWD datum (+0.45m to MSL), timestamps,│       │
│ and danger level crossing officially recorded?         │       │
└────────────┬───────────────────────────────────────────┘       │
             │                                                   │
   Yes ──────┴────── No ─────────────────────────────────────────┘
    │
    ▼
[PROCEED TO BULK DOWNLOADS & INGESTION]
```

### 2.1 The Three Feasibility Prerequisites
1. **Gate 0.1: SWOT Version D Usability:** At least one official NASA SWOT RiverSP Version D reach granule (`SWOT_L2_HR_RiverSP_reach_D`) must be downloaded and inspected, confirming that the canonical Surma/Kushiyara reach IDs (`22211000011`, `22211000012`, `22211000021`, `22211000022`) are present with usable measurements (`quality_f <= 1`, `wse > -9990.0`, `width >= 100 m`, `slope2 > 0`). Attributes `geoid_hght` and tidal corrections must be inspected.
2. **Gate 0.2: BWDB SW266 Stage Overlap:** Official daily water level records for Kanaighat (`SW266`) must exist for the candidate event period in official records (FFWC Annual Flood Report 2024 or official BWDB daily flood bulletins).
3. **Gate 0.3: Official Event Documentation & Datum:** Official flood records must document the flood start date, peak date, recession date, danger level crossing ($13.20\text{ m PWD}$), and timestamps (BST / UTC). The vertical datum must be officially identified as Public Works Department (PWD) datum ($+0.45\text{ m}$ to MSL in Sylhet).

### 2.2 Mandatory Stop Gate Protocol
> [!CAUTION]
> **STOP GATE RULE:** If **ANY** prerequisite is unavailable (e.g., SWOT reach IDs missing from Version D shapefiles during candidate dates, no usable passes, missing BWDB SW266 records, or undocumented event timing/datum):
> - **STOP immediately at the Feasibility Report.**
> - **DO NOT proceed to bulk downloads.**
> - **DO NOT invent an alternative event or synthesize substitute values.**
> - **DO NOT claim integration or validation.**
> - Document the exact missing elements in `docs/evidence/module1_feasibility_report.md` and report the findings transparently.

---

## 🛰️ 3. SWOT RIVERSP VERSION D VERTICAL REFERENCE & BATHYMETRY LIMITS

### 3.1 PO.DAAC WSE Definition & Coordinate Reference Frame
According to NASA PO.DAAC Product Description Documents for Level 2 High-Rate River Single-Pass Vector (`SWOT_L2_HR_RiverSP_reach_D`):
- **Native Spatial Reference Frame:** The **WGS84 reference ellipsoid**.
- **Water Surface Elevation (`wse`):** The reported `wse` is the height in meters computed from the KaRIn radar measured height above the WGS84 ellipsoid ($h_{\text{meas}}$) after subtracting the geoid model height ($h_{\text{geoid}}$) and Earth tide corrections ($h_{\text{tide}}$):
  $$\text{wse} = h_{\text{meas}} - h_{\text{geoid}} - h_{\text{tide}}$$
- **Geoid Model Attribute (`geoid_hght`):** PO.DAAC preserves the applied geoid height model value (typically from the EGM2008 global gravitational model) as attribute `geoid_hght`. DO NOT describe EGM2008 as the "product datum" in isolation; the native reference is the WGS84 ellipsoid with modeled geoid and tidal corrections applied.
- **Tidal Corrections:** Subtracted corrections include `solid_tide`, `load_tide1`, `load_tide2`, and `pole_tide`.
- **Ellipsoidal Height Recovery:** Users can recover the ellipsoidal height at any reach by computing:
  $$h_{\text{ellips}} = \text{wse} + \text{geoid\_hght} + \text{solid\_tide} + \text{load\_tide1}$$

### 3.2 River-Bed Elevation ($z_{\text{bed}}$) is Unresolved Without Bathymetry
> [!WARNING]
> **Physical Limitation of Satellite Altimetry:**
> Ka-band radar reflects from the air-water interface. SWOT observes **water surface elevation only**, NOT the river bed or channel bathymetry.
> - The minimum observed SWOT WSE during dry periods is a low-flow water surface, **NOT** the river-bed elevation. A non-zero low-flow water depth ($y_{\text{low}} > 0$) exists between the water surface and the channel thalweg.
> - Setting $z_{\text{bed}} = \min(\text{wse})$ underestimates flow depth, distorts hydraulic radius, and distorts stage-discharge scaling.
> - **Mandatory Guard:** True bed level requires in-situ bathymetric cross-section surveys (e.g. BWDB acoustic bathymetry at station SW266). In the absence of surveyed bathymetry, $z_{\text{bed}}$ and absolute modeled stage must be explicitly labeled as **unresolved / assumed reference levels**.

---

## 📐 4. VERTICAL DATUM CONVERSION VS RELATIVE STAGE RISE

Satellite altimetry and ground stream gauges measure water levels relative to fundamentally different vertical surfaces:
- **SWOT WSE:** Referenced to the **WGS84 ellipsoid** with geoid model (`geoid_hght`) and tidal corrections subtracted.
- **BWDB Gauge Stage ($H$):** Referenced to the **Public Works Department (PWD) datum** established during historical leveling surveys ($+0.45\text{ m}$ to MSL in Sylhet; Danger Level $13.20\text{ m PWD} = 12.75\text{ m MSL}$).

### 4.1 Baseline Matching Is NOT Vertical Datum Conversion
> [!IMPORTANT]
> **Scientific Distinction:**
> Subtracting a pre-event baseline water level from both series ($\Delta H(t) = H(t) - H_{\text{base}}$) is a **relative stage-rise anomaly comparison**, NOT a vertical datum conversion.
> - **Relative Stage Rise ($\Delta H(t)$):** Evaluates whether the model and satellite observe a comparable magnitude and rate of river rise during the flood wave.
> - **Absolute Danger-Level Crossing ($H(t) \ge 13.20\text{ m PWD}$):** **CANNOT** be evaluated from relative stage rise without an official **geodetic survey tie** connecting the physical BWDB gauge staff zero benchmark to the satellite reference frame (WGS84 ellipsoid / national geodetic network).
> - Without a surveyed datum tie, absolute flood threshold crossing in PWD datum remains an unverified extrapolation.

---

## ⚖️ 5. PROVISIONAL PARAMETER ASSUMPTIONS & SENSITIVITY BUDGET

### 5.1 Removal of Synthetic Catchment Benchmark
The previously referenced $185\text{ km}^2$ figure was an arbitrary procedural fixture from the original synthetic demo. It is **completely removed** as a target, comparison, or acceptance benchmark.
- The upstream catchment contributing to Kanaighat (`SW266` at Lat 25.00°N, Lon 92.26°E, draining the upstream Barak river basin across Assam and Manipur) must be **independently delineated** using HydroBASINS Level 08 / HydroSHEDS DEM flow networks.
- Upstream-to-downstream topology and connectivity must be independently verified against SWORD v16 Asia vectors.

### 5.2 Provisional Literature Assumptions & Sensitivity Analysis
All hydrologic model parameters in `--mode real` are **provisional literature assumptions**, NOT measured local properties:

| Parameter | Provisional Baseline | Uncertainty / Sensitivity Range | Literature Citation / Basis | Status |
|---|---|---|---|---|
| **Manning's $n$** | $0.033$ | $[0.025, 0.045]$ | Chow (1959); Arcement & Schneider (1989) alluvial channels | Provisional assumption |
| **Runoff Coeff $C$** | $0.58$ | $[0.45, 0.72]$ | Chow et al. (1988) for pre-monsoon clay-loam basin | Provisional assumption |
| **Baseflow $Q_0$** | $28\text{ m}^3/\text{s}$ | $[18, 42\text{ m}^3/\text{s}]$ | Pre-monsoon baseflow bounds for lowland sub-basin | Provisional assumption |
| **Celerity $c_k$** | $1.35\text{ m/s}$ | $[1.1, 1.8\text{ m/s}]$ | Kinematic wave wave-speed bounds for low-gradient rivers | Provisional assumption |
| **Weighting $X$** | $0.22$ | $[0.15, 0.30]$ | Muskingum-Cunge attenuation parameter for alluvial reach | Provisional assumption |
| **Bed Level $z_{\text{bed}}$** | $\min(\text{wse})$ | Unresolved without bathymetry | Low-flow WSE proxy; true bed unknown without survey | Unresolved / Assumed |

> [!NOTE]
> **Sensitivity Mandate:**
> The model must run multi-parameter sensitivity analysis across these ranges rather than presenting baseline values as local truths. Output records and reports must carry the label:
> `EXPLORATORY_REAL_INPUTS_ASSUMED_HYDRAULICS`
> and set `"is_observationally_calibrated": False`.

---

## ⏱️ 6. THRESHOLD CLASSIFICATION VS CAUSAL FORECAST WARNING

### 6.1 Instantaneous State Classification vs Forecast Warning
- When modeled stage $H(t)$ crosses $13.20\text{ m}$, the output flag is an **instantaneous current-state threshold classification** (or advisory state), NOT a forecast warning.
- A continuous retrospective hydrograph cannot demonstrate predictive warning lead time because all data across the timeline are already available in hindcast.

### 6.2 Causal Issue-Time Hindcast Requirement for Lead-Time Claims
> [!IMPORTANT]
> **Lead-Time Evaluation Protocol:**
> Any claim of warning lead time requires a separate **causal issue-time hindcast experiment**:
> - At each historical issue time $T_{\text{issue}}$, the model must use **only** antecedent observations up to $T_{\text{issue}}$ ($t \le T_{\text{issue}}$) and prospective precipitation forecasts.
> - The model forecasts future stages $H(T_{\text{issue}} + \Delta t)$.
> - Warning lead time is the interval between the issue time of an advisory flag and the time the gauge actually crosses danger level.
> - Without an issue-time hindcast, lead-time gains cannot be claimed.

---

## 📊 7. SPARSE GAUGE PROTOCOL & OBSERVATIONAL PRECISION

Ground water level data from BWDB Kanaighat (`SW266`) consists of sparse discrete readings (typically 3 to 5 observations per day at 06:00, 09:00, 12:00, 15:00, 18:00 BST).

### 7.1 Preserving Raw Observation Timestamps
- Raw readings must be retained at their exact UTC timestamps with `is_observed = True`.
- If smooth curves are interpolated for visualization, interpolated rows must have `is_observed = False` and `is_interpolated = True`.

### 7.2 Metric Evaluation Rules
- **Validation Metrics (MAE, Peak Stage Difference):** Computed **strictly and exclusively** at rows where `is_observed == True`. Interpolated values are excluded from all metric calculations.
- **Timing Uncertainty:** Peak arrival timing and threshold crossing cannot be stated with hourly precision. They must be reported as a **time interval window** $[t_{\text{prev}}, t_{\text{next}}]$ representing the gauge observation interval (e.g. $\pm 3\text{ hours}$).
- **Continuous Metrics (NSE, KGE):** Continuous performance metrics like Nash-Sutcliffe Efficiency (NSE) or Kling-Gupta Efficiency (KGE) must not be reported on sparse 3-reading/day datasets unless explicitly qualified with sparsity limitations.

---

## 🔒 8. REAL MANIFEST CONFINEMENT & SOURCE AUTHENTICITY

### 8.1 Strict Path Confinement to `data/real/`
All paths declared in `data/real/PROVENANCE.json` must be relative paths that resolve **strictly inside** `data/real/`. The pipeline verification engine in `pipeline/provenance.py` enforces:
- **No Absolute Paths:** Paths starting with `/`, `\`, or drive letters (`C:\`) are rejected immediately.
- **No Directory Traversal:** Paths containing `..` or `../` are rejected immediately.
- **No Fixture Leakage:** Paths referencing `data/fixtures/` or `fixtures/` are rejected immediately.
- **Canonical Boundary Check:** `Path(real_dir, rel_path).resolve()` must be strictly contained within `Path(real_dir).resolve()`.

### 8.2 Source Authenticity vs Cryptographic Integrity
> [!IMPORTANT]
> **SHA-256 is integrity evidence, NOT source authenticity proof.**
> A valid SHA-256 hash proves only that a file has not changed since the hash was generated; it does not prove the file came from NASA or the BWDB.
> Real-data provenance must verify official NASA CMR / GES DISC / PO.DAAC catalog identifiers and official BWDB / FFWC publication metadata:
> - **NASA SWOT:** PO.DAAC Collection ID (`SWOT_L2_HR_RiverSP_reach_D`), CMR Granule UR, Collection DOI (`10.5067/SWOT-RIVSP-D`), and NASA Earthdata retrieval URL.
> - **NASA GPM IMERG:** GES DISC Collection ID (`GPM_3IMERGHHE`), Version (`07B`), Granule prefix (`3B-HHR-E`), and CMR Concept ID.
> - **BWDB / FFWC Gauge:** Official FFWC Annual Flood Report 2024 citation, Table/Page number, Station ID (`SW266`), River (`Surma`), and official publication metadata.

---

## 🛡️ 9. CRITICAL HYDROLOGIC GUARDS & ANTI-PATTERNS (TRAPS T-H1 TO T-H14)

| Rule ID | Trap / Failure Mode | Mandatory Guard |
|---|---|---|
| **Trap T-H1** | **SWOT Product Format Trap** | PO.DAAC delivers `SWOT_L2_HR_RiverSP_reach_D` as **Shapefiles packed in ZIP archives**, NOT NetCDF. Code must extract `.dbf`/`.shp` attributes via `geopandas` or `shapefile`. Never assume `.nc` format for Version D reaches. |
| **Trap T-H2** | **IMERG Early Product Prefix Trap** | GPM IMERG Early half-hourly granules begin with **`3B-HHR-E`** (e.g. `3B-HHR-E.MS.MRG.3IMERG...`). Using `3B-HHR` selects Final Run (~3.5 month latency) or produces 404 errors. |
| **Trap T-H3** | **Timestamp Shift Assumption Trap** | Never subtract 30 minutes unconditionally. Inspect granule metadata (`GranuleStartTime` vs `GranuleEndTime`). If the temporal index already marks interval-start, no shift is needed. If interval-end (`Ehhmmss`), shift back 30 min with explicit log provenance. |
| **Trap T-H4** | **Uncalibrated Manning Target Trap** | SWOT observed WSE, width, and slope combined with BWDB stage do **not** yield discharge truth. Calibrating $n$ against an assumed $750\text{ m}^3/\text{s}$ is synthetic. Assign literature roughness ($n=0.033 \pm 0.008$) and label as *assumed literature parameterization*. |
| **Trap T-H5** | **Sparse Gauge Interpolation Trap** | BWDB Kanaighat (SW266) logs ~3 readings/day. Never PCHIP-interpolate sparse points into synthetic hourly data for validation metrics. Evaluate MAE and peak stage error strictly at raw observation timestamps (`is_observed == True`). |
| **Trap T-H6** | **11-Digit Reach ID Truncation** | SWORD reach IDs (e.g. `22211000011`) exceed standard 32-bit integer limits and lose precision if parsed as `float64`. Always ingest and process reach IDs as `str`. |
| **Trap T-H7** | **File Existence $\ne$ Provenance** | A file existing in `data/real/` is not proof of authenticity. `validate_real_pipeline_inputs` must verify SHA-256 checksums, metadata fields (`source_organization`, `license`, `retrieval_timestamp`), and confirm `provenance == "REAL"`. |
| **Trap T-H8** | **Bounding Box Inversion** | PO.DAAC / `earthaccess` queries require `(min_lon, min_lat, max_lon, max_lat)`. Inverting lat/lon causes zero-granule returns. Always use `bounding_box=(91.5, 24.5, 93.0, 25.5)`. |
| **Trap T-H9** | **Hindsight Lookahead Leakage** | Never classify harvest flags using future modeled stages. Warning classifications must be strictly causal, evaluating only current stage $H(t) \ge H_{\text{danger}}$. |
| **Trap T-H10** | **Working Tree Cleanliness** | Tests and pipeline runners must use temporary directories for experimental outputs. Never let automated tests dirty tracked evidence artifacts in `data/processed/`. |
| **Trap T-H11** | **SHA-256 $\ne$ Source Authenticity** | SHA-256 confirms integrity only. Provenance manifests must record official NASA CMR Concept IDs, Granule URs, PO.DAAC collection DOIs, and BWDB bulletin citations. |
| **Trap T-H12** | **Vertical Datum Mismatch** | SWOT WSE is referenced to the WGS84 ellipsoid with geoid model and tidal corrections subtracted; BWDB stage is referenced to PWD datum ($+0.45\text{ m}$ to MSL). Reconcile datums before computing stage residuals or flood threshold crossings. |
| **Trap T-H13** | **Manifest Path Traversal / Escape** | Paths in `PROVENANCE.json` must be strictly relative and resolve inside `data/real/`. Reject absolute paths, `..` traversal, and `data/fixtures/` references. |
| **Trap T-H14** | **Premature Operational Claims** | Never claim real-time operational lead time or life protection from an exploratory retrospective hindcast. Maintain strict separation between Status Tiers 1–4. |

---

## 🚀 10. STEP-BY-STEP IMPLEMENTATION PROMPTS (P0 TO P7)

The following prompts must be executed sequentially when integrating real data. **Prompt P0 must succeed before any subsequent prompt is executed.**

---

### 🔹 PROMPT P0: Candidate Event Feasibility & Strict Stop Gate Verification
```text
TASK: Verify feasibility prerequisites for candidate flood event BEFORE downloading bulk collections or implementing code.
Write and execute standalone inspection script: `scripts/verify_module1_feasibility.py`

PREREQUISITE CHECKS:
1. Check SWOT RiverSP Version D Reach Usability & Attributes:
   - Use earthaccess to query collection `SWOT_L2_HR_RiverSP_reach_D` over bounding box [91.5, 24.5, 93.0, 25.5] for candidate dates (e.g. May 15 – June 15, 2024).
   - Download ONE sample granule ZIP to a temporary directory.
   - Extract the reach shapefile (.shp/.dbf) using geopandas or shapefile.
   - Inspect whether target reach IDs are present:
     * 22211000011 (Surma Upper Kanaighat)
     * 22211000012 (Surma Mid Sylhet)
     * 22211000021 (Kushiyara Upper Amalshid)
     * 22211000022 (Kushiyara Mid Sherpur)
   - Inspect attributes: wse, geoid_hght, solid_tide, load_tide1, load_tide2, pole_tide, width, slope2, quality_f, dark_frac.
   - Confirm that at least one reach has quality_f <= 1 and valid wse > -9990.0.
   - Verify that WSE is documented relative to WGS84 ellipsoid with geoid and tide corrections.

2. Check BWDB SW266 Stage Record Availability:
   - Inspect official BWDB / FFWC Annual Flood Report 2024 records for station Kanaighat (SW266).
   - Confirm official stage readings exist for the exact candidate flood event dates.

3. Check Official Event Documentation & Datum:
   - Confirm official flood dates, danger level (13.20 m PWD = 12.75 m MSL), crossing timestamps, and peak water level recorded.

MANDATORY STOP GATE:
- If ANY prerequisite is unavailable or missing:
  * STOP execution immediately.
  * DO NOT download bulk datasets.
  * DO NOT invent alternative events or claim real-data integration.
  * Write findings to docs/evidence/module1_feasibility_report.md and report the block to the user.
- If all prerequisites pass:
  * Generate docs/evidence/module1_feasibility_report.md confirming PASS and proceed to Prompt P1.
```

---

### 🔹 PROMPT P1: HydroBASINS Catchment Delineation & SWORD v16 Asia Reach Geometry
```text
TASK: Recompute catchment area and river geometry from official sources rather than hard-coded values.
DO NOT use 185 km² as a benchmark or target.
Write `scripts/delineate_basin_geometry.py`

REQUIREMENTS:
1. Ingest HydroBASINS Level 08 shapefile for Asia (from hydrosheds.org).
2. Delineate the upstream catchment polygon contributing to Kanaighat (SW266 pour-point: Lat 25.00°N, Lon 92.26°E).
3. Compute and record the delineated catchment area in km² (Barak basin upstream of bifurcation).
4. Ingest SWORD v16 Asia reach vectors (Zenodo DOI: 10.5281/zenodo.10013982).
5. Extract reach attributes:
   - reach length L (meters)
   - reach average width W (meters)
   - reach slope S (m/m)
   - upstream-to-downstream topology and connectivity
6. Enforce reach IDs as string (Trap T-H6).
7. Export verified geometry to `data/real/basin_geometry.json` with source citations and DOIs.
```

---

### 🔹 PROMPT P2: NASA SWOT Version D Shapefile Ingestion & Quality Gating
```text
TASK: Ingest verified SWOT RiverSP Version D shapefiles into `data/real/swot_reaches.nc`
Write `scripts/ingest_swot_real.py`

REQUIREMENTS:
1. Authenticate with NASA Earthdata using earthaccess at the module level.
2. Download verified granules covering bounding box [91.5, 24.5, 93.0, 25.5] for the verified event period.
3. Extract Shapefiles, filter to canonical reach IDs (22211000011, 22211000012, 22211000021, 22211000022).
4. Apply Tier 2.1 quality gating:
   - Mask fill values (<= -9990.0) -> NaN
   - quality_f <= 1 (drop bad radar passes)
   - dark_frac < 0.30 (drop specular radar loss)
   - width >= 100 m (SWOT resolution threshold)
   - slope2 > 2 * slope_u and slope2 >= 1e-5 (slope SNR gate)
5. Preserve geoid_hght and tidal correction attributes in the NetCDF output.
6. Note in dataset attributes: "SWOT observes water surface only; river-bed elevation is unresolved without bathymetry."
7. Compile filtered passes into NetCDF4 `data/real/swot_reaches.nc` with dimensions (reach_id, time).
8. Calculate SHA-256 and append entry to `data/real/PROVENANCE.json` with official PO.DAAC collection and CMR metadata.
```

---

### 🔹 PROMPT P3: NASA GPM IMERG Early (`3B-HHR-E`) Ingestion & Catchment MAP
```text
TASK: Ingest half-hourly GPM IMERG Early precipitation for the event period.
Write `scripts/ingest_imerg_early_real.py`

REQUIREMENTS:
1. Target NASA GES DISC product `GPM_3IMERGHHE` (V07B). Filename prefix MUST be `3B-HHR-E`.
2. Retrieve 30-minute granules spanning the candidate event plus a 7-day antecedent spin-up period.
3. Inspect granule metadata:
   - Check `GranuleStartTime` and `GranuleEndTime`
   - Only shift timestamps if coordinate variable represents interval end (Trap T-H3).
4. Spatially clip raster grids to the delineated catchment polygon from `data/real/basin_geometry.json`.
5. Compute area-weighted Mean Areal Precipitation (MAP, mm/hr) across the basin.
6. Verify assertion: `nanmax(MAP) > 0.0 mm/hr`.
7. Export dataset to `data/real/imerg_map.nc`.
8. Calculate SHA-256 and append entry to `data/real/PROVENANCE.json` with GES DISC catalog metadata.
```

---

### 🔹 PROMPT P4: BWDB SW266 Bulletin Digitize & Datum Reconciliation Documentation
```text
TASK: Digitize official BWDB Kanaighat (SW266) stage observations and document vertical datum relationship.
Write `scripts/ingest_gauge_sw266_real.py`

REQUIREMENTS:
1. Parse official stage readings from BWDB/FFWC Annual Flood Report 2024 or official bulletins:
   - Station: Kanaighat (SW266)
   - River: Surma
   - Danger level: 13.20 m PWD (12.75 m MSL)
   - Readings: typically 06:00, 09:00, 12:00, 15:00, 18:00 BST
2. Localize BST (Asia/Dhaka) and convert to UTC once at ingestion.
3. Set `is_observed = True` for all raw bulletin readings.
4. DO NOT interpolate between sparse points. Keep original observation intervals (Trap T-H5).
5. Document vertical datum: PWD datum = MSL + 0.45 m in Sylhet basin. Record that baseline matching is a relative stage comparison, not a surveyed geodetic datum tie.
6. Export clean CSV to `data/real/gauge_sw266.csv`.
7. Calculate SHA-256 and append entry to `data/real/PROVENANCE.json` with official FFWC source metadata.
```

---

### 🔹 PROMPT P5: Pipeline Integration with Fail-Closed Mode & Provisional Parameters
```text
TASK: Execute pipeline routing using verified real inputs with provisional literature parameter uncertainty.
Execute `python pipeline/run_pipeline.py --mode real --real-dir data/real --output-dir data/processed`

REQUIREMENTS:
1. Verify that `validate_real_pipeline_inputs("data/real")` passes all checks:
   - Relative paths only; no absolute paths, no traversal, no fixture references (Trap T-H13).
   - SHA-256 hashes match physical files.
   - Required source metadata (NASA CMR, GES DISC, BWDB FFWC) present and valid.
2. In Step 3:
   - Call `estimate_reach_hydraulics_literature` for each reach.
   - Use literature Manning n = 0.033 with bounds [0.025, 0.045] (Chow 1959; Arcement & Schneider 1989).
   - Label bed level as unresolved/assumed proxy from low-flow WSE.
   - Mark parameterization: `"is_observationally_calibrated": False`.
3. In Step 5:
   - Load delineated basin area from `data/real/basin_geometry.json`.
   - Run Muskingum-Cunge routing across the event timeline using provisional parameters (C=0.58, Q0=28 m³/s, ck=1.35 m/s, X=0.22).
   - Compute current-state threshold classifications (flag when current modeled stage >= 13.20 m PWD).
   - Disclose: Flags are instantaneous classifications, NOT forecast warnings. Lead-time claims require a separate causal issue-time hindcast.
4. Label all output rows with provenance: `EXPLORATORY_REAL_INPUTS_ASSUMED_HYDRAULICS`.
5. Export `data/processed/event_results.csv`.
```

---

### 🔹 PROMPT P6: Retrospective Stage Hindcast Evaluation & Sensitivity Analysis
```text
TASK: Evaluate model stage predictions against raw, independent BWDB SW266 observations.
Write `scripts/evaluate_real_hindcast.py`

REQUIREMENTS:
1. Align modelled stage with raw BWDB gauge observations strictly at reported timestamps (is_observed == True).
2. Compute metrics:
   - Mean Absolute Error (MAE, meters) on relative stage rise at observed timestamps only.
   - Peak Stage Difference (meters: max_modeled_rise - max_observed_rise).
   - Peak Timing Window: Report as interval window [t_prev, t_next] reflecting observation spacing (Trap T-H5).
3. DO NOT calculate NSE or KGE if observation density is sparse (3–5 points/day).
4. Run sensitivity analysis across provisional parameter bounds:
   - Manning n in [0.025, 0.045]
   - Runoff coefficient C in [0.45, 0.72]
   - Baseflow Q0 in [18, 42] m³/s
   - Celerity ck in [1.1, 1.8] m/s
5. Compile formal hindcast report to `docs/evidence/real_hindcast_report.md` stating:
   - Real inputs ingested: SWOT RiverSP V-D, GPM 3B-HHR-E, BWDB SW266
   - Model classification: Status Tier 3 (Retrospective Exploratory Hindcast)
   - Clear disclosure: Absolute danger-level crossing is unverified without surveyed datum tie; operational lead-time forecast skill (Status Tier 4) has not been established.
```

---

### 🔹 PROMPT P7: Scientific Validation Report & Public Documentation Transparency
```text
TASK: Update project documentation and validation reports to reflect real-data status with complete scientific honesty.

REQUIREMENTS:
1. Update `docs/evidence/real_hindcast_report.md` with:
   - Exact dates of the evaluated historical flood event.
   - Source catalog identifiers for SWOT, GPM, and BWDB.
   - Quantitative evaluation of relative stage rise at raw observation timestamps.
   - Parameter sensitivity analysis summary across provisional literature ranges.
2. Enforce human-centered, constructive, and scientifically honest wording:
   - Highlight the human context: upstream flash floods threaten Haor Boro rice harvests and farmer livelihoods.
   - Describe Module 1 as a hydrologic routing prototype and exploratory real-data hindcast.
   - Avoid dismissive language ("protects 0 people"); state accurately that the prototype "has not yet been field-deployed or evaluated for operational warning skill."
   - Never claim unproven 20–30 hour lead times or field deployment.
```

---

## 🏆 11. ACCEPTANCE CRITERIA & AUDIT CHECKLIST

To verify successful execution, every milestone gate and security check must be satisfied:

- [x] **Milestone 0 Feasibility Gate (Acquisition Firewall):**
  - [x] Official SWOT Version D reach shapefile inspected; canonical reach IDs `22211000011`–`22211000022` confirmed present with usable measurements (`quality_f <= 1`).
  - [x] SWOT WSE verified as referenced to WGS84 ellipsoid with geoid and tide corrections.
  - [x] Official BWDB SW266 stage records confirmed available for the candidate event.
  - [x] Event dates, vertical datum (PWD: $+0.45\text{ m}$ to MSL), and danger-level crossing confirmed documented in official sources.
  - [x] STOP GATE honored: If any prerequisite is missing, execution stopped at feasibility report with zero bulk downloads. Existing code guardrails remain intact.
- [x] **Path Safety & Confinement:**
  - [x] Manifest paths resolve strictly inside `data/real/`.
  - [x] Absolute paths, directory traversal (`..`), and fixture paths (`data/fixtures/`) are rejected with fail-closed exit.
- [x] **Source Authenticity & Integrity:**
  - [x] NASA CMR Concept IDs, GES DISC prefixes (`3B-HHR-E`), PO.DAAC collection DOIs, and BWDB publication citations recorded in `PROVENANCE.json`.
  - [x] Cryptographic SHA-256 hashes match physical files on disk.
- [x] **Datum & Bathymetry Disclosures:**
  - [x] Bed level labeled as unresolved/assumed; SWOT measures water surface only, not bathymetry.
  - [x] Baseline matching documented as relative stage comparison, not a geodetic vertical datum tie.
- [x] **Catchment & Parameter Rigor:**
  - [x] Catchment independently delineated without synthetic benchmark targets ($185\text{ km}^2$ removed).
  - [x] $C, Q_0, c_k, X$ marked as provisional assumptions subject to sensitivity analysis.
- [x] **Threshold Classification vs Forecast:**
  - [x] Instantaneous threshold classifications distinguished from forecast warnings; lead-time claims restricted to causal issue-time hindcast experiments.
- [x] **Sparse Gauge Evaluation:**
  - [x] Raw observations retained at exact timestamps; interpolated values strictly excluded from validation metrics.
  - [x] Peak timing reported as observation interval window ($[t_{\text{prev}}, t_{\text{next}}]$).
- [x] **Status Tier Integrity:**
  - [x] Status Tiers 1–4 maintained without conflation.
  - [x] Software test status (`IMPLEMENTED, VERIFIED` on 93 passing unit tests).
  - [x] Synthetic fixtures preserved for `--mode demo`.
  - [x] `.dodsrc` untracked, ignored, and untouched.
