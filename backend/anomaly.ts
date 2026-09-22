import { createPublicClient, http, fallback, parseAbi, parseAbiItem } from "viem";
import { bsc } from "viem/chains";
import { retry } from "./utils.ts";

const client = createPublicClient({
    chain: bsc,
    transport: fallback([
        http("https://bsc-dataseed.binance.org"),
        http("https://bsc-dataseed1.defibit.io"),
        http("https://bsc-dataseed1.ninicoin.io"),
        http("https://rpc.ankr.com/bsc"),
        http("https://bsc-rpc.publicnode.com"),
    ]),
});

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
const BURN_ADDRESSES = [
    "0x000000000000000000000000000000000000dead",
    "0x0000000000000000000000000000000000000000",
];

// === LP LOCK: known locker contract addresses on BSC ===
// Unicrypt V2 Liquidity Locker (BSC)
// PinkLock (BSC)
// NOTE: verify these on bscscan if results look off — locker contracts sometimes migrate.
const KNOWN_LOCKERS: Record<string, string> = {
    "Unicrypt V2": "0xc765bddb93b0d1c1a88282ba0fa6b2d00e3e0c83",
    "PinkLock": "0x407993575c91ce7643a4d4ccacc9a98c36ee1bbe",
};

const PANCAKE_V2_FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const PANCAKE_V3_FACTORY = "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865";
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

// Whale detection: scan last N blocks
const WHALE_SCAN_BLOCKS = 500n; // ~1.5 menit BSC (blok ~3 detik)
const WHALE_THRESHOLD_PCT = 1.0;  // transfer >= 1% total supply = whale

const ownableAbi = parseAbi(["function owner() view returns (address)"]);
const v2FactoryAbi = parseAbi(["function getPair(address tokenA, address tokenB) view returns (address pair)"]);
const v3FactoryAbi = parseAbi(["function getPool(address tokenA, address tokenB, uint24 fee) view returns (address pool)"]);
const pairAbi = parseAbi([
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
]);
const transferEventAbi = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");

// ============================================================
// 1. OWNERSHIP CHECK
// ============================================================
export type OwnershipCheck = {
    available: boolean;
    renounced: boolean | null;
    ownerAddress: string | null;
    note: string;
};

export async function checkOwnershipRenounced(tokenAddress: string): Promise<OwnershipCheck> {
    try {
        const owner = await retry(() =>
            client.readContract({ address: tokenAddress as `0x${string}`, abi: ownableAbi, functionName: "owner" })
        );
        const ownerLower = owner.toLowerCase();
        const renounced = ownerLower === NULL_ADDRESS || BURN_ADDRESSES.includes(ownerLower);
        return {
            available: true,
            renounced,
            ownerAddress: owner,
            note: renounced
                ? "Ownership sudah di-renounce — tidak ada admin backdoor aktif."
                : `Ownership masih dipegang: ${owner} — ada risiko admin function (mint, blacklist, dll) disalahgunakan.`,
        };
    } catch {
        return {
            available: false,
            renounced: null,
            ownerAddress: null,
            note: "Kontrak tidak mengekspos owner() standar (bukan pola Ownable, atau custom access control).",
        };
    }
}

// ============================================================
// 2. LIQUIDITY LOCK CHECK — V2 burn + known lockers + V3 pool existence
// ============================================================
export type LiquidityLockCheck = {
    available: boolean;
    pairFound: boolean;
    v2BurnedPercent: number | null;
    v2LockedPercent: number | null;  // via known locker contracts
    v2TotalSecuredPercent: number | null; // burned + locked
    v3PoolFound: boolean;
    note: string;
};

export async function checkLiquidityLock(tokenAddress: string): Promise<LiquidityLockCheck> {
    // --- V2 pair ---
    let v2Pair: string | null = null;
    try {
        const pair = await retry(() =>
            client.readContract({
                address: PANCAKE_V2_FACTORY as `0x${string}`,
                abi: v2FactoryAbi,
                functionName: "getPair",
                args: [tokenAddress as `0x${string}`, WBNB as `0x${string}`],
            })
        );
        if (pair && pair.toLowerCase() !== NULL_ADDRESS) v2Pair = pair;
    } catch { }

    // --- V3 pool existence check (fee tiers: 100, 500, 2500, 10000) ---
    let v3PoolFound = false;
    const v3Fees = [100, 500, 2500, 10000];
    for (const fee of v3Fees) {
        try {
            const pool = await retry(() =>
                client.readContract({
                    address: PANCAKE_V3_FACTORY as `0x${string}`,
                    abi: v3FactoryAbi,
                    functionName: "getPool",
                    args: [tokenAddress as `0x${string}`, WBNB as `0x${string}`, fee],
                })
            );
            if (pool && pool.toLowerCase() !== NULL_ADDRESS) { v3PoolFound = true; break; }
        } catch { }
    }

    if (!v2Pair) {
        return {
            available: v3PoolFound,
            pairFound: false,
            v2BurnedPercent: null,
            v2LockedPercent: null,
            v2TotalSecuredPercent: null,
            v3PoolFound,
            note: v3PoolFound
                ? "Pair V2 tidak ditemukan tapi V3 pool ada — likuiditas di PancakeSwap V3, LP lock V2 tidak berlaku."
                : "Tidak ada pair V2 maupun V3 pool WBNB ditemukan — likuiditas mungkin di pair lain atau tidak ada.",
        };
    }

    // --- V2 burn check ---
    let totalSupplyLP = 0n;
    let burnedBalance = 0n;
    let lockedBalance = 0n;

    try {
        totalSupplyLP = await retry(() =>
            client.readContract({ address: v2Pair as `0x${string}`, abi: pairAbi, functionName: "totalSupply" })
        );

        for (const burnAddr of BURN_ADDRESSES) {
            const bal = await retry(() =>
                client.readContract({ address: v2Pair as `0x${string}`, abi: pairAbi, functionName: "balanceOf", args: [burnAddr as `0x${string}`] })
            );
            burnedBalance += bal;
        }

        // --- Known locker contracts ---
        for (const [, lockerAddr] of Object.entries(KNOWN_LOCKERS)) {
            try {
                const bal = await retry(() =>
                    client.readContract({ address: v2Pair as `0x${string}`, abi: pairAbi, functionName: "balanceOf", args: [lockerAddr as `0x${string}`] })
                );
                lockedBalance += bal;
            } catch { }
        }
    } catch (err: any) {
        return { available: false, pairFound: true, v2BurnedPercent: null, v2LockedPercent: null, v2TotalSecuredPercent: null, v3PoolFound, note: `Gagal baca LP contract: ${err.message}` };
    }

    const toPercent = (val: bigint) => totalSupplyLP > 0n ? Number((val * 10000n) / totalSupplyLP) / 100 : 0;
    const burnedPct = toPercent(burnedBalance);
    const lockedPct = toPercent(lockedBalance);
    const totalSecured = burnedPct + lockedPct;

    const riskLevel = totalSecured >= 80 ? "AMAN" : totalSecured >= 50 ? "SEBAGIAN" : "RISIKO TINGGI";
    const note = `V2 LP: ${burnedPct.toFixed(1)}% burned + ${lockedPct.toFixed(1)}% locked di locker kontrak = ${totalSecured.toFixed(1)}% total diamankan [${riskLevel}].${v3PoolFound ? " V3 pool juga ditemukan." : ""}`;

    return {
        available: true,
        pairFound: true,
        v2BurnedPercent: burnedPct,
        v2LockedPercent: lockedPct,
        v2TotalSecuredPercent: totalSecured,
        v3PoolFound,
        note,
    };
}

// ============================================================
// 3. HOLDER CONCENTRATION — BscScan API (tetap, free tier fallback)
// ============================================================
export type HolderConcentrationCheck = {
    available: boolean;
    top10Percent: number | null;
    totalHolders: number | null;
    note: string;
};

export async function checkHolderConcentration(tokenAddress: string, totalSupplyRaw: bigint): Promise<HolderConcentrationCheck> {
    const apiKey = process.env.BSCSCAN_API_KEY;
    if (!apiKey) return { available: false, top10Percent: null, totalHolders: null, note: "BSCSCAN_API_KEY tidak diset di .env." };

    try {
        let totalHolders: number | null = null;
        try {
            // Coba fetch Total Holders dari GoPlus Security API
            const goPlusRes = await fetch(`https://api.gopluslabs.io/api/v1/token_security/56?contract_addresses=${tokenAddress}`);
            const goPlusData = await goPlusRes.json();
            const tokenSec = goPlusData?.result?.[tokenAddress.toLowerCase()];
            if (tokenSec?.holder_count) {
                totalHolders = parseInt(tokenSec.holder_count, 10);
            }
        } catch (e) {
            console.error("Gagal fetch GoPlus holder_count:", e);
        }

        const url = `https://api.bscscan.com/api?module=token&action=tokenholderlist&contractaddress=${tokenAddress}&page=1&offset=10&apikey=${apiKey}`;
        const response = await retry(() => fetch(url));
        const data: any = await response.json();

        if (data.status !== "1" || !Array.isArray(data.result)) {
            return { available: false, top10Percent: null, totalHolders, note: `Holder list tidak tersedia — butuh BscScan API tier Pro. Response: ${data.message || JSON.stringify(data.result)}` };
        }

        const top10Total = data.result.reduce((sum: bigint, holder: any) => sum + BigInt(holder.TokenHolderQuantity), 0n);
        const percent = totalSupplyRaw > 0n ? Number((top10Total * 10000n) / totalSupplyRaw) / 100 : 0;

        return {
            available: true,
            top10Percent: percent,
            totalHolders,
            note: percent > 50
                ? `Top 10 holder menguasai ${percent.toFixed(1)}% total supply — risiko whale dump sangat tinggi.`
                : `Top 10 holder cuma ${percent.toFixed(1)}% total supply — distribusi relatif sehat.`,
        };
    } catch (err: any) {
        return { available: false, top10Percent: null, totalHolders: null, note: `Gagal cek holder concentration: ${err.message}` };
    }
}

// ============================================================
// 4. WHALE SIGNAL — scan Transfer events 500 block terakhir
// ============================================================
export type WhaleSignal = {
    address: string;
    netFlow: bigint;     // positif = accumulate, negatif = dump
    netFlowPct: number;  // relatif ke total supply
    signal: "DUMP" | "ACCUMULATE";
    txCount: number;
};

export type WhaleDetectionCheck = {
    available: boolean;
    blocksScanned: number;
    largeTransferCount: number;
    topSignals: WhaleSignal[];
    dominantSignal: "DUMP_PRESSURE" | "ACCUMULATION" | "NEUTRAL" | "UNAVAILABLE";
    note: string;
};

export async function checkWhaleActivity(tokenAddress: string, totalSupplyRaw: bigint): Promise<WhaleDetectionCheck> {
    try {
        const latestBlock = await client.getBlockNumber();
        const fromBlock = latestBlock - WHALE_SCAN_BLOCKS;
        const thresholdWei = (totalSupplyRaw * BigInt(Math.floor(WHALE_THRESHOLD_PCT * 100))) / 10000n;

        const logs = await retry(() =>
            client.getLogs({
                address: tokenAddress as `0x${string}`,
                event: transferEventAbi,
                fromBlock,
                toBlock: latestBlock,
            })
        );

        if (!logs || logs.length === 0) {
            return { available: true, blocksScanned: Number(WHALE_SCAN_BLOCKS), largeTransferCount: 0, topSignals: [], dominantSignal: "NEUTRAL", note: `Tidak ada Transfer event dalam ${WHALE_SCAN_BLOCKS} block terakhir — aktivitas on-chain sangat rendah.` };
        }

        // Hitung net flow per address
        const netFlowMap = new Map<string, { net: bigint; txCount: number }>();

        for (const log of logs) {
            const { from, to, value } = log.args as { from: string; to: string; value: bigint };
            if (!from || !to || value === undefined) continue;
            if (value < thresholdWei) continue; // hanya track transfer >= threshold

            const fromLow = from.toLowerCase();
            const toLow = to.toLowerCase();

            if (!BURN_ADDRESSES.includes(fromLow) && fromLow !== NULL_ADDRESS) {
                const cur = netFlowMap.get(fromLow) ?? { net: 0n, txCount: 0 };
                netFlowMap.set(fromLow, { net: cur.net - value, txCount: cur.txCount + 1 });
            }
            if (!BURN_ADDRESSES.includes(toLow) && toLow !== NULL_ADDRESS) {
                const cur = netFlowMap.get(toLow) ?? { net: 0n, txCount: 0 };
                netFlowMap.set(toLow, { net: cur.net + value, txCount: cur.txCount + 1 });
            }
        }

        // Sort by absolute net flow, ambil top 5
        const sorted = [...netFlowMap.entries()]
            .sort((a, b) => (b[1].net < 0n ? -b[1].net : b[1].net) > (a[1].net < 0n ? -a[1].net : a[1].net) ? 1 : -1)
            .slice(0, 5);

        const topSignals: WhaleSignal[] = sorted.map(([address, { net, txCount }]) => ({
            address,
            netFlow: net,
            netFlowPct: totalSupplyRaw > 0n ? Number((net < 0n ? -net : net) * 10000n / totalSupplyRaw) / 100 : 0,
            signal: net < 0n ? "DUMP" : "ACCUMULATE",
            txCount,
        }));

        const dumpCount = topSignals.filter(s => s.signal === "DUMP").length;
        const accumCount = topSignals.filter(s => s.signal === "ACCUMULATE").length;
        const dominantSignal = topSignals.length === 0 ? "NEUTRAL" : dumpCount > accumCount ? "DUMP_PRESSURE" : accumCount > dumpCount ? "ACCUMULATION" : "NEUTRAL";

        const largeTransferCount = [...netFlowMap.values()].reduce((sum, v) => sum + v.txCount, 0);
        const note = topSignals.length === 0
            ? `Tidak ada whale activity (transfer ≥${WHALE_THRESHOLD_PCT}% supply) dalam ${WHALE_SCAN_BLOCKS} block terakhir.`
            : `${largeTransferCount} large transfer terdeteksi dalam ${WHALE_SCAN_BLOCKS} block terakhir. Sinyal dominan: ${dominantSignal}.`;

        return { available: true, blocksScanned: Number(WHALE_SCAN_BLOCKS), largeTransferCount, topSignals, dominantSignal, note };

    } catch (err: any) {
        return { available: false, blocksScanned: 0, largeTransferCount: 0, topSignals: [], dominantSignal: "UNAVAILABLE", note: `Gagal scan whale activity: ${err.message}` };
    }
}

// ============================================================
// 5. TOKEN SECURITY (GoPlus Labs API) — Honeypot, Taxes, Blacklist
// ============================================================
export type TokenSecurityCheck = {
    available: boolean;
    isHoneypot: boolean | null;
    buyTaxPercent: number | null;
    sellTaxPercent: number | null;
    isBlacklisted: boolean | null;
    isMintable: boolean | null;
    canTakeBackOwnership: boolean | null;
    isOpenSource: boolean | null;
    note: string;
};

export async function checkTokenSecurity(tokenAddress: string): Promise<TokenSecurityCheck> {
    try {
        const url = `https://api.gopluslabs.io/api/v1/token_security/56?contract_addresses=${tokenAddress}`;
        const res = await retry(() => fetch(url), 3, 2000);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: any = await res.json();
        const tokenSec = data?.result?.[tokenAddress.toLowerCase()];

        if (!tokenSec) {
            return {
                available: false,
                isHoneypot: null,
                buyTaxPercent: null,
                sellTaxPercent: null,
                isBlacklisted: null,
                isMintable: null,
                canTakeBackOwnership: null,
                isOpenSource: null,
                note: "Data GoPlus Security tidak tersedia untuk token ini.",
            };
        }

        const isHoneypot = tokenSec.is_honeypot === "1";
        
        const parseTax = (val: any): number | null => {
            if (val === undefined || val === null || val === "") return null;
            const num = parseFloat(val);
            if (isNaN(num)) return null;
            return num > 0 && num <= 1 ? Number((num * 100).toFixed(2)) : Number(num.toFixed(2));
        };

        const buyTaxPercent = parseTax(tokenSec.buy_tax);
        const sellTaxPercent = parseTax(tokenSec.sell_tax);
        const isBlacklisted = tokenSec.is_blacklisted === "1";
        const isMintable = tokenSec.is_mintable === "1";
        const canTakeBackOwnership = tokenSec.can_take_back_ownership === "1";
        const isOpenSource = tokenSec.is_open_source === "1";

        let note = "";
        if (isHoneypot) {
            note = "KRITIKAL: Token terdeteksi HONEYPOT! Pembeli tidak dapat menjual token kembali di DEX.";
        } else {
            const taxDesc = `Pajak: ${buyTaxPercent ?? 0}% Beli / ${sellTaxPercent ?? 0}% Jual.`;
            const blDesc = isBlacklisted ? " PERINGATAN: Fungsi Blacklist aktif!" : " Bebas Blacklist.";
            const mintDesc = isMintable ? " Kontrak dapat mencetak suplai baru (Mintable)." : "";
            note = `Honeypot Scanner: Lulus (Tradeable). ${taxDesc}${blDesc}${mintDesc}`;
        }

        return {
            available: true,
            isHoneypot,
            buyTaxPercent,
            sellTaxPercent,
            isBlacklisted,
            isMintable,
            canTakeBackOwnership,
            isOpenSource,
            note,
        };
    } catch (err: any) {
        return {
            available: false,
            isHoneypot: null,
            buyTaxPercent: null,
            sellTaxPercent: null,
            isBlacklisted: null,
            isMintable: null,
            canTakeBackOwnership: null,
            isOpenSource: null,
            note: `Gagal membaca GoPlus Security API: ${err.message}`,
        };
    }
}

// ============================================================
// 6. TOKENOMICS FINANCIAL METRICS (DexScreener API) — FDV, MCap, Dilution
// ============================================================
export type TokenFinancialMetrics = {
    available: boolean;
    priceUsd: number | null;
    marketCapUsd: number | null;
    fdvUsd: number | null;
    circulatingSupply: number | null;
    dilutionRatio: number | null;
    dilutionRisk: "LOW" | "MODERATE" | "HIGH" | "UNAVAILABLE";
    liquidityUsd: number | null;
    pairAddress: string | null;
    dexName: string | null;
    note: string;
};

export async function checkFinancialMetrics(
    tokenAddress: string,
    totalSupplyFormatted: string
): Promise<TokenFinancialMetrics> {
    try {
        const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
        const res = await retry(() => fetch(url), 3, 2000);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: any = await res.json();
        const pairs: any[] = data?.pairs || [];

        if (pairs.length === 0) {
            return {
                available: false,
                priceUsd: null,
                marketCapUsd: null,
                fdvUsd: null,
                circulatingSupply: null,
                dilutionRatio: null,
                dilutionRisk: "UNAVAILABLE",
                liquidityUsd: null,
                pairAddress: null,
                dexName: null,
                note: "Tidak ditemukan pair likuiditas DEX untuk token ini.",
            };
        }

        // Filter pair chainId bsc jika ada, jika tidak pakai pair yang ada
        const bscPairs = pairs.filter((p) => p.chainId === "bsc");
        const candidates = bscPairs.length > 0 ? bscPairs : pairs;
        candidates.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        const topPair = candidates[0];

        const priceUsd = topPair.priceUsd ? parseFloat(topPair.priceUsd) : null;
        const fdvUsd = topPair.fdv ? Number(topPair.fdv) : null;
        const marketCapUsd = topPair.marketCap ? Number(topPair.marketCap) : null;
        const liquidityUsd = topPair.liquidity?.usd ? Number(topPair.liquidity.usd) : null;
        const pairAddress = topPair.pairAddress || null;
        const dexName = topPair.dexId || null;

        const totalSupplyNum = parseFloat(totalSupplyFormatted.replace(/,/g, ""));
        let circulatingSupply: number | null = null;
        let dilutionRatio: number | null = null;

        if (marketCapUsd && priceUsd && priceUsd > 0) {
            circulatingSupply = marketCapUsd / priceUsd;
        }

        if (circulatingSupply && !isNaN(totalSupplyNum) && totalSupplyNum > 0) {
            dilutionRatio = Math.min(100, Math.max(0, (circulatingSupply / totalSupplyNum) * 100));
        } else if (marketCapUsd && fdvUsd && fdvUsd > 0) {
            dilutionRatio = Math.min(100, Math.max(0, (marketCapUsd / fdvUsd) * 100));
        }

        let dilutionRisk: "LOW" | "MODERATE" | "HIGH" | "UNAVAILABLE" = "UNAVAILABLE";
        let note = "";

        if (dilutionRatio !== null) {
            if (dilutionRatio >= 70) {
                dilutionRisk = "LOW";
                note = `Sirkulasi sehat: ${dilutionRatio.toFixed(1)}% total suplai telah beredar di pasar.`;
            } else if (dilutionRatio >= 30) {
                dilutionRisk = "MODERATE";
                note = `Sirkulasi moderat: ${dilutionRatio.toFixed(1)}% total suplai beredar (perhatikan potensi unlock).`;
            } else {
                dilutionRisk = "HIGH";
                note = `Peringatan: Sirkulasi baru ${dilutionRatio.toFixed(1)}% dari total supply. Risiko dilusi/dump unlock sangat tinggi (Low Float, High FDV)!`;
            }
        } else {
            note = "Metrik rasio dilusi tidak dapat dihitung karena keterbatasan data Market Cap / FDV.";
        }

        return {
            available: true,
            priceUsd,
            marketCapUsd,
            fdvUsd,
            circulatingSupply,
            dilutionRatio,
            dilutionRisk,
            liquidityUsd,
            pairAddress,
            dexName,
            note,
        };
    } catch (err: any) {
        return {
            available: false,
            priceUsd: null,
            marketCapUsd: null,
            fdvUsd: null,
            circulatingSupply: null,
            dilutionRatio: null,
            dilutionRisk: "UNAVAILABLE",
            liquidityUsd: null,
            pairAddress: null,
            dexName: null,
            note: `Gagal membaca DexScreener API: ${err.message}`,
        };
    }
}

// ============================================================
// AGGREGATE + FORMAT
// ============================================================
export type AnomalySignals = {
    ownership: OwnershipCheck;
    liquidityLock: LiquidityLockCheck;
    holderConcentration: HolderConcentrationCheck;
    whaleActivity: WhaleDetectionCheck;
    securityChecks: TokenSecurityCheck;
    financialMetrics: TokenFinancialMetrics;
};

export async function jalankanSemuaAnomalyCheck(
    tokenAddress: string,
    totalSupplyRaw: bigint,
    totalSupplyFormatted?: string
): Promise<AnomalySignals> {
    // whale scan jalan terakhir (butuh block number); sisanya paralel
    const [ownership, liquidityLock, holderConcentration, securityChecks, financialMetrics] = await Promise.all([
        checkOwnershipRenounced(tokenAddress),
        checkLiquidityLock(tokenAddress),
        checkHolderConcentration(tokenAddress, totalSupplyRaw),
        checkTokenSecurity(tokenAddress),
        checkFinancialMetrics(tokenAddress, totalSupplyFormatted || "0"),
    ]);
    const whaleActivity = await checkWhaleActivity(tokenAddress, totalSupplyRaw);
    return { ownership, liquidityLock, holderConcentration, whaleActivity, securityChecks, financialMetrics };
}

export function formatAnomalySignalsForPrompt(signals: AnomalySignals): string {
    const lp = signals.liquidityLock;
    const lpSummary = lp.available
        ? `burned=${lp.v2BurnedPercent?.toFixed(1)}%, locker=${lp.v2LockedPercent?.toFixed(1)}%, total_secured=${lp.v2TotalSecuredPercent?.toFixed(1)}%${lp.v3PoolFound ? ", V3 pool detected" : ""}`
        : "UNVERIFIABLE";

    const whale = signals.whaleActivity;
    const whaleSummary = whale.available
        ? `${whale.dominantSignal} — ${whale.note}${whale.topSignals.length > 0 ? ` Top wallet: ${whale.topSignals[0]?.address?.slice(0, 10)}... (${whale.topSignals[0]?.signal}, ${whale.topSignals[0]?.netFlowPct?.toFixed(2)}% supply)` : ""}`
        : "UNVERIFIABLE";

    const sec = signals.securityChecks;
    const secSummary = sec?.available
        ? `Honeypot=${sec.isHoneypot ? "YES (CRITICAL / CANNOT SELL)" : "NO (Tradeable)"}, BuyTax=${sec.buyTaxPercent ?? 0}%, SellTax=${sec.sellTaxPercent ?? 0}%, Blacklist=${sec.isBlacklisted ? "YES" : "NO"}${sec.isMintable ? ", Mintable=YES" : ""}`
        : "UNVERIFIABLE";

    const fin = signals.financialMetrics;
    const finSummary = fin?.available
        ? `Price=$${fin.priceUsd ?? "N/A"}, MCap=$${fin.marketCapUsd ? fin.marketCapUsd.toLocaleString("en-US") : "N/A"}, FDV=$${fin.fdvUsd ? fin.fdvUsd.toLocaleString("en-US") : "N/A"}, DilutionRatio=${fin.dilutionRatio !== null ? `${fin.dilutionRatio.toFixed(1)}%` : "N/A"} (${fin.dilutionRisk})`
        : "UNAVAILABLE";

    return [
        `- Honeypot & Tax Security: ${secSummary} - ${sec?.note || ""}`,
        `- Ownership Renounced: ${signals.ownership.available ? (signals.ownership.renounced ? "YES" : "NO") : "UNVERIFIABLE"} - ${signals.ownership.note}`,
        `- LP Lock (V2+Locker): ${lpSummary} - ${lp.note}`,
        `- Total Holders: ${signals.holderConcentration.totalHolders !== null ? signals.holderConcentration.totalHolders.toLocaleString('en-US') : "UNVERIFIABLE"}`,
        `- Holder Concentration (Top 10): ${signals.holderConcentration.available ? `${signals.holderConcentration.top10Percent?.toFixed(1)}%` : "UNVERIFIABLE"} - ${signals.holderConcentration.note}`,
        `- Whale Activity (${whale.blocksScanned} blocks): ${whaleSummary}`,
        `- Market Valuation & Dilution Float: ${finSummary} - ${fin?.note || ""}`,
    ].join("\n");
}