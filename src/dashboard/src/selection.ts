import type { NoriEvent, NoriSnapshot, RadarNode } from "./types.js";
import { passedCriteriaRawData, profileNodeFromSnapshot, renderedCriterionNodeFromSnapshot } from "./radar-nodes.js";
import { isMovingAgentState, isPassed } from "./radar-status.js";

export { profileNodeFromSnapshot, renderedCriterionNodeFromSnapshot };

export function syncSelectedNodeWithSnapshot(selectedNode: RadarNode | null, nextSnapshot: NoriSnapshot): RadarNode | null {
  if (!selectedNode) return null;

  if (selectedNode.type === "goal") {
    if (!nextSnapshot.goal) {
      return {
        ...selectedNode,
        id: "no-current-goal",
        label: "Ready",
        status: "idle",
        rawData: {
          empty_state: true,
          idle_summary: nextSnapshot.idle_summary,
          message: nextSnapshot.idle_summary?.message || "No current Nori Contract is being observed."
        }
      };
    }
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
    const passedCriteria = criteria.filter((criterion) => isPassed(criterion.status));
    const selectedGroup = selectedNode.rawData as { focused_id?: string } | null;
    const focusedCriterion = selectedGroup?.focused_id
      ? criteria.find((criterion) => criterion.id === selectedGroup.focused_id)
      : undefined;
    if (focusedCriterion && !isPassed(focusedCriterion.status)) {
      return renderedCriterionNodeFromSnapshot(nextSnapshot, focusedCriterion.id);
    }
    if (passedCriteria.length === 0) return null;
    return {
      ...selectedNode,
      label: "Passed",
      subLabel: String(passedCriteria.length),
      status: "passed_group",
      rawData: passedCriteriaRawData(criteria, selectedGroup?.focused_id)
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
    if (isMovingAgentState(state)) return event.gap_id;
  }
  return null;
}
