// src/components/dashboard/TokenRiskCard.tsx
import type { TokenAuditResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, Lock, Unlock, Waves, ArrowRight } from "lucide-react";

interface TokenRiskCardProps {
    token: TokenAuditResult;
    onViewAudit: (token: TokenAuditResult) => void;
}

export function TokenRiskCard({ token, onViewAudit }: TokenRiskCardProps) {
    // Extract risk score
    const totalScore = typeof token.riskScore === "object" ? (token.riskScore as any).total : (Number(token.riskScore) || 0);
    
    // > 50 safe (subdued sage), <= 50 risky (deep wine)
    const isSafe = totalScore > 50;
    const scoreTextColor = isSafe ? "text-emerald-300/90" : "text-rose-300/90";
    const scoreBgColor = isSafe 
        ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-300/80" 
        : "bg-rose-950/30 border-rose-800/40 text-rose-300/80";
    const progressBarColor = isSafe ? "bg-emerald-600/60" : "bg-rose-700/60";
    const Icon = isSafe ? ShieldCheck : ShieldAlert;

    const isLpLocked = Boolean(token.onChainSignals?.liquidityLock?.pairFound || (token as any).onChain?.lpLockPercent > 0 || (token.onChainSignals?.liquidityLock?.v2TotalSecuredPercent !== undefined && (token.onChainSignals?.liquidityLock?.v2TotalSecuredPercent ?? 0) > 0));
    const whaleSignal = token.onChainSignals?.whaleActivity?.dominantSignal || (token as any).onChain?.whaleActivity || token.onChainSignals?.whaleMovement?.status || "Neutral";

    return (
        <Card 
            className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-gradient-to-b from-[#141519] to-[#0D0E12] backdrop-blur-2xl shadow-[0_16px_36px_-8px_rgba(0,0,0,0.6),0_4px_12px_rgba(0,0,0,0.4)] hover:border-white/[0.16] hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-10px_rgba(0,0,0,0.75)] active:scale-[0.99] transition-all duration-200 ease-apple-out cursor-pointer flex flex-col justify-between"
            onClick={() => onViewAudit(token)}
        >
            {/* Top Specular Hairline Rim & Subtle Muted Accent */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
            <div className={`pointer-events-none absolute top-0 left-6 right-6 h-[1px] opacity-30 bg-gradient-to-r from-transparent ${isSafe ? "via-emerald-500/25" : "via-rose-500/25"} to-transparent`} />

            <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                        <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            {token.name}
                        </CardTitle>
                        <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                            ${token.symbol}
                        </p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 shadow-xs ${scoreBgColor}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{isSafe ? "Audit Passed" : "High Risk"}</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 px-5 sm:px-6 pb-5">
                {/* Risk Score Progress Gauge */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-muted-foreground">Token Security Score</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-xl font-black ${scoreTextColor}`}>{totalScore}</span>
                            <span className="text-xs text-muted-foreground/70">/100</span>
                        </div>
                    </div>
                    {/* Visual Apple Activity Progress Bar (Hardware-Accelerated Composite Transform) */}
                    <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div 
                            className={`h-full w-full ${progressBarColor} rounded-full origin-left transition-transform duration-500 ease-apple-out`}
                            style={{ transform: `scaleX(${Math.min(1, Math.max(0.05, totalScore / 100))})` }}
                        />
                    </div>
                </div>

                {/* On-Chain Signal Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isLpLocked ? "bg-emerald-950/40 text-emerald-300/80 border border-emerald-900/30" : "bg-zinc-800/60 text-zinc-300 border border-white/[0.06]"}`}>
                            {isLpLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </div>
                        <div className="truncate">
                            <p className="text-[10px] text-muted-foreground font-medium">DEX LP Status</p>
                            <p className="font-semibold text-foreground truncate">{isLpLocked ? "Locked (Safe)" : "Caution Advised"}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="w-7 h-7 rounded-lg bg-zinc-800/60 text-zinc-300 border border-white/[0.06] flex items-center justify-center">
                            <Waves className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                            <p className="text-[10px] text-muted-foreground font-medium">Whale Signal</p>
                            <p className="font-semibold text-foreground truncate">{whaleSignal}</p>
                        </div>
                    </div>
                </div>

                {/* View Full Audit Button */}
                <button
                    className="w-full mt-1 group/btn flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-zinc-800 hover:border-zinc-700/60 text-zinc-200 hover:text-zinc-100 border border-white/[0.06] py-2.5 px-4 rounded-xl text-xs font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)] active:scale-[0.98] transition-all duration-150 ease-apple-out cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onViewAudit(token);
                    }}
                >
                    <span>View Full Audit Report</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover/btn:translate-x-1" />
                </button>
            </CardContent>
        </Card>
    );
}