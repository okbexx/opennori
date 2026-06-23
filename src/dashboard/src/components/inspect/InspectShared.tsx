import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyableCommand({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="flex items-center justify-between gap-2 rounded border border-slate-800 bg-black/60 p-2 font-mono text-[10px] text-[#00f0ff] select-all">
      <span className="truncate flex-1">$ {cmd}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="text-slate-400 hover:text-[#00f0ff] transition-colors cursor-pointer"
        title="Copy command"
      >
        {copied ? <Check size={12} className="text-[#34d399]" /> : <Copy size={12} />}
      </button>
    </div>
  );
}

export function formatSignal(value: string | undefined): string {
  const clean = String(value || "").trim();
  return clean ? clean.replace(/[-_]+/g, " ").toUpperCase() : "UNKNOWN";
}

export function criterionConfidenceLabel(confidence: string | undefined): string {
  const clean = String(confidence || "").toLowerCase();
  if (clean === "review-required") return "REVIEW NEEDED";
  if (clean === "product-evidence-required") return "PRODUCT EVIDENCE NEEDED";
  if (clean === "human-required") return "HUMAN REVIEW NEEDED";
  if (clean === "verified") return "VERIFIED";
  if (clean === "agent") return "AGENT OBSERVED";
  if (clean === "none") return "NO EVIDENCE";
  return formatSignal(confidence);
}

export function confidenceColor(confidence: string | undefined, fallbackColor: string): string {
  const clean = String(confidence || "").toLowerCase();
  if (["review-required", "human-required", "product-evidence-required"].includes(clean)) return "#fbbf24";
  return fallbackColor;
}

export function profileStatusColor(status: string | undefined): string {
  const clean = String(status || "").toLowerCase();
  if (clean === "satisfied" || clean === "waived") return "#34d399";
  if (clean === "violated") return "#f87171";
  return "#fbbf24";
}

export function profileStrengthColor(strength: string | undefined): string {
  const clean = String(strength || "").toLowerCase();
  if (clean === "must") return "#f87171";
  if (clean === "avoid") return "#fbbf24";
  return "#00f0ff";
}

export function DossierPathList({ title, paths }: { title: string; paths: Array<{ label: string; value?: string }> }) {
  const visiblePaths = paths.filter((item) => item.value);
  if (visiblePaths.length === 0) return null;

  return (
    <div className="rounded border border-[#00f0ff]/12 bg-[#00f0ff]/5 p-2.5">
      <span className="mb-1.5 block text-[8px] font-bold uppercase tracking-wider text-[#00f0ff]/80">{title}</span>
      <div className="flex flex-col gap-1">
        {visiblePaths.map((item) => (
          <div
            key={`${item.label}:${item.value}`}
            className="grid grid-cols-[78px_1fr] gap-2 rounded bg-black/20 px-2 py-1.5 text-[10px] leading-snug"
          >
            <span className="font-mono uppercase text-slate-500">{item.label}</span>
            <span className="break-all font-mono text-slate-300">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
