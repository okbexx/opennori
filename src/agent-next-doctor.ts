import type { DoctorState } from "./types/doctor.ts";
import type { ActiveGoalSummary } from "./types/manifest.ts";

export function activeGoalCount(doctor: DoctorState | undefined): number {
  return doctor?.active_goals?.filter((goal) => goal.recoverable !== false).length ?? 0;
}

export function firstActiveGoal(doctor: DoctorState | undefined): ActiveGoalSummary | undefined {
  return doctor?.active_goals?.find((goal) => goal.recoverable !== false);
}

export function activeGoals(doctor: DoctorState | undefined): ActiveGoalSummary[] {
  return doctor?.active_goals?.filter((goal) => goal.recoverable !== false) ?? [];
}
