"use client";

/**
 * Loading placeholder that mirrors the dashboard's real layout (same shell width,
 * same hero grid), so when data arrives the content replaces the blocks in place
 * instead of the page reflowing.
 *
 * Styling lives in shell.css. It used to be styled-jsx on top of `.glass-panel`,
 * and the theme's own `.glass-panel` background silently won, so the shimmer never
 * showed in the Mocha theme.
 */
export default function DashboardSkeleton({ lang = "bn" }) {
  const isBn = lang === "bn";

  return (
    <div
      className="dashboard-shell skeleton-shell"
      role="status"
      aria-busy="true"
      aria-label={isBn ? "টেলিম্যাট্রি ডেটা লোড হচ্ছে..." : "Loading HydroSense-SWOT telemetry..."}
    >
      <div className="skeleton-block skeleton-context" />

      <div className="skeleton-block skeleton-triage">
        <div className="skeleton-pillars">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-pillar" />
          ))}
        </div>
      </div>

      <div className="dashboard-hero-row">
        <div className="skeleton-block skeleton-map" />
        <div className="skeleton-block skeleton-decision" />
      </div>

      <div className="skeleton-journey">
        <div className="skeleton-block skeleton-journey-card" />
        <div className="skeleton-block skeleton-journey-card" />
      </div>
    </div>
  );
}
