---
name: HydroSense-SWOT
description: Cinematic scientific telemetry and harvest decision dashboard for transboundary flash-flood early warning in the Haor basin
colors:
  bg-canvas: "#050A12"
  bg-viewport: "#08111F"
  surface-glass: "rgba(14, 27, 45, 0.88)"
  surface-raised: "rgba(18, 35, 57, 0.78)"
  surface-active: "rgba(24, 43, 68, 0.72)"
  glass-stroke: "rgba(177, 221, 255, 0.14)"
  glass-stroke-strong: "rgba(126, 213, 255, 0.34)"
  cyan-primary: "#35D8F2"
  cyan-glow: "rgba(53, 216, 242, 0.45)"
  blue-deep: "#1A56DB"
  emerald-safe: "#10B981"
  amber-caution: "#F59E0B"
  crimson-danger: "#EF4444"
  text-primary: "#F8FAFC"
  text-secondary: "#94A3B8"
  text-muted: "#64748B"
typography:
  display:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  mono:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.01em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  panel-card:
    backgroundColor: "{colors.surface-glass}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
  button-primary:
    backgroundColor: "{colors.cyan-primary}"
    textColor: "{colors.bg-canvas}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  badge-status:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System — HydroSense-SWOT

## Overview

HydroSense-SWOT is a high-precision scientific telemetry instrument tailored for transboundary flash-flood early warning in the Haor basin of northeastern Bangladesh. Its aesthetic balances deep atmospheric space-science immersion with critical agricultural decision support.

The system fuses five tactile aesthetic disciplines:
- **Glassmorphism:** Layered translucent instrument panels (`backdrop-filter: blur(16px)`), sub-pixel top highlights, and micro-grooved inset strokes.
- **Restrained Neumorphism:** Soft, dual-shadowed interactive wells, timeline sliders, and segmented toggle states that feel physically machined.
- **Atmospheric Glow ("Blustmorphism"):** Radiant ambient cyan and navy light blooms that give depth to high-priority alerts without compromising text legibility.
- **Infomorphism:** Information-dense, scannable KPI hierarchy with tabular monospace telemetry, uncertainty envelopes, and unambiguous danger thresholds.
- **River & Vector Motion:** Smooth SVG hydrodynamic water trails, sonar-style gauge pulses, and synchronized timeline scrubbing.

## Colors

### Surface Hierarchy
- `bg-canvas` (`#050A12`): The deepest void layer beneath all components.
- `bg-viewport` (`#08111F`): Atmospheric viewport background with subtle radial gradient illumination.
- `surface-glass` (`rgba(14, 27, 45, 0.88)`): Primary instrument card base with 16px backdrop blur.
- `surface-raised` (`rgba(18, 35, 57, 0.78)`): Elevated cards, modals, and metric wells.
- `surface-active` (`rgba(24, 43, 68, 0.72)`): Hover and active states for interactive controls.

### Functional Accents
- `cyan-primary` (`#35D8F2`): Primary telemetry indicator, active river reach highlights, and radar sweeps.
- `blue-deep` (`#1A56DB`): Modeled hydrograph line and secondary hydraulic conveyance.
- `emerald-safe` (`#10B981`): GREEN Harvest Flag; indicates safe stage (< 80% danger level) allowing Boro crops to mature.
- `amber-caution` (`#F59E0B`): AMBER Harvest Flag; indicates caution (80%–100% danger level); mobilize machinery.
- `crimson-danger` (`#EF4444`): RED Harvest Flag; indicates imminent breach (≥ 13.20 m PWD); emergency harvest order.

## Typography

- **Display & Headings:** `Outfit`, sans-serif. Geometric precision, high legibility, modern scientific authority.
- **Body & Controls:** `Outfit`, sans-serif. Balanced x-height, clear letterforms in dense layouts.
- **Bilingual Bengali Support:** `Noto Sans Bengali`, sans-serif. Seamless rendering of Bengali advisory bulletins and directives.
- **Telemetry & Numbers:** `JetBrains Mono`, monospace. Tabular digits (`font-variant-numeric: tabular-nums`) ensuring stable alignment across live updates and scrubber transitions.

## Layout

- **Desktop (≥ 1280px):** 12-column responsive grid with a 7:5 split between the hero river reach map and the primary harvest decision panel, anchored by a full-width hydrograph and lower telemetry metrics.
- **Tablet (768px – 1279px):** Adaptive 2-column stacked layout with synchronized timeline controls.
- **Mobile (< 768px):** Single-column stacked telemetry stream prioritizing the Harvest Decision flag and immediate advisories at the viewport top.
- **Density:** High information density with strict 8px/16px/24px spacing tokens.

## Elevation & Depth

- **Ambient Layer (z-0):** Subtle cosmic blooms with low opacity (0.10–0.25) positioned strategically behind hero charts.
- **Instrument Surface (z-10):** Semi-opaque glass cards with `box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)`.
- **Raised Controls (z-20):** Neumorphic buttons with dual soft shadows (`-2px -2px 6px rgba(255, 255, 255, 0.04), 3px 3px 8px rgba(0, 0, 0, 0.6)`).
- **Overlays & Modals (z-50):** Deep backdrop blur (`24px`) with high-contrast perimeter strokes.

## Shapes

- **Cards & Modals:** 16px corner radius (`rounded-lg`) balancing sleek curvature with compact telemetry density.
- **Controls & Buttons:** 10px corner radius (`rounded-md`).
- **Badges & Pills:** Fully rounded pill shapes (`rounded-pill`, 9999px) for status indicators and chip toggles.

## Components

- **App Header:** Global brand bar with active reach status, satellite pass countdown, bilingual toggle, and modal shortcuts.
- **River Reach Map Panel:** Interactive SVG schematic tracing 4 SWOT reaches (2128000001 to 2128000004), flow trails, and the Kanaighat gauge station.
- **Harvest Decision Panel:** The visual anchor; displays the instantaneous decision state (GREEN / AMBER / RED), modeled stage, danger clearance, and actionable Bengali advisory.
- **Hydrograph Panel:** Recharts time-series displaying observed BWDB stage, Muskingum-Cunge routed forecast, SWOT ±0.18m uncertainty envelope, and danger level (13.20m).
- **Validation Metrics Panel:** Live scientific accuracy scorecard (NSE, KGE, PBIAS, lead time).
- **Operational Limits Panel:** Transparent disclaimer card detailing SWOT repeat cycle, IMERG latency, and hydraulic assumptions.

## Do's and Don'ts

### Do
- Always use tabular numbers (`tabular-nums`) for gauge levels, discharges, and timestamps.
- Use CVD-safe palette mappings and pair all color statuses with explicit icons and text.
- Maintain subtle perimeter glow highlights rather than heavy solid card borders.
- Keep the Harvest Decision flag visible and unambiguous at every breakpoint.

### Don't
- Never use heavy single-sided colored card borders (`border-left: 3px solid color`) — use refined perimeter styling and subtle elevation.
- Never use generic, unstyled sans-serif fonts; rely strictly on `Outfit`, `JetBrains Mono`, and `Noto Sans Bengali`.
- Never plaster decorative grid lines across non-data background areas; confine coordinate grids strictly to maps and chart axes.
- Never animate elements in a way that interferes with reading numerical hydrological values.
