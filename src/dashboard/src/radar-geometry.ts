import type { RadarDimensions, RadarFrame } from "./radar-types.js";

export function radarFrame(dimensions: RadarDimensions): RadarFrame {
  const width = dimensions.width || 800;
  const height = dimensions.height || 600;
  const centerX = width / 2;
  const centerY = height / 2;
  const baseSize = Math.min(width, height);
  return {
    width,
    height,
    centerX,
    centerY,
    baseSize,
    sweepSize: baseSize * 0.92
  };
}

export function criteriaAngle(index: number, total: number, hasPassedGroup: boolean): number {
  if (!hasPassedGroup) {
    return (index / total) * Math.PI * 2;
  }

  const sectorStart = -Math.PI * 0.68;
  const sectorEnd = Math.PI * 0.68;
  return total > 1 ? sectorStart + ((sectorEnd - sectorStart) * index) / (total - 1) : 0;
}

export function buildRadarGrid({ centerX, centerY, baseSize }: Pick<RadarFrame, "centerX" | "centerY" | "baseSize">) {
  return {
    circles: [0.1, 0.2, 0.3, 0.4, 0.46].map((scale, index) => ({
      id: `grid-circle-${scale}`,
      x: centerX,
      y: centerY,
      radius: baseSize * scale,
      isOuter: index === 4
    })),
    spokes: [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
      const rad = (angle * Math.PI) / 180;
      const rMax = baseSize * 0.46;
      return {
        id: `grid-spoke-${angle}`,
        x1: centerX,
        y1: centerY,
        x2: centerX + rMax * Math.cos(rad),
        y2: centerY + rMax * Math.sin(rad)
      };
    })
  };
}
