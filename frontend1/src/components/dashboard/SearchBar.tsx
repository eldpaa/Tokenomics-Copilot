import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { AnimatedListItem } from "@/components/ui/animated-list";

interface SearchBarProps {
    onSearch: (symbol: string) => void;
    isLoading: boolean;
    onFocusChange?: (focused: boolean) => void;
}

// Comprehensive multi-tier token registry on BNB Chain
const ALL_BNB_TOKENS = [
    // Top Gainers & Hyped
    { symbol: "CAKE", name: "PancakeSwap", trend: "+12.5%", isPositive: true },
    { symbol: "BABYDOGE", name: "Baby Doge Coin", trend: "+15.7%", isPositive: true },
    { symbol: "CAT", name: "Simon's Cat", trend: "+24.8%", isPositive: true },
    { symbol: "TWT", name: "Trust Wallet Token", trend: "+3.2%", isPositive: true },
    { symbol: "THE", name: "Thena", trend: "+8.2%", isPositive: true },
    { symbol: "XVS", name: "Venus Protocol", trend: "+5.1%", isPositive: true },
    { symbol: "SFP", name: "SafePal", trend: "+2.4%", isPositive: true },

    // Dips & Negative Tokens
    { symbol: "BAKE", name: "BakerySwap", trend: "-8.4%", isPositive: false },
    { symbol: "BURGER", name: "BurgerCities", trend: "-12.1%", isPositive: false },
    { symbol: "HOTCROSS", name: "Hot Cross", trend: "-14.6%", isPositive: false },
    { symbol: "FLOKI", name: "Floki Inu", trend: "-6.3%", isPositive: false },
    { symbol: "HOOK", name: "Hooked Protocol", trend: "-9.5%", isPositive: false },
    { symbol: "C98", name: "Coin98", trend: "-4.2%", isPositive: false },
    { symbol: "CHESS", name: "Tranchess", trend: "-5.8%", isPositive: false },
    { symbol: "ALPACA", name: "Alpaca Finance", trend: "-3.7%", isPositive: false },

    // Quiet & Infrastructure Tokens
    { symbol: "BELT", name: "Belt Finance", trend: "-0.8%", isPositive: false },
    { symbol: "HELMET", name: "Helmet Insure", trend: "-4.9%", isPositive: false },
    { symbol: "AUTO", name: "AutoShark", trend: "-18.2%", isPositive: false },
    { symbol: "DVI", name: "Dvision Network", trend: "-6.5%", isPositive: false },
    { symbol: "TKO", name: "Tokocrypto", trend: "+0.4%", isPositive: true },
    { symbol: "BSW", name: "Biswap", trend: "-2.1%", isPositive: false },
    { symbol: "WOM", name: "Wombat Exchange", trend: "+1.3%", isPositive: true },
    { symbol: "BIFI", name: "Beefy Finance", trend: "+0.9%", isPositive: true }
];

// Helper component to highlight matched query characters in token symbol/name
function HighlightMatch({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <span>{text}</span>;
    const q = query.trim().toUpperCase();
    const idx = text.toUpperCase().indexOf(q);
    if (idx === -1) return <span>{text}</span>;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + q.length);
    const after = text.slice(idx + q.length);
    return (
        <span>
            {before}
            <span className="text-white font-bold underline decoration-white/35 underline-offset-2">{match}</span>
            {after}
        </span>
    );
}

export function SearchBar({ onSearch, isLoading, onFocusChange }: SearchBarProps) {
    const [input, setInput] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isSlashActive, setIsSlashActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Filter tokens by input in real-time. Uncapped so list is scrollable through all tokens.
    const filteredTokens = useMemo(() => {
        const query = input.trim().toUpperCase();
        if (!query) {
            return ALL_BNB_TOKENS;
        }
        return ALL_BNB_TOKENS.filter(
            (token) =>
                token.symbol.toUpperCase().includes(query) ||
                token.name.toUpperCase().includes(query)
        );
    }, [input]);

    // Reset selected index when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [input]);

    // Smooth auto-scroll selected token into view when navigating with Arrow keys
    useEffect(() => {
        if (isFocused && itemRefs.current[selectedIndex]) {
            itemRefs.current[selectedIndex]?.scrollIntoView({
                block: "nearest",
                behavior: "smooth"
            });
        }
    }, [selectedIndex, isFocused]);

    // Global '/' shortcut to focus searchbar and open Spotlight with tactile keycap feedback
    useEffect(() => {
        let timer: NodeJS.Timeout;
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === "/" && document.activeElement !== inputRef.current) {
                e.preventDefault();
                setIsSlashActive(true);
                const scrollX = window.scrollX;
                const scrollY = window.scrollY;
                inputRef.current?.focus({ preventScroll: true });
                window.scrollTo(scrollX, scrollY);
                setIsFocused(true);
                onFocusChange?.(true);
                clearTimeout(timer);
                timer = setTimeout(() => setIsSlashActive(false), 140);
            }
        };
        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => {
            window.removeEventListener("keydown", handleGlobalKeyDown);
            clearTimeout(timer);
        };
    }, [onFocusChange]);

    const handleSlashClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsSlashActive(true);
        inputRef.current?.focus({ preventScroll: true });
        setIsFocused(true);
        onFocusChange?.(true);
        setTimeout(() => setIsSlashActive(false), 140);
    };

    // Click outside to close Spotlight
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsFocused(false);
                onFocusChange?.(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onFocusChange]);

    const handleSearch = (symbolToSearch?: string) => {
        const target = (symbolToSearch || input).trim().toUpperCase();
        if (target) {
            setInput(target);
            onSearch(target);
            setIsFocused(false);
            onFocusChange?.(false);
            inputRef.current?.blur();
        }
    };

    // Keyboard navigation (Arrow Up/Down, Enter, Esc)
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (filteredTokens.length > 0) {
                setSelectedIndex((prev) => (prev + 1) % filteredTokens.length);
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (filteredTokens.length > 0) {
                setSelectedIndex((prev) => (prev - 1 + filteredTokens.length) % filteredTokens.length);
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filteredTokens.length > 0 && selectedIndex >= 0 && selectedIndex < filteredTokens.length) {
                handleSearch(filteredTokens[selectedIndex].symbol);
            } else {
                handleSearch();
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            setIsFocused(false);
            onFocusChange?.(false);
            inputRef.current?.blur();
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        onFocusChange?.(true);
    };

    return (
        <div ref={containerRef} className="relative w-full h-[58px] z-50">
            {/* Apple Search Spotlight Container - Apple VisionOS & macOS Frosted Glass */}
            <div
                className={`apple-search-container absolute top-0 left-0 right-0 w-full rounded-[28px] ${
                    isFocused
                        ? "is-active bg-[#12151f]/88 backdrop-blur-3xl backdrop-saturate-[180%] border border-white/30 shadow-[0_24px_64px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.18),inset_0_1px_1px_rgba(255,255,255,0.25)]"
                        : "bg-[#181b26]/65 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-[#1e2230]/75 hover:border-white/30"
                }`}
            >
                {/* Search Bar Input Row - Unified Apple Spotlight Container */}
                <div className="relative flex items-center h-[56px]">
                    {/* Apple Spotlight Search Magnifier */}
                    <div className={`absolute left-4 sm:left-5 flex items-center pointer-events-none transition-all ${
                        isFocused ? "duration-300 text-white scale-110 -rotate-6" : "duration-240 text-white/60 scale-100 rotate-0"
                    } ease-[cubic-bezier(0.2,0.9,0.25,1)]`}>
                        <Search className="w-5 h-5" />
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search token (e.g. CAKE, BAKE, TWT)..."
                        className="w-full h-full px-6 pl-12 sm:pl-14 pr-20 sm:pr-24 text-base sm:text-lg bg-transparent text-white placeholder-white/50 focus:outline-none uppercase font-medium tracking-wide rounded-full"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        onFocus={handleFocus}
                        disabled={isLoading}
                    />

                    {/* Right Suffix Hint (Shortcut '/' with tactile mechanical keycap feedback) */}
                    <div
                        className={`absolute right-14 sm:right-16 flex items-center select-none transition-[opacity,transform] duration-140 ease-out ${
                            isFocused && !isSlashActive ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100"
                        }`}
                    >
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={handleSlashClick}
                            className={`hidden sm:flex items-center justify-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium border select-none cursor-pointer transition-[transform,background-color,border-color,box-shadow] duration-120 ease-out ${
                                isSlashActive
                                    ? "bg-white/35 text-white border-white/55 translate-y-[1.5px] scale-[0.88] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_0_8px_rgba(255,255,255,0.3)]"
                                    : "bg-white/10 text-white/70 border-white/15 hover:bg-white/20 hover:text-white hover:border-white/30 hover:scale-[1.04] active:translate-y-[1px] active:scale-[0.90] active:bg-white/25 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                            }`}
                            title="Quick Search (/)"
                        >
                            /
                        </button>
                    </div>

                    {/* Action Submit Button */}
                    <button
                        type="button"
                        onClick={() => handleSearch()}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-full flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all shadow-md group disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                        title="Audit Token"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-gray-800" />
                        ) : (
                            <svg
                                className="w-5 h-5 text-gray-800 transition-transform duration-200 group-hover:translate-x-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Apple Search Spotlight Fluid Reveal Panel */}
                <div
                    className={`apple-search-panel ${
                        isFocused ? "is-open" : ""
                    }`}
                >
                    <div className="overflow-hidden min-h-0">
                        <div
                            ref={scrollContainerRef}
                            className={`apple-search-content border-t border-white/10 px-2 py-2 flex flex-col gap-1.5 max-h-[176px] overflow-y-auto overscroll-contain ${
                                isFocused ? "is-open" : ""
                            }`}
                            style={{
                                scrollbarWidth: "thin",
                                scrollbarColor: "rgba(255, 255, 255, 0.2) transparent",
                                maskImage: "linear-gradient(to bottom, transparent 0%, black 6px, black calc(100% - 6px), transparent 100%)",
                                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 6px, black calc(100% - 6px), transparent 100%)"
                            }}
                        >
                            {filteredTokens.length > 0 ? (
                                <AnimatePresence initial={false}>
                                    {filteredTokens.map((token, idx) => {
                                        const isSelected = idx === selectedIndex;
                                        return (
                                            <AnimatedListItem
                                                key={`${token.symbol}-${isFocused ? "open" : "closed"}`}
                                                viewportRoot={scrollContainerRef}
                                                index={idx}
                                            >
                                                <div
                                                    ref={(el) => {
                                                        itemRefs.current[idx] = el;
                                                    }}
                                                    onMouseEnter={() => setSelectedIndex(idx)}
                                                    onClick={() => handleSearch(token.symbol)}
                                                    className={`apple-token-item flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer select-none active:scale-[0.98] transition-all duration-150 ${
                                                        isSelected
                                                            ? "bg-white/20 text-white ring-1 ring-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                                                            : "text-white/85 hover:bg-white/10 hover:text-white"
                                                    }`}
                                                >
                                                    {/* Left: Token Symbol & Project Name */}
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-transform duration-200 ${
                                                                isSelected ? "scale-105" : "scale-100"
                                                            } ${
                                                                token.isPositive
                                                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                                                    : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                                            }`}
                                                        >
                                                            {token.symbol.slice(0, 1)}
                                                        </div>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="font-semibold text-sm text-white tracking-wide">
                                                                $<HighlightMatch text={token.symbol} query={input} />
                                                            </span>
                                                            <span className="text-xs text-white/50 font-normal">
                                                                <HighlightMatch text={token.name} query={input} />
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Right: Trend */}
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`text-xs font-mono font-medium ${
                                                                token.isPositive ? "text-emerald-400" : "text-rose-400"
                                                            }`}
                                                        >
                                                            {token.trend}
                                                        </span>
                                                    </div>
                                                </div>
                                            </AnimatedListItem>
                                        );
                                    })}
                                </AnimatePresence>
                            ) : (
                                <div
                                    onClick={() => handleSearch()}
                                    className="px-4 py-4 text-center cursor-pointer hover:bg-white/[0.06] rounded-xl transition-colors text-white/70 hover:text-white"
                                >
                                    <p className="text-sm">
                                        No registry match for{" "}
                                        <span className="font-semibold text-white font-mono">
                                            "${input.toUpperCase()}"
                                        </span>
                                    </p>
                                    <p className="text-xs text-white/50 mt-1">
                                        Press <span className="text-white font-mono">↵ Enter</span> to audit contract address or custom token directly
                                    </p>
                                </div>
                            )}

                            {/* macOS Command Palette Footer */}
                            <div className="flex items-center justify-between px-3 pt-2 pb-1 border-t border-white/10 text-[11px] text-white/60 font-sans select-none mt-1">
                                <div className="flex items-center gap-2">
                                    <span>
                                        {input.trim()
                                            ? `${filteredTokens.length} match${filteredTokens.length === 1 ? "" : "es"}`
                                            : `3 visible of ${filteredTokens.length} • Scroll to explore`}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono text-white/80 border border-white/20">
                                            ↑
                                        </kbd>
                                        <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono text-white/80 border border-white/20">
                                            ↓
                                        </kbd>
                                        <span className="ml-0.5">Navigate</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono text-white/80 border border-white/20">
                                            esc
                                        </kbd>
                                        <span className="ml-0.5">Close</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}