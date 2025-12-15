// game/scenes/base/BaseTransitionScene.ts
import { BaseScene } from "@/game/scenes/base/BaseScene";

/**
 * 씬 전환 전용 씬의 부모 클래스
 * 씬 전환 관련 유틸리티 제공
 */
export abstract class BaseTransitionScene extends BaseScene {
  // =================================
  // 전환 데이터
  // =================================
  protected transitionData?: unknown;

  /**
   * 전환 데이터 초기화
   */
  init(data?: unknown): void {
    this.transitionData = data;
  }

  // =================================
  // 생명주기
  // =================================
  create(): void {
    this.setupTransition();
    this.createTransitonContent();
    this.onTransitionReady();
  }

  /**
   * 전환 씬 설정 (배경, 카메라 등)
   */
  protected abstract setupTransition(): void;

  /**
   * 전환 씬 콘텐츠 생성 (각 전환 씬에서 구현)
   */
  protected abstract createTransitonContent(): void;

  /**
   * 전환 준비 완료 후 호출 (각 전환 씬에서 필요시 오버라이드)
   */
  protected onTransitionReady(): void {
    // 기본 구현은 없음 (각 전환 씬에서 필요 시 구현)
  }

  // =================================
  // 전환 완료
  // =================================

  /**
   * 다음 씬으로 전환
   */
  protected completeTransition(
    targetScene: string,
    data?: object,
    delay: number = 0
  ): void {
    if (delay > 0) {
      this.time.delayedCall(delay, () => {
        this.transitionTo(targetScene, data);
      });
    } else {
      this.transitionTo(targetScene, data);
    }
  }

  /**
   * 현재 씬 닫기
   */
  protected closeTransition(): void {
    this.scene.stop();
  }
}
