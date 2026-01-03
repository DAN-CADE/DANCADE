// game/types/common/ui.constants.ts

/**
 * 공통 UI 상수
 * - 모든 게임에서 재사용 가능한 UI 설정
 * - 버튼 크기, 패널 크기, 간격 등
 */

// =====================================================================
// 공통 패널 크기
// =====================================================================
export const PANEL_SIZE = {
  SMALL: { width: 350, height: 300 },
  MEDIUM: { width: 450, height: 400 },
  LARGE: { width: 600, height: 700 },
} as const;

// =====================================================================
// 공통 버튼 크기
// =====================================================================
export const BUTTON_SIZE = {
  EXTRA_LARGE: { width: 380, height: 80 },
  LARGE: { width: 380, height: 70 },
  MEDIUM: { width: 350, height: 70 },
  SMALL: { width: 200, height: 60 },
} as const;

// =====================================================================
// 공통 간격
// =====================================================================
export const SPACING = {
  TINY: 10,
  SMALL: 20,
  MEDIUM: 30,
  LARGE: 60,
} as const;

// =====================================================================
// 공통 UI 깊이
// =====================================================================
export const UI_DEPTH = {
  BACKGROUND: 0,
  BOARD: 1,
  GAME_OBJECT: 10,
  UI: 100,
  ROOM_UI: 500,
  MESSAGE: 1000,
  MODAL: 10000,
} as const;

// =====================================================================
// 공통 색상 (게임 중립적)
// =====================================================================
export const COMMON_COLORS = {
  // 기본 색상
  BLACK: 0x000000,
  WHITE: 0xffffff,
  TRANSPARENT: 0x000000,

  // UI 배경
  PANEL_DARK: 0x1a1c2c,
  PANEL_LIGHT: 0x2c3e50,

  // 버튼 색상
  PRIMARY: 0x4ecca3, // 민트색
  SECONDARY: 0x45aaf2, // 파란색
  SUCCESS: 0x2ecc71, // 녹색
  DANGER: 0xeb4d4b, // 빨간색
  WARNING: 0xf39c12, // 주황색
  INFO: 0x3498db, // 하늘색
  NEUTRAL: 0x6b7280, // 회색
  LIGHT: 0xd9d9d9, // 밝은 회색

  // 텍스트 색상
  TEXT_PRIMARY: "#ffffff",
  TEXT_SECONDARY: "#aaaaaa",
  TEXT_DARK: "#000000",
  TEXT_GOLD: "#f1c40f",
} as const;

// =====================================================================
// 온라인 메뉴 레이아웃 (특정 컴포넌트용)
// =====================================================================
export const ONLINE_MENU_LAYOUT = {
  PANEL_WIDTH: 450,
  BUTTON_WIDTH: 350,
  BUTTON_HEIGHT: 70,
  BUTTON_GAP: 20,
  PADDING_TOP: 60,
  PADDING_BOTTOM: 60,
} as const;

// =====================================================================
// 폰트 설정
// =====================================================================
export const FONT_CONFIG = {
  FAMILY: "NeoDunggeunmo, Pretendard, Arial",
  PRIMARY: "NeoDunggeunmo",
  FALLBACK: "Pretendard, Arial",
} as const;

// =====================================================================
// 공통 텍스트 스타일
// =====================================================================
export const TEXT_STYLE = {
  TITLE: {
    fontSize: "52px",
    fontFamily: FONT_CONFIG.FAMILY,
    color: COMMON_COLORS.TEXT_PRIMARY,
    fontStyle: "bold",
  },
  SUBTITLE: {
    fontSize: "42px",
    fontFamily: FONT_CONFIG.FAMILY,
    color: COMMON_COLORS.TEXT_PRIMARY,
    fontStyle: "bold",
  },
  NORMAL: {
    fontSize: "22px",
    fontFamily: FONT_CONFIG.FAMILY,
    color: COMMON_COLORS.TEXT_PRIMARY,
  },
  SMALL: {
    fontSize: "16px",
    fontFamily: FONT_CONFIG.FAMILY,
    color: COMMON_COLORS.TEXT_PRIMARY,
  },
  GAME_OVER: {
    fontSize: "64px",
    fontFamily: FONT_CONFIG.FAMILY,
    color: "#ffffff",
    fontStyle: "bold",
    stroke: "#000000",
    strokeThickness: 6,
  },
  SCORE: {
    fontSize: "32px",
    fontFamily: FONT_CONFIG.FAMILY,
    color: COMMON_COLORS.TEXT_GOLD,
    fontStyle: "bold",
  },
} as const;
