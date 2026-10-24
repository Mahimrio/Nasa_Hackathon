# Repository Audit Register and Execution-Path Map

**Document ID:** `docs/evidence/repository_audit_register.md`  
**Gate:** Gate 0 (Repository audit and official challenge lock)  
**Date:** 2026-10-24  
**Audit Baseline:** Complete repository inventory and entry-point trace  
**Verification Command:** `python scripts/audit_provenance.py && pytest tests/ -v && npm --prefix ui run lint && npm --prefix ui run build`  

---

## 1. Executive Summary & Audit Scope

This audit register establishes the verified baseline of the HydroSense-SWOT codebase. Every tracked source file, pipeline module, test suite, export pipeline, UI route, and data artifact was inspected directly. 

| Layer | Component | Location | Implementation Status | Data Status |
|---|---|---|---|---|
| **Pipeline Core** | Manning Roughness Calibration | `pipeline/manning_calibration.py` | Implemented, Verified (unit tests) | Offline calibration interface |
| **Pipeline Core** | Muskingum-Cunge Wave Routing | `pipeline/muskingum_cunge.py` | Implemented, Verified (unit tests) | 4-subreach dynamic wave cascade |
| **Pipeline Core** | Causal Harvest Decision Logic | `pipeline/harvest_flag.py` | Implemented, Verified (unit tests) | Causal, no look-ahead |
| **Pipeline Core** | Scientific Metrics Suite | `pipeline/metrics.py` | Implemented, Verified (unit tests) | Lead time N/A without issue-time forecast |
| **Pipeline Core** | Validation Reporting Engine | `pipeline/validation_report.py` | Implemented, Verified (unit tests) | Hermetic, output-dir parameterized |
| **Pipeline Core** | Provenance Contracts | `pipeline/provenance.py` | Implemented, Verified (unit tests) | Fail-closed manifest validator |
| **Ingestion** | Real SWOT RiverSP Ingestion | `pipeline/ingest_swot.py` | Implemented, Verified | Fails closed without credentials |
| **Ingestion** | Real GPM IMERG Ingestion | `pipeline/ingest_imerg.py` | Implemented, Verified | Fails closed without remote auth |
| **Ingestion** | Real BWDB Gauge Ingestion | `pipeline/ingest_gauge.py` | Implemented, Verified | Fails closed without remote auth |
| **Module 2** | Haor Rainfall Trend Explorer | `trend_explorer/analysis.py` | Implemented, Verified (unit tests) | Fails closed on synthetic data |
| **Fixtures** | Scenario Fixture Generator | `scripts/generate_fixtures.py` | Implemented, Verified | Deterministic seed 42, `--output-dir` support |
| **Audit CLI** | Provenance Auditor | `scripts/audit_provenance.py` | Implemented, Verified | Audits manifest hashes & UI labels |
| **UI** | Next.js 16 App Router UI | `ui/` | Implemented, Verified (lint & build) | Static hydration from `ui/public/data/` |
| **CI** | GitHub Actions CI Workflow | `.github/workflows/ci.yml` | Implemented, Verified | Automated test, lint, and build gate |

---

## 2. End-to-End Execution Path Trace

The diagram below documents the verified data and execution flow through the application:

```
[NASA Earthdata / BWDB / FFWC] (Remote Ingestion: pipeline/ingest_*.py - Fails closed if absent)
             │
             ▼
    [data/fixtures/*.nc, *.csv] ── (Tagged provenance=SYNTHETIC, seed=42)
             │
             ├─────────────────────────────────────────────────┐
             │                                                 │
             ▼                                                 ▼
[pipeline/manning_calibration.py]             [pipeline/muskingum_cunge.py]
  (Manning n bounded in [0.025, 0.10])           (Dynamic celerity c = 5/3 V)
             │                                                 │
             └───────────────────────┬─────────────────────────┘
                                     ▼
                        [pipeline/harvest_flag.py]
                   (Causal classification, zero future lookahead)
                                     │
                                     ▼
                         [pipeline/metrics.py]
                  (NSE, KGE, PBIAS, Timing Error; Lead Time N/A)
                                     │
                                     ▼
                        [scripts/export_json.py]
                                     │
                                     ▼
                    [ui/public/data/*.json exports]
             (Explicit provenance="SYNTHETIC", category="synthetic_engineering_test")
                                     │
                                     ▼
                          [Next.js 16 Dashboard]
            Routes: / (Triage), /dashboard, /forecast, /advisory, /trends
              - ProvenanceNotice displayed across all routes
              - Recharts Hydrograph, Leaflet Meander Map, Harvest Flag
```

---

## 3. Inventory of Tracked Core Files

### 3.1 Python Scientific Stack
- `pipeline/__init__.py`: Package init.
- `pipeline/provenance.py`: Provenance contracts, SHA-256 validation, manifest reader/writer.
- `pipeline/manning_calibration.py`: Bounded scipy optimization for Manning's $n$.
- `pipeline/muskingum_cunge.py`: 4-subreach Muskingum-Cunge hydraulic routing.
- `pipeline/harvest_flag.py`: Causal GREEN/AMBER/RED status determination with bilingual advisory copy.
- `pipeline/metrics.py`: Hydrological statistics (NSE, KGE, PBIAS, peak timing error, observable lead time).
- `pipeline/validation_report.py`: Validation report and matplotlib diagnostic plots.
- `pipeline/run_pipeline.py`: Orchestrator executing the 7-step hydrologic pipeline.
- `pipeline/sensitivity.py`: Parameter sensitivity testing matrix.
- `pipeline/ingest_swot.py`: NASA Earthdata / Hydrocron ingestion with 6 quality gates.
- `pipeline/ingest_imerg.py`: GPM IMERG 30-minute precipitation ingestion with -30m timestamp shift.
- `pipeline/ingest_gauge.py`: BWDB gauge ingestion with BST-to-UTC conversion and median filtering.
- `pipeline/ingest_sword.py`: SWORD reach database filter.
- `trend_explorer/analysis.py`: Module 2 rainfall trend detection (Theil-Sen slope, modified Mann-Kendall).

### 3.2 Frontend (Next.js 16 App Router)
- `ui/app/layout.js`: Root layout with `ProvenanceNotice`, theme script, and font preconnects.
- `ui/app/page.js`: Main triage dashboard page.
- `ui/app/dashboard/page.js`: Full-screen analytical dashboard view.
- `ui/app/forecast/page.js`: Dedicated forecast timeline and hydrograph replay.
- `ui/app/advisory/page.js`: Agricultural bulletin view for extension officers.
- `ui/app/trends/page.js`: Module 2 Rainfall Trend Explorer view.
- `ui/app/components/ProvenanceNotice.js`: Prominent bilingual synthetic-demonstration notice.
- `ui/app/components/AppHeader.js`: Aligned brand header with navigation and EN/BN toggle.
- `ui/app/components/RiverMapPanel.js` & `InteractiveMapLeaflet.js`: River reach map with OSM meanders.
- `ui/app/components/HydrographPanel.js`: Interactive dual-axis hydrograph with uncertainty fill.
- `ui/app/components/ValidationMetricsPanel.js`: Metric cards with explicit synthetic provenance badges.
- `ui/app/components/OperationalLimitsPanel.js`: Expandable scientific limitations panel.
- `ui/app/components/AdvisoryBulletinModal.js`: Bilingual agricultural advisory bulletin modal.
- `ui/app/components/ModelArchitectureModal.js`: Pipeline architecture explanation modal.

---

## 4. Uninspected Large / Binary Files Register

| File Path | File Type | Size | Audit Reason & Safety Assessment |
|---|---|---|---|
| `Space-Apps-Challenge-Participants-Guide.pdf` | PDF Document | 1.49 MB | Official competition participants guide for rules and judging reference. Non-executable. |
| `data/fixtures/*.nc` | NetCDF4 Binary | ~500 KB each | Procedural fixture files. Loaded and validated via xarray/netCDF4 in unit test suite. |
| `data/processed/validation_plots/*.png` | PNG Images | ~400 KB each | Matplotlib output figures generated by validation reporting suite. |

---

## 5. Verification Command Output

The baseline verification commands were executed on 2026-10-24:
1. `python scripts/audit_provenance.py` -> `PROVENANCE AUDIT PASSED: 4 files, all checksums and labels match` (Exit code 0).
2. `pytest tests/ -v` -> `48 passed, 7 warnings in 13.34s` (Exit code 0).
3. `npm --prefix ui run lint` -> `0 errors, 0 warnings` (Exit code 0).
4. `npm --prefix ui run build` -> Compiled successfully in 987ms; all 8 static pages generated (Exit code 0).
