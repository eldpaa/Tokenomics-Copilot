export const RECENT_SEARCHES_KEY = "tc_recent_searches";

export function getRecentSearches(): string[] {
    try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Failed to parse recent searches", e);
    }
    return [];
}

export function addRecentSearch(symbol: string) {
    try {
        const current = getRecentSearches();
        const upperSymbol = symbol.toUpperCase();
        // Remove if it already exists to move it to the front
        const filtered = current.filter((s) => s.toUpperCase() !== upperSymbol);
        const updated = [upperSymbol, ...filtered].slice(0, 5); // Keep max 5 recent
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("Failed to save recent search", e);
    }
}
