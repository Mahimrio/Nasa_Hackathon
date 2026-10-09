import "./globals.css";

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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
