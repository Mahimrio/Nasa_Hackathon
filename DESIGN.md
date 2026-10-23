---
name: HydroSense-SWOT
description: Restrained, professional scientific telemetry and harvest decision-support tool for transboundary flash-flood early warning in the Haor basin of Bangladesh
colors:
  bg-canvas: "#F5F8FA"
  surface-card: "#FFFFFF"
  surface-subtle: "#F8FAFC"
  border-default: "#DCE5EA"
  border-subtle: "rgba(220, 229, 234, 0.7)"
  text-primary: "#173B57"
  text-secondary: "#566B7C"
  text-muted: "#7A8F9E"
  blue-primary: "#287BB5"
  blue-deep: "#175A85"
  blue-light: "#EBF3F8"
  green-safe: "#34805A"
  green-light: "#E9F4EC"
  amber-caution: "#B7791F"
  amber-light: "#FEF9EE"
  red-danger: "#B4232F"
  red-light: "#FDF2F2"
typography:
  display:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1.625rem, 3vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  bangla:
    fontFamily: "'Noto Sans Bengali', -apple-system, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.65
  mono:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.875rem"
    fontWeight: 550
    lineHeight: 1.45
    letterSpacing: "-0.01em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  panel-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    borderColor: "{colors.border-default}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
    boxShadow: "0 1px 3px rgba(23, 59, 87, 0.05)"
  button-primary:
    backgroundColor: "{colors.blue-primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 18px"
    minHeight: "44px"
  badge-status:
    rounded: "{rounded.pill}"
    padding: "4px 12px"
    fontSize: "13px"
---

# Design System — HydroSense-SWOT

## 1. Overview & Visual Philosophy

HydroSense-SWOT is a high-precision scientific telemetry and harvest decision-support instrument tailored for transboundary flash-flood early warning in the Haor basin of northeastern Bangladesh. It is used by Upazila agricultural extension officers (DAE) and Boro rice farming communities.

The design adheres to a **calm, readable, trustworthy professional light visual language**:
- **Clean Solid Surfaces:** High-legibility white surfaces (`#FFFFFF`) on a soft neutral blue-gray canvas (`#F5F8FA`) with delicate perimeter dividers (`#DCE5EA`).
- **No Unnecessary Decoration:** Glassmorphism, translucent backdrops, neumorphic buttons, heavy drop shadows, neon cyan blooms, and continuous pulsing animations have been removed to prioritize clarity, contrast, and operational trust.
- **Scientific Credibility:** Primary decisions (GREEN / AMBER / RED) and modelled gauge water levels are visually anchored with high prominence, while secondary hydrological validation and assumptions remain accessible without competing for visual attention.
- **First-Class Bilingualism:** Full parity between English and Bengali (`Noto Sans Bengali`), with comfortable line heights (1.6–1.7) ensuring vowel markers and conjuncts render crisply without clipping or crowding.

---

## 2. Palette & Semantic Color System

### 2.1 Core Surfaces & Text
- **Canvas Background (`#F5F8FA`):** Soft, eye-friendly light backdrop that prevents glare while sustaining contrast.
- **Card Surfaces (`#FFFFFF`):** Crisp, solid surface providing maximum typographic contrast.
- **Subtle Wells (`#F8FAFC`):** Light recessed areas for parameter listings and telemetry breakdowns.
- **Borders & Dividers (`#DCE5EA`):** 1px structural bounds preventing card ambiguity without heavy visual noise.
- **Primary Text (`#173B57`):** Deep navy with > 9:1 contrast ratio against white surfaces for effortless scannability.
- **Secondary Text (`#566B7C`):** Calibrated slate-blue for descriptions, subtitles, and metadata (> 4.5:1 contrast).
- **Muted Text (`#7A8F9E`):** Reserved strictly for non-critical timestamps and unit tags.

### 2.2 Semantic Status & Hydrology
- **Interface & River Blue (`#287BB5`):** Interactive actions, primary river pathways, and calibrated reach vectors.
- **Deep Blue (`#175A85`):** Modeled hydrograph trajectory and major metrics.
- **Green Safe (`#34805A` / `#E9F4EC`):** NORMAL status — stage well below danger threshold (< 80%), safe for maturing Boro rice.
- **Amber Caution (`#B7791F` / `#FEF9EE`):** CAUTION / WATCH — stage at 80%–100% of danger level; farmers and extension officers mobilize harvest machinery.
- **Red Danger (`#B4232F` / `#FDF2F2`):** BREACH / FLOOD RISK — stage reaching or exceeding 13.20 m PWD; immediate harvest order.

---

## 3. Typography Architecture

### Minimum Hierarchy Targets
| Element | Target Size | Line Height | Weight |
|---|---|---|---|
| **Main Page Heading** | 26–32 px desktop; 24–28 px mobile | 1.25 | 700 |
| **Major Decision / Status Value** | 28–36 px | 1.2 | 750–800 |
| **Section & Card Headings** | 18–20 px | 1.35 | 650–700 |
| **Main Body Text** | 16 px baseline | 1.55 (EN), 1.65 (BN) | 400 |
| **Supporting Descriptions** | 14–16 px | 1.5 | 400–500 |
| **Form Labels & Metric Metadata** | 14 px | 1.4 | 600 |
| **Secondary Metadata & Chips** | 12.5–13.5 px | 1.4 | 600 |
| **Chart Axes & Tick Labels** | 12–12.5 px | 1.2 | 500 (Mono) |
| **Interactive Buttons & Nav** | 14–16 px | 1.3 | 600–700 (min 44px touch) |

*Rule:* No user-facing data or label is rendered below 12px. Uppercase text is strictly confined to short telemetry codes and station abbreviations.

---

## 4. Map & Visualization Layers

- **Interactive Reach Map:** Renders verified coordinates for the Kanaighat SW266 gauge (`[24.9980, 92.2594]`, danger 13.20m PWD) and the Surma/Kushiyara river geometry.
- **Layer Disclosure Accordions:** The map layer control provides individual toggle-down disclosure panels for all 4 GIS layers:
  1. River Flow Motion (vector trajectories)
  2. SWOT Satellite Swaths (KaRIn radar tracks)
  3. HydroSHEDS Basins (drainage divides)
  4. IMERG Rainfall Heatmap (satellite precipitation plume)
- **CVD-Safe Color Palettes:** Cividis and Viridis color ramps for continuous discharge and rainfall fields to ensure accessibility for color-vision-deficient users.

---

## 5. Layout & Information Architecture

- **Three Dedicated Pages (Module 1 — Operational Flood Warning):**
  1. `/dashboard` — 5-Second Triage, Primary Harvest Decision, River Map, Hydrograph, Accuracy Scorecard, and Operational Limits.
  2. `/forecast` — Detailed 72h Muskingum-Cunge hydrological forecast and parameter controls.
  3. `/advisory` — Actionable harvest advisories, printable field bulletin, and farmer/officer directives.
- **Analytical View (Module 2 — Historical Rainfall Trend Explorer):**
  - Delivered via dedicated `TrendExplorerViewer.js` component activated via topbar segmented switcher (`🛰️ Real-Time Warning` vs `📊 Rainfall Trends`).
  - Features 25-year Recharts multi-decadal time-series chart with solid navy Sen's slope line (`#175A85`), analytical 95% CI envelope (`rgba(40, 123, 181, 0.12)`), 4 factual statistical cards, and contextual climatological disclaimer well (`#F8FAFC`).
- **Responsive Viewport Targets:** Verified across 1440×900 (desktop), 1366×768 (laptop), 390×844 (mobile), and 360×800 (narrow mobile). No horizontal overflow.
