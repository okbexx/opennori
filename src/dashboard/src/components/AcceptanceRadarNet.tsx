import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  buildAcceptanceRadarModel,
  getNodeColor,
  getNodePulseClass,
  getRadarLinkStyle
} from "../radar-model";
import type { NoriSnapshot, RadarNode } from "../types";

type AcceptanceRadarNetProps = {
  snapshot: NoriSnapshot | null;
  onSelectNode: (node: RadarNode) => void;
  selectedNodeId: string | null;
};

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

  const model = buildAcceptanceRadarModel(snapshot, dimensions);

  return (
    <div
      ref={containerRef}
      className="relative grid h-full max-h-full w-full min-h-0 min-w-0 place-items-center overflow-hidden rounded-lg border border-[rgba(0,240,255,0.06)] bg-[rgba(16,20,38,0.4)] p-4 shadow-2xl backdrop-blur-md"
    >
      <div
        className="radar-sweep-plane"
        data-active={model.isAgentActive ? "true" : "false"}
        style={{
          width: model.sweepSize,
          height: model.sweepSize,
          left: model.centerX - model.sweepSize / 2,
          top: model.centerY - model.sweepSize / 2
        }}
      />


      <svg
        className="loop-board relative z-10 select-none h-full w-full max-h-full max-w-full"
        viewBox={`0 0 ${model.width} ${model.height}`}
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
          {model.grid.circles.map((circle) => (
            <circle
              key={circle.id}
              cx={circle.x}
              cy={circle.y}
              r={circle.radius}
              fill="none"
              stroke="rgba(0, 240, 255, 0.12)" /* 简体中文：调亮虚线网格以凸显雷达扫描背景质感 */
              strokeWidth={circle.isOuter ? "1.5" : "1"}
              strokeDasharray={circle.isOuter ? "none" : "4 6"} /* 最外圈实线封边 */
            />
          ))}
          {model.grid.spokes.map((spoke) => (
            <line
              key={spoke.id}
              x1={spoke.x1}
              y1={spoke.y1}
              x2={spoke.x2}
              y2={spoke.y2}
              stroke="rgba(0, 240, 255, 0.05)" /* 简体中文：调亮定位线 */
              strokeWidth="1"
            />
          ))}
        </g>

        {/* 3. 绘制放射连线轨道 */}
        {model.links.map((link) => {
          const linkStyle = getRadarLinkStyle(link, model.goalId);

          return (
            <g key={link.id}>
              {/* 细底色发光辅线 */}
              <line
                x1={link.x1}
                y1={link.y1}
                x2={link.x2}
                y2={link.y2}
                stroke={linkStyle.baseStroke}
                strokeWidth={linkStyle.strokeWidth * 1.6}
              />
              <motion.line
                x1={link.x1}
                y1={link.y1}
                x2={link.x2}
                y2={link.y2}
                stroke={linkStyle.strokeColor}
                strokeWidth={linkStyle.strokeWidth}
                filter="url(#neon-glow)"
                strokeDasharray={link.isMoving ? "6 8" : "none"}
                animate={link.isMoving ? { strokeDashoffset: [-14, 0] } : {}}
                transition={link.isMoving ? { duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "linear" } : {}}
                opacity={linkStyle.opacity}
              />
            </g>
          );
        })}

        {/* 4. 绘制放射节点 */}
        {model.nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isPassedGroup = node.id === "passed-group";
          const isCurrentGap = node.type === "ac" && model.currentGapNodeId && node.id === model.currentGapNodeId;

          // 简体中文：优先取节点中预设的自适应 radius，若无则使用默认半径
          const radius = node.radius || (node.type === "goal" ? 46 : isPassedGroup ? 40 : node.type === "ac" ? 34 : 24);
          const nodeColor = getNodeColor(node.status, node.type);
          const pulseClass = getNodePulseClass(node.status, node.type, model.isAgentActive);

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
                    className={`select-none font-bold ${model.isAgentActive ? "animate-pulse" : ""}`}
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
