import { Check, Compass, Copy, ListChecks } from "lucide-react";
import {
  architectureDecisionClass,
  dashboardOutcomeRows,
  formatSignal,
  outcomeDecisionClass,
  profileImpactClass
} from "../dashboard-view";
import type { NoriEvent, NoriSnapshot } from "../types";
import { OutcomeCard } from "./OutcomeCard";

export function OutcomeHud({
  snapshot,
  suggestedAgentReply,
  copied,
  latestAgentEvent,
  onCopySuggestedReply,
  onInspectProfile
}: {
  snapshot: NoriSnapshot;
  suggestedAgentReply: string;
  copied: boolean;
  latestAgentEvent?: NoriEvent;
  onCopySuggestedReply: () => void;
  onInspectProfile: () => void;
}) {
  const outcomeSummary = snapshot.outcome_summary;
  const idleSummary = snapshot.idle_summary;
  const hasCurrentGoal = snapshot.status === "active" && !!snapshot.goal;
  const rows = dashboardOutcomeRows(snapshot);
  const rowToneClass = {
    green: "border-[#34d399]/18 bg-[#34d399]/6 text-[#34d399]",
    amber: "border-[#fbbf24]/20 bg-[#fbbf24]/7 text-[#fbbf24]",
    rose: "border-rose-400/20 bg-rose-500/7 text-rose-300",
    cyan: "border-[#00f0ff]/18 bg-[#00f0ff]/7 text-[#00f0ff]",
    purple: "border-[#bd93f9]/18 bg-[#bd93f9]/7 text-[#bd93f9]"
  };

  return (
    <div className="absolute left-4 top-4 bottom-4 z-20 w-[min(340px,calc(100vw-2rem))] overflow-y-auto scrollbar-hover-visible flex flex-col gap-3 pointer-events-auto pr-1">
      <div className="rounded-lg border-l-[3.5px] border-l-[#00f0ff] border border-[rgba(0,240,255,0.14)] bg-[rgba(8,9,20,0.88)] p-3 shadow-2xl backdrop-blur-md text-left">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded bg-[#00f0ff]/10 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-[#00f0ff]">
            <Compass size={11} />
            Outcome Overview
          </span>
          <span className={`shrink-0 rounded border px-2 py-0.5 text-[8.5px] font-mono font-bold uppercase tracking-wider ${outcomeDecisionClass(outcomeSummary?.decision.state || snapshot.decision)}`}>
            {formatSignal(outcomeSummary?.decision.state || snapshot.decision)}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {rows.map((row) => (
            <div key={row.label} className={`rounded border p-2 ${rowToneClass[row.tone]}`}>
              <div className="mb-0.5 flex items-center justify-between gap-2">
                <span className="text-[8px] font-mono font-black uppercase tracking-wider opacity-80">{row.label}</span>
              </div>
              <p className="text-[10.5px] font-bold leading-snug text-slate-100 break-words">{row.value}</p>
              <p className="mt-0.5 text-[9.5px] leading-snug text-slate-400 break-words">{row.detail}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {snapshot.goal ? (
            <div>
              <span className="block text-[8px] font-mono font-bold uppercase tracking-wider text-slate-500">Goal</span>
              <p className="mt-0.5 text-[11px] font-bold leading-relaxed tracking-wide text-slate-100 break-words">
                {snapshot.goal.label}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-[#00f0ff]/10 px-1.5 py-0.5 text-[8px] font-mono font-bold text-[#00f0ff]">
                  {snapshot.goal.id}
                </span>
                <span className={`rounded px-1.5 py-0.5 text-[8px] font-mono font-bold ${snapshot.goal.workflow_status === "complete" ? "bg-[#34d399]/10 text-[#34d399]" : "bg-[#fbbf24]/10 text-[#fbbf24]"}`}>
                  {formatSignal(snapshot.goal.workflow_status)}
                </span>
              </div>
            </div>
          ) : null}

          <div className="rounded border border-slate-800/80 bg-black/25 p-2">
            <span className="block text-[8px] font-mono font-bold uppercase tracking-wider text-slate-500">Decision</span>
            <p className="mt-0.5 text-[11px] font-bold leading-relaxed text-slate-100">
              {outcomeSummary?.decision.label || "No current goal"}
            </p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">
              {outcomeSummary?.decision.detail || idleSummary?.message || "No current Nori Contract is being observed."}
            </p>
          </div>
        </div>
      </div>

      {outcomeSummary ? (
        <>
          <OutcomeCard
            label="Current gap"
            title={outcomeSummary.current_gap.id ? `${outcomeSummary.current_gap.id}: ${outcomeSummary.current_gap.label}` : outcomeSummary.current_gap.label}
            detail={outcomeSummary.current_gap.detail}
            badge={outcomeSummary.current_gap.id || "none"}
            tone={outcomeSummary.current_gap.id ? "rose" : "green"}
          />

          <div className="rounded-lg border-l-[3.5px] border-l-[#fbbf24] border border-[rgba(251,191,36,0.14)] bg-[rgba(8,9,20,0.85)] p-3 shadow-2xl backdrop-blur-md text-left">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded bg-[#fbbf24]/10 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-[#fbbf24]">
                {outcomeSummary.next.label}
              </span>
              <span className={`rounded border px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider ${outcomeSummary.need_user.required ? "border-[#fbbf24]/30 bg-[#fbbf24]/10 text-[#fbbf24]" : "border-[#34d399]/25 bg-[#34d399]/10 text-[#34d399]"}`}>
                {outcomeSummary.need_user.required ? "need user" : "agent can continue"}
              </span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-300">
              {outcomeSummary.next.action}
            </p>
            {outcomeSummary.need_user.required ? (
              <div className="mt-2.5 flex items-center gap-2 rounded border border-[#fbbf24]/20 bg-black/40 p-1.5">
                <code className="flex-1 truncate text-[9px] text-[#fbbf24]">
                  {suggestedAgentReply}
                </code>
                <button
                  type="button"
                  onClick={onCopySuggestedReply}
                  className="text-slate-400 hover:text-[#fbbf24] transition-colors shrink-0"
                  title="Copy reply for agent chat"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border-l-[3.5px] border-l-[#bd93f9] border border-[rgba(189,147,249,0.12)] bg-[rgba(8,9,20,0.85)] p-3 shadow-2xl backdrop-blur-md text-left">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded bg-[#bd93f9]/10 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-[#bd93f9]">
                <ListChecks size={11} />
                Project Profile impact
              </span>
              <button
                type="button"
                onClick={onInspectProfile}
                className={`rounded border px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider transition hover:border-[#bd93f9]/50 ${profileImpactClass(outcomeSummary.profile.state)}`}
              >
                Inspect
              </button>
            </div>
            <p className="text-[11px] font-bold leading-relaxed text-slate-100">
              {outcomeSummary.profile.label}
            </p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">
              {outcomeSummary.profile.detail}
            </p>
          </div>
        </>
      ) : null}

      <div className="rounded-lg border-l-[3.5px] border-l-[#34d399] border border-[rgba(52,211,153,0.12)] bg-[rgba(8,9,20,0.85)] p-3 shadow-2xl backdrop-blur-md text-left">
        <div className="flex items-center justify-between mb-1.5">
          <span className="inline-flex items-center gap-1 rounded bg-[#34d399]/10 px-2 py-0.5 text-[9px] font-mono font-bold text-[#34d399]">
            AGENT ACTIVITY
          </span>
          <span className="inline-flex items-center gap-1.5 text-[8.5px] font-mono font-bold text-slate-400">
            <span className={`h-1.5 w-1.5 rounded-full ${
              snapshot.agent.state === "working" ? "bg-[#34d399] animate-spin" :
              snapshot.agent.state === "thinking" ? "bg-[#00f0ff] animate-ping" :
              snapshot.agent.state === "verifying" ? "bg-[#bd93f9] animate-pulse" :
              "bg-slate-600"
            }`} style={{ animationDuration: "3s" }} />
            {snapshot.agent.state.toUpperCase()}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-300">
          {snapshot.agent.summary || (latestAgentEvent ? `Last agent event: ${latestAgentEvent.actor.name}${latestAgentEvent.actor.skill ? ` / ${latestAgentEvent.actor.skill}` : ""} ${latestAgentEvent.type}.` : "No recent OpenNori agent activity.")}
        </p>
        {snapshot.current_gap && (
          <div className="mt-2 border-t border-slate-800/80 pt-1.5">
            <span className="block text-[8px] font-mono font-bold text-[#ff00a0] uppercase tracking-wider">CURRENT AC</span>
            <div className="flex items-center gap-1 text-[10px] text-slate-300 font-semibold mt-0.5">
              <span className="text-[#ff00a0] font-mono shrink-0">[{snapshot.current_gap.id}]</span>
              <span className="truncate">{snapshot.current_gap.label}</span>
            </div>
          </div>
        )}
      </div>

      {hasCurrentGoal && (
        <div className="rounded-lg border-l-[3.5px] border-l-[#bd93f9] border border-[rgba(189,147,249,0.12)] bg-[rgba(8,9,20,0.85)] p-3 shadow-2xl backdrop-blur-md text-left">
          <div className="flex items-center justify-between mb-1.5">
            <span className="inline-flex items-center gap-1 rounded bg-[#bd93f9]/10 px-2 py-0.5 text-[9px] font-mono font-bold text-[#bd93f9]">
              ARCHITECTURE COMPLIANCE
            </span>
            <span className={`inline-flex items-center gap-1.5 text-[8.5px] font-mono font-bold ${architectureDecisionClass(snapshot.architecture.decision)}`}>
              {formatSignal(snapshot.architecture.decision)}
            </span>
          </div>
          <div className="text-[10px] text-slate-300 leading-normal flex flex-col gap-1">
            <div>
              <span className="text-slate-500 font-mono text-[8px] block">ACTIVE PROFILE</span>
              <strong className="text-slate-200 font-bold">{snapshot.architecture.profile_title || snapshot.architecture.profile || "none"}</strong>
            </div>
            {Number(snapshot.architecture.open_challenges || 0) > 0 && (
              <div className="mt-1 rounded bg-rose-500/10 border border-rose-500/20 p-1.5 text-[9px] text-rose-400 font-semibold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
                <span>{snapshot.architecture.open_challenges} ACTIVE ARCHITECTURE CHALLENGES</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
