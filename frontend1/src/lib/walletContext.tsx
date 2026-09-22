import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
    SUPPORTED_CHAINS,
    DEFAULT_CHAIN_ID,
    getChainConfig,
    isSupportedChain,
    parseChainId,
    type ChainConfig
} from "@/lib/chains";

declare global {
    interface Window {
        ethereum?: any;
    }
}

interface WalletContextType {
    walletAddress: string;
    walletConnected: boolean;
    isConnecting: boolean;
    walletBalance: string;
    justConnected: boolean;
    showNoWalletAlert: boolean;
    setShowNoWalletAlert: (show: boolean) => void;
    connectionFailed: boolean;
    connectionErrorMsg: string;
    // Multi-chain state
    chainId: number | null;
    activeChain: ChainConfig | null;
    isUnsupportedChain: boolean;
    isSwitchingChain: boolean;
    connectWallet: () => Promise<boolean>;
    connectDemoWallet: () => boolean;
    disconnectWallet: () => void;
    toggleWallet: () => Promise<void>;
    switchNetwork: (targetChainId: number) => Promise<boolean>;
    formatAddress: (addr: string) => string;
}

const getEthereumProvider = () => {
    if (typeof window === "undefined") return undefined;
    const eth = window.ethereum;
    if (!eth) {
        return (window as any).trustwallet || (window as any).binance || undefined;
    }
    if (Array.isArray(eth.providers) && eth.providers.length > 0) {
        const metamask = eth.providers.find((p: any) => p.isMetaMask);
        return metamask || eth.providers[0];
    }
    return eth;
};

const safeGetSession = (key: string): string => {
    try {
        if (typeof window !== "undefined" && window.sessionStorage) {
            return window.sessionStorage.getItem(key) || "";
        }
    } catch {
        // storage restricted or blocked
    }
    return "";
};

const safeSetSession = (key: string, value: string) => {
    try {
        if (typeof window !== "undefined" && window.sessionStorage) {
            window.sessionStorage.setItem(key, value);
        }
    } catch {
        // ignore
    }
};

const safeRemoveSession = (key: string) => {
    try {
        if (typeof window !== "undefined" && window.sessionStorage) {
            window.sessionStorage.removeItem(key);
        }
    } catch {
        // ignore
    }
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [walletAddress, setWalletAddress] = useState<string>(() => safeGetSession("walletAddress"));
    const [walletConnected, setWalletConnected] = useState<boolean>(() => Boolean(safeGetSession("walletAddress")));
    const [isConnecting, setIsConnecting] = useState(false);
    const [walletBalance, setWalletBalance] = useState("0.00 BNB");
    const [justConnected, setJustConnected] = useState(false);
    const [showNoWalletAlert, setShowNoWalletAlert] = useState(false);
    const [connectionFailed, setConnectionFailed] = useState(false);
    const [connectionErrorMsg, setConnectionErrorMsg] = useState("No Wallet Detected");

    // Multi-Chain State
    const [chainId, setChainId] = useState<number | null>(DEFAULT_CHAIN_ID);
    const [activeChain, setActiveChain] = useState<ChainConfig | null>(() => getChainConfig(DEFAULT_CHAIN_ID));
    const [isUnsupportedChain, setIsUnsupportedChain] = useState(false);
    const [isSwitchingChain, setIsSwitchingChain] = useState(false);

    const formatAddress = (address: string) => {
        if (!address) return "";
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    const fetchBalance = useCallback(async (address: string) => {
        const provider = getEthereumProvider();
        if (provider) {
            try {
                const balanceHex = await provider.request({
                    method: "eth_getBalance",
                    params: [address, "latest"]
                });
                if (balanceHex) {
                    const balanceInWei = BigInt(balanceHex);
                    const whole = balanceInWei / 1000000000000000000n;
                    const remainder = balanceInWei % 1000000000000000000n;
                    const decimals = (Number(remainder / 100000000000000n) / 10000).toFixed(4).slice(2);
                    setWalletBalance(`${whole}.${decimals} BNB`);
                } else {
                    setWalletBalance("0.00 BNB");
                }
            } catch (err) {
                console.warn("Failed to fetch balance", err);
                setWalletBalance("0.00 BNB");
            }
        }
    }, []);

    const fetchChainId = useCallback(async () => {
        const provider = getEthereumProvider();
        if (provider) {
            try {
                const chainIdHex = await provider.request({ method: "eth_chainId" });
                const id = parseChainId(chainIdHex);
                if (id !== null) {
                    setChainId(id);
                    setActiveChain(getChainConfig(id));
                    setIsUnsupportedChain(!isSupportedChain(id));
                }
            } catch (err) {
                console.warn("Failed to read eth_chainId", err);
            }
        }
    }, []);

    // Sync balance and chain on initial load
    useEffect(() => {
        if (walletConnected && walletAddress) {
            fetchBalance(walletAddress);
        }
        fetchChainId();
    }, [walletConnected, walletAddress, fetchBalance, fetchChainId]);

    // Handle account change & chain change events from wallet provider
    useEffect(() => {
        if (typeof window !== "undefined" && window.ethereum) {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length === 0) {
                    const prev = walletAddress;
                    setWalletConnected(false);
                    setWalletAddress("");
                    safeRemoveSession("walletAddress");
                    api.logWalletEvent("disconnected", "", prev);
                } else if (!walletAddress || accounts[0].toLowerCase() !== walletAddress.toLowerCase()) {
                    const prev = walletAddress;
                    const newAccount = accounts[0];
                    setWalletAddress(newAccount);
                    setWalletConnected(true);
                    safeSetSession("walletAddress", newAccount);
                    fetchBalance(newAccount);
                    fetchChainId();
                    api.logWalletEvent("changed", newAccount, prev);
                }
            };

            const handleChainChanged = (newChainIdHex: string) => {
                const id = parseChainId(newChainIdHex);
                if (id !== null) {
                    setChainId(id);
                    setActiveChain(getChainConfig(id));
                    setIsUnsupportedChain(!isSupportedChain(id));
                }
                if (walletAddress) fetchBalance(walletAddress);
            };

            window.ethereum.on?.("accountsChanged", handleAccountsChanged);
            window.ethereum.on?.("chainChanged", handleChainChanged);

            return () => {
                const eth = window.ethereum;
                if (eth) {
                    if (typeof eth.removeListener === "function") {
                        eth.removeListener("accountsChanged", handleAccountsChanged);
                        eth.removeListener("chainChanged", handleChainChanged);
                    } else if (typeof eth.off === "function") {
                        eth.off("accountsChanged", handleAccountsChanged);
                        eth.off("chainChanged", handleChainChanged);
                    }
                }
            };
        }
    }, [walletAddress, fetchBalance, fetchChainId]);

    const connectWallet = async (): Promise<boolean> => {
        const provider = getEthereumProvider();
        if (provider) {
            try {
                setIsConnecting(true);
                setConnectionFailed(false);

                // 1. Check if already authorized (avoids popup lock)
                let accounts: string[] = [];
                try {
                    accounts = (await provider.request({ method: "eth_accounts" })) || [];
                } catch (e) {
                    console.warn("eth_accounts check failed", e);
                }

                // 2. Request accounts if not already permitted
                if (!accounts || accounts.length === 0) {
                    const accountsPromise = provider.request({ method: "eth_requestAccounts" });
                    const timeoutPromise = new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error("Timeout")), 25000)
                    );
                    accounts = (await Promise.race([accountsPromise, timeoutPromise])) as string[];
                }

                if (accounts && accounts.length > 0) {
                    const account = accounts[0];
                    setWalletAddress(account);
                    setWalletConnected(true);
                    setJustConnected(true);
                    safeSetSession("walletAddress", account);
                    setWalletBalance("Loading...");

                    try {
                        await fetchChainId();
                    } catch (e) {
                        console.warn("fetchChainId error", e);
                    }

                    try {
                        await fetchBalance(account);
                    } catch (e) {
                        console.warn("fetchBalance error", e);
                    }

                    api.logWalletEvent("connected", account);

                    setTimeout(() => {
                        setJustConnected(false);
                    }, 1600);

                    return true;
                }
                return false;
            } catch (err: any) {
                console.error("User rejected request or error occurred", err);
                setConnectionFailed(true);
                if (err?.code === 4001) {
                    setConnectionErrorMsg("Request Rejected");
                } else if (err?.code === -32002 || err?.message?.includes("already pending")) {
                    setConnectionErrorMsg("Check Wallet Popup");
                } else if (err?.message === "Timeout") {
                    setConnectionErrorMsg("Wallet Timeout");
                } else {
                    setConnectionErrorMsg("Connection Failed");
                }
                setTimeout(() => {
                    setConnectionFailed(false);
                    setConnectionErrorMsg("No Wallet Detected");
                }, 2500);
                return false;
            } finally {
                setIsConnecting(false);
            }
        } else {
            setConnectionErrorMsg("No Wallet Detected");
            setConnectionFailed(true);
            setShowNoWalletAlert(true);
            setTimeout(() => setConnectionFailed(false), 2000);
            return false;
        }
    };

    const connectDemoWallet = (): boolean => {
        const demoAddress = "0x71C6793F1e10417385973715A3674682343fD498";
        setWalletAddress(demoAddress);
        setWalletConnected(true);
        setJustConnected(true);
        safeSetSession("walletAddress", demoAddress);
        setWalletBalance("2.4500 BNB");
        setShowNoWalletAlert(false);
        setConnectionFailed(false);
        api.logWalletEvent("connected", demoAddress);
        setTimeout(() => setJustConnected(false), 1600);
        return true;
    };

    const switchNetwork = async (targetChainId: number): Promise<boolean> => {
        if (typeof window === "undefined" || !window.ethereum) {
            setShowNoWalletAlert(true);
            return false;
        }
        const targetConfig = getChainConfig(targetChainId);
        if (!targetConfig) return false;

        try {
            setIsSwitchingChain(true);
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: targetConfig.hexId }],
            });

            setChainId(targetConfig.id);
            setActiveChain(targetConfig);
            setIsUnsupportedChain(false);
            if (walletAddress) fetchBalance(walletAddress);
            return true;
        } catch (switchError: any) {
            // Error 4902 indicates that the chain has not been added to MetaMask.
            if (switchError?.code === 4902 || switchError?.message?.includes("Unrecognized chain")) {
                try {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [
                            {
                                chainId: targetConfig.hexId,
                                chainName: targetConfig.name,
                                nativeCurrency: targetConfig.nativeCurrency,
                                rpcUrls: targetConfig.rpcUrls,
                                blockExplorerUrls: targetConfig.blockExplorerUrls,
                            },
                        ],
                    });
                    setChainId(targetConfig.id);
                    setActiveChain(targetConfig);
                    setIsUnsupportedChain(false);
                    if (walletAddress) fetchBalance(walletAddress);
                    return true;
                } catch (addError) {
                    console.error("Failed to add chain via wallet_addEthereumChain", addError);
                    return false;
                }
            }
            console.error("Failed to switch chain via wallet_switchEthereumChain", switchError);
            return false;
        } finally {
            setIsSwitchingChain(false);
        }
    };

    const disconnectWallet = () => {
        const prev = walletAddress;
        setWalletConnected(false);
        setWalletAddress("");
        setJustConnected(false);
        setWalletBalance("0.00 BNB");
        safeRemoveSession("walletAddress");
        api.logWalletEvent("disconnected", "", prev);
    };

    const toggleWallet = async () => {
        if (!walletConnected) {
            await connectWallet();
        } else {
            disconnectWallet();
        }
    };

    return (
        <WalletContext.Provider
            value={{
                walletAddress,
                walletConnected,
                isConnecting,
                walletBalance,
                justConnected,
                showNoWalletAlert,
                setShowNoWalletAlert,
                connectionFailed,
                connectionErrorMsg,
                chainId,
                activeChain,
                isUnsupportedChain,
                isSwitchingChain,
                connectWallet,
                connectDemoWallet,
                disconnectWallet,
                toggleWallet,
                switchNetwork,
                formatAddress,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return context;
}
