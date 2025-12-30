import { Socket } from "socket.io-client";
import { BaseRoomNetworkManager } from "@/game/managers/base/multiplayer";

/**
 * OmokRoomNetworkManager
 * - BaseRoomNetworkManager를 상속받아 오목 전용으로 사용
 * - gamePrefix만 "omok"으로 설정
 */
export class OmokRoomNetworkManager extends BaseRoomNetworkManager {
  constructor(socket: Socket) {
    super(socket, "omok");
  }

  // 추가 로직이 필요하면 여기에 작성
  // 대부분의 경우 필요 없음 - BaseRoomNetworkManager에 다 있음
}
