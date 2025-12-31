// game/managers/games/pingpong/network/room/PingPongRoomNetworkManager.ts

import { Socket } from "socket.io-client";
import { BaseRoomNetworkManager } from "@/game/managers/base/multiplayer";

/**
 * PingPongRoomNetworkManager
 * - BaseRoomNetworkManager를 상속받아 핑퐁 전용으로 사용
 * - gamePrefix만 "pingpong"으로 설정하면 끝!
 */
export class PingPongRoomNetworkManager extends BaseRoomNetworkManager {
  constructor(socket: Socket) {
    super(socket, "pingpong");
  }

  // 추가 로직이 필요하면 여기에 작성
  // 대부분의 경우 필요 없음 - BaseRoomNetworkManager에 다 있음
}
