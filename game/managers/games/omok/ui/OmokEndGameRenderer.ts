// // game/managers/games/Omok/ui/OmokEndGameRenderer.ts
// import { ButtonFactory } from "@/utils/ButtonFactory";
// import { OMOK_CONFIG } from "@/game/types/omok";

// /**
//  * OmokEndGameRenderer
//  * - 게임 종료 UI 렌더링만 담당
//  */
// export class OmokEndGameRenderer {
//   private scene: Phaser.Scene;
//   private endGameUI: Phaser.GameObjects.Container | null = null;

//   // 레이아웃 상수
//   private readonly LAYOUT = {
//     WINNER_TEXT_Y: -120, // 승자 텍스트 위치
//     BUTTON_Y_OFFSET: 80, // 버튼 Y 위치
//     BUTTON_SPACING: 40, // 버튼 간격
//     BUTTON_WIDTH: 200, // 버튼 너비
//     BUTTON_HEIGHT: 70, // 버튼 높이
//   } as const;

//   constructor(scene: Phaser.Scene) {
//     this.scene = scene;
//   }

//   // =====================================================================
//   // Public API
//   // =====================================================================

//   /**
//    * 게임 종료 UI 표시
//    * @param winnerName - 승자 이름
//    * @param onRestart - 재시작 콜백
//    * @param onExit - 나가기 콜백
//    */
//   public show(
//     winnerName: string,
//     onRestart: () => void,
//     onExit: () => void
//   ): void {
//     this.clear();

//     const { width, height } = this.scene.scale;
//     const centerX = width / 2;
//     const centerY = height / 2;

//     // 컨테이너 생성
//     this.endGameUI = this.scene.add
//       .container(centerX, centerY)
//       .setDepth(OMOK_CONFIG.DEPTH.MESSAGE);

//     // 반투명 배경
//     this.createOverlay(centerX, centerY);

//     // 승자 텍스트
//     this.createWinnerText(winnerName);

//     // 버튼들
//     this.createButtons(onRestart, onExit);
//   }

//   /**
//    * UI 제거
//    */
//   public clear(): void {
//     this.endGameUI?.destroy();
//     this.endGameUI = null;
//   }

//   // =====================================================================
//   // Private 렌더링 로직
//   // =====================================================================

//   /**
//    * 반투명 오버레이 생성
//    */
//   private createOverlay(centerX: number, centerY: number): void {
//     const { width, height } = this.scene.scale;

//     // ✅ 투명도 0.7 → 0.85로 증가 (보드 더 잘 가림)
//     const overlay = this.scene.add
//       .rectangle(-centerX, -centerY, width, height, 0x000000, 0.85)
//       .setOrigin(0, 0);

//     this.endGameUI!.add(overlay);
//   }

//   /**
//    * 승자 텍스트 생성
//    */
//   private createWinnerText(winnerName: string): void {
//     const winText = this.scene.add
//       .text(0, this.LAYOUT.WINNER_TEXT_Y, `🎉 ${winnerName} 승리! 🎉`, {
//         ...OMOK_CONFIG.TEXT_STYLE.TITLE,
//         color: OMOK_CONFIG.COLORS.GOLD,
//         fontStyle: "bold",
//       })
//       .setOrigin(0.5)
//       .setScale(0)
//       .setShadow(4, 4, "#000000", 8);

//     // 팝 애니메이션
//     this.scene.tweens.add({
//       targets: winText,
//       scale: 1,
//       duration: 500,
//       ease: "Back.easeOut",
//     });

//     this.endGameUI!.add(winText);
//   }

//   /**
//    * 버튼들 생성
//    */
//   private createButtons(onRestart: () => void, onExit: () => void): void {
//     const { BUTTON_Y_OFFSET, BUTTON_SPACING, BUTTON_WIDTH, BUTTON_HEIGHT } =
//       this.LAYOUT;

//     // ✅ 재시작 버튼 (위)
//     const restartBtn = ButtonFactory.createButton(
//       this.scene,
//       0,
//       BUTTON_Y_OFFSET,
//       "RESTART",
//       () => {
//         this.clear();
//         onRestart();
//       },
//       {
//         width: BUTTON_WIDTH,
//         height: BUTTON_HEIGHT,
//         color: OMOK_CONFIG.COLORS.PRIMARY,
//         textColor: "#ffffff",
//       }
//     );

//     // ✅ 나가기 버튼 (아래)
//     const exitBtn = ButtonFactory.createButton(
//       this.scene,
//       0,
//       BUTTON_Y_OFFSET + BUTTON_HEIGHT + BUTTON_SPACING,
//       "EXIT",
//       () => {
//         this.clear();
//         onExit();
//       },
//       {
//         width: BUTTON_WIDTH,
//         height: BUTTON_HEIGHT,
//         color: OMOK_CONFIG.COLORS.DANGER,
//         textColor: "#ffffff",
//       }
//     );

//     this.endGameUI!.add([restartBtn, exitBtn]);

//     // 버튼 애니메이션 (순차적)
//     this.animateButtons([restartBtn, exitBtn]);
//   }

//   /**
//    * 버튼 애니메이션
//    */
//   private animateButtons(buttons: Phaser.GameObjects.Container[]): void {
//     buttons.forEach((btn, index) => {
//       btn.setAlpha(0);
//       btn.y += 20;

//       this.scene.tweens.add({
//         targets: btn,
//         alpha: 1,
//         y: btn.y - 20,
//         duration: 300,
//         delay: 200 + index * 100,
//         ease: "Power2.easeOut",
//       });
//     });
//   }
// }

// game/managers/games/omok/ui/OmokEndGameRenderer.ts

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
