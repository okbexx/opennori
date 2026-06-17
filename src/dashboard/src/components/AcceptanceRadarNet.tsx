import { motion } from "motion/react";
import type { EvidenceRecord, NoriSnapshot } from "../types";

/* 简体中文：定义节点类型以方便统一处理 */
export type RadarNode = {
  id: string;
  type: "goal" | "ac" | "evidence";
  label: string;
  subLabel?: string; /* 简体中文：支持节点内的第二行副文本展示 */
  x: number;
  y: number;
  status: string;
  rawData: unknown;
};

type RadarLink = {
  id: string;
  sourceId: string;
  targetId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isMoving: boolean;
};

type AcceptanceRadarNetProps = {
  snapshot: NoriSnapshot | null;
  onSelectNode: (node: RadarNode) => void;
  selectedNodeId: string | null;
};

/* 简体中文：判断状态是否为成功已通过 */
function isPassed(status: string): boolean {
  const clean = String(status || "").toLowerCase();
  return ["passing", "waived"].includes(clean);
}

/* 简体中文：根据只读状态获取对应的边框颜色 */
function getNodeColor(status: string, type: "goal" | "ac" | "evidence"): string {
  if (type === "goal") return "#00f0ff"; /* 冰蓝色 */
  if (type === "ac" && status === "passed_group") return "#34d399"; /* 极光绿 */

  const cleanStatus = String(status || "").toLowerCase();
  if (isPassed(cleanStatus)) {
    return "#34d399"; /* 极光绿 */
  }
  if (["failing", "broken", "invalid", "blocked", "challenged"].includes(cleanStatus)) {
    return "#f87171"; /* 警示红 */
  }
  if (["pending", "review", "draft", "waiting_user", "needs_evidence"].includes(cleanStatus)) {
    return "#fbbf24"; /* 霓虹黄 */
  }
  return "#94a3b8"; /* 哑光灰 */
}

/* 简体中文：根据状态获取发光 className */
function getNodePulseClass(status: string, type: "goal" | "ac" | "evidence"): string {
  if (type === "goal") return "pulse-cyan";
  if (type === "ac" && status === "passed_group") return "pulse-success";

  const cleanStatus = String(status || "").toLowerCase();
  if (isPassed(cleanStatus)) {
    return "pulse-success";
  }
  if (["pending", "review", "draft", "waiting_user", "needs_evidence"].includes(cleanStatus)) {
    return "pulse-warning";
  }
  return "";
}

export function AcceptanceRadarNet({ snapshot, onSelectNode, selectedNodeId }: AcceptanceRadarNetProps) {
  const width = 800;
  const height = 640;
  const centerX = width / 2;
  const centerY = height / 2;

  const nodes: RadarNode[] = [];
  const links: RadarLink[] = [];

  const hasGoal = !!(snapshot && snapshot.status === "active" && snapshot.goal);
  const isAgentActive = !!(snapshot && ["thinking", "working", "verifying"].includes(snapshot.agent.state));
  const goal = hasGoal ? snapshot?.goal : null;

  // 1. 简体中文：生成核心 Goal 节点，放置在画布正中心
  const goalId = goal?.id || "no-goal";
  const goalLabel = hasGoal ? "Goal" : "No Goal";
  nodes.push({
    id: goalId,
    type: "goal",
    label: goalLabel,
    x: centerX,
    y: centerY,
    status: goal?.workflow_status || "idle",
    rawData: goal || { message: "Waiting for current Nori contract." }
  });

  // 2. 简体中文：如果有活跃目标且存在 criteria 列表，执行智能精简重构（Smart Focus View）
  if (hasGoal && snapshot.criteria) {
    const r1 = 150; // 中圈半径：验收指标 (AC)
    const r2 = 260; // 外圈半径：只读证据 (Evidence)

    const acList = snapshot.criteria;

    // 简体中文：过滤分类
    const passedAc = acList.filter((ac) => isPassed(ac.status));
    const unpassedAc = acList.filter((ac) => !isPassed(ac.status));

    // A. 简体中文：在左侧渲染单一大型 Passed 成功聚合节点，合并所有成功用例
    if (passedAc.length > 0) {
      const passedNodeId = "passed-group";
      const passedX = centerX - r1; // 固定在正左侧 (angle = Math.PI)
      const passedY = centerY;

      nodes.push({
        id: passedNodeId,
        type: "ac",
        label: "Passed",
        subLabel: String(passedAc.length),
        x: passedX,
        y: passedY,
        status: "passed_group",
        rawData: {
          title: "Passed Acceptance Criteria List",
          description: "All criteria that have already satisfied the acceptance conditions.",
          total_completed: passedAc.length,
          criteria: passedAc.map((ac) => ({
            id: ac.id,
            user_story: ac.user_story,
            measurement: ac.measurement,
            threshold: ac.threshold,
            status: ac.status,
            confidence: ac.confidence
          }))
        }
      });

      // 连结 Goal 到 Passed 聚合节点
      links.push({
        id: `${goalId}-${passedNodeId}`,
        sourceId: goalId,
        targetId: passedNodeId,
        x1: centerX,
        y1: centerY,
        x2: passedX,
        y2: passedY,
        isMoving: false // 已全部成功通过，无流光动作
      });
    }

    // B. 简体中文：在右侧弧形扇区舒展呈放未通过或验证中的 AC 节点
    const unpassedCount = unpassedAc.length;
    if (unpassedCount > 0) {
      // 限制在右侧扇区，角度从 -Math.PI / 2.5 到 Math.PI / 2.5 (即围绕 0 弧度左右扩展)
      const sectorStart = -Math.PI / 2.5;
      const sectorEnd = Math.PI / 2.5;
      const sectorRange = sectorEnd - sectorStart;

      unpassedAc.forEach((ac, acIdx) => {
        let theta = 0; // 如果只有 1 个未通过，角度固定在正右侧
        if (unpassedCount > 1) {
          theta = sectorStart + (sectorRange * acIdx) / (unpassedCount - 1);
        }

        const acX = centerX + r1 * Math.cos(theta);
        const acY = centerY + r1 * Math.sin(theta);
        const acNodeId = `ac-${ac.id}`;

        nodes.push({
          id: acNodeId,
          type: "ac",
          label: ac.id,
          x: acX,
          y: acY,
          status: ac.status,
          rawData: ac
        });

        // 连结 Goal 到未通过 AC
        links.push({
          id: `${goalId}-${acNodeId}`,
          sourceId: goalId,
          targetId: acNodeId,
          x1: centerX,
          y1: centerY,
          x2: acX,
          y2: acY,
          isMoving: isAgentActive
        });

        // 计算该未通过 AC 下挂载的只读 Evidence 节点
        const evList = ac.evidence || [];
        const evCount = evList.length;
        if (evCount > 0) {
          const evSectorWidth = 0.35; // 限制在外侧的小扇区内，防线交叉
        evList.forEach((ev: EvidenceRecord, evIdx) => {
            let phi = theta;
            if (evCount > 1) {
              const fraction = evIdx / (evCount - 1);
              phi = theta - evSectorWidth / 2 + fraction * evSectorWidth;
            }

            const evX = centerX + r2 * Math.cos(phi);
            const evY = centerY + r2 * Math.sin(phi);
            const evNodeId = `ev-${ac.id}-${evIdx}`;

            nodes.push({
              id: evNodeId,
              type: "evidence",
              label: `E-${evIdx + 1}`,
              x: evX,
              y: evY,
              status: ev.result || "unknown",
              rawData: ev
            });

            // 连结未通过 AC 到其 Evidence 节点
            links.push({
              id: `${acNodeId}-${evNodeId}`,
              sourceId: acNodeId,
              targetId: evNodeId,
              x1: acX,
              y1: acY,
              x2: evX,
              y2: evY,
              isMoving: isAgentActive && ev.result !== "passing"
            });
          });
        }
      });
    }
  }

  return (
    <div className="relative grid h-full max-h-full w-full min-h-0 min-w-0 place-items-center overflow-hidden rounded-lg border border-[rgba(0,240,255,0.06)] bg-[rgba(16,20,38,0.4)] p-4 shadow-2xl backdrop-blur-md">
      <svg
        className="loop-board select-none h-full w-full max-h-full max-w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="OpenNori acceptance radial radar network"
      >
        <defs>
          <linearGradient id="neon-cyan-violet" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#bd93f9" />
          </linearGradient>
          <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. 绘制放射连线轨道 */}
        {links.map((link) => {
          const strokeColor = "url(#neon-cyan-violet)";
          return (
            <g key={link.id}>
              <line
                x1={link.x1}
                y1={link.y1}
                x2={link.x2}
                y2={link.y2}
                stroke="rgba(189, 147, 249, 0.12)"
                strokeWidth="2"
              />
              <motion.line
                x1={link.x1}
                y1={link.y1}
                x2={link.x2}
                y2={link.y2}
                stroke={strokeColor}
                strokeWidth={link.isMoving ? "2" : "1"}
                strokeDasharray={link.isMoving ? "6 8" : "none"}
                animate={link.isMoving ? { strokeDashoffset: [-14, 0] } : {}}
                transition={link.isMoving ? { duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "linear" } : {}}
                opacity={link.isMoving ? 0.85 : 0.4}
              />
            </g>
          );
        })}

        {/* 2. 绘制放射节点 */}
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isPassedGroup = node.id === "passed-group";

          // Passed 聚合节点稍微放大，Goal 最大，Evidence 最小
          const radius = node.type === "goal" ? 34 : isPassedGroup ? 28 : node.type === "ac" ? 22 : 16;
          const nodeColor = getNodeColor(node.status, node.type);
          const pulseClass = getNodePulseClass(node.status, node.type);

          return (
            /* biome-ignore lint/a11y/useSemanticElements: SVG nodes need to stay inside the radar graph; keyboard handling is provided. */
            <g
              key={node.id}
              transform={`translate(${node.x} ${node.y})`}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => onSelectNode(node)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectNode(node);
                }
              }}
            >
              {/* 呼吸脉冲底光环 */}
              {pulseClass ? (
                <circle
                  r={radius + 4}
                  className={`fill-none stroke-none ${pulseClass}`}
                  style={{ pointerEvents: "none" }}
                />
              ) : null}

              {/* 节点外圆圈 */}
              <motion.circle
                r={radius}
                className="fill-[#080914]"
                stroke={nodeColor}
                strokeWidth={isSelected ? 3.5 : 2}
                filter={isSelected ? "url(#neon-glow)" : "none"}
                whileHover={{ scale: 1.12, strokeWidth: 3 }}
                transition={{ duration: 0.2 }}
              />

              {/* 节点内芯 */}
              <circle
                r={radius - 4}
                className="fill-[rgba(16,20,38,0.85)]"
                style={{ pointerEvents: "none" }}
              />

              {/* 节点文本标识 */}
              {node.subLabel ? (
                /* 简体中文：针对带有 subLabel 的节点（如 Passed 聚合节点）采用多行叠放渲染，避免字宽溢出并突出数字 */
                <g style={{ pointerEvents: "none" }}>
                  <text
                    textAnchor="middle"
                    y="-4"
                    className="select-none font-bold animate-pulse"
                    style={{
                      fill: isSelected ? "#ffffff" : "#94a3b8",
                      fontSize: "9px"
                    }}
                  >
                    {node.label}
                  </text>
                  <text
                    textAnchor="middle"
                    y="13"
                    className="select-none font-black"
                    style={{
                      fill: nodeColor,
                      fontSize: "14px"
                    }}
                  >
                    {node.subLabel}
                  </text>
                </g>
              ) : (
                /* 简体中文：单行节点（如 Goal, AC, Evidence）继续居中单行显示 */
                <text
                  textAnchor="middle"
                  y={node.type === "goal" ? 5 : node.type === "ac" ? 4 : 3.5}
                  className="select-none font-bold text-center"
                  style={{
                    fill: isSelected ? "#ffffff" : nodeColor,
                    fontSize: node.type === "goal" ? "12px" : node.type === "ac" ? "9px" : "8px",
                    pointerEvents: "none"
                  }}
                >
                  {node.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
