import { isAddress, createPublicClient, http, fallback, PublicClient } from "viem";
import { bsc, opBNB } from "viem/chains";
import fs from "fs";
import path from "path";

// Multi-Chain Clients
const bscClient = createPublicClient({
    chain: bsc,
    transport: fallback([
        http("https://bsc-dataseed.binance.org"),
        http("https://bsc-dataseed1.defibit.io"),
        http("https://rpc.ankr.com/bsc"),
        http("https://bsc-rpc.publicnode.com"),
    ]),
});

const opBnbClient = createPublicClient({
    chain: opBNB,
    transport: fallback([
        http("https://opbnb-mainnet-rpc.bnbchain.org"),
        http("https://opbnb.publicnode.com"),
    ]),
});

const clients: Record<number, PublicClient> = {
    56: bscClient,
    204: opBnbClient,
};

// Persistent Anti-Replay Store
const STORAGE_FILE = path.join(process.cwd(), "data", "used-payments.json");
let usedHashes = new Set<string>();

function loadUsedHashes() {
    try {
        const dir = path.dirname(STORAGE_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (fs.existsSync(STORAGE_FILE)) {
            const data = fs.readFileSync(STORAGE_FILE, "utf-8");
            const hashes: string[] = JSON.parse(data);
            usedHashes = new Set(hashes);
        }
    } catch (err) {
        console.error("Failed to load used hashes:", err);
    }
}

function saveUsedHash(hash: string) {
    usedHashes.add(hash.toLowerCase());
    try {
        const dir = path.dirname(STORAGE_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(Array.from(usedHashes), null, 2), "utf-8");
    } catch (err) {
        console.error("Failed to save used hashes:", err);
    }
}

// Initial load
loadUsedHashes();

export async function verifyPaymentTransaction(
    txHash: string,
    senderAddress: string,
    expectedVault: string,
    minAmountWei: bigint,
    chainId: number = 56
): Promise<{ valid: boolean; error?: string }> {
    if (!txHash || !txHash.startsWith("0x") || txHash.length !== 66) {
        return { valid: false, error: "Invalid transaction hash format." };
    }
    if (!isAddress(senderAddress) || !isAddress(expectedVault)) {
        return { valid: false, error: "Invalid sender or vault address." };
    }

    if (usedHashes.has(txHash.toLowerCase())) {
        return { valid: false, error: "Transaction hash already used (anti-replay)." };
    }

    const targetClient = clients[chainId] || clients[56];

    try {
        // Fix Race Condition: Wait for block confirmation
        const receipt = await targetClient.waitForTransactionReceipt({ 
            hash: txHash as `0x${string}`,
            timeout: 25_000 
        });
        
        if (!receipt) {
            return { valid: false, error: "Transaction receipt not found." };
        }
        if (receipt.status !== "success") {
            return { valid: false, error: "Transaction failed on-chain (reverted)." };
        }

        const tx = await targetClient.getTransaction({ hash: txHash as `0x${string}` });
        if (!tx) {
            return { valid: false, error: "Transaction details not found." };
        }

        if (tx.from.toLowerCase() !== senderAddress.toLowerCase()) {
            return { valid: false, error: "Transaction sender does not match requesting wallet." };
        }

        if (!tx.to || tx.to.toLowerCase() !== expectedVault.toLowerCase()) {
            return { valid: false, error: "Transaction recipient does not match protocol vault." };
        }

        if (tx.value < minAmountWei) {
            return { valid: false, error: "Transaction value is less than the required minimum." };
        }

        // Persist
        saveUsedHash(txHash);

        return { valid: true };
    } catch (err: any) {
        console.error("Verification error:", err);
        return { valid: false, error: `RPC Verification failed: ${err.message}` };
    }
}
