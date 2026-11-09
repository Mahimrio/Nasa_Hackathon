"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useLocale } from "../hooks/useLocale";

const ZONE_LABEL_KEY = {
  zone_a: "trends.zoneA",
  zone_b: "trends.zoneB",
  zone_c: "trends.zoneC",
};

const INDICATOR_LABEL_KEY = {
  prcptot: "trends.indicatorPrcptot",
  r50mm: "trends.indicatorR50",
};

const GOVERNING_TEST_KEY = {
  STANDARD_MANN_KENDALL: "trends.testStandard",
  MODIFIED_MANN_KENDALL: "trends.testModified",
};

const DIRECTION_KEY = {
  up: "trends.directionIncreasing",
  down: "trends.directionDecreasing",
  flat: "trends.directionFlat",
};

const EMPTY_VALUE = "—";

// Stable no-op subscription used to detect the first client render. This keeps
// Recharts out of the server/prerender pass without a setState-in-effect.
const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function ChartTooltip({ active, payload, t, formatFixed }) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="trend-tooltip" role="tooltip">
      <div className="trend-tooltip-title">
        {t("trends.tooltipYear")}: {formatFixed(point.year, 0)}
      </div>
      <div className="trend-tooltip-row">
        <span
          className="trend-tooltip-swatch trend-tooltip-swatch--observed"
          aria-hidden="true"
        />
        <span>{t("trends.tooltipObserved")}:</span>
        <strong>{formatFixed(point.observed, 1)}</strong>
      </div>
      <div className="trend-tooltip-row">
        <span
          className="trend-tooltip-swatch trend-tooltip-swatch--fitted"
          aria-hidden="true"
        />
        <span>{t("trends.tooltipFitted")}:</span>
        <strong>{formatFixed(point.fitted, 1)}</strong>
      </div>
    </div>
  );
}

function TrendArrow({ direction }) {
  const paths = {
    up: "M12 19V5M6 11l6-6 6 6",
    down: "M12 5v14M6 13l6 6 6-6",
    flat: "M5 12h14M15 8l4 4-4 4",
  };

  return (
    <svg
      className="trend-direction-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[direction] || paths.flat} />
    </svg>
  );
}

export default function TrendExplorerViewer({ data }) {
  const { t, formatNumber } = useLocale();
  const [zoneId, setZoneId] = useState(null);
  const [indicatorId, setIndicatorId] = useState(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const tabRefs = useRef({});

  // Recharts must only mount in the browser. The page already fetches on the
  // client, but this guard keeps the chart safe if the viewer is ever rendered
  // during prerendering too.
  const mounted = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();

    if (query.addEventListener) {
      query.addEventListener("change", sync);
      return () => query.removeEventListener("change", sync);
    }

    query.addListener(sync);
    return () => query.removeListener(sync);
  }, []);

  const zoneIds = useMemo(
    () => (Array.isArray(data?.zones) ? data.zones.map((zone) => zone.id) : []),
    [data]
  );

  const activeZoneId = zoneIds.includes(zoneId) ? zoneId : zoneIds[0] ?? null;
  const zone = Array.isArray(data?.zones)
    ? data.zones.find((item) => item.id === activeZoneId) ?? null
    : null;

  const indicatorIds = useMemo(
    () =>
      Array.isArray(zone?.indicators)
        ? zone.indicators.map((item) => item.id)
        : [],
    [zone]
  );

  const activeIndicatorId = indicatorIds.includes(indicatorId)
    ? indicatorId
    : indicatorIds[0] ?? null;
  const indicator = Array.isArray(zone?.indicators)
    ? zone.indicators.find((item) => item.id === activeIndicatorId) ?? null
    : null;

  if (!zone || !indicator) return null;

  const metadata = data?.metadata ?? {};
  const series = Array.isArray(indicator.series) ? indicator.series : [];

  const formatFixed = (value, digits) => {
    if (value === null || value === undefined || value === "") {
      return EMPTY_VALUE;
    }
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numeric)) return EMPTY_VALUE;
    return formatNumber(numeric.toFixed(digits));
  };

  const formatSigned = (value, digits) => {
    if (value === null || value === undefined || value === "") {
      return EMPTY_VALUE;
    }
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numeric)) return EMPTY_VALUE;
    const sign = numeric > 0 ? "+" : numeric < 0 ? "−" : "";
    return `${sign}${formatNumber(Math.abs(numeric).toFixed(digits))}`;
  };

  const formatCount = (value) => formatFixed(value, 0);

  const unitLabel =
    indicator.unitSeries === "days/season"
      ? t("trends.unitDays")
      : t("trends.unitMm");
  const rateUnitLabel =
    indicator.unitRate === "days/decade"
      ? t("trends.unitDaysRate")
      : t("trends.unitMmRate");

  const direction =
    indicator.slopePerDecade === null
      ? "unknown"
      : indicator.slopePerDecade > 0
        ? "up"
        : indicator.slopePerDecade < 0
          ? "down"
          : "flat";

  const significance = indicator.isSignificantFwer;
  let significanceKey = "trends.statSignificanceUnavailable";
  let significanceClass = "trend-stat-badge--neutral";

  if (significance === true) {
    if (indicator.slopePerDecade > 0) {
      significanceKey = "trends.statSignificantIncrease";
    } else if (indicator.slopePerDecade < 0) {
      significanceKey = "trends.statSignificantDecrease";
    } else {
      significanceKey = "trends.statTrend";
    }
    significanceClass = "trend-stat-badge--attention";
  } else if (significance === false) {
    // A positive slope with adjusted p >= 0.05 must never read as a
    // significant increase. The badge only reflects the adjusted test.
    significanceKey = "trends.statNoTrend";
  }

  const significanceDetailKey =
    significance === true
      ? "trends.statTrendDetail"
      : significance === false
        ? "trends.statNoTrendDetail"
        : null;

  const governingTestKey = GOVERNING_TEST_KEY[indicator.governingTest];
  const governingTest = governingTestKey ? t(governingTestKey) : EMPTY_VALUE;

  const chartLabel = t("trends.chartAria", {
    indicator: t(INDICATOR_LABEL_KEY[activeIndicatorId]),
    zone: t(ZONE_LABEL_KEY[activeZoneId]),
  });

  const multipleTestingPolicy =
    metadata.multipleTestingPolicy === "HOLM_BONFERRONI"
      ? t("trends.holmPolicy")
      : metadata.multipleTestingPolicy || EMPTY_VALUE;

  const handleTabKeyDown = (event, index) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    let nextIndex = index;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % zoneIds.length;
    if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + zoneIds.length) % zoneIds.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = zoneIds.length - 1;

    const nextZone = zoneIds[nextIndex];
    setZoneId(nextZone);
    tabRefs.current[nextZone]?.focus();
  };

  return (
    <section className="trend-viewer" aria-label={t("trends.viewerAria")}>
      <div className="glass-panel card-padding trend-controls">
        <div className="trend-control-block">
          <span className="trend-control-label" id="trend-zone-label">
            {t("trends.zoneLabel")}
          </span>
          <div
            className="trend-tabs"
            role="tablist"
            aria-labelledby="trend-zone-label"
            aria-label={t("trends.zonesAria")}
          >
            {zoneIds.map((id, index) => {
              const selected = id === activeZoneId;
              return (
                <button
                  key={id}
                  ref={(node) => {
                    tabRefs.current[id] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`trend-zone-tab-${id}`}
                  aria-selected={selected}
                  aria-controls="trend-zone-panel"
                  tabIndex={selected ? 0 : -1}
                  className="trend-tab"
                  onClick={() => setZoneId(id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  {t(ZONE_LABEL_KEY[id])}
                </button>
              );
            })}
          </div>
        </div>

        <div className="trend-control-block">
          <span className="trend-control-label" id="trend-indicator-label">
            {t("trends.indicatorLabel")}
          </span>
          <div
            className="trend-indicators"
            role="group"
            aria-labelledby="trend-indicator-label"
            aria-label={t("trends.indicatorsAria")}
          >
            {indicatorIds.map((id) => (
              <button
                key={id}
                type="button"
                className="trend-indicator-btn"
                aria-pressed={id === activeIndicatorId}
                onClick={() => setIndicatorId(id)}
              >
                {t(INDICATOR_LABEL_KEY[id])}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className="glass-panel card-padding trend-chart-panel"
        id="trend-zone-panel"
        role="tabpanel"
        aria-labelledby={`trend-zone-tab-${activeZoneId}`}
        tabIndex={0}
      >
        <div className="trend-chart-head">
          <div>
            <h2 className="trend-chart-title">
              {t("trends.chartTitle", {
                indicator: t(INDICATOR_LABEL_KEY[activeIndicatorId]),
                zone: t(ZONE_LABEL_KEY[activeZoneId]),
              })}
            </h2>
            <p className="trend-chart-subtitle">
              {t("trends.chartSubtitle", { unit: unitLabel })}
            </p>
          </div>
          <div className="trend-legend" aria-hidden="true">
            <span className="trend-legend-item">
              <span className="trend-legend-swatch trend-legend-swatch--observed" />
              {t("trends.legendObserved")}
            </span>
            <span className="trend-legend-item">
              <span className="trend-legend-swatch trend-legend-swatch--fitted" />
              {t("trends.legendFitted")}
            </span>
          </div>
        </div>

        <div className="trend-chart-canvas" role="img" aria-label={chartLabel}>
          {mounted ? (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart
                data={series}
                margin={{ top: 12, right: 20, bottom: 8, left: 8 }}
              >
                <CartesianGrid
                  stroke="var(--border-subtle)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="year"
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border-subtle)" }}
                  tickFormatter={(value) => formatNumber(value)}
                  minTickGap={18}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border-subtle)" }}
                  tickFormatter={(value) => formatNumber(value)}
                  width={68}
                  label={{
                    value: unitLabel,
                    angle: -90,
                    position: "insideLeft",
                    offset: 6,
                    style: {
                      fill: "var(--text-muted)",
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                    },
                  }}
                />
                <Tooltip
                  content={
                    <ChartTooltip t={t} formatFixed={formatFixed} />
                  }
                  cursor={{
                    stroke: "var(--border-subtle)",
                    strokeDasharray: "3 3",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="observed"
                  name={t("trends.legendObserved")}
                  stroke="var(--blue-primary)"
                  strokeWidth={2.5}
                  dot={{
                    r: 3,
                    fill: "var(--blue-primary)",
                    strokeWidth: 0,
                  }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={!reduceMotion}
                />
                <Line
                  type="monotone"
                  dataKey="fitted"
                  name={t("trends.legendFitted")}
                  stroke="var(--amber-caution)"
                  strokeWidth={2.5}
                  strokeDasharray="7 4"
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={!reduceMotion}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="trend-chart-placeholder" aria-hidden="true" />
          )}
        </div>

        {/* The chart is decorative for screen readers; this table is the
            complete, year-by-year equivalent of the plotted values. */}
        <div className="trend-sr-only">
          <table className="sr-only">
            <caption>{chartLabel}</caption>
          <thead>
            <tr>
              <th scope="col">{t("trends.tableYear")}</th>
              <th scope="col">
                {t("trends.tableObserved", { unit: unitLabel })}
              </th>
              <th scope="col">
                {t("trends.tableFitted", { unit: unitLabel })}
              </th>
            </tr>
          </thead>
          <tbody>
            {series.map((point) => (
              <tr key={point.year}>
                <th scope="row">{formatCount(point.year)}</th>
                <td>{formatFixed(point.observed, 1)}</td>
                <td>{formatFixed(point.fitted, 1)}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>

      <div className="trend-stats-grid">
        <article className="glass-panel trend-stat-card">
          <span className="trend-stat-label">{t("trends.statSlopeTitle")}</span>
          <div className="trend-stat-value">
            {formatSigned(indicator.slopePerDecade, 2)}
            <span className="trend-stat-unit">{rateUnitLabel}</span>
          </div>
          {direction !== "unknown" && (
            <span className={`trend-direction trend-direction--${direction}`}>
              <TrendArrow direction={direction} />
              <span>{t(DIRECTION_KEY[direction])}</span>
            </span>
          )}
          <p className="trend-stat-sub">
            {t("trends.statCi")} ({rateUnitLabel}): [
            {formatSigned(indicator.slopeCiLow, 2)},{" "}
            {formatSigned(indicator.slopeCiHigh, 2)}]
          </p>
          <p className="trend-stat-foot">{t("trends.perDecade")}</p>
        </article>

        <article className="glass-panel trend-stat-card">
          <span className="trend-stat-label">
            {t("trends.statSignificanceTitle")}
          </span>
          <div className="trend-stat-pairs">
            <div>
              <span className="trend-stat-pair-key">
                {t("trends.statRawP")}
              </span>
              <strong className="trend-stat-pair-value">
                {formatFixed(indicator.pValueRaw, 3)}
              </strong>
            </div>
            <div>
              <span className="trend-stat-pair-key">
                {t("trends.statAdjustedP")}
              </span>
              <strong className="trend-stat-pair-value">
                {formatFixed(indicator.pValueAdjusted, 3)}
              </strong>
            </div>
          </div>
          <span className={`trend-stat-badge ${significanceClass}`}>
            {t(significanceKey)}
          </span>
          {significanceDetailKey && (
            <p className="trend-stat-sub">{t(significanceDetailKey)}</p>
          )}
        </article>

        <article className="glass-panel trend-stat-card">
          <span className="trend-stat-label">
            {t("trends.statAutocorrTitle")}
          </span>
          <div className="trend-stat-value">
            {formatSigned(indicator.autocorrelationR1, 3)}
            <span className="trend-stat-unit">r₁</span>
          </div>
          <p className="trend-stat-sub">
            {t("trends.statGoverningTest")}: <strong>{governingTest}</strong>
          </p>
          <p className="trend-stat-foot">{t("trends.autocorrRule")}</p>
        </article>

        <article className="glass-panel trend-stat-card">
          <span className="trend-stat-label">
            {t("trends.statCompletenessTitle")}
          </span>
          <div className="trend-stat-value">
            {formatCount(indicator.completeSeasons)}
            <span className="trend-stat-unit">
              / {formatCount(indicator.totalSeasons)}
            </span>
          </div>
          <p className="trend-stat-sub">
            {t("trends.statCompleteSeasons", {
              complete: formatCount(indicator.completeSeasons),
              total: formatCount(indicator.totalSeasons),
            })}
          </p>
          <p className="trend-stat-foot">{t("trends.statCompleteNote")}</p>
        </article>
      </div>

      <aside
        className="trend-disclaimer"
        role="note"
        aria-labelledby="trend-disclaimer-title"
      >
        <div className="trend-disclaimer-icon" aria-hidden="true">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <h2 id="trend-disclaimer-title" className="trend-disclaimer-title">
            {t("trends.disclaimerTitle")}
          </h2>
          <p className="trend-disclaimer-body">{t("trends.disclaimerBody")}</p>
        </div>
      </aside>

      <section
        className="glass-panel card-padding trend-metadata"
        aria-labelledby="trend-metadata-title"
      >
        <h2 id="trend-metadata-title" className="trend-metadata-title">
          {t("trends.metadataTitle")}
        </h2>
        <dl className="trend-metadata-list">
          <div>
            <dt>{t("trends.dataset")}</dt>
            <dd>{metadata.dataset || EMPTY_VALUE}</dd>
          </div>
          <div>
            <dt>{t("trends.period")}</dt>
            <dd>{metadata.primaryPeriod || EMPTY_VALUE}</dd>
          </div>
          <div>
            <dt>{t("trends.coverage")}</dt>
            <dd>{metadata.spatialCoverageThreshold || EMPTY_VALUE}</dd>
          </div>
          <div>
            <dt>{t("trends.sampleThreshold")}</dt>
            <dd>{metadata.sampleThreshold || EMPTY_VALUE}</dd>
          </div>
          <div>
            <dt>{t("trends.multipleTesting")}</dt>
            <dd>{multipleTestingPolicy}</dd>
          </div>
          <div>
            <dt>{t("trends.provenanceLabel")}</dt>
            <dd className="trend-metadata-mono">
              {data?.provenance || EMPTY_VALUE}
            </dd>
          </div>
          <div>
            <dt>{t("trends.statusLabel")}</dt>
            <dd className="trend-metadata-mono">
              {data?.analysisStatus || EMPTY_VALUE}
            </dd>
          </div>
        </dl>
      </section>
    </section>
  );
}
