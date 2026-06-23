import { buildRadarGrid, radarFrame } from "./radar-geometry.js";
import { appendCriteriaNetwork, goalNodeFromSnapshot } from "./radar-nodes.js";
import { isMovingAgentState } from "./radar-status.js";
import type { RadarDimensions, RadarLink, RadarModel } from "./radar-types.js";
import type { NoriSnapshot, RadarNode } from "./types.js";

export type {
  RadarCircle,
  RadarDimensions,
  RadarFrame,
  RadarLink,
  RadarModel,
  RadarSpoke
} from "./radar-types.js";
export { getNodeColor, getNodePulseClass, getRadarLinkStyle, isPassed } from "./radar-status.js";

export function buildAcceptanceRadarModel(snapshot: NoriSnapshot | null, dimensions: RadarDimensions): RadarModel {
  const frame = radarFrame(dimensions);
  const nodes: RadarNode[] = [];
  const links: RadarLink[] = [];
  const hasGoal = !!(snapshot && snapshot.status === "active" && snapshot.goal);
  const isAgentActive = !!(snapshot && isMovingAgentState(snapshot.agent.state));
  const goalNode = goalNodeFromSnapshot(snapshot, frame);
  const goalId = goalNode.id;

  nodes.push(goalNode);

  if (hasGoal && snapshot.criteria) {
    appendCriteriaNetwork({
      nodes,
      links,
      criteria: snapshot.criteria,
      goalId,
      centerX: frame.centerX,
      centerY: frame.centerY,
      baseSize: frame.baseSize,
      isAgentActive
    });
  }

  return {
    ...frame,
    goalId,
    currentGapNodeId: snapshot?.current_gap?.id ? `ac-${snapshot.current_gap.id}` : null,
    isAgentActive,
    nodes,
    links,
    grid: buildRadarGrid(frame)
  };
}
