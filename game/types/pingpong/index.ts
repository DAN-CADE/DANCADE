// game/types/pingpong/index.ts
/**
 * 핑퐁 멀티플레이 타입 정의
 *
 */

// 핵심 타입
export * from "@/game/types/pingpong/pingpong.types";

// 상수
export * from "@/game/types/pingpong/pingpong.constants";

// 네트워크 타입
export * from "@/game/types/pingpong/pingpong.network.types";

// UI 타입
export * from "@/game/types/pingpong/pingpong.ui.types";

/**
 * 핑퐁 역할 (패들 위치)
 */
export type PingPongRole = "left" | "right";

/**
 * 핑퐁 네트워크 데이터 - 공 치기
 */
export interface PingPongHitData {
  roomId: string;
  socketId: string;
  ballX: number;
  ballY: number;
  ballVelocityX: number;
  ballVelocityY: number;
  ballSpeed: number;
  paddleY: number; // 패들 위치 동기화
  timestamp?: number;
}

/**
 * 핑퐁 네트워크 데이터 - 패들 이동
 */
export interface PingPongPaddleMoveData {
  roomId: string;
  socketId: string;
  paddleY: number;
  timestamp?: number;
}

/**
 * 핑퐁 네트워크 콜백
 */
export interface PingPongNetworkCallbacks {
  onWaiting?: (message: string) => void;
  onRoleAssigned?: (role: PingPongRole, roomId?: string) => void;
  onOpponentHit?: (data: PingPongHitData) => void;
  onOpponentMove?: (data: PingPongPaddleMoveData) => void;
  onGameStart?: () => void;
  onGameOver?: (winner: PingPongRole) => void;
}

/**
 * 핑퐁 설정 (PINGPONG_CONFIG 확장)
 */
export const PINGPONG_MULTIPLAYER_CONFIG = {
  // 네트워크 동기화
  PADDLE_SYNC_INTERVAL: 50, // 패들 위치 동기화 간격 (ms)
  BALL_SYNC_INTERVAL: 100, // 공 위치 동기화 간격 (ms)

  // 역할별 색상
  ROLE_COLORS: {
    left: 0xff2020, // 빨강 (플레이어)
    right: 0x0066ff, // 파랑 (상대방)
  },

  // 로컬 모드 키 설정
  LOCAL_PLAYER2_KEYS: {
    UP: Phaser.Input.Keyboard.KeyCodes.W,
    DOWN: Phaser.Input.Keyboard.KeyCodes.S,
  },
} as const;
