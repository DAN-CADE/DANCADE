// game/managers/games/Omok/ui/OmokMessageRenderer.ts
import { OMOK_CONFIG } from "@/game/types/omok";

/**
 * OmokMessageRenderer
 * - 메시지 표시만 담당 (금수 메시지, 대기 메시지 등)
 */
export class OmokMessageRenderer {
  private scene: Phaser.Scene;
  private currentMessage: Phaser.GameObjects.Container | null = null;

  // 레이아웃 상수
  private readonly LAYOUT = {
    MAX_WIDTH: 400,
    PADDING_X: 30,
    PADDING_Y: 15,
    ANIMATION_OFFSET_Y: 20,
    AUTO_HIDE_DELAY: 2000,
    FADE_DURATION: 500,
  } as const;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // =====================================================================
  // Public API
  // =====================================================================

  /**
   * 금수 메시지 표시
   * @param message - 표시할 메시지
   */
  public showForbiddenMessage(message: string): void {
    this.showMessage(message, OMOK_CONFIG.COLORS.DANGER, true);
  }

  /**
   * 대기 메시지 표시
   * @param message - 표시할 메시지
   */
  public showWaitingMessage(message: string): void {
    this.showMessage(message, OMOK_CONFIG.COLORS.PRIMARY, false);
  }

  /**
   * 일반 메시지 표시
   * @param message - 표시할 메시지
   * @param color - 배경 색상
   * @param autoHide - 자동 숨김 여부
   */
  public showMessage(
    message: string,
    color: string | number = OMOK_CONFIG.COLORS.PRIMARY,
    autoHide = false
  ): void {
    this.clearMessage();

    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // 컨테이너 생성
    this.currentMessage = this.scene.add
      .container(centerX, centerY)
      .setDepth(OMOK_CONFIG.DEPTH.MESSAGE)
      .setAlpha(0);

    // 배경 및 텍스트 생성
    const { bg, text } = this.createMessageBox(message, color);
    this.currentMessage.add([bg, text]);

    // 애니메이션
    this.animateIn();

    // 자동 숨김
    if (autoHide) {
      this.scheduleAutoHide();
    }
  }

  /**
   * 메시지 제거
   */
  public clearMessage(): void {
    if (this.currentMessage) {
      this.currentMessage.destroy();
      this.currentMessage = null;
    }
  }

  // =====================================================================
  // Private 렌더링 로직
  // =====================================================================

  /**
   * 메시지 박스 생성
   */
  private createMessageBox(
    message: string,
    color: string | number
  ): { bg: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text } {
    // 텍스트 생성 (크기 측정용)
    const text = this.scene.add
      .text(0, 0, message, {
        ...OMOK_CONFIG.TEXT_STYLE.NORMAL,
        color: "#ffffff",
        fontStyle: "bold",
        wordWrap: { width: this.LAYOUT.MAX_WIDTH },
      })
      .setOrigin(0.5);

    // 배경 크기 계산
    const bgWidth = text.width + this.LAYOUT.PADDING_X * 2;
    const bgHeight = text.height + this.LAYOUT.PADDING_Y * 2;

    // 배경 생성
    const bg = this.scene.add.graphics();
    const colorValue =
      typeof color === "string" ? parseInt(color.replace("#", ""), 16) : color;

    bg.fillStyle(colorValue, 0.95);
    bg.fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 10);
    bg.lineStyle(2, 0xffffff, 0.3);
    bg.strokeRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 10);

    return { bg, text };
  }

  /**
   * 페이드 인 애니메이션
   */
  private animateIn(): void {
    if (!this.currentMessage) return;

    const { ANIMATION_OFFSET_Y, FADE_DURATION } = this.LAYOUT;

    // 초기 위치 (아래에서 올라옴)
    this.currentMessage.y += ANIMATION_OFFSET_Y;

    // 애니메이션
    this.scene.tweens.add({
      targets: this.currentMessage,
      alpha: 1,
      y: this.currentMessage.y - ANIMATION_OFFSET_Y,
      duration: FADE_DURATION,
      ease: "Back.easeOut",
    });
  }

  /**
   * 페이드 아웃 애니메이션
   */
  private animateOut(): void {
    if (!this.currentMessage) return;

    const { ANIMATION_OFFSET_Y, FADE_DURATION } = this.LAYOUT;

    this.scene.tweens.add({
      targets: this.currentMessage,
      alpha: 0,
      y: this.currentMessage.y - ANIMATION_OFFSET_Y,
      duration: FADE_DURATION,
      ease: "Power2.easeIn",
      onComplete: () => this.clearMessage(),
    });
  }

  /**
   * 자동 숨김 예약
   */
  private scheduleAutoHide(): void {
    const { AUTO_HIDE_DELAY } = this.LAYOUT;

    this.scene.time.delayedCall(AUTO_HIDE_DELAY, () => {
      this.animateOut();
    });
  }
}
