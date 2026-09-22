// src/pages/Dashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { AiAnalysisIndicator } from "@/components/dashboard/AiAnalysisIndicator";
import { DisclaimerModal } from "@/components/shared/DisclaimerModal";
import { WalletGateModal } from "@/components/shared/WalletGateModal";
import { useWallet } from "@/lib/walletContext";
import { ShieldAlert } from "lucide-react";
import { WarpShader } from "@/components/ui/warp-shader";

// Stable 4-color palette so WebGL context does not recreate needlessly on every re-render
const BG_WARP_COLORS = ["#040714", "#0e1a42", "#220e3d", "#08363d"];

export function Dashboard() {
    const navigate = useNavigate();
    const { walletConnected } = useWallet();
    const [searchSymbol, setSearchSymbol] = useState<string>("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [disclaimerTarget, setDisclaimerTarget] = useState<string | null>(null);
    const [walletGateTarget, setWalletGateTarget] = useState<any | null>(null);

    const { data: auditData, isLoading, isError, error } = useQuery({
        queryKey: ["audit", searchSymbol],
        queryFn: () => api.getAudit(searchSymbol),
        enabled: !!searchSymbol,
        staleTime: Infinity,
    });

    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        // Load recent searches on mount
        import("@/lib/recentSearches").then(({ getRecentSearches }) => {
            setRecentSearches(getRecentSearches());
        });
    }, []);

    useEffect(() => {
        if (auditData) {
            // 240ms pause allowing the Apple exit dissolve transition to finish smoothly before opening the modal
            const timer = setTimeout(() => {
                handleViewAudit(auditData);
            }, 240);
            return () => clearTimeout(timer);
        }
    }, [auditData]);

    const handleViewAudit = (token: any) => {
        if (!walletConnected) {
            setWalletGateTarget(token);
            return;
        }
        setDisclaimerTarget(token);
    };

    const handleWalletGateConnected = () => {
        const target = walletGateTarget;
        setWalletGateTarget(null);
        if (target) {
            setDisclaimerTarget(target);
        }
    };

    const handleDisclaimerAccept = async () => {
        if (disclaimerTarget) {
            const { addRecentSearch } = await import("@/lib/recentSearches");
            addRecentSearch(disclaimerTarget.symbol);
            
            navigate(`/audit/${disclaimerTarget.symbol}`, { state: { tokenData: disclaimerTarget } });
            setDisclaimerTarget(null);
        }
    };

    return (
        <div className="relative min-h-[calc(100vh-4.5rem)] flex flex-col justify-center pb-4 sm:pb-6">
            {/* Viewport-Wide Fixed 3D Background - Spans full screen from top: 0 to bottom: 100vh behind Dynamic Island */}
            <div className="fixed inset-0 top-0 left-0 w-full h-full min-w-full min-h-screen pointer-events-none z-0 overflow-hidden">
                <WarpShader 
                    colors={BG_WARP_COLORS}
                    speed={0.7}
                    distortion={0.25}
                    swirl={0.8}
                    className="absolute inset-0 w-full h-full"
                />
                {/* Apple Frosted Ambient Scrim - Subtle dark ambient with calm 3D visibility */}
                <div className="absolute inset-0 bg-[#090a0f]/45 backdrop-blur-[16px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/60 pointer-events-none" />
            </div>

            {/* Apple Focus Dimming & Blur Scrim */}
            <div 
                className={`fixed inset-0 top-0 left-0 w-full h-full bg-black/45 backdrop-blur-[8px] z-20 pointer-events-none transition-opacity ${
                    isSearchFocused ? "duration-300 opacity-100" : "duration-240 opacity-0"
                } ease-out`}
            />

            <div className="page-transition relative z-30 max-w-4xl w-full mx-auto px-4 sm:px-6 flex flex-col items-center justify-center -translate-y-16 sm:-translate-y-22 md:-translate-y-26">
                <div className="relative z-50 max-w-2xl w-full text-center space-y-4 sm:space-y-5 mx-auto flex flex-col items-center">
                    {/* Eyebrow badge for refined Apple balance */}
                    <div className="flex items-center justify-center w-full">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] text-[10px] sm:text-[11px] font-medium tracking-[0.16em] uppercase text-zinc-400 select-none">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                            </span>
                            BNB Chain Intelligence
                        </span>
                    </div>

                    {/* Heading matching reference with refined optical tracking */}
                    <h1 className="text-white text-5xl sm:text-6xl md:text-7xl font-sans font-light italic tracking-tight select-none text-center w-full">
                        Tokenomics Copilot
                    </h1>

                    {/* Centered Large Hero Search Bar with Apple Spotlight */}
                    <div className="w-full max-w-xl mx-auto flex flex-col justify-center pt-1 gap-4">
                        <SearchBar 
                            onSearch={setSearchSymbol} 
                            isLoading={isLoading} 
                            onFocusChange={setIsSearchFocused}
                        />
                        
                        {/* Recent Searches */}
                        {recentSearches.length > 0 && !isSearchFocused && !searchSymbol && (
                            <div className="flex flex-wrap justify-center gap-2 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <span className="text-xs text-white/40 uppercase tracking-widest font-medium mr-2 flex items-center">
                                    Recent:
                                </span>
                                {recentSearches.map((symbol) => (
                                    <button
                                        key={symbol}
                                        onClick={() => setSearchSymbol(symbol)}
                                        className="px-3 py-1 text-xs font-medium text-white/70 bg-white/5 border border-white/10 rounded-full hover:bg-white/15 hover:text-white transition-all active:scale-95 cursor-pointer"
                                    >
                                        ${symbol}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Description text with Apple focus dissolve transition */}
                    <p className={`text-white/80 text-sm sm:text-base font-sans font-light leading-relaxed max-w-lg mx-auto text-center transition-[opacity,transform] duration-220 ease-out ${
                        isSearchFocused ? "opacity-0 translate-y-2 pointer-events-none" : "opacity-100 translate-y-0"
                    }`}>
                        Don't miss out on on-chain anomalies and liquidity risks.
                        <br />
                        Search any token to stay informed with real-time audit intelligence.
                    </p>
                </div>

                {isError && (
                    <div className="mt-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center gap-3 animate-in fade-in zoom-in-[0.98] duration-200 ease-apple-out">
                        <ShieldAlert className="w-5 h-5 shrink-0" />
                        <p className="text-xs sm:text-sm font-medium">Failed to load on-chain telemetry: {error instanceof Error ? error.message : "Check your network connection"}</p>
                    </div>
                )}

                {/* Apple Intelligence AI Analysis State (Replaces spinning magnifying glass) */}
                <AiAnalysisIndicator 
                    isLoading={isLoading} 
                    targetSymbol={searchSymbol} 
                />
            </div>

            <DisclaimerModal isOpen={!!disclaimerTarget} onAccept={handleDisclaimerAccept} onCancel={() => setDisclaimerTarget(null)} />
            
            {/* Wallet Gate Security Modal */}
            <WalletGateModal
                isOpen={Boolean(walletGateTarget)}
                tokenSymbol={walletGateTarget?.symbol}
                onClose={() => setWalletGateTarget(null)}
                onConnected={handleWalletGateConnected}
            />
        </div>
    );
}
