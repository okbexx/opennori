import type { RadarNode } from "./components/AcceptanceRadarNet";
import type { NoriEvent, NoriSnapshot } from "./types";

const RUNNING_AGENT_STATES = new Set(["thinking", "working", "verifying"]);

export function isPassingStatus(status: string | undefined): boolean {
  return ["passing", "waived"].includes(String(status || "").toLowerCase());
}

function passedGroupRawDataWithFocus(criteria: NonNullable<NoriSnapshot["criteria"]>, focusedCriterionId?: string) {
  const passedCriteria = criteria.filter((criterion) => isPassingStatus(criterion.status));
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
      confidence: criterion.confidence
    }))
  };
}

export function profileNodeFromSnapshot(snapshot: NoriSnapshot): RadarNode {
  const profile = snapshot.capability_profile || { items: [], evidence: [] };
  const compliance = snapshot.capability_compliance || {
    required: false,
    complete: true,
    blocking: [],
    review: [],
    statuses: []
  };
  return {
    id: "profile",
    type: "profile",
    label: "Profile",
    status: compliance.complete ? "satisfied" : "review",
    x: 0,
    y: 0,
    rawData: {
      title: "Nori Profile",
      profile,
      compliance
    }
  };
}

export function renderedCriterionNodeFromSnapshot(snapshot: NoriSnapshot, criterionId: string): RadarNode | null {
  const criterion = snapshot.criteria?.find((item) => item.id === criterionId);
  if (!criterion) return null;
  const criteria = snapshot.criteria || [];
  if (isPassingStatus(criterion.status) && criteria.some((item) => isPassingStatus(item.status))) {
    return {
      id: "passed-group",
      type: "ac",
      label: "Passed",
      subLabel: String(criteria.filter((item) => isPassingStatus(item.status)).length),
      status: "passed_group",
      x: 0,
      y: 0,
      rawData: passedGroupRawDataWithFocus(criteria, criterionId)
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

export function syncSelectedNodeWithSnapshot(selectedNode: RadarNode | null, nextSnapshot: NoriSnapshot): RadarNode | null {
  if (!selectedNode) return null;

  if (selectedNode.type === "goal") {
    if (!nextSnapshot.goal) return null;
    return {
      ...selectedNode,
      id: nextSnapshot.goal.id,
      label: "Goal",
      status: nextSnapshot.goal.workflow_status,
      rawData: nextSnapshot.goal
    };
  }

  if (selectedNode.type === "profile" || selectedNode.id === "profile") {
    return profileNodeFromSnapshot(nextSnapshot);
  }

  if (selectedNode.id === "passed-group") {
    const criteria = nextSnapshot.criteria || [];
    const passedCriteria = criteria.filter((criterion) => isPassingStatus(criterion.status));
    const selectedGroup = selectedNode.rawData as { focused_id?: string } | null;
    const focusedCriterion = selectedGroup?.focused_id
      ? criteria.find((criterion) => criterion.id === selectedGroup.focused_id)
      : undefined;
    if (focusedCriterion && !isPassingStatus(focusedCriterion.status)) {
      return renderedCriterionNodeFromSnapshot(nextSnapshot, focusedCriterion.id);
    }
    if (passedCriteria.length === 0) return null;
    return {
      ...selectedNode,
      label: "Passed",
      subLabel: String(passedCriteria.length),
      status: "passed_group",
      rawData: passedGroupRawDataWithFocus(criteria, selectedGroup?.focused_id)
    };
  }

  if (selectedNode.id.startsWith("ac-")) {
    const criterionId = selectedNode.id.slice("ac-".length);
    return renderedCriterionNodeFromSnapshot(nextSnapshot, criterionId);
  }

  if (selectedNode.id.startsWith("ev-")) {
    const evidencePath = selectedNode.id.slice("ev-".length);
    const separatorIndex = evidencePath.lastIndexOf("-");
    if (separatorIndex < 1) return selectedNode;

    const criterionId = evidencePath.slice(0, separatorIndex);
    const evidenceIndex = Number.parseInt(evidencePath.slice(separatorIndex + 1), 10);
    const criterion = nextSnapshot.criteria?.find((item) => item.id === criterionId);
    const evidence = Number.isInteger(evidenceIndex) ? criterion?.evidence[evidenceIndex] : undefined;
    if (!evidence) return null;

    return {
      ...selectedNode,
      label: `E-${evidenceIndex + 1}`,
      status: evidence.result || "unknown",
      rawData: evidence
    };
  }

  return selectedNode;
}

export function gapIdFromFocusEvent(event: NoriEvent | null): string | null {
  if (!event?.gap_id) return null;
  const type = String(event.type || "");
  if ([
    "ac.started",
    "ac.finished",
    "activity.finished",
    "evidence.added",
    "architecture.changed",
    "profile.changed",
    "gap.changed",
    "report.generated"
  ].includes(type)) return event.gap_id;
  if (type === "activity.started" || type === "activity.heartbeat") {
    const state = String(event.data?.state || "");
    if (RUNNING_AGENT_STATES.has(state)) return event.gap_id;
  }
  return null;
}
