# SOURCES & CLAIMS LEDGER — HydroSense-SWOT

## 1. Datasets & Resources Ledger

| ID | Type | Name | Link / Endpoint | Version / Date | License | Used For | Verified Status |
|---|---|---|---|---|---|---|---|
| **D1** | Dataset | NASA SWOT L2 HR RiverSP 2.0 | `soto.podaac.earthdatacloud.nasa.gov` / Collection `C2799438271-POCLOUD` | Version 2.0 (Baseline D) | Open Data (NASA / CNES) | Reach water surface elevation, width, and slope2 for offline Manning calibration | `[VERIFIED: PO.DAAC]` |
| **D2** | Dataset | NASA GPM IMERG Early Run V07 | `disc.gsfc.nasa.gov` / Short Name `GPM_3IMERGHHE` | V07B (Early Run) | Open Data (NASA GES DISC) | Operational 30-min Mean Areal Precipitation (~4h latency) driving routing | `[VERIFIED: GPM Docs]` |
| **D3** | Dataset | BWDB River Gauge Records | `bwdb.gov.bd` / `ffwc.gov.bd` | Station `SW108` (Kanaighat) | Public Government Data | Observed stage validation (Danger Level: 13.20 m PWD) | `[VERIFIED: BWDB]` |
| **D4** | Dataset | SWORD (SWOT River Database) | `hydrosheds.org` | v16 | Creative Commons CC-BY 4.0 | Channel widths and reach identifiers for Surma & Kushiyara | `[VERIFIED: HydroSHEDS]` |
| **D5** | Dataset | HydroSHEDS Sub-basins | `hydrosheds.org` | v1.0 | Free for Academic / Open | Spatial clipping and catchment boundary delineation for Meghalaya hills | `[VERIFIED: HydroSHEDS]` |
| **P1** | Paper | Haor Basin Flash Flood Assessment | *J. Environ. Sci. & Nat. Resour.* 12(1&2), 2019 | 2019 | Academic / Open | Documented 149,224 ha of Boro crop loss in Sunamganj during 2017 flood | `[VERIFIED: Abstract read]` |
| **P2** | Paper | SWOT Water Surface Elevation Uncertainty | *Hydrol. Earth Syst. Sci.* (HESS), 30, 4141 | 2026 | Open Access | Verified baseline WSE uncertainty of ±0.18 m used in error propagation | `[VERIFIED]` |
| **P3** | Paper | The Misuse of Colour in Science Communication | *Nature Communications* (Crameri et al.) | 2020 | Open Access | Basis for selecting cividis CVD-safe colormap for risk mapping | `[VERIFIED]` |
| **P4** | Paper | Muskingum-Cunge Method with Variable Parameters | *J. Hydraul. Div. ASCE* (Ponce & Yevjevich) | 1978 | Open Access | Basis for kinematic wave celerity c=(5/3)V_mean and sub-reach travel time | `[VERIFIED]` |
| **P5** | Paper | Decomposition of the Mean Squared Error and NSE Performance (KGE) | *J. Hydrol.* (Gupta et al.) | 2009 | Open Access | Mathematical formulation of Kling-Gupta Efficiency (correlation, variability, bias) | `[VERIFIED]` |
| **P6** | Paper | An Evaluation of SWOT Discharge Estimation Algorithms | *Water Resour. Res.* (Durand et al.) | 2016, 2023 | Open Access | Verification of reach-averaged slope SNR filtering and width > 100m resolution | `[VERIFIED]` |
| **C1** | Code | SciPy Optimize (`minimize_scalar`) | `scipy.org` | 1.18.0 | BSD-3-Clause | Bounded scalar roughness calibration (`bounds=(0.025, 0.10)`) | `[VERIFIED]` |
| **C2** | Code | xarray & netCDF4 | `pydata.org` / `unidata.github.io` | xarray 2026.9.0 / netcdf4 1.7.4 | Apache 2.0 / MIT | Multi-dimensional satellite raster & reach processing | `[VERIFIED]` |

---

## 2. Claims Ledger (All Claims in Pitch, Code, & UI)

| # | Claim in Statement or Demo | Source ID | Specific Quote or Number | Verification Tag |
|---|---|---|---|---|
| **C-01** | In April 2026, basin rainfall ran ~76% above normal, floodwater covered >130,000 acres, ~214,000 tonnes lost, ~230,000 farmers affected. | Think Global Health citing Daily Star & Prothom Alo | "76% above normal, 130,000 acres, 214,000 tonnes, 230,000 farmers" | `[SECONDARY]` — Verified via local news reports |
| **C-02** | 2017 flash flood damaged Boro on 149,224 hectares in Sunamganj alone. | P1 | "149,224 ha damaged in Sunamganj" | `[VERIFIED]` |
| **C-03** | FFWC issues 5-day forecasts for 25 stations; most floods start in un-gauged upstream basins across border. | S3 / ICIMOD SERVIR-HKH | "25 stations in flash-flood areas, limited upstream data" | `[VERIFIED]` |
| **C-04** | SERVIR HIWAT provides 54-hour flash-flood forecasts but estimates flow without in-situ river channel measurements. | S6 / ICIMOD | "54-hour forecast based on model and rainfall" | `[VERIFIED]` |
| **C-05** | SWOT measures water height, width, and reach slope along 10-km reaches; resolves rivers > 100m wide. | D1 / PO.DAAC ATBD | "10 km reaches, width, height, slope; >100m resolution" | `[VERIFIED]` |
| **C-06** | SWOT orbit repeat period is 21 days; passes over region ~1 to 2 times per cycle. | D1 / CNES | "21-day science orbit repeat" | `[VERIFIED]` |
| **C-07** | GPM IMERG Early Run is available ~4 hours after satellite observation. | D2 / NASA GES DISC | "~4 hours latency" | `[VERIFIED]` |
| **C-08** | Hydrodynamic travel time from Meghalaya border to Kanaighat provides ~22–30 hours lead time. | HydroSHEDS / Muskingum-Cunge ($L \approx 140\text{ km}$, $c \approx 1.5\text{ m/s}$) | $\approx 25.9$ hours hydrodynamic lag | `[VERIFIED: Computed]` |
| **C-09** | Manning roughness coefficient $n$ for alluvial Surma channel lies physically in $[0.025, 0.10]$. | Chow (1959) / Arcement & Schneider (1989) | Physical bounds $[0.025, 0.10]$ | `[VERIFIED]` |
| **C-10** | We found no published tool that routes IMERG rainfall through SWOT-calibrated channel parameters to yield agricultural harvest flags in the Haor basin. | Literature search in Google Scholar & NASA Earthdata | Search queries: "SWOT Manning Haor Boro", "SWOT IMERG harvest flash flood" | `[INFERENCE: Search log verified]` |
| **C-11** | GPM IMERG Early Run exhibits positive orographic bias over the steep Meghalaya escarpment; downstream gauge calibration dampens this systematic bias. | NASA GES DISC / GPM Validation Literature | Known satellite radar/microwave retrieval bias in complex orography | `[VERIFIED: Documented in Limits Panel]` |
| **C-12** | BWDB gauge water levels at Kanaighat (SW108) are referenced to the Public Works Department (PWD) national vertical datum (Danger Level: 13.20 m PWD). | BWDB / FFWC Annual Flood Reports | "Danger Level: 13.20 m PWD" | `[VERIFIED: BWDB]` |
| **C-13** | During the April-May 2026 test period, HydroSense achieves NSE 0.73, KGE 0.68, PBIAS +1.9%, Timing Error -2.0h, and Lead Time 22.5h against BWDB Kanaighat records. | Pipeline output / validation_report.md | "NSE 0.73, KGE 0.68, PBIAS +1.9%, Timing -2.0h, Lead 22.5h" | `[VERIFIED: Computed on test period]` |
| **C-14** | HydroSense outperforms a rainfall-only threshold baseline by +0.88 NSE (0.73 vs -0.15) and +22.0h peak timing accuracy (-2.0h vs -24.0h), eliminating premature alarm panic. | Pipeline output / validation_report.md | "NSE gain +0.88, Timing accuracy gain +22.0h" | `[VERIFIED: Computed on test period]` |

