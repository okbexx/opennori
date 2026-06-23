import type { CompletionAnswer, NoriContract } from "../types/contract.ts";
import type { EvidenceLedger } from "../types/evidence.ts";
import { reviewAcceptanceQuality } from "../acceptance.ts";
import { currentGap, evidenceHealth } from "./evidence.ts";
import { emptyProjectProfile } from "./profile.ts";
import {
  architectureReviewRisks,
  profileReviewRisks,
  reviewRiskSources,
  type CompletionContext
} from "./completion-risks.ts";

export function completionAnswer(
  contract: NoriContract,
  ledger: EvidenceLedger,
  { root = process.cwd(), architecture = undefined, profile = emptyProjectProfile() }: CompletionContext = {}
): CompletionAnswer {
  const gap = currentGap(contract, ledger, profile);
  const objectiveComplete = !gap && ledger.status === "complete";
  const acceptanceReview = reviewAcceptanceQuality(contract);
  const health = evidenceHealth(contract, ledger, { root });
  const risks = objectiveComplete ? [
    ...reviewRiskSources(acceptanceReview, health),
    ...profileReviewRisks(ledger, { profile }),
    ...architectureReviewRisks(architecture)
  ] : [];
  if (objectiveComplete && risks.length > 0) {
    return {
      complete: true,
      objective_complete: true,
      confidence: "review-risk",
      review_risks: risks,
      answer: `Objectively complete with review risk: ${risks.join(", ")}.`
    };
  }
  if (objectiveComplete) {
    return {
      complete: true,
      objective_complete: true,
      confidence: "confident",
      review_risks: [],
      answer: "Complete: all required acceptance criteria have passing or waived evidence."
    };
  }
  return {
    complete: false,
    objective_complete: false,
    confidence: "not-complete",
    review_risks: [],
    answer: `Not complete: ${gap ? `${gap.id} is ${gap.status}. ${gap.reason}` : `workflow status is ${ledger.status}.`}`
  };
}
