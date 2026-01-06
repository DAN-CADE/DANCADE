/**
 * Ping Pong 게임 핵심 로직 타입
 * - 게임 상태, 패들, 볼 등
 * - UI나 네트워크와 무관한 순수 게임 로직 타입
 */

// =====================================================================
// 게임 모드
// =====================================================================
export enum PingPongMode {
  NONE = 0,
  SINGLE = 1, // vs AI
  LOCAL = 2, // 로컬 2인 대전
  ONLINE = 3, // 온라인 대전
}

// =====================================================================
// 게임 오브젝트
// =====================================================================

/** 패들 데이터 */
export interface PingPongPaddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  sprite?: Phaser.GameObjects.Image;
}

/** 볼 데이터 */
export interface PingPongBall {
  x: number;
  y: number;
  radius: number;
  velocityX: number;
  velocityY: number;
  speed: number;
  sprite?: Phaser.GameObjects.Image;
  motionSprite?: Phaser.GameObjects.Image; // 트레일 효과용
}

// =====================================================================
// 게임 상태
// =====================================================================

/** 게임 상태 */
export interface PingPongGameState {
  playerScore: number;
  aiScore: number;
  isPlaying: boolean;
  isPaused: boolean;
  servingPlayer: "player" | "ai";
  gameMode: "menu" | "colorSelect" | "playing";
  isPreparingServe: boolean;

  // 게임 기록 시스템
  elapsedTime: number; // 플레이 시간 (초)
  totalRallies: number; // 총 랠리 횟수
  currentRally: number; // 현재 랠리 카운트
  longestRally: number; // 최장 랠리 기록
  perfectHits: number; // 완벽한 타격 횟수 (패들 중앙)

  // 선택된 게임 모드
  mode: PingPongMode;
  difficulty?: "easy" | "medium" | "hard";
}

/** 게임 결과 데이터 */
export interface PingPongGameResult {
  playerScore: number;
  aiScore: number;
  elapsedTime: number;
  totalRallies: number;
  longestRally: number;
  perfectHits: number;
  isWin: boolean;
}

// =====================================================================
// 입력 상태
// =====================================================================

/** 입력 상태 */
export interface PingPongInputState {
  upPressed: boolean;
  downPressed: boolean;
  spacePressed: boolean;
}

// =====================================================================
// 콜백 인터페이스
// =====================================================================

export type Scorer = "player" | "ai";

export interface PingPongCallbacks {
  onScoreUpdate?: (playerScore: number, aiScore: number) => void;
  onGameOver?: (isPlayerWin: boolean) => void;
  onPointScored?: (scorer: Scorer) => void;
  onNetHit?: (x: number, y: number) => void;
  onRallyUpdate?: (count: number) => void;
  onPerfectHit?: () => void;
  [key: string]: unknown;
}
