// game/managers/games/brickbreaker/BrickBreakerEffectsManager.ts

import { BaseEffectsManager } from "@/game/managers/base";

/**
 * 벽돌깨기 효과 관리
 */
export class BrickBreakerEffectsManager extends BaseEffectsManager {
  /**
   * 벽돌 파괴 효과
   */
  createBrickDestroyEffect(
    x: number,
    y: number,
    color: number = 0xffffff
  ): void {
    // 파티클 효과
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 50 + Math.random() * 50;

      const particle = this.scene.add.rectangle(x, y, 4, 4, color);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 500,
        ease: "Power2.easeOut",
        onComplete: () => particle.destroy(),
      });
    }
  }
}
