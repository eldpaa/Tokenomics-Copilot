import { describe, expect, it } from "bun:test";
import {
    BSC_MAINNET,
    OPBNB_MAINNET,
    SUPPORTED_CHAINS,
    SUPPORTED_CHAIN_LIST,
    DEFAULT_CHAIN_ID,
    toHexChainId,
    parseChainId,
    isSupportedChain,
    getChainConfig,
    getExplorerTokenUrl,
    getExplorerTxUrl
} from "../frontend1/src/lib/chains.ts";

describe("Multi-Chain Definitions (BSC & opBNB)", () => {
    it("should have correct BSC Mainnet configuration", () => {
        expect(BSC_MAINNET.id).toBe(56);
        expect(BSC_MAINNET.hexId).toBe("0x38");
        expect(BSC_MAINNET.shortName).toBe("BSC");
        expect(BSC_MAINNET.nativeCurrency.symbol).toBe("BNB");
        expect(BSC_MAINNET.blockExplorerUrls[0]).toBe("https://bscscan.com");
    });

    it("should have correct opBNB Mainnet configuration", () => {
        expect(OPBNB_MAINNET.id).toBe(204);
        expect(OPBNB_MAINNET.hexId).toBe("0xcc");
        expect(OPBNB_MAINNET.shortName).toBe("opBNB");
        expect(OPBNB_MAINNET.nativeCurrency.symbol).toBe("BNB");
        expect(OPBNB_MAINNET.blockExplorerUrls[0]).toBe("https://opbnbscan.com");
    });

    it("should accurately validate supported chains", () => {
        expect(isSupportedChain(56)).toBe(true);
        expect(isSupportedChain("0x38")).toBe(true);
        expect(isSupportedChain(204)).toBe(true);
        expect(isSupportedChain("0xcc")).toBe(true);

        // Unsupported chains
        expect(isSupportedChain(1)).toBe(false); // Ethereum
        expect(isSupportedChain(137)).toBe(false); // Polygon
        expect(isSupportedChain(null)).toBe(false);
        expect(isSupportedChain(undefined)).toBe(false);
    });

    it("should retrieve correct chain configuration", () => {
        const bsc = getChainConfig(56);
        expect(bsc?.name).toBe("BNB Smart Chain");

        const opbnb = getChainConfig("0xcc");
        expect(opbnb?.name).toBe("opBNB Mainnet");

        const unknown = getChainConfig(999999);
        expect(unknown).toBeNull();
    });

    it("should format explorer URLs dynamically per chain", () => {
        const dummyAddress = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82";
        const bscUrl = getExplorerTokenUrl(56, dummyAddress);
        expect(bscUrl).toBe(`https://bscscan.com/token/${dummyAddress}`);

        const opbnbUrl = getExplorerTokenUrl(204, dummyAddress);
        expect(opbnbUrl).toBe(`https://opbnbscan.com/token/${dummyAddress}`);

        const dummyTx = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        const bscTxUrl = getExplorerTxUrl(56, dummyTx);
        expect(bscTxUrl).toBe(`https://bscscan.com/tx/${dummyTx}`);

        const opbnbTxUrl = getExplorerTxUrl(204, dummyTx);
        expect(opbnbTxUrl).toBe(`https://opbnbscan.com/tx/${dummyTx}`);
    });

    it("should correctly convert decimal chainId to hex", () => {
        expect(toHexChainId(56)).toBe("0x38");
        expect(toHexChainId(204)).toBe("0xcc");
    });
});
