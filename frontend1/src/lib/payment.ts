export const PROTOCOL_VAULT_ADDRESS = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";
export const MICROPAYMENT_AMOUNT_BNB = "0.001";
export const MICROPAYMENT_AMOUNT_WEI = BigInt("1000000000000000"); // 0.001 BNB in Wei

export type PaymentState = "idle" | "requesting_signature" | "confirming_tx" | "granted" | "error";

/**
 * Dispatch real native BNB micro-payment via connected Web3 wallet.
 */
export async function sendMicroPayment(fromAddress: string): Promise<string> {
    if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No Web3 wallet detected. Please install MetaMask or Trust Wallet.");
    }

    try {
        const hexValue = "0x" + MICROPAYMENT_AMOUNT_WEI.toString(16);
        const txHash = await window.ethereum.request({
            method: "eth_sendTransaction",
            params: [
                {
                    from: fromAddress,
                    to: PROTOCOL_VAULT_ADDRESS,
                    value: hexValue,
                },
            ],
        });

        if (!txHash || typeof txHash !== "string") {
            throw new Error("Wallet did not return a valid transaction hash.");
        }

        return txHash;
    } catch (err: any) {
        // EIP-1193 user rejection code 4001
        if (err?.code === 4001 || err?.message?.toLowerCase().includes("user rejected") || err?.message?.toLowerCase().includes("denied")) {
            throw new Error("Transaction signature was rejected by user in wallet.");
        }
        if (err?.message?.toLowerCase().includes("insufficient funds") || err?.code === -32000) {
            throw new Error("Insufficient BNB balance to pay 0.001 BNB + gas.");
        }
        throw new Error(err?.message || "Payment transaction failed.");
    }
}
