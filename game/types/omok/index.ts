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
  COLORS,
  DEPTH,
  DIRECTIONS,
  GAME_RULES,
  THREAT_TYPE,
  THREAT_PRIORITY,
  STAR_POINTS,
  OMOK_CONFIG, // 하위 호환성을 위한 통합 객체
  type ThreatType,
} from "./omok.constants";

// =====================================================================
// 게임 로직 타입
// =====================================================================
export {
  OmokMode,
  OmokSide,
  type OmokState,
  type OmokSideType,
  type Threat,
  type Point,
  type ForbiddenCheckResult,
  type OmokCallbacks,
  type Direction,
  type Coordinate,
} from "./omok.types";

// =====================================================================
// UI 타입
// =====================================================================
export {
  type OmokBoardState,
  type OmokUIState,
  type PlayerProfile,
  type PlayerInfoUI,
  type StoneInfo,
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
