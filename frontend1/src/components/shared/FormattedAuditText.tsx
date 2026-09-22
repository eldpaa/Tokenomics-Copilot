import { useState, useRef } from "react";
import { ChevronDown, ChevronsUpDown } from "lucide-react";

type Section = {
  title: string;
  lines: string[];
};

function getShortSectionTitle(title: string): string {
  const upper = title.toUpperCase();
  if (upper.includes("EXECUTIVE SUMMARY")) return "📑 Summary";
  if (upper.includes("INFRASTRUCTURE") || upper.includes("INFRASTRUKTUR")) return "🌐 Infrastructure";
  if (upper.includes("FUNDAMENTAL") || upper.includes("ENTITAS")) return "🏛️ Fundamentals";
  if (upper.includes("TOKENOMICS") || upper.includes("BEDAH TOKENOMICS")) return "📊 Tokenomics";
  if (upper.includes("VERDICT") || upper.includes("KESIMPULAN")) return "⚖️ Verdict";

  // Fallback: strip Roman numerals and clean up
  const clean = title.replace(/^[IVXLC]+\.\s*/, "").replace(/[*#_`]/g, "").trim();
  const words = clean.split(" ");
  return words.slice(0, 2).join(" ") || "📑 Section";
}

export function FormattedAuditText({ text }: { text: string }) {
  const cleanedText = text.replace(/^(\s*={3,}\s*)+/, "").trim();
  const rawLines = cleanedText.split("\n");

  const sections: Section[] = [];
  let currentSection: Section = { title: "EXECUTIVE SUMMARY", lines: [] };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    if (/^={3,}$/.test(line)) continue;

    // Detect Roman numeral headings: "I. ...", "II. ...", etc.
    if (/^[IVXLC]+\.\s/.test(line)) {
      if (currentSection.lines.length > 0 || currentSection.title !== "EXECUTIVE SUMMARY") {
        sections.push(currentSection);
      }
      currentSection = { title: line, lines: [] };
    } else {
      currentSection.lines.push(line);
    }
  }
  // Push the last section
  if (currentSection.lines.length > 0 || currentSection.title !== "EXECUTIVE SUMMARY") {
    sections.push(currentSection);
  }

  // Centralized open state for accordions
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 0: true });
  const [activeTab, setActiveTab] = useState<number | null>(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const toggleSection = (index: number) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const allExpanded = sections.length > 0 && sections.every((_, i) => openSections[i]);

  const toggleAll = () => {
    const nextState = !allExpanded;
    const updated: Record<number, boolean> = {};
    sections.forEach((_, i) => {
      updated[i] = nextState;
    });
    setOpenSections(updated);
  };

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    // Ensure the clicked section is expanded
    setOpenSections((prev) => ({
      ...prev,
      [index]: true,
    }));

    // Smooth scroll with offset after state applies
    setTimeout(() => {
      const el = sectionRefs.current[index];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  };

  return (
    <div className="space-y-4">
      {/* Sticky Pill Tabs Navigation Bar */}
      {sections.length > 1 && (
        <div className="sticky top-16 sm:top-20 z-20 -mx-1 p-1.5 bg-[#121316]/90 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-lg flex items-center justify-between gap-2">
          {/* Horizontal Scrollable Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1 scroll-smooth">
            {sections.map((section, idx) => {
              const isActive = activeTab === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTabClick(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap active-press transition-colors flex items-center gap-1.5 cursor-pointer select-none ${
                    isActive
                      ? "bg-primary text-white shadow-xs"
                      : "bg-white/[0.05] text-muted-foreground hover:bg-white/[0.1] hover:text-foreground"
                  }`}
                >
                  {getShortSectionTitle(section.title)}
                </button>
              );
            })}
          </div>

          {/* Expand / Collapse All Toggle Button */}
          <div className="shrink-0 pl-1 border-l border-white/[0.08]">
            <button
              type="button"
              onClick={toggleAll}
              className="h-8 px-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 active-press transition-colors cursor-pointer whitespace-nowrap"
              title={allExpanded ? "Tutup Semua Bagian" : "Buka Semua Bagian"}
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{allExpanded ? "Tutup Semua" : "Buka Semua"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Accordion List */}
      <div className="space-y-3">
        {sections.map((section, index) => (
          <div
            key={index}
            ref={(el) => {
              sectionRefs.current[index] = el;
            }}
            className="scroll-mt-32 sm:scroll-mt-36"
          >
            <AccordionSection
              section={section}
              isOpen={Boolean(openSections[index])}
              onToggle={() => toggleSection(index)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function AccordionSection({
  section,
  isOpen,
  onToggle,
}: {
  section: Section;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-white/[0.08] bg-[#121316]/75 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xs">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.05] active-press transition-colors text-left cursor-pointer"
      >
        <span className="font-bold text-foreground text-sm sm:text-base">{section.title}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-220 ease-apple-drawer shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-220 ease-apple-drawer ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-5 pt-3 space-y-1.5 text-xs sm:text-sm font-normal border-t border-white/[0.06] text-foreground/85 leading-relaxed">
            {section.lines.map((line, i) => {
              // Numbered sub-sections: "1. Label: Explanation"
              if (/^\d+\.\s/.test(line)) {
                const colonIndex = line.indexOf(":");
                if (colonIndex !== -1) {
                  const label = line.substring(0, colonIndex + 1);
                  const rest = line.substring(colonIndex + 1);
                  return (
                    <p
                      key={i}
                      className="text-foreground/80 mt-4 mb-2 leading-[1.5] text-justify md:text-justify text-left"
                    >
                      <span className="font-bold text-primary">{label}</span>
                      {rest}
                    </p>
                  );
                }
                return (
                  <p
                    key={i}
                    className="font-bold text-primary mt-4 mb-2 leading-[1.5] text-justify md:text-justify text-left"
                  >
                    {line}
                  </p>
                );
              }

              // EXECUTIVE SUMMARY or ALL-CAPS lines
              if (/^[A-Z\s&:]{10,}$/.test(line) && line.length > 5 && !line.startsWith("-")) {
                return (
                  <p
                    key={i}
                    className="font-bold text-foreground mt-4 mb-2 tracking-wide leading-[1.5] text-justify md:text-justify text-left"
                  >
                    {line}
                  </p>
                );
              }

              // Bullet lines with label before colon: "- [Label] explanation" or "- Label: explanation"
              if (/^\s*-\s+/.test(line)) {
                let label = "";
                let rest = "";

                // Check for bracket tags like "- [Website Analysis] ..."
                const bracketMatch = line.match(/^\s*-\s*\[(.*?)\]\s*(.*)/);
                if (bracketMatch) {
                  label = bracketMatch[1];
                  rest = bracketMatch[2];
                  return (
                    <div key={i} className="mb-4 mt-3 flex flex-col items-start gap-1.5 ml-2">
                      <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                        {label}
                      </span>
                      <p className="text-foreground/80 leading-[1.5] text-justify md:text-justify text-left">
                        {rest}
                      </p>
                    </div>
                  );
                }

                // Check for colon labels "- Label: explanation"
                const colonIndex = line.indexOf(":");
                if (colonIndex !== -1) {
                  label = line.substring(0, colonIndex + 1);
                  rest = line.substring(colonIndex + 1);
                  return (
                    <p
                      key={i}
                      className="text-foreground/80 leading-[1.5] ml-3 mt-2 mb-2 text-justify md:text-justify text-left"
                    >
                      <span className="font-semibold text-primary">{label}</span>
                      {rest}
                    </p>
                  );
                }

                // Normal bullet
                return (
                  <p
                    key={i}
                    className="text-foreground/80 leading-[1.5] ml-3 mt-2 mb-2 text-justify md:text-justify text-left"
                  >
                    {line}
                  </p>
                );
              }

              // Regular line
              return (
                <p
                  key={i}
                  className="text-foreground/80 leading-[1.5] mt-2 mb-2 text-justify md:text-justify text-left"
                >
                  {line}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

