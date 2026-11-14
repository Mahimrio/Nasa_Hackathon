# HydroSense-SWOT

[![NASA Space Apps 2026](https://img.shields.io/badge/NASA%20Space%20Apps%20Challenge-2026-orange.svg?style=flat-square)](https://www.spaceappschallenge.org/)
[![Challenge: Be An Earth System Trend Detective!](https://img.shields.io/badge/Challenge-Earth%20System%20Trend%20Detective-blue.svg?style=flat-square)](https://www.spaceappschallenge.org/)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-3776AB.svg?style=flat-square&logo=python&logoColor=white)](https://www.python.org/downloads/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.6-black.svg?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> **Decadal Earth System Trend Detection Meets Real-Time Agrarian Flood Warning in Northeastern Bangladesh**  
> Developed by **Team AUSTrology** for the **NASA International Space Apps Challenge 2026**.

---

## 🛰️ NASA Space Apps Challenge 2026

### **Challenge:** [*“Be An Earth System Trend Detective!”*](https://www.spaceappschallenge.org/)
* **Challenge Prompt:** Earth observation satellites capture changes across our planet over days, months, and decades. The challenge tasks teams to investigate Earth observation datasets to detect environmental trends, identify underlying drivers, evaluate significance against natural variability, and translate these findings into actionable, community-level solutions.
* **Our Investigation:** In the flash-flood-vulnerable Haor basin of northeastern Bangladesh, ripening Boro rice feeds over 20 million people. We investigate **25 years (2001–2025) of authentic NASA satellite observations** to detect whether pre-monsoon precipitation patterns are intensifying, and connect those climate trends to actionable agricultural flood advisory.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   HYDROSENSE-SWOT                                      │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│   MODULE 2: EARTH SYSTEM TREND DETECTIVE  │   MODULE 1: AGRARIAN FLOOD ROUTING & TRIAGE│
│   (Primary NASA Challenge Submission)     │   (Downstream Societal Impact Application) │
│                                           │                                            │
│   • 25 Years of NASA GPM IMERG Final Run  │   • NASA SWOT RiverSP KaRIn Radar Reaches  │
│   • Cell-First Accumulation (PRCPTOT, R50)│   • GPM IMERG Early Half-Hourly Routing    │
│   • Theil-Sen Slopes + 95% Sen-Kendall CI │   • Muskingum-Cunge In-Channel Hydraulics  │
│   • Hamed-Rao Modified Mann-Kendall Test  │   • 3-Tier Harvest Advisory for Boro Rice  │
│   • Multi-Zone Regional Analysis          │   • Dual Mode: Synthetic Demo & Hindcast   │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

---

## 📊 Datasets & Earth Observation Sources

Every dataset utilized in HydroSense-SWOT is cryptographically tracked with SHA-256 checksums in `data/real/PROVENANCE.json` and `data/trends/PROVENANCE.json`:

| Dataset | Provider / Platform | Product Version | Spatial / Temporal Resolution | Official DOI & Catalog Links | Project Role |
|:---|:---|:---|:---|:---|:---|
| **NASA GPM IMERG Final Run** | NASA GES DISC / Earthdata | `GPM_3IMERGDF` V07B | 0.1° × 0.1°, Daily (2001–2025) | [GES DISC Dataset](https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGDF_07/summary) <br> **DOI:** [`10.5067/GPM/IMERGDF/DAY/07`](https://doi.org/10.5067/GPM/IMERGDF/DAY/07) <br> **CMR:** `C2723754864-GES_DISC` | **Module 2:** 25-year pre-monsoon ($PRCPTOT_{AM}$, $R50mm$) trend detection across 1,525 daily granules |
| **NASA SWOT RiverSP Reach** | NASA PO.DAAC / Earthdata | `SWOT_L2_HR_RiverSP_reach_D` (v2.0) | Reach vectors, KaRIn Radar (~21-day orbit) | [PO.DAAC Dataset](https://podaac.jpl.nasa.gov/dataset/SWOT_L2_HR_RiverSP_2.0) <br> **DOI:** [`10.5067/SWOT-RIVER-SP-2.0`](https://doi.org/10.5067/SWOT-RIVER-SP-2.0) <br> **CMR:** `C2849924510-POCLOUD` | **Module 1:** Channel parameterization (WSE, slope $S_0$, reach width $W$) for 19 Surma River reaches |
| **NASA GPM IMERG Early Run** | NASA GES DISC / Earthdata | `GPM_3IMERGHHE` (3B-HHR-E) V07B | 0.1° × 0.1°, 30-min Near-Real-Time | [GES DISC Dataset](https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGHHE_07/summary) <br> **DOI:** [`10.5067/GPM/IMERGHHE/07`](https://doi.org/10.5067/GPM/IMERGHHE/07) <br> **CMR:** `C2723754867-GES_DISC` | **Module 1:** 431 precipitation intervals driving the May 26 – June 3, 2024 flash-flood routing hindcast |
| **SWORD Global River Database** | ReachHydro / University of North Carolina | SWORD v16 (High-Res Hydrography) | Global reach topology & cross-sections | [SWORD Project Portal](https://www.reachhydro.org/home/params/sword) | Connects 19 Surma River reach IDs (`45220400501`–`45220400591`) with upstream transboundary topology |
| **HydroBASINS (HydroSHEDS)** | USGS / WWF / HydroSHEDS | Level 08 Sub-basins | Global 15 arc-sec polygon catchments | [HydroSHEDS Portal](https://www.hydrosheds.org/products/hydrobasins) | Catchment area delineation ($425\text{ km}^2$ local quickflow, $26,200\text{ km}^2$ transboundary Barak basin) |
| **BWDB Kanaighat River Gauge** | Bangladesh Water Development Board (BWDB) / FFWC | Station `SW266` | Discrete ground water level (m PWD) | [BWDB / FFWC Portal](http://www.ffwc.gov.bd/) | Ground truth benchmark & danger level ($13.20\text{ m PWD} = 12.75\text{ m MSL}$) for May–June 2024 event |

---

## 🔬 Core System Architecture

HydroSense-SWOT is decoupled into two complementary modules:

### 1. Primary Submission: Module 2 — Haor Rainfall Trend Explorer
* **Scientific Focus:** Solves the NASA Space Apps prompt by executing rigorous non-parametric statistical climatology over 25 years of daily satellite precipitation.
* **Precipitation Indices:**
  - $PRCPTOT_{AM}$: Total pre-monsoon precipitation accumulation (April 1 – May 31).
  - $R50mm_{AM}$: Extreme precipitation day count ($\ge 50\text{ mm/day}$ within April–May).
* **Statistical Methods:**
  - **Cell-First Aggregation:** Granular pixel-level integration preventing spatial averaging bias over complex topography.
  - **Theil–Sen Slope Estimation ($\beta$):** Median of pairwise slopes across 25 years, robust against anomalous outlier years.
  - **Analytical 95% Sen-Kendall CI:** Confidence intervals computed directly from rank distributions.
  - **Modified Mann-Kendall (Hamed & Rao 1998):** Corrects test variance for lag-1 serial autocorrelation ($|r_1| \ge 0.392$).
  - **Holm-Bonferroni Correction:** Controls family-wise error across multiple zones (Sylhet Basin, Meghalaya Headwaters, Barak Watershed).

### 2. Secondary Application: Module 1 — Agrarian Flood Routing & Triage
* **Agricultural Problem:** Boro rice is harvested in late April through May. Early flash floods overtop submersible embankments in hours, wiping out months of agricultural investment.
* **Dual Operation Modes:**
  - `--mode real`: Ingests authentic NASA SWOT KaRIn reach vectors and GPM IMERG Early half-hourly precipitation for an exploratory retrospective hindcast of the May 28 – June 4, 2024 flash flood.
  - `--mode demo`: Hermetic synthetic engineering fixtures for offline evaluations without external network dependencies.
* **Hydrologic Routing:** Muskingum-Cunge non-linear kinematic-wave formulation parameterizing wave celerity ($c$) and hydraulic diffusion ($D$) using SWOT reach slopes and widths.
* **Actionable 3-Tier Advisory:** Translates water level rates-of-rise into farmer action plans:
  1. *NORMAL / STABLE:* Routine ripening and field maintenance.
  2. *WATCH / ELEVATED:* Mobilize mechanical harvesters; drain low-lying polders.
  3. *WARNING / IMMINENT OVERTOPPING:* Emergency 80%-maturity grain harvesting.

---

## 💻 Tech Stack & Design System

* **Frontend:** Next.js 16.4.6 (Turbopack, App Router, React 19)
* **Cartography & Charts:** MapLibre GL, Leaflet, Recharts, SVG SurfaceFX
* **Scientific Backend:** Python 3.11+, NumPy, SciPy, Pandas, Xarray, NetCDF4
* **Typography:** Fraunces (Editorial Display), Manrope (Interface), IBM Plex Mono (Data), Noto Sans Bengali (বাংলা)
* **Design Language:** Calm agrarian aesthetic — Roasted Mocha (`#1D130D`), Platinum Silver (`#E8E4DE`), and Pale Lavender (`#CDDEF0`), fully responsive from mobile screens through wide desktop displays.

---

## 🚀 Quick Start Guide

### 1. Clone & Setup
```bash
git clone https://github.com/Mahimrio/Nasa_Hackathon.git
cd Nasa_Hackathon
```

### 2. Python Environment & Scientific Verification
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run full test suite (106 hermetic unit tests)
python -m pytest tests/ -v
```

### 3. Run Web Dashboard
```bash
cd ui
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Production Build
```bash
cd ui
npm run build
npm run start -- -p 3000
```

---

## 🌐 Deployment

The web dashboard is fully optimized for Next.js zero-config deployment:

* **Vercel (Recommended):**
  1. Import [`Mahimrio/Nasa_Hackathon`](https://github.com/Mahimrio/Nasa_Hackathon) on [Vercel](https://vercel.com/new).
  2. In project configuration, set **Root Directory** to `ui`.
  3. Click **Deploy**.

---

## ⚖️ Operational Limitations & Epistemological Honesty

In strict adherence to scientific rigor and NASA Earth Science guidelines:
1. **Decoupled Climatology vs Forecast:** 25-year rainfall trends describe multi-decadal Earth system behavior. They do **not** predict the exact date, peak stage, or crest hour of next week's flood.
2. **SWOT Mission Lifetime:** NASA SWOT launched in December 2022 (~3 years on orbit). Under WMO climatological standards ($\ge 30$ years), SWOT cannot be used for decadal trend analysis. Its role is strictly hydraulic channel geometry calibration.
3. **No Unsubstantiated Forecast Lead-Time Claims:** Warning lead times are reported strictly as N/A in the absence of an operational, real-time issue-time product.
4. **Fail-Closed Provenance:** Every satellite input is validated against cryptographically registered SHA-256 manifests. Missing or altered inputs refuse execution automatically.

---

## 👥 Team AUSTrology — NASA Space Apps Challenge 2026

* **Fazle Rabbi Mugdho** — Systems Architecture & Scientific Algorithms
* **Mahim Abdullah Rianto** — Data Pipelines, Ingestion & Infrastructure
* **Taisha Tasnim Triti** — Geospatial Modeling & Hydrologic Research
* **Samia Rahman Arpita** — Quality Assurance, Standards & Compliance
* **Redwana Binte Jaman Tonima** — Product Strategy, Agrarian Impact & Media
* **Arko Saha** — Frontend Engineering, Cartography & Experience Design

---

## 📜 License
This project is licensed under the [MIT License](LICENSE) — free and open for community and educational advancement.
