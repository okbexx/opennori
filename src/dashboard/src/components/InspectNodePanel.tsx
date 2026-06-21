import { useState } from "react";
import {
  Compass,
  CheckCircle2,
  HelpCircle,
  Clock,
  ArrowUpRight,
  Copy,
  Check,
  FileText,
  Globe,
  ListChecks,
  ShieldAlert
} from "lucide-react";
import type { RadarNode } from "../types";
import type { CapabilityProfile, EvidenceRecord, ProfileCompliance } from "../types";

/* 简体中文：定义可视化节点视图组件的参数属性 */
type InspectNodePanelProps = {
  node: RadarNode;
};

/* 简体中文：一键复制代码的小工具 */
function CopyableCommand({ cmd }: { cmd: string }) {
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

function formatSignal(value: string | undefined): string {
  const clean = String(value || "").trim();
  return clean ? clean.replace(/[-_]+/g, " ").toUpperCase() : "UNKNOWN";
}

function criterionConfidenceLabel(confidence: string | undefined): string {
  const clean = String(confidence || "").toLowerCase();
  if (clean === "review-required") return "REVIEW NEEDED";
  if (clean === "product-evidence-required") return "PRODUCT EVIDENCE NEEDED";
  if (clean === "human-required") return "HUMAN REVIEW NEEDED";
  if (clean === "verified") return "VERIFIED";
  if (clean === "agent") return "AGENT OBSERVED";
  if (clean === "none") return "NO EVIDENCE";
  return formatSignal(confidence);
}

function confidenceColor(confidence: string | undefined, fallbackColor: string): string {
  const clean = String(confidence || "").toLowerCase();
  if (["review-required", "human-required", "product-evidence-required"].includes(clean)) return "#fbbf24";
  return fallbackColor;
}

function profileStatusColor(status: string | undefined): string {
  const clean = String(status || "").toLowerCase();
  if (clean === "satisfied" || clean === "waived") return "#34d399";
  if (clean === "violated") return "#f87171";
  return "#fbbf24";
}

function profileStrengthColor(strength: string | undefined): string {
  const clean = String(strength || "").toLowerCase();
  if (clean === "must") return "#f87171";
  if (clean === "avoid") return "#fbbf24";
  return "#00f0ff";
}

function DossierPathList({ title, paths }: { title: string; paths: Array<{ label: string; value?: string }> }) {
  const visiblePaths = paths.filter((item) => item.value);
  if (visiblePaths.length === 0) return null;

  return (
    <div className="rounded border border-[#00f0ff]/12 bg-[#00f0ff]/5 p-2.5">
      <span className="mb-1.5 block text-[8px] font-bold uppercase tracking-wider text-[#00f0ff]/80">{title}</span>
      <div className="flex flex-col gap-1">
        {visiblePaths.map((item) => (
          <div key={`${item.label}:${item.value}`} className="grid grid-cols-[78px_1fr] gap-2 rounded bg-black/20 px-2 py-1.5 text-[10px] leading-snug">
            <span className="font-mono uppercase text-slate-500">{item.label}</span>
            <span className="break-all font-mono text-slate-300">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InspectNodePanel({ node }: InspectNodePanelProps) {
  // 1. 简体中文：Goal 目标的只读面板渲染
  if (node.type === "goal") {
    const rawGoal = node.rawData as {
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
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold ${isCompleted ? "bg-[#34d399]/10 text-[#34d399]" : "bg-[#fbbf24]/10 text-[#fbbf24]"}`}>
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
          This is the primary Nori Contract dossier that OpenNori is observing. The dashboard reads the generated review files and structured JSON state, but it does not approve, waive, or write acceptance data.
        </div>
      </div>
    );
  }

  // 2. 简体中文：已通过 Passed 聚合节点的只读面板渲染
  if (node.id === "passed-group") {
    const rawGroup = node.rawData as {
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
        
        {/* 滚动列表 */}
        <div className="flex-1 overflow-auto scrollbar-hover-visible flex flex-col gap-2 pr-1 min-h-0 max-h-full select-text">
          {rawGroup.criteria.map((ac) => (
            <div key={ac.id} className={`group relative rounded border bg-slate-950/20 p-2.5 transition hover:border-[#34d399]/30 hover:bg-[#34d399]/2 ${
              rawGroup.focused_id === ac.id ? "border-[#00f0ff]/45 shadow-[0_0_0_1px_rgba(0,240,255,0.12)]" : "border-slate-900"
            }`}>
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

  // 3. 简体中文：Project Profile 只读面板，不提供任何写状态动作
  if (node.type === "profile") {
    const rawProfile = node.rawData as {
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
    const hasCurrentGoal = rawProfile.scope === "current_goal_compliance";
    const profile = rawProfile.profile || { items: [] };
    const compliance = rawProfile.compliance || {
      required: false,
      complete: true,
      blocking: [],
      review: [],
      statuses: []
    };
    const counts = profile.items.reduce<Record<"total" | "must" | "prefer" | "avoid", number>>((acc, item) => {
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
    }, { total: 0, must: 0, prefer: 0, avoid: 0 });
    const statusById = new Map(compliance.statuses.map((row) => [row.id, row]));
    const panelColor = !hasCurrentGoal ? "#94a3b8" : compliance.complete ? "#34d399" : "#fbbf24";
    const complianceLabel = !hasCurrentGoal ? "NOT EVALUATED" : compliance.complete ? "COMPLETE" : "NEEDS REVIEW";

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
              <span className="block text-[8px] font-mono uppercase text-slate-500">compliance</span>
              <span className="text-xs font-mono font-bold" style={{ color: panelColor }}>
                {complianceLabel}
              </span>
            </div>
          </div>
        </div>

        {!hasCurrentGoal && (
          <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Project Profile Loaded</span>
            <p className="text-xs leading-relaxed text-slate-300">
              Project Profile is configured at project level. There is no current Nori Contract right now, so OpenNori is not evaluating compliance for a goal.
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
                          <span className="rounded px-1.5 py-0.5 text-[8px] font-mono font-bold" style={{ color: strengthColor, backgroundColor: `${strengthColor}14` }}>
                            {String(item.strength || "prefer").toUpperCase()}
                          </span>
                          <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[8px] font-mono font-bold text-slate-400">
                            {String(item.type || "constraint").toUpperCase()}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-200">{item.name}</p>
                      </div>
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[8px] font-mono font-bold" style={{ color: statusColor, backgroundColor: `${statusColor}14` }}>
                        {formatSignal(status)}
                      </span>
                    </div>

                    {item.purpose && (
                      <p className="text-[11px] leading-relaxed text-slate-300">{item.purpose}</p>
                    )}

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
              <p className="text-xs font-semibold text-slate-400">
                {hasCurrentGoal ? "No Project Profile items configured." : "No Project Profile items configured."}
              </p>
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

  // 4. 简体中文：普通单个 AC 节点的只读面板渲染
  if (node.type === "ac") {
    const ac = node.rawData as {
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
            <div className="grid h-8 w-8 place-items-center rounded bg-slate-900 text-xs font-mono font-bold" style={{ color: displayColor, backgroundColor: `${displayColor}12` }}>
              {ac.id.replace("AC-", "")}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400">CRITERION DATA</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold" style={{ color: color, backgroundColor: `${color}12` }}>
                  {cleanStatus.toUpperCase()}
                </span>
                {ac.required && (
                  <span className="rounded bg-rose-500/10 px-1 py-0.5 text-[8px] font-mono font-bold text-rose-400">REQUIRED</span>
                )}
                {hasReviewRisk && (
                  <span className="rounded bg-[#fbbf24]/10 px-1 py-0.5 text-[8px] font-mono font-bold text-[#fbbf24]">REVIEW RISK</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-[8px] font-mono text-slate-500 uppercase">review signal</span>
            <span className="text-xs font-mono font-bold" style={{ color: displayColor }}>{confidenceText}</span>
          </div>
        </div>

        {/* 滚动区域 */}
        <div className="flex-1 overflow-auto scrollbar-hover-visible pr-1 flex flex-col gap-3 min-h-0 max-h-full">
          {/* User Story */}
          <div className="rounded border border-slate-900 bg-slate-950/40 p-3">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">User Story</span>
            <p className="text-xs leading-relaxed text-slate-200 font-medium">{ac.user_story}</p>
          </div>

          {/* Measurement & Threshold */}
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

          {/* Evidence List */}
          <div className="mt-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Evidence ledger ({ac.evidence?.length || 0})</span>
            {ac.evidence && ac.evidence.length > 0 ? (
              <div className="flex flex-col gap-2">
                {ac.evidence.map((ev) => {
                  const evPass = ["passing", "waived"].includes(String(ev.result || "").toLowerCase());
                  const evKind = String(ev.kind || "unknown");
                  const evResult = String(ev.result || "unknown");
                  const evKey = [
                    ev.created_at,
                    ev.kind,
                    ev.result,
                    ev.summary
                  ].filter(Boolean).join(":");

                  return (
                    <div key={evKey} className="rounded border border-slate-900/60 bg-black/20 p-2.5">
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="text-[9px] font-mono text-slate-500">[{evKind.toUpperCase()}]</span>
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded ${evPass ? "bg-[#34d399]/10 text-[#34d399]" : "bg-rose-500/10 text-rose-400"}`}>
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

  // 5. 简体中文：Evidence 证据节点的只读面板渲染
  if (node.type === "evidence") {
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
                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold ${isPass ? "bg-[#34d399]/10 text-[#34d399]" : "bg-rose-500/10 text-rose-400"}`}>
                  {evResult.toUpperCase()}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">ID: {node.label}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-[8px] font-mono text-slate-500 uppercase">confidence</span>
            <span className="text-xs font-mono font-bold" style={{ color: resultColor }}>{evConfidence.toUpperCase()}</span>
          </div>
        </div>

        {/* 滚动区域 */}
        <div className="flex-1 overflow-auto scrollbar-hover-visible pr-1 flex flex-col gap-3 min-h-0 max-h-full">
          {/* Metadata badges */}
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

          {/* Evidence Summary */}
          <div className="rounded border border-slate-900 bg-slate-950/40 p-3">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Evidence Summary</span>
            <p className="text-xs leading-relaxed text-slate-200 font-medium italic">"{ev.summary}"</p>
          </div>

          {/* Sources */}
          {ev.sources && ev.sources.length > 0 && (
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Sources of evidence ({ev.sources.length})</span>
              <div className="flex flex-col gap-2">
                {ev.sources.map((src) => {
                  const srcType = String(src.type || "");
                  const srcLabel = String(src.label || "source");
                  const srcCommand = String(src.command || "");
                  const srcPath = String(src.path || "");
                  const srcUrl = String(src.url || "");
                  const srcKey = [
                    srcType,
                    srcLabel,
                    srcCommand,
                    srcPath,
                    srcUrl
                  ].filter(Boolean).join(":");

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

          {/* Reviewability */}
          {ev.reviewability && (
            <div className="rounded border border-slate-900 bg-slate-950/20 p-2.5">
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <HelpCircle size={10} className="text-[#34d399]" />
                How to review manually
              </span>
              <p className="text-[11px] leading-relaxed text-slate-300">{ev.reviewability}</p>
            </div>
          )}

          {/* Limitations */}
          {ev.limitations && (
            <div className="rounded border border-rose-950/30 bg-rose-950/10 p-2.5">
              <span className="block text-[8px] font-bold uppercase tracking-wider text-rose-400 mb-1 flex items-center gap-1">
                <ShieldAlert size={10} />
                Evidence limitation risk
              </span>
              <p className="text-[11px] leading-relaxed text-rose-300 font-medium">{ev.limitations}</p>
            </div>
          )}

          {/* Date */}
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

  // 默认兜底
  return <div className="text-xs text-slate-500 italic text-center p-8">No inspect layout defined for this node.</div>;
}
