// game/managers/base/multiplayer/ui/BaseEndGameUIManager.ts

import { ButtonFactory } from "@/utils/ButtonFactory";

/**
 * 게임 종료 UI 설정
 */
export interface EndGameUIConfig {
  colors: {
    overlay: number;
    overlayAlpha: number;
    winnerText: string;
    buttonPrimary: number;
    buttonDanger: number;
  };
  layout: {
    winnerTextY: number;
    buttonYOffset: number;
    buttonSpacing: number;
    buttonWidth: number;
    buttonHeight: number;
  };
  textStyle: {
    winner: Partial<Phaser.Types.GameObjects.Text.TextStyle>;
  };
  depth: number;
}

/**
 * BaseEndGameUIManager
 * - 모든 게임의 종료 UI 공통화
 * - 승자 표시 + 재시작/나가기 버튼
 * - 게임별로 색상/레이아웃만 커스터마이징
 */
export class BaseEndGameUIManager {
  protected scene: Phaser.Scene;
  protected config: EndGameUIConfig;
  protected endGameUI: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene, config: EndGameUIConfig) {
    this.scene = scene;
    this.config = config;
  }

  // =====================================================================
  // Public API
  // =====================================================================

  /**
   * 게임 종료 UI 표시
   * @param winnerName - 승자 이름
   * @param onRestart - 재시작 콜백
   * @param onExit - 나가기 콜백
   */
  public show(
    winnerName: string,
    onRestart: () => void,
    onExit: () => void
  ): void {
    this.clear();

    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // 컨테이너 생성
    this.endGameUI = this.scene.add
      .container(centerX, centerY)
      .setDepth(this.config.depth);

    // 반투명 배경
    this.createOverlay(centerX, centerY);

    // 승자 텍스트
    this.createWinnerText(winnerName);

    // 버튼들
    this.createButtons(onRestart, onExit);
  }

  /**
   * UI 제거
   */
  public clear(): void {
    this.endGameUI?.destroy();
    this.endGameUI = null;
  }

  // =====================================================================
  // Private 렌더링 로직
  // =====================================================================

  /**
   * 반투명 오버레이 생성
   */
  private createOverlay(centerX: number, centerY: number): void {
    const { width, height } = this.scene.scale;
    const { overlay, overlayAlpha } = this.config.colors;

    const overlayRect = this.scene.add
      .rectangle(-centerX, -centerY, width, height, overlay, overlayAlpha)
      .setOrigin(0, 0);

    this.endGameUI!.add(overlayRect);
  }

  /**
   * 승자 텍스트 생성
   */
  private createWinnerText(winnerName: string): void {
    const winText = this.scene.add
      .text(0, this.config.layout.winnerTextY, `🎉 ${winnerName} 승리! 🎉`, {
        ...this.config.textStyle.winner,
        color: this.config.colors.winnerText,
      })
      .setOrigin(0.5)
      .setScale(0)
      .setShadow(4, 4, "#000000", 8);

    // 팝 애니메이션
    this.scene.tweens.add({
      targets: winText,
      scale: 1,
      duration: 500,
      ease: "Back.easeOut",
    });

    this.endGameUI!.add(winText);
  }

  /**
   * 버튼들 생성
   */
  private createButtons(onRestart: () => void, onExit: () => void): void {
    const { buttonYOffset, buttonSpacing, buttonWidth, buttonHeight } =
      this.config.layout;
    const { buttonPrimary, buttonDanger } = this.config.colors;

    // 재시작 버튼
    const restartBtn = ButtonFactory.createButton(
      this.scene,
      0,
      buttonYOffset,
      "RESTART",
      () => {
        this.clear();
        onRestart();
      },
      {
        width: buttonWidth,
        height: buttonHeight,
        color: buttonPrimary,
        textColor: "#ffffff",
      }
    );

    // 나가기 버튼
    const exitBtn = ButtonFactory.createButton(
      this.scene,
      0,
      buttonYOffset + buttonHeight + buttonSpacing,
      "EXIT",
      () => {
        this.clear();
        onExit();
      },
      {
        width: buttonWidth,
        height: buttonHeight,
        color: buttonDanger,
        textColor: "#ffffff",
      }
    );

    this.endGameUI!.add([restartBtn, exitBtn]);

    // 버튼 애니메이션
    this.animateButtons([restartBtn, exitBtn]);
  }

  /**
   * 버튼 애니메이션
   */
  private animateButtons(buttons: Phaser.GameObjects.Container[]): void {
    buttons.forEach((btn, index) => {
      btn.setAlpha(0);
      btn.y += 20;

      this.scene.tweens.add({
        targets: btn,
        alpha: 1,
        y: btn.y - 20,
        duration: 300,
        delay: 200 + index * 100,
        ease: "Power2.easeOut",
      });
    });
  }
}
