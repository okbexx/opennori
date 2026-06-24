import type { NoriEvent, NoriSnapshot, RadarNode } from "./types.js";

export type ConnectionState = "connecting" | "live" | "retrying";
export type DrawerTab = "visual" | "json";

const RUNNING_AGENT_STATES = new Set(["thinking", "working", "verifying"]);

export function isAgentRunning(snapshot: NoriSnapshot | null): boolean {
  return !!snapshot && RUNNING_AGENT_STATES.has(String(snapshot.agent.state));
}

export function snapshotRenderKey(snapshot: NoriSnapshot): string {
  return JSON.stringify({
    ...snapshot,
    generated_at: undefined
  });
}

export function formatSignal(value: string | undefined): string {
  const clean = String(value || "").trim();
  return clean ? clean.replace(/[-_]+/g, " ").toUpperCase() : "UNKNOWN";
}

export function architectureDecisionClass(decision: string): string {
  const clean = String(decision || "").toLowerCase();
  if (["valid", "active", "approved", "complete"].includes(clean)) return "text-[#34d399]";
  if (["challenged", "invalid", "broken"].includes(clean)) return "text-rose-400 animate-pulse";
  return "text-[#fbbf24]";
}

export function outcomeDecisionClass(decision: string | undefined): string {
  const clean = String(decision || "").toLowerCase();
  if (clean === "complete") return "border-[#34d399]/25 bg-[#34d399]/10 text-[#34d399]";
  if (clean === "review_risk") return "border-[#fbbf24]/30 bg-[#fbbf24]/10 text-[#fbbf24]";
  if (clean === "no_active_goal") return "border-[#00f0ff]/25 bg-[#00f0ff]/10 text-[#00f0ff]";
  return "border-rose-400/25 bg-rose-500/10 text-rose-300";
}

export function profileImpactClass(state: string | undefined): string {
  const clean = String(state || "").toLowerCase();
  if (clean === "clear") return "border-[#34d399]/25 bg-[#34d399]/10 text-[#34d399]";
  if (clean === "blocked") return "border-rose-400/25 bg-rose-500/10 text-rose-300";
  if (clean === "review") return "border-[#fbbf24]/30 bg-[#fbbf24]/10 text-[#fbbf24]";
  return "border-[#bd93f9]/25 bg-[#bd93f9]/10 text-[#bd93f9]";
}

export function relativeTime(value: string | undefined): string {
  if (!value) return "not seen";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "not seen";
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 5) return "now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export function buildSuggestedAgentReply(snapshot: NoriSnapshot | null): string {
  if (!snapshot) return "";
  if (snapshot.status === "no_active_goal") {
    return "Use OpenNori for my next goal. Start by drafting a Nori Contract I can review.";
  }
  if (snapshot.need_user) {
    return snapshot.user_action || "Please use OpenNori to record my decision in this agent conversation.";
  }
  return "Use OpenNori to continue from the current gap and record reviewable evidence.";
}

export function sortedRecentEvents(snapshot: NoriSnapshot | null): NoriEvent[] {
  return [...(snapshot?.events || [])].sort((left, right) => Number(right.seq || 0) - Number(left.seq || 0));
}

export function visibleRecentEvents(snapshot: NoriSnapshot | null): NoriEvent[] {
  return sortedRecentEvents(snapshot).filter((event) => event.type !== "dashboard.started");
}

export function findLatestAgentEvent(events: NoriEvent[]): NoriEvent | undefined {
  return events.find((event) => event.actor.kind === "agent");
}

export type DashboardOutcomeRow = {
  label: string;
  value: string;
  detail: string;
  tone: "green" | "amber" | "rose" | "cyan" | "purple";
};

export function dashboardOutcomeRows(snapshot: NoriSnapshot | null): DashboardOutcomeRow[] {
  if (!snapshot) {
    return [
      {
        label: "Goal",
        value: "Loading snapshot",
        detail: "Waiting for the local OpenNori kernel.",
        tone: "cyan"
      }
    ];
  }

  const summary = snapshot.outcome_summary;
  const decisionState = String(summary?.decision.state || snapshot.decision || "");
  const decisionTone = decisionState === "complete" ? "green" : decisionState === "review_risk" ? "amber" : decisionState === "no_active_goal" ? "cyan" : "rose";
  const goalValue = snapshot.goal?.label || "No current Nori Contract";
  const completedCount = (snapshot.criteria || []).filter((criterion) => ["passing", "passed", "waived"].includes(String(criterion.status).toLowerCase())).length;
  const totalCount = snapshot.criteria?.length || 0;
  const currentGapLabel = summary?.current_gap.id
    ? `${summary.current_gap.id}: ${summary.current_gap.label}`
    : summary?.current_gap.label || "No current acceptance gap";

  return [
    {
      label: "Goal",
      value: goalValue,
      detail: totalCount > 0
        ? `${completedCount}/${totalCount} acceptance checks have passing or waived evidence.`
        : snapshot.idle_summary?.message || "OpenNori is waiting for an approved Nori Contract.",
      tone: snapshot.goal ? "cyan" : "purple"
    },
    {
      label: "Decision",
      value: summary?.decision.label || formatSignal(snapshot.decision),
      detail: summary?.decision.detail || "No completion decision is available yet.",
      tone: decisionTone
    },
    {
      label: "Current gap",
      value: currentGapLabel,
      detail: summary?.current_gap.detail || "Approve a Nori Contract before OpenNori can track current gaps.",
      tone: summary?.current_gap.id ? "rose" : "green"
    },
    {
      label: summary?.need_user.required ? "Need user" : "Agent can continue",
      value: summary?.need_user.required ? "Reply in agent chat" : "No user action needed",
      detail: summary?.next.action || "Ask the agent to continue with OpenNori.",
      tone: summary?.need_user.required ? "amber" : "green"
    },
    {
      label: "Project Profile",
      value: summary?.profile.label || "Project Profile",
      detail: summary?.profile.scope === "project_only"
        ? "Project-level preferences are loaded. Compliance waits for a current goal."
        : summary?.profile.detail || "Project-level preferences are evaluated against the current goal only.",
      tone: summary?.profile.state === "blocked" ? "rose" : summary?.profile.state === "review" ? "amber" : summary?.profile.state === "clear" ? "green" : "purple"
    }
  ];
}

export function inspectedNodeTitle(node: RadarNode | null): string {
  if (!node) return "";
  if (node.type === "goal" && (node.rawData as { empty_state?: boolean } | null)?.empty_state) return "NORI STATE";
  if (node.type === "goal") return `GOAL: ${node.id}`;
  return `${node.type.toUpperCase()}: ${node.label}`;
}
