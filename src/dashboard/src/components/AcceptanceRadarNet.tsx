import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Activity, Compass, Cpu } from "lucide-react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  /* 简体中文：采用弹性物理尺寸感知，防止小屏幕挤压或大屏幕空洞 */
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: width || 800,
          height: height || 600
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const { width, height } = dimensions;
  const centerX = width / 2;
  const centerY = height / 2;

  // 简体中文：雷达辅助网的基准尺寸，取宽高的最小值
  const baseSize = Math.min(width, height);

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
    const acList = snapshot.criteria;

    // 简体中文：过滤分类
    const passedAc = acList.filter((ac) => isPassed(ac.status));
    const unpassedAc = acList.filter((ac) => !isPassed(ac.status));
    const unpassedCount = unpassedAc.length;

    // 简体中文：根据物理尺寸动态自适应拉伸半径，彻底解决大屏幕空洞、小屏幕贴边问题
    // 如果无未通过分支，Passed 节点与 Goal 的半径拉大至 baseSize * 0.38
    const r1 = unpassedCount === 0 ? baseSize * 0.38 : baseSize * 0.26;
    const r2 = baseSize * 0.42;

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
    <div
      ref={containerRef}
      className="relative grid h-full max-h-full w-full min-h-0 min-w-0 place-items-center overflow-hidden rounded-lg border border-[rgba(0,240,255,0.06)] bg-[rgba(16,20,38,0.4)] p-4 shadow-2xl backdrop-blur-md"
    >
      {/* 简体中文：将 Active Goal 作为绝对定位浮动指令舱（Core Mission Command Module）放在雷达左上角，使雷达大屏能向上撑满整块画布 */}
      {hasGoal && (
        <div className="absolute top-4 left-4 z-20 max-w-xs lg:max-w-md rounded-lg border-l-[3.5px] border-l-[#00f0ff] border border-[rgba(0,240,255,0.08)] bg-[rgba(8,9,20,0.85)] p-3 shadow-2xl backdrop-blur-md text-left">
          <div className="absolute top-0 right-0 px-2 py-0.5 bg-[rgba(0,240,255,0.06)] text-[8px] font-mono tracking-widest text-[#00f0ff]/80 border-b border-l border-[rgba(0,240,255,0.08)] rounded-bl">
            SYS.DIRECTIVE / GOAL
          </div>

          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded bg-[#00f0ff]/10 px-2 py-0.5 text-[9px] font-mono font-bold text-[#00f0ff]">
              <Cpu size={10} className="animate-spin" style={{ animationDuration: "8s" }} />
              GOAL_ID: {snapshot.goal?.id || "none"}
            </span>
            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-mono font-bold ${snapshot?.goal?.workflow_status === "complete" ? "bg-[#34d399]/10 text-[#34d399]" : "bg-[#fbbf24]/10 text-[#fbbf24]"}`}>
              <Activity size={10} />
              STATUS: {snapshot?.goal?.workflow_status?.toUpperCase() || "ACTIVE"}
            </span>
            <span className="text-[9px] text-slate-500 font-mono">
              | PROTOCOL: snapshot-v1
            </span>
          </div>

          <div className="flex items-start gap-2">
            <div className="mt-0.5 text-[#00f0ff]/80 shrink-0">
              <Compass size={14} />
            </div>
            <h2 className="text-xs font-semibold leading-relaxed tracking-wide text-slate-200 break-words">
              {snapshot?.goal?.label || "No active Nori Contract loaded."}
            </h2>
          </div>
        </div>
      )}

      <svg
        className="loop-board select-none h-full w-full max-h-full max-w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="OpenNori acceptance radial radar network"
      >
        <defs>
          <linearGradient id="neon-cyan-violet" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#bd93f9" />
          </linearGradient>
          {/* 简体中文：新增绿色与青色大干道连线渐变色 */}
          <linearGradient id="neon-cyan-green" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          {/* 简体中文：调大 filter 的范围防止高斯模糊边缘被裁剪 */}
          <filter id="neon-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* 简体中文：雷达扫描扇形渐变色 */}
          <linearGradient id="radar-sweep-gradient" x1="1" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(0, 240, 255, 0.15)" />
            <stop offset="100%" stopColor="rgba(0, 240, 255, 0)" />
          </linearGradient>
        </defs>

        {/* 简体中文：绘制雷达网格只读辅助背景网（同心圆与 8 方向发散经纬定位线） */}
        <g style={{ pointerEvents: "none" }}>
          {/* 5 圈自适应辅助圆轨道 */}
          {[0.1, 0.2, 0.3, 0.4, 0.46].map((scale, i) => (
            <circle
              key={`grid-circle-${scale}`}
              cx={centerX}
              cy={centerY}
              r={baseSize * scale}
              fill="none"
              stroke="rgba(0, 240, 255, 0.12)" /* 简体中文：调亮虚线网格以凸显雷达扫描背景质感 */
              strokeWidth={i === 4 ? "1.5" : "1"}
              strokeDasharray={i === 4 ? "none" : "4 6"} /* 最外圈实线封边 */
            />
          ))}
          {/* 8 个发散方向的辅助经纬线 */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const rMax = baseSize * 0.46;
            const spokeX = centerX + rMax * Math.cos(rad);
            const spokeY = centerY + rMax * Math.sin(rad);
            return (
              <line
                key={`grid-spoke-${angle}`}
                x1={centerX}
                y1={centerY}
                x2={spokeX}
                y2={spokeY}
                stroke="rgba(0, 240, 255, 0.05)" /* 简体中文：调亮定位线 */
                strokeWidth="1"
              />
            );
          })}

          {/* 简体中文：雷达背景扫描半透明旋转扇形光束 */}
          {(() => {
            const sweepR = baseSize * 0.46;
            const x1 = centerX + sweepR;
            const y1 = centerY;
            const x2 = centerX + sweepR * Math.cos(Math.PI / 6); // 30度扇形扫描线，更加聚光
            const y2 = centerY - sweepR * Math.sin(Math.PI / 6);
            const sweepPath = `M ${centerX} ${centerY} L ${x1} ${y1} A ${sweepR} ${sweepR} 0 0 0 ${x2} ${y2} Z`;

            return (
              <path
                d={sweepPath}
                fill="url(#radar-sweep-gradient)"
                style={{
                  transformOrigin: `${centerX}px ${centerY}px`,
                  animation: "radar-spin 8s linear infinite",
                  pointerEvents: "none"
                }}
              />
            );
          })()}
        </g>

        {/* 3. 绘制放射连线轨道 */}
        {links.map((link) => {
          const isToPassed = link.targetId === "passed-group";
          const strokeColor = isToPassed ? "url(#neon-cyan-green)" : "url(#neon-cyan-violet)";
          // 简体中文：Passed 主干连线加粗至 4.5px 极强发光，普通未通过通道使用 2.5px，Evidence 引线为 1.5px
          const strokeWidth = isToPassed ? 4.5 : link.sourceId === goalId ? 2.5 : 1.5;

          return (
            <g key={link.id}>
              {/* 细底色发光辅线 */}
              <line
                x1={link.x1}
                y1={link.y1}
                x2={link.x2}
                y2={link.y2}
                stroke={isToPassed ? "rgba(52, 211, 153, 0.08)" : "rgba(189, 147, 249, 0.08)"}
                strokeWidth={strokeWidth * 1.6}
              />
              <motion.line
                x1={link.x1}
                y1={link.y1}
                x2={link.x2}
                y2={link.y2}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                filter="url(#neon-glow)"
                strokeDasharray={link.isMoving ? "6 8" : "none"}
                animate={link.isMoving ? { strokeDashoffset: [-14, 0] } : {}}
                transition={link.isMoving ? { duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "linear" } : {}}
                opacity={isToPassed ? 0.95 : link.isMoving ? 0.85 : 0.5}
              />
            </g>
          );
        })}

        {/* 4. 绘制放射节点 */}
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isPassedGroup = node.id === "passed-group";

          // 简体中文：整体成倍放大节点半径，提升视觉存在感与可读性
          const radius = node.type === "goal" ? 46 : isPassedGroup ? 40 : node.type === "ac" ? 34 : 24;
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
              {/* 呼吸脉冲底光环（去掉原本的 stroke-none，使 CSS 中的 stroke 扩散呼吸动画生效） */}
              {pulseClass ? (
                <circle
                  r={radius + 4}
                  className={`fill-none ${pulseClass}`}
                  style={{ pointerEvents: "none" }}
                />
              ) : null}

              {/* 节点外圆圈 */}
              <motion.circle
                r={radius}
                className="fill-[#080914]"
                stroke={nodeColor}
                strokeWidth={isSelected ? 3.5 : 2}
                filter={isSelected || isPassedGroup || node.type === "goal" ? "url(#neon-glow)" : "none"}
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
                /* 简体中文：Passed 聚合节点采用两行垂直叠放排版，第一行小字Passed，第二行大字数量，完全解决字宽局促问题 */
                <g style={{ pointerEvents: "none" }}>
                  <text
                    textAnchor="middle"
                    y="-4"
                    className="select-none font-bold animate-pulse"
                    style={{
                      fill: isSelected ? "#ffffff" : "#94a3b8",
                      fontSize: "10px"
                    }}
                  >
                    {node.label}
                  </text>
                  <text
                    textAnchor="middle"
                    y="14"
                    className="select-none font-black"
                    style={{
                      fill: nodeColor,
                      fontSize: "18px"
                    }}
                  >
                    {node.subLabel}
                  </text>
                </g>
              ) : (
                /* 简体中文：单行节点（如 Goal, AC, Evidence）也相应等比调大字号 */
                <text
                  textAnchor="middle"
                  y={node.type === "goal" ? 6 : node.type === "ac" ? 5 : 4}
                  className="select-none font-bold text-center"
                  style={{
                    fill: isSelected ? "#ffffff" : nodeColor,
                    fontSize: node.type === "goal" ? "14px" : node.type === "ac" ? "11px" : "9px",
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
