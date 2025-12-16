// game/scenes/base/BaseUIScene.ts
import { BaseScene } from "@/game/scenes/base/BaseScene";

/**
 * UI 씬의 부모 클래스
 * UI 씬의 공통 구조 정의
 * (예: 점수판, 타이머, 게임 오버 화면 등)
 */
export abstract class BaseUIScene extends BaseScene {
  // =================================
  // UI 씬 설정
  // =================================

  create(): void {
    this.setupUI();
    this.createUIElements();
  }

  /**
   * UI 씬 기본 설정 (배경, 깊이 등)
   */
  protected setupUI(): void {
    // UI는 기본적으로 투명 배경
    // 필요시 자식 클래스에서 오버라이드
  }

  /**
   * UI 요소 생성 (각 UI 씬에서 구현)
   */
  protected abstract createUIElements(): void;

  // =================================
  // UI 표시/숨기기
  // =================================

  /**
   * UI 표시
   */
  show(): void {
    this.scene.setVisible(true);
    this.fadeIn(200);
  }
  /**
   * UI 숨기기
   */
  hide(): void {
    this.fadeOut(200);
    this.time.delayedCall(200, () => {
      this.scene.setVisible(false);
    });
  }
  // =================================
  // 게임 씬과의 통신
  // =================================

  /**
   * 일시정지
   */
  protected pauseGameSence(sceneKey: string): void {
    this.scene.pause(sceneKey);
  }
  /**
   * 재개
   */
  protected resumeGameSence(sceneKey: string): void {
    this.scene.resume(sceneKey);
  }
  /**
   * UI 씬 닫기
   */
  protected closeUI(): void {
    this.scene.stop();
  }
}
