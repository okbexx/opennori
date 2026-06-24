import { ListChecks } from "lucide-react";
import type { CapabilityProfile, ProfileCompliance, RadarNode } from "../../types";
import { formatSignal, profileStatusColor, profileStrengthColor } from "./InspectShared";

type ProfileRawData = {
  scope?: "current_goal_compliance" | "project_only" | string;
  idle_summary?: {
    last_goal?: {
      id: string;
      label: string;
      report_path?: string;
    };
  };
  profile?: CapabilityProfile;
  compliance?: ProfileCompliance;
};

export function ProfileInspectPanel({ node }: { node: RadarNode }) {
  const rawProfile = node.rawData as ProfileRawData;
  const hasCurrentGoal = rawProfile.scope === "current_goal_compliance";
  const profile = rawProfile.profile || { items: [] };
  const compliance = rawProfile.compliance || {
    required: false,
    complete: true,
    blocking: [],
    review: [],
    statuses: []
  };
  const counts = profile.items.reduce<Record<"total" | "must" | "prefer" | "avoid", number>>(
    (acc, item) => {
      acc.total += 1;
      switch (item.strength) {
        case "must":
          acc.must += 1;
          break;
        case "prefer":
          acc.prefer += 1;
          break;
        case "avoid":
          acc.avoid += 1;
          break;
        default:
          break;
      }
      return acc;
    },
    { total: 0, must: 0, prefer: 0, avoid: 0 }
  );
  const statusById = new Map(compliance.statuses.map((row) => [row.id, row]));
  const panelColor = !hasCurrentGoal ? "#94a3b8" : compliance.complete ? "#34d399" : "#fbbf24";
  const complianceLabel = !hasCurrentGoal ? "NOT EVALUATED" : compliance.complete ? "COMPLETE" : "NEEDS REVIEW";
  const completionImpact = !hasCurrentGoal
    ? "Project Profile is loaded, but there is no current Nori Contract to evaluate yet."
    : compliance.blocking.length > 0
      ? "Project Profile is blocking completion until the agent records satisfaction evidence, revises the work, or the user waives the violation in the agent conversation."
      : compliance.review.length > 0
        ? "Project Profile does not hard-block completion yet, but the user should review the listed preference risks before accepting the goal."
        : "Project Profile does not block the current completion decision.";

  return (
    <div className="flex h-full max-h-full min-h-0 select-text flex-col gap-3 overflow-hidden text-left">
      <div className="rounded-lg border bg-slate-950/30 p-3" style={{ borderColor: `${panelColor}25` }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded bg-[#00f0ff]/10 text-[#00f0ff]">
              <ListChecks size={17} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400">PROJECT PROFILE</span>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[8px] font-mono font-bold text-slate-300">
                  ITEMS {counts.total}
                </span>
                <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[8px] font-mono font-bold text-rose-300">
                  MUST {counts.must || 0}
                </span>
                <span className="rounded bg-[#00f0ff]/10 px-1.5 py-0.5 text-[8px] font-mono font-bold text-[#00f0ff]">
                  PREFER {counts.prefer || 0}
                </span>
                <span className="rounded bg-[#fbbf24]/10 px-1.5 py-0.5 text-[8px] font-mono font-bold text-[#fbbf24]">
                  AVOID {counts.avoid || 0}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-[8px] font-mono uppercase text-slate-500">{hasCurrentGoal ? "goal compliance" : "project source"}</span>
            <span className="text-xs font-mono font-bold" style={{ color: panelColor }}>
              {complianceLabel}
            </span>
          </div>
        </div>
        <div className="mt-2 rounded border border-slate-900/80 bg-black/20 p-2">
          <span className="block text-[8px] font-mono font-bold uppercase tracking-wider text-slate-500">
            Completion impact
          </span>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
            {completionImpact}
          </p>
        </div>
      </div>

      {!hasCurrentGoal && (
        <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Project Profile Loaded</span>
          <p className="text-xs leading-relaxed text-slate-300">
            Project Profile is configured at project level. There is no current Nori Contract right now, so OpenNori is not evaluating
            compliance for a goal.
          </p>
          {rawProfile.idle_summary?.last_goal ? (
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Last outcome: <span className="font-semibold text-slate-300">{rawProfile.idle_summary.last_goal.label}</span>
            </p>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded border border-rose-500/15 bg-rose-500/5 p-2.5">
          <span className="block text-[8px] font-bold uppercase tracking-wider text-rose-300">Blocking</span>
          <span className="mt-1 block text-2xl font-black text-rose-300">{compliance.blocking.length}</span>
        </div>
        <div className="rounded border border-[#fbbf24]/15 bg-[#fbbf24]/5 p-2.5">
          <span className="block text-[8px] font-bold uppercase tracking-wider text-[#fbbf24]">Review</span>
          <span className="mt-1 block text-2xl font-black text-[#fbbf24]">{compliance.review.length}</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto pr-1 scrollbar-hover-visible">
        {profile.items.length > 0 ? (
          <div className="flex flex-col gap-2">
            {profile.items.map((item) => {
              const row = statusById.get(item.id);
              const status = row?.status || "unknown";
              const statusColor = profileStatusColor(status);
              const strengthColor = profileStrengthColor(item.strength);
              return (
                <div key={item.id} className="rounded border border-slate-900/80 bg-black/20 p-2.5">
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className="rounded px-1.5 py-0.5 text-[8px] font-mono font-bold"
                          style={{ color: strengthColor, backgroundColor: `${strengthColor}14` }}
                        >
                          {String(item.strength || "prefer").toUpperCase()}
                        </span>
                        <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[8px] font-mono font-bold text-slate-400">
                          {String(item.type || "constraint").toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-200">{item.name}</p>
                    </div>
                    <span
                      className="shrink-0 rounded px-1.5 py-0.5 text-[8px] font-mono font-bold"
                      style={{ color: statusColor, backgroundColor: `${statusColor}14` }}
                    >
                      {formatSignal(status)}
                    </span>
                  </div>

                  {item.purpose && <p className="text-[11px] leading-relaxed text-slate-300">{item.purpose}</p>}

                  <div className="mt-2 grid grid-cols-1 gap-1.5 text-[10px] text-slate-400">
                    <div className="rounded bg-slate-950/30 p-1.5">
                      <span className="font-mono text-[8px] uppercase text-slate-500">scope </span>
                      {item.scope || "<none>"}
                    </div>
                    <div className="rounded bg-slate-950/30 p-1.5">
                      <span className="font-mono text-[8px] uppercase text-slate-500">install policy </span>
                      {item.install_policy || "ask_before_install"}
                    </div>
                    <div className="rounded bg-slate-950/30 p-1.5">
                      <span className="font-mono text-[8px] uppercase text-slate-500">latest evidence </span>
                      {row?.summary || "<none>"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded border border-dashed border-slate-800/80 p-5 text-center">
            <div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded bg-slate-900/70 text-slate-500">
              <ListChecks size={17} />
            </div>
            <p className="text-xs font-semibold text-slate-400">No Project Profile items configured.</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              {hasCurrentGoal
                ? "Required Skills, preferred stacks, and avoided tools will appear here after the agent records them through OpenNori Project Profile."
                : "Ask the agent to record project-level Skills, stacks, constraints, or install policy through OpenNori Project Profile."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
