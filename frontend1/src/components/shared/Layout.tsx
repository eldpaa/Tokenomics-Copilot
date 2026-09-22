// src/components/shared/Layout.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Command, Wallet, CheckCircle2, ChevronDown, ExternalLink, Loader2 } from "lucide-react";
import { useWallet } from "@/lib/walletContext";
import { NetworkSwitcher } from "@/components/shared/NetworkSwitcher";

export function Layout({ children }: { children: React.ReactNode }) {
    const [isAnimatingEntry, setIsAnimatingEntry] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const isAuditPage = location.pathname.startsWith("/audit/");

    useEffect(() => {
        if (isAuditPage) {
            setIsAnimatingEntry(true);
            const timer = setTimeout(() => setIsAnimatingEntry(false), 50);
            return () => clearTimeout(timer);
        }
    }, [location.pathname, isAuditPage]);

    // Scroll listener for Dynamic Island brand handoff
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        if (isAuditPage) {
            setIsScrolled(true);
            return;
        }

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 120);
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [isAuditPage, location.pathname]);

    const showBrand = isAuditPage || isScrolled;

    // Centralized Web3 Wallet State from WalletContext
    const {
        walletAddress,
        walletConnected,
        isConnecting,
        walletBalance,
        justConnected,
        showNoWalletAlert,
        setShowNoWalletAlert,
        connectionFailed,
        connectionErrorMsg,
        toggleWallet,
        formatAddress,
        connectDemoWallet,
    } = useWallet();

    return (
        <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-clip">
            {/* Inline keyframes for iOS Horizontal Shake error & Dynamic Island Drop-In */}
            <style>{`
                @keyframes springError {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-6px); }
                    40% { transform: translateX(6px); }
                    60% { transform: translateX(-4px); }
                    80% { transform: translateX(4px); }
                }
                .animate-spring-error {
                    animation: springError 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
                }
                @keyframes dynamicIslandDropIn {
                    0% {
                        opacity: 0;
                        transform: translateY(-8px) scale(0.98);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .animate-island-enter {
                    animation: dynamicIslandDropIn 0.35s cubic-bezier(0.2, 0.9, 0.25, 1);
                }
                /* Apple Dynamic Island Spring Transitions */
                .island-pop-enter {
                    transition: transform 260ms cubic-bezier(0.2, 0.9, 0.25, 1),
                                opacity 200ms cubic-bezier(0.23, 1, 0.32, 1);
                }
                .island-pop-exit {
                    transition: transform 180ms cubic-bezier(0.23, 1, 0.32, 1),
                                opacity 160ms ease-out;
                }
            `}</style>
            
            {/* Serene Space Black Titanium Ambient Lighting (Zero CPU/GPU Overload) */}
            <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[680px] h-[300px] bg-white/[0.025] rounded-full blur-[160px]" />
            <div className="pointer-events-none fixed -top-28 -left-28 w-72 h-72 bg-white/[0.015] rounded-full blur-[140px]" />

            {/* Top Floating Dynamic Island Navigation Bar (Apple VisionOS Transparent Titanium Glass) */}
            <header className="fixed top-3 sm:top-4 left-0 right-0 z-[1000] px-3 sm:px-6 print:hidden pointer-events-none flex justify-center animate-island-enter">
                <nav className={`w-full max-w-[620px] sm:max-w-[660px] h-11 sm:h-12 rounded-full border border-white/[0.16] bg-black/20 hover:bg-black/25 backdrop-blur-2xl backdrop-saturate-[180%] px-3.5 sm:px-4.5 flex items-center justify-between pointer-events-auto relative shadow-[0_8px_32px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.2),0_0_0_1px_rgba(255,255,255,0.04)] transition-all duration-300 ease-[cubic-bezier(0.2,0.9,0.25,1)] ${
                    justConnected 
                        ? "ring-1 ring-white/35 shadow-[0_16px_40px_-6px_rgba(255,255,255,0.12)]" 
                        : ""
                }`}>
                    {/* Layer 1: Dynamic Island Connected Banner */}
                    <div className={`absolute inset-0 px-3.5 sm:px-4.5 rounded-full overflow-hidden flex items-center justify-between gap-3 transition-[opacity,transform,filter] duration-280 ease-out ${
                        justConnected 
                            ? "opacity-100 scale-100 blur-0 translate-y-0 pointer-events-auto z-10" 
                            : "opacity-0 scale-98 blur-xs -translate-y-1 pointer-events-none z-0"
                    }`}>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-white/[0.08] text-white border border-white/[0.15] flex items-center justify-center">
                                <Wallet className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-apple-radar absolute inline-flex h-full w-full rounded-full bg-emerald-400/60 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                                </span>
                                <span className="text-xs font-semibold text-foreground tracking-tight">
                                    Connected
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-mono font-medium text-foreground">
                            <span>{formatAddress(walletAddress)}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/50 text-white/90 border border-white/[0.06]">
                                {walletBalance}
                            </span>
                        </div>
                    </div>

                    {/* Layer 2: Main Dynamic Island Content */}
                    <div className={`w-full h-full rounded-full flex items-center justify-between transition-[opacity,transform,filter] duration-240 ease-out ${
                        justConnected 
                            ? "opacity-0 scale-98 blur-xs pointer-events-none" 
                            : "opacity-100 scale-100 blur-0 pointer-events-auto"
                    }`}>
                        {/* Left Side: Brand with iPhone 16 Pro Titanium Squircle */}
                        <div 
                            onClick={() => navigate("/")}
                            tabIndex={-1}
                            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group outline-none select-none active-press shrink-0"
                        >
                            <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-[11px] bg-gradient-to-b from-white/[0.15] to-white/[0.04] text-white border border-white/[0.2] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] group-hover:border-white/40 group-hover:bg-white/[0.18] transition-colors duration-180 shrink-0">
                                <Command className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:scale-105" />
                            </div>
                            <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
                                <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white group-hover:text-white transition-colors duration-150">
                                    Tokenomics Copilot
                                </h1>
                                <span className="hidden xs:inline-block px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/[0.08] border border-white/[0.16] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                                    Pro
                                </span>
                            </div>
                        </div>

                        {/* Right Side: Network Switcher & Wallet Pill */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <NetworkSwitcher />
                            <button
                                onClick={toggleWallet}
                                disabled={isConnecting}
                                className={`h-8 px-3 text-[11px] sm:text-xs font-semibold rounded-full flex items-center gap-1.5 sm:gap-2 cursor-pointer active-press shadow-xs transition-[background-color,border-color,box-shadow,transform] duration-150 ${
                                    walletConnected
                                        ? "bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.14] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                                        : connectionFailed
                                            ? "bg-rose-500/10 border border-rose-500/30 text-rose-400 animate-spring-error"
                                            : "bg-white text-black hover:bg-white/90 shadow-[0_2px_14px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] font-semibold"
                                }`}
                            >
                                {isConnecting ? (
                                    <div className="flex items-center gap-1.5">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                                        <span>Connecting...</span>
                                    </div>
                                ) : walletConnected ? (
                                    <div className="flex items-center gap-1.5">
                                        <div className="relative flex h-1.5 w-1.5">
                                            <span className="animate-apple-radar absolute inline-flex h-full w-full rounded-full bg-emerald-400/60 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                                        </div>
                                        <span className="font-mono text-xs font-medium">{formatAddress(walletAddress)}</span>
                                        <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.08] text-white/90 font-mono font-bold">
                                            {walletBalance}
                                        </span>
                                    </div>
                                ) : connectionFailed ? (
                                    <div className="flex items-center gap-1.5">
                                        <Wallet className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Try Again</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <Wallet className="w-3.5 h-3.5" />
                                        <span>Connect Wallet</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </nav>
            </header>

            {/* Page Content */}
            <main className="relative pt-12 sm:pt-14 pb-6">
                {children}
            </main>

            {/* Custom No Wallet Found iOS Sheet Modal */}
            {showNoWalletAlert && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
                    onClick={() => setShowNoWalletAlert(false)}
                >
                    <div 
                        className="bg-[#141518]/95 border border-white/[0.1] rounded-[28px] p-6 max-w-sm w-full shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)] flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200 ease-out"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20 mb-1">
                            <Wallet className="w-7 h-7 text-rose-500" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground tracking-tight">Wallet Not Detected</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            No Web3 wallet extension found in your browser (such as MetaMask, Trust Wallet, or Rabby). You can connect instantly with a Demo Wallet or install an EVM extension.
                        </p>
                        <div className="w-full flex flex-col gap-2 pt-1">
                            <button 
                                onClick={() => {
                                    connectDemoWallet();
                                    setShowNoWalletAlert(false);
                                }}
                                className="w-full py-2.5 bg-white text-black hover:bg-white/90 active-press text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                            >
                                Connect Demo Wallet
                            </button>
                            <button 
                                onClick={() => setShowNoWalletAlert(false)}
                                className="w-full py-2.5 bg-white/[0.08] hover:bg-white/[0.12] active-press text-foreground text-xs font-semibold rounded-xl border border-white/[0.1] transition-colors cursor-pointer"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
