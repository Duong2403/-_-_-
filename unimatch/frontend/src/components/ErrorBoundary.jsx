import React from 'react';
import { AlertCircleIcon, RefreshIcon } from './ui/Icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and potentially to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    // Reset the error state
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error} 
          onRetry={this.handleRetry}
          resetErrorBoundary={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// Error Fallback Component
const ErrorFallback = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg border border-neutral-200 p-8 text-center">
          {/* Error Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircleIcon className="text-red-500" size={32} />
            </div>
          </div>
          
          {/* Error Message */}
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-neutral-600 mb-6">
            We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
          </p>
          
          {/* Error Details (development only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-red-800 mb-2">Error Details:</h3>
              <pre className="text-sm text-red-700 overflow-auto">
                {error.toString()}
              </pre>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={onRetry}
              className="btn btn-primary"
            >
              <RefreshIcon className="mr-2" size={16} />
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-outline"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary; 