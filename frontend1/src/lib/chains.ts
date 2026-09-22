// src/lib/chains.ts

export interface ChainConfig {
    id: number;
    hexId: string;
    name: string;
    shortName: string;
    badge: string;
    color: string;
    bgGlow: string;
    borderGlow: string;
    subtitle: string;
    rpcUrls: string[];
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    blockExplorerUrls: string[];
}

export const BSC_MAINNET: ChainConfig = {
    id: 56,
    hexId: "0x38",
    name: "BNB Smart Chain",
    shortName: "BSC",
    badge: "🟡",
    color: "#F0B90B",
    bgGlow: "bg-amber-500/15",
    borderGlow: "border-amber-500/30",
    subtitle: "L1 Primary Hub",
    rpcUrls: [
        "https://bsc-dataseed.binance.org",
        "https://bsc-dataseed1.defibit.io",
        "https://rpc.ankr.com/bsc",
        "https://bsc-rpc.publicnode.com",
    ],
    nativeCurrency: {
        name: "BNB",
        symbol: "BNB",
        decimals: 18,
    },
    blockExplorerUrls: ["https://bscscan.com"],
};

export const OPBNB_MAINNET: ChainConfig = {
    id: 204,
    hexId: "0xcc",
    name: "opBNB Mainnet",
    shortName: "opBNB",
    badge: "🟢",
    color: "#00E599",
    bgGlow: "bg-emerald-500/15",
    borderGlow: "border-emerald-500/30",
    subtitle: "L2 Ultra-Low Gas",
    rpcUrls: [
        "https://opbnb-mainnet-rpc.bnbchain.org",
        "https://opbnb.publicnode.com",
    ],
    nativeCurrency: {
        name: "BNB",
        symbol: "BNB",
        decimals: 18,
    },
    blockExplorerUrls: ["https://opbnbscan.com"],
};

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
    56: BSC_MAINNET,
    204: OPBNB_MAINNET,
};

export const SUPPORTED_CHAIN_LIST: ChainConfig[] = [BSC_MAINNET, OPBNB_MAINNET];

export const DEFAULT_CHAIN_ID = 56;

export function toHexChainId(chainId: number): string {
    return `0x${chainId.toString(16)}`;
}

export function parseChainId(chainIdHexOrDec: string | number | null | undefined): number | null {
    if (!chainIdHexOrDec) return null;
    if (typeof chainIdHexOrDec === "number") return chainIdHexOrDec;
    if (typeof chainIdHexOrDec === "string") {
        return chainIdHexOrDec.startsWith("0x") ? parseInt(chainIdHexOrDec, 16) : parseInt(chainIdHexOrDec, 10);
    }
    return null;
}

export function isSupportedChain(chainId: number | string | null | undefined): boolean {
    const id = parseChainId(chainId);
    return id !== null && Boolean(SUPPORTED_CHAINS[id]);
}

export function getChainConfig(chainId: number | string | null | undefined): ChainConfig | null {
    const id = parseChainId(chainId);
    if (!id) return null;
    return SUPPORTED_CHAINS[id] || null;
}

export function getExplorerTokenUrl(chainId: number | null | undefined, tokenAddress: string): string {
    const config = getChainConfig(chainId) || BSC_MAINNET;
    const base = config.blockExplorerUrls[0];
    return `${base}/token/${tokenAddress}`;
}

export function getExplorerTxUrl(chainId: number | null | undefined, txHash: string): string {
    const config = getChainConfig(chainId) || BSC_MAINNET;
    const base = config.blockExplorerUrls[0];
    return `${base}/tx/${txHash}`;
}
