// game/types/omok/index.ts

/**
 * 오목 타입 통합 export
 * - 기존 코드와의 호환성을 위해 모든 타입을 re-export
 * - 각 타입은 논리적으로 분리된 파일에서 관리
 */

// =====================================================================
// 상수
// =====================================================================
export {
  GAME_SETTINGS,
  FONT_CONFIG,
  COLORS,
  DEPTH,
  TEXT_STYLE,
  BUTTON_SIZE,
  DIRECTIONS,
  STAR_POINTS,
  OMOK_CONFIG, // 하위 호환성을 위한 통합 객체
} from "./omok.constants";

// =====================================================================
// 게임 로직 타입
// =====================================================================
export {
  OmokMode,
  type OmokState,
  type Threat,
  type ForbiddenCheckResult,
  type OmokCallbacks,
  type Position,
  type Direction,
} from "./omok.types";

// =====================================================================
// UI 타입
// =====================================================================
export {
  type OmokBoardState,
  type OmokUIState,
  type PlayerProfile,
  type PlayerInfoUI,
} from "./omok.ui.types";

// =====================================================================
// 네트워크 타입
// =====================================================================
export {
  OmokEvent,
  type RoomData,
  type OnlinePlayerData,
  type OmokMoveData,
  type OmokEventPayloads,
  type OmokEventPayload,
} from "./omok.network.types";
