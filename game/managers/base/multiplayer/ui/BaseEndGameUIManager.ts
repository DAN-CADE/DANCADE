import { EndGameUIConfig, ButtonSizeKey } from "@/game/types/common/ui.types";
import { BaseUIManager } from "@/game/managers/base/BaseUIManager";

export class BaseEndGameUIManager extends BaseUIManager {
  protected config: EndGameUIConfig;
  protected endGameUI: Phaser.GameObjects.Container | null = null;
  private readonly BUTTON_SIZE_KEY: ButtonSizeKey = "MEDIUM";

  constructor(scene: Phaser.Scene, config: EndGameUIConfig) {
    super(scene);
    this.config = config;
  }

  // =====================================================================
  // =====================================================================

  public createGameUI(): void {}

  public cleanup(): void {
    if (this.endGameUI) {
      this.endGameUI.destroy();
      this.endGameUI = null;
    }
  }

  // =====================================================================
  // =====================================================================

  public show(
    winnerName: string,
    onRestart: () => void,
    onExit: () => void
  ): void {
    this.cleanup();

    const { width, height } = this.scene.scale;
    this.endGameUI = this.scene.add
      .container(width / 2, height / 2)
      .setDepth(this.config.depth);

    const overlay = this.createOverlay(
      this.config.colors.overlay,
      this.config.colors.overlayAlpha
    );
    overlay.setPosition(0, 0);

    const winText = this.buildWinnerText(winnerName);
    const buttons = this.buildButtons(onRestart, onExit);

    this.endGameUI.add([overlay, winText, ...buttons]);

    this.animateEntrance(winText, buttons);
  }

  // =====================================================================
  // =====================================================================

  private buildWinnerText(winnerName: string): Phaser.GameObjects.Text {
    return this.scene.add
      .text(0, this.config.layout.winnerTextY, `🎉 ${winnerName} 승리! 🎉`, {
        ...this.config.textStyle.winner,
        color: this.config.colors.winnerText,
      })
      .setOrigin(0.5)
      .setScale(0)
      .setShadow(4, 4, "#000000", 8);
  }

  private buildButtons(
    onRestart: () => void,
    onExit: () => void
  ): Phaser.GameObjects.Container[] {
    const { buttonYOffset, buttonSpacing, buttonHeight } = this.config.layout;
    const { buttonPrimary, buttonDanger } = this.config.colors;

    const restartBtn = this.createCommonButton(
      0,
      buttonYOffset,
      "RESTART",
      () => {
        this.cleanup();
        onRestart();
      },
      {
        size: this.BUTTON_SIZE_KEY,
        color: buttonPrimary,
        textColor: "#ffffff",
      }
    );

    const exitBtn = this.createCommonButton(
      0,
      buttonYOffset + buttonHeight + buttonSpacing,
      "EXIT",
      () => {
        this.cleanup();
        onExit();
      },
      {
        size: this.BUTTON_SIZE_KEY,
        color: buttonDanger,
        textColor: "#ffffff",
      }
    );

    return [restartBtn, exitBtn];
  }

  // =====================================================================
  // =====================================================================

  private animateEntrance(
    title: Phaser.GameObjects.Text,
    buttons: Phaser.GameObjects.Container[]
  ): void {
    this.scene.tweens.add({
      targets: title,
      scale: 1,
      duration: 500,
      ease: "Back.easeOut",
    });

    buttons.forEach((btn, index) => {
      const originalY = btn.y;
      btn.setAlpha(0).setY(originalY + 20);
      this.scene.tweens.add({
        targets: btn,
        alpha: 1,
        y: originalY,
        duration: 300,
        delay: 200 + index * 100,
        ease: "Power2.easeOut",
      });
    });
  }
}
