// game/types/realOmok.ts

// =====================================================================
// 1. 게임 설정 상수
// =====================================================================
export const OMOK_CONFIG = {
  BOARD_SIZE: 15,
  CELL_SIZE: 40,
  STONE_RADIUS: 16,
  COLORS: {
    BOARD: 0xe6b35e,
    BLACK: 0x000000,
    WHITE: 0xffffff,
    HIGHLIGHT: 0xffcc00,
    FORBIDDEN: "#ff3333",
  },
  DEPTH: {
    BOARD: 1,
    STONE: 10,
    UI: 100,
    MESSAGE: 200,
  },
} as const;

// =====================================================================
// 2. 오목 모드
// =====================================================================
export enum OmokMode {
  NONE = 0,
  SINGLE = 1, // AI 대전
  LOCAL = 2, // 로컬 대전
}

// =====================================================================
// 3. OmokManager 관련 타입
// =====================================================================

/**
 * 오목 게임 상태
 * - board: 15x15 바둑판 (0: 빈칸, 1: 흑돌, 2: 백돌)
 * - size: 보드 크기
 * - lastMove: 마지막으로 둔 수의 위치
 */
export interface OmokState {
  board: number[][];
  size: number;
  lastMove?: { row: number; col: number };
}

/**
 * AI 위협 분석 결과
 * - row, col: 위협이 되는 위치
 * - type: 위협의 종류
 * - priority: 우선순위 (낮을수록 긴급)
 */
export interface Threat {
  row: number;
  col: number;
  type: "WIN" | "MUST_DEFEND_4" | "DEFEND_3" | "ATTACK_4";
  priority: number;
}

/**
 * OmokManager 콜백 인터페이스
 */
export interface OmokCallbacks {
  onWin: (winner: number) => void;
  onMove: (row: number, col: number, color: number) => void;
  onForbidden: (reason: string) => void;
}

// =====================================================================
// 4. OmokBoardManager 관련 타입
// =====================================================================

/**
 * 보드 그래픽 상태
 * - stoneNumbers: 각 돌에 표시되는 수순 텍스트 배열
 * - forbiddenMarkers: 금수 위치 마커(X) 배열
 * - moveCount: 현재까지 둔 수의 개수
 */
export interface OmokBoardState {
  stoneNumbers: Phaser.GameObjects.Text[];
  forbiddenMarkers: Phaser.GameObjects.Text[];
  moveCount: number;
}

// =====================================================================
// 5. OmokUIManager 관련 타입
// =====================================================================

/**
 * UI 상태
 * - modeSelectionContainer: 모드 선택 화면 컨테이너
 * - forbiddenText: 금수 경고 메시지 텍스트
 */
export interface OmokUIState {
  modeSelectionContainer?: Phaser.GameObjects.Container;
  forbiddenText?: Phaser.GameObjects.Text;
}

/**
 * 플레이어 프로필 UI 구성 요소
 * - bg: 배경 사각형
 * - statusTxt: 상태 텍스트 ("내 차례!", "대기 중" 등)
 */
export interface PlayerProfile {
  bg: Phaser.GameObjects.Rectangle;
  statusTxt: Phaser.GameObjects.Text;
}

/**
 * 플레이어 정보 UI 컨테이너
 * - me: 내 프로필
 * - opponent: 상대 프로필
 */
export interface PlayerInfoUI {
  me?: PlayerProfile;
  opponent?: PlayerProfile;
}

// =====================================================================
// 6. 금수 체크 결과
// =====================================================================

/**
 * 금수 체크 결과
 * - can: 해당 위치에 둘 수 있는지 여부
 * - reason: 둘 수 없는 경우 그 이유
 */
export interface ForbiddenCheckResult {
  can: boolean;
  reason?: string;
}

// =====================================================================
// 7. 유틸리티 타입
// =====================================================================

/**
 * 좌표 타입
 */
export interface Position {
  row: number;
  col: number;
}

/**
 * 방향 벡터 (8방향)
 */
export type Direction = [number, number];

/**
 * 4방향 (가로, 세로, 대각선 2개)
 */
export const DIRECTIONS: Direction[] = [
  [1, 0], // 세로
  [0, 1], // 가로
  [1, 1], // 대각선 \
  [1, -1], // 대각선 /
] as const;

/**
 * 화점 위치 (15x15 기준)
 */
export const STAR_POINTS: Position[] = [
  { row: 3, col: 3 },
  { row: 3, col: 11 },
  { row: 11, col: 3 },
  { row: 11, col: 11 },
  { row: 7, col: 7 },
] as const;
