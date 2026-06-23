import type { RadarNode } from "./types.js";

export type RadarDimensions = {
  width: number;
  height: number;
};

export type RadarFrame = {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  baseSize: number;
  sweepSize: number;
};

export type RadarLink = {
  id: string;
  sourceId: string;
  targetId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isMoving: boolean;
};

export type RadarCircle = {
  id: string;
  x: number;
  y: number;
  radius: number;
  isOuter: boolean;
};

export type RadarSpoke = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type RadarModel = RadarFrame & {
  goalId: string;
  currentGapNodeId: string | null;
  isAgentActive: boolean;
  nodes: RadarNode[];
  links: RadarLink[];
  grid: {
    circles: RadarCircle[];
    spokes: RadarSpoke[];
  };
};
