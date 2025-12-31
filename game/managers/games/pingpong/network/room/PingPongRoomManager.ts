// game/managers/games/pingpong/network/room/PingPongRoomManager.ts

import { Socket } from "socket.io-client";
import {
  BaseRoomManager,
  BaseRoomNetworkManager,
  BaseRoomUIManager,
} from "@/game/managers/base/multiplayer";
import { PingPongRoomNetworkManager } from "@/game/managers/games/pingpong/network/room/PingPongRoomNetworkManager";
import { PingPongRoomUIManager } from "@/game/managers/games/pingpong/ui/PingPongRoomUIManager";

/**
 * PingPongRoomManager
 * - BaseRoomManager를 상속받아 핑퐁 전용 매니저 조합
 * - 팩토리 메서드만 구현하면 모든 로직은 Base에서 상속받음
 */
export class PingPongRoomManager extends BaseRoomManager {
  /**
   * 핑퐁 네트워크 매니저 생성
   */
  protected createNetworkManager(socket: Socket): BaseRoomNetworkManager {
    return new PingPongRoomNetworkManager(socket);
  }

  /**
   * 핑퐁 UI 매니저 생성
   */
  protected createUIManager(
    scene: Phaser.Scene,
    socket: Socket
  ): BaseRoomUIManager {
    return new PingPongRoomUIManager(scene, socket);
  }

  // 모든 로직은 BaseRoomManager에서 상속받음!
  // - requestRoomList()
  // - renderRoomList()
  // - showCreateRoomPrompt()
  // - leaveRoom()
  // - setOnGameStart()
  // - setOnError()
  // - cleanup()
}
