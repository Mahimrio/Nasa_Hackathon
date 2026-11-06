// Journey order used to pick the slide direction of a route change:
// Dashboard (1) → Forecast (2) → Advisory (3) → Trend Explorer.
const ROUTE_ORDER = {
  "/": 0,
  "/dashboard": 0,
  "/forecast": 1,
  "/advisory": 2,
  "/trends": 3,
};

export const NAV_FORWARD = ["nav-forward"];
export const NAV_BACK = ["nav-back"];

/** Link `transitionTypes` for a move from `fromPath` to `toPath`. */
export function navTransitionTypes(fromPath, toPath) {
  const from = ROUTE_ORDER[fromPath];
  const to = ROUTE_ORDER[toPath];
  if (from === undefined || to === undefined || from === to) return undefined;
  return to > from ? NAV_FORWARD : NAV_BACK;
}
