"use client";

import React from "react";
import { trackError } from "@/utils/telemetry";

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

// Per-screen error boundary for Game/Lobby — offers "Return to Menu" instead of full reload
interface GameErrorBoundaryProps {
  children: React.ReactNode;
  onReturnToMenu: () => void;
}

export class GameErrorBoundary extends React.Component<
  GameErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: GameErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[GameErrorBoundary]", error, info.componentStack);
    trackError(error, "GameErrorBoundary");
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
              Oyun ekranında beklenmeyen bir sorun yaşandı.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onReturnToMenu();
              }}
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
              Ana Menüye Dön
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
