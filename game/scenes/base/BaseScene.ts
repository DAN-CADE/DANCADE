// game/scenes/base/BaseScene.ts
import Phaser from "phaser";

/**
 * 모든 씬의 최상위 부모 클래스
 * 공통 유틸리티 및 헬퍼 메서드 제공
 */
export abstract class BaseScene extends Phaser.Scene {
  // =================================
  // 씬 전환 (MainScene의 launchGame 패턴)
  // =================================
  protected fadeIn(duration: number = 500): void {
    this.cameras.main.fadeIn(duration);
  }
  protected fadeOut(duration: number = 500): void {
    this.cameras.main.fadeOut(duration);
  }
  protected transitionTo(
    targetScene: string,
    data?: object,
    fadeDuration: number = 1000
  ): void {
    this.cameras.main.fadeOut(fadeDuration, 0, 0, 0);
    this.cameras.main.once("camerasoutcomplete", () => {
      this.scene.start(targetScene, data);
    });
  }

  // =================================
  // Registry 헬퍼
  // =================================
  protected setData(key: string, value: unknown): void {
    this.registry.set(key, value);
  }
  protected getData<T>(key: string, defaultValue?: T): T {
    return this.registry.get(key) ?? defaultValue;
  }

  // =================================
  // 에러 핸들링
  // =================================
  protected handleError(error: Error): void {
    console.error(`Error in scene ${this.scene.key}:`, error);
  }

  // =================================
  // 리사이즈 (MainScene의 handleResize 패턴)
  // =================================
  protected handleResize(gameSize: Phaser.Structs.Size): void {
    if (!this.cameras.main) return;
    this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
  }

  // =================================
  // 생명주기
  // =================================

  /** 씬 종료 시 호출 */
  shutdown(): void {}
}
