// src/components/shared/WalletGateModal.tsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Wallet, ShieldCheck, X, Loader2, ArrowRight, AlertCircle, Database } from "lucide-react";
import { useWallet } from "@/lib/walletContext";

interface WalletGateModalProps {
    isOpen: boolean;
    tokenSymbol?: string;
    onClose: () => void;
    onConnected: () => void;
}

export function WalletGateModal({ isOpen, tokenSymbol, onClose, onConnected }: WalletGateModalProps) {
    const { connectWallet, connectDemoWallet, isConnecting, connectionFailed, connectionErrorMsg } = useWallet();
    const [mounted, setMounted] = useState(isOpen);
    const [visible, setVisible] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            const raf = requestAnimationFrame(() => {
                setVisible(true);
            });
            return () => cancelAnimationFrame(raf);
        } else {
            setVisible(false);
            const timer = setTimeout(() => setMounted(false), 180);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted) return null;

    const handleConnect = async () => {
        const success = await connectWallet();
        if (success) {
            onConnected();
        }
    };

    return createPortal(
        <div 
            onClick={onClose}
            className={`fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto transition-opacity duration-180 ease-apple-out ${
                visible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className={`relative w-full max-w-md bg-gradient-to-b from-[#15161B] via-[#101115] to-[#0A0B0E] border border-white/[0.08] rounded-[28px] p-6 sm:p-7 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85),0_8px_20px_-6px_rgba(0,0,0,0.5)] space-y-5 text-foreground overflow-hidden transition-[opacity,transform] duration-180 ease-apple-out ${
                    visible 
                        ? "opacity-100 scale-100 translate-y-0" 
                        : "opacity-0 scale-[0.96] translate-y-1.5 pointer-events-none"
                }`}
            >
                {/* Specular hairline top rim */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.09] to-transparent" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-zinc-200 active:scale-[0.94] transition-all cursor-pointer"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Icon Header (Apple Squircle Dark Titanium) */}
                <div className="flex flex-col items-center text-center space-y-3 pt-1">
                    <div 
                        data-testid="security-lock-badge"
                        className="relative w-16 h-16 rounded-[22px] bg-[#181920]/90 border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_-4px_rgba(0,0,0,0.5)] flex items-center justify-center text-zinc-200"
                    >
                        {/* Internal top hairline */}
                        <div className="pointer-events-none absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
                        <svg
                            viewBox="0 0 24 24"
                            className="w-7 h-7 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
                        </svg>
                    </div>

                    <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/[0.04] text-zinc-300 border border-white/[0.08] mb-2">
                            Verified Report Access
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100">
                            Connect Your Wallet
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 max-w-sm leading-relaxed">
                            To view verified on-chain telemetry and institutional audit history for{" "}
                            <span className="font-bold text-zinc-200 uppercase">{tokenSymbol ? `$${tokenSymbol}` : "this token"}</span>, please connect your BNB Chain Web3 wallet.
                        </p>
                    </div>
                </div>

                {/* Feature Highlights Panel */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5 text-zinc-400">
                        <ShieldCheck className="w-4 h-4 text-emerald-300/80 shrink-0 mt-0.5" />
                        <span>Real-time on-chain anomaly signals, honeypot protection, & transfer tax scanner.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-zinc-400">
                        <Database className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                        <span>Fundamental analysis documentation stored decentralized on BNB Greenfield.</span>
                    </div>
                </div>

                {/* Error Banner */}
                {connectionFailed && (
                    <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 flex items-center gap-2 text-rose-300/90 text-xs font-medium animate-in fade-in zoom-in-[0.98] duration-150">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{connectionErrorMsg}</span>
                    </div>
                )}

                {/* CTA Action Buttons */}
                <div className="flex flex-col gap-2.5 pt-1">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="sm:w-1/3 h-11 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07] text-zinc-300 hover:text-zinc-100 text-xs font-medium active:scale-[0.97] transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="sm:w-2/3 h-11 rounded-2xl bg-gradient-to-b from-[#252730] to-[#181920] hover:from-[#2c2e38] hover:to-[#1e2028] text-zinc-100 border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] active:scale-[0.97] cursor-pointer disabled:opacity-50 transition-all duration-150 ease-apple-out"
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-300" />
                                    <span className="text-zinc-300">Connecting...</span>
                                </>
                            ) : (
                                <>
                                    <Wallet className="w-4 h-4" />
                                    <span>Connect Wallet</span>
                                    <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                                </>
                            )}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            connectDemoWallet();
                            onConnected();
                        }}
                        className="w-full text-center text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer py-1"
                    >
                        Or connect with Demo Wallet for instant preview →
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
