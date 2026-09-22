// src/components/shared/DisclaimerModal.tsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

interface DisclaimerModalProps {
    isOpen: boolean;
    onAccept: () => void;
    onCancel: () => void;
}

export function DisclaimerModal({ isOpen, onAccept, onCancel }: DisclaimerModalProps) {
    const [mounted, setMounted] = useState(isOpen);
    const [visible, setVisible] = useState(isOpen);

    useEffect(() => {
        let rafId: number;
        let rafId2: number;
        if (isOpen) {
            setMounted(true);
            rafId = requestAnimationFrame(() => {
                rafId2 = requestAnimationFrame(() => {
                    setVisible(true);
                });
            });
        } else {
            setVisible(false);
            const timer = setTimeout(() => setMounted(false), 200);
            return () => clearTimeout(timer);
        }
        return () => {
            cancelAnimationFrame(rafId);
            cancelAnimationFrame(rafId2);
        };
    }, [isOpen]);

    if (!mounted) return null;

    return createPortal(
        <div 
            onClick={onCancel}
            className={`fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto transition-opacity duration-200 ease-apple-out ${
                visible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        >
            <style>{`
                .ios-alert-enter {
                    transition: transform 320ms cubic-bezier(0.34, 1.78, 0.64, 1),
                                opacity 220ms cubic-bezier(0.23, 1, 0.32, 1),
                                filter 220ms cubic-bezier(0.23, 1, 0.32, 1);
                }
                .ios-alert-exit {
                    transition: transform 180ms cubic-bezier(0.23, 1, 0.32, 1),
                                opacity 160ms ease-out,
                                filter 160ms ease-out;
                }
            `}</style>

            {/* Modal Card - Apple iOS Center Spring Alert (~5.0% overshoot) */}
            <div 
                onClick={(e) => e.stopPropagation()}
                className={`relative w-full max-w-md bg-gradient-to-b from-[#15161B] via-[#101115] to-[#0A0B0E] border border-white/[0.08] rounded-[28px] p-6 sm:p-7 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85),0_8px_20px_-6px_rgba(0,0,0,0.5)] space-y-5 text-foreground overflow-hidden ${
                    visible 
                        ? "ios-alert-enter opacity-100 scale-100 blur-0" 
                        : "ios-alert-exit opacity-0 scale-[0.85] blur-[3px] pointer-events-none delay-0"
                }`}
            >
                {/* Specular hairline top rim */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.09] to-transparent" />

                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-zinc-200 active:scale-[0.94] transition-all cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Stagger 1: Warning Icon (Apple Squircle Dark Titanium) */}
                <div className={`flex justify-center pt-1 ${
                    visible 
                        ? "ios-alert-enter opacity-100 scale-100 [transition-delay:40ms]" 
                        : "ios-alert-exit opacity-0 scale-90 delay-0"
                }`}>
                    <div className="relative w-14 h-14 rounded-2xl bg-[#181920]/90 border border-white/[0.08] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.4)]">
                        {/* Internal top hairline */}
                        <div className="pointer-events-none absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
                        <AlertTriangle className="w-6 h-6 text-zinc-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                    </div>
                </div>

                {/* Stagger 2: Title & Description */}
                <div className={`text-center space-y-2 ${
                    visible 
                        ? "ios-alert-enter opacity-100 translate-y-0 delay-75" 
                        : "ios-alert-exit opacity-0 translate-y-2 delay-0"
                }`}>
                    <h3 className="text-base font-semibold text-zinc-100 tracking-tight">Risk Disclaimer</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                        This on-chain data and automated analysis do not constitute financial advice. This audit report is provided solely for independent security and tokenomics risk assessment.
                    </p>
                </div>

                {/* Stagger 3: Action Buttons (Brushed Dark Titanium) */}
                <div className={`flex gap-3 pt-1 ${
                    visible 
                        ? "ios-alert-enter opacity-100 translate-y-0 [transition-delay:110ms]" 
                        : "ios-alert-exit opacity-0 translate-y-2 delay-0"
                }`}>
                    <button
                        onClick={onCancel}
                        className="flex-1 h-11 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07] text-zinc-300 hover:text-zinc-100 text-xs font-medium active:scale-[0.97] transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex-1 h-11 rounded-2xl bg-zinc-800 hover:bg-zinc-700/90 text-zinc-100 border border-zinc-700/70 text-xs font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] active:scale-[0.97] transition-all cursor-pointer"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
