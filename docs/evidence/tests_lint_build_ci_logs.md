# Test Suite, Lint, Build & CI Verification Logs

**Document ID:** `docs/evidence/tests_lint_build_ci_logs.md`  
**Gate:** Gate 6 (QA, reproducibility, reliability, accessibility, and UX)  
**Date:** 2026-10-24  
**Status:** `VERIFIED`  
**Execution Environment:** Linux 6.18, Python 3.14.7, Node.js v20.18.0, Next.js 16.4.2  

---

## 1. Automated Test Suite Execution Log

Command: `pytest tests/ -v`

```text
============================= test session starts ==============================
platform linux -- Python 3.14.7, pytest-9.1.1, pluggy-1.6.0 -- /run/media/arkosaha/Volume1/Nasa_Hackathon/.venv/bin/python
cachedir: .pytest_cache
rootdir: /run/media/arkosaha/Volume1/Nasa_Hackathon
configfile: pytest.ini
collected 48 items

tests/test_calibration_real.py::test_bounded_optimization_enforces_bounds PASSED [  2%]
tests/test_calibration_real.py::test_stage_dependent_filtering_excludes_low_flow PASSED [  4%]
tests/test_calibration_real.py::test_inverse_variance_weighting PASSED   [  6%]
tests/test_calibration_real.py::test_calibration_results_schema_and_json_export PASSED [  8%]
tests/test_calibration_real.py::test_diagnostic_plots_generation PASSED  [ 10%]
tests/test_geographic_highlights.py::test_crs_declaration PASSED         [ 12%]
tests/test_geographic_highlights.py::test_kanaighat_station_coordinates_and_provenance PASSED [ 14%]
tests/test_geographic_highlights.py::test_surma_river_operational_corridor_geometry PASSED [ 16%]
tests/test_geographic_highlights.py::test_kushiyara_river_contextual_geometry_and_boundary PASSED [ 18%]
tests/test_geographic_highlights.py::test_meghalaya_catchment_geometry_vs_imerg_bbox PASSED [ 20%]
tests/test_geographic_highlights.py::test_four_geographic_highlights_provenance_schema PASSED [ 22%]
tests/test_geographic_highlights.py::test_no_duplicate_feature_identifiers PASSED [ 25%]
tests/test_ingest_imerg.py::test_imerg_timestamp_shift PASSED            [ 27%]
tests/test_ingest_imerg.py::test_imerg_process_and_map_assertion PASSED  [ 29%]
tests/test_ingest_imerg.py::test_imerg_all_zero_raises_assertion PASSED  [ 31%]
tests/test_ingest_imerg.py::test_hydrosheds_subbasins_geojson PASSED     [ 33%]
tests/test_ingest_imerg.py::test_gauge_bst_to_utc_conversion PASSED      [ 35%]
tests/test_ingest_imerg.py::test_gauge_rolling_median_filter_suppresses_spike PASSED [ 37%]
tests/test_ingest_swot.py::test_sword_prescreening_width_filter PASSED   [ 39%]
tests/test_ingest_swot.py::test_sanitize_fill_values_and_reach_id_types PASSED [ 41%]
tests/test_ingest_swot.py::test_scientific_quality_gating PASSED         [ 43%]
tests/test_ingest_swot.py::test_netcdf_export_schema PASSED              [ 45%]
tests/test_pipeline.py::test_swot_quality_gating PASSED                  [ 47%]
tests/test_pipeline.py::test_manning_bounds PASSED                       [ 50%]
tests/test_pipeline.py::test_stage_inversion PASSED                      [ 52%]
tests/test_pipeline.py::test_routing_coefficients_sum_to_one PASSED      [ 54%]
tests/test_pipeline.py::test_metrics_evaluation PASSED                   [ 56%]
tests/test_pipeline.py::test_harvest_flag_logic PASSED                   [ 58%]
tests/test_provenance_and_leakage.py::test_checked_in_fixture_manifest_is_complete_and_hashes_match PASSED [ 60%]
tests/test_provenance_and_leakage.py::test_operational_flags_reject_future_lookahead_and_are_causal PASSED [ 62%]
tests/test_provenance_and_leakage.py::test_public_metrics_are_explicitly_synthetic_engineering_only PASSED [ 64%]
tests/test_provenance_and_leakage.py::test_temp_directory_fixture_generation_is_deterministic PASSED [ 66%]
tests/test_provenance_and_leakage.py::test_real_mode_fails_closed_without_silent_substitution PASSED [ 68%]
tests/test_routing_real.py::test_hydraulic_celerity_and_travel_time PASSED [ 70%]
tests/test_routing_real.py::test_routing_coefficients_sum_and_stability PASSED [ 72%]
tests/test_routing_real.py::test_uncertainty_envelope_propagation PASSED [ 75%]
tests/test_routing_real.py::test_harvest_flag_look_ahead_and_peak_extraction PASSED [ 77%]
tests/test_routing_real.py::test_baseline_6h_rolling_accumulation PASSED [ 79%]
tests/test_routing_real.py::test_sensitivity_analysis_execution PASSED   [ 81%]
tests/test_trend_analysis.py::test_rejects_synthetic_trend_input PASSED  [ 83%]
tests/test_trend_analysis.py::test_complete_season_cell_first_indices_and_trend PASSED [ 85%]
tests/test_trend_analysis.py::test_mmk_reports_finite_inference_for_trend PASSED [ 87%]
tests/test_validation_real.py::test_nearest_timestamp_alignment_15min_tolerance PASSED [ 89%]
tests/test_validation_real.py::test_metrics_test_period_restriction PASSED [ 91%]
tests/test_validation_real.py::test_metric_precision_formatting PASSED   [ 93%]
tests/test_validation_real.py::test_negative_nse_graceful_handling PASSED [ 95%]
tests/test_validation_real.py::test_model_vs_baseline_comparison PASSED  [ 97%]
tests/test_validation_real.py::test_validation_report_and_plots_generation PASSED [100%]

======================= 48 passed, 7 warnings in 13.34s ========================
```

---

## 2. ESLint Static Code Analysis Log

Command: `cd ui && npm run lint`

```text
> ui@0.1.0 lint
> eslint

(Exit code: 0 - Clean pass with zero errors)
```

---

## 3. Next.js 16 Production Build Log

Command: `cd ui && npm run build`

```text
> ui@0.1.0 build
> next build

▲ Next.js 16.4.2 (Turbopack)
✓ Running next.config.mjs took 16ms
- Cache Components enabled
- Partial Prefetching enabled

  Creating an optimized production build ...
✓ Compiled successfully in 987ms
  Finished TypeScript in 3ms
  Collecting page data using 9 workers in 620ms
✓ Generating static pages using 9 workers (8/8) in 668ms
  Finalizing page optimization in 12ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /advisory
├ ○ /dashboard
├ ○ /forecast
└ ○ /trends

○  (Static)  prerendered as static content
(Exit code: 0)
```

---

## 4. Worktree Hygiene & Hermetic Test Verification

Command: `git status --porcelain` after test run:
- Verified that running `pytest` does not modify any tracked or untracked fixture, image, or report file.
- All temporary artifacts are isolated via pytest `tmp_path` fixtures or explicit output directories.
