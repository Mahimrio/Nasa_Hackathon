/**
 * Canonical normalization for Module 2 trend exports.
 *
 * Both the /trends page and TrendExplorerViewer consume the object returned by
 * `normalizeTrends` (or `fetchTrends`, which fetches then normalizes). Keeping
 * this in one place means every schema variant is interpreted exactly once.
 *
 * Fail-closed rules:
 * - Verified only when input_provenance === VERIFIED_REAL and analysis_status
 *   === COMPUTED.
 * - Development preview only when provenance explicitly says synthetic /
 *   development fixture. The page still requires a user opt-in.
 * - Unknown provenance, conflicting provenance/status, malformed zones, or an
 *   export with no usable series is `invalid` and must never be shown as a
 *   fixture or as verified data.
 */

export const TREND_ENDPOINTS = Object.freeze([
  "/data/trend_summary.json",
  "/data/trends/trend_results.json",
]);

export const TREND_STATUS = Object.freeze({
  VERIFIED: "verified",
  DEVELOPMENT: "development",
  INVALID: "invalid",
});

const SERIES_UNIT_MM = "mm/season";
const SERIES_UNIT_DAYS = "days/season";
const RATE_UNIT_MM = "mm/decade";
const RATE_UNIT_DAYS = "days/decade";

const VERIFIED_PROVENANCE = "verified_real";
const VERIFIED_STATUS = "computed";

const SYNTHETIC_PROVENANCE = new Set([
  "synthetic",
  "synthetic_development_fixture",
  "synthetic_development",
  "synthetic_fixture",
  "development_fixture",
  "development",
  "dev_fixture",
  "fixture",
  "mock",
  "mock_data",
]);

const SYNTHETIC_STATUS = new Set([
  "development_preview",
  "development",
  "dev_preview",
  "preview",
  "unverified",
  "synthetic",
  "fixture",
]);

const ZONE_ORDER = Object.freeze({
  zone_a: 0,
  zone_b: 1,
  zone_c: 2,
});

const INDICATOR_ORDER = Object.freeze({
  prcptot: 0,
  r50mm: 1,
});

const ZONE_ALIASES = Object.freeze({
  zone_a: new Set([
    "zone_a",
    "zone_a_meghalaya_ridge",
    "meghalaya",
    "meghalaya_ridge",
    "a",
  ]),
  zone_b: new Set([
    "zone_b",
    "zone_b_eastern_inflow_corridor",
    "eastern_inflow_corridor",
    "eastern_inflow",
    "inflow_corridor",
    "b",
  ]),
  zone_c: new Set([
    "zone_c",
    "zone_c_central_haor_basin",
    "central_haor_basin",
    "central_haor",
    "haor_basin",
    "c",
  ]),
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === "string" && value.trim() !== "";
}

function textOrNull(value) {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

/**
 * Lowercase and collapse separators so aliases like "mm/season", "mm-season"
 * and "mm season" all resolve to "mm_season".
 */
function normalizeToken(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[/\s-]+/g, "_");
}

function toFiniteNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim().replace(/,/g, "");
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    const parsed = toFiniteNumber(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const token = value.trim().toLowerCase();
    if (token === "true") return true;
    if (token === "false") return false;
  }
  if (value === 1) return true;
  if (value === 0) return false;
  return null;
}

function scalePerYearToPerDecade(value) {
  return value === null ? null : value * 10;
}

function collectEntries(source) {
  if (Array.isArray(source)) {
    return source.map((entry) => ({ key: null, entry }));
  }
  if (isPlainObject(source)) {
    return Object.entries(source).map(([key, entry]) => ({ key, entry }));
  }
  return [];
}

function canonicalZoneId(value) {
  const token = normalizeToken(value);
  if (!token) return null;

  for (const [canonical, aliases] of Object.entries(ZONE_ALIASES)) {
    if (aliases.has(token)) return canonical;
  }

  if (token.startsWith("zone_a")) return "zone_a";
  if (token.startsWith("zone_b")) return "zone_b";
  if (token.startsWith("zone_c")) return "zone_c";
  if (token.includes("meghalaya")) return "zone_a";
  if (token.includes("eastern") || token.includes("inflow")) return "zone_b";
  if (token.includes("central") || token.includes("haor")) return "zone_c";
  return null;
}

function canonicalIndicatorId(value) {
  const token = normalizeToken(value);
  if (!token) return null;

  if (
    token === "prcptot" ||
    token.startsWith("prcptot") ||
    token.includes("precipitation_total") ||
    token.includes("total_precipitation")
  ) {
    return "prcptot";
  }

  if (
    token === "r50mm" ||
    token.startsWith("r50") ||
    token.includes("heavy_rain")
  ) {
    return "r50mm";
  }

  return null;
}

function classifyProvenance(value) {
  const token = normalizeToken(value);
  if (!token) return null;
  if (token === VERIFIED_PROVENANCE) return "verified";
  if (SYNTHETIC_PROVENANCE.has(token)) return "synthetic";
  if (
    token.startsWith("synthetic_") ||
    token.startsWith("development_") ||
    token.startsWith("dev_") ||
    token.startsWith("mock_") ||
    token.endsWith("_fixture")
  ) {
    return "synthetic";
  }
  return "unknown";
}

function resolveProvenance(metadata, root) {
  const metadataValue = metadata?.input_provenance;
  const rootValue = root?.input_provenance;
  const metadataPresent = hasText(metadataValue);
  const rootPresent = hasText(rootValue);

  const metadataClass = metadataPresent
    ? classifyProvenance(metadataValue)
    : null;
  const rootClass = rootPresent ? classifyProvenance(rootValue) : null;

  if (metadataPresent && rootPresent && metadataClass !== rootClass) {
    return {
      conflict: true,
      value: metadataValue,
      classification: null,
    };
  }

  return {
    conflict: false,
    value: metadataPresent ? metadataValue : rootPresent ? rootValue : null,
    classification: metadataPresent ? metadataClass : rootClass,
  };
}

function resolveAnalysisStatus(metadata, root) {
  const metadataValue = metadata?.analysis_status;
  const rootValue = root?.analysis_status;
  const metadataPresent = hasText(metadataValue);
  const rootPresent = hasText(rootValue);

  const metadataToken = metadataPresent ? normalizeToken(metadataValue) : null;
  const rootToken = rootPresent ? normalizeToken(rootValue) : null;

  if (metadataPresent && rootPresent && metadataToken !== rootToken) {
    return { conflict: true, value: metadataValue, token: null };
  }

  return {
    conflict: false,
    value: metadataPresent ? metadataValue : rootPresent ? rootValue : null,
    token: metadataPresent ? metadataToken : rootToken,
  };
}

function emptyMetadata() {
  return {
    dataset: null,
    variable: null,
    primaryPeriod: null,
    spatialCoverageThreshold: null,
    sampleThreshold: null,
    multipleTestingPolicy: null,
    generatedAtUtc: null,
    schemaVersion: null,
  };
}

function normalizeMetadata(metadata, root) {
  return {
    dataset: textOrNull(metadata?.dataset ?? root?.dataset),
    variable: textOrNull(metadata?.variable ?? root?.variable),
    primaryPeriod: textOrNull(
      metadata?.primary_period ?? metadata?.period ?? root?.primary_period
    ),
    spatialCoverageThreshold: textOrNull(
      metadata?.spatial_coverage_threshold ??
        metadata?.coverage_policy ??
        root?.spatial_coverage_threshold
    ),
    sampleThreshold: textOrNull(
      metadata?.predeclared_sample_threshold ??
        metadata?.sample_threshold ??
        root?.predeclared_sample_threshold
    ),
    multipleTestingPolicy: textOrNull(
      metadata?.multiple_testing_policy ?? root?.multiple_testing_policy
    ),
    generatedAtUtc: textOrNull(
      metadata?.generated_at_utc ?? root?.generated_at_utc
    ),
    schemaVersion: textOrNull(root?.schema_version ?? metadata?.schema_version),
  };
}

function normalizeSeriesUnit(value, canonicalId) {
  const token = normalizeToken(value);

  if (
    token === "mm_season" ||
    token === "mm_per_season" ||
    token === "mm" ||
    token === "millimeter" ||
    token === "millimeters"
  ) {
    return SERIES_UNIT_MM;
  }

  if (
    token === "days_season" ||
    token === "day_season" ||
    token === "days_per_season" ||
    token === "day" ||
    token === "days" ||
    token === "d"
  ) {
    return SERIES_UNIT_DAYS;
  }

  return canonicalId === "r50mm" ? SERIES_UNIT_DAYS : SERIES_UNIT_MM;
}

function extractSeries(entry, rawId, canonicalId, fallbackSeries = null) {
  const candidates = [
    entry.annual_series,
    entry.series,
    entry.time_series,
    entry.values,
    entry.annual_values,
    entry.data,
    fallbackSeries,
  ];
  const rawSeries =
    candidates.find(
      (candidate) => Array.isArray(candidate) && candidate.length > 0
    ) ?? [];
  const rawIdText = textOrNull(rawId);
  const byYear = new Map();

  for (const rawPoint of rawSeries) {
    if (!isPlainObject(rawPoint)) continue;

    const year = firstFiniteNumber(
      rawPoint.year,
      rawPoint.season,
      rawPoint.year_season
    );
    if (year === null) continue;

    const observed = firstFiniteNumber(
      rawPoint.observed,
      rawIdText ? rawPoint[`${rawIdText}_observed`] : null,
      rawPoint[`${canonicalId}_observed`],
      rawPoint.observed_value,
      rawPoint.value
    );
    const fitted = firstFiniteNumber(
      rawPoint.fitted_trend,
      rawPoint.fitted,
      rawIdText ? rawPoint[`${rawIdText}_fitted`] : null,
      rawPoint[`${canonicalId}_fitted`],
      rawPoint.fitted_value,
      rawPoint.trend
    );

    // Map.set keeps the last value for duplicate years, which mirrors how a
    // corrected export normally supersedes an earlier row.
    byYear.set(year, { year, observed, fitted });
  }

  return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
}

function extractSlopePerDecade(entry) {
  const perDecade = firstFiniteNumber(entry.slope_per_decade);
  if (perDecade !== null) return perDecade;

  const perYear = firstFiniteNumber(entry.slope_per_year);
  if (perYear !== null) return scalePerYearToPerDecade(perYear);

  const generic = firstFiniteNumber(entry.slope);
  if (generic === null) return null;

  const unit = normalizeToken(entry.slope_unit ?? entry.rate_unit);
  if (unit.includes("year")) return scalePerYearToPerDecade(generic);
  return generic;
}

function extractSlopeCi(entry) {
  const ci95 = entry.slope_ci_95;
  if (Array.isArray(ci95) && ci95.length >= 2) {
    const low = firstFiniteNumber(ci95[0]);
    const high = firstFiniteNumber(ci95[1]);
    if (low !== null || high !== null) return { low, high };
  }

  // CRITICAL: fallback CI bounds are expressed per year. Multiply by 10 so
  // they are displayed in the same per-decade unit as the slope.
  const lowPerYear = firstFiniteNumber(entry.slope_ci_low_per_year);
  const highPerYear = firstFiniteNumber(entry.slope_ci_high_per_year);
  if (lowPerYear !== null || highPerYear !== null) {
    return {
      low: scalePerYearToPerDecade(lowPerYear),
      high: scalePerYearToPerDecade(highPerYear),
    };
  }

  // Backend-style aliases without the _per_year suffix are also per-year.
  const lowGeneric = firstFiniteNumber(entry.slope_ci_low);
  const highGeneric = firstFiniteNumber(entry.slope_ci_high);
  if (lowGeneric !== null || highGeneric !== null) {
    return {
      low: scalePerYearToPerDecade(lowGeneric),
      high: scalePerYearToPerDecade(highGeneric),
    };
  }

  return { low: null, high: null };
}

function normalizeGoverningTest(value, autocorrelationR1) {
  const token = normalizeToken(value);

  if (token) {
    if (
      token.includes("modified") ||
      token.includes("mmk") ||
      token.includes("hamed") ||
      token.includes("rao")
    ) {
      return "MODIFIED_MANN_KENDALL";
    }
    if (token.includes("standard") || token.includes("mann") || token === "mk") {
      return "STANDARD_MANN_KENDALL";
    }
  }

  if (autocorrelationR1 !== null) {
    return Math.abs(autocorrelationR1) >= 0.392
      ? "MODIFIED_MANN_KENDALL"
      : "STANDARD_MANN_KENDALL";
  }

  return null;
}

function deriveVerdict(pValueAdjusted) {
  if (pValueAdjusted === null) return null;
  return pValueAdjusted < 0.05
    ? "SIGNIFICANT_TREND"
    : "NO_SIGNIFICANT_TREND";
}

function normalizeIndicators(source, zoneEntry = null) {
  const entries = collectEntries(source);
  const indicators = [];
  const warnings = [];
  const seen = new Set();
  let hardInvalid = false;
  const fallbackSeries = isPlainObject(zoneEntry)
    ? zoneEntry.annual_series ?? zoneEntry.series ?? zoneEntry.time_series ?? null
    : null;

  for (const { key, entry } of entries) {
    if (!isPlainObject(entry)) {
      warnings.push("skipped_non_object_indicator");
      continue;
    }

    const declaredId = firstDefined(
      entry.indicator_id,
      entry.indicatorId,
      entry.id,
      entry.indicator
    );
    const keyId = canonicalIndicatorId(key);
    const declaredCanonical = canonicalIndicatorId(declaredId);

    if (keyId && declaredCanonical && keyId !== declaredCanonical) {
      hardInvalid = true;
      warnings.push("indicator_identity_conflict");
      continue;
    }

    const canonicalId = declaredCanonical ?? keyId;
    if (!canonicalId) {
      warnings.push("unknown_indicator");
      continue;
    }
    if (seen.has(canonicalId)) {
      hardInvalid = true;
      warnings.push("duplicate_indicator");
      continue;
    }
    seen.add(canonicalId);

    const rawId = textOrNull(declaredId) ?? textOrNull(key) ?? canonicalId;
    const series = extractSeries(entry, rawId, canonicalId, fallbackSeries);
    const hasValues = series.some(
      (point) => point.observed !== null || point.fitted !== null
    );

    // A slope-only export has no year-by-year values to chart and cannot be
    // rendered honestly. Treat it as an incomplete export rather than showing
    // an empty but "verified" chart.
    if (series.length < 2 || !hasValues) {
      warnings.push("indicator_without_usable_series");
      continue;
    }

    const unitSeries = normalizeSeriesUnit(
      firstDefined(entry.unit, entry.series_unit, entry.units),
      canonicalId
    );
    const unitRate =
      unitSeries === SERIES_UNIT_DAYS ? RATE_UNIT_DAYS : RATE_UNIT_MM;

    const slopePerDecade = extractSlopePerDecade(entry);
    const ci = extractSlopeCi(entry);

    const pValueRaw = firstFiniteNumber(
      entry.p_value_raw,
      entry.p_value,
      entry.mk_p_value,
      entry.p_raw
    );
    const pValueAdjusted = firstFiniteNumber(
      entry.p_value_adjusted,
      entry.p_adjusted,
      entry.p_holm,
      entry.p_value_holm,
      entry.adjusted_p_value
    );

    const explicitNominal = toBoolean(
      firstDefined(entry.is_significant_nominal, entry.significant_at_005)
    );
    const explicitFwer = toBoolean(
      firstDefined(entry.is_significant_fwer, entry.significant_fwer)
    );

    // The p-value is authoritative at the 0.05 threshold. This guarantees a
    // positive slope with adjusted p >= 0.05 can never be rendered as a
    // significant increase even if an export ships a contradictory boolean.
    const derivedNominal = pValueRaw === null ? null : pValueRaw < 0.05;
    const derivedFwer =
      pValueAdjusted === null ? null : pValueAdjusted < 0.05;

    const autocorrelationR1 = firstFiniteNumber(
      entry.autocorrelation_r1,
      entry.r1_lag1_autocorr,
      entry.r1,
      entry.lag1_autocorrelation
    );

    const governingTest = normalizeGoverningTest(
      firstDefined(entry.governing_test, entry.test, entry.mk_test),
      autocorrelationR1
    );

    const completeSeasons = firstFiniteNumber(
      entry.complete_seasons_count,
      entry.complete_seasons,
      entry.n_seasons,
      entry.valid_seasons
    );
    const totalSeasons = firstFiniteNumber(
      entry.total_seasons_count,
      entry.total_seasons,
      entry.expected_seasons
    );

    const verdict =
      textOrNull(entry.verdict) ?? deriveVerdict(pValueAdjusted);

    indicators.push({
      id: canonicalId,
      rawId,
      unitSeries,
      unitRate,
      slopePerDecade,
      slopeCiLow: ci.low,
      slopeCiHigh: ci.high,
      pValueRaw,
      pValueAdjusted,
      isSignificantNominal: derivedNominal ?? explicitNominal,
      isSignificantFwer: derivedFwer ?? explicitFwer,
      governingTest,
      autocorrelationR1,
      verdict,
      completeSeasons,
      totalSeasons,
      series,
    });
  }

  indicators.sort(
    (a, b) => (INDICATOR_ORDER[a.id] ?? 99) - (INDICATOR_ORDER[b.id] ?? 99)
  );

  return { indicators, warnings, hardInvalid };
}

function normalizeZones(source) {
  const entries = collectEntries(source);
  const zones = [];
  const warnings = [];
  const seen = new Set();
  let hardInvalid = false;

  for (const { key, entry } of entries) {
    if (!isPlainObject(entry)) {
      warnings.push("skipped_non_object_zone");
      continue;
    }

    const declaredId = firstDefined(entry.zone_id, entry.zoneId, entry.id);
    const keyId = canonicalZoneId(key);
    const declaredCanonical = canonicalZoneId(declaredId);

    if (keyId && declaredCanonical && keyId !== declaredCanonical) {
      hardInvalid = true;
      warnings.push("zone_identity_conflict");
      continue;
    }

    const canonicalId = declaredCanonical ?? keyId;
    if (!canonicalId) {
      warnings.push("unknown_zone");
      continue;
    }
    if (seen.has(canonicalId)) {
      hardInvalid = true;
      warnings.push("duplicate_zone");
      continue;
    }
    seen.add(canonicalId);

    const indicatorSource =
      entry.indicators ?? entry.indicator_results ?? entry.results ?? null;
    const indicatorResult = normalizeIndicators(indicatorSource, entry);

    if (indicatorResult.hardInvalid) hardInvalid = true;
    warnings.push(...indicatorResult.warnings);

    if (indicatorResult.indicators.length === 0) {
      warnings.push("zone_without_usable_indicators");
      continue;
    }

    zones.push({
      id: canonicalId,
      indicators: indicatorResult.indicators,
    });
  }

  zones.sort(
    (a, b) => (ZONE_ORDER[a.id] ?? 99) - (ZONE_ORDER[b.id] ?? 99)
  );

  return { zones, warnings, hardInvalid };
}

/**
 * Normalize one raw trend export into the single canonical shape used by the
 * page and viewer. This function never throws for malformed input; it returns
 * an `invalid` result instead.
 */
export function normalizeTrends(raw) {
  const base = {
    isNormalized: true,
    status: TREND_STATUS.INVALID,
    invalidReason: null,
    provenance: null,
    provenanceClass: null,
    analysisStatus: null,
    metadata: emptyMetadata(),
    zones: [],
    warnings: [],
  };

  if (!isPlainObject(raw) && !Array.isArray(raw)) {
    return { ...base, invalidReason: "malformed_root" };
  }

  // An array root is treated as the zones list (a supported fallback export).
  const root = Array.isArray(raw) ? { zones: raw } : raw;
  const metadata = isPlainObject(root.metadata) ? root.metadata : {};

  const provenance = resolveProvenance(metadata, root);
  if (provenance.conflict) {
    return {
      ...base,
      provenance: textOrNull(provenance.value),
      invalidReason: "provenance_conflict",
    };
  }

  const statusResolution = resolveAnalysisStatus(metadata, root);
  if (statusResolution.conflict) {
    return {
      ...base,
      provenance: textOrNull(provenance.value),
      analysisStatus: textOrNull(statusResolution.value),
      invalidReason: "status_conflict",
    };
  }

  const analysisStatusToken = statusResolution.token;
  let status = TREND_STATUS.INVALID;
  let invalidReason = null;

  if (provenance.classification === "verified") {
    if (analysisStatusToken === VERIFIED_STATUS) {
      status = TREND_STATUS.VERIFIED;
    } else {
      invalidReason = "verified_requires_computed_status";
    }
  } else if (provenance.classification === "synthetic") {
    if (
      analysisStatusToken === null ||
      SYNTHETIC_STATUS.has(analysisStatusToken)
    ) {
      status = TREND_STATUS.DEVELOPMENT;
    } else {
      invalidReason = "synthetic_status_conflict";
    }
  } else {
    invalidReason = provenance.value
      ? "unknown_provenance"
      : "missing_provenance";
  }

  const zoneSource = Array.isArray(raw)
    ? raw
    : root.zones ??
      root.zones_data ??
      (isPlainObject(root.data) ? root.data.zones : null);

  const zoneResult = normalizeZones(zoneSource);

  if (status !== TREND_STATUS.INVALID && zoneResult.hardInvalid) {
    status = TREND_STATUS.INVALID;
    invalidReason = "malformed_zone_data";
  }

  if (status !== TREND_STATUS.INVALID && zoneResult.zones.length === 0) {
    status = TREND_STATUS.INVALID;
    invalidReason = "no_usable_series";
  }

  return {
    ...base,
    status,
    invalidReason,
    provenance: textOrNull(provenance.value),
    provenanceClass: provenance.classification,
    analysisStatus: textOrNull(statusResolution.value),
    metadata: normalizeMetadata(metadata, root),
    zones: zoneResult.zones,
    warnings: zoneResult.warnings,
  };
}

/**
 * Fetch the first available trend export and normalize it once at the boundary.
 * Only HTTP 404 falls through to the next endpoint; other HTTP failures surface
 * as errors so a broken deployment is never silently replaced by stale data.
 */
export async function fetchTrends({ signal } = {}) {
  let lastError = null;

  for (const endpoint of TREND_ENDPOINTS) {
    let response;

    try {
      response = await fetch(endpoint, { cache: "no-store", signal });
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      lastError = error;
      continue;
    }

    if (response.status === 404) {
      lastError = new Error(`trend_data_not_found:${endpoint}`);
      continue;
    }

    if (!response.ok) {
      throw new Error(`trend_data_http_${response.status}:${endpoint}`);
    }

    try {
      return normalizeTrends(await response.json());
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      throw new Error(`trend_data_invalid_json:${endpoint}`);
    }
  }

  throw lastError ?? new Error("trend_data_unavailable");
}


