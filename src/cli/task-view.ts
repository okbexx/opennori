import type { TaskView } from "../types.ts";

export function renderTaskView(view: TaskView): string {
  const gap = view.current_gap
    ? `${view.current_gap.statement} - ${renderResultStatus(view.current_gap.status)}`
    : "None";
  const lines = [
    `${view.task.id}  ${view.task.title}`,
    `Stage: ${capitalize(view.phase)}`,
    ...(view.task.package ? [`Package: ${view.task.package}`] : []),
    `Result agreement: ${renderResultAgreement(view)}`,
    `Git delivery: ${renderGitDelivery(view)}`,
    `Completion: ${view.finish_ready ? "Ready" : "Not ready"}`,
    ...(view.task.blocker ? [`Blocked: ${view.task.blocker}`] : []),
    `Current gap: ${gap}`,
    `Next: ${humanNextAction(view)}`
  ];
  return lines.join("\n");
}

function renderResultAgreement(view: TaskView): string {
  if (!view.contract) return "Not drafted";
  return view.contract.status === "approved" ? "Confirmed" : "Waiting for your confirmation";
}

function renderGitDelivery(view: TaskView): string {
  if (!view.task.delivery_required) return "Not required";
  if (!view.delivery) return "Not planned";
  if (view.delivery.mode === "waived") {
    return view.delivery_ready ? "Exception confirmed" : "Exception needs reconfirmation";
  }
  if (view.delivery.status === "planned") {
    return `Planned as ${view.delivery.mode === "pull_request" ? "pull request" : "commit"}`;
  }
  return view.delivery_ready
    ? `Verified at ${view.delivery.commit}`
    : "Needs verification for the current changes";
}

function renderResultStatus(status: TaskView["outcomes"][number]["status"]): string {
  return {
    unproven: "not yet verified",
    proven: "verified",
    failed: "verification failed",
    blocked: "verification blocked",
    waived: "exception confirmed"
  }[status];
}

function humanNextAction(view: TaskView): string {
  if (view.task.blocker) return `Resolve the blocker: ${view.task.blocker}`;
  if (view.phase === "plan") {
    if (!view.contract) return "Review the proposed results before implementation starts.";
    if (!view.delivery) return "Choose how the verified work will be delivered in Git.";
    return view.contract.status === "approved"
      ? "Start implementation of the confirmed results."
      : "Confirm the required results, then start implementation.";
  }
  if (view.phase === "implement") return "Implement the confirmed results, then request verification.";
  if (view.phase === "verify") {
    if (view.current_gap) return `Verify "${view.current_gap.statement}".`;
    return view.delivery_ready ? "Complete and archive the task." : "Commit the verified changes and record the Git delivery.";
  }
  if (!view.archived) return "Preserve reusable project knowledge, then archive the task.";
  if (!view.task.delivery_required || view.delivery?.mode === "waived") return "Review the completion report.";
  return "Commit the final OpenNori state and verify the clean Git delivery.";
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function summarizeTaskView(view: TaskView) {
  const summarizeOutcome = (outcome: TaskView["outcomes"][number]) => ({
    id: outcome.id,
    statement: outcome.statement,
    required: outcome.required,
    status: outcome.status,
    latest_evidence: outcome.latest_evidence
      ? {
          id: outcome.latest_evidence.id,
          result: outcome.latest_evidence.result,
          implementation_revision: outcome.latest_evidence.implementation_revision,
          summary: outcome.latest_evidence.summary,
          recorded_at: outcome.latest_evidence.recorded_at
        }
      : null
  });
  return {
    task: {
      id: view.task.id,
      title: view.task.title,
      status: view.task.status,
      implementation_revision: view.task.implementation_revision,
      priority: view.task.priority,
      delivery_required: view.task.delivery_required,
      package: view.task.package ?? null,
      blocker: view.task.blocker ?? null
    },
    archived: view.archived,
    phase: view.phase,
    contract: view.contract
      ? { task_id: view.contract.task_id, goal: view.contract.goal, status: view.contract.status }
      : null,
    outcomes: view.outcomes.map(summarizeOutcome),
    current_gap: view.current_gap ? summarizeOutcome(view.current_gap) : null,
    complete: view.complete,
    delivery: view.delivery
      ? {
          mode: view.delivery.mode,
          status: view.delivery.status,
          commit: view.delivery.commit,
          pull_request_url: view.delivery.pull_request_url,
          implementation_revision: view.delivery.implementation_revision,
          waiver: view.delivery.waiver
            ? { actor: view.delivery.waiver.actor, reason: view.delivery.waiver.reason }
            : null
        }
      : null,
    delivery_ready: view.delivery_ready,
    finish_ready: view.finish_ready
  };
}
