import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log to error tracking service in production
        if (import.meta.env.PROD) {
            // TODO: Send to Sentry, LogRocket, or other error tracking service
            console.error('Error caught by boundary:', error, errorInfo);
        } else {
            console.error('Error caught by boundary:', error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100">
                    <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center">
                        <span className="material-icons-round text-6xl text-red-500 mb-4">error</span>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
                        <p className="text-gray-600 mb-6">
                            We're sorry for the inconvenience. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-[#FF5A5F] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#E04F54] transition shadow-md"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
