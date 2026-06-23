import { criteriaAngle } from "./radar-geometry.js";
import { isPassed } from "./radar-status.js";
import type { RadarFrame, RadarLink } from "./radar-types.js";
import type { EvidenceRecord, NoriSnapshot, RadarNode } from "./types.js";

type RadarCollections = {
  nodes: RadarNode[];
  links: RadarLink[];
};

type PositionedNodeInput = Pick<RadarFrame, "centerX" | "centerY" | "baseSize">;

export function goalNodeFromSnapshot(snapshot: NoriSnapshot | null, frame: Pick<RadarFrame, "centerX" | "centerY">): RadarNode {
  const hasGoal = !!(snapshot && snapshot.status === "active" && snapshot.goal);
  const goal = hasGoal ? snapshot?.goal : null;
  return {
    id: goal?.id || "no-current-goal",
    type: "goal",
    label: hasGoal ? "Goal" : "Ready",
    x: frame.centerX,
    y: frame.centerY,
    status: goal?.workflow_status || "idle",
    rawData: goal || {
      empty_state: true,
      idle_summary: snapshot?.idle_summary,
      message: snapshot?.idle_summary?.message || "No current Nori Contract is being observed."
    }
  };
}

export function passedCriteriaRawData(
  criteria: NonNullable<NoriSnapshot["criteria"]>,
  focusedCriterionId?: string
) {
  const passedCriteria = criteria.filter((criterion) => isPassed(criterion.status));
  return {
    title: "Passed Acceptance Criteria List",
    description: "All criteria that have already satisfied the acceptance conditions.",
    focused_id: focusedCriterionId,
    total_completed: passedCriteria.length,
    criteria: passedCriteria.map((criterion) => ({
      id: criterion.id,
      user_story: criterion.user_story,
      measurement: criterion.measurement,
      threshold: criterion.threshold,
      status: criterion.status,
      confidence: criterion.confidence,
      dossier: criterion.dossier
    }))
  };
}

export function profileNodeFromSnapshot(snapshot: NoriSnapshot): RadarNode {
  const profile = snapshot.capability_profile || { items: [] };
  const compliance = snapshot.capability_compliance || {
    required: false,
    complete: true,
    blocking: [],
    review: [],
    statuses: []
  };
  const hasCurrentGoal = snapshot.status === "active" && !!snapshot.goal;
  return {
    id: "profile",
    type: "profile",
    label: "Profile",
    status: hasCurrentGoal ? (compliance.complete ? "satisfied" : "review") : "not_evaluated",
    x: 0,
    y: 0,
    rawData: {
      title: "Project Profile",
      scope: hasCurrentGoal ? "current_goal_compliance" : "project_only",
      idle_summary: snapshot.idle_summary,
      profile,
      compliance
    }
  };
}

export function renderedCriterionNodeFromSnapshot(snapshot: NoriSnapshot, criterionId: string): RadarNode | null {
  const criterion = snapshot.criteria?.find((item) => item.id === criterionId);
  if (!criterion) return null;
  const criteria = snapshot.criteria || [];
  if (isPassed(criterion.status) && criteria.some((item) => isPassed(item.status))) {
    return {
      id: "passed-group",
      type: "ac",
      label: "Passed",
      subLabel: String(criteria.filter((item) => isPassed(item.status)).length),
      status: "passed_group",
      x: 0,
      y: 0,
      rawData: passedCriteriaRawData(criteria, criterionId)
    };
  }
  return {
    id: `ac-${criterion.id}`,
    type: "ac",
    label: criterion.id,
    status: criterion.status,
    x: 0,
    y: 0,
    rawData: criterion
  };
}

export function appendCriteriaNetwork(input: RadarCollections & PositionedNodeInput & {
  criteria: NonNullable<NoriSnapshot["criteria"]>;
  goalId: string;
  isAgentActive: boolean;
}) {
  const passedAc = input.criteria.filter((criterion) => isPassed(criterion.status));
  const unpassedAc = input.criteria.filter((criterion) => !isPassed(criterion.status));
  const hasPassedGroup = passedAc.length > 0;

  if (hasPassedGroup) {
    appendPassedGroup({
      nodes: input.nodes,
      links: input.links,
      passedAc,
      goalId: input.goalId,
      centerX: input.centerX,
      centerY: input.centerY,
      baseSize: input.baseSize
    });
  }

  appendUnpassedCriteria({
    nodes: input.nodes,
    links: input.links,
    unpassedAc,
    hasPassedGroup,
    goalId: input.goalId,
    centerX: input.centerX,
    centerY: input.centerY,
    baseSize: input.baseSize,
    isAgentActive: input.isAgentActive
  });
}

function appendPassedGroup(input: RadarCollections & PositionedNodeInput & {
  passedAc: NonNullable<NoriSnapshot["criteria"]>;
  goalId: string;
}) {
  const passedNodeId = "passed-group";
  const passedR = input.baseSize * 0.3;
  const passedX = input.centerX - passedR;

  input.nodes.push({
    id: passedNodeId,
    type: "ac",
    label: "Passed",
    subLabel: String(input.passedAc.length),
    x: passedX,
    y: input.centerY,
    status: "passed_group",
    radius: 40,
    rawData: passedCriteriaRawData(input.passedAc)
  });

  input.links.push({
    id: `${input.goalId}-${passedNodeId}`,
    sourceId: input.goalId,
    targetId: passedNodeId,
    x1: input.centerX,
    y1: input.centerY,
    x2: passedX,
    y2: input.centerY,
    isMoving: false
  });
}

function appendUnpassedCriteria(input: RadarCollections & PositionedNodeInput & {
  unpassedAc: NonNullable<NoriSnapshot["criteria"]>;
  hasPassedGroup: boolean;
  goalId: string;
  isAgentActive: boolean;
}) {
  const unpassedCount = input.unpassedAc.length;
  const acRadius = unpassedCount > 8 ? 26 : 34;

  for (const [acIdx, criterion] of input.unpassedAc.entries()) {
    const theta = criteriaAngle(acIdx, unpassedCount, input.hasPassedGroup);
    const isOuter = acIdx % 2 === 1;
    const currentAcR = isOuter ? input.baseSize * 0.35 : input.baseSize * 0.24;
    const acX = input.centerX + currentAcR * Math.cos(theta);
    const acY = input.centerY + currentAcR * Math.sin(theta);
    const acNodeId = `ac-${criterion.id}`;

    input.nodes.push({
      id: acNodeId,
      type: "ac",
      label: criterion.id,
      x: acX,
      y: acY,
      status: criterion.status,
      radius: acRadius,
      rawData: criterion
    });

    input.links.push({
      id: `${input.goalId}-${acNodeId}`,
      sourceId: input.goalId,
      targetId: acNodeId,
      x1: input.centerX,
      y1: input.centerY,
      x2: acX,
      y2: acY,
      isMoving: input.isAgentActive
    });

    appendEvidenceNodes({
      nodes: input.nodes,
      links: input.links,
      evidence: criterion.evidence || [],
      criterionId: criterion.id,
      criterionNodeId: acNodeId,
      criterionX: acX,
      criterionY: acY,
      theta,
      isOuter,
      centerX: input.centerX,
      centerY: input.centerY,
      baseSize: input.baseSize,
      isAgentActive: input.isAgentActive
    });
  }
}

function appendEvidenceNodes(input: RadarCollections & PositionedNodeInput & {
  evidence: EvidenceRecord[];
  criterionId: string;
  criterionNodeId: string;
  criterionX: number;
  criterionY: number;
  theta: number;
  isOuter: boolean;
  isAgentActive: boolean;
}) {
  const evSectorWidth = 0.35;

  for (const [evIdx, evidence] of input.evidence.entries()) {
    const phi = input.evidence.length > 1
      ? input.theta - evSectorWidth / 2 + (evIdx / (input.evidence.length - 1)) * evSectorWidth
      : input.theta;
    const evR = input.isOuter ? input.baseSize * 0.46 : input.baseSize * 0.4;
    const evX = input.centerX + evR * Math.cos(phi);
    const evY = input.centerY + evR * Math.sin(phi);
    const evNodeId = `ev-${input.criterionId}-${evIdx}`;

    input.nodes.push({
      id: evNodeId,
      type: "evidence",
      label: `E-${evIdx + 1}`,
      x: evX,
      y: evY,
      status: evidence.result || "unknown",
      radius: 18,
      rawData: evidence
    });

    input.links.push({
      id: `${input.criterionNodeId}-${evNodeId}`,
      sourceId: input.criterionNodeId,
      targetId: evNodeId,
      x1: input.criterionX,
      y1: input.criterionY,
      x2: evX,
      y2: evY,
      isMoving: input.isAgentActive && evidence.result !== "passing"
    });
  }
}
