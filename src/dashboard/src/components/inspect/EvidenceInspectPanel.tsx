import { Clock, FileText, Globe, HelpCircle, ShieldAlert } from "lucide-react";
import type { EvidenceRecord, RadarNode } from "../../types";
import { CopyableCommand } from "./InspectShared";

export function EvidenceInspectPanel({ node }: { node: RadarNode }) {
  const ev = node.rawData as EvidenceRecord;
  const isPass = ["passing", "waived"].includes(String(ev.result || "").toLowerCase());
  const resultColor = isPass ? "#34d399" : "#f87171";

  const evResult = String(ev.result || "unknown");
  const evConfidence = String(ev.confidence || "verified");
  const evKind = String(ev.kind || "unknown");
  const evBasis = String(ev.basis || "unknown");
  const evGate = String(ev.gate || "accepted");
  const evCreatedAt = ev.created_at ? String(ev.created_at) : "";

  return (
    <div className="flex flex-col gap-3 text-left min-h-0 h-full max-h-full overflow-hidden select-text">
      <div className="rounded-lg border p-3 bg-slate-950/30 flex items-center justify-between gap-3" style={{ borderColor: `${resultColor}25` }}>
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded bg-slate-900 text-[#00f0ff] bg-[#00f0ff]/10">
            <FileText size={16} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400">EVIDENCE NODE</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold ${isPass ? "bg-[#34d399]/10 text-[#34d399]" : "bg-rose-500/10 text-rose-400"}`}
              >
                {evResult.toUpperCase()}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">ID: {node.label}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="block text-[8px] font-mono text-slate-500 uppercase">confidence</span>
          <span className="text-xs font-mono font-bold" style={{ color: resultColor }}>
            {evConfidence.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-hover-visible pr-1 flex flex-col gap-3 min-h-0 max-h-full">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[9px] font-mono text-slate-400">
            KIND: {evKind.toUpperCase()}
          </span>
          <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[9px] font-mono text-slate-400">
            BASIS: {evBasis.toUpperCase()}
          </span>
          <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[9px] font-mono text-slate-400">
            GATE: {evGate.toUpperCase()}
          </span>
        </div>

        <div className="rounded border border-slate-900 bg-slate-950/40 p-3">
          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Evidence Summary</span>
          <p className="text-xs leading-relaxed text-slate-200 font-medium italic">"{ev.summary}"</p>
        </div>

        {ev.sources && ev.sources.length > 0 && (
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Sources of evidence ({ev.sources.length})
            </span>
            <div className="flex flex-col gap-2">
              {ev.sources.map((src) => {
                const srcType = String(src.type || "");
                const srcLabel = String(src.label || "source");
                const srcCommand = String(src.command || "");
                const srcPath = String(src.path || "");
                const srcUrl = String(src.url || "");
                const srcKey = [srcType, srcLabel, srcCommand, srcPath, srcUrl].filter(Boolean).join(":");

                const isCmd = srcType === "command" && srcCommand;
                const isArtifact = srcType === "artifact" && srcPath;
                const isUrl = srcType === "url" && srcUrl;

                return (
                  <div key={srcKey} className="rounded border border-slate-900/60 bg-black/10 p-2 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[8px] font-mono text-slate-500">
                      <span>[SOURCE: {srcType.toUpperCase()}]</span>
                      <span className="text-slate-400 font-bold">{srcLabel}</span>
                    </div>

                    {isCmd && <CopyableCommand cmd={srcCommand} />}

                    {isArtifact && (
                      <div className="flex items-center gap-1.5 text-xs text-[#bd93f9] bg-slate-950/30 p-1.5 rounded border border-slate-900 select-all font-mono text-[10px] break-all">
                        <FileText size={12} className="shrink-0 text-slate-400" />
                        {srcPath}
                      </div>
                    )}

                    {isUrl && (
                      <a
                        href={srcUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-[#00f0ff] hover:underline bg-slate-950/30 p-1.5 rounded border border-slate-900 font-mono text-[10px] break-all"
                      >
                        <Globe size={12} className="shrink-0 text-slate-400" />
                        {srcUrl}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {ev.reviewability && (
          <div className="rounded border border-slate-900 bg-slate-950/20 p-2.5">
            <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <HelpCircle size={10} className="text-[#34d399]" />
              How to review manually
            </span>
            <p className="text-[11px] leading-relaxed text-slate-300">{ev.reviewability}</p>
          </div>
        )}

        {ev.limitations && (
          <div className="rounded border border-rose-950/30 bg-rose-950/10 p-2.5">
            <span className="block text-[8px] font-bold uppercase tracking-wider text-rose-400 mb-1 flex items-center gap-1">
              <ShieldAlert size={10} />
              Evidence limitation risk
            </span>
            <p className="text-[11px] leading-relaxed text-rose-300 font-medium">{ev.limitations}</p>
          </div>
        )}

        {evCreatedAt && (
          <div className="text-[9px] font-mono text-slate-600 flex items-center gap-1 justify-end mt-1">
            <Clock size={10} />
            <span>RECORDED AT {new Date(evCreatedAt).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
