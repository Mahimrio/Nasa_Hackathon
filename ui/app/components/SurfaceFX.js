"use client";

import { useEffect } from "react";

/**
 * Pointer-follow light for surfaces.
 *
 * Writes --mx / --my (px, relative to the hovered surface) so the CSS
 * spotlight in mocha-blend.css can follow the cursor. One delegated,
 * rAF-throttled listener — no per-card handlers, no React state, no re-renders.
 * Skipped entirely for coarse pointers and reduced-motion users.
 */
const SURFACE_SELECTOR = ".glass-panel, .triage-pillar-card, .metric-card, .advisory-stat-box";

export default function SurfaceFX() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduced.matches) return undefined;

    let frame = 0;
    let lastEvent = null;

    const paint = () => {
      frame = 0;
      if (!lastEvent) return;
      const target = lastEvent.target;
      if (!(target instanceof Element)) return;
      const surface = target.closest(SURFACE_SELECTOR);
      if (!surface) return;
      const rect = surface.getBoundingClientRect();
      surface.style.setProperty("--mx", `${lastEvent.clientX - rect.left}px`);
      surface.style.setProperty("--my", `${lastEvent.clientY - rect.top}px`);
    };

    const onMove = (event) => {
      lastEvent = event;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
