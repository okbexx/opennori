import type { NoriContract, UserIntervention } from "../types/contract.ts";
import type { EvidenceLedger } from "../types/evidence.ts";
import type { CapabilityProfile } from "../types/profile.ts";
import { profileCompliance } from "./profile.ts";

export function intervention(contract: NoriContract, ledger: EvidenceLedger): UserIntervention {
  for (const criterion of contract.criteria) {
    const state = ledger.criteria[criterion.id];
    if (state?.status === "blocked") {
      const latest = state.evidence?.at(-1);
      return {
        required: true,
        criterion: criterion.id,
        user_story: criterion.user_story,
        action: latest?.summary || "Provide the decision, permission, input, or external condition needed to unblock this criterion."
      };
    }
  }

  return {
    required: false,
    action: "No user intervention is currently required."
  };
}

export function interventionForProfile(contract: NoriContract, ledger: EvidenceLedger, profile: CapabilityProfile): UserIntervention {
  const compliance = profileCompliance(profile, ledger);
  if (compliance.required && !compliance.complete) {
    const item = compliance.blocking[0];
    if (!item) {
      return {
        required: true,
        action: "Project Profile compliance is incomplete; inspect profile evidence."
      };
    }
    return {
      required: true,
      criterion: `PROFILE-${item.id}`,
      user_story: `作为用户，我需要确认 agent 是否遵守项目画像：${item.name}。`,
      action: item.status === "violated"
        ? `Project Profile item ${item.name} was violated. Waive it or revise the work.`
        : `Provide evidence that Project Profile item ${item.name} was satisfied, or waive it.`
    };
  }
  return intervention(contract, ledger);
}
