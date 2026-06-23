import { Compass } from "lucide-react";
import type { RadarNode } from "../../types";
import { DossierPathList, formatSignal } from "./InspectShared";

type GoalRawData = {
  empty_state?: boolean;
  message?: string;
  idle_summary?: {
    message?: string;
    next?: string;
    last_goal?: {
      id: string;
      label: string;
      workflow_status: string;
      location: string;
      updated_at?: string;
      dossier_path?: string;
      readme_path?: string;
      report_path?: string;
    };
  };
  label: string;
  workflow_status?: string;
  dossier?: {
    location?: string;
    path?: string;
    readme_path?: string;
    contract_path?: string;
    ledger_path?: string;
    criteria_path?: string;
    report_path?: string;
  };
};

export function GoalInspectPanel({ node }: { node: RadarNode }) {
  const rawGoal = node.rawData as GoalRawData;
  if (rawGoal.empty_state) {
    const idleSummary = rawGoal.idle_summary;
    const lastGoal = idleSummary?.last_goal;
    return (
      <div className="flex flex-col gap-4 text-left select-text">
        <div className="flex items-center gap-2.5 rounded-lg border border-[rgba(0,240,255,0.1)] bg-[#00f0ff]/5 p-3.5">
          <div className="grid h-8 w-8 place-items-center rounded bg-[#00f0ff]/15 text-[#00f0ff]">
            <Compass size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#00f0ff]/80">NORI STATE</span>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-[#34d399]/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#34d399]">
                READY
              </span>
              <span className="text-[9px] text-slate-500 font-mono">NO CURRENT CONTRACT</span>
            </div>
          </div>
        </div>

        <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Current State</span>
          <p className="text-xs font-semibold leading-relaxed text-slate-200">
            {idleSummary?.message || rawGoal.message || "No current Nori Contract is being observed."}
          </p>
        </div>

        {lastGoal ? (
          <div className="rounded border border-[#34d399]/15 bg-[#34d399]/5 p-3">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#34d399]/80">Last Outcome</span>
            <p className="text-xs font-semibold leading-relaxed text-slate-200">{lastGoal.label}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[8px] font-mono font-bold text-slate-300">
                ID {lastGoal.id}
              </span>
              <span className="rounded bg-[#34d399]/10 px-1.5 py-0.5 text-[8px] font-mono font-bold text-[#34d399]">
                {formatSignal(lastGoal.workflow_status)}
              </span>
              <span className="rounded bg-[#00f0ff]/10 px-1.5 py-0.5 text-[8px] font-mono font-bold text-[#00f0ff]">
                {formatSignal(lastGoal.location)}
              </span>
            </div>
          </div>
        ) : null}

        <div className="rounded border border-[#fbbf24]/15 bg-[#fbbf24]/5 p-3">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#fbbf24]/90">Next</span>
          <p className="text-xs leading-relaxed text-slate-300">
            {idleSummary?.next || "Ask the agent to use OpenNori for a goal, then approve a Nori Contract."}
          </p>
        </div>

        <DossierPathList
          title="Last Goal Files"
          paths={[
            { label: "state", value: lastGoal?.dossier_path },
            { label: "readme", value: lastGoal?.readme_path },
            { label: "report", value: lastGoal?.report_path }
          ]}
        />

        <div className="rounded border border-slate-800 bg-slate-950/40 p-3 text-xs leading-normal text-slate-400">
          The dashboard is observation-only. Start or approve the next Nori Contract in the agent conversation, not from this panel.
        </div>
      </div>
    );
  }

  const isCompleted = String(rawGoal.workflow_status || "").toLowerCase() === "complete";

  return (
    <div className="flex flex-col gap-4 text-left select-text">
      <div className="flex items-center gap-2.5 rounded-lg border border-[rgba(0,240,255,0.1)] bg-[#00f0ff]/5 p-3.5">
        <div className="grid h-8 w-8 place-items-center rounded bg-[#00f0ff]/15 text-[#00f0ff]">
          <Compass size={18} />
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#00f0ff]/80">TARGET / DIRECTIVE</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold ${isCompleted ? "bg-[#34d399]/10 text-[#34d399]" : "bg-[#fbbf24]/10 text-[#fbbf24]"}`}
            >
              {isCompleted ? "COMPLETED" : "ACTIVE"}
            </span>
            <span className="text-[9px] text-slate-500 font-mono">ID: {node.id}</span>
          </div>
        </div>
      </div>

      <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Goal Description</span>
        <p className="text-xs font-semibold leading-relaxed text-slate-200">{rawGoal.label}</p>
      </div>

      <DossierPathList
        title="Goal Dossier"
        paths={[
          { label: "state", value: rawGoal.dossier?.path },
          { label: "readme", value: rawGoal.dossier?.readme_path },
          { label: "contract", value: rawGoal.dossier?.contract_path },
          { label: "ledger", value: rawGoal.dossier?.ledger_path },
          { label: "criteria", value: rawGoal.dossier?.criteria_path },
          { label: "report", value: rawGoal.dossier?.report_path }
        ]}
      />

      <div className="rounded border border-slate-800 bg-slate-950/40 p-3 text-xs leading-normal text-slate-400">
        This is the primary Nori Contract dossier that OpenNori is observing. The dashboard reads the generated review files and structured
        JSON state, but it does not approve, waive, or write acceptance data.
      </div>
    </div>
  );
}
