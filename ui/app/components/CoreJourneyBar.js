"use client";

import { useLocale } from "../hooks/useLocale";

export default function CoreJourneyBar({
  activeStep,
  setActiveStep,
  currentFlag = "RED",
}) {
  const { lang, t } = useLocale();

  const steps = [
    {
      id: "detect-risk",
      num: "1",
      phase: t("journey.step1Phase"),
      title: t("journey.step1Title"),
      desc: t("journey.step1Desc"),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      flagColor: currentFlag === "RED" ? "var(--red-400)" : currentFlag === "AMBER" ? "var(--amber-400)" : "var(--green-400)",
    },
    {
      id: "forecast-analysis",
      num: "2",
      phase: t("journey.step2Phase"),
      title: t("journey.step2Title"),
      desc: t("journey.step2Desc"),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      flagColor: "var(--cyan-400)",
    },
    {
      id: "harvest-advisory",
      num: "3",
      phase: t("journey.step3Phase"),
      title: t("journey.step3Title"),
      desc: t("journey.step3Desc"),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      flagColor: currentFlag === "RED" ? "var(--red-400)" : "var(--amber-400)",
    },
  ];

  const handleStepClick = (stepId) => {
    setActiveStep(stepId);
    const targetElement = document.getElementById(`journey-${stepId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      className="core-journey-stepper-wrap"
      aria-label={t("journey.title")}
      role="navigation"
    >
      <div className="journey-stepper-header">
        <span className="journey-stepper-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-400)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          {t("journey.title")}
        </span>

        <button
          className={`journey-all-btn ${activeStep === "all" ? "active" : ""}`}
          onClick={() => {
            setActiveStep("all");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-pressed={activeStep === "all"}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          {t("journey.allView")}
        </button>
      </div>

      <div className="journey-steps-grid" role="tablist">
        {steps.map((s, idx) => {
          const isActive = activeStep === s.id;
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={isActive}
              className={`journey-step-card ${isActive ? "active" : ""}`}
              onClick={() => handleStepClick(s.id)}
            >
              <div className="journey-step-top">
                <span className="journey-step-badge" style={{ borderColor: s.flagColor }}>
                  {s.num}
                </span>
                <span className="journey-step-phase" style={{ color: isActive ? s.flagColor : "var(--text-muted)" }}>
                  {s.phase}
                </span>
                <span className="journey-step-icon" style={{ color: s.flagColor }} aria-hidden="true">
                  {s.icon}
                </span>
              </div>
              <div className="journey-step-title">{s.title}</div>
              <div className="journey-step-desc">{s.desc}</div>
              {idx < steps.length - 1 && (
                <div className="journey-arrow-indicator" aria-hidden="true">
                  ➔
                </div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
