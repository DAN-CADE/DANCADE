import { CharacterState } from "@/components/avatar/utils/LpcTypes";

export interface OnlinePlayer {
  socketId: string;
  userId: string;
  username: string;
  gender?: string;
  avatarId: string;
  x: number;
  y: number;
  joinedAt: number;
  customization?: CharacterState;
}

export interface PlayerMoveData {
  socketId: string;
  x: number;
  y: number;
}

export interface AnimationData {
  socketId: string;
  direction: "up" | "down" | "left" | "right";
  isMoving: boolean;
}

export interface JoinGameData {
  customization?: Record<string, any>;
  spawnPoint: { x: number; y: number };
}
