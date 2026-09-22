import type { AuditResult } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";

type AuditDetailSheetProps = {
  token: AuditResult | null;
  isOpen: boolean;
  onClose: () => void;
};

function FormattedAuditText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // Skip === separator lines
        if (/^={3,}$/.test(trimmed)) {
          return <hr key={i} className="border-border my-3" />;
        }

        // Roman numeral headings: "I. ...", "II. ...", "III. ...", "IV. ...", etc.
        if (/^[IVXLC]+\.\s/.test(trimmed)) {
          return (
            <p key={i} className="font-bold text-foreground mt-4 mb-1 text-base">
              {trimmed}
            </p>
          );
        }

        // Numbered sub-sections: "1. ...", "2. ...", "3. ...", etc.
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <p key={i} className="font-bold text-foreground mt-3 mb-1">
              {trimmed}
            </p>
          );
        }

        // EXECUTIVE SUMMARY or other ALL-CAPS lines (min 3 words, all uppercase)
        if (/^[A-Z\s&:]{10,}$/.test(trimmed) && trimmed.length > 5) {
          return (
            <p key={i} className="font-bold text-foreground mt-4 mb-1 text-base">
              {trimmed}
            </p>
          );
        }

        // Bullet lines with label before colon: "- Label: explanation"
        if (/^\s*-\s+.+:/.test(line)) {
          const colonIndex = line.indexOf(":");
          const label = line.substring(0, colonIndex + 1);
          const rest = line.substring(colonIndex + 1);
          return (
            <p key={i} className="whitespace-pre-wrap">
              <span className="font-semibold text-foreground">{label}</span>
              {rest}
            </p>
          );
        }

        // Regular line
        return (
          <p key={i} className="whitespace-pre-wrap">
            {line}
          </p>
        );
      })}
    </div>
  );
}

export function AuditDetailSheet({ token, isOpen, onClose }: AuditDetailSheetProps) {
  if (!token) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-xl">
        <SheetHeader className="text-left">
          <SheetTitle className="text-2xl font-extrabold tracking-tight text-white">{token.symbol} Full Audit</SheetTitle>
          <SheetDescription className="text-white/60 text-xs">
            Risk Score: {typeof token.riskScore === 'object' ? (token.riskScore as any).total : token.riskScore}/100
            {" • "}{typeof token.riskScore === 'object' ? (token.riskScore as any).label : token.riskTier}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <h4 className="font-semibold mb-2.5 text-xs text-white/50 uppercase tracking-wider">Audit Report</h4>
          <div className="titanium-card p-5 rounded-2xl text-sm border border-white/[0.08]">
            <FormattedAuditText text={token.auditText || ""} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}