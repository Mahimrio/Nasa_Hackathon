# Source Registry and Provenance Manifest Evidence

**Document ID:** `docs/evidence/source_registry_and_manifest.md`  
**Gate:** Gate 1 (Data provenance and truthful claims) & `SYNTHETIC_DATA.md` Requirements 1–3, 6, 9  
**Date:** 2026-10-24  
**Status:** `VERIFIED`  
**Verification Command:** `python scripts/audit_provenance.py`  
**Result:** `PROVENANCE AUDIT PASSED: 4 files, all checksums and labels match`  

---

## 1. Provenance Classification Policy

Every dataset, input file, and exported artifact is strictly classified into one of four mutually exclusive categories defined in `pipeline/provenance.py`:

- **`REAL`**: Authentic data retrieved from an official source (NASA PO.DAAC, GES DISC, BWDB, OpenStreetMap) with verified URLs, product version, retrieval timestamps, station IDs, license, and immutable SHA-256 hash.
- **`SYNTHETIC`**: Procedurally generated test cases created by project scripts (e.g., `scripts/generate_fixtures.py`) using deterministic random seeds. Never presented as real-world observation.
- **`MIXED`**: Datasets containing both real and synthetic records. Prohibited unless provenance is explicitly attached per row/cell.
- **`UNKNOWN`**: Unverified or un-audited legacy files. Treated as unsafe for scientific claims and blocked from real-data assertions.

---

## 2. Complete Inventory of Repository Data Artifacts

| Relative Path | Classification | Generator / Source | Seed / Version | SHA-256 Digest | Status & Limitations |
|---|---|---|---|---|---|
| `data/fixtures/swot_reaches.nc` | **`SYNTHETIC`** | `scripts/generate_fixtures.py` | Seed 42, v2.0.0 | `fb52245a3299a17bdf9dd8f5dd7ba039cd417d85501face31f0136b7a00e7674` | Verified. 4 reaches, 207 sinusoidal/noisy passes. Test scenario only. |
| `data/fixtures/swot_event.nc` | **`SYNTHETIC`** | `scripts/generate_fixtures.py` | Seed 42, v2.0.0 | `7c446bd8573017131fcade45717538c5d396ddfe80cabea70ed18aa67f1d6a68` | Verified. 5 April–May 2026 event passes. Hand-crafted test profile. |
| `data/fixtures/imerg_map.nc` | **`SYNTHETIC`** | `scripts/generate_fixtures.py` | Seed 42, v2.0.0 | `f72a1f6db7e9c6518f5acad04ecd543ec1c7453e42dd2ac35cd7d80b7d6cc06a` | Verified. 20,496 half-hourly steps (2020–2026). Exponential noise + Gaussian pulses. |
| `data/fixtures/gauge_kanaighat.csv` | **`SYNTHETIC`** | `scripts/generate_fixtures.py` | Seed 42, v2.0.0 | `68c0d0e28446ed8c689de31ecbaf4ea30da627207a955c4b195dad0fa8e37fab` | Verified. 10,248 hourly water levels. Base 7.45m + Gaussian rises. |
| `ui/public/data/reach_geometries.json` | **`REAL`** | OpenStreetMap Relations `5904030` & `5904029` | OSM Overpass API | Verified | Genuine river centerline meanders with 1,719 vertices mapped to SWORD IDs. |
| `ui/public/data/metrics_summary.json` | **`SYNTHETIC`** | `scripts/export_json.py` | v2.0.0 | Verified | Explicit `provenance: "SYNTHETIC"`, `validation_category: "synthetic_engineering_test"`. |
| `ui/public/data/event_timeseries.json` | **`SYNTHETIC`** | `scripts/export_json.py` | v2.0.0 | Verified | Synthetic hydrograph simulation timeseries for April–May 2026 scenario. |

---

## 3. Machine-Readable Manifest (`data/fixtures/PROVENANCE.json`)

The manifest is generated deterministically by `scripts/generate_fixtures.py` via `pipeline.provenance.write_manifest()`. Its schema adheres to Schema Version 1.0:

```json
{
  "schema_version": "1.0",
  "generated_at": "2026-10-24T14:40:02+00:00",
  "datasets": [
    {
      "dataset_id": "hydrosense-fixture-swot_reaches.nc",
      "file_path": "data/fixtures/swot_reaches.nc",
      "generator": "scripts/generate_fixtures.py",
      "generator_version": "2.0.0",
      "provenance": "SYNTHETIC",
      "random_seed": 42,
      "sha256": "fb52245a3299a17bdf9dd8f5dd7ba039cd417d85501face31f0136b7a00e7674",
      "temporal_coverage": "2020-01-10/2026-03-25 UTC",
      "units": { "slope2": "m/m", "width": "m", "wse": "m" },
      "variables": ["wse", "width", "slope2", "wse_u", "slope_u", "quality_f", "dark_frac"]
    }, ...
  ]
}
```

---

## 4. End-to-End Truthful Propagation

1. **NetCDF Metadata:** All NetCDF global attributes explicitly declare:
   - `provenance = "SYNTHETIC"`
   - `source = "HydroSense fixture generator; not a NASA retrieval"`
2. **CSV Metadata:** `data/fixtures/gauge_kanaighat.csv` contains explicit columns:
   - `provenance: SYNTHETIC`
   - `source: HydroSense fixture generator; not a BWDB/FFWC observation`
3. **UI Display:** All dashboard routes render the global `ProvenanceNotice` component, informing the user that values represent synthetic scenarios. Metric panels explicitly display the badge **"SYNTHETIC SCENARIO — ENGINEERING TEST ONLY"**.
4. **Audit Enforcement:** `scripts/audit_provenance.py` enforces these constraints on every run and raises `ProvenanceError` if any file or metric export violates the policy.
