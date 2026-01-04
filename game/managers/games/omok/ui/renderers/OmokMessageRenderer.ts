import { COMMON_COLORS, TEXT_STYLE } from "@/game/types/common/ui.constants";
import { OMOK_CONFIG } from "@/game/types/omok";
import { MESSAGE_LAYOUT } from "@/game/types/omok/omok.constants";

export class OmokMessageRenderer {
  private scene: Phaser.Scene;
  private currentMessage: Phaser.GameObjects.Container | null = null;
  // 자동 숨김 타이머 참조 저장
  private autoHideTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // =====================================================================
  // =====================================================================

  public clear(): void {
    // 진행 중인 타이머 제거
    if (this.autoHideTimer) {
      this.autoHideTimer.destroy();
      this.autoHideTimer = null;
    }

    // 진행 중인 트윈 제거
    if (this.currentMessage) {
      this.scene.tweens.killTweensOf(this.currentMessage);
      this.currentMessage.destroy();
      this.currentMessage = null;
    }
  }

  // =====================================================================
  // =====================================================================

  public showForbiddenMessage(message: string): void {
    this.show(message, COMMON_COLORS.DANGER, true);
  }

  public showWaitingMessage(message: string): void {
    this.show(message, COMMON_COLORS.PRIMARY, false);
  }

  public show(
    message: string,
    color: string | number = COMMON_COLORS.PRIMARY,
    autoHide = false
  ): void {
    this.clear();

    const { width, height } = this.scene.scale;

    this.currentMessage = this.scene.add
      .container(width / 2, height / 2)
      .setDepth(OMOK_CONFIG.DEPTH.MESSAGE)
      .setAlpha(0);

    const { bg, text } = this.buildMessageBox(message, color);
    this.currentMessage.add([bg, text]);

    this.animateIn();

    if (autoHide) {
      this.scheduleAutoHide();
    }
  }

  // =====================================================================
  // =====================================================================

  private buildMessageBox(
    message: string,
    color: string | number
  ): { bg: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text } {
    const text = this.scene.add
      .text(0, 0, message, {
        ...TEXT_STYLE.NORMAL,
        color: COMMON_COLORS.TEXT_PRIMARY,
        fontStyle: "bold",
        wordWrap: { width: MESSAGE_LAYOUT.MAX_WIDTH },
      })
      .setOrigin(0.5);

    const bgWidth = text.width + MESSAGE_LAYOUT.PADDING_X * 2;
    const bgHeight = text.height + MESSAGE_LAYOUT.PADDING_Y * 2;

    const bg = this.scene.add.graphics();

    const colorValue =
      typeof color === "string" ? parseInt(color.replace("#", ""), 16) : color;

    bg.fillStyle(colorValue, 0.95);
    bg.fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 10);
    bg.lineStyle(2, 0xffffff, 0.3);
    bg.strokeRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 10);

    return { bg, text };
  }

  // =====================================================================
  // 애니메이션 로직
  // =====================================================================

  private animateIn(): void {
    if (!this.currentMessage) return;

    const { ANIMATION_OFFSET_Y, FADE_DURATION } = MESSAGE_LAYOUT;

    this.currentMessage.y += ANIMATION_OFFSET_Y;

    this.scene.tweens.add({
      targets: this.currentMessage,
      alpha: 1,
      y: this.currentMessage.y - ANIMATION_OFFSET_Y,
      duration: FADE_DURATION,
      ease: "Back.easeOut",
    });
  }

  private animateOut(): void {
    if (!this.currentMessage) return;

    const { ANIMATION_OFFSET_Y, FADE_DURATION } = MESSAGE_LAYOUT;

    this.scene.tweens.add({
      targets: this.currentMessage,
      alpha: 0,
      y: this.currentMessage.y - ANIMATION_OFFSET_Y,
      duration: FADE_DURATION,
      ease: "Power2.easeIn",
      onComplete: () => this.clear(),
    });
  }

  private scheduleAutoHide(): void {
    // 타이머 참조를 저장하여 관리
    this.autoHideTimer = this.scene.time.delayedCall(
      MESSAGE_LAYOUT.AUTO_HIDE_DELAY,
      () => this.animateOut()
    );
  }
}
