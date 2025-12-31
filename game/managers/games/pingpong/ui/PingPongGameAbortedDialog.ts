// game/managers/games/pingpong/ui/PingPongGameAbortedDialog.ts

import { BaseGameAbortedDialog } from "@/game/managers/base/multiplayer/ui/BaseGameAbortedDialog";
import type { GameAbortedDialogConfig } from "@/game/managers/base/multiplayer/ui/BaseGameAbortedDialog";

/**
 * 핑퐁 게임 중단 다이얼로그 설정
 */
const PINGPONG_ABORT_CONFIG: GameAbortedDialogConfig = {
  colors: {
    overlay: 0x000000,
    overlayAlpha: 0.8,
    titleText: "#ff6b6b",
    reasonText: "#ffffff",
    buttonColor: 0x6b7280, // 회색
  },
  textStyle: {
    title: {
      fontSize: "48px",
      fontFamily: "Press Start 2P, Arial",
      fontStyle: "bold",
    },
    reason: {
      fontSize: "24px",
      fontFamily: "Press Start 2P, Arial",
    },
  },
  depth: 10000,
};

/**
 * PingPongGameAbortedDialog
 * - BaseGameAbortedDialog를 상속받아 핑퐁 스타일 적용
 * - 설정만 주입하면 기본 UI는 자동으로 렌더링됨
 */
export class PingPongGameAbortedDialog extends BaseGameAbortedDialog {
  constructor(scene: Phaser.Scene) {
    super(scene, PINGPONG_ABORT_CONFIG);
  }

  // 추가 커스터마이징 필요하면 메서드 오버라이드
  // 대부분의 경우 기본 구현으로 충분
}
