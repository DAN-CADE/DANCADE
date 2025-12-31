// game/managers/games/omok/network/room/OmokRoomManager.ts

import { Socket } from "socket.io-client";
import {
  BaseRoomManager,
  BaseRoomNetworkManager,
  BaseRoomUIManager,
} from "@/game/managers/base/multiplayer";
import { OmokRoomNetworkManager } from "@/game/managers/games/omok/network/room/OmokRoomNetworkManager";
import { OmokRoomUIManager } from "@/game/managers/games/omok/ui/OmokRoomUIManager";

/**
 * OmokRoomManager
 * - BaseRoomManager를 상속받아 오목 전용 매니저 조합
 * - 팩토리 메서드만 구현하면 모든 로직은 Base에서 상속받음
 */
export class OmokRoomManager extends BaseRoomManager {
  /**
   * 오목 네트워크 매니저 생성
   */
  protected createNetworkManager(socket: Socket): BaseRoomNetworkManager {
    return new OmokRoomNetworkManager(socket);
  }

  /**
   * 오목 UI 매니저 생성
   */
  protected createUIManager(
    scene: Phaser.Scene,
    socket: Socket
  ): BaseRoomUIManager {
    return new OmokRoomUIManager(scene, socket);
  }

  // 모든 로직은 BaseRoomManager에서 상속받음
  // - requestRoomList()
  // - renderRoomList()
  // - showCreateRoomPrompt()
  // - leaveRoom()
  // - setOnGameStart()
  // - setOnError()
  // - cleanup()
}
