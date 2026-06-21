import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { EvidenceRecord, NoriSnapshot, RadarNode } from "../types";

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
function getNodeColor(status: string, type: RadarNode["type"]): string {
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
function getNodePulseClass(status: string, type: RadarNode["type"], animate: boolean): string {
  if (!animate) return "";
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
  const sweepSize = baseSize * 0.92;

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
    const hasPassedGroup = passedAc.length > 0;

    // 依据未通过节点数动态缩放 AC 圆圈大小，防节点多时拥挤
    const acRadius = unpassedCount > 8 ? 26 : 34;

    // A. 简体中文：在左侧渲染单一大型 Passed 成功聚合节点，合并所有成功用例
    if (hasPassedGroup) {
      const passedNodeId = "passed-group";
      const passedR = baseSize * 0.30; // 聚合球置于中轨，拉开间距
      const passedX = centerX - passedR; // 固定在正左侧 (angle = Math.PI)
      const passedY = centerY;

      nodes.push({
        id: passedNodeId,
        type: "ac",
        label: "Passed",
        subLabel: String(passedAc.length),
        x: passedX,
        y: passedY,
        status: "passed_group",
        radius: 40,
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

    // B. 简体中文：在右侧大弧形扇区（若无Passed则全环）舒展交错排布未通过 AC 节点
    if (unpassedCount > 0) {
      unpassedAc.forEach((ac, acIdx) => {
        let theta = 0;
        if (hasPassedGroup) {
          // 245度超宽弧形扇区：自 -Math.PI * 0.68 至 Math.PI * 0.68，彻底扩展侧边可用空间
          const sectorStart = -Math.PI * 0.68;
          const sectorEnd = Math.PI * 0.68;
          const sectorRange = sectorEnd - sectorStart;
          theta = unpassedCount > 1
            ? sectorStart + (sectorRange * acIdx) / (unpassedCount - 1)
            : 0;
        } else {
          // 空载（无Passed）时，360度全环平铺
          theta = (acIdx / unpassedCount) * Math.PI * 2;
        }

        // 双轨交错：奇数项分配到外轨道，偶数项分配到内轨道，相邻节点错落在不同半径线上
        const isOuter = acIdx % 2 === 1;
        const currentAcR = isOuter ? baseSize * 0.35 : baseSize * 0.24;

        const acX = centerX + currentAcR * Math.cos(theta);
        const acY = centerY + currentAcR * Math.sin(theta);
        const acNodeId = `ac-${ac.id}`;

        nodes.push({
          id: acNodeId,
          type: "ac",
          label: ac.id,
          x: acX,
          y: acY,
          status: ac.status,
          radius: acRadius,
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

            // Evidence 节点半径也交错外推，与 AC 的层级保持呼应，彻底拉开空间
            const evR = isOuter ? baseSize * 0.46 : baseSize * 0.40;

            const evX = centerX + evR * Math.cos(phi);
            const evY = centerY + evR * Math.sin(phi);
            const evNodeId = `ev-${ac.id}-${evIdx}`;

            nodes.push({
              id: evNodeId,
              type: "evidence",
              label: `E-${evIdx + 1}`,
              x: evX,
              y: evY,
              status: ev.result || "unknown",
              radius: 18, // 更加精致紧凑的小卡点
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
      <div
        className="radar-sweep-plane"
        data-active={isAgentActive ? "true" : "false"}
        style={{
          width: sweepSize,
          height: sweepSize,
          left: centerX - sweepSize / 2,
          top: centerY - sweepSize / 2
        }}
      />


      <svg
        className="loop-board relative z-10 select-none h-full w-full max-h-full max-w-full"
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
          const currentGapId = snapshot?.current_gap?.id || null;
          const isCurrentGap = node.type === "ac" && currentGapId && node.id === `ac-${currentGapId}`;

          // 简体中文：优先取节点中预设的自适应 radius，若无则使用默认半径
          const radius = node.radius || (node.type === "goal" ? 46 : isPassedGroup ? 40 : node.type === "ac" ? 34 : 24);
          const nodeColor = getNodeColor(node.status, node.type);
          const pulseClass = getNodePulseClass(node.status, node.type, isAgentActive);

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

              {/* 锁定当前攻坚缺口 AC 的赛博洋红色旋转准星 (Target Lock Reticle) */}
              {isCurrentGap && (
                <>
                  <circle
                    r={radius + 6}
                    className="fill-none stroke-[#ff00a0] opacity-80"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    style={{
                      transformOrigin: "0px 0px",
                      animation: "radar-spin 12s linear infinite"
                    }}
                  />
                  <circle
                    r={radius + 10}
                    className="fill-none stroke-[#ff00a0] opacity-60"
                    strokeWidth="1"
                    strokeDasharray="6 8"
                    style={{
                      transformOrigin: "0px 0px",
                      animation: "radar-spin 6s linear infinite",
                      animationDirection: "reverse"
                    }}
                  />
                </>
              )}

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
                    className={`select-none font-bold ${isAgentActive ? "animate-pulse" : ""}`}
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
