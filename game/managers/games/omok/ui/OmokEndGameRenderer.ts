import { BaseEndGameUIManager } from "@/game/managers/base/multiplayer/ui/BaseEndGameUIManager";
import { OMOK_CONFIG } from "@/game/types/omok";
import type { EndGameUIConfig } from "@/game/managers/base/multiplayer/ui/BaseEndGameUIManager";

/**
 * 오목 게임 종료 UI 설정
 */
const OMOK_END_GAME_CONFIG: EndGameUIConfig = {
  colors: {
    overlay: 0x000000,
    overlayAlpha: 0.85,
    winnerText: OMOK_CONFIG.COLORS.GOLD,
    buttonPrimary: OMOK_CONFIG.COLORS.PRIMARY,
    buttonDanger: OMOK_CONFIG.COLORS.DANGER,
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
      ...OMOK_CONFIG.TEXT_STYLE.TITLE,
      fontStyle: "bold",
    },
  },
  depth: OMOK_CONFIG.DEPTH.MESSAGE,
};

/**
 * OmokEndGameRenderer
 * - BaseEndGameUIManager를 상속받아 오목 스타일 적용
 * - 설정만 주입하면 기본 UI는 자동으로 렌더링됨
 */
export class OmokEndGameRenderer extends BaseEndGameUIManager {
  constructor(scene: Phaser.Scene) {
    super(scene, OMOK_END_GAME_CONFIG);
  }

  // ✅ 추가 커스터마이징 필요하면 메서드 오버라이드
  // 대부분의 경우 기본 구현으로 충분
}
