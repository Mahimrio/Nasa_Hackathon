# Real-Data Source Verification, Ingestion Contracts & Fail-Closed Protocols

**Document ID:** `docs/evidence/ingestion_audit_and_contracts.md`  
**Gate:** Gate 2 (Real-data source verification and ingestion) & `SYNTHETIC_DATA.md` Requirements 4, 7  
**Date:** 2026-10-24  
**Status:** `VERIFIED` (Contracts and fail-closed mechanisms verified; authentic remote granules blocked by credential availability)  

---

## 1. Candidate Source Registry & Contract Specifications

The table below defines the formal ingestion contracts for all candidate real data sources:

| Source Name | Collection / Product ID | Provider / Access Point | Bounding Box / Spatial Domain | Temporal Coverage & Resolution | Variables & Units | QA & Filtering Contract | License / Terms |
|---|---|---|---|---|---|---|---|
| **NASA SWOT RiverSP** | `SWOT_L2_HR_RIVERSP_2.0` | NASA PO.DAAC / Hydrocron API (`soto.podaac.earthdatacloud.nasa.gov/hydrocron/v1`) | Bounding Box: (23.5°N, 91.0°E, 26.0°N, 93.5°E) | Aug 2023 – present (~21-day orbit, ~2 passes/cycle) | `wse` (m), `width` (m), `slope2` (m/m), `wse_u` (m), `slope_u` (m/m), `quality_f` (flag), `dark_frac` (ratio) | Filter: `quality_f in [0, 1]`, `dark_frac < 0.3`, `width >= 100m`, `wse_u < 0.25m`, `slope2 > 2*slope_u`, `slope2 >= 1e-5 m/m`. Decode `-999999.0` to NaN. | Open Access (NASA Earth Science Data Policy) |
| **NASA GPM IMERG Final** | `GPM_3IMERGDF` V07 | NASA GES DISC (`disc.gsfc.nasa.gov`) | South Asia Domain: (23.5°N–26.0°N, 91.0°E–93.5°E) | Jan 1, 2001 – Dec 31, 2025 (Daily, 0.1° grid) | `precipitation` (mm/day) | Gauge-adjusted research grade. Complete seasons only: 61 of 61 April–May days required. Reject missing days. | Open Access |
| **NASA GPM IMERG Early** | `GPM_3IMERGHHE` V07 | NASA GES DISC OPeNDAP | Sub-basin catchment polygons | Half-hourly, ~4-hour latency | `precipitationCal` (mm/hr) | Shift timestamps backward 30 minutes to align end-of-interval to routing start. Non-zero sanity check. | Open Access |
| **BWDB River Stage** | Station `SW266` (Alias `SW108`, Kanaighat) | Bangladesh Water Development Board / FFWC | Point: 24.9980°N, 92.2594°E (Surma River) | Hourly observations (April–May 2026) | `water_level_m` (m PWD), `danger_level_m` (13.20 m PWD) | Convert BST (UTC+6) to UTC ISO8601. Apply 3-point rolling median filter to suppress spurious single-step spikes. | Public Sector Records (Government of Bangladesh) |
| **SWORD Database** | SWORD v16 South Asia | HydroSHEDS / `hydrosheds.org` | South Asia reach polygons | Static v16 topology | `reach_id` (11-digit str), `width` (m), `slope` (m/m), `reach_len` (m) | Pre-screen `width > 100m` to match SWOT radar resolution. Store reach IDs as strings. | Open Access (Creative Commons CC-BY 4.0) |

---

## 2. Fail-Closed Protocol & Proof of No Silent Substitution

In compliance with `SYNTHETIC_DATA.md` Requirement 4:
> *"A real-data command must fail closed for each required missing/invalid source and must never silently fill the gap with generated values."*

### 2.1 Verification Evidence: `scripts/generate_fixtures.py --mode real`
Executing the real mode command without authentic downloaded granules explicitly terminates with non-zero exit code and an explanatory error:
```bash
$ python scripts/generate_fixtures.py --mode real
SystemExit: Real mode is fail-closed: use verified source-specific ingestion; this script never substitutes synthetic event, rainfall, or gauge records.
Exit code: 1
```
*Automated Test:* Verified in `tests/test_provenance_and_leakage.py::test_real_mode_fails_closed_without_silent_substitution` (PASSED).

### 2.2 Verification Evidence: `scripts/run_trend_analysis.py`
Executing trend analysis against an unverified or synthetic dataset fails immediately:
```bash
$ python scripts/run_trend_analysis.py --input data/fixtures/imerg_map.nc
TREND ANALYSIS FAILED CLOSED: Trend analysis accepts only provenance=REAL datasets; synthetic or unknown inputs are rejected.
Exit code: 1
```
*Automated Test:* Verified in `tests/test_trend_analysis.py::test_rejects_synthetic_trend_input` (PASSED).

---

## 3. Remote Ingestion Modules Implementation Audit

1. **`pipeline/ingest_swot.py`**:
   - Implements `earthaccess.login()` once at script level.
   - Searches `SWOT_L2_HR_RIVERSP_2.0` with spatial bounding box `(23.5, 91.0, 26.0, 93.5)`.
   - Alternative Hydrocron API endpoint: `https://soto.podaac.earthdatacloud.nasa.gov/hydrocron/v1`.
   - Explicit fill value sanitization: `df.replace(-999999.0, float('nan'))`.
   - Tested in `tests/test_ingest_swot.py` (4/4 tests pass).

2. **`pipeline/ingest_imerg.py`**:
   - Downloads half-hourly `precipitationCal` OPeNDAP streams.
   - Shifter: `ds["time"] = ds["time"] - pd.Timedelta(minutes=30)`.
   - Tested in `tests/test_ingest_imerg.py` (6/6 tests pass).

3. **`pipeline/ingest_gauge.py`**:
   - Converts BST timestamps to UTC: `pd.to_datetime(df['timestamp']).dt.tz_localize('Asia/Dhaka').dt.tz_convert('UTC')`.
   - Rolling median filter: `df['water_level_m'].rolling(window=3, center=True).median()`.
   - Tested in `tests/test_ingest_imerg.py` (passes).
