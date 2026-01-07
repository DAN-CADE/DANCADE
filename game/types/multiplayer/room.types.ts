import { HostStats, ServerPlayer } from "@/types/server/server.types";

export type RoomStatus = "waiting" | "playing" | "finished";

// 클라이언트용 (기존 유지)
export interface OnlinePlayerData<TRole = number> {
  socketId: string;
  userId: string;
  username: string;
  isReady?: boolean;
  role?: TRole;
}

// 클라이언트용
export interface RoomData {
  roomId: string;
  roomName: string;
  hostUsername: string;
  playerCount: number;
  maxPlayers: number;
  isPrivate: boolean;
  status: RoomStatus;
  players?: OnlinePlayerData[];
  hostSocketId?: string;
}

// 서버용
export interface ServerRoom {
  roomId: string;
  roomName: string;
  gameType: string;
  hostSocketId: string;
  players: ServerPlayer[]; //
  isPrivate: boolean;
  password: string; // 서버만 관리
  maxPlayers: number;
  playerCount: number;
  status: RoomStatus;
  createdAt: number; // 서버 전용
  isQuickMatch?: boolean; // 서버 전용
  startTime?: number;
  isProcessingEnd?: boolean;
  rematchRequests?: Record<string, boolean>;
}

export interface RoomListItem {
  roomId: string;
  roomName: string;
  hostUsername: string;
  hostSocketId: string;
  hostUserId?: string | null;
  hostUserUUID?: string | null;
  playerCount: number;
  maxPlayers: number;
  isPrivate: boolean;
  status: string;
  players: ServerPlayer[];
  gameType: string;
}
export interface RoomListItemWithStats extends RoomListItem {
  hostStats?: HostStats;
}
