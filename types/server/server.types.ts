import type { Server, Socket } from "socket.io";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ServerRoom } from "@/game/types/multiplayer/room.types";
import { UserStats } from "@/types/user";

/**
 * [ 전역 타입 정의 ]
 * Socket.io 서버 및 소켓 객체에 대한 별칭
 */
export type GameIO = Server;
export type GameSocket = Socket;

// ===================================================================
// 유저 및 플레이어 관련 (User & Player)
// ===================================================================

/**
 * 서버에서 관리하는 플레이어 정보
 * (클라이언트보다 더 구체적인 UUID, 소켓 ID 정보를 포함)
 */
export interface ServerPlayer {
  socketId: string;
  userId?: string | null;
  userUUID?: string | null; // 서버는 UUID도 관리
  username: string;
  isReady: boolean;
  joinedAt: number;
  side?: number | string; // 게임별 역할
  role?: number;
}

/**
 * 유저의 통계 정보 (전적)
 */
export interface HostStats {
  wins: number;
  losses: number;
  winRate: number;
  totalGames: number;
}

// ===================================================================
// 게임 설정 및 매칭 관련 (Config & Matchmaking)
// ===================================================================

/**
 * 개별 게임의 기본 설정
 */
export interface GameConfig {
  maxPlayers: number;
  minPlayers: number;
  autoStart: boolean;
}

/**
 * 매칭 시스템 설정 (퀵매치, Supabase 연동 등)
 */
export interface MatchmakingConfig {
  maxPlayers?: number;
  quickMatchRoomId?: string;
  supabase?: SupabaseClient;
}

// ===================================================================
// 게임 결과 처리 관련 (Game Results)
// ===================================================================

/**
 * 게임 종료 후 서버가 클라이언트에게 전달하는 응답 데이터
 */
export interface GameResultResponse {
  success: boolean;
  winnerStats: UserStats | null;
  loserStats: UserStats | null;
}

/**
 * 게임 종료 핸들러 호출 시 전달하는 옵션값
 */
export interface GameOverOptions {
  winnerScore?: number;
  loserScore?: number;
  gameDuration?: number;
}

// ===================================================================
// 방 저장소 및 확장 관련 (Storage & Room Extension)
// ===================================================================

/**
 * 방 정보에 방장의 통계 정보를 포함한 확장 타입
 */
export interface RoomWithStats extends ServerRoom {
  hostStats?: HostStats;
}

/**
 * 서버 내 방 정보를 저장하는 저장소 규격 (Map 방식 또는 Redis 방식 호환)
 */
export type RoomsStorage =
  | Map<string, ServerRoom>
  | {
      get(roomId: string): ServerRoom | null | Promise<ServerRoom | null>;
      set(roomId: string, room: ServerRoom): any;
      delete(roomId: string): any;
      values(): ServerRoom[] | Promise<ServerRoom[]>;
      forEach(callback: (room: ServerRoom, roomId: string) => void): any;
      has?(roomId: string): boolean | Promise<boolean>;
    };

// ===================================================================
// 데이터베이스 및 API 응답 관련 (DB & API Response)
// ===================================================================

/**
 * DB(Supabase)에서 받아오는 유저 통계 원본 데이터 형식
 */
export interface ApiUserStats {
  total_wins: number;
  total_losses: number;
  win_rate: number;
  total_games_played: number;
}

/**
 * 통계 조회 API 응답 규격
 */
export interface StatsApiResponse {
  success: boolean;
  stats?: ApiUserStats;
}

// ===================================================================
// 방 목록 관련 (Room List)
// ===================================================================

/**
 * 로비/대기실에서 사용하는 방 목록 아이템 정보
 */
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
  players: any[];
  gameType: string;
}

/**
 * 호스트의 전적 통계가 포함된 방 목록 아이템
 */
export interface RoomListItemWithStats extends RoomListItem {
  hostStats?: HostStats;
}

// ===================================================================
// 소켓 이벤트 페이로드 (Socket Event Payloads)
// ===================================================================

/**
 * 준비 상태 토글 요청 데이터
 */
export interface ToggleReadyData {
  roomId: string;
}

/**
 * 클라이언트로부터 받는 빠른 매칭 요청 데이터
 */
export interface QuickMatchPayload {
  uuid?: string;
  userId?: string;
  nickname?: string;
}

// ===================================================================
// 방 관리 이벤트 페이로드 (Room Management Payloads)
// ===================================================================

/**
 * 방 생성 요청 데이터
 */
export interface CreateRoomData {
  roomName: string;
  isPrivate: boolean;
  password?: string;
  userId?: string;
  username: string;
  userUUID?: string;
}

/**
 * 방 입장 요청 데이터
 */
export interface JoinRoomData {
  roomId: string;
  password?: string;
  userId?: string;
  username: string;
  userUUID?: string;
}

/**
 * 방 퇴장 요청 데이터
 */
export interface LeaveRoomData {
  roomId: string;
}

/**
 * 재대결 관련 요청 데이터 (요청, 수락, 거절 공통)
 */
export interface RematchData {
  roomId: string;
}

// ===================================================================
// Server-side Room
// ===================================================================

// export interface ServerRoom {
//   roomId: string;
//   roomName: string;
//   gameType: string;
//   hostSocketId: string;
//   players: ServerPlayer[];
//   isPrivate: boolean;
//   password: string;
//   maxPlayers: number;
//   playerCount: number;
//   status: RoomStatus; // 클라이언트와 공유
//   createdAt: number;
//   isQuickMatch?: boolean;
//   startTime?: number;
//   isProcessingEnd?: boolean;
//   rematchRequests?: Record<string, boolean>;
// }
