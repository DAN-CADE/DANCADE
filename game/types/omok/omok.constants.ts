// game/types/omok/omok.constants.ts

/**
 * 오목 게임 설정 상수
 * - 보드 크기, 셀 크기, 돌 반지름 등 게임 기본 설정
 * - 색상, 깊이, 텍스트 스타일, 버튼 크기 등 UI 설정
 */

const FONT_FAMILY = "NeoDunggeunmo, Pretendard, Arial";

// =====================================================================
// 게임 기본 설정
// =====================================================================
export const GAME_SETTINGS = {
  BOARD_SIZE: 15,
  CELL_SIZE: 40,
  STONE_RADIUS: 16,
  WIN_COUNT: 5,
  OVERLINE_LIMIT: 5,
} as const;

// =====================================================================
// 폰트 설정
// =====================================================================
export const FONT_CONFIG = {
  FAMILY: FONT_FAMILY,
  PRIMARY: "NeoDunggeunmo",
  FALLBACK: "Pretendard, Arial",
} as const;

// =====================================================================
// 색상 팔레트
// =====================================================================
export const COLORS = {
  // 게임 보드 색상
  BOARD: 0xe6b35e,
  BLACK: 0x000000,
  WHITE: 0xffffff,
  HIGHLIGHT: 0xffcc00,
  FORBIDDEN: "#ff3333",

  // UI 색상
  PANEL: 0x1a1c2c,
  PRIMARY: 0x4ecca3, // 민트색 포인트
  SECONDARY: 0x45aaf2, // 파란색
  DANGER: 0xeb4d4b, // 빨간색
  GOLD: "#f1c40f", // 골드 (강조)

  // 카드/버튼 색상
  CARD_ACTIVE: 0x3d4e7a,
  CARD_INACTIVE: 0x24263d,
  BUTTON_GRAY: 0x333333,
  SUB_TEXT: "#aaaaaa",
} as const;

// =====================================================================
// 깊이 (z-index)
// =====================================================================
export const DEPTH = {
  BOARD: 1,
  STONE: 10,
  UI: 100,
  MESSAGE: 1000,
  ROOM_UI: 500,
} as const;

// =====================================================================
// 텍스트 스타일
// =====================================================================
export const TEXT_STYLE = {
  // 대형 타이틀
  TITLE: {
    fontSize: "52px",
    fontFamily: FONT_FAMILY,
    color: "#ffffff",
    fontStyle: "bold",
  },

  // 중간 타이틀
  SUBTITLE: {
    fontSize: "42px",
    fontFamily: FONT_FAMILY,
    color: "#ffffff",
    fontStyle: "bold",
  },

  // 일반 텍스트
  NORMAL: {
    fontSize: "22px",
    fontFamily: FONT_FAMILY,
    color: "#ffffff",
  },

  // 작은 텍스트
  SMALL: {
    fontSize: "16px",
    fontFamily: FONT_FAMILY,
    color: "#ffffff",
  },

  // 플레이어 이름
  PLAYER_NAME: {
    fontSize: "24px",
    fontFamily: FONT_FAMILY,
    color: "#ffffff",
    fontStyle: "bold",
  },
} as const;

// =====================================================================
// 버튼 크기
// =====================================================================
export const BUTTON_SIZE = {
  LARGE: { width: 380, height: 70 },
  MEDIUM: { width: 350, height: 70 },
  SMALL: { width: 200, height: 60 },
} as const;

// =====================================================================
// 방향 벡터 (8방향)
// =====================================================================
export const DIRECTIONS: readonly [number, number][] = [
  [1, 0], // 세로
  [0, 1], // 가로
  [1, 1], // 대각선 \
  [1, -1], // 대각선 /
] as const;

// =====================================================================
// 화점 위치 (15x15 기준)
// =====================================================================
export const STAR_POINTS: readonly { row: number; col: number }[] = [
  { row: 3, col: 3 },
  { row: 3, col: 11 },
  { row: 11, col: 3 },
  { row: 11, col: 11 },
  { row: 7, col: 7 },
] as const;

// =====================================================================
// 통합 설정 객체 (하위 호환성)
// =====================================================================
export const OMOK_CONFIG = {
  ...GAME_SETTINGS,
  FONT: FONT_CONFIG,
  COLORS,
  DEPTH,
  TEXT_STYLE,
  BUTTON_SIZE,
} as const;
