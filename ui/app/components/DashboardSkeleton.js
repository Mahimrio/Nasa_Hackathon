"use client";

import React from "react";

export default function DashboardSkeleton({ lang = "bn" }) {
  const isBn = lang === "bn";

  return (
    <div
      className="dashboard-skeleton-wrapper"
      role="status"
      aria-busy="true"
      aria-label={isBn ? "টেলিম্যাট্রি ডেটা লোড হচ্ছে..." : "Loading HydroSense-SWOT telemetry..."}
      style={{
        width: "100%",
        maxWidth: "1480px",
        margin: "0 auto",
        padding: "var(--space-4) var(--space-4) var(--space-8)",
      }}
    >
      {/* Context Bar Skeleton */}
      <div
        className="glass-panel skeleton-shimmer"
        style={{
          height: "90px",
          marginBottom: "var(--space-4)",
          borderRadius: "var(--radius-lg)",
        }}
      />

      {/* Main Grid: Map (7 col) & Decision (5 col) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.35fr 1fr",
          gap: "var(--space-4)",
          marginBottom: "var(--space-4)",
        }}
        className="skeleton-top-grid"
      >
        {/* Map Skeleton */}
        <div
          className="glass-panel skeleton-shimmer"
          style={{
            height: "530px",
            borderRadius: "var(--radius-lg)",
          }}
        />

        {/* Decision Panel Skeleton */}
        <div
          className="glass-panel skeleton-shimmer"
          style={{
            height: "530px",
            borderRadius: "var(--radius-lg)",
          }}
        />
      </div>

      {/* Hydrograph Panel Skeleton */}
      <div
        className="glass-panel skeleton-shimmer"
        style={{
          height: "380px",
          marginBottom: "var(--space-4)",
          borderRadius: "var(--radius-lg)",
        }}
      />

      {/* Validation Metrics Grid Skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "var(--space-3)",
          marginBottom: "var(--space-4)",
        }}
        className="skeleton-metrics-grid"
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="glass-panel skeleton-shimmer"
            style={{
              height: "170px",
              borderRadius: "var(--radius-md)",
            }}
          />
        ))}
      </div>

      {/* Operational Limits Skeleton */}
      <div
        className="glass-panel skeleton-shimmer"
        style={{
          height: "140px",
          borderRadius: "var(--radius-lg)",
        }}
      />

      {/* Shimmer CSS Style definition */}
      <style jsx>{`
        @keyframes shimmerPulse {
          0% {
            background-position: -200% 0;
            opacity: 0.6;
          }
          50% {
            opacity: 0.9;
          }
          100% {
            background-position: 200% 0;
            opacity: 0.6;
          }
        }

        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            rgba(14, 27, 45, 0.7) 0%,
            rgba(56, 189, 248, 0.12) 50%,
            rgba(14, 27, 45, 0.7) 100%
          );
          background-size: 200% 100%;
          animation: shimmerPulse 1.6s infinite ease-in-out;
          border: 1px solid rgba(177, 221, 255, 0.08);
        }

        @media (max-width: 1100px) {
          .skeleton-top-grid {
            grid-template-columns: 1fr !important;
          }
          .skeleton-metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
