// game/managers/base/BaseEffectsManager.ts

/**
 * 효과 매니저의 베이스 클래스
 * 공통 애니메이션 및 효과 제공
 */
export abstract class BaseEffectsManager {
  protected scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 깜빡임 효과
   */
  createBlinkEffect(
    target: Phaser.GameObjects.GameObject,
    minAlpha: number = 0.3,
    duration: number = 800
  ): void {
    this.scene.tweens.add({
      targets: target,
      alpha: minAlpha,
      duration: duration,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * 펄스 효과 (스케일)
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
   * 화면 흔들림 효과
   */
  createScreenShake(intensity: number = 5, duration: number = 200): void {
    this.scene.cameras.main.shake(duration, intensity / 1000);
  }

  /**
   * 화면 플래시 효과
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
   * 모든 트윈 중지
   */
  stopAllTweens(): void {
    this.scene.tweens.killAll();
  }
}
