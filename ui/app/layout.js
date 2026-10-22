import "./globals.css";
import { LocaleProvider } from "./hooks/useLocale";
import { TelemetryProvider } from "./context/TelemetryContext";

export const metadata = {
  title: "HydroSense-SWOT — Haor Basin Flood & Harvest Early Warning",
  description:
    "SWOT-calibrated hydrologic routing of GPM IMERG rainfall for Boro rice harvest timing in the Surma-Kushiyara corridor, Bangladesh. NASA Space Apps 2026.",
  keywords: [
    "NASA SWOT",
    "GPM IMERG",
    "Haor basin",
    "flood warning",
    "Boro rice",
    "Bangladesh",
    "Space Apps 2026",
  ],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5F8FA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn" data-theme="mocha" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('hydrosense_theme') || 'mocha';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <LocaleProvider>
          <TelemetryProvider>{children}</TelemetryProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
