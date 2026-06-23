import { CheckCircle2 } from "lucide-react";
import type { RadarNode } from "../../types";
import { confidenceColor, criterionConfidenceLabel, DossierPathList } from "./InspectShared";

type PassedCriteriaRawData = {
  total_completed: number;
  focused_id?: string;
  criteria: Array<{
    id: string;
    user_story: string;
    measurement: string;
    threshold: string;
    status: string;
    confidence: string;
    dossier?: {
      path?: string;
      readme_path?: string;
      criterion_path?: string;
      status_path?: string;
      evidence_path?: string;
      artifacts_path?: string;
    };
  }>;
};

export function PassedCriteriaPanel({ node }: { node: RadarNode }) {
  const rawGroup = node.rawData as PassedCriteriaRawData;
  return (
    <div className="flex flex-col gap-3 text-left min-h-0 h-full max-h-full overflow-hidden">
      <div className="flex items-center justify-between rounded-lg border border-[rgba(52,211,153,0.15)] bg-[#34d399]/6 p-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded bg-[#34d399]/15 text-[#34d399] filter drop-shadow-[0_0_6px_rgba(52,211,153,0.2)]">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#34d399]/80">PASSED CRITERIA</span>
            <p className="text-xs text-slate-400 mt-0.5">Satisfied acceptance rules</p>
          </div>
        </div>
        <div className="text-right">
          <span className="block text-2xl font-black text-[#34d399] tracking-tight">{rawGroup.total_completed}</span>
          <span className="text-[8px] font-mono text-slate-500 uppercase">items total</span>
        </div>
      </div>

      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Aggregated Criteria List</span>

      <div className="flex-1 overflow-auto scrollbar-hover-visible flex flex-col gap-2 pr-1 min-h-0 max-h-full select-text">
        {rawGroup.criteria.map((ac) => (
          <div
            key={ac.id}
            className={`group relative rounded border bg-slate-950/20 p-2.5 transition hover:border-[#34d399]/30 hover:bg-[#34d399]/2 ${
              rawGroup.focused_id === ac.id ? "border-[#00f0ff]/45 shadow-[0_0_0_1px_rgba(0,240,255,0.12)]" : "border-slate-900"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <span className="inline-flex items-center gap-1 rounded bg-[#34d399]/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#34d399]">
                {ac.id}
              </span>
              <span className="inline-flex items-center gap-1 text-[8px] font-mono opacity-80" style={{ color: confidenceColor(ac.confidence, "#34d399") }}>
                <CheckCircle2 size={9} />
                {criterionConfidenceLabel(ac.confidence)}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">{ac.user_story}</p>
            {rawGroup.focused_id === ac.id && (
              <DossierPathList
                title="Focused Criterion Dossier"
                paths={[
                  { label: "readme", value: ac.dossier?.readme_path },
                  { label: "status", value: ac.dossier?.status_path }
                ]}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
