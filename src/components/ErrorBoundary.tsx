import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  tabId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  tabId?: string;
  onNotification?: (title: string, msg: string, type: "success" | "error") => void;
}

/**
 * MQube Error Boundary — wraps each workspace tab.
 * Prevents a crash in one module from unmounting the entire application shell.
 */
export class TileFlowErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, tabId: props.tabId };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console only — never expose to user (per HREP Rule 1)
    console.error("[MQube ErrorBoundary]", error, info);
    if (this.props.onNotification) {
      this.props.onNotification(
        "Module Temporarily Unavailable",
        "This workspace area encountered an unexpected issue. Other modules are unaffected. Please reload or contact support.",
        "error"
      );
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state when switching to a different tab
    if (prevProps.tabId !== this.props.tabId && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-24 text-center px-8">
          <span className="material-symbols-outlined text-5xl text-rose-500 mb-4">warning</span>
          <h3 className="font-display font-bold text-lg text-theme-body mb-2">
            Module Temporarily Unavailable
          </h3>
          <p className="text-xs text-theme-muted leading-relaxed max-w-sm mb-6">
            This workspace area encountered an unexpected issue. Other modules remain fully
            operational. You may retry or navigate to another module.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="bg-[#606060] hover:bg-opacity-90 text-white text-xs font-semibold uppercase px-4 py-2 rounded transition-all"
            >
              Retry Module
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-theme-surface-3 border border-theme-divider text-theme-muted hover:text-theme-body text-xs font-semibold uppercase px-4 py-2 rounded transition-all"
            >
              Reload App
            </button>
          </div>
          <p className="mt-6 text-[10px] text-theme-muted font-mono">
            Reference: TILEFLOW-SYS-{new Date().toISOString().split("T")[0].replace(/-/g, "")}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
