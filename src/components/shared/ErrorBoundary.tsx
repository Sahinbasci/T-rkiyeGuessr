"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0f",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              Bir hata oluştu
            </h1>
            <p style={{ color: "#888", marginBottom: "1.5rem" }}>
              Sayfa yeniden yüklenecek.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.75rem 2rem",
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              Yeniden Yükle
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
