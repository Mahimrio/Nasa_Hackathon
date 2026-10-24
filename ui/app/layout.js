import "./globals.css";
import { LocaleProvider } from "./hooks/useLocale";
import { TelemetryProvider } from "./context/TelemetryContext";
import ProvenanceNotice from "./components/ProvenanceNotice";

export const metadata = {
  title: "HydroSense-SWOT — Synthetic Demo",
  description:
    "A synthetic engineering demonstration of hydrologic-routing software. It is not an operational warning or validated forecast.",
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
          <TelemetryProvider><ProvenanceNotice />{children}</TelemetryProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
