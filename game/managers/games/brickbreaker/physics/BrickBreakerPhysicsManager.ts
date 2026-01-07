// game/managers/games/brickbreaker/physics/BrickBreakerPhysicsManager.ts

import { BRICKBREAKER_CONFIG } from "../BrickBreakerGameManager";

/**
 * 벽돌깨기 물리 연산 관리
 * - 패들 이동 및 경계 처리
 * - 공 발사
 * - 충돌 처리 (패들, 벽돌)
 */
export class BrickBreakerPhysicsManager {
  private scene: Phaser.Scene;
  private gameConfig: typeof BRICKBREAKER_CONFIG;

  constructor(scene: Phaser.Scene, gameConfig: typeof BRICKBREAKER_CONFIG) {
    this.scene = scene;
    this.gameConfig = gameConfig;
  }

  // =====================================================================
  // 패들 이동
  // =====================================================================

  movePaddle(
    paddle: Phaser.Physics.Arcade.Sprite,
    direction: "left" | "right" | "stop"
  ): void {
    const paddleHalfWidth = paddle.displayWidth / 2;

    switch (direction) {
      case "left":
        if (paddle.x > paddleHalfWidth) {
          paddle.setVelocityX(-this.gameConfig.paddleSpeed);
        } else {
          paddle.setVelocityX(0);
        }
        break;
      case "right":
        if (paddle.x < this.gameConfig.width - paddleHalfWidth) {
          paddle.setVelocityX(this.gameConfig.paddleSpeed);
        } else {
          paddle.setVelocityX(0);
        }
        break;
      case "stop":
        paddle.setVelocityX(0);
        break;
    }
  }

  // =====================================================================
  // 공 발사
  // =====================================================================

  launchBall(ball: Phaser.Physics.Arcade.Sprite): void {
    // 랜덤 각도로 볼 발사 (-45도 ~ 45도)
    const angle = Phaser.Math.Between(-45, 45);
    const rad = Phaser.Math.DegToRad(angle);

    ball.setVelocity(
      Math.sin(rad) * this.gameConfig.ballSpeed,
      -this.gameConfig.ballSpeed // 위쪽으로 발사
    );
  }

  // =====================================================================
  // 충돌 처리
  // =====================================================================

  /**
   * 패들과 볼 충돌 처리
   */
  handlePaddleCollision(
    ball: Phaser.Physics.Arcade.Sprite,
    paddle: Phaser.Physics.Arcade.Sprite
  ): void {
    const diff = ball.x - paddle.x;
    ball.setVelocityX(diff * 5);

    // 수직 속도가 너무 작으면 보정 (너무 수평으로 움직이는 것 방지)
    if (ball.body && Math.abs(ball.body.velocity.y) < 50) {
      ball.setVelocityY(ball.body.velocity.y > 0 ? 100 : -100);
    }
  }

  /**
   * 공을 패들 위에 고정 (발사 전)
   */
  attachBallToPaddle(
    ball: Phaser.Physics.Arcade.Sprite,
    paddle: Phaser.Physics.Arcade.Sprite
  ): void {
    ball.setPosition(paddle.x, paddle.y - 20);
  }

  // =====================================================================
  // 위치 리셋
  // =====================================================================

  resetBallAndPaddle(
    ball: Phaser.Physics.Arcade.Sprite,
    paddle: Phaser.Physics.Arcade.Sprite,
    initialPaddleX: number,
    initialPaddleY: number,
    initialBallY: number
  ): void {
    // 패들 원위치
    paddle.setPosition(initialPaddleX, initialPaddleY);
    paddle.setVelocity(0, 0);

    // 볼 원위치 -> 속도 0
    ball.setPosition(paddle.x, initialBallY);
    ball.setVelocity(0, 0);
  }

  // =====================================================================
  // 일시정지 관련
  // =====================================================================

  /**
   * 게임 오브젝트 속도 저장
   */
  saveVelocities(
    ball: Phaser.Physics.Arcade.Sprite,
    paddle: Phaser.Physics.Arcade.Sprite
  ): { ballVelocity: { x: number; y: number }; paddleVelocity: number } {
    return {
      ballVelocity: {
        x: ball.body?.velocity.x ?? 0,
        y: ball.body?.velocity.y ?? 0,
      },
      paddleVelocity: paddle.body?.velocity.x ?? 0,
    };
  }

  /**
   * 게임 오브젝트 정지
   */
  freezeObjects(
    ball: Phaser.Physics.Arcade.Sprite,
    paddle: Phaser.Physics.Arcade.Sprite
  ): void {
    ball.setVelocity(0, 0);
    paddle.setVelocity(0, 0);

    if (ball.body) ball.body.enable = false;
    if (paddle.body) paddle.body.enable = false;
  }

  /**
   * 게임 오브젝트 재개
   */
  unfreezeObjects(
    ball: Phaser.Physics.Arcade.Sprite,
    paddle: Phaser.Physics.Arcade.Sprite,
    savedBallVelocity: { x: number; y: number },
    savedPaddleVelocity: number
  ): void {
    if (ball.body) ball.body.enable = true;
    if (paddle.body) paddle.body.enable = true;

    ball.setVelocity(savedBallVelocity.x, savedBallVelocity.y);
    paddle.setVelocityX(savedPaddleVelocity);
  }
}
