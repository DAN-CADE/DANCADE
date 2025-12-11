// game/managers/brickbracker/BrickBreakerEffectsManager.ts

type TweenableObject = Phaser.GameObjects.GameObject & {
  setAlpha?: (alpha: number) => Phaser.GameObjects.GameObject;
  alpha?: number;
  x?: number;
  y?: number;
  scale?: number;
};

/**
 * 벽돌깨기 효과 관리
 * - 벽돌 파괴 효과
 * - 각종 애니메이션
 */
export class BrickBreakerEffectsManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 벽돌 파괴 효과
   */
  createBrickDestroyEffect(
    x: number,
    y: number,
    color: number = 0xffffff
  ): void {
    // 간단한 파티클 효과
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

  /**
   * 깜빡임 효과
   */
  createBlinkEffect(target: TweenableObject): void {
    this.scene.tweens.add({
      targets: target,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * 펄스 효과
   */
  createPulseEffect(
    target: TweenableObject,
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
  createFadeIn(target: TweenableObject, duration: number = 500): void {
    if (target.setAlpha) {
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
    target: TweenableObject,
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
    target: TweenableObject,
    fromY: number,
    toY: number,
    duration: number = 500
  ): void {
    if ("y" in target && target.y !== undefined) {
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
   * 화면 흔들림 효과
   */
  createScreenShake(intensity: number = 5, duration: number = 200): void {
    this.scene.cameras.main.shake(duration, intensity / 1000);
  }

  /**
   * 플래시 효과 (화면 전체)
   */
  createScreenFlash(color: number = 0xffffff, duration: number = 100): void {
    this.scene.cameras.main.flash(
      duration,
      (color >> 16) & 0xff,
      (color >> 8) & 0xff,
      color & 0xff
    );
  }

  /**
   * 모든 트윈 중지 (정리용)
   */
  stopAllTweens(): void {
    this.scene.tweens.killAll();
  }
}
