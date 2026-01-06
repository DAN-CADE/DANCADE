// game/managers/games/pingpong/network/room/PingPongRoomUIManager.ts

import { Socket } from "socket.io-client";
import { BaseRoomUIManager } from "@/game/managers/base/multiplayer";
import type { RoomUIConfig } from "@/game/types/common/ui.types";

/**
 * 핑퐁 Room UI 설정
 */
const PINGPONG_ROOM_UI_CONFIG: RoomUIConfig = {
  colors: {
    panel: 0x1e293b, // 다크 블루
    primary: 0x3b82f6, // 파란색 (핑퐁 테마)
    danger: 0xef4444, // 빨간색
    cardActive: 0x475569,
    cardInactive: 0x334155,
    subText: "#94a3b8",
    gold: "#fbbf24",
  },
  layout: {
    panelWidth: 650,
    panelHeight: 700,
    roomCardWidth: 550,
    roomCardHeight: 80,
    roomCardSpacing: 90,
    playerCardHeight: 90,
    playerCardSpacing: 110,
    buttonGap: 20,
  },
  textStyle: {
    title: {
      fontSize: "48px",
      fontFamily: "Press Start 2P, Arial",
      color: "#ffffff",
      fontStyle: "bold",
    },
    normal: {
      fontSize: "20px",
      fontFamily: "Press Start 2P, Arial",
      color: "#ffffff",
    },
  },
};

/**
 * PingPongRoomUIManager
 * - BaseRoomUIManager를 상속받아 핑퐁 스타일 적용
 * - 설정만 주입하면 기본 UI는 자동으로 렌더링됨
 */
export class PingPongRoomUIManager extends BaseRoomUIManager {
  constructor(scene: Phaser.Scene, socket: Socket) {
    super(scene, socket, PINGPONG_ROOM_UI_CONFIG);
  }

  // 특별한 UI가 필요하면 메서드 오버라이드
  // 대부분의 경우 기본 구현으로 충분
}
