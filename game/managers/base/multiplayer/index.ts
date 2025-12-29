// game/managers/base/multiplayer/index.ts

/**
 * 멀티플레이 공통 시스템 통합 export
 * - 게임별 코드에서 한 줄로 import 가능
 */

// =====================================================================
// Room 시스템
// =====================================================================
export { BaseRoomNetworkManager } from "@/game/managers/base/multiplayer/room/BaseRoomNetworkManager";
export { BaseRoomUIManager } from "@/game/managers/base/multiplayer/room/BaseRoomUIManager";
export { BaseRoomManager } from "@/game/managers/base/multiplayer/room/BaseRoomManager";

// =====================================================================
// 타입
// =====================================================================
export type {
  RoomData,
  PlayerData,
  RoomNetworkCallbacks,
  RoomUIColors,
  RoomUILayout,
  RoomUIConfig,
} from "@/game/types/multiplayer/room.types";

// =====================================================================
// 사용 예시
// =====================================================================

/*
// 오목 게임에서 사용:
import {
  BaseRoomNetworkManager,
  BaseRoomUIManager,
  BaseRoomManager,
  type RoomUIConfig,
} from "@/game/managers/base/multiplayer";

export class OmokRoomNetworkManager extends BaseRoomNetworkManager {
  constructor(socket: Socket) {
    super(socket, "omok");
  }
}
*/

/*
// 핑퐁 게임에서 사용:
import {
  BaseRoomNetworkManager,
  BaseRoomUIManager,
  BaseRoomManager,
  type RoomUIConfig,
} from "@/game/managers/base/multiplayer";

export class PingPongRoomNetworkManager extends BaseRoomNetworkManager {
  constructor(socket: Socket) {
    super(socket, "pingpong");
  }
}
*/
