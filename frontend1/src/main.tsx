import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("React Component Crash caught by ErrorBoundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: "100vh",
                    backgroundColor: "#08080B",
                    color: "#FAFAFA",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "24px",
                    fontFamily: "system-ui, sans-serif",
                    textAlign: "center"
                }}>
                    <div style={{
                        maxWidth: "520px",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "24px",
                        padding: "32px",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.7)"
                    }}>
                        <div style={{ fontSize: "36px", marginBottom: "12px" }}>⚠️</div>
                        <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px", color: "#ffffff" }}>
                            Tokenomics Copilot
                        </h2>
                        <p style={{ fontSize: "14px", color: "#f87171", marginBottom: "16px", wordBreak: "break-word" }}>
                            {this.state.error?.message || "An error occurred while loading the application."}
                        </p>
                        <button
                            onClick={() => {
                                sessionStorage.clear();
                                window.location.href = "/";
                            }}
                            style={{
                                padding: "10px 24px",
                                backgroundColor: "#ffffff",
                                color: "#000000",
                                border: "none",
                                borderRadius: "9999px",
                                fontWeight: "600",
                                cursor: "pointer",
                                fontSize: "13px"
                            }}
                        >
                            Reset & Reload
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)   
