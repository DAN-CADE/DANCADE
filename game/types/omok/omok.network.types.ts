import { Point, OmokSideType } from "@/game/types/omok";

/**
 * 오목 네트워크 통신 관련 타입
 * - 소켓 이벤트, 방 정보, 플레이어 정보, 착수 데이터 등
 */

// =====================================================================
// 소켓 이벤트 정의
// =====================================================================

/**
 * 오목 소켓 이벤트 열거형
 */
export const OmokEvent = {
  // 로비 및 방 목록
  GET_ROOM_LIST: "omok:getRoomList",
  ROOM_LIST_UPDATE: "omok:roomListUpdate",

  // 방 생성 및 입장/퇴장
  CREATE_ROOM: "omok:createRoom",
  ROOM_CREATED: "omok:roomCreated",
  JOIN_ROOM: "omok:joinRoom",
  JOIN_SUCCESS: "omok:joinSuccess",
  JOIN_ERROR: "omok:joinError",
  LEAVE_ROOM: "omok:leaveRoom",
  LEFT_ROOM: "omok:leftRoom",

  // 대기실 상태
  PLAYER_JOINED: "omok:playerJoined",
  PLAYER_LEFT: "omok:playerLeft",
  GAME_ABORTED: "omok:gameAborted",
  TOGGLE_READY: "omok:toggleReady",
  PLAYER_READY: "omok:playerReady",
  ALL_READY: "omok:allReady",
  HOST_CHANGED: "omok:hostChanged",

  // 게임 플레이
  START_GAME: "omok:startGame",
  GAME_START: "omok:gameStart",
  MOVE: "omok:move",
  GAME_OVER: "omok:gameOver",
  SYNC_STATE: "omok:syncState",
  ASSIGNED: "omok:assigned",
  MOVED: "omok:moved",

  // 빠른 매칭
  QUICK_JOIN: "omok:join",
  QUICK_MATCH: "omok:quickMatch",
  WAITING: "omok:waiting",

  // 에러
  ERROR: "omok:error",
} as const;

// =====================================================================
// 데이터 타입
// =====================================================================

/**
 * 소켓을 통해 전달되는 방 정보
 */
export interface RoomData {
  roomId: string;
  roomName: string;
  hostUsername: string;
  playerCount: number;
  maxPlayers: number;
  isPrivate: boolean;
  status: "waiting" | "playing";
  players?: OnlinePlayerData[];
  hostSocketId?: string;
}

/**
 * 소켓을 통해 전달되는 플레이어 정보
 */
export interface OnlinePlayerData<TRole = number> {
  socketId: string;
  userId: string;
  username: string;
  isReady?: boolean;
  role?: TRole;
  // x?: number;
  // y?: number;
}

/**
 * 소켓을 통해 전달되는 착수 데이터
 */
export interface OmokMoveData extends Point {
  roomId: string;
  socketId: string;
  side: OmokSideType;
  moveNumber?: number;
}

// =====================================================================
// 이벤트 페이로드 타입 정의
// =====================================================================

/**
 * 오목 이벤트별 페이로드 타입 정의
 */
export interface OmokEventPayloads {
  // ===================================================================
  // 클라이언트 → 서버
  // ===================================================================

  [OmokEvent.CREATE_ROOM]: {
    roomName: string;
    username: string;
    isPrivate?: boolean;
    password?: string;
  };

  [OmokEvent.JOIN_ROOM]: {
    roomId: string;
    username: string;
    password?: string;
  };

  [OmokEvent.LEAVE_ROOM]: {
    roomId: string;
  };

  [OmokEvent.TOGGLE_READY]: {
    roomId: string;
  };

  [OmokEvent.START_GAME]: {
    roomId: string;
  };

  [OmokEvent.MOVE]: {
    roomId: string;
    row: number;
    col: number;
    color: number;
    socketId: string;
  };

  [OmokEvent.GAME_OVER]: {
    roomId: string;
    winner: number;
  };

  [OmokEvent.GET_ROOM_LIST]: void;

  [OmokEvent.QUICK_MATCH]: void;

  [OmokEvent.WAITING]: {
    message: string;
  };

  // ===================================================================
  // 서버 → 클라이언트
  // ===================================================================

  [OmokEvent.ROOM_CREATED]: {
    roomId: string;
    roomData: RoomData;
  };

  [OmokEvent.JOIN_SUCCESS]: {
    roomData: RoomData;
  };

  [OmokEvent.JOIN_ERROR]: {
    message: string;
  };

  [OmokEvent.LEFT_ROOM]: {
    roomId: string;
  };

  [OmokEvent.PLAYER_JOINED]: {
    player: OnlinePlayerData;
    roomData: RoomData;
  };

  [OmokEvent.PLAYER_LEFT]: {
    socketId: string;
    username: string;
    roomData: RoomData;
  };

  [OmokEvent.GAME_ABORTED]: {
    reason: string;
    leavingPlayer: string;
    roomData: RoomData;
  };

  [OmokEvent.PLAYER_READY]: {
    socketId: string;
    isReady: boolean;
    roomData: RoomData;
  };

  [OmokEvent.ALL_READY]: {
    canStart: boolean;
  };

  [OmokEvent.HOST_CHANGED]: {
    newHostSocketId: string;
    roomData: RoomData;
  };

  [OmokEvent.GAME_START]: {
    roomData: RoomData;
    roomId: string;
  };

  [OmokEvent.ASSIGNED]: {
    color: number;
    roomId: string;
  };

  [OmokEvent.MOVED]: OmokMoveData;

  [OmokEvent.ROOM_LIST_UPDATE]: RoomData[];

  [OmokEvent.ERROR]: {
    message: string;
  };
}

/**
 * 타입 헬퍼: 이벤트 이름으로 페이로드 타입 추출
 */
export type OmokEventPayload<T extends keyof OmokEventPayloads> =
  OmokEventPayloads[T];
