import { ArrowUpRight } from "lucide-react";
import type { EvidenceRecord, RadarNode } from "../../types";
import { confidenceColor, criterionConfidenceLabel, DossierPathList } from "./InspectShared";

type CriterionRawData = {
  id: string;
  user_story: string;
  measurement: string;
  threshold: string;
  status: string;
  confidence: string;
  required?: boolean;
  evidence?: EvidenceRecord[];
  dossier?: {
    path?: string;
    readme_path?: string;
    criterion_path?: string;
    status_path?: string;
    evidence_path?: string;
    artifacts_path?: string;
  };
};

export function CriterionInspectPanel({ node }: { node: RadarNode }) {
  const ac = node.rawData as CriterionRawData;
  const cleanStatus = String(ac.status || "").toLowerCase();
  const isPassing = ["passing", "waived"].includes(cleanStatus);
  const isFailing = ["failing", "broken", "invalid", "blocked", "challenged"].includes(cleanStatus);
  const color = isPassing ? "#34d399" : isFailing ? "#f87171" : "#fbbf24";
  const confidenceText = criterionConfidenceLabel(ac.confidence);
  const displayColor = confidenceColor(ac.confidence, color);
  const hasReviewRisk = displayColor === "#fbbf24" && isPassing;

  return (
    <div className="flex flex-col gap-3 text-left min-h-0 h-full max-h-full overflow-hidden select-text">
      <div className="rounded-lg border p-3 bg-slate-950/30 flex items-center justify-between gap-3" style={{ borderColor: `${displayColor}25` }}>
        <div className="flex items-center gap-2.5">
          <div
            className="grid h-8 w-8 place-items-center rounded bg-slate-900 text-xs font-mono font-bold"
            style={{ color: displayColor, backgroundColor: `${displayColor}12` }}
          >
            {ac.id.replace("AC-", "")}
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400">CRITERION DATA</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold" style={{ color, backgroundColor: `${color}12` }}>
                {cleanStatus.toUpperCase()}
              </span>
              {ac.required && <span className="rounded bg-rose-500/10 px-1 py-0.5 text-[8px] font-mono font-bold text-rose-400">REQUIRED</span>}
              {hasReviewRisk && (
                <span className="rounded bg-[#fbbf24]/10 px-1 py-0.5 text-[8px] font-mono font-bold text-[#fbbf24]">REVIEW RISK</span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="block text-[8px] font-mono text-slate-500 uppercase">review signal</span>
          <span className="text-xs font-mono font-bold" style={{ color: displayColor }}>
            {confidenceText}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-hover-visible pr-1 flex flex-col gap-3 min-h-0 max-h-full">
        <div className="rounded border border-slate-900 bg-slate-950/40 p-3">
          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">User Story</span>
          <p className="text-xs leading-relaxed text-slate-200 font-medium">{ac.user_story}</p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <div className="rounded border border-slate-900 bg-slate-950/20 p-2.5">
            <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <ArrowUpRight size={10} className="text-[#00f0ff]" />
              Measurement
            </span>
            <p className="text-[11px] leading-relaxed text-slate-300">{ac.measurement}</p>
          </div>
          <div className="rounded border border-slate-900 bg-slate-950/20 p-2.5">
            <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <ArrowUpRight size={10} className="text-[#bd93f9]" />
              Threshold
            </span>
            <p className="text-[11px] leading-relaxed text-slate-300">{ac.threshold}</p>
          </div>
        </div>

        <DossierPathList
          title="Criterion Dossier"
          paths={[
            { label: "state", value: ac.dossier?.path },
            { label: "readme", value: ac.dossier?.readme_path },
            { label: "criterion", value: ac.dossier?.criterion_path },
            { label: "status", value: ac.dossier?.status_path },
            { label: "evidence", value: ac.dossier?.evidence_path },
            { label: "artifacts", value: ac.dossier?.artifacts_path }
          ]}
        />

        <div className="mt-1">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Evidence ledger ({ac.evidence?.length || 0})
          </span>
          {ac.evidence && ac.evidence.length > 0 ? (
            <div className="flex flex-col gap-2">
              {ac.evidence.map((ev) => {
                const evPass = ["passing", "waived"].includes(String(ev.result || "").toLowerCase());
                const evKind = String(ev.kind || "unknown");
                const evResult = String(ev.result || "unknown");
                const evKey = [ev.created_at, ev.kind, ev.result, ev.summary].filter(Boolean).join(":");

                return (
                  <div key={evKey} className="rounded border border-slate-900/60 bg-black/20 p-2.5">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-[9px] font-mono text-slate-500">[{evKind.toUpperCase()}]</span>
                      <span
                        className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded ${evPass ? "bg-[#34d399]/10 text-[#34d399]" : "bg-rose-500/10 text-rose-400"}`}
                      >
                        {evResult.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300 mb-1.5">{ev.summary}</p>

                    {ev.reviewability && (
                      <div className="rounded bg-slate-900/50 p-2 text-[10px] text-slate-400 border border-slate-900/80 leading-normal">
                        <span className="text-[8px] font-bold uppercase text-slate-500 block mb-0.5">review method</span>
                        {ev.reviewability}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded border border-dashed border-slate-800/80 p-4 text-center text-xs text-slate-500">
              No evidence records found in the ledger. Waiting for verification tools.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
