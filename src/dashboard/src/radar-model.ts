import type { EvidenceRecord, NoriSnapshot, RadarNode } from "./types.js";

export type RadarDimensions = {
  width: number;
  height: number;
};

export type RadarLink = {
  id: string;
  sourceId: string;
  targetId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isMoving: boolean;
};

export type RadarCircle = {
  id: string;
  x: number;
  y: number;
  radius: number;
  isOuter: boolean;
};

export type RadarSpoke = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type RadarModel = {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  baseSize: number;
  sweepSize: number;
  goalId: string;
  currentGapNodeId: string | null;
  isAgentActive: boolean;
  nodes: RadarNode[];
  links: RadarLink[];
  grid: {
    circles: RadarCircle[];
    spokes: RadarSpoke[];
  };
};

const movingAgentStates = new Set(["thinking", "working", "verifying"]);
const passedStatuses = new Set(["passing", "waived"]);
const failingStatuses = new Set(["failing", "broken", "invalid", "blocked", "challenged"]);
const pendingStatuses = new Set(["pending", "review", "draft", "waiting_user", "needs_evidence"]);

export function isPassed(status: string): boolean {
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

export function buildAcceptanceRadarModel(snapshot: NoriSnapshot | null, dimensions: RadarDimensions): RadarModel {
  const width = dimensions.width || 800;
  const height = dimensions.height || 600;
  const centerX = width / 2;
  const centerY = height / 2;
  const baseSize = Math.min(width, height);
  const sweepSize = baseSize * 0.92;
  const nodes: RadarNode[] = [];
  const links: RadarLink[] = [];
  const hasGoal = !!(snapshot && snapshot.status === "active" && snapshot.goal);
  const isAgentActive = !!(snapshot && movingAgentStates.has(snapshot.agent.state));
  const goal = hasGoal ? snapshot?.goal : null;
  const goalId = goal?.id || "no-current-goal";

  nodes.push({
    id: goalId,
    type: "goal",
    label: hasGoal ? "Goal" : "Ready",
    x: centerX,
    y: centerY,
    status: goal?.workflow_status || "idle",
    rawData: goal || {
      empty_state: true,
      idle_summary: snapshot?.idle_summary,
      message: snapshot?.idle_summary?.message || "No current Nori Contract is being observed."
    }
  });

  if (hasGoal && snapshot.criteria) {
    appendCriteriaNetwork({
      nodes,
      links,
      criteria: snapshot.criteria,
      goalId,
      centerX,
      centerY,
      baseSize,
      isAgentActive
    });
  }

  return {
    width,
    height,
    centerX,
    centerY,
    baseSize,
    sweepSize,
    goalId,
    currentGapNodeId: snapshot?.current_gap?.id ? `ac-${snapshot.current_gap.id}` : null,
    isAgentActive,
    nodes,
    links,
    grid: buildRadarGrid({ centerX, centerY, baseSize })
  };
}

function appendCriteriaNetwork({
  nodes,
  links,
  criteria,
  goalId,
  centerX,
  centerY,
  baseSize,
  isAgentActive
}: {
  nodes: RadarNode[];
  links: RadarLink[];
  criteria: NonNullable<NoriSnapshot["criteria"]>;
  goalId: string;
  centerX: number;
  centerY: number;
  baseSize: number;
  isAgentActive: boolean;
}) {
  const passedAc = criteria.filter((ac) => isPassed(ac.status));
  const unpassedAc = criteria.filter((ac) => !isPassed(ac.status));
  const hasPassedGroup = passedAc.length > 0;

  if (hasPassedGroup) {
    appendPassedGroup({ nodes, links, passedAc, goalId, centerX, centerY, baseSize });
  }

  appendUnpassedCriteria({
    nodes,
    links,
    unpassedAc,
    hasPassedGroup,
    goalId,
    centerX,
    centerY,
    baseSize,
    isAgentActive
  });
}

function appendPassedGroup({
  nodes,
  links,
  passedAc,
  goalId,
  centerX,
  centerY,
  baseSize
}: {
  nodes: RadarNode[];
  links: RadarLink[];
  passedAc: NonNullable<NoriSnapshot["criteria"]>;
  goalId: string;
  centerX: number;
  centerY: number;
  baseSize: number;
}) {
  const passedNodeId = "passed-group";
  const passedR = baseSize * 0.3;
  const passedX = centerX - passedR;

  nodes.push({
    id: passedNodeId,
    type: "ac",
    label: "Passed",
    subLabel: String(passedAc.length),
    x: passedX,
    y: centerY,
    status: "passed_group",
    radius: 40,
    rawData: {
      title: "Passed Acceptance Criteria List",
      description: "All criteria that have already satisfied the acceptance conditions.",
      total_completed: passedAc.length,
      criteria: passedAc.map((ac) => ({
        id: ac.id,
        user_story: ac.user_story,
        measurement: ac.measurement,
        threshold: ac.threshold,
        status: ac.status,
        confidence: ac.confidence,
        dossier: ac.dossier
      }))
    }
  });

  links.push({
    id: `${goalId}-${passedNodeId}`,
    sourceId: goalId,
    targetId: passedNodeId,
    x1: centerX,
    y1: centerY,
    x2: passedX,
    y2: centerY,
    isMoving: false
  });
}

function appendUnpassedCriteria({
  nodes,
  links,
  unpassedAc,
  hasPassedGroup,
  goalId,
  centerX,
  centerY,
  baseSize,
  isAgentActive
}: {
  nodes: RadarNode[];
  links: RadarLink[];
  unpassedAc: NonNullable<NoriSnapshot["criteria"]>;
  hasPassedGroup: boolean;
  goalId: string;
  centerX: number;
  centerY: number;
  baseSize: number;
  isAgentActive: boolean;
}) {
  const unpassedCount = unpassedAc.length;
  const acRadius = unpassedCount > 8 ? 26 : 34;

  for (const [acIdx, ac] of unpassedAc.entries()) {
    const theta = criteriaAngle(acIdx, unpassedCount, hasPassedGroup);
    const isOuter = acIdx % 2 === 1;
    const currentAcR = isOuter ? baseSize * 0.35 : baseSize * 0.24;
    const acX = centerX + currentAcR * Math.cos(theta);
    const acY = centerY + currentAcR * Math.sin(theta);
    const acNodeId = `ac-${ac.id}`;

    nodes.push({
      id: acNodeId,
      type: "ac",
      label: ac.id,
      x: acX,
      y: acY,
      status: ac.status,
      radius: acRadius,
      rawData: ac
    });

    links.push({
      id: `${goalId}-${acNodeId}`,
      sourceId: goalId,
      targetId: acNodeId,
      x1: centerX,
      y1: centerY,
      x2: acX,
      y2: acY,
      isMoving: isAgentActive
    });

    appendEvidenceNodes({
      nodes,
      links,
      evidence: ac.evidence || [],
      criterionId: ac.id,
      criterionNodeId: acNodeId,
      criterionX: acX,
      criterionY: acY,
      theta,
      isOuter,
      centerX,
      centerY,
      baseSize,
      isAgentActive
    });
  }
}

function appendEvidenceNodes({
  nodes,
  links,
  evidence,
  criterionId,
  criterionNodeId,
  criterionX,
  criterionY,
  theta,
  isOuter,
  centerX,
  centerY,
  baseSize,
  isAgentActive
}: {
  nodes: RadarNode[];
  links: RadarLink[];
  evidence: EvidenceRecord[];
  criterionId: string;
  criterionNodeId: string;
  criterionX: number;
  criterionY: number;
  theta: number;
  isOuter: boolean;
  centerX: number;
  centerY: number;
  baseSize: number;
  isAgentActive: boolean;
}) {
  const evSectorWidth = 0.35;

  for (const [evIdx, ev] of evidence.entries()) {
    const phi = evidence.length > 1
      ? theta - evSectorWidth / 2 + (evIdx / (evidence.length - 1)) * evSectorWidth
      : theta;
    const evR = isOuter ? baseSize * 0.46 : baseSize * 0.4;
    const evX = centerX + evR * Math.cos(phi);
    const evY = centerY + evR * Math.sin(phi);
    const evNodeId = `ev-${criterionId}-${evIdx}`;

    nodes.push({
      id: evNodeId,
      type: "evidence",
      label: `E-${evIdx + 1}`,
      x: evX,
      y: evY,
      status: ev.result || "unknown",
      radius: 18,
      rawData: ev
    });

    links.push({
      id: `${criterionNodeId}-${evNodeId}`,
      sourceId: criterionNodeId,
      targetId: evNodeId,
      x1: criterionX,
      y1: criterionY,
      x2: evX,
      y2: evY,
      isMoving: isAgentActive && ev.result !== "passing"
    });
  }
}

function criteriaAngle(index: number, total: number, hasPassedGroup: boolean): number {
  if (!hasPassedGroup) {
    return (index / total) * Math.PI * 2;
  }

  const sectorStart = -Math.PI * 0.68;
  const sectorEnd = Math.PI * 0.68;
  return total > 1 ? sectorStart + ((sectorEnd - sectorStart) * index) / (total - 1) : 0;
}

function buildRadarGrid({ centerX, centerY, baseSize }: { centerX: number; centerY: number; baseSize: number }) {
  return {
    circles: [0.1, 0.2, 0.3, 0.4, 0.46].map((scale, index) => ({
      id: `grid-circle-${scale}`,
      x: centerX,
      y: centerY,
      radius: baseSize * scale,
      isOuter: index === 4
    })),
    spokes: [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
      const rad = (angle * Math.PI) / 180;
      const rMax = baseSize * 0.46;
      return {
        id: `grid-spoke-${angle}`,
        x1: centerX,
        y1: centerY,
        x2: centerX + rMax * Math.cos(rad),
        y2: centerY + rMax * Math.sin(rad)
      };
    })
  };
}

function normalizeStatus(status: string): string {
  return String(status || "").toLowerCase();
}
