"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Optional label for the fallback copy. */
  label?: string;
  /** Called when an error is caught (logging / analytics). */
  onError?: (error: Error) => void;
  fallback?: ReactNode;
};

type State = { error: Error | null };

/**
 * Soft boundary so a projector / widget crash does not blank the whole Casa pad
 * (iOS WebView would otherwise show only the native «Evento» chrome).
 */
export class CasaSoftBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error);
    if (typeof console !== "undefined") {
      console.error("[CasaSoftBoundary]", error, info.componentStack);
    }
  }

  private retry = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const label = this.props.label ?? "Modulo";
    return (
      <div className="casa-soft-fallback" role="alert">
        <p className="casa-soft-fallback-title">{label} in pausa</p>
        <p className="casa-soft-fallback-sub">
          Qualcosa si è bloccato. Puoi riprovare senza chiudere la plancia.
        </p>
        <button type="button" className="casa-hit" onClick={this.retry}>
          Riprova
        </button>
      </div>
    );
  }
}
