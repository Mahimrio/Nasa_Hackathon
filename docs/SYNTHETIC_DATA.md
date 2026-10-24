# Synthetic Data Provenance and Disclosure

**Status:** required disclosure for the current offline demo
**Last source review:** 2026-10-24
**Generator:** scripts/generate_fixtures.py
**Default generator mode:** synthetic
**Machine-readable manifest:** not present yet; implementation is required before the provenance gate can pass

## Executive disclosure

The checked-in fixture set is procedurally generated. It does not contain observed BWDB/FFWC gauge readings, downloaded GPM IMERG granules, or SWOT RiverSP retrievals. The files carry names and NetCDF attributes resembling those products because they exercise the application's data interfaces. Those labels do not prove that the measurements came from NASA or a gauge agency.

The generated gauge and rainfall series are deliberately paired scenarios. Any model score computed against these files describes agreement with a constructed test case. It is not independent forecast validation, field performance, or evidence of real-world skill.

The data-generation code and the current fixture README contain source/observation wording that conflicts with this disclosure. Until those code-generated labels are corrected and a manifest is implemented, show a prominent synthetic-demo notice in every affected page, chart, metric panel, export, and presentation.

## What is in the repository now

Source review is based on scripts/generate_fixtures.py, especially its generator functions and --mode control flow.

| File | How the current synthetic fixture is produced | What it is not |
|---|---|---|
| swot_reaches.nc | Four hard-coded reach definitions; an annual sinusoidal water-level cycle plus seeded Gaussian noise; width derived from water level; slope noise and injected quality flags; dates are generated from 2020 through March 2026 at 11-day intervals. | Not a set of SWOT overpasses. The source attribute naming the NASA collection is descriptive metadata written by the fixture generator, not provenance. |
| swot_event.nc | Five hard-coded April-May 2026 dates and hand-entered water-level arrays; widths and quality fields are derived or filled by constants. | Not a SWOT event retrieval. |
| imerg_map.nc | April-May 30-minute synthetic rainfall for 2020-2026. Surma background is sampled from an exponential distribution with scale 0.25, then hand-authored Gaussian storm pulses are added. Kushiyara rain is 0.85 times the Surma series plus exponential noise with scale 0.2. | Not downloaded IMERG. Product, units, and latency attributes do not establish a NASA download. |
| gauge_kanaighat.csv | Water level begins at 7.45 m. Year-specific Gaussian rises and seeded normal noise create the staged flood scenarios. Station and danger-level columns are fixed labels/constants. | Not an observed BWDB or FFWC record. |

The generator sets NumPy's global random seed to 42. Synthetic output is deterministic only when the same code, dependency behavior, and generation order are used.

### Hand-authored event scenarios

The rainfall and stage event profiles are selected in code by year. The values below are scenario inputs, not measurements.

| Year | Synthetic rainfall pulse(s), center UTC and peak rate | Synthetic gauge rise peak(s), center UTC and rise above 7.45 m |
|---|---|---|
| 2020 | Apr 17 04:00, 34 mm/hr | Apr 18 06:00, 5.90 m |
| 2021 | Apr 22 18:00, 16 mm/hr | Apr 23 20:00, 4.05 m |
| 2022 | Apr 15 00:00, 42 mm/hr; May 16 06:00, 58 mm/hr | Apr 16 02:00, 6.65 m; May 17 08:00, 7.75 m |
| 2023 | Apr 25 06:00, 21 mm/hr | Apr 26 08:00, 4.65 m |
| 2024 | Apr 08 18:00, 36 mm/hr | Apr 09 20:00, 6.10 m |
| 2025 | Apr 20 06:00, 27 mm/hr | Apr 21 08:00, 5.40 m |
| 2026 | Apr 12 06:00, 38 mm/hr; Apr 25 00:00, 12 mm/hr | Apr 13 08:00, 6.35 m; Apr 26 12:00, 2.40 m |

The script applies year-specific Gaussian widths and time windows around these pulses, adds noise, and rounds gauge output to two decimals. The generator source remains the authoritative specification of every parameter. When it changes, update this table and the manifest in the same change.

### Important limitation of --mode real

The --mode real branch calls SWORD and SWOT ingestion for the historical reach file. It then calls the synthetic event, rainfall, and gauge generators. It therefore does not produce a fully real fixture set. The current mode name and success message can mislead readers. Do not claim that a complete real-data pipeline ran merely because this command completed.

Before enabling a real-data release, each output must have per-file provenance. A missing or failed source must fail closed or leave an explicitly marked synthetic demo; it must never silently mix real and synthetic records under one label.

## Metric interpretation

- Do not publish NSE, KGE, PBIAS, lead time, timing error, calibration values, or event dates from synthetic fixtures as observed performance.
- If synthetic metrics are shown for engineering demonstration, label the entire metric group **Synthetic scenario result ? not validation** and link to this disclosure.
- Do not describe synthetic agreement as model skill, independent validation, a benchmark against observations, or evidence of operational warning ability.
- Keep synthetic fixtures for interface development, deterministic tests, and code-path demonstrations. The real-data and synthetic-data paths must be visually and machine-readably distinct.

## Required implementation before this disclosure can pass review

1. Correct the generator docstrings, NetCDF attributes, CSV labels, and generated data/fixtures/README.md. The current generator writes misleading NASA/BWDB observation wording on every run.
2. Add a generated data/fixtures/PROVENANCE.json manifest. Enumerate each data file, its mode, whether it contains real observations, generator/source function, random seed where applicable, units, time coverage, and SHA-256 digest. Do not hand-edit a manifest that the generator overwrites.
3. Add an explicit provenance field to each NetCDF dataset and a data_provenance column to the CSV. For a truly real file, store the product/station identifier, collection/version, access time, source URL or granule IDs, and processing steps.
4. Fix the --mode real control flow so no synthetic event, rainfall, or gauge output is written under a real label. Incomplete source availability must be reported per file.
5. Surface provenance in all affected UI pages and exported JSON. Synthetic records may never be represented as observations in captions, legends, alt text, video scripts, or metric descriptions.
6. Make fixture generation target an explicit output directory so tests can generate in a temporary directory. Tests must not overwrite tracked files under data/fixtures/ or data/processed/.
7. Add provenance tests for manifest completeness, checksums, per-file mode, truthful UI/export labels, and the fail-closed behavior of real ingestion. Tests must use temporary paths.
8. Recompute any displayed metric from the selected dataset and export. Remove stale hard-coded metric/date claims. The metric JSON and the UI must agree exactly after formatting.

## Required wording for the current demo

Use wording such as:

> **Synthetic demonstration data.** Rainfall, river levels, and most SWOT-shaped values in this demo were generated by the project fixture script. They are not NASA retrievals or gauge observations. Metrics shown here measure behavior on a constructed scenario and do not establish forecast skill.

If any file is replaced with verified real data, identify the exact real files and retain explicit synthetic labels for the remaining files. Do not let a partly real dataset make the whole demo sound observational.

## Contributor rules

1. Never call a fixture observed, measured, retrieved, or real because its filename, variable name, or NetCDF attribute resembles a mission product.
2. Never tune generated values to improve a headline metric.
3. Never use fixture scores as validation against the same fixture generator's output.
4. Keep source data and synthetic fixtures in separate paths and manifests.
5. Preserve the existing offline demo, but make synthetic status visible at the point where users interpret a result.
6. Do not state that the provenance gate has passed until the manifest, generator, tests, UI labels, and exports agree.

## Verification evidence to retain

For each release, archive:

- The generator version or Git commit and a SHA-256 manifest of generated files.
- A clean run of the fixture-generation command in a temporary directory.
- The provenance test output.
- A comparison showing that UI, JSON exports, and the manifest assign the same provenance to every displayed value.
- The actual NASA granule/product IDs and gauge source record identifiers for any file described as real.

**Current status:** disclosure drafted; generator, fixture README, manifest, tests, and UI labels still require implementation. This document does not certify those changes.
