# Contributing to HydroSense-SWOT

Thank you for your interest in contributing to **HydroSense-SWOT**! We welcome researchers, hydrologists, data scientists, software engineers, and agrarian advocates working to make satellite Earth observation actionable for vulnerable communities.

HydroSense-SWOT was built for the **NASA International Space Apps Challenge 2026** under the challenge [*"Be An Earth System Trend Detective!"*](https://www.spaceappschallenge.org/). Our mission combines rigorous multi-decadal Earth system trend detection with actionable, physics-based flood routing to protect agrarian communities in Bangladesh's Haor basin.

---

## 🏛️ Repository Architecture

The project is structured as a decoupled monorepo separating scientific hydrologic pipelines, trend detection engines, and an interactive Next.js web application:

```
HydroSense-SWOT/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Automated CI: Pytest, provenance audit, lint, Next.js build
├── data/
│   ├── fixtures/                  # Hermetic synthetic benchmark fixtures (SYNTHETIC_DEMO)
│   │   ├── PROVENANCE.json        # Cryptographic checksum manifest for fixtures
│   │   ├── gauge_kanaighat.csv    # Synthetic stage benchmark
│   │   ├── imerg_map.nc           # Synthetic gridded rainfall fixture
│   │   └── swot_reaches.nc        # Synthetic KaRIn reach vectors
│   ├── real/                      # Authentic NASA Earth observation inputs (fail-closed)
│   │   ├── PROVENANCE.json        # PO.DAAC / GES DISC / BWDB cryptographic registry
│   │   ├── basin_geometry.json    # Transboundary Barak & local Sylhet basin polygons
│   │   ├── gauge_sw266.csv        # Ground truth stage readings (BWDB Station SW266)
│   │   ├── imerg_map.nc           # NASA GPM IMERG Early half-hourly precipitation
│   │   └── swot_reaches.nc        # NASA SWOT KaRIn RiverSP reach geometry (19 reaches)
│   ├── trends/                    # Module 2: 25-Year NASA GPM IMERG Final Run extracts
│   │   ├── PROVENANCE.json        # SHA-256 ledger for 1,525 daily granules (2001–2025)
│   │   ├── imerg_sylhet_2001_2025.nc # Combined NetCDF4 dataset for trend analysis
│   │   └── staging/               # Per-year verified IMERG netCDF4 slices & checksums
│   ├── json_export/               # Serialized pipeline outputs consumed by UI
│   └── processed/                 # Calibration plots, sensitivity curves & ablation data
│
├── pipeline/                      # Core Hydrologic & Routing Scientific Engine
│   ├── __init__.py                # Package initialization
│   ├── baseline.py                # Persistence & threshold baseline benchmarks
│   ├── calibration_diagnostics.py # Diagnostic hyetograph/hydrograph plotting
│   ├── harvest_flag.py            # 3-tier agrarian triage classification logic
│   ├── ingest_gauge.py            # BWDB ground stage parser & PWD datum ties
│   ├── ingest_hydrosheds.py       # HydroBASINS level 8 sub-basin boundary parser
│   ├── ingest_imerg.py            # GPM IMERG Early precipitation raster extractor
│   ├── ingest_sword.py            # SWORD reach topology reader & network graph
│   ├── ingest_swot.py             # SWOT RiverSP NetCDF/Shapefile reach ingestion
│   ├── manning_calibration.py     # Channel roughness (n) estimation & calibration
│   ├── metrics.py                 # NSE, KGE, PBIAS, MAE, and timing error metrics
│   ├── muskingum_cunge.py         # Nonlinear variable-parameter kinematic routing
│   ├── provenance.py              # Fail-closed SHA-256 verification firewall
│   ├── run_pipeline.py            # Main CLI pipeline dispatcher (--mode demo | real)
│   ├── sensitivity.py             # Parameter sensitivity & Morris screening
│   └── validation_report.py       # Formal validation & diagnostic generator
│
├── trend_explorer/                # Module 2: Earth System Trend Detective Engine
│   ├── __init__.py                # Module initialization
│   ├── analysis.py                # Theil-Sen, Hamed-Rao MMK, Holm-Bonferroni, PRCPTOT/R50
│   └── ingest_imerg.py            # Earthdata CMR search & OPeNDAP automated granule ingest
│
├── scripts/                       # Operational & Scientific Automation Utilities
│   ├── audit_provenance.py        # Fail-closed validation CLI for all data registries
│   ├── build_reach_geometries.py  # Generates simplified GeoJSON river lines for map
│   ├── delineate_basin_geometry.py# Delineates catchment polygons from HydroBASINS
│   ├── evaluate_real_hindcast.py  # Evaluates May-June 2024 flood hindcast against SW266
│   ├── export_json.py             # Exports scientific arrays into web-ready JSON feeds
│   ├── generate_fixtures.py       # Hermetic synthetic fixture generator
│   └── run_trend_analysis.py      # Executes multi-zone climatological trend suite
│
├── tests/                         # Pytest Verification Suite (106 hermetic unit tests)
│   ├── test_audit_provenance.py   # Manifest validation & SHA-256 integrity tests
│   ├── test_calibration_real.py   # Manning roughness calibration assertions
│   ├── test_calibration_refusal.py# Verifies model refuses calibration on bad slopes
│   ├── test_geographic_highlights.py # Zone boundary and coordinate tests
│   ├── test_gilbert_ci.py         # Analytical Sen-Kendall confidence interval tests
│   ├── test_identifiability.py    # Parameter identifiability under equifinality
│   ├── test_metrics_lead_sign.py  # Lead time sign convention & leakage checks
│   ├── test_pipeline_modes.py     # Dual-mode (demo vs real) separation tests
│   ├── test_real_hindcast.py      # Real data hindcast evaluation assertions
│   ├── test_routing_regime.py     # Muskingum-Cunge Courant & Reynolds stability
│   └── test_trend_analysis.py     # Modified Mann-Kendall & Theil-Sen unit tests
│
├── ui/                            # Interactive Web Dashboard (Next.js 16 + React 19)
│   ├── app/                       # Next.js App Router
│   │   ├── layout.js              # Global root layout, font preloads & meta
│   │   ├── page.js                # Landing overview redirect & splash hero
│   │   ├── dashboard/page.js      # Primary operational monitoring view
│   │   ├── forecast/page.js       # Hydrologic hydrographs & diagnostic stage curves
│   │   ├── advisory/page.js       # Agrarian harvesting decision matrix & triage
│   │   ├── trends/page.js         # Module 2 NASA Trend Detective interactive viewer
│   │   ├── components/            # Reusable UI component library
│   │   │   ├── AppHeader.js       # Top brand bar, telemetry status & navigation
│   │   │   ├── InteractiveMap.js  # GIS map component (MapLibre GL & Leaflet)
│   │   │   ├── HydrographPanel.js # Recharts water-level & precipitation timeseries
│   │   │   ├── ProvenanceNotice.js# Live provenance badge & scientific data tier notice
│   │   │   ├── TrendExplorerViewer.js # 25-year trend visualizer & zone selector
│   │   │   └── ValidationMetricsPanel.js # NSE/KGE/PBIAS scientific scoreboard
│   │   ├── context/               # TelemetryContext (time, metrics, active date)
│   │   ├── hooks/                 # useLocale (bilingual en/bn language switcher)
│   │   ├── locales/               # en.json & bn.json translation dictionaries
│   │   ├── globals.css            # Design tokens, CSS variables & typography
│   │   ├── mocha-blend.css        # Warm agrarian palette (roasted mocha & lavender)
│   │   └── shell.css              # Responsive grids & container layout
│   ├── public/                    # Static assets & client JSON feeds
│   │   ├── data/                  # Serialized data files (trend_summary.json, etc.)
│   │   └── logo-mocha.svg         # HydroSense-SWOT SVG brand marks
│   ├── package.json               # Node.js dependencies & scripts
│   └── next.config.mjs            # Next.js build configuration
│
├── .env.example                   # Environment configuration template
├── .gitattributes                 # Git LFS & line ending normalization
├── .gitignore                     # Repository exclusion rules
├── CONTRIBUTING.md                # Contribution guidelines (this file)
├── LICENSE                        # MIT Open Source License
├── pytest.ini                     # Pytest runner configuration
├── README.md                      # Primary project overview & challenge answer
└── requirements.txt               # Python scientific dependencies
```

---

## 🎯 Core Engineering Principles

Every contribution must honor our foundational scientific and engineering constraints:

### 1. Fail-Closed Cryptographic Provenance
* Never bypass input data verification.
* All data ingested in `--mode real` or Module 2 must be declared in `data/real/PROVENANCE.json` or `data/trends/PROVENANCE.json` with genuine SHA-256 hashes, source URLs, and retrieval timestamps.
* If a file checksum does not match, the pipeline **must exit with code 1** rather than silently falling back to synthetic data.

### 2. Epistemological Honesty
* **No Unsubstantiated Operational Lead Time:** Unless an issue-time causal hindcast has been formally run, operational warning lead time must be reported honestly as `N/A`.
* **Climatology vs. Forecasting:** 25-year rainfall trends (Module 2) describe decadal Earth system behavior. Never frame long-term trends as 24–48h operational flood predictions.
* **SWOT Mission Limitations:** SWOT KaRIn altimetry launched in Dec 2022 (~3 years of data). Do not use SWOT for decadal climatological trends; its role is channel geometry parameterization.

### 3. Dual-Mode Isolation
* Demo fixtures (`SYNTHETIC_DEMO`) must remain hermetically sealed in `data/fixtures/` for unit tests and offline demos.
* Real data must never leak into synthetic demo evaluations, and vice versa.

### 4. Layout-Stable Bilingual UI (English & Bengali)
* All user-facing strings must have corresponding keys in both `ui/app/locales/en.json` and `ui/app/locales/bn.json`.
* UI components must use `Noto Sans Bengali` fallback stacks and avoid Unicode characters that render as tofu boxes (`□`) in monospace containers.

---

## 🛠️ Development Workflow

### Prerequisites
* **Python:** 3.11 or higher
* **Node.js:** 20.x or higher (npm 10+)
* **Git:** 2.40 or higher

### 1. Setting Up the Environment

```bash
# 1. Clone the repository
git clone https://github.com/Mahimrio/Nasa_Hackathon.git
cd Nasa_Hackathon

# 2. Configure Python virtual environment
python -m venv .venv
# On Linux/macOS:
source .venv/bin/activate
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1

# 3. Install Python scientific dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install pytest

# 4. Install Next.js frontend dependencies
cd ui
npm install
cd ..
```

### 2. Running the Full Test Suite

Before making any changes, verify that the existing test suite passes:

```bash
# Run all 106 hermetic unit tests
python -m pytest tests/ -v

# Audit data provenance manifests
python scripts/audit_provenance.py
```

### 3. Running the Development Server

```bash
cd ui
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live dashboard.

### 4. Linting & Formatting

```bash
# Frontend linting
cd ui
npm run lint

# Production build verification
npm run build
```

---

## 📝 Commit Conventions

We follow the **Conventional Commits** specification:

* `feat:` A new feature or algorithm (e.g. `feat(routing): implement variable-parameter celerity`)
* `fix:` A bug fix (e.g. `fix(ui): unconstrain NASA badge width in header`)
* `docs:` Documentation additions or updates (e.g. `docs: update dataset links in README`)
* `test:` Adding or updating unit tests (e.g. `test: add Hamed-Rao MMK autocorrelation test`)
* `refactor:` Code restructuring that does not change functional behavior
* `chore:` Build scripts, `.gitignore`, or package dependency updates

---

## 🚀 Pull Request Checklist

Before submitting a Pull Request:

1. [ ] Branch from `main` with a descriptive name (`feature/xyz`, `fix/abc`).
2. [ ] All 106 unit tests pass (`python -m pytest tests/ -v`).
3. [ ] Provenance audit succeeds (`python scripts/audit_provenance.py`).
4. [ ] Frontend builds without warnings or errors (`cd ui && npm run build`).
5. [ ] No unnecessary files, agent prompt logs, or cache directories are committed.
6. [ ] Both English (`en.json`) and Bengali (`bn.json`) translations are updated for any new UI text.
7. [ ] PR description clearly explains the changes and references any related issue.

---

## 🤝 Code of Conduct

We are committed to providing a welcoming, inclusive, and scientifically honest environment. All contributors are expected to uphold respectful collaboration, open scientific discourse, and intellectual integrity.

Thank you for helping us advance Earth observation science for real-world impact!
