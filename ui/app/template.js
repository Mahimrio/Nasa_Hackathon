import { ViewTransition } from "react";

// Templates remount on every navigation (layouts persist), so the page below the
// header gets a fresh enter/exit pair. Animations live in motion.css; Links tag
// forward/back moves with transitionTypes (see lib/navDirection.js).
const PAGE_MOTION = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "page-fade",
};

export default function Template({ children }) {
  return (
    <ViewTransition enter={PAGE_MOTION} exit={PAGE_MOTION} default="none">
      {children}
    </ViewTransition>
  );
}
