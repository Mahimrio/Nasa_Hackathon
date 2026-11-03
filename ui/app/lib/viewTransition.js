import { flushSync } from "react-dom";

/**
 * Runs a synchronous UI update inside a View Transition so the browser
 * cross-fades the old and new page states (language and theme switches).
 *
 * Falls back to a plain update when the API is missing (Firefox) or the user
 * prefers reduced motion. `update` must apply its change synchronously: it is
 * wrapped in flushSync so the "new" snapshot is taken after React has committed.
 */
export function withViewTransition(update) {
  if (typeof document === "undefined") {
    update();
    return;
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || typeof document.startViewTransition !== "function") {
    update();
    return;
  }

  document.startViewTransition(() => {
    flushSync(update);
  });
}
