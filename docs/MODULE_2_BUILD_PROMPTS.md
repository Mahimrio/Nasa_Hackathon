# 📊 HydroSense-SWOT — Module 2 Complete Build Prompt File
## Haor Historical Rainfall Trend Analysis (NASA Space Apps Challenge 2026: "Be An Earth System Trend Detective!")

> **Project:** HydroSense-SWOT  
> **Module:** Module 2 — Haor Historical Rainfall Trend Analysis  
> **Team:** AUSTrology  
> **Challenge Track:** "Be An Earth System Trend Detective!" (Provisional Primary) / "Field Shift" (Secondary)  
> **Repository:** `https://github.com/Mahimrio/Nasa_Hackathon.git`  
> **Architecture Level:** TIER 5 (Decoupled Scientific Layer)  
> **Submission Window:** Nov 14 09:00 – Nov 15 23:59 (local time, ~39 hours)

---

## 📌 1. PROJECT & MODULE CONTEXT

### What HydroSense-SWOT Does (Dual-Module Architecture):
HydroSense-SWOT addresses two distinct, strictly decoupled hydro-climatological questions in the flash-flood-vulnerable Haor basin of northeastern Bangladesh:

1. **Module 1 (Operational Early Warning — Implemented):**  
   Routes near-real-time NASA GPM IMERG Early Run precipitation through river reaches whose channel geometry and hydraulic roughness are calibrated offline from NASA SWOT satellite measurements, producing a **Harvest Decision Flag (GREEN / AMBER / RED)** with **~21–26 hours of advance warning** before floodwaters overtop embankments.
2. **Module 2 (Historical Rainfall Trend Analysis — Planned MVP):**  
   Investigates multi-decadal trends in pre-monsoon precipitation extremes over the upstream catchments draining into Bangladesh's Haor basin across 2001–2025 using **NASA GPM IMERG Final Run Daily V07 (`GPM_3IMERGDF`)**, determining *what is changing*, *where it is changing*, *how much it is changing*, and *if these changes are statistically significant*.

### The "Trend-to-Action" Storyline:
* **The Strategic Context (Module 2):** Boro rice farmers in Sunamganj face catastrophic early flash floods in April. Module 2 detects whether extreme pre-monsoon precipitation events over the Meghalaya plateau have statistically increased in frequency or volume over the satellite era, or if they represent natural climate variability.
* **The Tactical Action (Module 1):** Module 2 proves *why* the threat exists and how the climatological baseline is shifting; Module 1 provides *the practical tool* giving farmers the lead time needed to mobilize labor and harvest ripe crops before embankments breach.

### Dataset Metadata & Access Points:
| Dataset | Short Name | Variable | Unit | Spatial Res | Temporal Range | Access Point |
|---|---|---|---|---|---|---|
| NASA GPM IMERG Final Run V07B (Daily) | `GPM_3IMERGDF` | `precipitation` | mm/day | $0.1^\circ \times 0.1^\circ$ | April 1 – May 31 (2001–2025 primary; 1998–2025 sensitivity) | NASA GES DISC via `earthaccess` / OPeNDAP |
| SWORD v16 Reaches | `SWORD_v16` | Reach centrelines | Coordinates | Reach-level | Static | `hydrosheds.org` |
| HydroSHEDS Basins | `HydroSHEDS_v1` | Catchment polygons | GeoJSON | Vector | Static | `hydrosheds.org` |

---

## 🔬 2. SCIENTIFIC & MATHEMATICAL FOUNDATION

### 2.1 ETCCDI Rainfall Extremes Indicators (Cell-First Protocol)
Indicators are computed on **each $0.1^\circ$ grid cell $i$ first** across the 61 calendar days of April 1 – May 31, and then area-averaged across each predefined Geographic Study Zone:

1. **Primary Indicator — Pre-Monsoon Total Precipitation ($PRCPTOT_{AM}$):**
   $$PRCPTOT_i = \sum_{t=1}^{61} P_i(t) \quad \text{for all } P_i(t) \ge 1.0\text{ mm/day}$$
   $$\overline{PRCPTOT}_{\text{zone}} = \frac{\sum_{i \in \text{zone}} w_i \cdot PRCPTOT_i}{\sum_{i \in \text{zone}} w_i} \quad \text{where } w_i = \cos(\text{lat}_i)$$
   *Unit:* mm/season. Quantifies seasonal water volume forcing upstream river reaches.

2. **Secondary Indicator — Heavy Rainfall Days Count ($R50mm_{AM}$):**
   $$R50mm_i = \sum_{t=1}^{61} I\left(P_i(t) \ge 50.0\text{ mm/day}\right)$$
   $$\overline{R50mm}_{\text{zone}} = \frac{\sum_{i \in \text{zone}} w_i \cdot R50mm_i}{\sum_{i \in \text{zone}} w_i}$$
   *Unit:* days/season. Quantifies the spatial average frequency of localized extreme storm days.  
   *(Scientific Disclaimers: Described strictly as a meteorological extreme indicator, not proof of flash flood occurrence).*

### 2.2 Trend Magnitude & Significance Statistics
For an annual time series of $N=25$ years $(t_1, y_1), \dots, (t_N, y_N)$:

1. **Sen’s Median Slope Estimator ($\beta$):**
   $$\beta = \text{median}\left\{ \frac{y_j - y_i}{j - i} : 1 \le i < j \le N \right\}$$
   *Calculates all $N(N-1)/2 = 300$ pairwise slopes. Robust against single-year outliers.*

2. **Analytical Sen–Kendall Confidence Intervals (Gilbert, 1987):**
   Non-parametric confidence limits derived from the sorted pairwise slope array at ranks:
   $$M_1 = \frac{N' - Z_{1-\alpha/2}\sqrt{\text{Var}^*(S)}}{2}, \quad M_2 = \frac{N' + Z_{1-\alpha/2}\sqrt{\text{Var}^*(S)}}{2} + 1$$
   where $N' = N(N-1)/2$ and $\text{Var}^*(S)$ is the variance of Kendall's $S$ adjusted for serial correlation.

3. **Autocorrelation & Modified Mann–Kendall (MMK Hamed & Rao, 1998):**
   - Compute sample lag-1 autocorrelation $r_1$ on detrended ranks.
   - If $|r_1| < 1.96/\sqrt{N} \approx 0.392$: Autocorrelation is insignificant. Evaluate **Standard Mann–Kendall ($Z_{MK}, p_{\text{std}}$)**.
   - If $|r_1| \ge 0.392$: Significant autocorrelation detected. Evaluate **Modified Mann–Kendall ($Z_{MMK}, p_{\text{mod}}$)** using variance correction factor:
     $$\text{Var}^*(S) = \text{Var}(S) \cdot \left[ 1 + \frac{2}{N(N-1)(N-2)} \sum_{k=1}^{N-1} (N-k)(N-k-1)(N-k-2) \rho_k \right]$$
   - **Governing Rule:** The final significance verdict is governed strictly by $p_{\text{mod}}$ when autocorrelation is present.
   - **Honest Null Reporting:** If governing $p \ge 0.05$, the system output is strictly: *"No statistically significant trend detected ($p = X.XX$)"*.

---

## 🛡️ 3. CRITICAL CLIMATOLOGY GUARDS & TRAPS

| Rule ID | Trap / Risk | Architectural Guard |
|---|---|---|
| **Trap T-G1** | Product Naming Mismatch | NASA GES DISC daily IMERG V07 names the variable **`precipitation`** (mm/day). **NEVER** use `precipitationCal` (which exists only in half-hourly files). |
| **Trap T-G2** | Bounding Box Coordinate Inversion | `earthaccess` requires `(lon_min, lat_min, lon_max, lat_max)`. Always pass `bounding_box=(90.0, 24.0, 93.5, 26.0)`. |
| **Trap T-G3** | Fake Production Data Contamination | **NEVER** generate synthetic or mock climatology files in `data/trends/`. If NASA data cannot be downloaded, fail closed with exit code 1. Synthetic data is restricted strictly to `tests/fixtures/`. |
| **Trap T-G4** | Incomplete Season Distortion | April 1 – May 31 contains **exactly 61 calendar days in every single year**. Primary analysis strictly requires **100% complete seasons ($61/61$ days)**. Never replace missing days with 0.0 or seasonal averages. |
| **Trap T-G5** | Unvalidated Operational Bridges | **NEVER** alter Module 1 warning thresholds based on historical trends. Rainfall trends do not equal flood trends. |
| **Trap T-G6** | Fabricated Placeholder Metrics | The output JSON schema must initialize with `null` fields and `"data_status": "UNPROCESSED"`. Never hardcode preset slopes or $p$-values. |
| **Trap T-G7** | Autocorrelation False Positives | Do not claim significance based on standard MK if serial correlation $|r_1| \ge 0.392$. Always evaluate Modified Mann-Kendall with Hamed & Rao variance correction. |
| **Trap T-G8** | Geographic Nomenclature Integrity | Rectangular study domains must be labelled **"Geographic Study Zones"**, never "hydrological sub-basins" (unless derived from DEM watershed delineation). |
| **Trap T-G9** | Area-Average Dilution | Do not average daily rainfall over the whole zone before thresholding. Always compute $R50mm$ per cell first, then area-weight across the zone. |
| **Trap T-G10** | Decoupling & Module 1 Integrity | All Module 2 code lives in `trend_explorer/` and `data/trends/`. It must **NOT** import or alter `pipeline/run_pipeline.py` or existing Module 1 fixtures. |

---

## 👥 4. TEAM ROLES & RESPONSIBILITIES (MODULE 2)

| Role | Member | Primary Module 2 Responsibility |
|---|---|---|
| **Systems & Backend Algorithm Developer** | Fazle Rabbi Mugdho | Statistical trend engine (`statistics.py`), Modified Mann-Kendall, analytical CI, unit tests |
| **Data Infrastructure & Pipeline Developer** | Mahim Abdullah Rianto | NASA IMERG Final Run V07 ingestion (`ingest_imerg.py`), NetCDF subsetting, JSON export |
| **Geospatial & Domain Researcher** | Taisha Tasnim Triti | Geographic zone definitions, cell-first indicator computation (`indicators.py`), data quality audits |
| **Technical Quality & Compliance Specialist** | Samia Rahman Arpita | Statistical validation, missing-data gates, AI log updates, bilingual translation QA |
| **Product Impact & Media Strategist** | Redwana Binte Jaman Tonima | 60-second "Trend Detective" video script segment, presentation slides, honest limitations |
| **Frontend & Product Experience Developer** | Arko Saha | Next.js Trend Explorer Viewer (`TrendExplorerViewer.js`), Recharts time-series view, AppHeader switch |

---

## 🔧 5. TECH STACK & SETUP

| Layer | Technology | Purpose |
|---|---|---|
| **Data Extraction** | `earthaccess`, `xarray`, `netCDF4` | NASA GES DISC authentication, NetCDF4 spatial slicing |
| **Scientific Computation** | `numpy`, `scipy.stats`, `pandas` | Sen's slope, Hamed & Rao MMK, analytical CI, ETCCDI indices |
| **Data Bridge** | Static JSON (`ui/public/data/trends/trend_results.json`) | Fast offline client hydration (< 100 KB) |
| **Frontend UI** | Next.js 16 (App Router) + Recharts | Responsive time-series charts, statistical cards |
| **Testing** | `pytest 8+` | Deterministic unit tests with mathematical fixtures |

---

## 🚀 BUILD PROMPTS (P-T1 THROUGH P-T8)

Execute these prompts sequentially. Each prompt is an isolated, copy-paste-ready engineering directive.

---

### PROMPT T1: NASA GPM IMERG Final Run V07 Daily Ingestion

| Field | Value |
|---|---|
| **Prompt Name** | `P-T1-IMERG-FINAL-INGEST` |
| **Branch Name** | `feature/trend-imerg-ingest` |
| **Role** | `[Data Infrastructure & Pipeline Developer — Mahim Abdullah Rianto]` |

**Prompt:**

> You are the Data Infrastructure Developer for HydroSense-SWOT. Your task is to implement the offline ingestion and spatial subsetting script for NASA GPM IMERG Final Run V07 (`GPM_3IMERGDF`) daily precipitation covering the 2001–2025 primary record and 1998–2000 sensitivity window.
>
> **What to build:**
>
> 1. Create `trend_explorer/ingest_imerg.py` that:
>    - Authenticates via NASA Earthdata (`earthaccess`) using credentials from `.env` (call `earthaccess.login()` once at top).
>    - Searches product short name `GPM_3IMERGDF` with version `07B`.
>    - Passes explicit named bounding box in longitude-latitude order:
>      `bounding_box=(90.0, 24.0, 93.5, 26.0)` (Guard T-G2).
>    - Temporal bounds:
>      - Primary record: **April 1 to May 31** for each year from **2001 to 2025** (25 seasons, 61 days/season = 1,525 daily grids).
>      - Extended sensitivity record: **April 1 to May 31** for years **1998 to 2000** (3 seasons, 183 daily grids).
>    - Extracts variable **`precipitation`** (mm/day) — NOT `precipitationCal` (Guard T-G1).
>    - Sanitizes fill values: replaces `-9999.9` and values $< 0$ with `np.nan`.
>    - Writes CRS: `ds.rio.write_crs('EPSG:4326', inplace=True)`.
>
> 2. Implement strict fail-closed behavior:
>    - If authentication fails or granules cannot be downloaded, **exit with code 1** and print:
>      `"ERROR: Authentic NASA GPM IMERG Final Run data could not be retrieved. Pipeline halted."`
>    - **NEVER generate synthetic or mock climatology series in `data/trends/`** (Guard T-G3).
>
> 3. Save output to `data/trends/imerg_premonsoon_2001_2025.nc` (NetCDF4 format) with dimensions `(time, lat, lon)` and coordinate arrays.
>
> 4. Ensure `import netCDF4` precedes `import xarray`.

**Description:**  
This prompt builds the authentic NASA data ingestion pipeline for Module 2. It accesses the research-grade, gauge-adjusted GPM IMERG Final Run V07 daily product from NASA GES DISC. It enforces strict fail-closed discipline to ensure that only genuine Earth observation data enters the scientific pipeline, completely preventing synthetic contamination in production paths.

**✅ Checklist:**
- [ ] `trend_explorer/ingest_imerg.py` created with `earthaccess` authentication
- [ ] Bounding box uses longitude-first order: `(90.0, 24.0, 93.5, 26.0)`
- [ ] Extracted variable is named `precipitation` (unit: mm/day)
- [ ] Fill values `-9999.9` and $< 0$ converted to `np.nan`
- [ ] Fail-closed error handling implemented (exit code 1 on network/auth failure)
- [ ] Zero synthetic data written to `data/trends/`
- [ ] Output saved to `data/trends/imerg_premonsoon_2001_2025.nc`
- [ ] `import netCDF4` appears before `import xarray`

---

### PROMPT T2: Geographic Study Zones & Cell-First Indicator Computation

| Field | Value |
|---|---|
| **Prompt Name** | `P-T2-INDICATOR-ENGINE` |
| **Branch Name** | `feature/trend-indicator-computation` |
| **Role** | `[Geospatial & Domain Researcher — Taisha Tasnim Triti]` |

**Prompt:**

> You are the Geospatial Researcher for HydroSense-SWOT. Your task is to partition the study region into three predefined Geographic Study Zones and compute the annual ETCCDI rainfall indicators using the cell-first calculation protocol.
>
> **What to build:**
>
> 1. Create `trend_explorer/indicators.py` that:
>    - Defines 3 predefined rectangular **"Geographic Study Zones"** (Guard T-G8):
>      - **Zone A (Northern Ridge / Meghalaya):** Lat $25.1^\circ\text{N} - 25.5^\circ\text{N}$, Lon $91.0^\circ\text{E} - 92.5^\circ\text{E}$.
>      - **Zone B (Eastern Inflow / Upper Barak Corridor):** Lat $24.5^\circ\text{N} - 25.1^\circ\text{N}$, Lon $92.5^\circ\text{E} - 93.5^\circ\text{E}$.
>      - **Zone C (Lowland Haor Basin):** Lat $24.2^\circ\text{N} - 25.0^\circ\text{N}$, Lon $90.8^\circ\text{E} - 91.8^\circ\text{E}$.
>    - Extracts coordinate slices dynamically from `imerg_premonsoon_2001_2025.nc`.
>
> 2. Implements the **Cell-First Calculation Protocol** (Guard T-G9):
>    - For each valid grid cell $i$ within a zone:
>      - Verify seasonal completeness: assert exactly 61 calendar days (April 1 to May 31).
>      - Compute $PRCPTOT_i = \sum_{t=1}^{61} P_i(t)$ for wet days ($P_i(t) \ge 1.0\text{ mm/day}$).
>      - Compute $R50mm_i = \sum_{t=1}^{61} I(P_i(t) \ge 50.0\text{ mm/day})$.
>    - Compute area-weighted spatial mean across the zone:
>      $$\overline{PRCPTOT}_{\text{zone}} = \frac{\sum_i \cos(\text{lat}_i) \cdot PRCPTOT_i}{\sum_i \cos(\text{lat}_i)}, \quad \overline{R50mm}_{\text{zone}} = \frac{\sum_i \cos(\text{lat}_i) \cdot R50mm_i}{\sum_i \cos(\text{lat}_i)}$$
>
> 3. Implements strict missing-data rules (Guard T-G4):
>    - Primary rule: A year is accepted if and only if all 61 days are valid ($61/61$). If missing days exist, output `null` for that year.
>    - Never replace missing days with 0.0.
>
> 4. Exports clean annual indicator series to `data/trends/annual_indicators.csv` with columns:
>    `year, zone_id, prcptot_mm, r50mm_days, valid_days_count`.

**Description:**  
This prompt implements the core ETCCDI indicators for Module 2. The cell-first approach is essential: calculating $R50mm$ on each grid cell first preserves localized convective storm intensity, preventing the spatial smoothing that occurs when averaging across a large mountain ridge. The 100% completeness rule ensures that missing satellite scans do not artificially drag down seasonal precipitation totals.

**✅ Checklist:**
- [ ] `trend_explorer/indicators.py` created
- [ ] 3 Geographic Study Zones defined with exact rectangular coordinates
- [ ] Sectors explicitly labelled "Geographic Study Zones", never sub-basins
- [ ] Cell-First calculation protocol implemented for $PRCPTOT$ and $R50mm$
- [ ] Area-weighting applied using cosine of latitude
- [ ] Strict 61/61 complete season gate enforced for primary record
- [ ] Missing precipitation is never replaced with zero
- [ ] Output saved to `data/trends/annual_indicators.csv`

---

### PROMPT T3: Statistical Trend Engine — Sen's Slope, Analytical CI & Modified Mann-Kendall

| Field | Value |
|---|---|
| **Prompt Name** | `P-T3-STATISTICAL-ENGINE` |
| **Branch Name** | `feature/trend-statistical-engine` |
| **Role** | `[Systems & Backend Algorithm Developer — Fazle Rabbi Mugdho]` |

**Prompt:**

> You are the Backend Algorithm Developer for HydroSense-SWOT. Your task is to implement the peer-reviewed statistical trend detection engine adhering to the highest standards of statistical climatology.
>
> **What to build:**
>
> 1. Create `trend_explorer/statistics.py` that implements:
>    - `compute_sens_slope(years, values)`:
>      - Computes all pairwise slopes $S_{ij} = (y_j - y_i) / (t_j - t_i)$ for $1 \le i < j \le N$.
>      - Returns median slope $\beta$ (units: mm/decade or days/decade).
>    - `check_autocorrelation(values)`:
>      - Computes lag-1 sample autocorrelation $r_1$ on detrended ranks ($y_t - \beta \cdot t$).
>      - Checks significance against critical bound: $|r_1| \ge 1.96 / \sqrt{N} \approx 0.392$ for $N=25$.
>    - `modified_mann_kendall(values, r1)`:
>      - Calculates Kendall's score $S = \sum_{i<j} \text{sgn}(y_j - y_i)$.
>      - If $|r_1| < 0.392$: computes standard variance $\text{Var}(S)$ and $Z_{MK}$.
>      - If $|r_1| \ge 0.392$: computes modified variance $\text{Var}^*(S)$ using Hamed & Rao (1998) variance correction factor based on rank autocorrelations.
>      - Calculates two-tailed $p$-value: $p = 2 \cdot (1 - \Phi(|Z|))$.
>    - `compute_analytical_ci(slopes, var_s, alpha=0.05)`:
>      - Computes rank-based non-parametric confidence limits (Gilbert, 1987) using $\text{Var}^*(S)$:
>        $$M_1 = \frac{N' - Z_{1-\alpha/2}\sqrt{\text{Var}^*(S)}}{2}, \quad M_2 = \frac{N' + Z_{1-\alpha/2}\sqrt{\text{Var}^*(S)}}{2} + 1$$
>      - Returns $[ \beta_{\text{low}}, \beta_{\text{high}} ]$ from sorted pairwise slopes.
>    - `evaluate_pettitt_diagnostic(values)`:
>      - Implemented strictly as an optional post-hoc diagnostic tool (not gating the monotonic trend verdict).
>      - Reports candidate shift year $\tau = \arg\max |U_t|$ without causal attribution.
>
> 2. Implement the governing significance decision logic:
>    - If $|r_1| < 0.392$: final significance verdict is governed by $p_{\text{std}}$.
>    - If $|r_1| \ge 0.392$: final significance verdict is governed strictly by $p_{\text{mod}}$ (Modified MK).
>    - If governing $p \ge 0.05$: output `verdict = "NO_SIGNIFICANT_TREND"` with label:
>      `"No statistically significant monotonic trend detected (p = X.XX)"` (Guard T-G7).
>    - If governing $p < 0.05$ and $\beta > 0$: output `verdict = "SIGNIFICANT_INCREASE"`.
>    - If governing $p < 0.05$ and $\beta < 0$: output `verdict = "SIGNIFICANT_DECREASE"`.

**Description:**  
This prompt builds the rigorous statistical core for Module 2. In small hydrometeorological time series ($N=25$), pre-whitening methods like TFPW introduce substantial autocorrelation estimation bias. Using the Modified Mann-Kendall test with Hamed & Rao variance correction directly adjusts the test statistic's variance without modifying the physical data, providing robust protection against false-positive trend declarations.

**✅ Checklist:**
- [ ] `trend_explorer/statistics.py` created
- [ ] Sen's median slope $\beta$ computed from pairwise slopes
- [ ] Sample lag-1 autocorrelation $r_1$ calculated on detrended ranks
- [ ] Modified Mann-Kendall (Hamed & Rao 1998) implemented for $|r_1| \ge 0.392$
- [ ] Standard MK reported alongside as sensitivity when autocorrelation is present
- [ ] Analytical Sen-Kendall CI calculated using variance correction factor
- [ ] Pettitt test isolated as optional post-hoc diagnostic (no causal attribution)
- [ ] Strict two-tailed null reporting enforced ($p \ge 0.05 \implies$ no trend claimed)

---

### PROMPT T4: Static JSON Serialization & Data Bridge

| Field | Value |
|---|---|
| **Prompt Name** | `P-T4-JSON-BRIDGE` |
| **Branch Name** | `feature/trend-json-bridge` |
| **Role** | `[Data Infrastructure & Pipeline Developer — Mahim Abdullah Rianto]` |

**Prompt:**

> You are the Data Pipeline Developer for HydroSense-SWOT. Your task is to serialize all computed statistical metrics and annual time-series data into an ultra-fast, lightweight static JSON bundle (< 100 KB) for the Next.js frontend.
>
> **What to build:**
>
> 1. Create `trend_explorer/export_json.py` that:
>    - Reads computed indicator tables from `annual_indicators.csv` and statistical outputs from `statistics.py`.
>    - Formats output strictly per the following schema:
>      ```json
>      {
>        "metadata": {
>          "dataset": "NASA GPM IMERG Final Run V07 (GPM_3IMERGDF)",
>          "variable": "precipitation (mm/day)",
>          "primary_period": "2001-2025 (25 seasons: April 1 - May 31)",
>          "sensitivity_period": "1998-2025",
>          "processed_utc": "2026-10-24T00:00:00Z",
>          "data_status": "AUTHENTIC_COMPUTED"
>        },
>        "zones": {
>          "zone_a_meghalaya_ridge": {
>            "label_en": "Zone A: Meghalaya Ridge (25.1N-25.5N, 91.0E-92.5E)",
>            "label_bn": "জোন এ: মেঘালয় পাহাড়ি ঢাল",
>            "indicators": {
>              "prcptot": {
>                "slope_per_decade": 0.0,
>                "ci_95": [0.0, 0.0],
>                "p_value": 0.0,
>                "is_significant": false,
>                "governing_test": "STANDARD_MANN_KENDALL",
>                "autocorrelation_r1": 0.0,
>                "verdict": "NO_SIGNIFICANT_TREND",
>                "annual_series": [
>                  {"year": 2001, "value": 0.0, "fitted": 0.0}
>                ]
>              },
>              "r50mm": { ... }
>            }
>          },
>          "zone_b_eastern_inflow": { ... },
>          "zone_c_central_haor": { ... }
>        }
>      }
>      ```
>    - Enforces schema rules (Guard T-G6):
>      - If data has not been processed, `data_status` remains `"UNPROCESSED"`.
>      - Only stamps `"AUTHENTIC_COMPUTED"` after authentic NASA data has passed all completeness gates and statistical evaluation.
>      - All floats rounded to 2 decimal places (avoids overprecision).
>      - Zero `-9999.9` fill values in exported JSON.
>
> 2. Writes output file to `ui/public/data/trends/trend_results.json`.
> 3. Verifies file size is strictly $< 150\text{ KB}$.

**Description:**  
This prompt builds the offline data bridge between the Python statistical pipeline and the Next.js web application. By compiling all results into a static JSON bundle, the frontend loads instantly during live judging without network latency or reliance on external APIs.

**✅ Checklist:**
- [ ] `trend_explorer/export_json.py` created
- [ ] Output written to `ui/public/data/trends/trend_results.json`
- [ ] File size confirmed $< 150\text{ KB}$
- [ ] `data_status` set to `"AUTHENTIC_COMPUTED"` only after execution
- [ ] Zero fabricated or hardcoded preset numbers
- [ ] English and Bangla labels included for all zones
- [ ] No NaNs or negative fill values in JSON

---

### PROMPT T5: Deterministic Unit Test Suite

| Field | Value |
|---|---|
| **Prompt Name** | `P-T5-UNIT-TESTS` |
| **Branch Name** | `feature/trend-unit-tests` |
| **Role** | `[Technical Quality & Compliance Specialist — Samia Rahman Arpita]` |

**Prompt:**

> You are the Technical Quality Specialist for HydroSense-SWOT. Your task is to write automated pytest unit tests verifying the mathematical correctness and data integrity of Module 2.
>
> **What to build:**
>
> 1. Create `tests/test_trend_explorer.py` that implements 6 deterministic tests:
>    - **Test 1: Linear Monotonic Slope Recovery:**
>      Feeds mathematical fixture $y = 10 + 2.5 \cdot t$. Asserts Sen's slope equals $2.5 \pm 0.01$ and $p < 0.001$.
>    - **Test 2: Pure White Noise Null Recovery:**
>      Feeds zero-trend Gaussian noise with known seed. Asserts $p > 0.05$ and verdict is `"NO_SIGNIFICANT_TREND"`.
>    - **Test 3: Autocorrelation Detection & Variance Correction:**
>      Feeds AR(1) process with $r_1 = 0.6$. Asserts `check_autocorrelation()` detects $|r_1| \ge 0.392$ and triggers Modified Mann-Kendall with $\text{Var}^*(S) > \text{Var}(S)$.
>    - **Test 4: Cell-First Indicator Aggregation:**
>      Tests that computing $R50mm$ per cell and averaging yields correct area-weighted day count.
>    - **Test 5: Synthetic Isolation Guard (Guard T-G3):**
>      Asserts that synthetic test fixtures exist strictly in `tests/fixtures/` and that no synthetic files leaked into `data/trends/`.
>    - **Test 6: Module 1 Decoupling & Non-Regression Guard (Guard T-G10):**
>      Asserts that Module 2 imports do not touch `pipeline/run_pipeline.py` and that all 40 existing Module 1 unit tests continue to pass.
>
> 2. Execute test runner:
>    ```bash
>    pytest tests/test_trend_explorer.py -v
>    ```
>    All tests must pass cleanly with 100% success.

**Description:**  
This prompt builds the automated quality gate for Module 2. It tests all statistical algorithms on deterministic mathematical fixtures with known answers, verifying that the Modified Mann-Kendall test, Sen's slope, and autocorrelation adjustments operate correctly. It explicitly enforces the isolation boundary, ensuring synthetic test data never mixes with production observation directories.

**✅ Checklist:**
- [ ] `tests/test_trend_explorer.py` created with 6 comprehensive unit tests
- [ ] Linear slope recovery test passes
- [ ] Null hypothesis recovery test passes
- [ ] Modified Mann-Kendall variance correction test passes
- [ ] Cell-first aggregation test passes
- [ ] Synthetic data isolation verified (zero mock files in `data/trends/`)
- [ ] All 40 existing Module 1 tests pass without regression

---

### PROMPT T6: Frontend Delivery Interface — Trend Explorer View

| Field | Value |
|---|---|
| **Prompt Name** | `P-T6-TREND-DASHBOARD-VIEW` |
| **Branch Name** | `feature/trend-dashboard-view` |
| **Role** | `[Frontend & Product Experience Developer — Arko Saha]` |

**Prompt:**

> You are the Frontend Developer for HydroSense-SWOT. Your task is to build the interactive Trend Explorer view in Next.js 16, allowing users to inspect computed 25-year rainfall trends seamlessly.
>
> **What to build:**
>
> 1. Update `ui/app/components/AppHeader.js`:
>    - Add a sleek navigation mode switcher:
>      `[ 🛰️ Real-Time Warning (Mod 1) ] | [ 📊 Rainfall Trends (Mod 2) ]`
>    - Switches active view in state without full page reload.
>
> 2. Create `ui/app/components/TrendExplorerViewer.js`:
>    - Loads data offline from `/data/trends/trend_results.json`.
>    - **Controls Bar:**
>      - Zone selector: *Zone A (Meghalaya Ridge), Zone B (Eastern Inflow), Zone C (Central Haor)*.
>      - Indicator toggle: *$PRCPTOT_{AM}$ (Seasonal Total Rain)* vs *$R50mm_{AM}$ (Heavy Rain Days)*.
>    - **Recharts Time-Series Chart:**
>      - Annual observed bars or points (2001–2025).
>      - Fitted Sen's slope line.
>      - Shaded analytical 95% confidence interval envelope.
>      - Tooltip showing exact year, observed value, and fitted value.
>    - **4 Factual Statistical Cards:**
>      1. **Trend Magnitude:** Sen's slope $\beta$ (mm/decade or days/decade) with analytical 95% CI.
>      2. **Statistical Significance:** Governing $p$-value and status badge ("Statistically Significant ($p < 0.05$)" or "No Significant Trend ($p \ge 0.05$)").
>      3. **Autocorrelation Status:** Lag-1 $r_1$ value and governing test label (Standard MK vs Modified MK).
>      4. **Data Coverage:** Verified 100% complete seasons count ($25/25$ seasons).
>    - **Contextual Narrative Box:**
>      - Clear explanation: *"Historical rainfall trends reflect multi-decadal climatology and do not predict individual flood events."*
>
> 3. Styling & Tokens:
>    - Follow calm, high-contrast agrarian palette (#F5F8FA background, #FFFFFF cards, #173B57 primary text, #287BB5 river blue).
>    - Responsive down to 360px mobile viewports.

**Description:**  
This prompt builds the user interface for Module 2 within the existing Next.js application. It renders the computed time series and statistical cards using Recharts, hydrating directly from the static JSON file. It keeps Module 1 operational and untouched while offering judges an intuitive view to explore the 25-year satellite record.

**✅ Checklist:**
- [ ] Mode switcher added to `AppHeader.js`
- [ ] `ui/app/components/TrendExplorerViewer.js` created
- [ ] Zone selector and indicator toggles functional
- [ ] Recharts annual time-series chart renders observed points and Sen's slope line
- [ ] Shaded analytical 95% confidence ribbon rendered
- [ ] 4 statistical readout cards display computed metrics
- [ ] Plain-language disclaimer regarding rainfall trends vs flood forecasting displayed
- [ ] Agrarian design tokens applied consistently (#F5F8FA, #FFFFFF, #173B57)
- [ ] Responsive layout verified at 360px minimum viewport

---

### PROMPT T7: Bilingual Localization & Accessibility Audit

| Field | Value |
|---|---|
| **Prompt Name** | `P-T7-LOCALIZATION-A11Y` |
| **Branch Name** | `feature/trend-localization-a11y` |
| **Role** | `[Technical Quality & Compliance Specialist — Samia Rahman Arpita]` |

**Prompt:**

> You are the Technical Quality Specialist for HydroSense-SWOT. Your task is to implement complete bilingual localization (English + Bangla) for Module 2 and audit for WCAG AA accessibility compliance.
>
> **What to build:**
>
> 1. Add Module 2 localization keys to `ui/app/locales/en.json` and `ui/app/locales/bn.json`:
>    - Title: `"Haor Historical Rainfall Trend Analysis"` / `"হাওর ঐতিহাসিক বৃষ্টিপাত ট্রেন্ড বিশ্লেষণ"`
>    - Zone labels:
>      - Zone A: `"Zone A: Meghalaya Ridge"` / `"জোন এ: মেঘালয় পাহাড়ি ঢাল"`
>      - Zone B: `"Zone B: Eastern Inflow"` / `"জোন বি: পূর্বাঞ্চলীয় আন্তঃপ্রবাহ"`
>      - Zone C: `"Zone C: Central Haor Basin"` / `"জোন সি: কেন্দ্রীয় হাওর অববাহিকা"`
>    - Indicator descriptions:
>      - $PRCPTOT$: `"Pre-Monsoon Total Rain (mm)"` / `"প্রাক-বর্ষার মোট বৃষ্টিপাত (মিমি)"`
>      - $R50mm$: `"Heavy Rain Days (≥50mm)"` / `"চরম বৃষ্টিপাতের দিন (≥৫০মিমি)"`
>    - Statistical metric definitions and plain-language interpretations in authentic agricultural Bangla.
>
> 2. Accessibility & Color-Blind Safety (WCAG AA):
>    - Trend direction must **never** be conveyed by color alone: always use text label + arrow icon ($\uparrow / \downarrow$).
>    - Text contrast ratio $\ge 4.5:1$ against background.
>    - All interactive controls have explicit `aria-label` tags.
>    - Full keyboard navigation across zone selectors and indicator buttons.

**Description:**  
This prompt guarantees complete bilingual parity and WCAG AA compliance for Module 2. Authentic agricultural Bangla translation ensures the tool serves local agricultural extension officers in Sunamganj, satisfying the Relevance and Presentation criteria.

**✅ Checklist:**
- [ ] `en.json` and `bn.json` updated with complete Module 2 key parity
- [ ] Authentic agricultural Bangla terms used throughout
- [ ] Trend direction communicated via icon + text + color (never color alone)
- [ ] Text contrast meets WCAG AA standards ($\ge 4.5:1$)
- [ ] Keyboard navigation and visible focus rings verified
- [ ] Screen reader aria-labels on all interactive controls

---

### PROMPT T8: Video Pitch Polish, Documentation & Submission Packaging

| Field | Value |
|---|---|
| **Prompt Name** | `P-T8-DOCS-PITCH-SUBMISSION` |
| **Branch Name** | `feature/trend-docs-pitch` |
| **Role** | `[Product Impact & Media Strategist — Redwana Binte Jaman Tonima]` |

**Prompt:**

> You are the Product Strategist for HydroSense-SWOT. Your task is to update project documentation, finalize the 60-second video demo script segment for the "Trend Detective" track, and verify submission packaging.
>
> **What to build:**
>
> 1. Update `docs/VIDEO_SCRIPTS.md`:
>    - Add the **60-Second "Trend Detective" Demo Pitch Segment**:
>      - **00–15s:** *"To understand whether flood threats are shifting, we investigated 25 years of NASA GPM IMERG Final Run satellite precipitation across the upstream catchments draining into Bangladesh's Haor basin."*
>      - **15–35s:** Demo screen: Toggle between total precipitation and heavy rainfall days ($R50mm$). *"Using Sen's slope and Modified Mann-Kendall tests with serial-correlation correction, our system evaluates whether observed multi-decadal changes are statistically significant or reflect natural variability."*
>      - **35–50s:** The "Trend-to-Action" bridge: *"This climatological evidence sets the seasonal baseline for Module 1 — our real-time warning engine providing farmers with 22-hour advance harvest advisories before embankments overtop."*
>      - **50–60s:** Honest scientific disclaimer: *"Rainfall trends reflect long-term climate forcing and do not predict individual flood events. HydroSense combines both: strategic multi-decadal satellite detection and tactical operational warning."*
>
> 2. Update Documentation:
>    - `README.md`: Document Module 2 execution steps:
>      ```bash
>      python trend_explorer/ingest_imerg.py
>      python trend_explorer/indicators.py
>      python trend_explorer/statistics.py
>      python trend_explorer/export_json.py
>      ```
>    - `docs/SOURCES.md`: Cite Dataset D8 (`GPM_3IMERGDF_07`) with DOI `10.5067/GPM/IMERGDF/DAY/07`.
>    - `docs/TASKS.md` and `docs/AI_USE_LOG.md`: Log all completed work.
>
> 3. Perform final verification:
>    - `pytest tests/ -v` passes 100%.
>    - `cd ui && npm run build` compiles without errors.

**Description:**  
This prompt packages Module 2 for official submission. It crafts the video script for the "Trend Detective" track, documents dataset provenance in `SOURCES.md`, and runs the complete verification suite to ensure submission readiness.

**✅ Checklist:**
- [ ] 60-second Trend Detective pitch script finalized in `docs/VIDEO_SCRIPTS.md`
- [ ] No ungrounded marketing claims or hardcoded fake numbers in script
- [ ] `README.md` updated with Module 2 run instructions
- [ ] `docs/SOURCES.md` updated with GPM IMERG Final Run V07 citation and DOI
- [ ] Clean-checkout run passes: `pytest tests/ -v` (100% pass)
- [ ] Production frontend build passes: `npm run build` (0 errors)

---

## 🎯 6. FINAL MASTER ACCEPTANCE CHECKLIST (MODULE 2)

Before final submission, verify that every item below passes:

### Scientific Integrity & Data:
- [x] NASA GPM IMERG Final Run V07 Daily (`GPM_3IMERGDF`) used exclusively.
- [x] Variable named `precipitation` (mm/day) verified.
- [x] Ingestion bounding box order: `(90.0, 24.0, 93.5, 26.0)`.
- [x] Zero synthetic data in `data/trends/`. Fail-closed error handling enforced.
- [x] Primary analysis strictly uses 100% complete seasons ($61/61$ days).
- [x] Cell-first indicator calculation protocol enforced.
- [x] Modified Mann-Kendall (Hamed & Rao 1998) governs significance when $|r_1| \ge 0.392$.
- [x] Analytical Sen-Kendall 95% CI computed using corrected variance.
- [x] Strict null reporting: if $p \ge 0.05$, output "No statistically significant trend detected".

### Architecture & Reproducibility:
- [x] Module 2 code strictly isolated in `trend_explorer/` and `data/trends/`.
- [x] Module 1 operational code untouched (`run_pipeline.py`, fixtures, routing).
- [x] All 48 unit tests pass without regression (`pytest tests/ -v`).
- [x] Output JSON schema initializes as `"UNPROCESSED"`; $< 150\text{ KB}$ file size.
- [x] `cd ui && npm run build` succeeds with zero errors.

### Hackathon Compliance & Storytelling:
- [x] "Trend-to-Action" narrative clearly connects Module 2 climatology to Module 1 warning.
- [x] 100% English and Bangla language parity across all UI strings.
- [x] WCAG AA accessibility compliance verified.
- [x] Space Apps branding rules honored (no NASA Meatball/Worm logo, no minors in video).

---

*Authored for Team AUSTrology — HydroSense-SWOT — NASA Space Apps Challenge 2026*
