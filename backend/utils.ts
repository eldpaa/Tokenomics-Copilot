export const jeda = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper generik — dipake buat RPC call, fetch whitepaper, Gemini call, dan on-chain anomaly checks.
export async function retry<T>(fn: () => Promise<T>, tries = 4, delayMs = 5000): Promise<T> {
    let lastErr: unknown;
    for (let i = 0; i < tries; i++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;
            if (i < tries - 1) {
                console.log(`   ⚠️  Retry ${i + 1}/${tries - 1} setelah error: ${(err as Error).message}`);
                await jeda(delayMs);
            }
        }
    }
    throw lastErr;
}