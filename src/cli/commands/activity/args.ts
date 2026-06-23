export const rootArg = {
  type: "string",
  description: "Project root.",
  default: process.cwd()
} as const;

export const jsonArg = {
  type: "boolean",
  description: "Keep deterministic JSON output for agents.",
  default: false
} as const;

export const activityArgs = {
  root: rootArg,
  agent: {
    type: "string",
    description: "Agent display name.",
    default: "Agent"
  },
  skill: {
    type: "string",
    description: "OpenNori Skill currently being used."
  },
  state: {
    type: "string",
    description: "idle, thinking, working, verifying, waiting_user, or blocked.",
    default: "working"
  },
  goal: {
    type: "string",
    description: "Goal id."
  },
  gap: {
    type: "string",
    description: "Current acceptance gap id."
  },
  summary: {
    type: "string",
    description: "Short activity summary.",
    default: ""
  },
  ttl: {
    type: "string",
    description: "Activity TTL in seconds.",
    default: "90"
  },
  json: jsonArg
} as const;

export const activityFinishArgs = {
  root: rootArg,
  agent: {
    type: "string",
    description: "Agent display name."
  },
  skill: {
    type: "string",
    description: "OpenNori Skill that finished."
  },
  goal: {
    type: "string",
    description: "Goal id."
  },
  gap: {
    type: "string",
    description: "Acceptance gap id."
  },
  summary: {
    type: "string",
    description: "Short finish summary.",
    default: ""
  },
  json: jsonArg
} as const;

export const activityShowArgs = {
  root: rootArg,
  json: jsonArg
} as const;
