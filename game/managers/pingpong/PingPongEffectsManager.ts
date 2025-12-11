// game/managers/pingpong/PingPongEffectsManager.ts
import { PINGPONG_CONFIG, PingPongPaddle } from "@/game/types/realPingPong";

type Scorer = "player" | "ai";

/**
 * 탁구 게임 효과 관리
 * - 득점 효과 (펄스, 팝업, 플래시)
 * - 네트 히트 효과
 * - 플레이어 인디케이터
 * - 각종 애니메이션
 */
export class PingPongEffectsManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 득점 효과 생성 (통합)
   */
  createScoreEffect(
    scorer: Scorer,
    playerScoreText: Phaser.GameObjects.Text,
    aiScoreText: Phaser.GameObjects.Text
  ): void {
    const isPlayerScore = scorer === "player";
    const targetText = isPlayerScore ? playerScoreText : aiScoreText;
    const scoreColor = isPlayerScore ? "#4a90e2" : "#e74c3c";

    // 점수 텍스트 펄스
    this.createScorePulse(targetText);

    // +1 팝업
    this.createPointPopup(targetText.x, targetText.y, scoreColor);

    // 플래시 효과
    this.createFlashEffect(targetText.x, targetText.y, scoreColor);
  }

  /**
   * 점수 텍스트 펄스 애니메이션
   */
  private createScorePulse(targetText: Phaser.GameObjects.Text): void {
    this.scene.tweens.add({
      targets: targetText,
      scaleX: PINGPONG_CONFIG.SCORE_PULSE_SCALE,
      scaleY: PINGPONG_CONFIG.SCORE_PULSE_SCALE,
      duration: PINGPONG_CONFIG.SCORE_PULSE_DURATION,
      yoyo: true,
      ease: "Back.easeOut",
    });
  }

  /**
   * +1 팝업 생성
   */
  private createPointPopup(x: number, y: number, color: string): void {
    const pointPopup = this.scene.add
      .text(x, y - 20, "+1", {
        fontSize: PINGPONG_CONFIG.POPUP_FONT_SIZE,
        color,
        fontFamily: "Arial Black, Arial, sans-serif",
        stroke: "#ffffff",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.scene.tweens.add({
      targets: pointPopup,
      y: y - PINGPONG_CONFIG.POPUP_RISE_DISTANCE,
      alpha: 0,
      scale: 1.5,
      duration: PINGPONG_CONFIG.POPUP_DURATION,
      ease: "Power3.easeOut",
      onComplete: () => pointPopup.destroy(),
    });
  }

  /**
   * 플래시 효과 생성
   */
  private createFlashEffect(x: number, y: number, color: string): void {
    const flash = this.scene.add.circle(
      x,
      y,
      PINGPONG_CONFIG.FLASH_RADIUS,
      parseInt(color.replace("#", "0x")),
      0.3
    );

    this.scene.tweens.add({
      targets: flash,
      scale: PINGPONG_CONFIG.FLASH_SCALE,
      alpha: 0,
      duration: PINGPONG_CONFIG.FLASH_DURATION,
      ease: "Power2.easeOut",
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * 네트 히트 효과
   */
  createNetHitEffect(x: number, y: number): void {
    for (let i = 0; i < 5; i++) {
      const particle = this.scene.add.circle(
        x,
        y,
        2,
        PINGPONG_CONFIG.PARTICLE_COLOR
      );

      this.scene.tweens.add({
        targets: particle,
        x: x + (Math.random() - 0.5) * PINGPONG_CONFIG.FLASH_RADIUS,
        y: y + Math.random() * 30,
        alpha: 0,
        duration: 500,
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * 플레이어 위치 표시 (게임 시작 시)
   */
  showPlayerIndicators(
    playerPaddle: PingPongPaddle,
    aiPaddle: PingPongPaddle
  ): void {
    const playerElements = this.createPlayerIndicator(
      playerPaddle.x,
      playerPaddle.y,
      "PLAYER 1",
      0x00ff88,
      0x00ffaa
    );

    const aiElements = this.createPlayerIndicator(
      aiPaddle.x,
      aiPaddle.y,
      "COMPUTER",
      0xff4466,
      0xff6688
    );

    const allElements = [...playerElements, ...aiElements];

    // 페이드 인 및 브리딩 애니메이션
    this.animatePlayerIndicators(allElements);

    // 3초 후 페이드 아웃
    this.scene.time.delayedCall(3000, () => {
      this.fadeOutPlayerIndicators(allElements);
    });
  }

  /**
   * 개별 플레이어 인디케이터 생성
   */
  private createPlayerIndicator(
    x: number,
    y: number,
    label: string,
    fillColor: number,
    strokeColor: number
  ): Phaser.GameObjects.GameObject[] {
    // 패널
    const panel = this.scene.add.graphics();
    panel.fillStyle(fillColor, 0.8);
    panel.fillRoundedRect(x - 50, y - 100, 100, 35, 8);
    panel.lineStyle(2, strokeColor, 1);
    panel.strokeRoundedRect(x - 50, y - 100, 100, 35, 8);

    // 텍스트
    const text = this.scene.add
      .text(x, y - 82, label, {
        fontSize: "14px",
        color: "#000000",
        fontFamily: "Arial, sans-serif",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // 빔
    const beam = this.scene.add.graphics();
    beam.lineStyle(3, fillColor, 0.8);
    beam.lineBetween(x, y - 65, x, y - 40);

    // 글로우
    const glow = this.scene.add.circle(x, y, 40, fillColor, 0.2);

    return [panel, text, beam, glow];
  }

  /**
   * 플레이어 인디케이터 애니메이션
   */
  private animatePlayerIndicators(
    elements: Phaser.GameObjects.GameObject[]
  ): void {
    // 페이드 인
    elements.forEach((element) => {
      if ("setAlpha" in element && typeof element.setAlpha === "function") {
        element.setAlpha(0);
      }
      this.scene.tweens.add({
        targets: element,
        alpha:
          element instanceof Phaser.GameObjects.Graphics ||
          element instanceof Phaser.GameObjects.Text
            ? 1
            : 0.2,
        duration: 500,
        ease: "Power2.easeOut",
      });
    });

    // 브리딩 효과 (0.6초 후 시작)
    this.scene.time.delayedCall(600, () => {
      elements.forEach((element, index) => {
        let duration: number;
        let targetAlpha: number;

        if (element instanceof Phaser.GameObjects.Graphics) {
          // 패널과 빔
          if (index % 4 === 0 || index % 4 === 2) {
            duration = index % 4 === 0 ? 1500 : 800;
            targetAlpha = index % 4 === 0 ? 0.6 : 0.5;
          } else {
            return;
          }
        } else if (element instanceof Phaser.GameObjects.Text) {
          duration = 1200;
          targetAlpha = 0.8;
        } else {
          // 글로우
          this.scene.tweens.add({
            targets: element,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0.1,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
          return;
        }

        this.scene.tweens.add({
          targets: element,
          alpha: targetAlpha,
          duration: duration,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      });
    });
  }

  /**
   * 플레이어 인디케이터 페이드 아웃
   */
  private fadeOutPlayerIndicators(
    elements: Phaser.GameObjects.GameObject[]
  ): void {
    this.scene.tweens.killTweensOf(elements);

    this.scene.tweens.add({
      targets: elements,
      alpha: 0,
      duration: 500,
      ease: "Power2.easeIn",
      onComplete: () => {
        elements.forEach((element) => element.destroy());
      },
    });
  }

  /**
   * 깜빡임 효과 (텍스트용)
   */
  createBlinkEffect(target: Phaser.GameObjects.Text): void {
    this.scene.tweens.add({
      targets: target,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * 스케일 펄스 효과
   */
  createPulseEffect(
    target: Phaser.GameObjects.GameObject,
    scale: number = 1.1,
    duration: number = 300
  ): void {
    this.scene.tweens.add({
      targets: target,
      scale: scale,
      duration: duration,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * 페이드 인 효과
   */
  createFadeIn(
    target: Phaser.GameObjects.GameObject,
    duration: number = 500
  ): void {
    if ("setAlpha" in target && typeof target.setAlpha === "function") {
      target.setAlpha(0);
    }
    this.scene.tweens.add({
      targets: target,
      alpha: 1,
      duration: duration,
      ease: "Power2.easeOut",
    });
  }

  /**
   * 페이드 아웃 효과
   */
  createFadeOut(
    target: Phaser.GameObjects.GameObject,
    duration: number = 500,
    onComplete?: () => void
  ): void {
    this.scene.tweens.add({
      targets: target,
      alpha: 0,
      duration: duration,
      ease: "Power2.easeIn",
      onComplete: () => {
        target.destroy();
        onComplete?.();
      },
    });
  }

  /**
   * 슬라이드 인 효과 (위에서 아래로)
   */
  createSlideIn(
    target: Phaser.GameObjects.GameObject,
    fromY: number,
    toY: number,
    duration: number = 500
  ): void {
    if ("y" in target && typeof (target as { y?: number }).y === "number") {
      (target as { y: number }).y = fromY;
      this.scene.tweens.add({
        targets: target,
        y: toY,
        duration: duration,
        ease: "Back.easeOut",
      });
    }
  }

  /**
   * 회전 효과
   */
  createRotation(
    target: Phaser.GameObjects.GameObject,
    duration: number = 1000
  ): void {
    if ("rotation" in target) {
      this.scene.tweens.add({
        targets: target,
        rotation: Math.PI * 2,
        duration: duration,
        repeat: -1,
        ease: "Linear",
      });
    }
  }

  /**
   * 흔들림 효과 (화면 쉐이크)
   */
  createScreenShake(intensity: number = 5, duration: number = 200): void {
    this.scene.cameras.main.shake(duration, intensity / 1000);
  }

  /**
   * 모든 트윈 중지 (정리용)
   */
  stopAllTweens(): void {
    this.scene.tweens.killAll();
  }
}
