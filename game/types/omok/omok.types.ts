import { GameNetworkCallbacks } from "@/game/types/multiplayer/network.types";
import { OmokMoveData, ThreatType } from "@/game/types/omok";

export enum OmokMode {
  NONE = 0,
  SINGLE = 1,
  LOCAL = 2,
  ONLINE = 3,
}

export const OmokSide = {
  NONE: 0,
  BLACK: 1,
  WHITE: 2,
} as const;
export type OmokSideType = (typeof OmokSide)[keyof typeof OmokSide];

export interface Point {
  row: number;
  col: number;
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface OmokMoveRecord {
  point: Point;
  side: OmokSideType;
}

export interface gameState {
  isStarted: boolean;
  currentTurn: OmokSideType;
  mode: OmokMode;
}

export interface onlineState {
  mySide: OmokSideType;
  isSideAssigned: boolean;
  currentRoomId: string | null;
}

export interface OmokState {
  board: number[][];
  size: number;
  moves: OmokMoveRecord[];
  lastMove?: { row: number; col: number };
}

export interface AiTurnResult {
  success: boolean;
  move: Point | null;
  fromGpt: boolean;
  error?: string;
}

export interface AiConfig {
  readonly MIN_THREAT_PRIORITY: number;
  readonly MAX_THREAT_COUNT: number;
  readonly THINKING_DELAY: number;
}

export interface Threat extends Point {
  type: ThreatType;
  priority: number;
}

export interface ForbiddenCheckResult {
  can: boolean;
  reason?: string;
}

export interface OmokCallbacks
  extends GameNetworkCallbacks<OmokMoveData, OmokSideType> {
  onMove: (point: Point, side: OmokSideType, moveNumber: number) => void;
  onForbidden: (reason: string) => void;

  [key: string]: ((...args: unknown[]) => void) | unknown;
}

export type Direction = [number, number];
