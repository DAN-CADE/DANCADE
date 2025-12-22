// game/scenes/base/BaseGameScene.ts

import { BaseScene } from "@/game/scenes/base/BaseScene";

/**
 * 게임 씬의 부모 클래스
 * 게임 씬의 공통 구조 정의
 */
export abstract class BaseGameScene extends BaseScene {
  // 모든 게임에서 공통으로 사용할 기준 크기
  protected readonly GAME_WIDTH = 800;
  protected readonly GAME_HEIGHT = 600;

  // 중앙 정렬을 위한 오프셋 (게터)
  protected get offsetX(): number {
    return (this.scale.width - this.GAME_WIDTH) / 2;
  }

  protected get offsetY(): number {
    return (this.scale.height - this.GAME_HEIGHT) / 2;
  }

  // 상대 좌표 변환 헬퍼 메서드
  protected getRelativeX(x: number): number {
    return x + this.offsetX;
  }

  protected getRelativeY(y: number): number {
    return y + this.offsetY;
  }

  // =================================
  // 생명 주기 (각 게임에서 구현)
  // =================================

  /**
   * 게임 에셋 로드
   */
  protected abstract loadAssets(): void;

  /**
   * 씬 기본 설정 (배경, 카메라 등)
   */
  protected abstract setupScene(): void;

  /**
   * 매니저 초기화 (GameManager, UIManager, InputManager, EffectManager)
   */
  protected abstract initManagers(): void;

  /**
   * 게임 오브젝트 생성 (패들, 볼, 벽돌 등)
   */
  protected abstract createGameObjects(): void;

  // =================================
  // phaser 생명주기 (공통 플로우)
  // =================================
  preload(): void {
    this.loadAssets();
  }

  create(): void {
    this.setupScene();
    this.initManagers();
    this.createGameObjects();
    this.onGameReady();
  }

  /**
   * 게임 준비 완료 후 호출 (각 게임에서 필요시 오버라이드)
   */
  protected onGameReady(): void {
    // 기본 구현은 없음 (각 게임에서 필요 시 구현)
  }

  // =================================
  // 게임 종료 처리
  // =================================
  protected abstract handleGameEnd(result?: unknown): void;

  /**
   * 게임 재시작
   */
  protected abstract restartGame(): void;

  // =================================
  // 정리
  // =================================
  shutdown(): void {
    super.shutdown();
    this.cleanupManagers();
  }

  /**
   * 매니저 정리
   * 각 게임에서 필요시 오버라이드
   */
  protected cleanupManagers(): void {
    // 기본 구현은 없음 (각 게임에서 필요 시 구현)
  }
}
