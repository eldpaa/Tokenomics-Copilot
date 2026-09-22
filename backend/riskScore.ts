import type { AnomalySignals } from "./anomaly.ts";

export type RiskScoreBreakdown = {
    ownershipPoints: number;
    lpLockPoints: number;
    holderConcentrationPoints: number;
    whalePoints: number;
    securityPoints: number;
    dilutionPoints: number;
    textSignalPoints: number;
    total: number;
    label: "🟢 Low Risk" | "🟡 Medium Risk" | "🔴 High Risk";
};

export type AiStructuredAnalysis = {
    isPonziOrRugPull: boolean;
    sentimentScore: number;
};

// Skor 0-100, makin tinggi makin aman. Base 50, disesuaikan sinyal on-chain + teks.
export function hitungRiskScore(signals: AnomalySignals | null, aiAnalysis: AiStructuredAnalysis): RiskScoreBreakdown {
    let ownershipPoints = 0;
    if (signals?.ownership.available) {
        ownershipPoints = signals.ownership.renounced ? 15 : -5;
    }

    let lpLockPoints = 0;
    if (signals?.liquidityLock.available && signals.liquidityLock.v2TotalSecuredPercent !== null) {
        const totalSecured = signals.liquidityLock.v2TotalSecuredPercent;
        lpLockPoints = Math.round((totalSecured / 100) * 20);
    }

    let holderConcentrationPoints = 0;
    if (signals?.holderConcentration.available && signals.holderConcentration.top10Percent !== null) {
        const pct = signals.holderConcentration.top10Percent;
        if (pct < 20) holderConcentrationPoints = 15;
        else if (pct < 50) holderConcentrationPoints = 5;
        else holderConcentrationPoints = -15;
    }

    // Whale signal: dump pressure bikin skor turun, accumulation naik, neutral = 0
    let whalePoints = 0;
    if (signals?.whaleActivity.available) {
        if (signals.whaleActivity.dominantSignal === "DUMP_PRESSURE") whalePoints = -15;
        else if (signals.whaleActivity.dominantSignal === "ACCUMULATION") whalePoints = 10;
        // NEUTRAL = 0
    }

    // 5. Token Security Points (GoPlus Honeypot, Taxes, Blacklist)
    let securityPoints = 0;
    if (signals?.securityChecks?.available) {
        if (signals.securityChecks.isHoneypot === true) {
            securityPoints -= 50; // Critical penalty for honeypot
        } else {
            securityPoints += 5; // Reward clean honeypot check
        }

        const sellTax = signals.securityChecks.sellTaxPercent ?? 0;
        const buyTax = signals.securityChecks.buyTaxPercent ?? 0;
        if (sellTax > 15 || buyTax > 15) {
            securityPoints -= 20;
        } else if (sellTax > 10 || buyTax > 10) {
            securityPoints -= 10;
        }

        if (signals.securityChecks.isBlacklisted === true) {
            securityPoints -= 15;
        }
    }

    // 6. Tokenomics Dilution Risk Points (DexScreener Float)
    let dilutionPoints = 0;
    if (signals?.financialMetrics?.available) {
        if (signals.financialMetrics.dilutionRisk === "HIGH") {
            dilutionPoints -= 15;
        } else if (signals.financialMetrics.dilutionRisk === "LOW") {
            dilutionPoints += 5;
        }
    }

    // Menggunakan penilaian langsung dari LLM JSON Output, bukan tebak-tebakan Regex
    let textSignalPoints = Math.max(-15, Math.min(10, aiAnalysis.sentimentScore));
    
    // Penalti maksimal jika LLM mendeteksi pola Ponzi, Rug Pull, atau Prompt Injection!
    if (aiAnalysis.isPonziOrRugPull) {
        textSignalPoints -= 30;
    }

    let rawTotal = 50 + ownershipPoints + lpLockPoints + holderConcentrationPoints + whalePoints + securityPoints + dilutionPoints + textSignalPoints;

    // Hard ceiling for Honeypot tokens: can never exceed 25 (forces High Risk)
    if (signals?.securityChecks?.available && signals.securityChecks.isHoneypot === true) {
        rawTotal = Math.min(25, rawTotal);
    }

    const total = Math.max(0, Math.min(100, rawTotal));
    const label: RiskScoreBreakdown["label"] = total >= 70 ? "🟢 Low Risk" : total >= 40 ? "🟡 Medium Risk" : "🔴 High Risk";

    return {
        ownershipPoints,
        lpLockPoints,
        holderConcentrationPoints,
        whalePoints,
        securityPoints,
        dilutionPoints,
        textSignalPoints,
        total,
        label,
    };
}