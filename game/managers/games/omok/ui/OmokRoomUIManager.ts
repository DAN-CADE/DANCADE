import { Socket } from "socket.io-client";

import { OMOK_CONFIG } from "@/game/types/omok";

import { BaseRoomUIManager } from "@/game/managers/base/multiplayer/ui/BaseRoomUIManager";
import { COMMON_COLORS, TEXT_STYLE } from "@/game/types/common/ui.constants";
import { RoomUIConfig } from "@/game/types/common/ui.types";

/**
 * 오목 Room UI 설정
 */
const OMOK_ROOM_UI_CONFIG: RoomUIConfig = {
  colors: {
    panel: OMOK_CONFIG.COLORS.PANEL,
    primary: OMOK_CONFIG.COLORS.PRIMARY,
    // secondary: OMOK_CONFIG.COLORS.SECONDARY,
    danger: OMOK_CONFIG.COLORS.DANGER,
    cardActive: OMOK_CONFIG.COLORS.CARD_ACTIVE,
    cardInactive: OMOK_CONFIG.COLORS.CARD_INACTIVE,
    subText: COMMON_COLORS.TEXT_SECONDARY,
    gold: OMOK_CONFIG.COLORS.GOLD,
  },
  layout: {
    panelWidth: 600,
    panelHeight: 700,
    roomCardWidth: 500,
    roomCardHeight: 70,
    roomCardSpacing: 80,
    playerCardHeight: 80,
    playerCardSpacing: 100,
    buttonGap: 20,
  },
  textStyle: {
    title: TEXT_STYLE.SUBTITLE,
    normal: TEXT_STYLE.NORMAL,
    // small: TEXT_STYLE.SMALL,
  },
};

/**
 * OmokRoomUIManager
 * - BaseRoomUIManager를 상속받아 오목 스타일 적용
 * - 설정만 주입하면 기본 UI는 자동으로 렌더링됨
 */
export class OmokRoomUIManager extends BaseRoomUIManager {
  constructor(scene: Phaser.Scene, socket: Socket) {
    super(scene, socket, OMOK_ROOM_UI_CONFIG);
  }

  // 특별한 UI가 필요하면 메서드 오버라이드
  // 예: renderPlayerCards(), renderWaitingRoomButtons() 등
  // 대부분의 경우 기본 구현으로 충분
}
