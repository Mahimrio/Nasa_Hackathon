export default function HydroSenseLogo({ size = 22, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Water droplet */}
      <path d="M12 3.2 6.2 10.9a5.6 5.6 0 1 0 9.4 6.1" />
      <path d="M12 3.2l2.6 3.4" />
      {/* River wave inside the droplet */}
      <path d="M8 14.2c1.1-.9 2.2-.9 3.3 0s2.2.9 3.3 0" strokeWidth="1.6" />
      <path d="M8.6 17.2c.95-.7 1.9-.7 2.85 0" strokeWidth="1.4" opacity="0.7" />
      {/* Satellite orbit swath (SWOT) */}
      <path d="M13.6 11.2c2.6-1.5 5.1-1.2 6.2.2s.4 3.6-1.8 5.6" strokeWidth="1.4" opacity="0.85" />
      <circle cx="19.9" cy="11.5" r="1.35" fill="currentColor" stroke="none" />
    </svg>
  );
}
