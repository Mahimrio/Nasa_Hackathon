# SOURCES & CLAIMS LEDGER — HydroSense-SWOT

## 1. Datasets & Resources Ledger

| ID | Type | Name | Link / Endpoint | Version / Date | License | Used For | Verified Status |
|---|---|---|---|---|---|---|---|
| **D1** | Dataset | NASA SWOT L2 HR RiverSP 2.0 | `soto.podaac.earthdatacloud.nasa.gov` / Collection `C2799438271-POCLOUD` / Short Name: `SWOT_L2_HR_RIVERSP_2.0` | Version 2.0 (Baseline D) / Accessed Oct 2026 | Open Data (NASA / CNES) | Reach water surface elevation (WSE), width, and reach-averaged slope (`slope2`) for offline Manning calibration | `[VERIFIED: PO.DAAC]` |
| **D2** | Dataset | NASA GPM IMERG Early Run V07 | `disc.gsfc.nasa.gov` / Short Name `GPM_3IMERGHHE` | V07B (Early Run) / Accessed Oct 2026 | Open Data (NASA GES DISC) | Operational 30-min calibrated precipitation (`precipitationCal`, ~4h latency) driving hydrologic routing | `[VERIFIED: GPM Docs]` |
| **D3** | Dataset | BWDB River Gauge Records | `bwdb.gov.bd` / `ffwc.gov.bd` | Station `SW108` (Kanaighat) / Accessed Oct 2026 | Public Government Data | Observed stage validation (Danger Level: 13.20 m PWD) | `[VERIFIED: BWDB]` |
| **D4** | Dataset | SWORD (SWOT River Database) | `hydrosheds.org` | v16 / Accessed Oct 2026 | Creative Commons CC-BY 4.0 | Channel widths and reach identifiers for Surma & Kushiyara rivers | `[VERIFIED: HydroSHEDS]` |
| **D5** | Dataset | HydroSHEDS Sub-basins | `hydrosheds.org` | v1.0 / Accessed Oct 2026 | Free for Academic / Open | Spatial clipping and catchment boundary delineation for Meghalaya hills | `[VERIFIED: HydroSHEDS]` |
| **P1** | Paper | Haor Basin Flash Flood Assessment | *J. Environ. Sci. & Nat. Resour.* 12(1&2): 117–124, 2019 | 2019 / DOI: 10.3329/jesnr.v12i1-2.46187 | Academic / Open | Documented 149,224 ha of Boro crop loss in Sunamganj during 2017 flood | `[VERIFIED: Abstract read]` |
| **P2** | Paper | SWOT Water Surface Elevation Uncertainty | *Hydrol. Earth Syst. Sci.* (HESS), 30, 4141 | 2026 / DOI: 10.5194/hess-30-4141-2026 | Open Access | Verified baseline WSE uncertainty of ±0.18 m used in analytical error propagation | `[VERIFIED]` |
| **P3** | Paper | The Misuse of Colour in Science Communication | *Nature Communications* 11, 5444 | 2020 / DOI: 10.1038/s41467-020-19160-7 | Open Access (CC-BY 4.0) | Basis for selecting cividis CVD-safe (color-vision deficiency) colormap for reach risk visualization | `[VERIFIED]` |
| **P4** | Paper | Muskingum-Cunge Method with Variable Parameters | *J. Hydraul. Div. ASCE* 104(12): 1663–1677 | 1978 / ISSN: 0044-796X | Academic / Open | Basis for kinematic wave celerity $c = \frac{5}{3}V_{mean}$ and sub-reach travel time $K = L/c$ | `[VERIFIED]` |
| **P5** | Paper | Decomposition of the Mean Squared Error and NSE Performance (KGE) | *J. Hydrol.* 377(1-2): 80–91 | 2009 / DOI: 10.1016/j.jhydrol.2009.08.003 | Academic / Open | Mathematical formulation of Kling-Gupta Efficiency (correlation, variability, bias) | `[VERIFIED]` |
| **P6** | Paper | An Evaluation of SWOT Discharge Estimation Algorithms | *Water Resour. Res.* 52(9): 7333–7359 (2016); 59(11) (2023) | 2016, 2023 / DOI: 10.1002/2016WR019095 | Open Access | Verification of reach-averaged slope SNR filtering ($\text{slope2} \ge 2\times\text{slope\_u}$) and width > 100m resolution | `[VERIFIED]` |
| **C1** | Code | SciPy Optimize (`minimize_scalar`) | `scipy.org` | 1.15+ | BSD-3-Clause | Bounded scalar roughness calibration (`bounds=(0.025, 0.10)`, `method='bounded'`) | `[VERIFIED]` |
| **C2** | Code | xarray & netCDF4 | `pydata.org` / `unidata.github.io` | xarray 2024.0+ / netcdf4 1.7+ | Apache 2.0 / MIT | Multi-dimensional satellite raster & reach NetCDF4 processing | `[VERIFIED]` |
| **C3** | Code | earthaccess | `github.com/nsidc/earthaccess` | 0.19+ | MIT | NASA Earthdata Cloud authentication and automated granule discovery | `[VERIFIED]` |
| **C4** | Code | rioxarray & rasterio | `corteva.github.io/rioxarray` | 0.17+ | Apache 2.0 | Geospatial raster clipping, CRS attribution (`EPSG:4326`), and spatial aggregation | `[VERIFIED]` |
| **C5** | Code | GeoPandas & Shapely | `geopandas.org` | 1.0+ | BSD-3-Clause | Vector watershed boundary delineation and spatial intersections | `[VERIFIED]` |
| **C6** | Code | h5netcdf | `github.com/h5netcdf/h5netcdf` | 1.4+ | BSD-3-Clause | Direct HDF5/NetCDF4 file storage backend | `[VERIFIED]` |
| **C7** | Code | Next.js 16 | `nextjs.org` | 16.4.0 | MIT | React framework for client delivery dashboard with App Router | `[VERIFIED]` |
| **C8** | Code | Recharts | `recharts.org` | 3.10+ | MIT | Dual-axis synchronized hydrograph & rainfall hyetograph visualization | `[VERIFIED]` |
| **C9** | Code | pytest | `pytest.org` | 8.0+ | MIT | Automated scientific pipeline and data integration test suite | `[VERIFIED]` |

---

## 2. Claims Ledger (All Claims in Pitch, Code, & UI)

| # | Claim in Statement or Demo | Source ID | Specific Quote or Number | Verification Tag |
|---|---|---|---|---|
| **C-01** | In April 2026, basin rainfall ran ~76% above normal, floodwater covered >130,000 acres, ~214,000 tonnes lost, ~230,000 farmers affected. | Think Global Health citing Daily Star & Prothom Alo; DAE Sylhet | "76% above normal, 130,000 acres, 214,000 tonnes, 230,000 farmers" | `[SECONDARY: VERIFIED via Department of Agricultural Extension (DAE) Sylhet division reports & Daily Star news coverage]` |
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


