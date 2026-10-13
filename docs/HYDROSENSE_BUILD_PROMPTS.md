# 🌊 HydroSense-SWOT — Complete Build Prompt File

> **Project:** HydroSense-SWOT  
> **Team:** AUSTrology  
> **Hackathon:** NASA Space Apps Challenge 2026  
> **Repository:** `https://github.com/Mahimrio/Nasa_Hackathon.git`  
> **Submission Window:** Nov 14 09:00 – Nov 15 23:59 (local time, ~39 hours)

---

## 📌 PROJECT CONTEXT

**What HydroSense does:**  
HydroSense is an early-warning harvest decision tool for Boro rice farmers and Upazila Agriculture Officers in the flood-vulnerable Haor basin of north-east Bangladesh (Surma–Kushiyara rivers). When pre-monsoon rain over the Meghalaya hills in India threatens to flood the basin before the Boro harvest, HydroSense routes near-real-time NASA GPM IMERG Early Run rainfall through river reaches whose channel geometry and hydraulic roughness are calibrated offline from NASA SWOT satellite measurements. The system produces a **Harvest Flag (GREEN / AMBER / RED)** with **~21–26 hours of advance warning** — enough time for officers and farmers to mobilize labor and harvest Boro rice before embankments breach.

**The Real Problem:**  
- In April 2026, basin rainfall ran ~76% above normal, flooding >130,000 acres of Boro rice.  
- ~214,000 tonnes of rice lost. ~230,000 farmers affected.  
- In 2017, 149,224 hectares of Boro damaged in Sunamganj district alone.  
- The floods start in rivers **outside Bangladesh** where it has **no gauge readings**.  
- FFWC forecasts have limited upstream data and insufficient lead time.  
- No existing tool routes IMERG rainfall through SWOT-calibrated channels to produce harvest timing decisions.

**Our Solution — The Science:**
1. **SWOT L2 HR RiverSP 2.0** — NASA satellite measures river width, height, and slope (`slope2`) on 10-km reaches. Used for **offline** Manning roughness (`n`) calibration on ungauged border rivers.
2. **GPM IMERG Early Run V07** — Calibrated half-hourly precipitation (`precipitationCal`) at 0.1° resolution, available ~4 hours after satellite observation. Drives **online** Muskingum-Cunge routing.
3. **BWDB Gauge Records** — Observed stage at Kanaighat (SW108, Danger Level: 13.20m PWD) for validation.
4. **SWORD v16 + HydroSHEDS v1** — River network topology, reach boundaries, catchment delineation.

**Key Formula:**  
Manning's Equation: `Q = (1/n) × A × R^(2/3) × slope2^(1/2)`  
Muskingum-Cunge routing with 4 sub-reach cascade, wave celerity `c = (5/3) × V_mean`, travel time `K = L/c ≈ 26 hours`.

**API Endpoints & Data Links:**
| Data Source | Short Name | Access Point |
|---|---|---|
| SWOT L2 HR RiverSP 2.0 | `SWOT_L2_HR_RIVERSP_2.0` | PO.DAAC (`soto.podaac.earthdatacloud.nasa.gov/hydrocron/v1`) + `earthaccess` Python library |
| GPM IMERG Early Run V07 | `GPM_3IMERGHHE` | GES DISC OPeNDAP (`disc.gsfc.nasa.gov`) via `.netrc` |
| BWDB Gauge Records | Station `SW108` | `bwdb.gov.bd` / `ffwc.gov.bd` |
| SWORD v16 | N/A | `hydrosheds.org` (public download) |
| HydroSHEDS v1 | N/A | `hydrosheds.org` (public download) |
| Hydrocron Time-Series API | `SWOT_L2_HR_RIVERSP_2.0` | `soto.podaac.earthdatacloud.nasa.gov/hydrocron/v1` — Query: `feature=Reach, feature_id={reach_id}, output=geojson, fields=reach_id,time_str,wse,width,slope2,wse_u,dark_frac,quality_f` |

---

## 🔧 PREREQUISITES & SETUP

### Team Roles
| Role | Member | Responsibility |
|---|---|---|
| Systems & Backend Algorithm Developer | Fazle Rabbi Mugdho | Pipeline, Manning calibration, routing |
| Data Infrastructure & Pipeline Developer | Mahim Abdullah Rianto | Data ingestion, fixtures, ETL |
| Geospatial & Domain Researcher | Taisha Tasnim Triti | SWOT/IMERG research, HydroSHEDS spatial |
| Technical Quality & Compliance Specialist | Samia Rahman Arpita | QA, documentation, sources audit |
| Product Impact & Media Strategist | Redwana Binte Jaman Tonima | Video scripts, pitch, storytelling |
| Frontend & Product Experience Developer | Arko Saha | Dashboard UI, components, visualization |

### Tech Stack
| Layer | Technology |
|---|---|
| Scientific Pipeline | Python 3.11+ (numpy, pandas, scipy, netCDF4, xarray) |
| Frontend Dashboard | Next.js 16 (App Router) + Recharts |
| Data Bridge | Static JSON hydration (`ui/public/data/*.json`) |
| Testing | pytest 8+ |
| Styling | CSS Variables + Glassmorphism design system |

### Environment Setup
```bash
# Python dependencies
pip install -r requirements.txt

# Frontend dependencies
cd ui && npm install && cd ..

# Configuration
cp .env.example .env
# Set EARTHDATA_USERNAME, EARTHDATA_PASSWORD (optional for fixture mode)
# FIXTURE_MODE=true (default — uses offline cached data)
```

### Critical Guards (from SOLUTION_ARCHITECTURE.md v3.0)
- **Trap B1:** ALL timestamps stored as UTC ISO8601. Convert BST→UTC ONCE at ingestion.
- **Trap B2:** `import netCDF4` MUST come before `import xarray`.
- **Trap B3:** SWOT reach_id is 11-digit integer — always read as `dtype={'reach_id': str}`.
- **Trap B4:** IMERG timestamps are END-of-interval — shift back 30 min before joining.
- **Trap B6:** Hydrocron returns NaN as `-999999.0`, not Python NaN — replace explicitly.
- **Trap B7:** Always `ds.rio.write_crs('EPSG:4326', inplace=True)` after opening IMERG.
- **Trap B8:** Manning calibration MUST use `method='bounded'` with `bounds=(0.025, 0.10)`.
- **Trap B9:** Use `slope2` (reach-averaged), NOT `slope` (node-level, noisier).
- **Trap B10:** Demo slider dates driven from DATA, never hardcoded strings.

---

## ✅ CURRENTLY IMPLEMENTED FEATURES (Mock Dashboard + Scientific Pipeline)

### Pipeline (Python) — COMPLETE ✅
| Module | File | Status |
|---|---|---|
| Fixture Generator | `scripts/generate_fixtures.py` | ✅ Generates `swot_reaches.nc`, `imerg_map.nc`, `gauge_kanaighat.csv` |
| Manning Calibration | `pipeline/manning_calibration.py` | ✅ Bounded optimization `n ∈ [0.025, 0.10]` |
| Muskingum-Cunge Routing | `pipeline/muskingum_cunge.py` | ✅ 4-sub-reach cascade, stage inversion |
| Harvest Flag Logic | `pipeline/harvest_flag.py` | ✅ GREEN/AMBER/RED + bilingual advisory |
| Validation Metrics | `pipeline/metrics.py` | ✅ NSE, KGE, PBIAS, timing error, lead time |
| Rainfall Baseline | `pipeline/baseline.py` | ✅ 6h rolling threshold comparison |
| MVP Orchestrator | `pipeline/run_pipeline.py` | ✅ 7-step end-to-end pipeline (6/6 tests pass) |
| JSON Exporter | `scripts/export_json.py` | ✅ Exports 5 JSON files to `ui/public/data/` |
| Unit Tests | `tests/test_pipeline.py` | ✅ 6/6 passing |

### Dashboard (Next.js 16) — MOCK UI ✅
| Component | File | Status |
|---|---|---|
| App Header | `ui/app/components/AppHeader.js` | ✅ Brand, language toggle, data timestamp |
| Page Context Bar | `ui/app/components/PageContextBar.js` | ✅ Title, data freshness |
| River Map Panel | `ui/app/components/RiverMapPanel.js` | ✅ SVG reach map with animated flow, gauge marker |
| Harvest Decision Panel | `ui/app/components/HarvestDecisionPanel.js` | ✅ Flag status, modeled parameters |
| Hydrograph Panel | `ui/app/components/HydrographPanel.js` | ✅ Dual-axis chart with timeline scrubber |
| Validation Metrics Panel | `ui/app/components/ValidationMetricsPanel.js` | ✅ NSE, KGE, PBIAS, timing, lead time cards |
| Operational Limits Panel | `ui/app/components/OperationalLimitsPanel.js` | ✅ Always-visible limits |
| Reach Inspector Modal | `ui/app/components/ReachInspectorModal.js` | ✅ Detailed reach data on click |
| Advisory Bulletin Modal | `ui/app/components/AdvisoryBulletinModal.js` | ✅ Bilingual advisory text |
| Model Architecture Modal | `ui/app/components/ModelArchitectureModal.js` | ✅ Pipeline explanation |
| Global Styles | `ui/app/globals.css` | ✅ Glassmorphism + design tokens |
| Main Page | `ui/app/page.js` | ✅ Orchestrates all components |
| Layout | `ui/app/layout.js` | ✅ SEO meta, fonts |

### Static JSON Data Files (Bridge) ✅
| File | Contents |
|---|---|
| `ui/public/data/event_timeseries.json` | 1464 hourly records: modelled stage, flags, rainfall, baseline |
| `ui/public/data/gauge_observations.json` | Observed gauge levels for hydrograph overlay |
| `ui/public/data/calibration_summary.json` | Manning n, z_bed per reach |
| `ui/public/data/metrics_summary.json` | NSE 0.74, KGE 0.68, PBIAS +1.8%, etc. |
| `ui/public/data/reach_metadata.json` | 4 reaches with geographic positions |

### Documentation ✅
All located in `docs/`:
`SOLUTION_ARCHITECTURE.md`, `DESIGN_ARCHITECTURE.md`, `Problem_and_Challenge_Statement.md`, `DECISIONS.md`, `SOURCES.md`, `VIDEO_SCRIPTS.md`, `RISK_REGISTER.md`, `TASKS.md`, `AI_USE_LOG.md`, `AGENTS.md`, `STEERING_GUIDE_FINAL.md`

---

## 🚀 BUILD PROMPTS

Each prompt below is a self-contained work unit. Execute them **in order**. Each one builds on the previous.

---

### PROMPT 1: Real NASA Data Ingestion — SWOT RiverSP

| Field | Value |
|---|---|
| **Prompt Name** | `P1-SWOT-DATA-INGESTION` |
| **Branch Name** | `feature/swot-data-ingestion` |
| **Role** | `[Data Infrastructure & Pipeline Developer — Mahim Abdullah Rianto]` |

**Prompt:**

> You are the Data Infrastructure & Pipeline Developer for HydroSense-SWOT, a NASA Space Apps 2026 project. Your task is to replace the synthetic fixture data with REAL NASA SWOT L2 HR RiverSP 2.0 data for the Surma–Kushiyara river corridor in north-east Bangladesh.
>
> **What to build:**
>
> 1. Create `pipeline/ingest_swot.py` that:
>    - Uses the `earthaccess` Python library to authenticate with NASA Earthdata (read credentials from `.env`).
>    - Calls `earthaccess.login()` ONCE at the top of the script — NOT inside any loop (Guard B5).
>    - Searches for SWOT data using `short_name="SWOT_L2_HR_RIVERSP_2.0"` with temporal range `("2024-01-01", "2026-05-31")` and bounding box `(23.5, 91.0, 26.0, 93.5)`.
>    - Downloads granules to `data/raw/swot/`.
>    - ALTERNATIVELY, queries the **Hydrocron Time-Series API** at `https://soto.podaac.earthdatacloud.nasa.gov/hydrocron/v1` with parameters:
>      - `feature=Reach`
>      - `feature_id={reach_id}` for each SWORD reach in our study area
>      - `fields=reach_id,time_str,wse,width,slope2,wse_u,dark_frac,quality_f`
>      - `start_time=2024-01-01T00:00:00Z`, `end_time=2026-05-31T23:59:59Z`
>      - `output=geojson`
>    - After Hydrocron pull, MUST replace fill values: `df.replace(-999999.0, float('nan'), inplace=True)` (Guard B6).
>    - Reach IDs are 11-digit integers — read/store as STRING always: `dtype={'reach_id': str}` (Guard B3).
>    - Uses `slope2` (reach-averaged slope), NOT `slope` (node-level) (Guard B9).
>
> 2. Create `pipeline/ingest_sword.py` that:
>    - Downloads SWORD v16 reach database from `hydrosheds.org` for South Asia.
>    - Filters reaches in bounding box (23.5N-26.0N, 91.0E-93.5E).
>    - Pre-screens reaches with `width > 100m` (SWOT minimum resolution).
>    - Exports filtered reach IDs, centreline coordinates, and widths to `data/processed/sword_reaches.csv`.
>
> 3. Apply SWOT Quality Gating (from SOLUTION_ARCHITECTURE.md section 2.1):
>    - `quality_f`: keep only 0 or 1 (drop 2 or 3)
>    - `dark_frac`: keep < 0.3
>    - `width`: keep > 100m (tag 50-100m as uncertain)
>    - `wse_u`: keep < 0.25m (weight by `1/wse_u^2` in calibration)
>    - `slope2`: keep > `2 * slope_u` AND > `1e-5 m/m` — this is the **most critical filter** for low-gradient Bangladesh rivers
>
> 4. Export quality-gated data to `data/fixtures/swot_reaches.nc` (NetCDF4 format) with dimensions `(reach_id, time)` and variables `wse, width, slope2, slope_u, quality_f, dark_frac`.
>
> 5. Add `earthaccess` and `requests` to `requirements.txt`.
>
> 6. Update `scripts/generate_fixtures.py` to have a `--mode real` flag that calls the ingestion pipeline instead of generating synthetic data.
>
> **Import order MUST be: `import netCDF4` before `import xarray`** (Guard B2).
>
> All timestamps must be UTC ISO8601 strings. Convert ONCE at ingestion (Guard B1).

**Description:**  
This prompt replaces synthetic/mock SWOT data with real NASA SWOT L2 HR RiverSP 2.0 satellite observations. It implements two pathways (earthaccess bulk download OR Hydrocron API) for pulling SWOT reach measurements (water surface elevation, width, slope) for the Surma-Kushiyara corridor. Critical quality gates filter out noisy/unreliable observations — especially the slope quality filter which is essential for low-gradient Bangladesh rivers where SWOT slope uncertainty can exceed the actual signal.

**✅ Checklist:**
- [x] `pipeline/ingest_swot.py` created with earthaccess authentication
- [x] Hydrocron API query implemented as alternative pathway
- [x] Fill values `-999999.0` replaced with NaN after every data pull
- [x] Reach IDs stored as strings (never float64)
- [x] `slope2` used everywhere, never `slope`
- [x] All 6 quality gates applied (quality_f, dark_frac, width, wse_u, slope2 signal-to-noise, slope2 minimum)
- [x] `pipeline/ingest_sword.py` created with width > 100m pre-screening
- [x] Quality-gated data exported to `data/fixtures/swot_reaches.nc`
- [x] `earthaccess.login()` called ONCE at top, never inside loops
- [x] `import netCDF4` appears before `import xarray`
- [x] All timestamps are UTC ISO8601
- [x] `requirements.txt` updated with `earthaccess` and `requests`
- [x] Unit test added in `tests/test_ingest_swot.py`

---

### PROMPT 2: Real NASA Data Ingestion — GPM IMERG + Gauge

| Field | Value |
|---|---|
| **Prompt Name** | `P2-IMERG-GAUGE-INGESTION` |
| **Branch Name** | `feature/imerg-gauge-ingestion` |
| **Role** | `[Data Infrastructure & Pipeline Developer — Mahim Abdullah Rianto]` |

**Prompt:**

> You are the Data Infrastructure & Pipeline Developer for HydroSense-SWOT. Your task is to replace synthetic rainfall and gauge fixture data with REAL NASA GPM IMERG Early Run V07 data and BWDB gauge observations.
>
> **What to build:**
>
> 1. Create `pipeline/ingest_imerg.py` that:
>    - Accesses NASA GES DISC OPeNDAP for product `GPM_3IMERGHHE` (IMERG Early Run V07).
>    - Uses `.netrc` authentication or `earthaccess` for GES DISC access.
>    - Downloads half-hourly precipitation granules for the study region: lat `23.5N-26.0N`, lon `91.0E-93.5E`, temporal range `2026-04-01` to `2026-05-31`.
>    - Extracts the `precipitationCal` variable (NOT `precipitation` — that is uncalibrated).
>    - IMERG timestamps are END-of-interval — shift back 30 minutes: `ds['time'] = ds['time'] - pd.Timedelta('30min')` (Guard B4).
>    - After opening: `ds.rio.write_crs('EPSG:4326', inplace=True)` (Guard B7).
>    - Assert `MAP.max() > 0` before proceeding — if all-zero, CRS clip or variable name is wrong.
>    - Clips to HydroSHEDS sub-basin polygons for spatial aggregation.
>    - Computes area-weighted Mean Areal Precipitation (MAP) per sub-basin per 30-min step.
>    - Exports to `data/fixtures/imerg_map.nc` with dimensions `(sub_basin, time)` and variable `precipitationCal` in mm/hr.
>    - Acknowledges IMERG orographic bias over Meghalaya in comments and SOURCES.md.
>
> 2. Create `pipeline/ingest_gauge.py` that:
>    - Scrapes or imports BWDB/FFWC gauge data for:
>      - **Kanaighat** (Surma) — Station SW108, Danger Level 13.20m PWD
>      - **Sherpur** (Kushiyara) — if available
>      - **Sunamganj** — if available
>    - Converts Bangladesh Standard Time (BST = UTC+6) to UTC ONCE at ingestion:
>      ```python
>      gauge['timestamp'] = gauge['timestamp'].dt.tz_localize('Asia/Dhaka').dt.tz_convert('UTC')
>      assert gauge['timestamp'].dt.tz is not None, "Timestamps must be timezone-aware"
>      ```
>    - Applies rolling 3-point median filter to remove spikes.
>    - Records datum and unit in SOURCES.md.
>    - Does NOT convert level to discharge without a published rating curve.
>    - Exports to `data/fixtures/gauge_kanaighat.csv` with columns: `timestamp, station_id, station_name, reach_id, water_level_m, danger_level_m`.
>    - All IDs stored as strings.
>
> 3. Download HydroSHEDS v1 sub-basin polygons:
>    - Create `pipeline/ingest_hydrosheds.py`.
>    - Download sub-basin boundaries for the Surma-Kushiyara catchment.
>    - Export as GeoJSON to `data/processed/hydrosheds_basins.geojson`.
>
> 4. Add `rioxarray`, `geopandas`, `h5netcdf` to `requirements.txt`.
>
> **Import order MUST be: `import netCDF4` before `import xarray`** (Guard B2).

**Description:**  
This prompt implements real NASA GPM IMERG Early Run V07 rainfall data ingestion and BWDB gauge data acquisition. IMERG provides the operational rainfall forcing for the Muskingum-Cunge routing — it is the "engine" that drives the 30-minute time steps. The gauge data provides ground truth for scientific validation. Critical guards handle IMERG timestamp conventions (end-of-interval), CRS alignment, orographic bias acknowledgement, and timezone conversion for Bangladesh gauge data.

**✅ Checklist:**
- [x] `pipeline/ingest_imerg.py` created with GES DISC OPeNDAP access
- [x] `precipitationCal` variable used (not `precipitation`)
- [x] IMERG timestamps shifted back 30 minutes (end-of-interval correction)
- [x] `ds.rio.write_crs('EPSG:4326', inplace=True)` called after opening
- [x] MAP assertion: `max > 0` checked before proceeding
- [x] Sub-basin spatial aggregation with HydroSHEDS polygons
- [x] Exported to `data/fixtures/imerg_map.nc`
- [x] `pipeline/ingest_gauge.py` created with BST to UTC conversion
- [x] Timezone awareness asserted on all gauge timestamps
- [x] Rolling median filter applied to gauge data
- [x] `pipeline/ingest_hydrosheds.py` created
- [x] `requirements.txt` updated with `rioxarray`, `geopandas`, `h5netcdf`
- [x] IMERG orographic bias documented in SOURCES.md
- [x] Unit test added in `tests/test_ingest_imerg.py`

---

### PROMPT 3: Manning Calibration with Real SWOT Data

| Field | Value |
|---|---|
| **Prompt Name** | `P3-MANNING-CALIBRATION-REAL` |
| **Branch Name** | `feature/manning-calibration-real` |
| **Role** | `[Systems & Backend Algorithm Developer — Fazle Rabbi Mugdho]` |

**Prompt:**

> You are the Systems & Backend Algorithm Developer for HydroSense-SWOT. Your task is to upgrade the Manning's roughness coefficient calibration to work with REAL SWOT data, ensuring physically bounded, scientifically defensible results.
>
> **What to build:**
>
> 1. Upgrade `pipeline/manning_calibration.py` to:
>    - Accept real SWOT data with irregular time stamps (SWOT passes are ~every 7-10 days, not regular intervals).
>    - Compute `z_bed` = minimum WSE over quality-passed passes (Assumption A1). Uncertainty +/-0.18m.
>    - Calibrate ONLY on mid-to-high flow SWOT passes (`wse > z_bed + 0.5m`). Low-flow passes produce a different `n` because `n` is stage-dependent in alluvial channels.
>    - Use `scipy.optimize.minimize_scalar(func, bounds=(0.025, 0.10), method='bounded')` — the `method='bounded'` keyword is **REQUIRED** (Guard B8).
>    - Weight calibration observations by `1/wse_u^2` (inverse-variance weighting using WSE uncertainty).
>    - Apply slope2 quality filter: skip passes where `slope2 < 2 * slope_u` (the slope signal is unreliable).
>    - Calibration period: **Jan 2024 – Mar 2026** (pre-event). Lock `n` before test period starts.
>    - Test period: **Apr 1 – May 31, 2026**. n MUST NOT change during this period.
>    - If `n` hits a bound (0.025 or 0.10), flag the reach, widen the error band, and investigate slope quality.
>
> 2. Create `pipeline/calibration_diagnostics.py`:
>    - Plot calibration fit: SWOT-derived Q vs gauge Q for each reach.
>    - Show `n` sensitivity curve (RMSE vs `n` across the bounded range).
>    - Output diagnostic figures to `data/processed/calibration_plots/`.
>
> 3. Update `pipeline/run_pipeline.py` Step 3 to:
>    - Log which passes were excluded (low-flow, slope quality, dark_frac) and why.
>    - Print calibration diagnostics summary.
>
> 4. Export calibration results to `data/processed/calibration_results.json` with per-reach fields:
>    ```json
>    {
>      "reach_id": "22211000011",
>      "n_calibrated": 0.0542,
>      "z_bed_m": 8.42,
>      "n_valid_passes": 12,
>      "mean_slope2": 4.2e-05,
>      "mean_width_m": 162.3,
>      "calibration_period": "2024-01-01 to 2026-03-31",
>      "passes_excluded_low_flow": 3,
>      "passes_excluded_slope_quality": 2,
>      "n_at_bound": false,
>      "rmse_m3s": 45.2
>    }
>    ```

**Description:**  
This prompt upgrades Manning's roughness calibration from synthetic data to handle the irregularity and noise characteristics of real SWOT observations. Key additions: stage-dependent calibration filtering (mid-to-high flow only), inverse-variance weighting, strict time-split discipline (calibration vs test period), and slope quality gating — which is the single most important guard for low-gradient Bangladesh rivers where SWOT slope noise can exceed the actual signal.

**✅ Checklist:**
- [x] Calibration uses only mid-to-high flow passes (`wse > z_bed + 0.5m`)
- [x] `minimize_scalar` uses `bounds=(0.025, 0.10)` AND `method='bounded'`
- [x] Inverse-variance weighting `1/wse_u^2` applied
- [x] Slope quality filter: `slope2 > 2 * slope_u` enforced
- [x] Calibration period locked to Jan 2024 – Mar 2026
- [x] `n` is frozen before test period (Apr 2026)
- [x] Bound-hitting reaches flagged with widened error bands
- [x] Calibration diagnostics with Q-Q plot and n-sensitivity curve
- [x] Excluded passes logged with reasons
- [x] Calibration results exported to JSON
- [x] All reach_ids handled as strings
- [x] Unit tests updated in `tests/test_pipeline.py` and `tests/test_calibration_real.py`

---

### PROMPT 4: Muskingum-Cunge Routing with Real Data

| Field | Value |
|---|---|
| **Prompt Name** | `P4-ROUTING-ENGINE-REAL` |
| **Branch Name** | `feature/routing-engine-real` |
| **Role** | `[Systems & Backend Algorithm Developer — Fazle Rabbi Mugdho]` |

**Prompt:**

> You are the Systems & Backend Algorithm Developer for HydroSense-SWOT. Your task is to upgrade the Muskingum-Cunge routing module to handle real IMERG rainfall input and produce physically consistent stage predictions validated against BWDB gauge observations.
>
> **What to build:**
>
> 1. Upgrade `pipeline/muskingum_cunge.py` to:
>    - Use **calibrated n** from Prompt 3 (loaded from `data/processed/calibration_results.json`).
>    - Route IMERG MAP series at 30-minute intervals through the 4-sub-reach cascade.
>    - CRITICAL: SWOT and IMERG are DIFFERENT time series — NEVER inner-join them by timestamp. SWOT is offline calibration only. IMERG drives all 30-min routing steps.
>    - Routing parameters:
>      - `V_mean = Q_SWOT / A` (at mid-flood-stage SWOT pass)
>      - `c = (5/3) * V_mean` (flood wave celerity)
>      - `K_reach = reach_length / c` (travel time in seconds)
>      - `X = 0.25` (Muskingum weighting — sensitivity-test 0.2-0.35)
>      - `K_total_hours = sum(K_per_reach) / 3600`
>    - Valid regime: **rising limb, in-channel flow only**. Cannot model floodplain inundation, backwater, or full recession.
>    - Invert stage from discharge using Manning's equation with calibrated parameters.
>    - Compute uncertainty band: +/-0.18m WSE propagated through Manning analytically.
>    - Compute `modelled_stage_upper` and `modelled_stage_lower` at each time step.
>
> 2. Upgrade `pipeline/harvest_flag.py` to:
>    - Use `danger_level_m = 13.20` from BWDB Kanaighat station.
>    - Compute travel time from data: `K_total_hours` from routing parameters.
>    - Look-ahead using computed travel time: `future_level = modelled_level(t + travel_time)`.
>    - Flag rules:
>      - RED: `future_level >= danger_level`
>      - AMBER: `future_level >= 0.80 * danger_level`
>      - GREEN: below thresholds
>    - Generate bilingual advisory text (English + Bangla).
>    - Peak date annotation driven from data: `peak_date = modelled_level.idxmax()` (Guard B10 — never hardcoded).
>
> 3. Upgrade `pipeline/baseline.py` to:
>    - Use 6-hour rolling accumulation of IMERG rainfall over Meghalaya sub-basin.
>    - Threshold calibrated from historical events (if available) or sensitivity analysis.
>    - Output baseline flag transitions for comparison with HydroSense model.
>
> 4. Sensitivity analysis module `pipeline/sensitivity.py`:
>    - Test Muskingum X from 0.2 to 0.35 in 0.05 steps.
>    - Test n +/-10% from calibrated value.
>    - Report NSE, timing error, and lead time for each combination.
>    - Export to `data/processed/sensitivity_results.csv`.

**Description:**  
This prompt upgrades the hydrological routing engine from synthetic to real data. The key architectural constraint is that SWOT provides offline channel parameters while IMERG drives all operational 30-minute time steps — these must never be confused. The routing produces stage predictions with quantified uncertainty bands (+/-0.18m from SWOT WSE uncertainty). Sensitivity analysis tests the robustness of results to routing parameter choices.

**✅ Checklist:**
- [x] Muskingum-Cunge routing uses calibrated `n` from real data
- [x] 30-minute IMERG time steps drive all routing (SWOT never referenced in routing loop)
- [x] Wave celerity `c = (5/3) * V_mean` computed from data
- [x] Travel time computed from reach parameters (not hardcoded)
- [x] +/-0.18m uncertainty band propagated at each time step
- [x] Harvest flag uses look-ahead with computed travel time
- [x] Peak date driven from `modelled_level.idxmax()` (never hardcoded)
- [x] Bilingual advisory text generated (EN + Bangla)
- [x] Baseline uses 6h rolling IMERG accumulation
- [x] Sensitivity analysis for X (0.2-0.35) and n (+/-10%)
- [x] Sensitivity results exported to CSV
- [x] All unit tests pass

---

### PROMPT 5: Scientific Validation & Metrics with Real Data

| Field | Value |
|---|---|
| **Prompt Name** | `P5-SCIENTIFIC-VALIDATION` |
| **Branch Name** | `feature/scientific-validation` |
| **Role** | `[Systems & Backend Algorithm Developer — Fazle Rabbi Mugdho]` |

**Prompt:**

> You are the Systems & Backend Algorithm Developer for HydroSense-SWOT. Your task is to compute rigorous scientific validation metrics by comparing model output against real BWDB gauge observations during the April-May 2026 test period.
>
> **What to build:**
>
> 1. Upgrade `pipeline/metrics.py` to:
>    - Align modelled and observed time series (nearest-timestamp matching within 15-minute tolerance).
>    - Compute on the **test period only** (Apr 1 – May 31, 2026):
>      | Metric | Formula | Display |
>      |---|---|---|
>      | NSE | `1 - sum((sim-obs)^2)/sum((obs-mean(obs))^2)` | `f"{nse:.2f}"` |
>      | KGE | Kling-Gupta Efficiency (correlation + variability + bias) | `f"{kge:.2f}"` |
>      | PBIAS | `(sum(sim) - sum(obs))/sum(obs) * 100` | `f"{pbias:+.1f}%"` |
>      | Peak Timing Error | `(sim.idxmax() - obs.idxmax()) in hours` | `f"{dte:+.1f} h"` |
>      | Lead Time | Time from first RED flag to observed gauge crossing danger level | `f"{lead:.1f} h"` |
>    - **NEVER display more than 2 decimal places** — over-precision signals hardcoding.
>    - If NSE < 0: do NOT stop. Record the value. Report what SWOT adds vs baseline.
>    - If model is worse than baseline: show both NSE values honestly.
>
> 2. Create `pipeline/validation_report.py`:
>    - Generate a comprehensive validation summary as markdown.
>    - Include: time-series comparison plots, scatter plot (sim vs obs), residual analysis.
>    - Export figures to `data/processed/validation_plots/`.
>    - Export summary to `data/processed/validation_report.md`.
>
> 3. Compare HydroSense vs Baseline:
>    - Compute all 5 metrics for both HydroSense (SWOT-calibrated) and baseline (rainfall-only).
>    - Show side-by-side comparison.
>    - If HydroSense can't beat baseline on NSE, report what SWOT adds (better timing? lower bias?).
>
> 4. Update JSON export (`scripts/export_json.py`) with real computed metrics.

**Description:**  
This prompt implements rigorous scientific validation comparing model predictions against real gauge observations. The strict time-split discipline ensures no data leakage from calibration to test. The honest reporting approach — showing metrics even when unfavorable, comparing against baseline, and limiting decimal precision — builds credibility with judges and satisfies the Validity scoring criterion.

**✅ Checklist:**
- [x] Metrics computed only on test period (Apr-May 2026)
- [x] Time series aligned with 15-minute tolerance
- [x] All 5 metrics computed: NSE, KGE, PBIAS, timing error, lead time
- [x] Display precision: NSE/KGE to 2dp, PBIAS to 1dp, timing/lead to 1dp
- [x] NSE < 0 handled gracefully (no crash, report value)
- [x] HydroSense vs Baseline comparison implemented
- [x] Validation report with plots generated
- [x] Real metrics exported to `metrics_summary.json`
- [x] No hardcoded metric values anywhere in the codebase
- [x] Uncertainty bands shown on validation plots

---

### PROMPT 6: Dashboard UI Upgrade — Real Data Integration

| Field | Value |
|---|---|
| **Prompt Name** | `P6-DASHBOARD-REAL-DATA` |
| **Branch Name** | `feature/dashboard-real-data` |
| **Role** | `[Frontend & Product Experience Developer — Arko Saha]` |

**Prompt:**

> You are the Frontend & Product Experience Developer for HydroSense-SWOT. Your task is to upgrade the existing mock dashboard to display REAL computed data from the scientific pipeline, with all values driven from the JSON data files.
>
> **What to build:**
>
> 1. Update all dashboard components to read from the real JSON data exports:
>    - `event_timeseries.json` -> HydrographPanel, RiverMapPanel timeline
>    - `gauge_observations.json` -> HydrographPanel observed series overlay
>    - `calibration_summary.json` -> ReachInspectorModal parameters
>    - `metrics_summary.json` -> ValidationMetricsPanel card values
>    - `reach_metadata.json` -> RiverMapPanel reach positions and labels
>
> 2. Upgrade `HydrographPanel.js`:
>    - Plot **three** lines: modelled stage (cyan), observed gauge (white dashed), baseline (grey dotted).
>    - Add **uncertainty band** (+/-0.18m) as shaded fill around modelled line.
>    - Add **danger level** as horizontal amber dashed line at 13.20m.
>    - X-axis: date labels driven from data.
>    - Y-axis: "Water Level (m PWD)".
>    - Inverted rainfall hyetograph above the stage chart (dual-axis).
>    - Timeline scrubber synced with all panels — scrubbing updates:
>      - River Map reach colors (current stage vs danger ratio)
>      - Harvest Decision flag
>      - Hydrograph cursor position
>    - All dates driven from data (Guard B10).
>
> 3. Upgrade `HarvestDecisionPanel.js`:
>    - Status dynamically computed from current slider timestamp.
>    - Shows GREEN/AMBER/RED with icon, text label, and bilingual advisory.
>    - Travel time displayed from `metrics_summary.json`.
>    - IMERG latest timestamp displayed.
>    - SWOT geometry date displayed from data.
>
> 4. Upgrade `RiverMapPanel.js`:
>    - Color reaches by current stage/danger ratio using **cividis** colormap.
>    - Mark SWOT overpass dates with asterisk (*).
>    - Hatched/flagged reaches where slope quality is uncertain.
>    - Click-to-select reach -> updates hydrograph and decision context.
>    - Animated flow direction dashes (3-5 second cycle).
>    - Gauge marker with pulsating sonar ring (2.4-3.4s).
>
> 5. Upgrade `ValidationMetricsPanel.js`:
>    - All values from `metrics_summary.json` — no hardcoded numbers.
>    - Tooltip on each metric with definition and confidence context.
>    - Display precision from formatted strings.
>
> 6. Upgrade `OperationalLimitsPanel.js`:
>    - Content from SOLUTION_ARCHITECTURE.md Limits panel:
>      - SWOT resolves rivers wider than ~100m
>      - Low-slope reaches excluded where slope uncertainty exceeds signal
>      - IMERG may overestimate orographic rain over Meghalaya
>      - Routing models rising limb only — inundation extent not modelled
>      - Lead time: ~22-30h from observed rain to flag
>      - Computed NSE, KGE, timing error values
>
> 7. Ensure all components follow `DESIGN_ARCHITECTURE.md` tokens:
>    - Glassmorphic panels: `backdrop-filter: blur(18px) saturate(125%)`
>    - Color palette: bg-950 `#050A12`, cyan-400 `#35D8F2`, green-400 `#30E08A`, amber-400 `#FFC45C`, red-400 `#FF647C`
>    - Typography: Inter font, tabular numerals
>    - Layout: 8:4 hero (map:decision) on desktop, full-width hydrograph below
>    - Responsive: works at 360px minimum viewport

**Description:**  
This prompt replaces all hardcoded/mock values in the dashboard with real computed data from the scientific pipeline. The key principle: the UI formats and displays the authoritative model result — it does not recompute the science. All dates, metrics, flags, and parameters must be driven from the JSON data files, never hardcoded strings. The dashboard must faithfully render the computed uncertainty, honestly display the limitations, and provide the "signature demo moment" where the slider reveals the flood warning ~21 hours before the gauge crosses danger level.

**✅ Checklist:**
- [x] All 5 JSON data files loaded and consumed by components
- [x] Three hydrograph lines: modelled, observed, baseline
- [x] +/-0.18m uncertainty band rendered as shaded fill
- [x] Danger level line at 13.20m
- [x] Inverted rainfall hyetograph (dual-axis)
- [x] Timeline scrubber syncs all panels
- [x] Harvest flag updates dynamically with slider position
- [x] Reach colors update with slider (cividis scale)
- [x] SWOT overpass dates marked on map
- [x] Uncertain-slope reaches shown hatched
- [x] Validation metric values from JSON (no hardcoded numbers)
- [x] Metric tooltips with definitions
- [x] Limits panel text matches SOLUTION_ARCHITECTURE.md
- [x] Glassmorphism design tokens applied consistently
- [x] Responsive layout works at 360px
- [x] Bilingual EN/Bangla toggle functional
- [x] Zero console errors on load

---

### PROMPT 7: Interactive Map Enhancement — Leaflet/Mapbox Integration

| Field | Value |
|---|---|
| **Prompt Name** | `P7-INTERACTIVE-MAP` |
| **Branch Name** | `feature/interactive-map` |
| **Role** | `[Frontend & Product Experience Developer — Arko Saha]` |

**Prompt:**

> You are the Frontend & Product Experience Developer for HydroSense-SWOT. Your task is to replace the current SVG-based river map with a fully interactive geographic map using Leaflet (react-leaflet) or Mapbox GL JS, overlaying real SWOT reach geometries and gauge locations.
>
> **What to build:**
>
> 1. Install and configure mapping library:
>    - `npm install react-leaflet leaflet` (or `mapbox-gl react-map-gl` if using Mapbox)
>    - Use a dark tile basemap (e.g., CartoDB Dark Matter or Mapbox Dark).
>
> 2. Create `ui/app/components/InteractiveMap.js`:
>    - Center on study area: `[24.95, 92.0]`, zoom 9.
>    - Render SWOT reaches as polylines from `reach_metadata.json` coordinates.
>    - Color reaches by current stage/danger ratio using **cividis** colorscale (CVD-safe).
>    - Reach line width: 3px normal, 4px selected, with 6-10px blurred glow.
>    - Animated flow-direction dashes: `stroke-dasharray` animation, 3-5s cycle.
>    - Gauge marker at Kanaighat: pulsating sonar ring, 2.4-3.4s cycle.
>    - Click reach -> select -> update hydrograph context.
>    - Hover reach -> tooltip: reach name, current stage, status, last SWOT pass date.
>    - Show Meghalaya hills boundary (India-Bangladesh border).
>    - Show sub-basin boundaries from HydroSHEDS.
>    - Hatching overlay for slope-uncertain reaches.
>    - Scale bar and zoom controls (44x44px touch targets).
>
> 3. Add reach polyline coordinates:
>    - Either use SWORD centreline coordinates from `data/processed/sword_reaches.csv`
>    - Or define approximate polylines in `ui/public/data/reach_geometries.json`
>    - Each reach: `{ reach_id, coordinates: [[lat, lon], ...], river_name }`
>
> 4. Integrate map time-sync:
>    - Map reaches update color based on current timeline scrubber position.
>    - IMERG rainfall overlay: show current rainfall intensity as transparent heatmap.
>    - SWOT overpass dates shown as timestamped markers.
>
> 5. Performance:
>    - Lazy-load map tiles.
>    - Use Canvas renderer for Leaflet (not SVG) for performance.
>    - IntersectionObserver to pause animations when map is not visible.
>    - `@media (prefers-reduced-motion: reduce)` honored.

**Description:**  
This prompt upgrades the static SVG map to a real interactive geographic map with actual reach geometries, gauge locations, and real-time color updates based on model output. The map serves as the "hero visualization" — the first thing judges see. It communicates spatial context (where the rivers are relative to Meghalaya and Bangladesh), data quality (which reaches have reliable slope data), and current status (stage vs danger level) all in one view.

**✅ Checklist:**
- [ ] Mapping library installed (Leaflet or Mapbox)
- [ ] Dark basemap tile layer configured
- [ ] SWOT reaches rendered as colored polylines
- [ ] Cividis colorscale for stage/danger ratio
- [ ] Flow-direction dash animation (3-5s)
- [ ] Gauge marker with pulsating sonar ring
- [ ] Click-to-select reach functionality
- [ ] Hover tooltip with reach data
- [ ] Sub-basin boundaries shown
- [ ] Slope-uncertain reaches hatched
- [ ] Timeline-synced reach coloring
- [ ] IMERG rainfall overlay
- [ ] 44x44px touch targets on controls
- [ ] Canvas renderer for performance
- [ ] Reduced-motion preference honored
- [ ] Map renders correctly on mobile (360px+)

---

### PROMPT 8: Bilingual Localization (English + Bangla)

| Field | Value |
|---|---|
| **Prompt Name** | `P8-BILINGUAL-LOCALIZATION` |
| **Branch Name** | `feature/bilingual-localization` |
| **Role** | `[Frontend & Product Experience Developer — Arko Saha]` |

**Prompt:**

> You are the Frontend & Product Experience Developer for HydroSense-SWOT. Your task is to implement complete bilingual localization (English + Bangla) throughout the dashboard, with Bangla as the default language per the target user profile (Upazila Agriculture Officer in Sunamganj).
>
> **What to build:**
>
> 1. Create `ui/app/locales/en.json` and `ui/app/locales/bn.json` with all UI strings:
>    - App title, section headings, status labels
>    - Harvest advisory text for each flag state (GREEN/AMBER/RED)
>    - Metric labels and descriptions
>    - Operational limits text
>    - Button labels, tooltips, modal titles
>    - Reach names (English and Bangla)
>    - Date/time formatting for both locales
>
> 2. Create `ui/app/hooks/useLocale.js`:
>    - React context provider for language state.
>    - Toggle between 'en' and 'bn'.
>    - Default language: **Bangla** (target user is a Sunamganj officer).
>    - Persist language preference in localStorage.
>
> 3. Update ALL components to use localized strings:
>    - `AppHeader.js`: language toggle control (compact segmented, 30-32px height)
>    - `HarvestDecisionPanel.js`: flag advisory in selected language
>    - `OperationalLimitsPanel.js`: limits text in selected language
>    - `ValidationMetricsPanel.js`: metric labels in selected language
>    - `PageContextBar.js`: title and subtitle
>    - All modal components: titles and body text
>
> 4. Bangla typography:
>    - Use **Noto Sans Bengali** web font for Bangla text.
>    - Ensure proper line height (1.6-1.8 for Bangla script).
>    - Test text rendering on Windows and mobile.
>
> 5. Screen reader support:
>    - Flag reads: "AMBER — 12 ghontar moddhe dhan katun jodi panir stor barte thake" (Bangla)
>    - Or: "AMBER — Cut within 12 hours if level keeps rising" (English)

**Description:**  
This prompt implements complete bilingual support for the dashboard. The target user is a Bangla-speaking agriculture officer, so Bangla is the default language. This directly addresses the Influence scoring criterion — judges want to see that the tool is designed for the actual end user, not just for the English-speaking hackathon judges. The language toggle allows judges to switch to English for evaluation while demonstrating that the real product serves Bangla speakers.

**✅ Checklist:**
- [ ] `en.json` and `bn.json` locale files created with all strings
- [ ] `useLocale` hook with context provider
- [ ] Default language is Bangla
- [ ] Language preference persists in localStorage
- [ ] All 10+ components use localized strings
- [ ] Language toggle in AppHeader (segmented control)
- [ ] Noto Sans Bengali font loaded
- [ ] Bangla line height set to 1.6-1.8
- [ ] Screen reader labels in both languages
- [ ] Reach names display in selected language
- [ ] Dates formatted per locale convention
- [ ] No untranslated hardcoded strings remain

---

### PROMPT 9: Accessibility & WCAG Compliance

| Field | Value |
|---|---|
| **Prompt Name** | `P9-ACCESSIBILITY-WCAG` |
| **Branch Name** | `feature/accessibility-wcag` |
| **Role** | `[Technical Quality & Compliance Specialist — Samia Rahman Arpita]` |

**Prompt:**

> You are the Technical Quality & Compliance Specialist for HydroSense-SWOT. Your task is to audit the entire dashboard for accessibility and implement WCAG AA compliance.
>
> **What to build:**
>
> 1. Color and contrast:
>    - All text meets WCAG AA (4.5:1 for normal, 3:1 for large text).
>    - Status NEVER communicated by color alone — always icon + text + color.
>    - Hydrograph lines: solid (modelled) / dashed (observed) / dotted (baseline) — CVD-safe.
>    - Map uses **cividis** sequential colormap (mathematically optimized for CVD).
>
> 2. Keyboard navigation:
>    - Full keyboard navigation across: top bar, filters, map controls, cards, timeline, modals.
>    - Visible focus ring: 2px cyan + 2px offset (never remove `outline`).
>    - Tab order follows reading order.
>    - Modal/popover focus trap with Escape to close.
>    - Arrow-key navigation on hydrograph (sample-by-sample exploration).
>
> 3. Touch targets:
>    - All interactive elements >= 44x44px.
>    - Spacing between touch targets >= 8px.
>    - Map zoom controls: 40x40px buttons.
>
> 4. Screen reader support:
>    - `aria-label` on icon-only buttons.
>    - `aria-live="polite"` for routine status updates.
>    - `aria-live="assertive"` only for RED flag transitions.
>    - Chart summary text alternative.
>    - `alt` text on all images and map elements.
>
> 5. Reduced motion:
>    ```css
>    @media (prefers-reduced-motion: reduce) {
>      *, *::before, *::after {
>        animation-duration: 0.01ms !important;
>        animation-iteration-count: 1 !important;
>        transition-duration: 0.01ms !important;
>      }
>    }
>    ```
>
> 6. Browser zoom:
>    - Support 200% zoom without horizontal overflow.
>    - No content loss or overlap.
>
> 7. Minimum viewport: 360px width.

**Description:**  
This prompt ensures the dashboard meets WCAG AA accessibility standards. Beyond compliance, good accessibility directly supports the Presentation scoring criterion — judges notice when a tool is thoughtfully designed for all users. The cividis colormap, multi-modal status indicators (icon+text+color), and keyboard navigation demonstrate that the team considered the full spectrum of users, including those with visual or motor impairments.

**✅ Checklist:**
- [ ] All text passes WCAG AA contrast (4.5:1 / 3:1)
- [ ] Status communicated via icon + text + color (never color alone)
- [ ] Hydrograph line styles differentiated by dash pattern
- [ ] Full keyboard navigation implemented
- [ ] Visible focus rings on all interactive elements
- [ ] Tab order matches reading order
- [ ] Modal focus trap with Escape-to-close
- [ ] All touch targets >= 44x44px
- [ ] Screen reader labels on icon-only buttons
- [ ] `aria-live` regions for status updates
- [ ] Reduced motion media query honored
- [ ] 200% browser zoom supported without overflow
- [ ] 360px minimum viewport tested
- [ ] Chart alt-text provided

---

### PROMPT 10: Performance Optimization & Offline Resilience

| Field | Value |
|---|---|
| **Prompt Name** | `P10-PERFORMANCE-OFFLINE` |
| **Branch Name** | `feature/performance-offline` |
| **Role** | `[Frontend & Product Experience Developer — Arko Saha]` |

**Prompt:**

> You are the Frontend & Product Experience Developer for HydroSense-SWOT. Your task is to optimize dashboard performance and ensure it works fully offline during the hackathon judging session (venue WiFi is unreliable).
>
> **What to build:**
>
> 1. Offline-first architecture:
>    - ALL data loaded from static JSON files in `ui/public/data/` — NO live API calls during demo.
>    - Map tiles: pre-cache a bounding box tileset, or use an inline SVG/Canvas map that doesn't require tile fetching.
>    - Fonts: self-host Inter and Noto Sans Bengali in `ui/public/fonts/` instead of Google Fonts CDN.
>    - All icons and assets self-contained.
>
> 2. Bundle optimization:
>    - Code-split modals (ReachInspector, Advisory, Architecture) with `dynamic()` import.
>    - Tree-shake unused Recharts components.
>    - Minimize JSON payload: remove unnecessary decimal precision, compress field names.
>    - Target: initial page load < 3 seconds on 3G throttle.
>
> 3. Rendering performance:
>    - Map animations: use CSS transforms and opacity only (never animate blur, shadow, or layout).
>    - Hydrograph: downsample to ~500 points for rendering, full data for tooltips.
>    - IntersectionObserver to pause off-screen animations.
>    - `will-change` only on actively animated elements.
>    - `content-visibility: auto` on below-fold panels.
>
> 4. Error states:
>    - Loading skeleton with shimmer (1.4-1.8s cycle).
>    - "No data" states with clear messaging and retry action.
>    - Stale data indicator in header.
>    - JSON load failure: graceful fallback with error boundary.
>
> 5. Build verification:
>    - `npm run build` succeeds without errors.
>    - Lighthouse Performance score >= 90.
>    - No layout shift (CLS < 0.1).
>    - Largest Contentful Paint < 2.5s.

**Description:**  
This prompt ensures the dashboard performs flawlessly during the live judging demo. The number 1 risk at hackathons is venue WiFi failure — by making everything offline-first (static JSON data, self-hosted fonts, pre-cached/inline map), we eliminate this risk entirely. Performance optimization ensures the "signature demo moment" (dragging the slider across the flood event) feels smooth and responsive, which directly impacts the Presentation scoring criterion.

**✅ Checklist:**
- [ ] Zero live API calls during demo
- [ ] Map works without internet (cached tiles or inline rendering)
- [ ] Fonts self-hosted (no CDN dependency)
- [ ] All icons/assets self-contained
- [ ] Modals code-split with dynamic imports
- [ ] JSON payloads optimized (minimal precision, compressed)
- [ ] Initial load < 3s on 3G throttle
- [ ] Animations use transforms/opacity only
- [ ] IntersectionObserver pauses off-screen animations
- [ ] Loading skeleton implemented
- [ ] Error boundary with graceful fallback
- [ ] `npm run build` succeeds
- [ ] Lighthouse Performance >= 90
- [ ] CLS < 0.1
- [ ] LCP < 2.5s

---

### PROMPT 11: Video Demo Recording & Pitch Polish

| Field | Value |
|---|---|
| **Prompt Name** | `P11-VIDEO-PITCH-POLISH` |
| **Branch Name** | `feature/video-pitch-polish` |
| **Role** | `[Product Impact & Media Strategist — Redwana Binte Jaman Tonima]` |

**Prompt:**

> You are the Product Impact & Media Strategist for HydroSense-SWOT. Your task is to finalize the demo video scripts, create supporting assets, and prepare the team for recording the remaining submission videos (Video 1 Prescreening is already completed).
>
> **What to build:**
>
> 1. Finalize remaining video scripts in `docs/VIDEO_SCRIPTS.md` (Video 1 Prescreening is already completed):
>    - **Video 2: Local Qualification (240 seconds)** — Live working build demo, slider moment, metrics walkthrough, limitations acknowledgment.
>    - **Video 3: Global Demo (30 seconds)** — Elevator pitch with live demo, one data point, one limitation.
>    - All scripts use ONLY claims verified in `SOURCES.md` with tags.
>    - No marketing adjectives: no "leverage", "seamless", "robust", "transformative", "empower", "harness", "ecosystem".
>    - No NASA Meatball/Worm logo without written permission.
>    - No minors under 18 in any video.
>    - English subtitles mandatory on global video.
>
> 2. Create `ui/app/components/DemoMode.js`:
>    - Auto-play demo mode: slider automatically advances through the April 2026 event.
>    - Speed controls: 1x, 2x, 5x.
>    - Pause on key moments (flag transitions GREEN to AMBER to RED).
>    - Overlay annotations pointing out key features during demo.
>
> 3. Create presentation assets:
>    - Team introduction slide/overlay with roles.
>    - Challenge statement overlay.
>    - "What This Design Does NOT Claim" overlay for honest limitations segment.
>
> 4. Pre-video team alignment:
>    - Create `docs/TEAM_ALIGNMENT.md` — one-pager every team member reads before filming:
>      - What HydroSense does (one paragraph).
>      - What HydroSense does NOT claim (memorize these 6 points).
>      - The one number to remember: ~21 hours lead time.
>      - The one user: Upazila Agriculture Officer, Sunamganj.
>
> 5. **30-second script (final, verbatim):**
>    - 0-5s: "230,000 farmers. One decision. Cut the rice — or wait."
>    - 5-12s: Slider drags. Meghalaya rain pulses. Flag turns RED. "The flood is still ~26 hours away. Our model sees it coming."
>    - 12-20s: Hydrograph. Two lines. Timing arrow. "SWOT's channel data added ~[computed] hours over a rainfall-only alert."
>    - 20-26s: Limits panel on screen. "SWOT cannot see every channel. We say that. Always."
>    - 26-30s: Team name. Challenge title. "For the Haor."

**Description:**  
This prompt prepares everything needed for the remaining video submissions (Video 2 Local Demo & Video 3 Global Demo — Video 1 Prescreening is already completed). The key insight: the video IS the product as far as judges are concerned — most will never visit the GitHub repo. The "signature demo moment" (slider crossing the flood event, flag turning RED before gauge moves) must be rehearsed and polished. Every claim in the video maps to a verified source. The honest limitations segment builds trust with technical judges who know SWOT's constraints.

**✅ Checklist:**
- [ ] Remaining video scripts (Video 2 & Video 3) finalized in VIDEO_SCRIPTS.md
- [ ] All claims verified against SOURCES.md
- [ ] No banned marketing language
- [ ] No NASA logo usage
- [ ] No minors in videos
- [ ] English subtitles planned for global video
- [ ] DemoMode component with auto-play and speed controls
- [ ] Demo pauses on flag transitions
- [ ] Team intro slide created
- [ ] Challenge statement overlay created
- [ ] Limitations overlay created
- [ ] TEAM_ALIGNMENT.md created
- [ ] All team members can recite 6 "Does NOT Claim" points
- [ ] 30-second script timed and verified

---

### PROMPT 12: Documentation & Compliance Audit

| Field | Value |
|---|---|
| **Prompt Name** | `P12-DOCUMENTATION-COMPLIANCE` |
| **Branch Name** | `feature/documentation-compliance` |
| **Role** | `[Technical Quality & Compliance Specialist — Samia Rahman Arpita]` |

**Prompt:**

> You are the Technical Quality & Compliance Specialist for HydroSense-SWOT. Your task is to audit all documentation for completeness, verify all source citations, and ensure full compliance with NASA Space Apps Challenge rules.
>
> **What to build:**
>
> 1. Update `README.md` to match SOLUTION_ARCHITECTURE.md GitHub README Structure:
>    - What it does (one paragraph, plain English)
>    - How to run (5 steps max)
>    - Data sources (with exact short_names and access points)
>    - Scientific results (computed values only, 2dp)
>    - Limitations (link to Limits panel)
>    - License: MIT
>    - Citation: Team AUSTrology, Space Apps 2026
>
> 2. Audit `docs/SOURCES.md`:
>    - Every claim in the video scripts, dashboard, and README has a verified source.
>    - All datasets cited with short_name, version, and access date.
>    - All papers cited with DOI or publication reference.
>    - All code libraries cited with license.
>    - Flag any `[SECONDARY]` or `[OPEN]` items that need primary verification.
>
> 3. Audit `docs/AI_USE_LOG.md`:
>    - Every AI-generated artifact documented (code, text, design).
>    - Tools used, prompts given, outputs modified.
>    - Transparent disclosure per NASA Space Apps rules.
>
> 4. Verify compliance:
>    - [ ] No NASA Meatball/Worm logo in any material
>    - [ ] No minors under 18 in video
>    - [ ] No export-controlled information (ITAR/EAR)
>    - [ ] No commercial promotion
>    - [ ] No PII in submissions
>    - [ ] License file present (MIT)
>    - [ ] All third-party materials cited with licenses
>    - [ ] English used on project page and materials
>    - [ ] Video made/edited by team (no infringing third-party content)
>
> 5. Create `docs/SUBMISSION_CHECKLIST.md`:
>    - Pre-submission checklist covering every requirement.
>    - Video link tested logged out.
>    - GitHub repo is public.
>    - All links functional.

**Description:**  
This prompt ensures all documentation and compliance requirements are met before submission. NASA Space Apps explicitly states they can remove nominations, awards, or winner status for uncited resources. The documentation audit catches missing citations, unverified claims, and compliance violations before they become problems. The submission checklist is the team's final gate before clicking "Submit."

**✅ Checklist:**
- [ ] README.md matches architecture spec structure
- [ ] All 5 "How to run" steps verified on clean checkout
- [ ] SOURCES.md has verified citation for every claim
- [ ] All datasets cited with short_name, version, access date
- [ ] AI_USE_LOG.md is complete and transparent
- [ ] No NASA logo in any material
- [ ] No minors in video
- [ ] License file present
- [ ] All third-party licenses cited
- [ ] SUBMISSION_CHECKLIST.md created
- [ ] Public repo link tested logged out
- [ ] All documentation links functional

---

### PROMPT 13: End-to-End Integration Testing & QA

| Field | Value |
|---|---|
| **Prompt Name** | `P13-INTEGRATION-TESTING` |
| **Branch Name** | `feature/integration-testing` |
| **Role** | `[Technical Quality & Compliance Specialist — Samia Rahman Arpita]` |

**Prompt:**

> You are the Technical Quality & Compliance Specialist for HydroSense-SWOT. Your task is to perform comprehensive end-to-end integration testing and quality assurance before the final submission.
>
> **What to build:**
>
> 1. Create `tests/test_integration.py`:
>    - Test full pipeline: `run_pipeline.py` -> `export_json.py` -> verify all 5 JSON files exist and are valid.
>    - Test JSON schema: ensure each file has expected fields and types.
>    - Test value ranges: NSE in [-inf, 1], KGE in [-inf, 1], PBIAS in [-100, +100], lead_time > 0.
>    - Test data consistency: gauge timestamps within event_timeseries range.
>    - Test: no NaN values in exported JSON.
>    - Test: no `-999999.0` fill values leaked into JSON.
>
> 2. Create `tests/test_ui.js` (or Playwright/Cypress):
>    - Dashboard loads without console errors.
>    - All 5 JSON files load successfully.
>    - Timeline scrubber is interactive.
>    - Language toggle switches all visible text.
>    - Reach click opens inspector modal.
>    - All metric cards display non-zero values.
>    - Limits panel is visible without scrolling (on desktop).
>
> 3. Clean-checkout verification:
>    - Clone repo to a fresh directory.
>    - `pip install -r requirements.txt` succeeds.
>    - `python pipeline/run_pipeline.py` passes.
>    - `python scripts/export_json.py` succeeds.
>    - `cd ui && npm install && npm run build` succeeds.
>    - `npm run dev` launches without errors.
>
> 4. Cross-browser testing:
>    - Chrome, Firefox, Safari (if available).
>    - Mobile viewport simulation (360px, 768px, 1440px).
>
> 5. Security audit:
>    - No credentials in committed files.
>    - `.env` in `.gitignore`.
>    - No API keys exposed in frontend code.
>    - No PII in any data file.

**Description:**  
This prompt is the final quality gate. The clean-checkout test simulates what a judge experiences when they clone the repo — if it doesn't work on first try, the project fails regardless of how good the science is. Integration tests catch data format mismatches between the Python pipeline and the Next.js frontend. The security audit ensures no credentials leak through the public GitHub repository.

**✅ Checklist:**
- [ ] `tests/test_integration.py` passes all assertions
- [ ] JSON schema validation for all 5 data files
- [ ] No NaN or fill values in exported JSON
- [ ] Dashboard loads without console errors
- [ ] All interactive features functional
- [ ] Clean-checkout verification passes (all 6 steps)
- [ ] `npm run build` succeeds (production bundle)
- [ ] Chrome tested
- [ ] Firefox tested
- [ ] Mobile viewport tested (360px)
- [ ] No credentials in committed files
- [ ] `.env` in `.gitignore`
- [ ] No API keys in frontend code
- [ ] All `pytest` tests pass

---

### PROMPT 14: Final Submission & Git Housekeeping

| Field | Value |
|---|---|
| **Prompt Name** | `P14-FINAL-SUBMISSION` |
| **Branch Name** | `main` (merge all feature branches) |
| **Role** | `[Entire Team — All Members]` |

**Prompt:**

> You are the full HydroSense-SWOT team (AUSTrology). Your task is to merge all feature branches, perform final submission preparation, and ensure the public GitHub repository is ready for judges.
>
> **What to do:**
>
> 1. Git merge strategy:
>    ```bash
>    git checkout main
>    git merge feature/swot-data-ingestion
>    git merge feature/imerg-gauge-ingestion
>    git merge feature/manning-calibration-real
>    git merge feature/routing-engine-real
>    git merge feature/scientific-validation
>    git merge feature/dashboard-real-data
>    git merge feature/interactive-map
>    git merge feature/bilingual-localization
>    git merge feature/accessibility-wcag
>    git merge feature/performance-offline
>    git merge feature/video-pitch-polish
>    git merge feature/documentation-compliance
>    git merge feature/integration-testing
>    ```
>    Resolve conflicts if any. Run full test suite after each merge.
>
> 2. Final repo cleanup:
>    - Remove any `TODO`, `FIXME`, `HACK` comments.
>    - Remove debug `console.log` statements.
>    - Ensure `.gitignore` covers: `node_modules/`, `.next/`, `.env`, `__pycache__/`, `*.pyc`, `data/raw/`.
>    - Verify repo size is reasonable (< 100MB).
>
> 3. Final test run:
>    ```bash
>    python -m pytest tests/ -v
>    python pipeline/run_pipeline.py
>    python scripts/export_json.py
>    cd ui && npm run build
>    ```
>    All must pass with zero errors.
>
> 4. Push to public repo:
>    ```bash
>    git push origin main
>    ```
>
> 5. Verify public access:
>    - Open `https://github.com/Mahimrio/Nasa_Hackathon` in incognito browser.
>    - Confirm README renders correctly.
>    - Confirm all documentation links work.
>    - Confirm code is visible and browsable.
>
> 6. Submission page preparation:
>    - Project title: "HydroSense-SWOT"
>    - Team: "AUSTrology"
>    - Challenge: [OPEN — confirm Oct 28]
>    - Demo video link: [hosted link to 30s video]
>    - GitHub link: `https://github.com/Mahimrio/Nasa_Hackathon`
>    - References: all sources from SOURCES.md
>    - Data sources: SWOT L2 HR RiverSP 2.0, GPM IMERG V07, BWDB SW108, SWORD v16, HydroSHEDS v1

**Description:**  
This prompt merges all work into main, performs final cleanup, runs the complete test suite, and prepares the public repository and submission page. The incognito browser test is critical — judges will see the repo exactly as an unauthenticated visitor sees it. This is the last prompt before submission.

**✅ Checklist:**
- [ ] All 13 feature branches merged to main
- [ ] Merge conflicts resolved
- [ ] All tests pass after merge
- [ ] No TODO/FIXME/HACK comments remain
- [ ] No debug console.log statements
- [ ] `.gitignore` covers all generated files
- [ ] Repo size < 100MB
- [ ] `python -m pytest tests/ -v` passes
- [ ] `python pipeline/run_pipeline.py` passes
- [ ] `python scripts/export_json.py` succeeds
- [ ] `npm run build` succeeds
- [ ] Pushed to `main` on GitHub
- [ ] Public repo accessible in incognito browser
- [ ] README renders correctly on GitHub
- [ ] All documentation links work
- [ ] Submission page fields prepared

---

## FINAL MASTER CHECKLIST

Use this checklist to verify that ALL prompts have been correctly implemented before submission.

### Science & Data Layer
- [ ] **P1:** Real SWOT data ingested with all quality gates
- [ ] **P2:** Real IMERG rainfall and BWDB gauge data ingested
- [ ] **P3:** Manning calibration uses real data with time-split discipline
- [ ] **P4:** Muskingum-Cunge routing produces physically consistent results
- [ ] **P5:** Scientific validation metrics computed honestly from real data

### Frontend & Visualization
- [ ] **P6:** Dashboard displays real computed data (no hardcoded values)
- [ ] **P7:** Interactive geographic map with real reach geometries
- [ ] **P8:** Complete bilingual localization (EN + Bangla)
- [ ] **P9:** WCAG AA accessibility compliance
- [ ] **P10:** Offline-first, optimized performance

### Submission & Compliance
- [ ] **P11:** Video 2 & 3 scripts finalized (Video 1 done), demo mode working, team aligned
- [ ] **P12:** All documentation complete, all sources cited, compliance verified
- [ ] **P13:** Integration tests pass, clean-checkout verified, no security issues
- [ ] **P14:** All branches merged, pushed to public repo, submission ready

### Critical Non-Negotiables
- [ ] NSE, KGE, PBIAS are COMPUTED values (never hardcoded)
- [ ] All timestamps are UTC
- [ ] `slope2` used everywhere (never `slope`)
- [ ] Reach IDs stored as strings (never float64)
- [ ] `import netCDF4` before `import xarray`
- [ ] IMERG timestamps shifted back 30 minutes
- [ ] Fill values `-999999.0` replaced with NaN
- [ ] `earthaccess.login()` called ONCE (never in loop)
- [ ] `minimize_scalar` uses `method='bounded'`
- [ ] Demo dates driven from DATA (never hardcoded strings)
- [ ] No NASA Meatball/Worm logo
- [ ] No minors under 18 in videos
- [ ] MIT License committed
- [ ] All third-party materials cited
- [ ] AI use disclosed in AI_USE_LOG.md
- [ ] Working build demo in submission demo videos (no slideshows)

---

> **Remember:** Judges see the VIDEO first, the GitHub repo second, and the project page third. Polish the demo moment. Be honest about limitations. Let the data speak.

---

*Generated for Team AUSTrology — HydroSense-SWOT — NASA Space Apps Challenge 2026*
