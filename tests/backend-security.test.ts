import { describe, expect, it } from "bun:test";
import { checkTokenSecurity, checkFinancialMetrics } from "../backend/anomaly.ts";
import { hitungRiskScore } from "../backend/riskScore.ts";

describe("Token Security Engine (GoPlus & DexScreener)", () => {
    it("should parse security checks for CAKE token", async () => {
        // PancakeSwap CAKE token on BSC
        const cakeAddress = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82";
        const result = await checkTokenSecurity(cakeAddress);

        expect(result).toBeDefined();
        if (result.available) {
            expect(result.isHoneypot).toBe(false);
            expect(typeof result.buyTaxPercent === "number" || result.buyTaxPercent === null).toBe(true);
            expect(typeof result.sellTaxPercent === "number" || result.sellTaxPercent === null).toBe(true);
            expect(result.note.length).toBeGreaterThan(0);
        }
    });

    it("should fetch financial metrics for CAKE token from DexScreener", async () => {
        const cakeAddress = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82";
        const result = await checkFinancialMetrics(cakeAddress, "380000000");

        expect(result).toBeDefined();
        if (result.available) {
            expect(typeof result.priceUsd === "number" || result.priceUsd === null).toBe(true);
            expect(result.fdvUsd === null || (typeof result.fdvUsd === "number" && result.fdvUsd > 0)).toBe(true);
            expect(["LOW", "MODERATE", "HIGH", "UNAVAILABLE"]).toContain(result.dilutionRisk);
        }
    });
});

describe("Risk Score Calculation with Security & Dilution", () => {
    it("should severely penalize honeypot tokens", () => {
        const mockSignals: any = {
            ownership: { available: true, renounced: true },
            liquidityLock: { available: true, v2TotalSecuredPercent: 100 },
            holderConcentration: { available: true, top10Percent: 15 },
            whaleActivity: { available: true, dominantSignal: "ACCUMULATION" },
            securityChecks: {
                available: true,
                isHoneypot: true,
                buyTaxPercent: 0,
                sellTaxPercent: 99,
                isBlacklisted: true,
            },
            financialMetrics: {
                available: true,
                dilutionRisk: "HIGH",
            },
        };

        const score = hitungRiskScore(mockSignals, { isPonziOrRugPull: false, sentimentScore: 5 });
        expect(score.total).toBeLessThanOrEqual(25);
        expect(score.label).toBe("🔴 High Risk");
        expect(score.securityPoints).toBeLessThanOrEqual(-50);
        expect(score.dilutionPoints).toBe(-15);
    });

    it("should award healthy score to safe, verified tokens", () => {
        const mockSignals: any = {
            ownership: { available: true, renounced: true },
            liquidityLock: { available: true, v2TotalSecuredPercent: 95 },
            holderConcentration: { available: true, top10Percent: 15 },
            whaleActivity: { available: true, dominantSignal: "NEUTRAL" },
            securityChecks: {
                available: true,
                isHoneypot: false,
                buyTaxPercent: 0,
                sellTaxPercent: 0,
                isBlacklisted: false,
            },
            financialMetrics: {
                available: true,
                dilutionRisk: "LOW",
            },
        };

        const score = hitungRiskScore(mockSignals, { isPonziOrRugPull: false, sentimentScore: 8 });
        expect(score.total).toBeGreaterThanOrEqual(70);
        expect(score.label).toBe("🟢 Low Risk");
        expect(score.securityPoints).toBe(5);
        expect(score.dilutionPoints).toBe(5);
    });
});
