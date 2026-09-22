// src/components/shared/RiskBadge.tsx
import { Badge } from "@/components/ui/badge";

type RiskBadgeProps = {
  label: string;
};

export function RiskBadge({ label }: RiskBadgeProps) {
  let badgeStyle = "bg-white/[0.04] text-white/70 border-white/[0.08]"; // default fallback

  if (label.includes("Low Risk")) {
    badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
  } else if (label.includes("Medium Risk")) {
    badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/25";
  } else if (label.includes("High Risk")) {
    badgeStyle = "bg-rose-500/10 text-rose-400 border-rose-500/25";
  }

  return (
    <Badge variant="outline" className={`${badgeStyle} font-semibold text-[11px] px-2.5 py-0.5 rounded-full border`}>
      {label}
    </Badge>
  );
}


