import type { AgentNext } from "./agent.ts";
import type { DoctorState } from "./doctor.ts";
import type { InstallPlan, LifecyclePlanAction } from "./lifecycle-plans.ts";

export type BootstrapData = {
  root: string;
  status: "ready" | "needs_confirm" | "installed";
  confirmed: boolean;
  side_effect?: "none" | string;
  existing_state?: boolean;
  install_plan?: InstallPlan;
  actions?: LifecyclePlanAction[];
  doctor: DoctorState;
  next: string;
  agent_next?: AgentNext;
};
