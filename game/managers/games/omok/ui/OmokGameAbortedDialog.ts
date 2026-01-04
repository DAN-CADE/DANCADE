// game/managers/games/omok/ui/OmokGameAbortedDialog.ts

import { BaseGameAbortedDialog } from "@/game/managers/base/multiplayer/ui/BaseGameAbortedDialog";
import { FONT_CONFIG } from "@/game/types/common/ui.constants";
import { GameAbortedDialogConfig } from "@/game/types/common/ui.types";
import { OMOK_CONFIG } from "@/game/types/omok";

/**
 * 오목 게임 중단 다이얼로그 설정
 */
const OMOK_ABORT_CONFIG: GameAbortedDialogConfig = {
  colors: {
    overlay: 0x000000,
    overlayAlpha: 0.8,
    titleText: "#ff6b6b",
    reasonText: "#ffffff",
    buttonColor: OMOK_CONFIG.COLORS.BUTTON_GRAY,
  },
  textStyle: {
    title: {
      fontSize: "48px",
      fontFamily: FONT_CONFIG.FAMILY,
      fontStyle: "bold",
    },
    reason: {
      fontSize: "24px",
      fontFamily: FONT_CONFIG.FAMILY,
    },
  },
  // depth: 10000,
};

/**
 * OmokGameAbortedDialog
 * - BaseGameAbortedDialog를 상속받아 오목 스타일 적용
 * - 설정만 주입하면 기본 UI는 자동으로 렌더링됨
 */
export class OmokGameAbortedDialog extends BaseGameAbortedDialog {
  constructor(scene: Phaser.Scene) {
    super(scene, OMOK_ABORT_CONFIG);
  }

  // ✅ 추가 커스터마이징 필요하면 메서드 오버라이드
  // 대부분의 경우 기본 구현으로 충분
}
