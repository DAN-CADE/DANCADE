// game/managers/base/BaseInputManager.ts

/**
 * 입력 매니저의 베이스 클래스
 * 키보드 입력 처리의 공통 패턴 제공
 */
export abstract class BaseInputManager {
  protected scene: Phaser.Scene;
  protected cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupInput();
  }

  /**
   * 입력 설정
   */
  protected setupInput(): void {
    if (!this.scene.input.keyboard) {
      console.warn("Keyboard input not available");
      return;
    }
    this.cursors = this.scene.input.keyboard.createCursorKeys();
  }

  /**
   * 추가 키 등록 헬퍼
   */
  protected addKey(keyCode: number): Phaser.Input.Keyboard.Key | undefined {
    return this.scene.input.keyboard?.addKey(keyCode);
  }

  /**
   * 정리 (메모리 해제)
   */
  cleanup(): void {
    this.scene.input.keyboard?.removeAllListeners();
  }
}
