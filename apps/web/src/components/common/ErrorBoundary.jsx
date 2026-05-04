import React from 'react';

/**
 * ErrorBoundary catches unhandled render/lifecycle errors in the component tree
 * and displays a fallback UI instead of a blank screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 *
 *   // Custom fallback:
 *   <ErrorBoundary fallback={<p>Something broke.</p>}>
 *     <YourComponent />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console; swap for a real error-reporting service (e.g. Sentry) here.
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-semibold text-red-700">Terjadi Kesalahan</h2>
          <p className="max-w-md text-sm text-red-600">
            Halaman ini mengalami error yang tidak terduga. Silakan coba muat ulang.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="max-h-40 max-w-full overflow-auto rounded bg-red-100 p-2 text-left text-xs text-red-800">
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
