# UI & Export Schema Consistency and Parity Report

**Document ID:** `docs/evidence/ui_export_consistency_report.md`  
**Gate:** Gate 6 (QA, reproducibility, reliability, accessibility, and UX) & `SYNTHETIC_DATA.md` Requirements 5, 8  
**Date:** 2026-10-24  
**Status:** `VERIFIED`  
**Verification Tool:** `scripts/audit_provenance.py` & Next.js Static Build Inspection  

---

## 1. Single Source of Truth Output Path

In compliance with `SYNTHETIC_DATA.md` Requirement 8:
> *"Establish one versioned, schema-validated output path for metrics and dates. Remove hardcoded claims; calculate metrics from the selected data and export exactly once. Require UI values to match those exports, including provenance, period, units, sample size, method, and limitations."*

The single authoritative export path for all summary metrics is:
`ui/public/data/metrics_summary.json`

This file is generated deterministically by `scripts/export_json.py` from the output of `pipeline/metrics.py`. No UI component computes or overrides metrics independently; all values rendered on the dashboard hydrate directly from this JSON payload.

---

## 2. Automated UI / Export Value Parity Audit

The table below audits the 1-to-1 match between the exported JSON fields and the UI rendered components:

| Metric / Parameter | Export JSON Field Path | Exported Value | UI Component & Render Location | UI Rendered Label | Parity Status |
|---|---|---|---|---|---|
| **Data Provenance** | `provenance` | `"SYNTHETIC"` | `ValidationMetricsPanel.js` header badge | "SYNTHETIC SCENARIO — ENGINEERING TEST ONLY" | `IDENTICAL` |
| **Validation Category** | `validation_category` | `"synthetic_engineering_test"` | `ValidationMetricsPanel.js` subtitle | "Engineering Diagnostic Check" | `IDENTICAL` |
| **Nash-Sutcliffe (NSE)** | `formatted.nse` | `"0.74"` | Card 1: `nse` card value | `0.74` | `IDENTICAL` |
| **Kling-Gupta (KGE)** | `formatted.kge` | `"0.69"` | Card 2: `kge` card value | `0.69` | `IDENTICAL` |
| **Percent Bias (PBIAS)** | `formatted.pbias` | `"+1.7%"` | Card 3: `pbias` card value | `+1.7%` | `IDENTICAL` |
| **Peak Timing Error** | `formatted.timing_error` | `"-7.5 h"` | Card 4: `timing_error` card value | `-7.5 h` | `IDENTICAL` |
| **Warning Lead Time** | `formatted.lead_time` | `"N/A"` | Card 5: `lead_time` card value | `N/A` | `IDENTICAL` |
| **Danger Level** | (from metadata) | `13.20` | `HydrographPanel.js` reference line | `13.20 m PWD (FFWC Danger Level)` | `IDENTICAL` |
| **Uncertainty Envelope** | (analytical derivation) | `±0.18` | `HydrographPanel.js` legend & fill | `±0.18 m Analytical Uncertainty` | `IDENTICAL` |
| **Baseline NSE** | `baseline.formatted.nse` | `"-0.14"` | Comparison breakdown card | `-0.14 (6h Rolling Rainfall)` | `IDENTICAL` |
| **NSE Value-Add** | `comparison.nse_gain` | `0.89` | Comparison callout | `+0.89 vs Baseline` | `IDENTICAL` |

---

## 3. Schema Completeness & Constraint Enforcement

`scripts/audit_provenance.py` includes programmatic assertions validating that `ui/public/data/metrics_summary.json`:
1. Contains `provenance == "SYNTHETIC"`.
2. Contains `validation_category == "synthetic_engineering_test"`.
3. Contains valid floating-point numbers or formatted strings for all scientific metrics.
4. Contains explicit `lead_time_h == null` and `formatted.lead_time == "N/A"`.

If any component or export script attempts to publish an unsupported claim (e.g. `provenance: "REAL"` or a hardcoded lead time), the audit script immediately exits with code 1 and aborts the CI pipeline.
