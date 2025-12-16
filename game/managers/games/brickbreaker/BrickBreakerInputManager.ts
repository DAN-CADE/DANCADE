// game/managers/games/brickbreaker/BrickBreakerInputManager.ts

import { BaseInputManager } from "@/game/managers/base";

/**
 * 벽돌깨기 입력 관리
 */
export class BrickBreakerInputManager extends BaseInputManager {
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

  isLeftPressed(): boolean {
    return this.cursors?.left.isDown ?? false;
  }

  isRightPressed(): boolean {
    return this.cursors?.right.isDown ?? false;
  }
}
