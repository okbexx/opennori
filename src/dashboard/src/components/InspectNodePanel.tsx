import type { RadarNode } from "../types";
import { CriterionInspectPanel } from "./inspect/CriterionInspectPanel";
import { EvidenceInspectPanel } from "./inspect/EvidenceInspectPanel";
import { GoalInspectPanel } from "./inspect/GoalInspectPanel";
import { PassedCriteriaPanel } from "./inspect/PassedCriteriaPanel";
import { ProfileInspectPanel } from "./inspect/ProfileInspectPanel";

type InspectNodePanelProps = {
  node: RadarNode;
};

export function InspectNodePanel({ node }: InspectNodePanelProps) {
  if (node.type === "goal") return <GoalInspectPanel node={node} />;
  if (node.id === "passed-group") return <PassedCriteriaPanel node={node} />;
  if (node.type === "profile") return <ProfileInspectPanel node={node} />;
  if (node.type === "ac") return <CriterionInspectPanel node={node} />;
  if (node.type === "evidence") return <EvidenceInspectPanel node={node} />;

  return <div className="text-xs text-slate-500 italic text-center p-8">No inspect layout defined for this node.</div>;
}
