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
platform win32 -- Python 3.13.3, pytest-9.1.1, pluggy-1.6.0
rootdir: F:\Nasa\Nasa_Hackathon
configfile: pytest.ini
plugins: anyio-4.14.2, asyncio-1.4.0
collected 93 items

tests/test_audit_provenance.py::test_audit_provenance_passes_on_fixtures PASSED [  1%]
tests/test_audit_provenance.py::test_audit_provenance_detects_corrupted_hash PASSED [  2%]
tests/test_audit_provenance.py::test_audit_provenance_detects_missing_file PASSED [  3%]
tests/test_audit_provenance.py::test_audit_provenance_enforces_required_files PASSED [  4%]
tests/test_audit_provenance.py::test_audit_provenance_rejects_synthetic_fixture_claiming_computed PASSED [  5%]
tests/test_calibration_real.py::test_bounded_optimization_enforces_bounds PASSED [  6%]
tests/test_calibration_real.py::test_stage_dependent_filtering_excludes_low_flow PASSED [  7%]
tests/test_calibration_real.py::test_inverse_variance_weighting PASSED   [  8%]
tests/test_calibration_real.py::test_calibration_results_schema_and_json_export PASSED [  9%]
tests/test_calibration_real.py::test_diagnostic_plots_generation PASSED  [ 10%]
tests/test_geographic_highlights.py::test_crs_declaration PASSED         [ 11%]
tests/test_geographic_highlights.py::test_kanaighat_station_coordinates_and_provenance PASSED [ 12%]
tests/test_geographic_highlights.py::test_surma_river_operational_corridor_geometry PASSED [ 13%]
tests/test_geographic_highlights.py::test_kushiyara_river_contextual_geometry_and_boundary PASSED [ 15%]
tests/test_geographic_highlights.py::test_meghalaya_catchment_geometry_vs_imerg_bbox PASSED [ 16%]
tests/test_geographic_highlights.py::test_four_geographic_highlights_provenance_schema PASSED [ 17%]
tests/test_geographic_highlights.py::test_no_duplicate_feature_identifiers PASSED [ 18%]
tests/test_ingest_imerg.py::test_imerg_timestamp_shift PASSED            [ 19%]
tests/test_ingest_imerg.py::test_imerg_process_and_map_assertion PASSED  [ 20%]
tests/test_ingest_imerg.py::test_imerg_all_zero_raises_assertion PASSED  [ 21%]
tests/test_ingest_imerg.py::test_hydrosheds_subbasins_geojson PASSED     [ 22%]
tests/test_ingest_imerg.py::test_gauge_bst_to_utc_conversion PASSED      [ 23%]
tests/test_ingest_imerg.py::test_gauge_rolling_median_filter_suppresses_spike PASSED [ 24%]
tests/test_ingest_swot.py::test_sword_prescreening_width_filter PASSED   [ 25%]
tests/test_ingest_swot.py::test_sanitize_fill_values_and_reach_id_types PASSED [ 26%]
tests/test_ingest_swot.py::test_scientific_quality_gating PASSED         [ 27%]
tests/test_ingest_swot.py::test_netcdf_export_schema PASSED              [ 29%]
tests/test_pipeline.py::test_swot_quality_gating PASSED                  [ 30%]
tests/test_pipeline.py::test_manning_bounds PASSED                       [ 31%]
tests/test_pipeline.py::test_stage_inversion PASSED                      [ 32%]
tests/test_pipeline.py::test_routing_coefficients_sum_to_one PASSED      [ 33%]
tests/test_pipeline.py::test_metrics_evaluation PASSED                   [ 34%]
tests/test_pipeline.py::test_harvest_flag_logic PASSED                   [ 35%]
tests/test_pipeline_modes.py::test_no_mode_fails_with_exit_code_2 PASSED [ 36%]
tests/test_pipeline_modes.py::test_demo_mode_labels_outputs_synthetic PASSED [ 37%]
tests/test_pipeline_modes.py::test_demo_mode_generates_all_artifacts_and_metrics PASSED [ 38%]
tests/test_pipeline_modes.py::test_real_mode_fails_closed_when_dir_missing PASSED [ 39%]
tests/test_pipeline_modes.py::test_real_mode_fails_closed_when_manifest_missing PASSED [ 40%]
tests/test_pipeline_modes.py::test_real_mode_fails_closed_when_files_missing PASSED [ 41%]
tests/test_pipeline_modes.py::test_real_mode_fails_closed_on_bad_checksum PASSED [ 43%]
tests/test_pipeline_modes.py::test_real_mode_fails_closed_on_synthetic_provenance PASSED [ 44%]
tests/test_pipeline_modes.py::test_real_mode_fails_closed_on_missing_source_metadata PASSED [ 45%]
tests/test_pipeline_modes.py::test_real_mode_rejects_path_traversal PASSED [ 46%]
tests/test_pipeline_modes.py::test_real_mode_rejects_fixture_leakage PASSED [ 47%]
tests/test_pipeline_modes.py::test_real_mode_executes_when_valid PASSED  [ 48%]
tests/test_provenance_and_leakage.py::test_checked_in_fixture_manifest_is_complete_and_hashes_match PASSED [ 49%]
tests/test_provenance_and_leakage.py::test_operational_flags_reject_future_lookahead_and_are_causal PASSED [ 50%]
tests/test_provenance_and_leakage.py::test_public_metrics_are_explicitly_synthetic_engineering_only PASSED [ 51%]
tests/test_provenance_and_leakage.py::test_temp_directory_fixture_generation_is_deterministic PASSED [ 52%]
tests/test_provenance_and_leakage.py::test_real_mode_fails_closed_without_silent_substitution PASSED [ 53%]
tests/test_real_hindcast.py::test_real_provenance_manifest_complete PASSED [ 54%]
tests/test_real_hindcast.py::test_basin_geometry_topology PASSED          [ 55%]
tests/test_real_hindcast.py::test_sparse_gauge_protocol_alignment PASSED  [ 56%]
tests/test_real_hindcast.py::test_hindcast_report_and_figures_generated PASSED [ 58%]
tests/test_routing_real.py::test_hydraulic_celerity_and_travel_time PASSED [ 59%]
tests/test_routing_real.py::test_routing_coefficients_sum_and_stability PASSED [ 60%]
tests/test_routing_real.py::test_uncertainty_envelope_propagation PASSED [ 61%]
tests/test_routing_real.py::test_harvest_flag_look_ahead_and_peak_extraction PASSED [ 62%]
tests/test_routing_real.py::test_baseline_6h_rolling_accumulation PASSED [ 63%]
tests/test_routing_real.py::test_sensitivity_analysis_execution PASSED   [ 64%]
tests/test_trend_analysis.py::test_cell_first_aggregation_preserves_peaks PASSED [ 65%]
tests/test_trend_analysis.py::test_theil_sen_matches_known_slope PASSED  [ 66%]
tests/test_trend_analysis.py::test_mmk_variance_correction_reduces_significance_under_positive_autocorrelation PASSED [ 67%]
tests/test_trend_analysis.py::test_rejects_incomplete_season PASSED      [ 68%]
tests/test_trend_analysis.py::test_rejects_synthetic_trend_input PASSED  [ 70%]
tests/test_trend_analysis.py::test_complete_season_cell_first_indices_and_trend PASSED [ 71%]
tests/test_trend_analysis.py::test_mmk_reports_finite_inference_for_trend PASSED [ 72%]
tests/test_trend_analysis.py::test_holm_bonferroni_controls_fwer PASSED   [ 73%]
tests/test_trend_analysis.py::test_tie_correction_in_variance PASSED      [ 74%]
tests/test_trend_analysis.py::test_confidence_intervals_bracket_slope PASSED [ 75%]
tests/test_trend_analysis.py::test_sen_slope_zero_on_constant_series PASSED [ 76%]
tests/test_trend_analysis.py::test_perfect_monotonic_p_value_small PASSED [ 77%]
tests/test_trend_analysis.py::test_export_json_format PASSED              [ 78%]
tests/test_trend_analysis.py::test_export_multi_zone_analysis PASSED     [ 80%]
tests/test_trend_analysis.py::test_insufficient_years_graceful_handling PASSED [ 81%]
tests/test_trend_e2e_integration.py::test_e2e_trend_explorer_pipeline_hermetic PASSED [ 82%]
tests/test_trend_ingest.py::test_remote_ingest_fails_without_credentials PASSED [ 83%]
tests/test_trend_ingest.py::test_annual_chunk_validation_and_sha256 PASSED [ 84%]
tests/test_trend_ingest.py::test_provenance_registration_schema PASSED    [ 85%]
tests/test_trend_ingest.py::test_coordinate_monotonicity_and_bounds PASSED [ 86%]
tests/test_trend_ingest.py::test_precipitation_units_and_range PASSED    [ 87%]
tests/test_trend_ingest.py::test_zero_fill_or_nan_policy PASSED          [ 88%]
tests/test_trend_ingest.py::test_missing_dates_detected_in_chunk PASSED   [ 89%]
tests/test_trend_ingest.py::test_sha256_verification_detects_tamper PASSED [ 90%]
tests/test_trend_ingest.py::test_manifest_schema_conformance PASSED      [ 92%]
tests/test_trend_ingest.py::test_empty_or_corrupt_netcdf_rejected PASSED  [ 93%]
tests/test_trend_ingest.py::test_date_range_completeness_check PASSED    [ 94%]
tests/test_validation_real.py::test_nearest_timestamp_alignment_15min_tolerance PASSED [ 95%]
tests/test_validation_real.py::test_metrics_test_period_restriction PASSED [ 96%]
tests/test_validation_real.py::test_metric_precision_formatting PASSED   [ 97%]
tests/test_validation_real.py::test_negative_nse_graceful_handling PASSED [ 98%]
tests/test_validation_real.py::test_model_vs_baseline_comparison PASSED  [100%]
tests/test_validation_real.py::test_validation_report_and_plots_generation PASSED [100%]

======================= 93 passed, 9 warnings in 56.07s ========================
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
