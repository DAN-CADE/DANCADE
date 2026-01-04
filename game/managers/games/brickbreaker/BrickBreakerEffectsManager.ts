// game/managers/games/brickbreaker/BrickBreakerEffectsManager.ts

import { BaseEffectsManager } from "@/game/managers/base";

/**
 * 벽돌깨기 효과 관리
 */
export class BrickBreakerEffectsManager extends BaseEffectsManager {
  // 벽돌 색상별 RGB 값
  private readonly BRICK_COLORS: Record<string, number> = {
    element_red_rectangle_glossy: 0xff4444,
    element_yellow_rectangle_glossy: 0xffdd44,
    element_green_rectangle_glossy: 0x44ff44,
    element_blue_rectangle_glossy: 0x4488ff,
    element_purple_rectangle_glossy: 0xdd44ff,
  };

  /**
   * 벽돌 파괴 효과 (색상별)
   */
  createBrickDestroyEffect(
    x: number,
    y: number,
    brickColor: string = "element_red_rectangle_glossy"
  ): void {
    const color = this.BRICK_COLORS[brickColor] || 0xffffff;

    // 메인 파티클: 8개 (큰 입자)
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 80 + Math.random() * 60;
      const scale = 0.8 + Math.random() * 0.4;

      const particle = this.scene.add.rectangle(
        x,
        y,
        6 * scale,
        6 * scale,
        color
      );
      particle.setStrokeStyle(2, 0xffffff, 0.5);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        rotation: Math.PI * 2,
        duration: 600,
        ease: "Power2.easeOut",
        onComplete: () => particle.destroy(),
      });
    }

    // 작은 반짝이 효과: 12개 (추가 시각 효과)
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
      const speed = 40 + Math.random() * 80;

      const sparkle = this.scene.add.circle(x, y, 2, 0xffffff);

      this.scene.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 400 + Math.random() * 200,
        ease: "Power3.easeOut",
        onComplete: () => sparkle.destroy(),
      });
    }

    // 플래시 효과: 중앙에서 순간적인 밝은 원
    const flash = this.scene.add.circle(x, y, 10, color);
    flash.setAlpha(0.8);

    this.scene.tweens.add({
      targets: flash,
      radius: 40,
      alpha: 0,
      duration: 300,
      ease: "Power3.easeOut",
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * 콤보 표시 효과
   */
  createComboDisplayEffect(x: number, y: number, combo: number): void {
    const comboText = this.scene.add
      .text(x, y, `COMBO x${combo}`, {
        fontFamily: '"Press Start 2P"',
        fontSize: "20px",
        color: "#ffff00",
        stroke: "#ff6600",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(100);

    // 콤보 텍스트 애니메이션
    this.scene.tweens.add({
      targets: comboText,
      y: y - 60,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      ease: "Back.easeOut",
      onComplete: () => comboText.destroy(),
    });

    // 콤보 배경 (선택사항)
    if (combo % 5 === 0) {
      // 5의 배수일 때만
      const bgCircle = this.scene.add.circle(x, y, 15, 0xffa500);
      bgCircle.setAlpha(0.3);
      bgCircle.setDepth(99);

      this.scene.tweens.add({
        targets: bgCircle,
        radius: 50,
        alpha: 0,
        duration: 600,
        ease: "Power2.easeOut",
        onComplete: () => bgCircle.destroy(),
      });
    }
  }
}
