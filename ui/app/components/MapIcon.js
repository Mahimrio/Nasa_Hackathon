// Line icons for the map toolbar and layer list (replaces platform emoji, which
// render differently on every OS and clash with the rest of the interface).
const PATHS = {
  map: (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  light: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  satellite: (
    <>
      <path d="m13 7 4 4-6 6-4-4 6-6Z" />
      <path d="m15 5 2-2 4 4-2 2M9 19l-2 2-4-4 2-2" />
      <path d="M16 16a3 3 0 0 0 3 3M16 13a6 6 0 0 0 6 6" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  waves: (
    <>
      <path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <path d="M2 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <path d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    </>
  ),
  wave: <path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />,
  orbit: (
    <>
      <circle cx="12" cy="12" r="3" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-30 12 12)" />
    </>
  ),
  mountain: <path d="m3 20 6-11 4 6 2-3 6 8H3Z" />,
  rain: (
    <>
      <path d="M7 15a4 4 0 0 1-.6-7.95A5.5 5.5 0 0 1 17 7a4 4 0 0 1 .5 8" />
      <path d="M8 18v2M12 17v3M16 18v2" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  offline: (
    <>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </>
  ),
};

export default function MapIcon({ name, size = 15, strokeWidth = 1.9, style }) {
  return (
    <svg
      className="map-ui-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={style}
    >
      {PATHS[name]}
    </svg>
  );
}
