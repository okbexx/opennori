import type {
  AcceptanceStatus,
  CurrentGap,
  EvidenceLedger,
  NoriContract
} from "../types.ts";
import { emptyProjectProfile, profileCompliance } from "./profile.ts";
import { nowIso } from "./shared.ts";

export function recomputeWorkflowStatus(contract: NoriContract, ledger: EvidenceLedger, profile = emptyProjectProfile()): EvidenceLedger {
  const requiredStates = contract.criteria
    .filter((criterion) => criterion.required !== false)
    .map((criterion) => ledger.criteria[criterion.id]?.status || "unknown");
  const approved = contract.acceptance_basis?.status === "approved";
  const compliance = profileCompliance(profile, ledger);

  if (!approved) {
    ledger.status = "draft";
  } else if (requiredStates.some((status: string) => status === "blocked")) {
    ledger.status = "blocked";
  } else if (compliance.required && !compliance.complete) {
    ledger.status = "blocked";
  } else if (approved && requiredStates.length > 0 && requiredStates.every((status) => status === "passing" || status === "waived")) {
    ledger.status = "complete";
  } else {
    ledger.status = "active";
  }
  ledger.updated_at = nowIso();
  return ledger;
}

export function currentGap(contract: NoriContract, ledger: EvidenceLedger, profile = emptyProjectProfile()): CurrentGap | null {
  if (contract.acceptance_basis?.status !== "approved") {
    return {
      id: "ACCEPTANCE-BASIS",
      user_story: "作为用户，我需要先确认或修改验收标准，才能让 agent 判断任务完成。",
      status: "unknown",
      reason: "Acceptance criteria have not been approved by the user yet."
    };
  }

  const compliance = profileCompliance(profile, ledger);
  if (compliance.required && !compliance.complete) {
    const item = compliance.blocking[0];
    if (!item) return null;
    return {
      id: `PROFILE-${item.id}`,
      user_story: `作为用户，我需要 agent 遵守能力偏好：${item.name}。`,
      status: item.status === "violated" ? "failing" : "blocked",
      reason: `Capability profile item ${item.name} is ${item.status}.`
    };
  }

  const priority: AcceptanceStatus[] = ["failing", "blocked", "unknown"];
  for (const status of priority) {
    for (const criterion of contract.criteria) {
      const state = ledger.criteria[criterion.id];
      if (criterion.required === false) continue;
      if ((state?.status || "unknown") === status) {
        return {
          id: criterion.id,
          user_story: criterion.user_story,
          status,
          reason: gapReason(status)
        };
      }
    }
  }
  return null;
}

export function gapReason(status: string): string {
  if (status === "failing") return "Existing evidence shows this user acceptance criterion is not satisfied.";
  if (status === "blocked") return "This user acceptance criterion needs a user decision or external condition.";
  return "This user acceptance criterion has no user-understandable evidence yet.";
}
