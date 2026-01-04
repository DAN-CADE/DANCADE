// const FONT_FAMILY = "NeoDunggeunmo, Pretendard, Arial";

import {
  COMMON_COLORS,
  FONT_CONFIG,
  UI_DEPTH,
} from "@/game/types/common/ui.constants";
import { ButtonConfig } from "@/game/types/common/ui.types";
import { OmokMode } from "@/game/types/omok";

// =====================================================================
// =====================================================================

export const GAME_SETTINGS = {
  RULE: {
    WIN_COUNT: 5,
    OVERLINE_LIMIT: 5,
  },
} as const;

// =====================================================================
// =====================================================================

export const DIRECTIONS: readonly [number, number][] = [
  [1, 0], // 세로
  [0, 1], // 가로
  [1, 1], // 대각선 \
  [1, -1], // 대각선 /
] as const;

export const GAME_RULES = {
  WIN_COUNT: 5, // 승리 조건 (5개 연속)
  OVERLINE_LIMIT: 5, // 장목 제한
  MUST_BLOCK_COUNT: 4, // 상대의 승리를 저지해야 하는 기준 (4목)
  MIN_THREAT_PRIORITY: 2, // 긴급 위협 우선순위
  MAX_THREAT_COUNT: 20, // GPT에 전달할 최대 위협 개수
} as const;

export const THREAT_TYPE = {
  WIN: "WIN",
  MUST_DEFEND: "MUST_DEFEND_4",
  DEFEND_3: "DEFEND_3",
  ATTACK_4: "ATTACK_4",
} as const;
export type ThreatType = (typeof THREAT_TYPE)[keyof typeof THREAT_TYPE];

export const THREAT_PRIORITY = {
  WIN: 0, // 내가 바로 이기는 수
  MUST_DEFEND: 1, // 상대를 당장 막아야 하는 수
  ATTACK_4: 2, // 내가 4를 만드는 수
  DEFEND_3: 3, // 상대의 3을 막는 수
  DEFAULT: 10, // 일반적인 수
} as const;

export const STAR_POINTS: readonly { row: number; col: number }[] = [
  { row: 3, col: 3 },
  { row: 3, col: 11 },
  { row: 11, col: 3 },
  { row: 11, col: 11 },
  { row: 7, col: 7 },
] as const;

// =====================================================================
// =====================================================================

export const COLORS = {
  ...COMMON_COLORS,
  // 게임 보드 색상
  BOARD: 0xe6b35e,
  BLACK: 0x000000,
  WHITE: 0xffffff,
  HIGHLIGHT: 0xffcc00,
  FORBIDDEN: "#ff3333",

  GOLD: "#f1c40f",

  PANEL: 0x1a1c2c,
  CARD_ACTIVE: 0x3d4e7a,
  CARD_INACTIVE: 0x24263d,
  BUTTON_GRAY: 0x333333,
} as const;

// =====================================================================
// =====================================================================

export const BOARD_STYLE = {
  BOARD: {
    SIZE: 15,
    CELL_SIZE: 40,
    STONE_RADIUS: 40,
  },
  STONE: {
    RADIUS: 16,
    BORDER_WIDTH: 1,
    BORDER_COLOR: 0x888888,
  },
  MOVE_NUMBER: {
    SIZE: "18px",
    FONT_FAMILY: FONT_CONFIG.FALLBACK,
    HIGHLIGHT_COLOR: "#ffcc00",
  },
  LINE: {
    WIDTH: 2,
    COLOR: COLORS.BLACK,
    ALPHA: 0.8,
  },
  STAR_POINT: {
    RADIUS: 4,
    COLOR: COLORS.BLACK,
  },
  FORBIDDEN: {
    SIZE: "20px",
    COLOR: COLORS.FORBIDDEN,
    COLOR_HEX: 0xff3333,
    ALPHA: 0.6,
  },
};

// =====================================================================
// =====================================================================

export const DEPTH = {
  ...UI_DEPTH,
  BOARD: 1,
  STONE: 10,
  UI: 100,
  STONE_NUMBER: 21,
  ROOM_UI: 500,
  FORBIDDEN_MARKER: 2,
  MESSAGE: 1000,
} as const;

// =====================================================================
// =====================================================================

export const OMOK_CONFIG = {
  ...GAME_SETTINGS,
  COLORS,
  DEPTH,
  BOARD_STYLE,

  UI_CONFIG: {
    colors: {
      panel: COLORS.PANEL,
      primary: COLORS.PRIMARY,
      danger: 0xe74c3c, // 빨간색 계열 추가
      cardActive: COLORS.CARD_ACTIVE,
      cardInactive: COLORS.CARD_INACTIVE,
      subText: "#9ca3af",
      gold: COLORS.GOLD,
    },
    layout: {
      panelWidth: 400,
      panelHeight: 500,
      roomCardWidth: 360,
      roomCardHeight: 60,
      roomCardSpacing: 10,
      playerCardHeight: 80,
      playerCardSpacing: 15,
      buttonGap: 20,
    },
    textStyle: {
      title: {
        fontSize: "24px",
        fontFamily: FONT_CONFIG.FALLBACK,
        color: "#ffffff",
        fontStyle: "bold",
      },
      normal: {
        fontSize: "16px",
        fontFamily: FONT_CONFIG.FALLBACK,
        color: "#ffffff",
      },
    },
  },
} as const;

// =====================================================================
// =====================================================================

export const OMOK_MODE_BUTTONS: ButtonConfig<OmokMode>[] = [
  {
    label: "SINGLE (VS GPT)",
    value: OmokMode.SINGLE,
    color: OMOK_CONFIG.COLORS.PRIMARY,
  },
  {
    label: "OFFLINE",
    value: OmokMode.LOCAL,
    color: OMOK_CONFIG.COLORS.SECONDARY,
  },
  {
    label: "ONLINE (MULTI)",
    value: OmokMode.ONLINE,
    color: 0x686de0,
  },
  {
    label: "EXIT",
    value: OmokMode.NONE,
    color: COMMON_COLORS.NEUTRAL,
  },
];

// =====================================================================
// =====================================================================

export const PROFILE_LAYOUT = {
  WIDTH: 400,
  HEIGHT: 80,
  BORDER_RADIUS: 15,
  STONE_RADIUS: 18,
  STONE_BG_RADIUS: 22,
  TOP_Y: 60,
  BOTTOM_Y_OFFSET: 60,
} as const;

// =====================================================================
// =====================================================================

export const MESSAGE_LAYOUT = {
  MAX_WIDTH: 400,
  PADDING_X: 30,
  PADDING_Y: 15,
  ANIMATION_OFFSET_Y: 20,
  AUTO_HIDE_DELAY: 2000,
  FADE_DURATION: 500,
} as const;

// =====================================================================
// =====================================================================
