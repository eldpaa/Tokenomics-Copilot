// src/pages/AuditDetailPage.tsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FormattedAuditText } from "@/components/shared/FormattedAuditText";
import { useWallet } from "@/lib/walletContext";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getExplorerTokenUrl } from "@/lib/chains";
import { sendMicroPayment, MICROPAYMENT_AMOUNT_BNB } from "@/lib/payment";
import { 
    ShieldCheck, 
    ShieldAlert, 
    Lock, 
    Unlock, 
    Waves, 
    ArrowLeft, 
    Activity, 
    Copy, 
    Check, 
    ExternalLink, 
    Download, 
    Share2, 
    FileText, 
    CheckCircle2, 
    AlertCircle,
    AlertTriangle,
    BarChart3,
    Loader2,
    Info,
    Wallet
} from "lucide-react";

function AnimatedRadialScore({ score, scoreColor, progressColor }: { score: number, scoreColor: string, progressColor: string }) {
    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
        const duration = 600; 
        const fps = 60;
        const totalFrames = (duration / 1000) * fps;
        let frame = 0;

        const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

        const timer = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            setDisplayScore(Math.min(score, Math.round(score * easeOut(progress))));

            if (frame >= totalFrames) {
                clearInterval(timer);
                setDisplayScore(score);
            }
        }, 1000 / fps);

        return () => clearInterval(timer);
    }, [score]);

    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - ((displayScore / 100) * circumference);
    const strokeClass = progressColor.replace('bg-', 'text-');

    return (
        <div className="flex flex-col items-center justify-center relative w-full aspect-square max-w-[144px] mx-auto select-none">
            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
                <circle
                    className="stroke-white/[0.08]"
                    strokeWidth="7"
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                />
                <circle
                    className={`${strokeClass} stroke-current`}
                    strokeWidth="7"
                    strokeLinecap="round"
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-4xl font-extrabold tracking-tight tabular-nums font-mono ${scoreColor}`}>{displayScore}</span>
                <span className="text-[10px] text-zinc-500 font-semibold tracking-[0.16em] uppercase mt-0.5">RISK SCORE</span>
            </div>
        </div>
    );
}

const safeGetSession = (key: string): string | null => {
    try {
        return typeof window !== "undefined" && window.sessionStorage ? window.sessionStorage.getItem(key) : null;
    } catch {
        return null;
    }
};

const safeSetSession = (key: string, value: string) => {
    try {
        if (typeof window !== "undefined" && window.sessionStorage) {
            window.sessionStorage.setItem(key, value);
        }
    } catch {
        // ignore
    }
};

export function AuditDetailPage() {
    const { symbol } = useParams<{ symbol: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Web3 Wallet state from centralized WalletContext
    const { 
        walletAddress, 
        walletConnected, 
        connectWallet, 
        isConnecting: isConnectingWallet, 
        connectionFailed, 
        connectionErrorMsg,
        activeChain,
        chainId
    } = useWallet();

    const [copied, setCopied] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const [showLangModal, setShowLangModal] = useState(false);
    const normalizedSymbol = (symbol || "UNKNOWN").toUpperCase();
    const activeWallet = walletAddress || safeGetSession("walletAddress") || "guest";
    const sessionKey = `premiumUnlocked_${normalizedSymbol}_${activeWallet.toLowerCase()}`;
    const [premiumUnlocked, setPremiumUnlocked] = useState<boolean>(false);

    useEffect(() => {
        const isSaved = safeGetSession(sessionKey) === "true";
        setPremiumUnlocked(isSaved);
    }, [sessionKey]);
    
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [unlockStep, setUnlockStep] = useState<"idle" | "requesting_signature" | "confirming_tx" | "granted">("idle");
    const [unlockError, setUnlockError] = useState<string | null>(null);
    const [isSimulatingAI, setIsSimulatingAI] = useState(true);

    // Brief transition delay for smooth UX
    useEffect(() => {
        setIsSimulatingAI(true);
        const timer = setTimeout(() => {
            setIsSimulatingAI(false);
        }, 400);
        return () => clearTimeout(timer);
    }, [symbol]);

    // Close tooltip on outside click
    useEffect(() => {
        const closeTooltip = () => setActiveTooltip(null);
        window.addEventListener("click", closeTooltip);
        return () => window.removeEventListener("click", closeTooltip);
    }, []);
    // Always scroll to top when page opens
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, [symbol]);

    // Check if we came from Batch Results where the token data is already available
    const preloadedData = location.state?.tokenData;

    const { data: token, isLoading, isError } = useQuery({
        queryKey: ["audit", symbol?.toUpperCase()],
        queryFn: () => api.getAudit(symbol!.toUpperCase()),
        initialData: preloadedData?.auditText ? preloadedData : undefined,
        enabled: Boolean(symbol) && walletConnected,
        staleTime: 1000 * 60 * 5,
    });

    // Guard: Wallet MUST be connected before accessing verified audit details
    if (!walletConnected) {
        return (
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-6 animate-in fade-in duration-300">
                {/* Back to Dashboard */}
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span>Back to Dashboard</span>
                </button>

                {/* Cyber Security Gate Card */}
                <div className="relative overflow-hidden rounded-3xl bg-card/60 backdrop-blur-xl border border-primary/30 p-8 sm:p-10 shadow-2xl text-center flex flex-col items-center space-y-6">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

                    {/* Icon (Apple Passkey Squircle - Referensi A) */}
                    <div 
                        data-testid="security-lock-badge"
                        className="relative w-18 h-18 rounded-[24px] bg-gradient-to-b from-white/15 to-white/5 dark:from-white/10 dark:to-white/[0.02] backdrop-blur-2xl border border-white/20 dark:border-white/15 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4),0_12px_32px_-6px_rgba(0,0,0,0.45)] flex items-center justify-center text-primary transition-all duration-300 hover:scale-105"
                    >
                        <div className="absolute inset-0 rounded-[24px] bg-primary/10 blur-lg -z-10 opacity-70" />
                        <svg
                            viewBox="0 0 24 24"
                            className="w-8 h-8 drop-shadow-[0_2px_10px_rgba(var(--primary-rgb,59,130,246),0.3)]"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
                        </svg>
                    </div>

                    <div className="space-y-2 max-w-lg">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                            Gated Security Feature
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                            Wallet Connection Required
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            To decrypt and inspect verified on-chain telemetry, honeypot safety, and decentralized BNB Greenfield audit records for{" "}
                            <span className="font-bold text-foreground uppercase">${symbol}</span>, connect your Web3 wallet.
                        </p>
                    </div>

                    {/* Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl text-left text-xs">
                        <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
                            <p className="font-bold text-foreground flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                On-Chain Signals
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-normal">Honeypot tests, tax, and LP lock status.</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
                            <p className="font-bold text-foreground flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-primary" />
                                Risk Telemetry
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-normal">Algorithmic scoring and whale movements.</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
                            <p className="font-bold text-foreground flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-violet-500" />
                                Institutional Dossier
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-normal">BNB Greenfield proofs & PDF export.</p>
                        </div>
                    </div>

                    {/* Error Notice */}
                    {connectionFailed && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-rose-500 text-xs font-medium animate-in fade-in">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{connectionErrorMsg}</span>
                        </div>
                    )}

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="px-5 h-11 rounded-xl border border-border bg-secondary/40 hover:bg-secondary text-secondary-foreground text-xs font-bold transition-all cursor-pointer"
                        >
                            Back to Dashboard
                        </button>
                        <button
                            type="button"
                            onClick={connectWallet}
                            disabled={isConnectingWallet}
                            className="px-7 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-primary/20 cursor-pointer disabled:opacity-60 active:scale-98"
                        >
                            {isConnectingWallet ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Connecting Wallet...</span>
                                </>
                            ) : (
                                <>
                                    <Wallet className="w-4 h-4" />
                                    <span>Connect Wallet Now</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading || isSimulatingAI) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 animate-in fade-in duration-200">
                {/* Action Buttons Top Bar Skeleton */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="h-4 w-32 rounded-lg bg-white/[0.06] animate-pulse" />
                    <div className="flex items-center gap-2">
                        <div className="h-9 w-24 rounded-xl bg-white/[0.06] animate-pulse" />
                        <div className="h-9 w-36 rounded-xl bg-white/[0.06] animate-pulse" />
                    </div>
                </div>

                {/* Token Header Card Skeleton */}
                <div className="titanium-card p-6 sm:p-8 space-y-6">
                    {/* Header Row: Title & Badge */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5">
                                <div className="h-7 w-48 rounded-xl bg-white/[0.08] animate-pulse" />
                                <div className="h-5 w-16 rounded-lg bg-white/[0.06] animate-pulse" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-6 w-32 rounded-full bg-white/[0.05] animate-pulse" />
                                <div className="h-6 w-24 rounded-full bg-white/[0.05] animate-pulse" />
                            </div>
                        </div>
                        <div className="h-7 w-28 rounded-full bg-white/[0.08] animate-pulse" />
                    </div>

                    {/* Score Gauge Area Skeleton */}
                    <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center justify-center gap-3">
                        <div className="w-[130px] h-[130px] rounded-full border-4 border-white/[0.06] border-t-primary/70 animate-spin" />
                        <span className="text-xs text-white/50 font-medium">Synthesizing on-chain metrics...</span>
                    </div>

                    {/* 3 Columns Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] h-16 animate-pulse" />
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] h-16 animate-pulse" />
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] h-16 animate-pulse" />
                    </div>
                </div>

                {/* Report skeleton */}
                <div className="titanium-card p-6 sm:p-8 space-y-4">
                    <div className="h-5 w-52 rounded-lg bg-white/[0.08] animate-pulse mb-6" />
                    <div className="h-3.5 w-full rounded-md bg-white/[0.05] animate-pulse" />
                    <div className="h-3.5 w-5/6 rounded-md bg-white/[0.05] animate-pulse" />
                    <div className="h-3.5 w-4/5 rounded-md bg-white/[0.05] animate-pulse" />
                    <div className="h-3.5 w-full rounded-md bg-white/[0.05] animate-pulse" />
                    <div className="h-3.5 w-2/3 rounded-md bg-white/[0.05] animate-pulse" />
                </div>

                {/* Apple-style calm status pill */}
                <div className="flex justify-center pt-2">
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-white/70 shadow-inner">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span>Analyzing {symbol?.toUpperCase()} telemetry...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !token) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
                    <p className="font-semibold text-foreground">Failed to load audit data</p>
                    <button
                        onClick={() => navigate("/")}
                        className="text-sm text-primary hover:underline"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Extract risk score
    const totalScore = token.riskScore?.total ?? (Number((token as any).riskScore) || 0);
    const riskLabel = token.riskScore?.label ?? (token as any).riskTier ?? "Unknown";
    const isSafe = totalScore > 50;
    const scoreColor = isSafe ? "text-zinc-100" : "text-zinc-300";
    const progressColor = isSafe ? "bg-zinc-400" : "bg-zinc-600";
    const badgeColor = isSafe ? "bg-zinc-900/90 border-zinc-700/80 text-zinc-300" : "bg-zinc-900/90 border-zinc-800 text-zinc-400";
    const Icon = isSafe ? ShieldCheck : ShieldAlert;

    const isLpLocked = Boolean(
        (token.onChainSignals?.liquidityLock?.v2TotalSecuredPercent !== undefined && (token.onChainSignals?.liquidityLock?.v2TotalSecuredPercent ?? 0) > 0) ||
        token.onChainSignals?.liquidityLock?.pairFound ||
        (token as any).onChain?.lpLockPercent > 0
    );
    const whaleSignal = token.onChainSignals?.whaleActivity?.dominantSignal || (token as any).onChain?.whaleActivity || "Neutral";
    const ownershipRenounced = token.onChainSignals?.ownership?.renounced ?? (token as any).onChain?.ownershipRenounced ?? false;
    const tokenAddress = token.address || "0x0000000000000000000000000000000000000000";

    const sec = token.onChainSignals?.securityChecks;
    const fin = token.onChainSignals?.financialMetrics;
    const isHoneypot = sec?.isHoneypot === true;
    const honeypotPassed = sec?.isHoneypot === false;
    const buyTax = sec?.buyTaxPercent ?? 0;
    const sellTax = sec?.sellTaxPercent ?? 0;
    const isBlacklisted = sec?.isBlacklisted === true;

    const handleCopy = () => {
        if (tokenAddress) {
            navigator.clipboard.writeText(tokenAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownloadReport = (lang: "en" | "id") => {
        setShowLangModal(false);
        setIsExporting(true);
        setTimeout(() => {
            const escapePdf = (t: string) => 
                t.replace(/\\/g, "\\\\")
                 .replace(/\(/g, "\\(")
                 .replace(/\)/g, "\\)")
                 .replace(/[^\x20-\x7E]/g, " "); // Clean non-ASCII

            const cleanRiskLabel = String(riskLabel || "").replace(/[^a-zA-Z0-9\s]/g, "").trim();
            const tokenDisplayName = (token as any).name || token.symbol;

            type PdfElement = {
                type: "header_title" | "header_subtitle" | "header_token" | "meta" | "section" | "subheading" | "bullet_lead" | "bullet_cont" | "para_first" | "para_cont" | "divider" | "spacer";
                text?: string;
            };

            const elements: PdfElement[] = [];

            // 1. Academic Header Block (Page 1 Top Center)
            if (lang === "id") {
                elements.push({ type: "header_title", text: "TOKENOMICS COPILOT - LAPORAN AUDIT" });
                elements.push({ type: "header_subtitle", text: "DOKUMEN AKADEMIK" });
                elements.push({ type: "header_token", text: `${tokenDisplayName} ($${token.symbol})` });
            } else {
                elements.push({ type: "header_title", text: "TOKENOMICS COPILOT - AUDIT" });
                elements.push({ type: "header_subtitle", text: "REPORT" });
                elements.push({ type: "header_token", text: `${tokenDisplayName} ($${token.symbol})` });
            }
            elements.push({ type: "spacer" });

            // 2. Metadata Block (Page 1)
            const honeypotTextId = isHoneypot 
                ? "Pemindai Honeypot: GAGAL (Terdeteksi Honeypot!)" 
                : honeypotPassed 
                ? `Pemindai Honeypot: Lulus (Pajak ${buyTax}% Beli / ${sellTax}% Jual, ${isBlacklisted ? "Blacklist Aktif" : "Bebas Blacklist"})`
                : "Pemindai Honeypot: Tidak Dapat Diverifikasi";

            const finTextId = fin?.available
                ? `Valuasi Pasar: MCap ${formatCurrency(fin.marketCapUsd)} | FDV ${formatCurrency(fin.fdvUsd)} | Float Sirkulasi: ${formatPercent(fin.dilutionRatio)} (${fin.dilutionRisk})`
                : "Valuasi Pasar: Data DEX Tidak Tersedia";

            const honeypotTextEn = isHoneypot 
                ? "Honeypot Scanner: FAILED (Honeypot Detected!)" 
                : honeypotPassed 
                ? `Honeypot Scanner: Passed (${buyTax}% Buy / ${sellTax}% Sell Tax, ${isBlacklisted ? "Blacklist Active" : "No Blacklist"})`
                : "Honeypot Scanner: Unverifiable";

            const finTextEn = fin?.available
                ? `Market Valuation: MCap ${formatCurrency(fin.marketCapUsd)} | FDV ${formatCurrency(fin.fdvUsd)} | Float: ${formatPercent(fin.dilutionRatio)} (${fin.dilutionRisk})`
                : "Market Valuation: DEX Data Unavailable";

            if (lang === "id") {
                elements.push({ type: "meta", text: `Alamat Kontrak: ${tokenAddress}` });
                elements.push({ type: "meta", text: `Skor Risiko: ${totalScore}/100 (${cleanRiskLabel})` });
                elements.push({ type: "meta", text: `Status LP: ${isLpLocked ? "Terkunci" : "Peringatan / Tidak Terkunci"}   Sinyal Paus: ${whaleSignal === "Neutral" ? "Netral" : whaleSignal}` });
                elements.push({ type: "meta", text: `Kepemilikan: ${ownershipRenounced ? "Telah Diresignasi" : "Aktif"}` });
                elements.push({ type: "meta", text: honeypotTextId });
                elements.push({ type: "meta", text: finTextId });
                elements.push({ type: "meta", text: `Waktu Verifikasi: ${new Date().toUTCString()}` });
            } else {
                elements.push({ type: "meta", text: `Contract Address: ${tokenAddress}` });
                elements.push({ type: "meta", text: `Risk Score: ${totalScore}/100 (${cleanRiskLabel})` });
                elements.push({ type: "meta", text: `LP Status: ${isLpLocked ? "Locked" : "Warning / Unlocked"}   Whale Signal: ${whaleSignal}` });
                elements.push({ type: "meta", text: `Ownership: ${ownershipRenounced ? "Renounced" : "Active"}` });
                elements.push({ type: "meta", text: honeypotTextEn });
                elements.push({ type: "meta", text: finTextEn });
                elements.push({ type: "meta", text: `Timestamp: ${new Date().toUTCString()}` });
            }
            elements.push({ type: "spacer" });

            // 3. Process Content Lines with Academic Paragraph Tab Indentation & Translation
            const translateHeading = (h: string) => {
                if (lang === "en") return h;
                if (h.includes("DIGITAL INFRASTRUCTURE") || h.includes("INFRASTRUKTUR DIGITAL")) return "I. INFRASTRUKTUR DIGITAL & JEJAK DIGITAL";
                if (h.includes("FUNDAMENTAL & ENTITY") || h.includes("EVALUASI FUNDAMENTAL")) return "II. EVALUASI FUNDAMENTAL & ENTITAS";
                if (h.includes("TOKENOMICS DEEP DIVE") || h.includes("BEDAH TOKENOMICS")) return "III. BEDAH TOKENOMICS (5 PILAR UTAMA)";
                if (h.includes("FINAL VERDICT") || h.includes("KESIMPULAN AUDIT")) return "KESIMPULAN AKHIR (RINGKASAN EKSEKUTIF)";
                if (h.includes("SUPPLY & DEMAND") || h.includes("PENAWARAN & PERMINTAAN")) return "1. DINAMIKA PENAWARAN & PERMINTAAN:";
                if (h.includes("TOKEN DISTRIBUTION") || h.includes("DISTRIBUSI TOKEN")) return "2. DISTRIBUSI TOKEN & ANOMALI ON-CHAIN:";
                if (h.includes("BUSINESS MODEL") || h.includes("MODEL BISNIS")) return "3. MODEL BISNIS & AKUMULASI NILAI:";
                if (h.includes("ECOSYSTEM CONNECTIVITY") || h.includes("KONEKTIVITAS EKOSISTEM")) return "4. KONEKTIVITAS EKOSISTEM & KEMITRAAN:";
                if (h.includes("LIQUIDITY & EXCHANGE") || h.includes("STATUS LIKUIDITAS")) return "5. KESEHATAN LIKUIDITAS & BURSA:";
                if (h.includes("DISTRIBUTION STATUS") || h.includes("STATUS DISTRIBUSI")) return "STATUS DISTRIBUSI :";
                if (h.includes("BUSINESS STATUS") || h.includes("STATUS BISNIS")) return "STATUS BISNIS     :";
                if (h.includes("RED FLAGS")) return "CATATAN MERAH (RED FLAGS) :";
                if (h.includes("TACTICAL NOTE") || h.includes("CATATAN TAKTIS")) return "CATATAN TAKTIS    :";
                return h;
            };

            const rawLines = (token.auditText || "").split("\n");
            for (const rLine of rawLines) {
                const cleaned = rLine.replace(/[*#`_]/g, "").trim();
                if (!cleaned) {
                    elements.push({ type: "spacer" });
                    continue;
                }

                // Skip repetitive raw titles/separators
                if (cleaned.toUpperCase().includes("EXECUTIVE SUMMARY: AUDIT REPORT") || cleaned.startsWith("===") || cleaned.startsWith("---")) {
                    continue;
                }

                // Roman Numeral Section Headings (e.g. I. DIGITAL INFRASTRUCTURE...)
                if (/^[IVXLC]+\.\s/.test(cleaned)) {
                    elements.push({ type: "section", text: translateHeading(cleaned) });
                    continue;
                }

                // Numbered Subheadings (e.g. 1. SUPPLY & DEMAND DYNAMICS:...)
                if (/^\d+\.\s/.test(cleaned) || (/^[A-Z\s&:()]{8,}$/.test(cleaned) && cleaned.length > 5)) {
                    elements.push({ type: "subheading", text: translateHeading(cleaned) });
                    continue;
                }

                // Bullet point items (e.g. - [Label]: description or - Label: description)
                if (cleaned.startsWith("-")) {
                    const colonIdx = cleaned.indexOf(":");
                    let lead = "";
                    let rest = cleaned;
                    if (colonIdx !== -1 && colonIdx < 55) {
                        lead = cleaned.substring(0, colonIdx + 1);
                        rest = cleaned.substring(colonIdx + 1).trim();
                    }

                    const words = (lead ? `${lead} ${rest}` : cleaned).split(" ");
                    let curLine = "";
                    let isFirst = true;

                    for (const w of words) {
                        if ((curLine + " " + w).trim().length > 70) {
                            if (isFirst) {
                                elements.push({ type: "bullet_lead", text: curLine });
                                isFirst = false;
                            } else {
                                elements.push({ type: "bullet_cont", text: curLine });
                            }
                            curLine = w;
                        } else {
                            curLine = curLine ? curLine + " " + w : w;
                        }
                    }
                    if (curLine) {
                        if (isFirst) {
                            elements.push({ type: "bullet_lead", text: curLine });
                        } else {
                            elements.push({ type: "bullet_cont", text: curLine });
                        }
                    }
                    continue;
                }

                // Standard body paragraphs: First line has Tab Indent, continuation lines are full width
                const words = cleaned.split(" ");
                let curLine = "";
                let isFirst = true;

                for (const w of words) {
                    const maxLen = isFirst ? 65 : 72;
                    if ((curLine + " " + w).trim().length > maxLen) {
                        if (isFirst) {
                            elements.push({ type: "para_first", text: curLine });
                            isFirst = false;
                        } else {
                            elements.push({ type: "para_cont", text: curLine });
                        }
                        curLine = w;
                    } else {
                        curLine = curLine ? curLine + " " + w : w;
                    }
                }
                if (curLine) {
                    if (isFirst) {
                        elements.push({ type: "para_first", text: curLine });
                    } else {
                        elements.push({ type: "para_cont", text: curLine });
                    }
                }
            }

            // Footer Disclaimer
            elements.push({ type: "spacer" });
            elements.push({ type: "divider" });
            if (lang === "id") {
                elements.push({ type: "para_cont", text: "Dihasilkan melalui Tokenomics Copilot (Viem RPC & Gemini AI)" });
                elements.push({ type: "para_cont", text: "Penyangkalan: Laporan audit otomatis ini bukan merupakan nasihat keuangan." });
            } else {
                elements.push({ type: "para_cont", text: "Generated via Tokenomics Copilot (Viem RPC & Gemini AI)" });
                elements.push({ type: "para_cont", text: "Disclaimer: This automated audit report does not constitute financial advice." });
            }

            // 4. Paginate elements into A4 pages (595.28 x 841.89 pt, 1.5 line spacing = 18pt leading)
            type PageContent = Array<{
                font: "/F1" | "/F2";
                size: number;
                x: number;
                y: number;
                text: string;
            }>;

            const pages: PageContent[] = [];
            let currentPage: PageContent = [];
            let currentY = 760;
            const bottomMargin = 75;

            const pushLine = (font: "/F1" | "/F2", size: number, x: number, text: string, lineHeight = 18) => {
                if (currentY - lineHeight < bottomMargin) {
                    pages.push(currentPage);
                    currentPage = [];
                    currentY = 770;
                }
                currentPage.push({ font, size, x, y: currentY, text });
                currentY -= lineHeight;
            };

            for (const el of elements) {
                if (el.type === "header_title") {
                    // Times-Bold 18pt Centered
                    pushLine("/F2", 18, 135, escapePdf(el.text || ""), 24);
                } else if (el.type === "header_subtitle") {
                    // Times-Bold 18pt Centered
                    pushLine("/F2", 18, 245, escapePdf(el.text || ""), 26);
                } else if (el.type === "header_token") {
                    // Times-Bold 13pt Centered
                    pushLine("/F2", 13, 205, escapePdf(el.text || ""), 22);
                } else if (el.type === "meta") {
                    // Times-Roman 11pt Metadata (15pt leading)
                    pushLine("/F1", 11, 72, escapePdf(el.text || ""), 16);
                } else if (el.type === "section") {
                    // Times-Bold 12pt Section Heading (I. DIGITAL INFRASTRUCTURE...)
                    currentY -= 8;
                    pushLine("/F2", 12, 72, escapePdf(el.text || ""), 20);
                } else if (el.type === "subheading") {
                    // Times-Bold 12pt Subheading (1. SUPPLY & DEMAND DYNAMICS:)
                    currentY -= 4;
                    pushLine("/F2", 12, 72, escapePdf(el.text || ""), 18);
                } else if (el.type === "bullet_lead") {
                    // Bullet Point Line 1 (starts at left margin 72pt)
                    pushLine("/F1", 12, 72, escapePdf(el.text || ""), 18);
                } else if (el.type === "bullet_cont") {
                    // Bullet Point Continuation (aligned slightly indented at 80pt)
                    pushLine("/F1", 12, 80, escapePdf(el.text || ""), 18);
                } else if (el.type === "para_first") {
                    // Academic Paragraph First Line: Tab Indented at 105pt!
                    pushLine("/F1", 12, 105, escapePdf(el.text || ""), 18);
                } else if (el.type === "para_cont") {
                    // Academic Paragraph Continuation Lines: Flush at Left Margin 72pt!
                    pushLine("/F1", 12, 72, escapePdf(el.text || ""), 18);
                } else if (el.type === "divider") {
                    pushLine("/F1", 10, 72, "---------------------------------------------------------------------------------------------------------", 14);
                } else if (el.type === "spacer") {
                    currentY -= 6;
                }
            }

            if (currentPage.length > 0) {
                pages.push(currentPage);
            }

            const totalPages = pages.length || 1;

            // 5. Construct Compliant PDF 1.4 Binary Structure
            let pdf = `%PDF-1.4\n`;
            const offsets: number[] = [];

            // Obj 1: Catalog
            offsets.push(pdf.length);
            pdf += `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;

            // Obj 2: Pages Parent
            const pageObjRefs = Array.from({ length: totalPages }, (_, i) => `${3 + i * 2} 0 R`).join(" ");
            offsets.push(pdf.length);
            pdf += `2 0 obj\n<< /Type /Pages /Kids [${pageObjRefs}] /Count ${totalPages} >>\nendobj\n`;

            // Generate Pages and Content Streams
            for (let p = 0; p < totalPages; p++) {
                const pageObjNum = 3 + p * 2;
                const contentObjNum = 4 + p * 2;

                // Page Object (A4 595.28 x 841.89)
                offsets.push(pdf.length);
                pdf += `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents ${contentObjNum} 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >> >> >> >>\nendobj\n`;

                // Build text stream
                let streamText = `BT\n`;
                const pageItems = pages[p] || [];
                for (const item of pageItems) {
                    streamText += `${item.font} ${item.size} Tf\n1 0 0 1 ${item.x} ${item.y} Tm\n(${item.text}) Tj\n`;
                }

                // Centered Academic Page Number Footer (- X -)
                const pageNumText = escapePdf(`- ${p + 1} -`);
                streamText += `/F1 10 Tf\n1 0 0 1 285 45 Tm\n(${pageNumText}) Tj\n`;
                streamText += `ET\n`;

                // Content Object
                offsets.push(pdf.length);
                pdf += `${contentObjNum} 0 obj\n<< /Length ${streamText.length} >>\nstream\n${streamText}\nendstream\nendobj\n`;
            }

            // XRef Table
            const startXref = pdf.length;
            const totalObjects = 2 + totalPages * 2;
            pdf += `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`;
            for (const offset of offsets) {
                pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
            }

            // Trailer
            pdf += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

            const blob = new Blob([pdf], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Tokenomics_Audit_${token.symbol}_${lang.toUpperCase()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setIsExporting(false);
        }, 800);
    };

    const handleShareX = () => {
        const text = `🔍 Verified Tokenomics Audit for $${token.symbol} on Tokenomics Copilot!\n\nRisk Score: ${totalScore}/100 (${riskLabel})\nLP Status: ${isLpLocked ? 'Locked' : 'Unlocked'}\nWhale Signal: ${whaleSignal}\n\nCheck on-chain signals & fundamental audit on BNB Chain:`;
        const url = window.location.href;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
    };

    const handleUnlockPremium = async () => {
        const walletAddr = walletAddress || safeGetSession("walletAddress");
        if (!walletAddr) {
            setUnlockError("Please connect your wallet first.");
            return;
        }
        setIsUnlocking(true);
        setUnlockStep("requesting_signature");
        setUnlockError(null);
        try {
            const isDemoWallet = walletAddr.toLowerCase() === "0x71C6793F1e10417385973715A3674682343fD498".toLowerCase() || (typeof window !== "undefined" && !window.ethereum);

            if (isDemoWallet) {
                // Smooth Web3 Signature & Greenfield Access simulation for Demo Mode
                await new Promise((res) => setTimeout(res, 900));
                setUnlockStep("confirming_tx");
                await new Promise((res) => setTimeout(res, 1100));
                setUnlockStep("granted");
                safeSetSession(sessionKey, "true");
                setTimeout(() => {
                    setPremiumUnlocked(true);
                    setIsUnlocking(false);
                    setUnlockStep("idle");
                }, 800);
                return;
            }

            // Step 1: Real on-chain micro-payment (0.001 BNB)
            const realTxHash = await sendMicroPayment(walletAddr);

            // Step 2: Confirming on-chain receipt & backend cryptographic verification
            setUnlockStep("confirming_tx");
            await api.unlockPremium(walletAddr, symbol?.toUpperCase() || "", realTxHash, chainId || 56);

            // Step 3: VIP Greenfield Access Granted
            setUnlockStep("granted");
            safeSetSession(sessionKey, "true");
            setTimeout(() => {
                setPremiumUnlocked(true);
                setIsUnlocking(false);
                setUnlockStep("idle");
            }, 800);
        } catch (err: any) {
            setUnlockError(err.message || "Failed to unlock premium report.");
            setIsUnlocking(false);
            setUnlockStep("idle");
        }
    };

    return (
        <div className="page-transition">
            {/* Language Selection Modal Dialog - Apple Sheet Style */}
            {showLangModal && createPortal(
                <div 
                    onClick={() => setShowLangModal(false)}
                    className="fixed inset-0 z-[999] bg-black/75 backdrop-blur-md flex items-start justify-center pt-20 sm:pt-28 p-4 overflow-y-auto animate-in fade-in duration-200"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-[#121317]/95 border border-white/[0.12] rounded-[28px] p-6 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.85)] space-y-5 animate-in zoom-in-[0.98] duration-200 ease-out text-foreground"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-primary flex items-center justify-center">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base tracking-tight text-white">Export Audit Report (PDF)</h3>
                                    <p className="text-xs text-white/50">Select your preferred report language:</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowLangModal(false)}
                                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer active:scale-95"
                                aria-label="Close modal"
                            >
                                <span className="text-base leading-none">&times;</span>
                            </button>
                        </div>

                        {/* Language Selection Options */}
                        <div className="space-y-3">
                            {/* English Option */}
                            <button
                                onClick={() => handleDownloadReport("en")}
                                className="titanium-pill w-full p-4 rounded-2xl border border-white/[0.08] hover:border-primary/40 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex items-center justify-between text-left group/lang cursor-pointer active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-3.5">
                                    <span className="text-2xl select-none">🇬🇧</span>
                                    <div>
                                        <p className="text-sm font-bold text-white group-hover/lang:text-primary transition-colors">
                                            English Version
                                        </p>
                                        <p className="text-xs text-white/50">
                                            Full Institutional Audit Report in English
                                        </p>
                                    </div>
                                </div>
                                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] group-hover/lang:border-primary/40 group-hover/lang:bg-primary/10 flex items-center justify-center transition-colors">
                                    <Download className="w-4 h-4 text-white/60 group-hover/lang:text-primary transition-transform group-hover/lang:scale-110" />
                                </div>
                            </button>

                            {/* Indonesian Option */}
                            <button
                                onClick={() => handleDownloadReport("id")}
                                className="titanium-pill w-full p-4 rounded-2xl border border-white/[0.08] hover:border-primary/40 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex items-center justify-between text-left group/lang cursor-pointer active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-3.5">
                                    <span className="text-2xl select-none">🇮🇩</span>
                                    <div>
                                        <p className="text-sm font-bold text-white group-hover/lang:text-primary transition-colors">
                                            Bahasa Indonesia
                                        </p>
                                        <p className="text-xs text-white/50">
                                            Laporan Audit Terjemahan Bahasa Indonesia
                                        </p>
                                    </div>
                                </div>
                                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] group-hover/lang:border-primary/40 group-hover/lang:bg-primary/10 flex items-center justify-center transition-colors">
                                    <Download className="w-4 h-4 text-white/60 group-hover/lang:text-primary transition-transform group-hover/lang:scale-110" />
                                </div>
                            </button>
                        </div>

                        <p className="text-[11px] text-center text-white/40">
                            Includes complete tokenomics breakdown, on-chain telemetry, and risk signals.
                        </p>
                    </div>
                </div>,
                document.body
            )}

            <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

                {/* Top Action Bar (Back, Share, Download) */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <button
                        onClick={() => navigate("/")}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors group cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
                        <span>Back to Dashboard</span>
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* Share to X */}
                        <button
                            onClick={handleShareX}
                            className="h-9 px-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-white/70 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer active:scale-[0.97]"
                            title="Share on X (Twitter)"
                        >
                            <Share2 className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 text-white/60 group-hover:text-white" />
                            <span>Share to X</span>
                        </button>

                        {/* Download Report Button with Modal Trigger */}
                        <button
                            onClick={() => setShowLangModal(true)}
                            disabled={isExporting}
                            className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-2 transition-all shadow-[0_2px_12px_rgba(10,132,255,0.25)] hover:shadow-[0_4px_16px_rgba(10,132,255,0.35)] disabled:opacity-70 group/dl cursor-pointer active:scale-[0.97]"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Downloading...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-3.5 h-3.5 transition-transform duration-200 group-hover/dl:scale-110" />
                                    <span>Download Report</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Token Header Card */}
                <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#131418] via-[#0E0F13] to-[#0A0A0D] backdrop-blur-2xl border border-white/[0.08] shadow-[0_24px_56px_-12px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.06)] p-6 sm:p-8 space-y-6 print:border print:border-black/30 print:shadow-none print:bg-white print:p-4">
                    {/* Apple Subdued Specular Rim */}
                    <div className="pointer-events-none absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.09] to-transparent" />

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100 print:text-xl">
                                    {(token as any).name || token.symbol}
                                </h1>
                                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-zinc-900/90 border border-zinc-800 font-mono font-semibold text-zinc-400 uppercase tracking-wide">
                                    {token.symbol}
                                </span>
                            </div>

                            {/* Contract Address & Explorer Bar */}
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                {/* Shortened Contract Address Button with Copy */}
                                <button
                                    onClick={handleCopy}
                                    className="px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 font-mono text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer group/addr active:scale-[0.97]"
                                    title="Click to copy full address"
                                >
                                    <span className="font-semibold">
                                        {tokenAddress && tokenAddress.length > 12 
                                            ? `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}` 
                                            : tokenAddress}
                                    </span>
                                    {copied ? (
                                        <span className="text-zinc-300 flex items-center gap-1 text-[11px] font-medium">
                                            <Check className="w-3.5 h-3.5" />
                                        </span>
                                    ) : (
                                        <Copy className="w-3.5 h-3.5 text-zinc-500 group-hover/addr:text-zinc-300 transition-colors" />
                                    )}
                                </button>

                                {/* Dynamic Block Explorer Pill Button (BscScan / opBnbScan) */}
                                <a
                                    href={getExplorerTokenUrl(chainId, tokenAddress)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 group/scan active:scale-[0.97]"
                                    title={`View on ${activeChain?.name || "BscScan"}`}
                                >
                                    <span>{activeChain?.shortName ? `${activeChain.shortName}Scan` : "BscScan"}</span>
                                    <ExternalLink className="w-3 h-3 text-zinc-500 group-hover/scan:text-zinc-300 transition-colors" />
                                </a>
                            </div>
                        </div>

                        <div className={`px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 shadow-sm ${badgeColor} print:border-black`}>
                            <Icon className="w-4 h-4 text-zinc-300" />
                            <span className="tracking-wide">{riskLabel}</span>
                        </div>
                    </div>

                    {/* Score Gauge */}
                    <div className="p-6 rounded-2xl bg-[#0E0F13]/90 border border-white/[0.06] flex items-center justify-center print:bg-neutral-50 print:border-black/20 shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]">
                        <AnimatedRadialScore 
                            score={totalScore} 
                            scoreColor={scoreColor} 
                            progressColor={progressColor} 
                        />
                    </div>

                    {/* On-Chain Signal Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#0E0F13]/90 border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] print:bg-neutral-50 print:border-neutral-200">
                            <div className="w-8 h-8 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center shrink-0">
                                {isLpLocked ? (
                                    <Lock className="w-4 h-4 text-zinc-300" />
                                ) : (
                                    <Unlock className="w-4 h-4 text-zinc-400" />
                                )}
                            </div>
                            <div>
                                <p className="text-[11px] text-zinc-500 font-medium">LP Status</p>
                                <p className="font-semibold text-zinc-200 text-xs">{isLpLocked ? "Locked" : "Warning / Unlocked"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#0E0F13]/90 border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] print:bg-neutral-50 print:border-neutral-200">
                            <div className="w-8 h-8 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center shrink-0">
                                <Waves className="w-4 h-4 text-zinc-300" />
                            </div>
                            <div>
                                <p className="text-[11px] text-zinc-500 font-medium">Whale Signal</p>
                                <p className="font-semibold text-zinc-200 text-xs">{whaleSignal}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#0E0F13]/90 border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] print:bg-neutral-50 print:border-neutral-200">
                            <div className="w-8 h-8 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-4 h-4 text-zinc-300" />
                            </div>
                            <div>
                                <p className="text-[11px] text-zinc-500 font-medium">Ownership</p>
                                <p className="font-semibold text-zinc-200 text-xs">{ownershipRenounced ? "Renounced" : "Active"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tokenomics Financial & Dilution Metrics Card */}
                    <div className="p-5 rounded-2xl bg-[#0E0F13]/90 border border-white/[0.06] space-y-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] print:bg-neutral-50 print:border-neutral-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-zinc-400" />
                                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                                    Tokenomics Market Valuation & Float
                                </span>
                            </div>
                            {fin?.dilutionRisk && fin.dilutionRisk !== "UNAVAILABLE" && (
                                <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[11px] font-medium border flex items-center gap-1.5 bg-zinc-900/90 text-zinc-300 border-zinc-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                    {fin.dilutionRisk === "LOW" && "Low Dilution Risk"}
                                    {fin.dilutionRisk === "MODERATE" && "Moderate Dilution Risk"}
                                    {fin.dilutionRisk === "HIGH" && "High Dilution Risk (< 30% Float)"}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="p-3.5 rounded-xl bg-[#090A0D] border border-white/[0.06] space-y-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
                                <span className="text-[11px] text-zinc-500 font-medium">Price (USD)</span>
                                <p className="font-semibold text-zinc-200 text-sm font-mono tracking-tight tabular-nums">{formatCurrency(fin?.priceUsd)}</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[#090A0D] border border-white/[0.06] space-y-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
                                <span className="text-[11px] text-zinc-500 font-medium">Market Cap</span>
                                <p className="font-semibold text-zinc-200 text-sm font-mono tracking-tight tabular-nums">{formatCurrency(fin?.marketCapUsd)}</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[#090A0D] border border-white/[0.06] space-y-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
                                <span className="text-[11px] text-zinc-500 font-medium">FDV (Fully Diluted)</span>
                                <p className="font-semibold text-zinc-200 text-sm font-mono tracking-tight tabular-nums">{formatCurrency(fin?.fdvUsd)}</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[#090A0D] border border-white/[0.06] space-y-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-zinc-500 font-medium">Circulating Float</span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveTooltip(prev => prev === "dilution" ? null : "dilution");
                                        }}
                                        className="p-0.5 rounded-md hover:bg-white/[0.08] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                                        title="What is Dilution Float?"
                                    >
                                        <Info className="w-3 h-3" />
                                    </button>
                                </div>
                                <p className="font-semibold text-zinc-200 text-sm font-mono tracking-tight tabular-nums">{formatPercent(fin?.dilutionRatio)}</p>
                            </div>
                        </div>

                        {/* Dilution Explanation Tooltip */}
                        {activeTooltip === "dilution" && (
                            <div 
                                onClick={(e) => e.stopPropagation()}
                                className="p-4 bg-[#111216]/98 border border-white/[0.08] text-foreground text-xs rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200"
                            >
                                <p className="font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
                                    <BarChart3 className="w-3.5 h-3.5 text-zinc-400" /> Dilution Ratio & Float Tokenomics Analysis
                                </p>
                                <p className="text-zinc-400 text-[11px] leading-relaxed">
                                    The circulating float measures the percentage of total token supply actively trading on the open market. Tokens with a low circulating float (&lt; 30% of Total Supply) carry high dilution risk from upcoming token unlock cliffs and team vesting schedules.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Web3 Security & Honeypot / Tax Verification Panel with Click Tooltips */}
                    <div className="p-4 rounded-2xl bg-[#0E0F13]/90 border border-white/[0.06] text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                        {/* Item 1: Honeypot Scanner */}
                        <div className="flex items-center gap-2 relative shrink-0">
                            {isHoneypot ? (
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4 text-zinc-300 shrink-0" />
                            )}
                            <span className="text-zinc-500 whitespace-nowrap">Honeypot:</span>
                            <span className={`font-medium whitespace-nowrap ${isHoneypot ? "text-rose-400" : "text-zinc-200"}`}>
                                {isHoneypot ? "FAILED (Honeypot Detected!)" : honeypotPassed ? "Passed (Tradeable)" : "Unverifiable"}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTooltip(prev => prev === "honeypot" ? null : "honeypot");
                                }}
                                className="p-0.5 rounded-md hover:bg-white/[0.08] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                                title="Click for info"
                            >
                                <Info className="w-3.5 h-3.5 shrink-0" />
                            </button>
                            
                            {/* Modern Tooltip */}
                            {activeTooltip === "honeypot" && (
                                <div 
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute bottom-full left-0 mb-3 w-64 p-4 bg-[#111216]/98 border border-white/[0.08] text-foreground text-xs rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.7)] z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200"
                                >
                                    <p className={`font-semibold mb-1 flex items-center gap-1.5 ${isHoneypot ? "text-rose-400" : "text-zinc-200"}`}>
                                        {isHoneypot ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" />} 
                                        {isHoneypot ? "Critical Honeypot Risk" : "Honeypot Free (Passed)"}
                                    </p>
                                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                                        {isHoneypot 
                                            ? "This token has been identified as a honeypot in the on-chain simulator. Users cannot sell this token after buying."
                                            : "Token can be traded freely on DEX without covert transfer restrictions or hidden selling locks."}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Item 2: Transfer Tax */}
                        <div className="flex items-center gap-2 relative shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-zinc-300 shrink-0" />
                            <span className="text-zinc-500 whitespace-nowrap">Transfer Tax:</span>
                            <span className={`font-medium whitespace-nowrap ${sellTax > 10 || buyTax > 10 ? "text-zinc-300" : "text-zinc-200"}`}>
                                {sec?.available ? `${buyTax}% Buy / ${sellTax}% Sell` : "0% Buy / 0% Sell"}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTooltip(prev => prev === "tax" ? null : "tax");
                                }}
                                className="p-0.5 rounded-md hover:bg-white/[0.08] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                                title="Click for info"
                            >
                                <Info className="w-3.5 h-3.5 shrink-0" />
                            </button>
                            
                            {/* Modern Tooltip */}
                            {activeTooltip === "tax" && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50">
                                    <div 
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-64 p-4 bg-[#111216]/98 border border-white/[0.08] text-foreground text-xs rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200"
                                    >
                                        <p className="font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" /> {sellTax > 10 || buyTax > 10 ? "High Tax Detected" : "Standard Tax"}
                                        </p>
                                        <p className="text-zinc-400 text-[11px] leading-relaxed">
                                            {sellTax > 10 || buyTax > 10 
                                                ? `High transfer tax detected (${sellTax}% sell tax). A portion of sell proceeds is retained by the contract.` 
                                                : "Standard transfer fees (healthy tokens typically range between 0% - 10%)."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Item 3: Blacklist Check */}
                        <div className="flex items-center gap-2 relative shrink-0">
                            {isBlacklisted ? (
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4 text-zinc-300 shrink-0" />
                            )}
                            <span className="text-zinc-500 whitespace-nowrap">Blacklist:</span>
                            <span className={`font-medium whitespace-nowrap ${isBlacklisted ? "text-rose-400" : "text-zinc-200"}`}>
                                {isBlacklisted ? "Active Detected" : "None Detected"}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTooltip(prev => prev === "blacklist" ? null : "blacklist");
                                }}
                                className="p-0.5 rounded-md hover:bg-white/[0.08] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                                title="Click for info"
                            >
                                <Info className="w-3.5 h-3.5 shrink-0" />
                            </button>
                            
                            {/* Modern Tooltip */}
                            {activeTooltip === "blacklist" && (
                                <div 
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute bottom-full right-0 mb-3 w-64 p-4 bg-[#111216]/98 border border-white/[0.08] text-foreground text-xs rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.7)] z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200"
                                >
                                    <p className={`font-semibold mb-1 flex items-center gap-1.5 ${isBlacklisted ? "text-rose-400" : "text-zinc-200"}`}>
                                        {isBlacklisted ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" />} 
                                        {isBlacklisted ? "Blacklist Active" : "No Blacklist"}
                                    </p>
                                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                                        {isBlacklisted 
                                            ? "Contract has an active blacklist function allowing developers to restrict specific wallet addresses from trading." 
                                            : "Contract developers do not possess blacklist privileges to unilaterally restrict investor wallets."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Premium Unlock Gate */}
                {!premiumUnlocked ? (
                    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#131418] via-[#0E0F13] to-[#0A0A0D] backdrop-blur-2xl border border-white/[0.08] shadow-[0_24px_56px_-12px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.06)] p-8 sm:p-10 text-center flex flex-col items-center space-y-6 animate-in fade-in duration-200">
                        {/* Apple Subdued Specular Rim */}
                        <div className="pointer-events-none absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.09] to-transparent" />
                        
                        {/* Inline CSS for iOS Face ID Shackle Spring & Snap-Lock Shake */}
                        <style>{`
                            @keyframes iosPadlockShake {
                                0%, 100% { transform: translateX(0); }
                                15% { transform: translateX(-6px) rotate(-1.5deg); }
                                30% { transform: translateX(5px) rotate(1.2deg); }
                                45% { transform: translateX(-4px) rotate(-0.8deg); }
                                60% { transform: translateX(3px) rotate(0.5deg); }
                                75% { transform: translateX(-1px); }
                            }
                            .animate-ios-shake {
                                animation: iosPadlockShake 420ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
                            }
                            .ios-shackle {
                                transform-origin: 7px 11px;
                                will-change: transform;
                            }
                            .ios-shackle-unlocked {
                                transform: translateY(-4.5px) rotate(-18deg);
                                transition: transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1);
                            }
                            .ios-shackle-locked {
                                transform: translateY(0) rotate(0deg);
                                transition: transform 220ms cubic-bezier(0.32, 0.72, 0, 1);
                            }
                            @media (prefers-reduced-motion: reduce) {
                                .animate-ios-shake {
                                    animation: none !important;
                                }
                                .ios-shackle-unlocked,
                                .ios-shackle-locked {
                                    transition: transform 150ms ease-out !important;
                                }
                            }
                        `}</style>

                        {/* Apple Squircle Glass Icon with iOS Face ID Shackle Spring & Snap-Lock Shake */}
                        <div 
                            key={unlockError ? `error-${unlockError}` : unlockStep}
                            className={`relative w-16 h-16 rounded-[22px] backdrop-blur-xl border flex items-center justify-center transition-[transform,background-color,border-color,box-shadow,color] duration-300 ${
                                unlockStep === "granted"
                                    ? "bg-zinc-800/90 border-zinc-600/60 text-zinc-100 shadow-[0_8px_24px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.1)] scale-105"
                                    : unlockError
                                        ? "animate-ios-shake bg-rose-950/25 border-rose-800/40 text-rose-400 shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
                                        : "bg-[#15161C]/90 border-white/[0.09] text-zinc-300 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-white/[0.16] hover:scale-105"
                            }`}
                        >
                            {unlockStep === "requesting_signature" ? (
                                <Wallet className="w-7 h-7 text-zinc-300 animate-pulse" />
                            ) : unlockStep === "confirming_tx" ? (
                                <Loader2 className="w-7 h-7 text-zinc-300 animate-spin" />
                            ) : (
                                /* Physical Shackle SVG Padlock */
                                <svg 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2.2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    className="w-7 h-7"
                                >
                                    {/* iOS Animated Shackle (Batang Lengkung Gembok) */}
                                    <path 
                                        d="M7 11V7a5 5 0 0 1 10 0v4" 
                                        className={`ios-shackle ${unlockStep === "granted" ? "ios-shackle-unlocked" : "ios-shackle-locked"}`}
                                    />
                                    {/* Padlock Body (Badan Gembok) */}
                                    <rect width="18" height="11" x="3" y="11" rx="2.5" ry="2.5" />
                                    {/* Keyhole / Lock Core */}
                                    <circle cx="12" cy="15.5" r="1" fill="currentColor" />
                                    <path d="M12 16.5v2" strokeWidth="1.8" />
                                </svg>
                            )}
                        </div>

                        <div className="space-y-2.5 max-w-md relative z-10">
                            {/* Apple Wallet Pass Subdued Pill */}
                            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-wider bg-zinc-900/90 text-zinc-400 border border-zinc-800/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 shrink-0" />
                                <span className="text-zinc-300 font-medium">BNB Greenfield VIP</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                <span className="font-mono tabular-nums text-zinc-300 font-semibold">{MICROPAYMENT_AMOUNT_BNB} BNB</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                <span className="text-zinc-400 font-mono">{activeChain?.name || "BNB Chain"}</span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
                                Unlock Executive Audit Dossier
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
                                Decrypt institutional-grade AI intelligence, liquidity locks, and full anomaly synthesis securely hosted on BNB Greenfield decentralized storage.
                            </p>
                        </div>

                        {/* Error Alert */}
                        {unlockError && (
                            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-center gap-2.5 text-rose-400 text-xs font-medium max-w-md w-full animate-in fade-in">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span className="text-left flex-1">{unlockError}</span>
                            </div>
                        )}

                        {/* Step Status Badges when processing */}
                        {isUnlocking && (
                            <div className="w-full max-w-sm p-3.5 rounded-xl bg-[#101115]/95 backdrop-blur-md border border-zinc-800/90 text-xs space-y-2 shadow-inner animate-in fade-in">
                                <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
                                    <span className="flex items-center gap-1.5 text-zinc-300">
                                        {unlockStep === "requesting_signature" ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                                        ) : (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" />
                                        )}
                                        1. Wallet Signature
                                    </span>
                                    <span className="flex items-center gap-1.5 text-zinc-300">
                                        {unlockStep === "confirming_tx" ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                                        ) : unlockStep === "granted" ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" />
                                        ) : (
                                            <span className="w-3.5 h-3.5 rounded-full border border-zinc-700 inline-block" />
                                        )}
                                        2. On-Chain Verification
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Action Button - High-Contrast Titanium Pill Button */}
                        <button
                            onClick={handleUnlockPremium}
                            disabled={isUnlocking}
                            className={`h-11 px-8 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2.5 cursor-pointer active:scale-[0.97] transition-[transform,background-color,border-color,box-shadow,opacity] duration-160 ease-apple-out disabled:cursor-not-allowed select-none ${
                                unlockStep === "granted"
                                    ? "bg-zinc-800 text-zinc-200 border border-zinc-600/60 shadow-[0_4px_16px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]"
                                    : "bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-100 border border-zinc-700/80 shadow-[0_6px_20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-zinc-600 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                            }`}
                        >
                            {unlockStep === "requesting_signature" ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
                                    <span>Requesting Wallet Signature...</span>
                                </>
                            ) : unlockStep === "confirming_tx" ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
                                    <span>Confirming On-Chain...</span>
                                </>
                            ) : unlockStep === "granted" ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                                    <span>Access Granted!</span>
                                </>
                            ) : (
                                <>
                                    <Unlock className="w-4 h-4 text-zinc-300" />
                                    <span>Unlock Full Report • {MICROPAYMENT_AMOUNT_BNB} BNB</span>
                                </>
                            )}
                        </button>
                    </div>
                ) : null}

                {/* Full Audit Report */}
                {premiumUnlocked && (
                <div className="rounded-[28px] bg-[#121316]/80 backdrop-blur-2xl border border-white/[0.08] shadow-2xl overflow-hidden text-sm print:bg-white print:border-black/30 print:text-black animate-in fade-in zoom-in-[0.99] duration-200 ease-out">
                    <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                        <h2 className="text-sm font-semibold flex items-center gap-2 text-white">
                            <FileText className="w-4 h-4 text-primary" />
                            <span>Executive Fundamental Audit Report</span>
                        </h2>
                    </div>
                    <div className="p-6 sm:p-8">
                        <FormattedAuditText text={token.auditText || ""} />
                    </div>
                </div>
                )}

                {/* Disclaimer Footer */}
                <div className="border-t border-white/[0.06] pt-6 text-center space-y-1">
                    <p className="text-[11px] text-white/40">
                        This automated audit is generated by Tokenomics Copilot via on-chain contract telemetry and AI fundamental extraction.
                    </p>
                    <p className="text-[10px] text-white/25">
                        Does not constitute financial advice. Always verify on-chain contracts directly on the official block explorer.
                    </p>
                </div>

            </div>
        </div>
    );
}
