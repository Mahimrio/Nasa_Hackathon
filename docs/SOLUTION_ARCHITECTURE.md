# SOLUTION ARCHITECTURE — HydroSense-SWOT
## Conceptual System Design (Prescreening Video — Concept Only)
## Version 3.0 — FINAL HARDENED (Vibe-Coding Traps + Hackathon Failure Modes Addressed)

*Third pass audit — 2026-10-08. Supersedes v2.0.*
*This version explicitly guards against the failure modes that kill hackathon teams and that AI assistants generate silently.*

---

## MASTER AUDIT TABLE — ALL ISSUES FOUND ACROSS v1 AND v2

### Category A: Scientific/Technical Errors (Judge Credibility Killers)

| # | What was wrong | Why dangerous | Fix in v3 |
|---|---|---|---|
| A1 | Manning n bound was 0.08 (v1), corrected to 0.10 (v2) | Physical range: main-channel alluvial can reach 0.10. Correct. But we now also flag that n in Bangladesh rivers is STAGE-DEPENDENT (higher at low flow, lower at flood peak). A single calibrated n per reach will drift during the event. | Added: note that n is calibrated at mid-flood stage overpasses only; low-flow SWOT passes are excluded from Manning calibration (they would give wrong n) |
| A2 | SWOT slope on low-gradient Bangladesh rivers has very high relative noise | Surma-Kushiyara slope is approximately 1e-5 to 1e-4 m/m. SWOT slope uncertainty can exceed the signal. Manning's Q scales as S^0.5 — a 50% slope error gives 30% discharge error. | Added: explicit slope quality filter (slope > 2x slope_u, where slope_u is slope uncertainty field); added note that slope noise is the largest error source; Tier 3 must check this |
| A3 | IMERG systematically OVERESTIMATES intense rainfall in orographic terrain (Meghalaya) | IMERG Early Run shows positive bias over complex terrain during monsoon. If we use raw IMERG over Meghalaya without bias acknowledgement, the model will predict floods earlier and more often than reality — this would inflate our lead time claim. | Added: IMERG orographic bias acknowledgement in Limits panel; calibration period corrects for it implicitly if gauge calibration is honest; state bias explicitly in SOURCES.md |
| A4 | Hydrocron API endpoint URL was listed as soto.podaac.earthdatacloud.nasa.gov — this is the UAT environment | The correct production endpoint is soto.podaac.earthdatacloud.nasa.gov/hydrocron/v1 — however the UAT and production environments share a hostname. The real trap is: Hydrocron short_name field must match the EXACT product version e.g. SWOT_L2_HR_RIVERSP_2.0 not just SWOT_L2_HR_RiverSP | Added: correct short_name version string for Hydrocron queries |
| A5 | The architecture assumed SWOT passes are synchronized with IMERG time steps | SWOT passes happen at irregular intervals (not every 30 min). The Manning calibration uses SWOT passes; the routing uses IMERG at 30-min steps. These are DIFFERENT time series. The code must not try to inner-join them by timestamp. | Added: explicit data model note — SWOT is used for parameter estimation only, not for operational time steps. IMERG drives all 30-min time steps. This is a critical architectural distinction. |

### Category B: Vibe-Coding Trap Errors (Silent Bugs That Kill Demos)

| # | Trap | How AI generates it silently | Guard in v3 |
|---|---|---|---|
| B1 | Timezone double-conversion: BWDB timestamps converted to UTC, then accidentally converted again | AI writes helper functions that look correct but chain two UTC-6 shifts, producing BST-12 data with no error | Explicit guard: store ALL internal timestamps as UTC ISO8601 strings. Convert ONCE at ingestion. Assert: ll(t.tzinfo is not None for t in gauge_times) |
| B2 | NetCDF4 import order bug: importing xarray before netCDF4 causes silent backend failures | AI generates import xarray as xr before import netCDF4 — works 90% of the time but fails on some systems with cryptic error | Import order specified explicitly in architecture: 
etCDF4 first, then xarray |
| B3 | SWOT reach IDs are 11-digit integers — pandas may read them as float64 and truncate | CSV export from Hydrocron writes reach_id as 7.12345e+10 — importing this loses the last digit, matching to a wrong reach | Guard: dtype={'reach_id': str} in all pandas read_csv calls. Never store reach_id as float. |
| B4 | IMERG files use 'HH:MM' half-hour ending time, not beginning time | AI assumes half-hour intervals are labelled at the START of the interval. IMERG labels at the END. This shifts all rainfall by 30 minutes, corrupting the timing metric. | Explicit note: IMERG granule timestamps are end-of-interval. Shift back 30 min before joining with other time series. |
| B5 | earthaccess token expiry during a long calibration data pull | earthaccess tokens expire after 60 days but also have per-session limits. A loop pulling 50+ SWOT files may silently switch to unauthenticated mode and return 401 errors | Guard: wrap all earthaccess downloads in a try/except; call earthaccess.login() once at the start of the script; do NOT call it inside a loop |
| B6 | Hydrocron returns NaN WSE as fill_value = -999999.0 not as Python NaN | AI writes df.dropna() which does NOT catch -999999.0, leaving corrupt rows in the calibration dataset | Guard: after Hydrocron pull, replace: df.replace(-999999.0, float('nan'), inplace=True) before any calculation |
| B7 | xarray coordinate mismatch when merging IMERG (lat/lon) with HydroSHEDS polygons | rioxarray CRS not set explicitly — geopandas clip fails silently and returns an empty GeoDataFrame, producing MAP=0 for all time steps | Guard: always call ds.rio.write_crs('EPSG:4326', inplace=True) after opening IMERG files. Assert MAP array is non-zero before proceeding. |
| B8 | Manning's n calibration uses scipy.optimize.minimize_scalar without bounds | Without explicit bounds keyword, scipy ignores the [0.025, 0.10] range and returns unphysical n values | Code must use scipy.optimize.minimize_scalar(func, bounds=(0.025, 0.10), method='bounded') — the method='bounded' keyword is REQUIRED |
| B9 | Slope field in SWOT RiverSP is slope2 (reach-averaged slope) not slope (node-level) | On the REACH product, the correct slope field for Manning routing is slope2 (two-pass reach slope). slope exists but is a node-to-node difference and is noisier | Use slope2 not slope in all Manning calculations |
| B10 | Demo slider uses hardcoded date strings "Apr 12" — these break if the SWOT data shows different peak dates | AI generates slider logic tied to calendar dates that looked good during design. If the actual data peak is Apr 17, the script produces GREEN on Apr 12 and the demo "moment" does not happen | Demo must drive dates from the DATA: find peak programmatically, set slider annotation to computed peak date |

### Category C: Hackathon Team Process Traps

| # | Trap | Why teams fail | Guard in v3 |
|---|---|---|---|
| C1 | The team does not run the full pipeline end-to-end before filming | Each piece works; the integration does not. Common on the morning of the video deadline. | Defined a MINIMUM VIABLE PIPELINE (MVP) in this document. MVP must pass before any UI work begins. |
| C2 | NSE / KGE values are printed as 6 decimal places — judges see 0.612347 and think it looks fake | Over-precision signals hard-coding to judges. Real computed values should be rounded to 2dp. | Round all displayed metrics to 2 decimal places: "{nse:.2f}" |
| C3 | The "Limits panel" is added as an afterthought and contains vague language | Judges read the limits panel carefully. Vague limits ("some data may be unavailable") score lower than specific ones ("SWOT slope uncertainty exceeds signal on reaches < 150 m wide at slopes < 5e-5 m/m") | Limits panel text is written in this document and must not be changed without R3 review |
| C4 | Team member explains in Q&A that "the model uses SWOT to predict floods in real time" | Judges know SWOT is not real-time. This one sentence invalidates the Validity score. | Mandatory pre-video team alignment: everyone reads the "What This Design Does NOT Claim" section and can say it from memory |
| C5 | GitHub repo has no README, no data citation, no license | Judges click the repo link. Empty README = automatic low presentation score | README structure defined at the end of this document |

---

## Elevator Sentence (use verbatim — do NOT paraphrase)

> A Sunamganj upazila agriculture officer opens a phone screen. One flag tells her whether the Surma river is likely to breach before the Boro is ready to cut. That flag comes from SWOT measurements of river width, height and slope, combined with rainfall that fell on the Meghalaya hills four hours ago.

---

## Why This Architecture Wins on All Five Criteria

| Criterion | Evidence |
|---|---|
| **Influence** | Named user: upazila officer, Sunamganj. 214,000 t Boro lost April 2026; 149,224 ha in 2017 in Sunamganj alone. ~230,000 farmers affected [S3] |
| **Creativity** | No published tool routes IMERG through SWOT-calibrated Muskingum-Cunge reaches to produce a harvest timing flag for the Haor. SWOT SoS/Confluence exists but does not produce harvest decisions or exploit travel-time routing for lead time. [INFERENCE: search log in SOURCES.md] |
| **Validity** | Strict time-split. NSE + KGE computed from data. Manning n bounded physically. M-C limited to rising limb. IMERG bias acknowledged. Slope quality filter applied. All traps guarded. |
| **Relevance** | SWOT RiverSP is the calibration engine. IMERG Early Run is the forecast driver. Both are NASA open data. They ARE the method, not a decoration. |
| **Presentation** | One screen. One question. One slider. Limits panel always visible. Bangla default. Computed metrics only on screen. |

---

## Minimum Viable Pipeline (MVP) — Build This First

Before ANY UI work, this pipeline must run end-to-end without errors:

`
Step 1: Load swot_reaches.nc                    -> assert n_valid_passes >= 5
Step 2: Load gauge_kanaighat.csv                -> assert non-empty, UTC timestamps
Step 3: Run Manning calibration                 -> assert n per reach in [0.025, 0.10]
Step 4: Load imerg_map.nc                       -> assert MAP is not all-zero
Step 5: Run Muskingum-Cunge routing             -> assert modelled level rises during Apr event
Step 6: Compute NSE, KGE, peak_timing_error     -> print to console (2dp)
Step 7: Run baseline (rainfall threshold)       -> print baseline_flag transitions
`

If Step 6 NSE < 0: do NOT stop. Record the value. Proceed to Step 7. Compare.
If Step 3 produces n > 0.10 or n < 0.025 for any reach: investigate slope quality (Trap B9, A2).

---

## TIER 1 — Data Ingestion and NASA APIs

### 1.1 SWOT L2 HR RiverSP Reach Product

| Property | Value |
|---|---|
| Product short_name (Hydrocron) | SWOT_L2_HR_RIVERSP_2.0 (exact string — version number matters) |
| Product (PO.DAAC) | SWOT_L2_HR_RiverSP, Collection Concept ID: C2799438271-POCLOUD |
| Provides | WSE (m), width (m), slope2 (m/m, reach-averaged — USE slope2 NOT slope), wse_u, dark_frac, quality_f |
| Access method | earthaccess Python library (login once, not in loop) OR Hydrocron time-series API |
| Hydrocron query | feature=Reach, feature_id={reach_id}, start_time={ISO8601}, end_time={ISO8601}, output=geojson, fields=reach_id,time_str,wse,width,slope2,wse_u,dark_frac,quality_f |
| Post-download REQUIRED | Replace fill values: df.replace(-999999.0, float('nan'), inplace=True) |
| Reach ID type | 11-digit integer — read as STRING always: dtype={'reach_id': str} |
| [OPEN] | Confirm version 2.0 / baseline D covers Apr-May 2026 on PO.DAAC CMR before Oct 28 |

**Why SWOT:** Ungauged border reaches. SWOT directly measures channel geometry (width, slope2, height) — this is what calibrates n. A rainfall-only model cannot estimate n for these reaches.

**earthaccess pattern (safe):**
`python
import netCDF4  # MUST be before xarray
import earthaccess
import xarray as xr

earthaccess.login()  # ONCE, at top of script. NOT inside loops.
results = earthaccess.search_data(short_name="SWOT_L2_HR_RIVERSP_2.0",
                                   temporal=("2024-01-01", "2026-03-31"))
files = earthaccess.download(results, local_path="data/raw/swot/")
`

### 1.2 GPM IMERG Early Run V07

| Property | Value |
|---|---|
| Short name | GPM_3IMERGHHE |
| Resolution | 0.1 deg x 0.1 deg, 30-minute intervals |
| Timestamp convention | END-of-interval (subtract 30 min before joining with other time series) |
| Latency | ~4 hours after observation [VERIFIED: S17] |
| Key variable | precipitationCal (NOT precipitation — that is uncalibrated) |
| Sub-region | 23.5N-26.0N, 91.0E-93.5E |
| Known bias | IMERG overestimates intense orographic rainfall over Meghalaya. The calibration period implicitly corrects for this bias through roughness n adjustment. State this in SOURCES.md and Limits panel. |
| Access | GES DISC OPeNDAP + .netrc |
| CRS guard | After open: ds.rio.write_crs('EPSG:4326', inplace=True) |

**After loading IMERG:**
`python
import netCDF4  # before xarray
import xarray as xr
import rioxarray

ds = xr.open_dataset("imerg_file.nc4", engine='h5netcdf')
ds = ds.rio.write_crs('EPSG:4326', inplace=True)
# IMERG timestamp is END-of-interval — shift back 30 min
ds['time'] = ds['time'] - pd.Timedelta('30min')
map_series = ds['precipitationCal'].sel(lat=slice(23.5, 26.0), lon=slice(91.0, 93.5))
assert map_series.values.max() > 0, "MAP is all-zero — check CRS clip or variable name"
`

### 1.3 BWDB / FFWC Gauge Series

- Stations: Kanaighat (Surma), Sherpur (Kushiyara), Sunamganj
- **[OPEN — URGENT]:** bwdb.gov.bd portal or email ffwc@bwdb.gov.bd. Start this on Day 1.
- Timezone: BST = UTC+6. Convert ONCE at ingestion. Assert UTC-awareness before any join.
- Do NOT convert level to discharge without a published rating curve.
- Fallback: SWOT WSE at nearest reach node (level-to-level comparison is valid)

`python
import pandas as pd
gauge = pd.read_csv("gauge_kanaighat.csv", parse_dates=['timestamp'],
                     dtype={'station_id': str})
# Convert BST to UTC ONCE
gauge['timestamp'] = gauge['timestamp'].dt.tz_localize('Asia/Dhaka').dt.tz_convert('UTC')
assert gauge['timestamp'].dt.tz is not None, "Timestamps must be timezone-aware"
`

### 1.4 SWORD v16 + HydroSHEDS

- SWORD: reach IDs, centreline widths — pre-screen reaches > 100 m
- HydroSHEDS: sub-catchment polygons for IMERG spatial aggregation
- Access: hydrosheds.org (public)
- **[OPEN]:** Pull SWORD reach widths for the study region. At least several reaches > 100 m.

---

## TIER 2 — Data Pre-processing / ETL

### 2.1 SWOT Quality Gating (with Slope Quality Check — New in v3)

| Check | Threshold | Basis | Action |
|---|---|---|---|
| quality_f | 0 or 1 only | SWOT product docs | Drop if 2 or 3 |
| dark_frac | < 0.3 | Algorithm team discharge-quality guidance | Drop |
| ice_clim_f | = 0 | RiverSP ATBD | Drop |
| width | > 100 m | SWOT spec [S14, S15] | Tag 50-100 m as uncertain |
| wse_u | < 0.25 m | HESS 30, 4141 (2026) [S16] | Weight by 1/wse_u^2 in calibration |
| slope2 | > 2 * slope_u AND > 1e-5 m/m | NEW in v3: slope must exceed its own uncertainty for Manning to work | Drop — do NOT use in Manning; this reach has unreliable slope |

> **Why the slope2 quality check is new and critical:** Bangladesh rivers have very low gradients (~1e-5 m/m). SWOT slope noise can exceed the signal, producing negative or zero slopes. Manning's Q scales as slope^0.5 — an unreliable slope makes Q completely wrong. This check was MISSING from v1 and v2. It is the single most important quality guard for this region.

### 2.2 Calibration Data Model (CRITICAL architectural note — new in v3)

**SWOT and IMERG are DIFFERENT time series and must NEVER be inner-joined by timestamp.**

`
SWOT passes:   irregular intervals, ~every 7-10 days
               Used for: Manning calibration ONLY (parameter estimation)
               
IMERG steps:   every 30 minutes (end-of-interval)
               Used for: routing and operational flag time steps

Correct flow:
  1. Use SWOT passes -> calibrate n (one-time, offline)
  2. Use calibrated n + IMERG MAP -> run Muskingum-Cunge at every 30-min IMERG step
  3. NEVER look up a SWOT value during the operational routing step
`

If your code has a line like swot_wse[imerg_timestamp] in the routing loop — that is a trap. Remove it.

### 2.3 IMERG Aggregation

1. Apply HydroSHEDS polygon clip with rioxarray (CRS must be set explicitly first)
2. Compute area-weighted mean of precipitationCal per sub-basin
3. Output: MAP[sub_basin, time_UTC_start_of_interval] in mm/hr
4. Assert MAP is non-zero for at least one time step in the April event

### 2.4 Gauge Alignment

1. Convert to UTC once at ingestion (tz-localize then tz-convert)
2. Rolling 3-point median filter to remove spikes
3. Record datum and unit in SOURCES.md

### 2.5 Fixtures

| Fixture | Contents | Format |
|---|---|---|
| swot_reaches.nc | Quality-gated WSE, width, slope2, wse_u per reach | NetCDF4 |
| swot_event.nc | Same, for test event | NetCDF4 |
| imerg_map.nc | MAP per sub-basin, UTC-start-of-interval | NetCDF4 |
| gauge_kanaighat.csv | Level, UTC-aware timestamps | CSV (str station_id, str reach_id) |

- All fixtures < 50 MB total, committed to data/fixtures/
- Fixture download date recorded in data/fixtures/README.md
- Tier 4 ALWAYS loads from fixtures first

---

## TIER 3 — Core Analytical Engine

### 3.1 Manning's Equation — Roughness Calibration

`
Q = (1/n) * A * R^(2/3) * slope2^(1/2)

  Q      = discharge [m3/s]
  n      = roughness [dimensionless, SOLVED FOR per reach]
  A      = width * (wse - z_bed)  [m2]
  R      = depth for wide rivers (width >> depth)
  slope2 = reach-averaged slope from SWOT [m/m]  <- USE slope2, NOT slope
  z_bed  = min SWOT WSE during quality-passed passes where wse is likely near-baseflow
`

**Valid n range: [0.025, 0.10] for in-channel main-stem reaches**
**Calibrate ONLY on mid-to-high flow SWOT passes** (passes where wse > z_bed + 0.5 m)
- Low-flow passes produce a different n (n is stage-dependent in alluvial channels)
- Using low-flow n for flood prediction will underestimate discharge

**Calibration code pattern:**
`python
from scipy.optimize import minimize_scalar

def manning_rmse(n_trial, swot_df, gauge_df):
    # compute Q for each SWOT pass, compare to gauge, return RMSE
    ...

result = minimize_scalar(manning_rmse, bounds=(0.025, 0.10),
                          method='bounded',  # REQUIRED for bounds to work
                          args=(swot_df, gauge_df))
n_calibrated = result.x
assert 0.025 <= n_calibrated <= 0.10, f"n={n_calibrated:.4f} out of physical range"
`

> **Assumption A1:** z_bed = minimum WSE over quality-passed passes. Uncertainty ±0.18 m [S16] shown as error band.

**Calibration period: Jan 2024 - Mar 2026 (pre-event, ~50-100 passes at 25N)**
**Test period: Apr 1 - May 31 2026 ONLY. Lock n before this period.**

### 3.2 Muskingum-Cunge Routing

**Valid regime: rising limb, in-channel flow only.**

**Cannot model:** floodplain inundation, backwater, full recession limb.

> **Assumption A2:** M-C used for rising-limb threshold-crossing timing only. Harvest flag triggered by timing of danger level crossing, not by peak volume.

**Routing parameters:**
`python
V_mean = Q_SWOT / A  # at mid-flood-stage SWOT pass
c = (5.0/3.0) * V_mean  # flood wave celerity
K_reach = reach_length / c  # travel time [seconds]
X = 0.25  # Muskingum weighting (sensitivity-test 0.2-0.35)
K_total_hours = sum(K_per_reach) / 3600.0
`

**Lead time (corrected from v1's "48 hours"):**
- Estimated travel time: ~140,000 m / 1.5 m/s ≈ 26 hours [confirm from HydroSHEDS distances]
- IMERG latency: 4 hours
- Effective lead time from observed rain to flag: ~22-30 hours

### 3.3 Baseline (Required)

`python
accumulated_rain_6h = MAP_meghalaya.rolling('6h').sum()  # mm
# thresholds from 2017 event or historical BWDB peak
if accumulated_rain_6h >= threshold_act:
    baseline_flag = 'RED'
elif accumulated_rain_6h >= threshold_watch:
    baseline_flag = 'AMBER'
else:
    baseline_flag = 'GREEN'
`

### 3.4 Harvest Flag

`python
danger_level_m = BWDB_danger_level  # [OPEN: pull before filming]
travel_time_h  = K_total_hours      # from 3.2, computed from data

future_level = modelled_level(t + pd.Timedelta(hours=travel_time_h))

if future_level >= danger_level_m:
    flag = 'RED'
elif future_level >= 0.80 * danger_level_m:
    flag = 'AMBER'
else:
    flag = 'GREEN'
`

**Demo slider annotation must be driven by data:**
`python
peak_date = modelled_level.idxmax()  # computed, not hardcoded to "Apr 12"
`

### 3.5 Performance Metrics (Display Rules)

| Metric | Code | Display format |
|---|---|---|
| NSE | hydroeval.nse(sim, obs) | f"{nse:.2f}" (2 decimal places ONLY) |
| KGE | hydroeval.kge(sim, obs) | f"{kge:.2f}" |
| PBIAS | (sim.sum()-obs.sum())/obs.sum()*100 | f"{pbias:+.1f}%" |
| Peak timing error | (sim.idxmax()-obs.idxmax()).total_seconds()/3600 | f"{dte:+.1f} h" |
| Lead time | time from flag=RED to obs crossing danger level | f"{lead:.1f} h" |

**NEVER display more than 2 decimal places for any metric — it signals hard-coding to judges.**

**Uncertainty band:** ±0.18 m WSE propagated through Manning analytically. Shown as shaded fill on hydrograph.

---

## TIER 4 — User Delivery Interface

### 4.1 Screen Layout

`
+=================================================================+
| HydroSense-SWOT          [EN / Bangla]      Data: 2026-04-14   |
+===================================+============================+
|                                   |  HARVEST FLAG              |
|  MAP — Surma-Kushiyara reaches    |  [AMBER icon]  AMBER       |
|  (cividis: level / danger ratio)  |                            |
|  (*) = SWOT overpass date         |  Cut within 12 hours       |
|  [///] = slope quality flag       |  if level keeps rising.    |
|  Click reach -> hydrograph        |                            |
|                                   |  Travel time: ~26 h        |
|                                   |  IMERG: 10:00 UTC          |
|                                   |  SWOT geom: [computed date]|
+===================================+============================+
|  HYDROGRAPH — Kanaighat (Surma)                                |
|  Level |  modelled (shaded uncertainty band)                   |
|   (m)  |  BWDB observed                                        |
|        |  baseline (rain-only)                                  |
|        |  ---danger level---                                    |
|        +--[Apr 1]---[Apr 15]---[May 1]---[May 31]------------>|
|                  [SLIDER] <- peak annotation auto-set from data|
+=================================================================+
|  LIMITS (always visible)                                       |
|  SWOT resolves rivers wider than ~100 m. Narrow headwaters:   |
|  not resolved. Low-slope reaches where slope uncertainty       |
|  exceeds signal are excluded (shown hatched on map).           |
|  IMERG may overestimate intense orographic rain over           |
|  Meghalaya; calibration corrects for this implicitly.          |
|  Routing models rising limb only — inundation extent: not      |
|  modelled. Lead time: ~22-30 h from observed rain to flag.     |
|  NSE: [computed]  KGE: [computed]  Timing error: [computed] h  |
+=================================================================+
`

**New in v3: slope-quality-flagged reaches shown with hatching on the map.**
**SWOT geometry date is driven from data (swot_pass_dates.max()), not hardcoded.**

### 4.2 Signature Demo Moment

| Slider position | What the judge sees |
|---|---|
| Apr 1-8 | Green flag. Light rain on map. Level low. |
| Apr 9-11 | Heavy rain pulses over Meghalaya |
| [peak_date - 1 day] | Flag AMBER. Model rising. Gauge still normal. |
| [peak_date] | Flag RED. Model crosses danger. |
| [peak_date + 1 day] | BWDB observed catches up. Flag was early. |

**All dates computed from data. No hardcoded strings.**

**30-second script (final):**
- 0-5s: "230,000 farmers. One decision. Cut the rice — or wait."
- 5-12s: Slider drags. Meghalaya rain pulses. Flag turns RED before gauge moves. "The flood is still ~26 hours away. Our model sees it coming."
- 12-20s: Hydrograph. Two lines. Timing arrow. "SWOT's channel data added ~[computed] hours of warning over a rainfall-only alert."
- 20-26s: Limits panel on screen. "SWOT cannot see every channel. We say that. Always."
- 26-30s: Team name. Challenge: [OPEN Oct 28]. "For the Haor."

### 4.3 Accessibility

| Element | Standard |
|---|---|
| Map colours | cividis sequential (CVD-safe) |
| Flag | Text + icon + colour (never colour alone) |
| Hydrograph lines | Solid / dashed / dotted (colour-blind safe) |
| Contrast | WCAG AA >= 4.5:1 |
| Default language | Bangla; English toggle |
| Min viewport | 360 px |
| Touch targets | >= 44 x 44 px |
| Screen reader | Flag reads: "AMBER — Cut within 12 hours if level keeps rising" |

### 4.4 Scope OUT

| Excluded | Why |
|---|---|
| Live API during judging | Fixtures always used; venue WiFi is unreliable |
| Multi-basin switching | Out of scope; one-line next step |
| Future rainfall forecast | IMERG is observed, not forecast. We do not claim otherwise. |
| Full inundation mapping | 2D hydraulic model needed; stated next step |
| Hard-coded metrics | All shown as [computed] |

---

## Technical Assumptions (Complete)

| # | Assumption | Basis | Risk | Mitigation |
|---|---|---|---|---|
| A1 | z_bed = min SWOT WSE (from quality-passed passes, not low-flow-only) | Standard low-flow proxy for ungauged reaches | Underestimates depth -> n over-calibrated | ±0.18 m error band; calibrate only on mid-to-high flow passes |
| A2 | M-C valid for rising limb in-channel flow | ~160 km from tidal influence; no junction backwater on rising limb | Inundation volume wrong; recession mismatch | Restrict all claims to rising limb + threshold timing |
| A3 | IMERG bias over Meghalaya is absorbed by Manning n calibration | Bias is systematic and consistent across events — the calibration corrects for it statistically | If 2026 bias pattern is different from calibration period, lead time shifts | State in Limits panel; report PBIAS to quantify residual bias |

---

## Edge Case Handling

| Case | Trigger | Response | Badge |
|---|---|---|---|
| No SWOT passes in Apr-May 2026 | < 2 usable passes | Use nearest pre-event geometry; label date | "SWOT geom: [date]" |
| IMERG gap | Missing granule | Zero-fill (conservative); show gap badge | "Rain: gap [time]" |
| Gauge inaccessible | No response from FFWC/BWDB | Use SWOT WSE as secondary target | "Validation: SWOT WSE (reduced confidence)" |
| Manning n at bound | n clamped to 0.025 or 0.10 | Flag reach on map; widen error band | Hatched + label |
| slope2 < 2*slope_u | SWOT slope unreliable | Exclude from calibration; show hatched | Hatched + "slope uncertain" |
| Model worse than baseline | NSE <= baseline NSE | Report both; show what SWOT adds (KGE, timing) | Both NSE values shown |

---

## GitHub README Structure (Required for Presentation Score)

`
# HydroSense-SWOT

## What it does (one paragraph, plain English)
## How to run (5 steps max)
  1. Install: pip install -r requirements.txt
  2. Configure: copy .env.example to .env, add Earthdata credentials
  3. Verify fixtures & run pipeline: python pipeline/run_pipeline.py
  4. Export JSON data for frontend: python scripts/export_json.py
  5. Launch UI: cd ui && npm run dev

## Data sources
  - SWOT L2 HR RiverSP (NASA PO.DAAC, SWOT_L2_HR_RIVERSP_2.0)
  - GPM IMERG Early Run V07 (NASA GES DISC, GPM_3IMERGHHE)
  - BWDB/FFWC gauge data: [source and access date]
  - SWORD v16, HydroSHEDS v1: hydrosheds.org

## License: MIT
## Citation: [team, Space Apps 2026, challenge title]
## Limitations: [link to Limits panel documentation]
`

---

## What This Design Does NOT Claim

- NOT real-time SWOT monitoring (SWOT revisit ~2-4x per 21 days at 25N; channel geometry only)
- NOT a 48-hour forecast — lead time is ~22-30h routing travel time from OBSERVED IMERG rain
- NOT resolving narrow headwater channels (< 100 m wide)
- NOT modelling floodplain inundation extent — flags threshold-crossing timing only
- NOT promising NSE >= 0.80 before the code runs
- NOT the first satellite flood tool for Bangladesh — novelty is the harvest-timing flag for this ungauged transboundary corridor

All of the above are in the Limits panel, always visible. Every team member must be able to say this from memory.

---

## Links

- Problem statement: Problem_and_Challenge_Statement.md
- Research: HydroSense_Research_Briefing.md
- Scope: DECISIONS.md
- Sources: SOURCES.md
- Risks: RISK_REGISTER.md
- Rules: Space Apps Challenge Participants Guide.md
- AI guide: STEERING_GUIDE_FINAL.md

---

*SOLUTION_ARCHITECTURE.md v3.0 — Final hardened 2026-10-08.*
*Three audits completed. Scientific, vibe-coding, and hackathon failure modes addressed.*
*[OPEN] items require human verification before filming. All code patterns in this document are prescriptive — the implementation must match them.*
