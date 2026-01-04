// game/managers/base/multiplayer/index.ts

/**
 * 멀티플레이 공통 시스템 통합 export
 * - 게임별 코드에서 한 줄로 import 가능
 */

// =====================================================================
// Room 시스템
// =====================================================================
export { BaseGameNetworkManager } from "@/game/managers/base/multiplayer/game/BaseGameNetworkManager";
export { BaseRoomManager } from "@/game/managers/base/multiplayer/room/BaseRoomManager";
export { BaseRoomNetworkManager } from "@/game/managers/base/multiplayer/room/BaseRoomNetworkManager";
export { BaseEndGameUIManager } from "@/game/managers/base/multiplayer/ui/BaseEndGameUIManager";
export { BaseGameAbortedDialog } from "@/game/managers/base/multiplayer/ui/BaseGameAbortedDialog";
export { BaseOnlineUIManager } from "@/game/managers/base/multiplayer/ui/BaseOnlineUIManager";
export { BaseRoomUIManager } from "@/game/managers/base/multiplayer/ui/BaseRoomUIManager";

// =====================================================================
// 사용 예시
// =====================================================================

// import {
//   BaseRoomNetworkManager,
//   BaseRoomUIManager,
//   BaseRoomManager,
//   type RoomUIConfig,
// } from "@/game/managers/base/multiplayer";
