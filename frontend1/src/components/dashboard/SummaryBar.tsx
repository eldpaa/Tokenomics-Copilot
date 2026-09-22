// src/components/dashboard/SummaryBar.tsx
import type { TokenAuditResult } from "@/lib/types";

type SummaryBarProps = {
  tokens: TokenAuditResult[];
};

export function SummaryBar({ tokens }: SummaryBarProps) {
  // Calculate metrics at render level to avoid complex state management
  const total = tokens.length;
  const lowRisk = tokens.filter((t) => t.riskScore?.label?.includes("Low Risk")).length;
  const mediumRisk = tokens.filter((t) => t.riskScore?.label?.includes("Medium Risk")).length;
  const highRisk = tokens.filter((t) => t.riskScore?.label?.includes("High Risk")).length;

  const metrics = [
    { title: "Total Audited", value: total, color: "text-white" },
    { title: "Low Risk", value: lowRisk, color: "text-emerald-400" },
    { title: "Medium Risk", value: mediumRisk, color: "text-amber-400" },
    { title: "High Risk", value: highRisk, color: "text-rose-400" },
  ];

  return (
    <div className="titanium-card p-5 mb-6 flex flex-col md:flex-row justify-between items-center shadow-xl divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
      {metrics.map((metric) => (
        <div key={metric.title} className="flex-1 w-full flex flex-col items-center justify-center py-4 md:py-1">
          <span className="text-[11px] font-semibold text-white/50 tracking-wider uppercase mb-1 text-center">
            {metric.title}
          </span>
          <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums font-mono ${metric.color}`}>
            {metric.value}
          </span>
        </div>
      ))}
    </div>
  );
}
