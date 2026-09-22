import { config } from "dotenv";
config();

import { Hono } from "hono";
import { cors } from "hono/cors";
import { isAddress, parseEther } from "viem";
import { verifyPaymentTransaction } from "./verification.ts";
import { daftarToken, auditSatuToken, muatProgress, muatTierList, jalankanBatchLengkap, simpanProgress } from "./core.ts";
import { addGroupMember } from "./greenfield.ts";

const app = new Hono();

// WAJIB buat frontend: tanpa ini, browser bakal block semua fetch() dari origin lain (CORS error).
// Ganti origin ke domain frontend production pas deploy, jangan biarin "*" kalau udah live.
app.use("*", cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "OPTIONS"],
}));

// Status batch job sederhana di memori (biar POST /audit/batch non-blocking)
let batchStatus: "idle" | "processing" | "done" | "error" = "idle";
let batchError: string | null = null;

app.get("/", (c) => c.json({ status: "ok", message: "Tokenomics Copilot API" }));

// GET /audit/:symbol — audit 1 token: cek cache batch-result.json dulu agar instan, atau live audit jika belum ada / fresh=true
app.get("/audit/:symbol", async (c) => {
    const symbol = c.req.param("symbol").toUpperCase();

    if (!daftarToken[symbol]) {
        return c.json(
            { error: `Token '${symbol}' tidak ada di database`, available: Object.keys(daftarToken) },
            404
        );
    }

    const forceFresh = c.req.query("fresh") === "true";

    // 1. Cek cache jika ada agar response instan (<15ms)
    if (!forceFresh) {
        const cachedResults = muatProgress();
        const found = cachedResults.find(
            (item) => item.symbol.toUpperCase() === symbol || item.tokenKey.toUpperCase() === symbol
        );
        if (found) {
            return c.json(found);
        }
    }

    // 2. Jalankan live audit on-chain + AI jika belum ada di cache atau diminta fresh
    try {
        const hasil = await auditSatuToken(symbol);
        
        // Simpan / update ke cache batch-result.json
        const currentProgress = muatProgress();
        const existingIdx = currentProgress.findIndex(
            (t) => t.symbol.toUpperCase() === symbol || t.tokenKey.toUpperCase() === symbol
        );
        if (existingIdx >= 0) {
            currentProgress[existingIdx] = hasil;
        } else {
            currentProgress.push(hasil);
        }
        simpanProgress(currentProgress);

        return c.json(hasil);
    } catch (err: any) {
        // Fallback jika live audit gagal tapi pernah ada di cache
        const cachedResults = muatProgress();
        const fallback = cachedResults.find(
            (item) => item.symbol.toUpperCase() === symbol || item.tokenKey.toUpperCase() === symbol
        );
        if (fallback) {
            return c.json(fallback);
        }
        return c.json({ error: err.message }, 500);
    }
});

// GET /results — return isi batch-result.json + tier list terakhir (buat frontend tanpa re-run)
app.get("/results", (c) => {
    const hasil = muatProgress();
    const { tierList, updatedAt } = muatTierList();
    return c.json({ count: hasil.length, results: hasil, tierList, tierListUpdatedAt: updatedAt });
});

// GET /results/status — cek progress batch job yang lagi jalan di background
app.get("/results/status", (c) => {
    const currentStatus = batchStatus;
    const currentError = batchError;
    // Reset ke "idle" setelah status "done" atau "error" dilaporkan agar bisa di-run ulang
    if (batchStatus === "done" || batchStatus === "error") {
        batchStatus = "idle";
        batchError = null;
    }
    return c.json({ status: currentStatus, error: currentError });
});

// POST /audit/batch — trigger batch run semua token di background (non-blocking, ~3-5 menit)
app.post("/audit/batch", async (c) => {
    if (batchStatus === "processing") {
        return c.json({ message: "Batch audit sedang berjalan, cek progress di GET /results/status" }, 409);
    }

    const body = await c.req.json().catch(() => ({}));
    const resume = body?.resume !== false;

    batchStatus = "processing";
    batchError = null;

    // Jalan di background — response langsung balik, jangan bikin frontend nunggu 3-5 menit.
    // Hasil (termasuk tier list) otomatis kesimpen ke file lewat jalankanBatchLengkap,
    // jadi GET /results bisa langsung ambil begitu status berubah jadi "done".
    (async () => {
        try {
            await jalankanBatchLengkap(resume);
            batchStatus = "done";
        } catch (err: any) {
            batchStatus = "error";
            batchError = err.message;
        }
    })();

    return c.json({ message: "Batch audit dimulai di background. Poll GET /results/status untuk progress, GET /results untuk hasil." });
});

app.post("/api/premium/unlock", async (c) => {
    try {
        const body = await c.req.json().catch(() => null);
        if (!body) {
            return c.json({ error: "Invalid JSON body" }, 400);
        }
        const { walletAddress, tokenSymbol, paymentTxHash, chainId } = body;
        
        if (!walletAddress || !tokenSymbol) {
            return c.json({ error: "walletAddress and tokenSymbol are required" }, 400);
        }

        if (!isAddress(walletAddress)) {
            return c.json({ error: "Invalid EVM wallet address format" }, 400);
        }

        // In real production: verify on-chain tx hash or NFT ownership here.
        // For hackathon prototype: check a required field 'paymentTxHash' is present.
        const TX_HASH_REGEX = /^0x[0-9a-fA-F]{64}$/;
        if (!paymentTxHash || typeof paymentTxHash !== 'string' || !TX_HASH_REGEX.test(paymentTxHash)) {
            return c.json({ error: "Invalid or missing paymentTxHash. Must be a valid 0x-prefixed 64-char hex transaction hash." }, 403);
        }
        
        const PROTOCOL_VAULT_ADDRESS = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";
        const MIN_AMOUNT = parseEther("0.001");
        
        const verification = await verifyPaymentTransaction(
            paymentTxHash,
            walletAddress,
            PROTOCOL_VAULT_ADDRESS,
            MIN_AMOUNT,
            chainId ? Number(chainId) : 56
        );
        
        if (!verification.valid) {
            return c.json({ error: verification.error || "Payment verification failed" }, 403);
        }
        
        await addGroupMember("vip-reports", walletAddress);
        
        return c.json({
            status: "success",
            message: "VIP Access Granted",
            walletAddress,
            tokenSymbol
        });
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

// POST /api/wallet/event — Log aktivitas & pergantian address wallet ke terminal server
app.post("/api/wallet/event", async (c) => {
    try {
        const body = await c.req.json().catch(() => null);
        if (!body) return c.json({ error: "Invalid body" }, 400);

        const { walletAddress, event, previousAddress } = body;
        const timestamp = new Date().toLocaleTimeString();

        if (event === "changed") {
            console.log(`[Wallet Terminal] 🔄 [${timestamp}] User Ganti Address: ${previousAddress || "unknown"} ➔ ${walletAddress}`);
        } else if (event === "connected") {
            console.log(`[Wallet Terminal] 🔌 [${timestamp}] Wallet Terhubung: ${walletAddress}`);
        } else if (event === "disconnected") {
            console.log(`[Wallet Terminal] ❌ [${timestamp}] Wallet Diputuskan: ${previousAddress || walletAddress}`);
        }

        return c.json({ status: "ok", received: { event, walletAddress } });
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

const port = Number(process.env.PORT) || 3000;

console.log(`🚀 Tokenomics Copilot API jalan di http://localhost:${port}`);

export default {
    port,
    idleTimeout: 255, // <--- TAMBAHIN BARIS INI BIAR GAK PUTUS 
    fetch: app.fetch,
};
