// src/components/dashboard/AiAnalysisIndicator.tsx
import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface AiAnalysisIndicatorProps {
    isLoading: boolean;
    targetSymbol?: string;
}

const ANALYSIS_STEPS = [
    "Synthesizing on-chain signals...",
    "Auditing bytecode & liquidity vectors...",
    "Computing multi-factor risk score..."
];

export function AiAnalysisIndicator({ isLoading, targetSymbol }: AiAnalysisIndicatorProps) {
    const [isRendered, setIsRendered] = useState(isLoading);
    const [isEntering, setIsEntering] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [isStepExiting, setIsStepExiting] = useState(false);

    // Lifecycle for Apple-standard enter & exit animation
    useEffect(() => {
        if (isLoading) {
            setIsRendered(true);
            setIsExiting(false);
            setStepIndex(0);
            setIsStepExiting(false);
            // Trigger enter spring transition on next frame
            const enterTimer = requestAnimationFrame(() => {
                setIsEntering(true);
            });
            return () => cancelAnimationFrame(enterTimer);
        } else if (isRendered && !isExiting) {
            // Play exit dissolve before unmounting
            setIsExiting(true);
            setIsEntering(false);
            const exitTimer = setTimeout(() => {
                setIsRendered(false);
                setIsExiting(false);
            }, 230);
            return () => clearTimeout(exitTimer);
        }
    }, [isLoading, isRendered, isExiting]);

    // Cycle through telemetry steps during analysis with calm pacing and blur-masked crossfade
    useEffect(() => {
        if (!isLoading) return;
        let exitTimer: NodeJS.Timeout;
        const interval = setInterval(() => {
            setIsStepExiting(true);
            exitTimer = setTimeout(() => {
                setStepIndex((prev) => (prev + 1) % ANALYSIS_STEPS.length);
                setIsStepExiting(false);
            }, 160);
        }, 1650);

        return () => {
            clearInterval(interval);
            clearTimeout(exitTimer);
        };
    }, [isLoading]);

    if (!isRendered) return null;

    return (
        <div className="mt-8 flex flex-col items-center justify-center select-none">
            {/* Ambient Apple Intelligence aura */}
            <div className="relative">
                <div 
                    className={`absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-indigo-500/20 blur-xl pointer-events-none transition-opacity duration-300 ${
                        isEntering && !isExiting ? "opacity-75 animate-neural-breathe" : "opacity-0"
                    }`} 
                />

                {/* Main Apple Frosted Glass Capsule */}
                <div
                    className={`relative overflow-hidden rounded-full bg-[#10121a]/85 backdrop-blur-3xl border border-white/[0.14] px-4.5 py-2.5 sm:px-5 sm:py-3 shadow-[0_16px_48px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.22),0_0_0_1px_rgba(255,255,255,0.04)] flex items-center gap-3.5 transition-all ${
                        isEntering && !isExiting
                            ? "opacity-100 scale-100 blur-0 translate-y-0 duration-280 ease-[cubic-bezier(0.2,0.9,0.25,1)]"
                            : isExiting
                            ? "opacity-0 scale-[0.96] blur-xs -translate-y-1.5 duration-220 ease-out"
                            : "opacity-0 scale-[0.95] translate-y-1.5"
                    }`}
                >
                    {/* Linear Apple Specular Shimmer Beam */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                        <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -skew-x-12 animate-apple-shimmer" />
                    </div>

                    {/* Apple Intelligence Neural Beacon */}
                    <div className="relative flex items-center justify-center w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-white/[0.14] to-white/[0.04] border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] shrink-0">
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-pulse" />
                        <span className="absolute -inset-0.5 rounded-full border border-emerald-400/40 animate-ping opacity-40 pointer-events-none" />
                    </div>

                    {/* Dynamic AI Status Text */}
                    <div className="flex flex-col text-left pr-1 min-w-[240px] sm:min-w-[275px]">
                        <div className="flex items-center justify-between gap-2 h-5">
                            <div className="overflow-hidden flex items-center">
                                <span
                                    key={stepIndex}
                                    className={`inline-block text-xs sm:text-[13px] font-semibold tracking-tight text-white/95 transition-all ${
                                        isStepExiting
                                            ? "opacity-0 -translate-y-1.5 blur-[2px] scale-[0.98] duration-160 ease-[cubic-bezier(0.23,1,0.32,1)]"
                                            : "animate-apple-step-in"
                                    }`}
                                >
                                    {ANALYSIS_STEPS[stepIndex]}
                                </span>
                            </div>
                            <span className="relative flex h-1.5 w-1.5 shrink-0 ml-1.5">
                                <span className="animate-apple-radar absolute inline-flex h-full w-full rounded-full bg-emerald-400/80 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                            </span>
                        </div>
                        <span className="text-[10px] font-mono text-white/45 tracking-wider uppercase">
                            BNB Chain Intelligence • {targetSymbol ? `$${targetSymbol.toUpperCase()}` : "Smart Contract"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
