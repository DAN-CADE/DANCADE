// game/managers/base/multiplayer/types/room.types.ts

/**
 * 멀티플레이 Room 시스템 공통 타입
 * - 모든 게임에서 사용하는 방/플레이어 데이터 구조
 */

// =====================================================================
// 방 데이터
// =====================================================================

/**
 * 서버에서 전달되는 방 정보
 */
export interface RoomData {
  roomId: string;
  roomName: string;
  gameType?: string; // "omok", "pingpong" 등
  hostUsername: string;
  hostSocketId: string;
  playerCount: number;
  maxPlayers: number;
  isPrivate: boolean;
  status: "waiting" | "playing" | "finished";
  players?: PlayerData[];
}

/**
 * 서버에서 전달되는 플레이어 정보
 */
export interface PlayerData {
  socketId: string;
  userId?: string;
  username: string;
  isReady?: boolean;
  color?: number; // 역할/팀 (게임별 의미 다름)
  x?: number;
  y?: number;
}

// =====================================================================
// 콜백 인터페이스
// =====================================================================

/**
 * Room 네트워크 매니저 콜백
 */
export interface RoomNetworkCallbacks {
  // 방 목록 관련
  onRoomListUpdate?: (rooms: RoomData[]) => void;

  // 방 생성/입장
  onRoomCreated?: (roomId: string, roomData: RoomData) => void;
  onJoinSuccess?: (roomData: RoomData) => void;
  onJoinError?: (message: string) => void;

  // 플레이어 상태 변화
  onPlayerJoined?: (roomData: RoomData) => void;
  onPlayerLeft?: (roomData: RoomData, username: string) => void;
  onPlayerReady?: (roomData: RoomData) => void;

  // 방장/게임 상태
  onHostChanged?: (roomData: RoomData) => void;
  onGameStart?: () => void;
  onGameAborted?: (reason: string, leavingPlayer: string) => void;

  // 에러
  onError?: (message: string) => void;
}

// =====================================================================
// UI 설정
// =====================================================================

/**
 * Room UI 색상 설정
 */
export interface RoomUIColors {
  panel: number;
  primary: number;
  secondary: number;
  danger: number;
  cardActive: number;
  cardInactive: number;
  subText: string;
  gold: string;
}

/**
 * Room UI 레이아웃 설정
 */
export interface RoomUILayout {
  panelWidth: number;
  panelHeight: number;
  roomCardWidth: number;
  roomCardHeight: number;
  roomCardSpacing: number;
  playerCardHeight: number;
  playerCardSpacing: number;
}

/**
 * Room UI 전체 설정
 */
export interface RoomUIConfig {
  colors: RoomUIColors;
  layout: RoomUILayout;
  textStyle: {
    title: Partial<Phaser.Types.GameObjects.Text.TextStyle>;
    normal: Partial<Phaser.Types.GameObjects.Text.TextStyle>;
    small: Partial<Phaser.Types.GameObjects.Text.TextStyle>;
  };
}
