import "./globals.css";
import "./mocha-blend.css";
import "./shell.css";
import "./motion.css";
import { LocaleProvider } from "./hooks/useLocale";
import { TelemetryProvider } from "./context/TelemetryContext";
import ProvenanceNotice from "./components/ProvenanceNotice";
import SurfaceFX from "./components/SurfaceFX";
import GlobalHeader from "./components/GlobalHeader";

// Type system: Fraunces (display) / Manrope (interface) / IBM Plex Mono (data)
// plus Noto Sans + Noto Serif Bengali so the Bengali UI keeps the same roles.
const FONT_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+Bengali:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@500;600;700&display=swap";

export const metadata = {
  title: "HydroSense-SWOT — NASA Earth System Trend Detective",
  description:
    "Provenance-verified 25-year (2001–2025) NASA GPM IMERG Final rainfall trend analysis and hydrodynamic flood modeling for the Sylhet Haor Basin.",
  keywords: [
    "NASA Space Apps 2026",
    "Earth System Trend Detective",
    "NASA GPM IMERG",
    "NASA SWOT",
    "Theil-Sen Slope",
    "Modified Mann-Kendall",
    "Haor basin",
    "flood warning",
    "Boro rice",
    "Bangladesh",
  ],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1D130D",
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn" data-theme="mocha" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONT_STYLESHEET} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('hydrosense_theme') || 'mocha';
                document.documentElement.setAttribute('data-theme', theme);
                var l = document.createElement('link');
                l.id = 'app-favicon'; l.rel = 'icon'; l.type = 'image/svg+xml';
                l.href = theme === 'mocha' ? '/logo-mocha.svg' : '/logo-light.svg';
                document.head.appendChild(l);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <LocaleProvider>
          <TelemetryProvider>
            <ProvenanceNotice />
            <GlobalHeader />
            {children}
            <SurfaceFX />
          </TelemetryProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
