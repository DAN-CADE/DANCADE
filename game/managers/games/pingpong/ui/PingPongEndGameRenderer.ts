// game/managers/games/pingpong/ui/PingPongEndGameRenderer.ts

import { BaseEndGameUIManager } from "@/game/managers/base/multiplayer/ui/BaseEndGameUIManager";
import type { EndGameUIConfig } from "@/game/managers/base/multiplayer/ui/BaseEndGameUIManager";

/**
 * 핑퐁 게임 종료 UI 설정
 */
const PINGPONG_END_GAME_CONFIG: EndGameUIConfig = {
  colors: {
    overlay: 0x000000,
    overlayAlpha: 0.85,
    winnerText: "#fbbf24", // 금색
    buttonPrimary: 0x3b82f6, // 파란색 (핑퐁 테마)
    buttonDanger: 0xef4444, // 빨간색
  },
  layout: {
    winnerTextY: -120,
    buttonYOffset: 80,
    buttonSpacing: 40,
    buttonWidth: 200,
    buttonHeight: 70,
  },
  textStyle: {
    winner: {
      fontSize: "48px",
      fontFamily: "Press Start 2P, Arial",
      fontStyle: "bold",
    },
  },
  depth: 1000, // 높은 depth
};

/**
 * PingPongEndGameRenderer
 * - BaseEndGameUIManager를 상속받아 핑퐁 스타일 적용
 * - 설정만 주입하면 기본 UI는 자동으로 렌더링됨
 */
export class PingPongEndGameRenderer extends BaseEndGameUIManager {
  constructor(scene: Phaser.Scene) {
    super(scene, PINGPONG_END_GAME_CONFIG);
  }

  // 추가 커스터마이징 필요하면 메서드 오버라이드
  // 대부분의 경우 기본 구현으로 충분
}
