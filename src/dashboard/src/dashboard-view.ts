import type { NoriEvent, NoriSnapshot, RadarNode } from "./types";

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

export function findLatestAgentEvent(events: NoriEvent[]): NoriEvent | undefined {
  return events.find((event) => event.actor.kind === "agent");
}

export function inspectedNodeTitle(node: RadarNode | null): string {
  if (!node) return "";
  if (node.type === "goal" && (node.rawData as { empty_state?: boolean } | null)?.empty_state) return "NORI STATE";
  if (node.type === "goal") return `GOAL: ${node.id}`;
  return `${node.type.toUpperCase()}: ${node.label}`;
}
