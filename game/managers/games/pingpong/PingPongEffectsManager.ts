// game/managers/games/pingpong/PingPongEffectsManager.ts

import { BaseEffectsManager } from "@/game/managers/base";
import { PINGPONG_CONFIG, PingPongPaddle } from "@/game/types/pingpong";

type Scorer = "player" | "ai";

/**
 * 탁구 게임 효과 관리
 */
export class PingPongEffectsManager extends BaseEffectsManager {
  createScoreEffect(
    scorer: Scorer,
    playerScoreText: Phaser.GameObjects.Text,
    aiScoreText: Phaser.GameObjects.Text
  ): void {
    const isPlayerScore = scorer === "player";
    const targetText = isPlayerScore ? playerScoreText : aiScoreText;
    const scoreColor = isPlayerScore ? "#4a90e2" : "#e74c3c";

    this.createScorePulse(targetText);
    this.createPointPopup(targetText.x, targetText.y, scoreColor);
    this.createFlashEffect(targetText.x, targetText.y, scoreColor);
  }

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

  createPerfectHitEffect(x: number, y: number): void {
    // "PERFECT!" 텍스트
    const perfectText = this.scene.add
      .text(x, y, "PERFECT!", {
        fontSize: "16px",
        color: "#ffd700", // 골드
        fontFamily: '"Press Start 2P"',
        stroke: "#ffffff",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.scene.tweens.add({
      targets: perfectText,
      y: y - 40,
      alpha: 0,
      scale: 1.5,
      duration: 800,
      ease: "Power2.easeOut",
      onComplete: () => perfectText.destroy(),
    });

    // 골드 링 효과
    const ring = this.scene.add.circle(x, y, 20, 0xffd700, 0);
    ring.setStrokeStyle(3, 0xffd700, 0.8);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 600,
      ease: "Power2.easeOut",
      onComplete: () => ring.destroy(),
    });

    // 8방향 반짝이 파티클
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const distance = 30;
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;

      const particle = this.scene.add.circle(x, y, 3, 0xffd700);

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.5,
        duration: 400,
        ease: "Power2.easeOut",
        onComplete: () => particle.destroy(),
      });
    }
  }

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

    this.animatePlayerIndicators(allElements);

    this.scene.time.delayedCall(3000, () => {
      this.fadeOutPlayerIndicators(allElements);
    });
  }

  private createPlayerIndicator(
    x: number,
    y: number,
    label: string,
    fillColor: number,
    strokeColor: number
  ): Phaser.GameObjects.GameObject[] {
    const panel = this.scene.add.graphics();
    panel.fillStyle(fillColor, 0.8);
    panel.fillRoundedRect(x - 50, y - 100, 100, 35, 8);
    panel.lineStyle(2, strokeColor, 1);
    panel.strokeRoundedRect(x - 50, y - 100, 100, 35, 8);

    const text = this.scene.add
      .text(x, y - 82, label, {
        fontSize: "14px",
        color: "#000000",
        fontFamily: "Arial, sans-serif",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const beam = this.scene.add.graphics();
    beam.lineStyle(3, fillColor, 0.8);
    beam.lineBetween(x, y - 65, x, y - 40);

    const glow = this.scene.add.circle(x, y, 40, fillColor, 0.2);

    return [panel, text, beam, glow];
  }

  private animatePlayerIndicators(
    elements: Phaser.GameObjects.GameObject[]
  ): void {
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

    this.scene.time.delayedCall(600, () => {
      elements.forEach((element, index) => {
        let duration: number;
        let targetAlpha: number;

        if (element instanceof Phaser.GameObjects.Graphics) {
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
}
