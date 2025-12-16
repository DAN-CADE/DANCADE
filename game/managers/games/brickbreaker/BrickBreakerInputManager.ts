// game/managers/brickbreacker/BrickBreakerInputManager.ts

/**
 * 벽돌깨기 입력 관리
 * - 키보드 입력 처리
 * - 패들 이동 방향 제공
 */
export class BrickBreakerInputManager {
  private scene: Phaser.Scene;

  // Keyboard Input
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupInput();
  }

  /**
   * 입력 설정
   */
  private setupInput(): void {
    this.cursors = this.scene.input.keyboard?.createCursorKeys();
  }

  /**
   * 패들 이동 방향 가져오기
   */
  getPaddleMoveDirection(): "left" | "right" | "stop" {
    if (!this.cursors) return "stop";

    if (this.cursors.left.isDown) {
      return "left";
    } else if (this.cursors.right.isDown) {
      return "right";
    } else {
      return "stop";
    }
  }

  /**
   * 왼쪽 키 눌림 여부
   */
  isLeftPressed(): boolean {
    return this.cursors?.left.isDown ?? false;
  }

  /**
   * 오른쪽 키 눌림 여부
   */
  isRightPressed(): boolean {
    return this.cursors?.right.isDown ?? false;
  }

  /**
   * 정리 (메모리 해제)
   */
  cleanup(): void {
    this.scene.input.keyboard?.removeAllListeners();
  }
}
