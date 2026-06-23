import type { RadarLink } from "./radar-types.js";
import type { RadarNode } from "./types.js";

const movingAgentStates = new Set(["thinking", "working", "verifying"]);
const passedStatuses = new Set(["passing", "waived"]);
const failingStatuses = new Set(["failing", "broken", "invalid", "blocked", "challenged"]);
const pendingStatuses = new Set(["pending", "review", "draft", "waiting_user", "needs_evidence"]);

export function isMovingAgentState(state: string | undefined): boolean {
  return movingAgentStates.has(normalizeStatus(state));
}

export function isPassed(status: string | undefined): boolean {
  return passedStatuses.has(normalizeStatus(status));
}

export function getNodeColor(status: string, type: RadarNode["type"]): string {
  if (type === "goal") return "#00f0ff";
  if (type === "ac" && status === "passed_group") return "#34d399";

  const cleanStatus = normalizeStatus(status);
  if (passedStatuses.has(cleanStatus)) return "#34d399";
  if (failingStatuses.has(cleanStatus)) return "#f87171";
  if (pendingStatuses.has(cleanStatus)) return "#fbbf24";
  return "#94a3b8";
}

export function getNodePulseClass(status: string, type: RadarNode["type"], animate: boolean): string {
  if (!animate) return "";
  if (type === "goal") return "pulse-cyan";
  if (type === "ac" && status === "passed_group") return "pulse-success";

  const cleanStatus = normalizeStatus(status);
  if (passedStatuses.has(cleanStatus)) return "pulse-success";
  if (pendingStatuses.has(cleanStatus)) return "pulse-warning";
  return "";
}

export function getRadarLinkStyle(link: RadarLink, goalId: string) {
  const isToPassed = link.targetId === "passed-group";

  return {
    isToPassed,
    strokeColor: isToPassed ? "url(#neon-cyan-green)" : "url(#neon-cyan-violet)",
    strokeWidth: isToPassed ? 4.5 : link.sourceId === goalId ? 2.5 : 1.5,
    baseStroke: isToPassed ? "rgba(52, 211, 153, 0.08)" : "rgba(189, 147, 249, 0.08)",
    opacity: isToPassed ? 0.95 : link.isMoving ? 0.85 : 0.5
  };
}

function normalizeStatus(status: string | undefined): string {
  return String(status || "").toLowerCase();
}
