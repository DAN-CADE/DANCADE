/**
 * Ping Pong UI 관련 타입
 */

// =====================================================================
// 모드 선택 UI
// =====================================================================

export interface ModeButtonConfig {
  label: string;
  mode: number;
  color: number;
}

// =====================================================================
// 게임 오버 화면
// =====================================================================

export interface GameOverScreenOptions {
  isWin: boolean;
  playerScore: number;
  aiScore: number;
  stats?: GameStats;
}

export interface GameStats {
  totalRallies: number;
  longestRally: number;
  perfectHits: number;
  elapsedTime: number;
}

// =====================================================================
// 색상 선택 UI
// =====================================================================

export interface ColorOption {
  color: number;
  name: string;
}
