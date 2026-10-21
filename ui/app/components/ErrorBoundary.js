"use client";

import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("HydroSense Dashboard Error caught by boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const isBn = this.props.lang === "bn";
      return (
        <div
          className="loading-screen-wrap"
          role="alert"
          style={{
            maxWidth: "600px",
            margin: "60px auto",
            padding: "32px",
            borderRadius: "16px",
            background: "rgba(14, 27, 45, 0.95)",
            border: "1.5px solid rgba(255, 100, 124, 0.4)",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(255, 100, 124, 0.15)",
              border: "1px solid rgba(255, 100, 124, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px auto",
              color: "var(--red-400)",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h2
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "8px",
            }}
          >
            {isBn ? "টেলিম্যাট্রি লোড ত্রুটি হয়েছে" : "Dashboard Telemetry Error Encountered"}
          </h2>

          <p
            style={{
              fontSize: "13.5px",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: "20px",
            }}
          >
            {isBn
              ? "হাইড্রোসেন্স ডেটাসেট বা কম্পোনেন্ট লোড করতে ব্যর্থ হয়েছে। স্থানীয় ক্যাশ পুনরায় সচল করতে নিচের বাটনে ক্লিক করুন।"
              : "HydroSense was unable to render the operational view. Static JSON fixtures remain available offline in public/data."}
          </p>

          {this.state.error && (
            <div
              style={{
                background: "rgba(5, 10, 18, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "8px",
                padding: "10px 14px",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-muted)",
                textAlign: "left",
                marginBottom: "24px",
                overflowX: "auto",
              }}
            >
              {this.state.error.toString()}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              className="btn-standard btn-primary"
              onClick={this.handleRetry}
              style={{ minHeight: "44px", padding: "0 24px", fontSize: "14px", fontWeight: 700 }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>{isBn ? "পুনরায় চেষ্টা করুন" : "Retry Telemetry Hydration"}</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
