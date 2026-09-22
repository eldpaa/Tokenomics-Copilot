import type { AuditResult, BatchStatus } from "./types";

const API_URL = "http://localhost:3000";

export const api = {
    getAudit: async (symbol: string): Promise<AuditResult> => {
        const res = await fetch(`${API_URL}/audit/${symbol.toUpperCase()}`);
        if (!res.ok) throw new Error(`Failed to fetch data for ${symbol}`);
        return res.json();
    },

    getResults: async (): Promise<{ count: number; results: AuditResult[]; tierList: string | null; tierListUpdatedAt: string | null }> => {
        const res = await fetch(`${API_URL}/results`);
        if (!res.ok) throw new Error("Failed to fetch batch audit results");
        return res.json();
    },

    startBatchAudit: async (resume = true): Promise<void> => {
        const res = await fetch(`${API_URL}/audit/batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resume }),
        });
        if (!res.ok) throw new Error("Failed to start batch audit");
    },

    getBatchStatus: async (): Promise<BatchStatus> => {
        const res = await fetch(`${API_URL}/results/status`);
        if (!res.ok) throw new Error("Failed to fetch progress status");
        return res.json();
    },

    unlockPremium: async (walletAddress: string, tokenSymbol: string, paymentTxHash: string, chainId?: number) => {
        const res = await fetch(`${API_URL}/api/premium/unlock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress, tokenSymbol, paymentTxHash, chainId }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Unlock failed" }));
            throw new Error(err.error || "Unlock failed");
        }
        return res.json();
    },

    logWalletEvent: async (event: "connected" | "changed" | "disconnected", walletAddress: string, previousAddress?: string) => {
        try {
            await fetch(`${API_URL}/api/wallet/event`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event, walletAddress, previousAddress }),
            });
        } catch {
            // Non-blocking telemetry
        }
    }
};