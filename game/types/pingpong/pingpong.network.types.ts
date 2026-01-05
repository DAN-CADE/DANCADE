/**
 * Ping Pong 네트워크 관련 타입
 * - 온라인 멀티플레이용
 * - Socket.io 이벤트 타입
 */

// ⚠️ 순환 참조 방지를 위해 import 제거하고 필요한 타입만 직접 정의

// =====================================================================
// Socket 이벤트 타입
// =====================================================================

/** 클라이언트 → 서버 이벤트 */
export interface PingPongClientToServerEvents {
  // 방 관련
  "pingpong:create-room": () => void;
  "pingpong:join-room": (roomId: string) => void;
  "pingpong:leave-room": () => void;

  // 게임 시작
  "pingpong:ready": () => void;

  // 게임플레이
  "pingpong:paddle-move": (data: PaddleMoveData) => void;
  "pingpong:serve": () => void;
}

/** 서버 → 클라이언트 이벤트 */
export interface PingPongServerToClientEvents {
  // 방 관련
  "pingpong:room-created": (data: RoomCreatedData) => void;
  "pingpong:room-joined": (data: RoomJoinedData) => void;
  "pingpong:player-joined": (data: PlayerJoinedData) => void;
  "pingpong:player-left": (data: PlayerLeftData) => void;

  // 게임 시작
  "pingpong:game-start": (data: GameStartData) => void;

  // 게임플레이
  "pingpong:paddle-update": (data: PaddleUpdateData) => void;
  "pingpong:ball-update": (data: BallUpdateData) => void;
  "pingpong:score-update": (data: ScoreUpdateData) => void;
  "pingpong:game-end": (data: GameEndData) => void;

  // 에러
  "pingpong:error": (data: ErrorData) => void;
}

// =====================================================================
// 데이터 타입
// =====================================================================

/** 패들 이동 데이터 */
export interface PaddleMoveData {
  y: number;
  timestamp: number;
}

/** 패들 업데이트 데이터 */
export interface PaddleUpdateData {
  playerId: string;
  y: number;
  timestamp: number;
}

/** 볼 업데이트 데이터 */
export interface BallUpdateData {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  timestamp: number;
}

/** 점수 업데이트 데이터 */
export interface ScoreUpdateData {
  player1Score: number;
  player2Score: number;
  scorer: "player1" | "player2";
}

/** 방 생성 데이터 */
export interface RoomCreatedData {
  roomId: string;
  playerId: string;
}

/** 방 참가 데이터 */
export interface RoomJoinedData {
  roomId: string;
  playerId: string;
  players: PlayerInfo[];
}

/** 플레이어 참가 데이터 */
export interface PlayerJoinedData {
  player: PlayerInfo;
}

/** 플레이어 퇴장 데이터 */
export interface PlayerLeftData {
  playerId: string;
}

/** 게임 시작 데이터 */
export interface GameStartData {
  player1Id: string;
  player2Id: string;
  servingPlayer: "player1" | "player2";
}

/** 게임 종료 데이터 */
export interface GameEndData {
  winnerId: string;
  gameResult: NetworkGameResult; // ✅ 자체 타입 사용
}

/** 플레이어 정보 */
export interface PlayerInfo {
  id: string;
  nickname?: string;
  isReady: boolean;
}

/** 에러 데이터 */
export interface ErrorData {
  code: string;
  message: string;
}

// =====================================================================
// 네트워크용 게임 결과 타입 (순환 참조 방지)
// =====================================================================

/** 네트워크용 게임 결과 */
export interface NetworkGameResult {
  playerScore: number;
  aiScore: number;
  elapsedTime: number;
  totalRallies: number;
  longestRally: number;
  perfectHits: number;
  isWin: boolean;
}

// =====================================================================
// API 요청/응답 타입
// =====================================================================

/** 점수 제출 요청 */
export interface SubmitScoreRequest {
  playerScore: number;
  aiScore: number;
  elapsedTime: number;
  totalRallies: number;
  longestRally: number;
  perfectHits: number;
  isWin: boolean;
}

/** 점수 제출 응답 */
export interface SubmitScoreResponse {
  success: boolean;
  pointsEarned?: number;
  rank?: number;
  message?: string;
}

/** 랭킹 조회 응답 */
export interface RankingEntry {
  rank: number;
  userId: string;
  nickname: string;
  score: number;
  totalRallies: number;
  longestRally: number;
  perfectHits: number;
  playedAt: string;
}

export interface RankingResponse {
  rankings: RankingEntry[];
  myRank?: RankingEntry;
}
