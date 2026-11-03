"use client";

import { usePathname } from "next/navigation";
import AppHeader from "./AppHeader";
import { useLocale } from "../hooks/useLocale";
import { useTelemetry } from "../context/TelemetryContext";

const noop = () => {};

/**
 * One header for the whole app, mounted in the root layout.
 *
 * It used to be rendered by every page, so it was torn down and rebuilt on each
 * navigation and on the loading to loaded swap. That replayed its entrance
 * animation and made a smooth tab transition impossible. Living in the layout
 * means it stays mounted while only the page below it changes.
 */
export default function GlobalHeader() {
  const pathname = usePathname();
  const { lang } = useLocale();
  const { dateStr, timeStr, loading, setShowBulletin, setShowModelInfo } = useTelemetry();

  // /trends renders no modals, so the bulletin and model-info buttons do nothing there.
  const hasModals = pathname !== "/trends" && !loading;

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        {lang === "en" ? "Skip to Main Content" : "মূল বিষয়বস্তুতে যান"}
      </a>
      <AppHeader
        currentDateStr={loading || !dateStr ? "-- --- 2026" : dateStr}
        currentTimeStr={loading || !timeStr ? "--:--" : timeStr}
        onOpenBulletin={hasModals ? () => setShowBulletin(true) : noop}
        onOpenModelInfo={hasModals ? () => setShowModelInfo(true) : noop}
      />
    </>
  );
}
