import { useState, useMemo } from "react";
import { Search, ArrowUpDown, Filter, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

export function ResultsTable({ results, onViewAudit }: { results: any, onViewAudit: (token: any) => void }) {
    // Ensure results is a valid array before processing
    const validResults = Array.isArray(results) ? results : (results?.data || results?.results || []);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTier, setSelectedTier] = useState<string>("ALL");
    const [sortOrder, setSortOrder] = useState<"score-desc" | "score-asc" | "alpha">("score-desc");

    if (!validResults || validResults.length === 0) return null;

    const getTierColor = (tier: string) => {
        if (tier?.includes("Low Risk")) return "text-emerald-500";
        if (tier?.includes("Medium Risk")) return "text-yellow-500";
        return "text-rose-500";
    };

    const getRiskScore = (r: any) => typeof r.riskScore === 'object' ? r.riskScore?.total : (Number(r.riskScore) || 0);
    const getRiskTier = (r: any) => typeof r.riskScore === 'object' ? r.riskScore?.label : (r.riskTier || "Unknown");

    const getWhaleSignal = (r: any) => {
        const signal = r?.onChainSignals?.whaleActivity?.dominantSignal || r?.onChain?.whaleActivity || r?.onChainSignals?.whaleMovement?.status;
        return signal || "Neutral";
    };

    // Filter and Sort results
    const filteredResults = useMemo(() => {
        return validResults
            .filter((row: any) => {
                const matchesSearch = row.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (row.name && row.name.toLowerCase().includes(searchQuery.toLowerCase()));
                
                if (!matchesSearch) return false;

                if (selectedTier === "ALL") return true;
                return getRiskTier(row).toLowerCase().includes(selectedTier.toLowerCase());
            })
            .sort((a: any, b: any) => {
                if (sortOrder === "score-desc") return (getRiskScore(b) || 0) - (getRiskScore(a) || 0);
                if (sortOrder === "score-asc") return (getRiskScore(a) || 0) - (getRiskScore(b) || 0);
                return a.symbol.localeCompare(b.symbol);
            });
    }, [validResults, searchQuery, selectedTier, sortOrder]);

    const lowRiskCount = validResults.filter((r: any) => getRiskTier(r)?.includes("Low Risk")).length;
    const medRiskCount = validResults.filter((r: any) => getRiskTier(r)?.includes("Medium Risk")).length;
    const highRiskCount = validResults.filter((r: any) => getRiskTier(r)?.includes("High Risk")).length;

    return (
        <div className="mt-8 space-y-6 animate-in fade-in zoom-in-[0.98] duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.08] pb-3">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-foreground">
                    <span>📊</span>
                    <span>Ecosystem Audit Results & Tier List</span>
                </h2>
                <div className="text-xs text-muted-foreground font-mono">
                    Total Audited: <span className="font-bold text-foreground">{validResults.length} tokens</span>
                </div>
            </div>

            {/* Tier List Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {["Low Risk", "Medium Risk", "High Risk"].map((tier) => (
                    <div key={tier} className="p-5 border border-white/[0.08] rounded-[24px] bg-[#121316]/75 backdrop-blur-xl shadow-xs">
                        <h3 className={`font-bold mb-3 ${getTierColor(tier)} flex items-center justify-between text-xs sm:text-sm`}>
                            <span>{tier}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground font-mono font-medium">
                                {validResults.filter((r: any) => getRiskTier(r)?.includes(tier)).length} tokens
                            </span>
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                            {validResults.filter((r: any) => getRiskTier(r)?.includes(tier)).map((r: any) => (
                                <button 
                                    key={r.symbol} 
                                    onClick={() => onViewAudit(r)}
                                    className="px-2.5 py-1 text-xs font-semibold bg-white/[0.05] text-foreground rounded-xl border border-white/[0.08] shadow-2xs flex items-center gap-1.5 hover:bg-white/[0.1] hover:border-white/20 active-press transition-colors cursor-pointer"
                                >
                                    <span>${r.symbol}</span>
                                    <span className="font-mono text-[10px] text-muted-foreground">({getRiskScore(r)}/100)</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Filter Controls Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3 rounded-2xl bg-[#121316]/70 border border-white/[0.08] backdrop-blur-xl">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-sm flex items-center">
                    <Search className="absolute left-3 w-4 h-4 text-muted-foreground/60" />
                    <input
                        type="text"
                        placeholder="Filter by token symbol..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-white/20 transition-colors"
                    />
                </div>

                {/* Tier Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                        { id: "ALL", label: `All (${validResults.length})` },
                        { id: "Low Risk", label: `Low Risk (${lowRiskCount})` },
                        { id: "Medium Risk", label: `Medium Risk (${medRiskCount})` },
                        { id: "High Risk", label: `High Risk (${highRiskCount})` },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTier(tab.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap active-press transition-colors ${
                                selectedTier === tab.id
                                    ? "bg-white text-black shadow-xs font-semibold"
                                    : "bg-white/[0.05] text-muted-foreground hover:bg-white/[0.1] hover:text-foreground"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}

                    {/* Sort Order Button */}
                    <button
                        onClick={() => {
                            if (sortOrder === "score-desc") setSortOrder("score-asc");
                            else if (sortOrder === "score-asc") setSortOrder("alpha");
                            else setSortOrder("score-desc");
                        }}
                        className="h-8 px-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0 ml-1 active-press transition-colors"
                        title="Sort order"
                    >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">
                            {sortOrder === "score-desc" ? "Score: High" : sortOrder === "score-asc" ? "Score: Low" : "A-Z"}
                        </span>
                    </button>
                </div>
            </div>

            {/* Results Table */}
            <div className="overflow-hidden border border-white/[0.08] rounded-[24px] bg-[#121316]/70 backdrop-blur-xl shadow-xs">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-secondary/60 text-muted-foreground border-b border-border/50">
                        <tr>
                            <th className="px-4 py-3.5 font-bold">Token</th>
                            <th className="px-4 py-3.5 font-bold">Risk Score</th>
                            <th className="px-4 py-3.5 font-bold">Risk Tier</th>
                            <th className="px-4 py-3.5 font-bold">Whale Signal</th>
                            <th className="px-4 py-3.5 font-bold text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                        {filteredResults.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                                    No tokens match your search criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredResults.map((row: any) => (
                                <tr 
                                    key={row.symbol} 
                                    onClick={() => onViewAudit(row)}
                                    className="hover:bg-secondary/60 transition-colors cursor-pointer group"
                                >
                                    <td className="px-4 py-3 font-bold text-foreground">
                                        <div className="flex items-center gap-2">
                                            <span>${row.symbol}</span>
                                            {row.name && (
                                                <span className="text-[11px] text-muted-foreground/70 font-normal hidden sm:inline">
                                                    {row.name}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono font-bold">{getRiskScore(row)}/100</td>
                                    <td className={`px-4 py-3 font-bold ${getTierColor(getRiskTier(row))}`}>
                                        {getRiskTier(row)}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                                            getWhaleSignal(row) === "DUMP_PRESSURE" 
                                                ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" 
                                                : getWhaleSignal(row) === "ACCUMULATION" 
                                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                                : "bg-secondary text-muted-foreground"
                                        }`}>
                                            {getWhaleSignal(row)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                            View Report
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}