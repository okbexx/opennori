import { motion } from "motion/react";
import type { ActivityState, NoriSnapshot } from "../types";

type StageId = "goal" | "contract" | "gap" | "evidence" | "decision";

type Stage = {
  id: StageId;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  radius: number;
};

const stages: Stage[] = [
  { id: "goal", label: "Goal", sublabel: "intent", x: 120, y: 185, radius: 55 },
  { id: "contract", label: "Contract", sublabel: "AC", x: 310, y: 96, radius: 56 },
  { id: "gap", label: "Gap", sublabel: "now", x: 520, y: 185, radius: 68 },
  { id: "evidence", label: "Evidence", sublabel: "proof", x: 730, y: 274, radius: 56 },
  { id: "decision", label: "Decision", sublabel: "done?", x: 920, y: 185, radius: 55 }
];

const fallbackStage: Stage = stages[0] || { id: "goal", label: "Goal", sublabel: "intent", x: 120, y: 185, radius: 55 };
const flowPath = "M120 185 C235 42 395 42 520 185 S805 328 920 185";

function activeStage({
  agentState,
  decision,
  needUser,
  hasGap,
  noActiveGoal
}: {
  agentState: ActivityState;
  decision: string;
  needUser: boolean;
  hasGap: boolean;
  noActiveGoal: boolean;
}): StageId {
  if (noActiveGoal) return "goal";
  if (needUser || agentState === "waiting_user") return "decision";
  if (agentState === "verifying") return "evidence";
  if (hasGap) return "gap";
  if (decision === "complete" || decision === "review_risk") return "decision";
  return "contract";
}

function stageState(stage: StageId, current: StageId, loop: NoriSnapshot["loop"] | undefined): string {
  const value = loop?.[stage];
  if (stage === current) return "active";
  if (value === "ready" || value === "approved" || value === "clear" || value === "decided") return "ready";
  if (value === "missing" || value === "draft" || value === "pending" || value === "needs_evidence") return "pending";
  return "idle";
}

function stageClasses(state: string): string {
  if (state === "active") return "stroke-[#57c7ff] fill-[#16253a]";
  if (state === "ready") return "stroke-[#74d58a] fill-[#162316]";
  if (state === "pending") return "stroke-[#ffb15e] fill-[#2a2114]";
  return "stroke-[#f5f0e6]/25 fill-[#141712]";
}

export function AcceptanceLoop({
  loop,
  agentState,
  decision,
  needUser,
  hasGap,
  noActiveGoal
}: {
  loop?: NoriSnapshot["loop"];
  agentState: ActivityState;
  decision: string;
  needUser: boolean;
  hasGap: boolean;
  noActiveGoal: boolean;
}) {
  const currentStage = activeStage({ agentState, decision, needUser, hasGap, noActiveGoal });
  const isMoving = agentState === "thinking" || agentState === "working" || agentState === "verifying";
  const currentStageModel = stages.find((stage) => stage.id === currentStage) || fallbackStage;

  return (
    <div className="grid min-h-0 min-w-0 place-items-center overflow-hidden">
      <svg className="loop-board h-[240px] w-full max-w-[1080px] sm:h-[320px] lg:h-[390px]" viewBox="0 0 1040 390" role="img" aria-label="OpenNori acceptance loop status">
        <defs>
          <linearGradient id="nori-flow" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#74d58a" />
            <stop offset="42%" stopColor="#57c7ff" />
            <stop offset="100%" stopColor="#ffb15e" />
          </linearGradient>
          <filter id="loop-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path className="fill-none stroke-[#f5f0e6]/12" strokeWidth="22" strokeLinecap="round" d={flowPath} />
        <motion.path
          className="fill-none stroke-[url(#nori-flow)]"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="112 46"
          filter="url(#loop-glow)"
          d={flowPath}
          animate={{ strokeDashoffset: isMoving ? [-158, 0] : 0, opacity: noActiveGoal ? 0.35 : 1 }}
          transition={{ duration: 2.2, repeat: isMoving ? Number.POSITIVE_INFINITY : 0, ease: "linear" }}
        />

        {stages.map((stage) => {
          const state = stageState(stage.id, currentStage, loop);
          const active = state === "active";
          return (
            <g key={stage.id} transform={`translate(${stage.x} ${stage.y})`}>
              <motion.circle
                r={stage.radius}
                className={stageClasses(state)}
                strokeWidth={active ? 4 : 2}
                animate={active ? { scale: [1, 1.045, 1] } : { scale: 1 }}
                transition={{ duration: 1.4, repeat: active ? Number.POSITIVE_INFINITY : 0, ease: "easeInOut" }}
              />
              <text y="-5" textAnchor="middle" className="fill-[#f7f0e2] text-[18px] font-black">
                {stage.label}
              </text>
              <text y="19" textAnchor="middle" className="fill-[#bfc7ba] text-[12px] font-bold">
                {stage.sublabel}
              </text>
            </g>
          );
        })}

        {isMoving ? (
          <circle r="7" fill="#f7f0e2" filter="url(#loop-glow)">
            <animateMotion dur="3.4s" repeatCount="indefinite" path={flowPath} />
            <animate attributeName="opacity" values="0.25;1;0.25" dur="3.4s" repeatCount="indefinite" />
          </circle>
        ) : (
          <circle cx={currentStageModel.x} cy={currentStageModel.y} r="7" fill="#f7f0e2" opacity={noActiveGoal ? "0.25" : "0.55"} filter="url(#loop-glow)" />
        )}
      </svg>
    </div>
  );
}
