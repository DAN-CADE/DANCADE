// game/managers/games/pingpong/physics/PingPongPhysicsManager.ts

import { PINGPONG_CONFIG, PingPongPaddle, PingPongBall } from "@/game/types/pingpong";

/**
 * 핑퐁 게임 물리 연산 관리
 * - 공 이동 및 회전
 * - 테이블 경계 충돌
 * - 네트 충돌
 * - 패들 충돌
 */
export class PingPongPhysicsManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // =====================================================================
  // 공 업데이트
  // =====================================================================

  updateBall(
    ball: PingPongBall,
    board: Phaser.GameObjects.Image,
    deltaSeconds: number,
    onNetHit?: (x: number, y: number) => void
  ): void {
    ball.x += ball.velocityX * deltaSeconds;
    ball.y += ball.velocityY * deltaSeconds;

    this.checkTableBoundaryCollision(ball, board);
    this.checkNetCollision(ball, board, onNetHit);
    this.updateBallSprite(ball);
  }

  private checkTableBoundaryCollision(
    ball: PingPongBall,
    board: Phaser.GameObjects.Image
  ): void {
    const boardBounds = board.getBounds();
    const topBound = boardBounds.top + PINGPONG_CONFIG.BOARD_BOUNDARY_OFFSET;
    const bottomBound = boardBounds.bottom - PINGPONG_CONFIG.BOARD_BOUNDARY_OFFSET;

    if (
      ball.y <= topBound + ball.radius ||
      ball.y >= bottomBound - ball.radius
    ) {
      ball.velocityY *= -PINGPONG_CONFIG.TABLE_ENERGY_LOSS;
      ball.y = Phaser.Math.Clamp(
        ball.y,
        topBound + ball.radius,
        bottomBound - ball.radius
      );
    }
  }

  private checkNetCollision(
    ball: PingPongBall,
    board: Phaser.GameObjects.Image,
    onNetHit?: (x: number, y: number) => void
  ): void {
    const netX = PINGPONG_CONFIG.GAME_WIDTH / 2;
    const boardBounds = board.getBounds();
    const tableY = boardBounds.centerY;
    const netHeight = PINGPONG_CONFIG.NET_HEIGHT;
    const netTopY = tableY - netHeight;

    const prevX = ball.x - ball.velocityX * PINGPONG_CONFIG.BALL_PREVIOUS_FRAME_TIME;
    const crossingNet =
      (prevX < netX && ball.x >= netX) ||
      (prevX > netX && ball.x <= netX);

    if (
      crossingNet &&
      ball.y > netTopY &&
      ball.y < tableY + ball.radius
    ) {
      ball.velocityX *= -PINGPONG_CONFIG.NET_COLLISION_REDUCTION;
      ball.velocityY += PINGPONG_CONFIG.NET_BOUNCE_ADDITION;

      onNetHit?.(netX, netTopY);

      ball.x = prevX > netX ? netX + 15 : netX - 15;
    }
  }

  private updateBallSprite(ball: PingPongBall): void {
    if (ball.sprite) {
      ball.sprite.setPosition(ball.x, ball.y);

      const rotationSpeed =
        Math.sqrt(ball.velocityX ** 2 + ball.velocityY ** 2) * 0.01;
      ball.sprite.rotation += rotationSpeed;
    }
  }

  // =====================================================================
  // 패들 충돌
  // =====================================================================

  checkPaddleBallCollision(paddle: PingPongPaddle, ball: PingPongBall): boolean {
    const ballLeft = ball.x - ball.radius;
    const ballRight = ball.x + ball.radius;
    const ballTop = ball.y - ball.radius;
    const ballBottom = ball.y + ball.radius;

    const paddleLeft = paddle.x - paddle.width / 2;
    const paddleRight = paddle.x + paddle.width / 2;
    const paddleTop = paddle.y - paddle.height / 2;
    const paddleBottom = paddle.y + paddle.height / 2;

    return (
      ballRight > paddleLeft &&
      ballLeft < paddleRight &&
      ballBottom > paddleTop &&
      ballTop < paddleBottom
    );
  }

  /**
   * 패들에 공이 맞았을 때 반사 처리
   * @returns 완벽한 타격 여부
   */
  handlePaddleHit(
    paddle: PingPongPaddle,
    ball: PingPongBall,
    isPlayerPaddle: boolean
  ): boolean {
    const relativeIntersectY = (ball.y - paddle.y) / (paddle.height / 2);
    const normalizedRelativeIntersectionY = Phaser.Math.Clamp(relativeIntersectY, -1, 1);
    const bounceAngle = normalizedRelativeIntersectionY * PINGPONG_CONFIG.MAX_BOUNCE_ANGLE;

    // 속도 증가
    if (ball.speed < PINGPONG_CONFIG.BALL_MAX_SPEED) {
      ball.speed += PINGPONG_CONFIG.BALL_SPEED_INCREASE;
    }

    // 반사 방향 계산
    const direction = isPlayerPaddle ? 1 : -1;
    ball.velocityX = Math.cos(bounceAngle) * ball.speed * direction;
    ball.velocityY = Math.sin(bounceAngle) * ball.speed;

    // 공 위치 보정
    if (isPlayerPaddle) {
      ball.x = paddle.x + paddle.width / 2 + ball.radius;
    } else {
      ball.x = paddle.x - paddle.width / 2 - ball.radius;
    }

    // 완벽한 타격 판정 (패들 중앙 30% 영역)
    return Math.abs(normalizedRelativeIntersectionY) <= PINGPONG_CONFIG.PERFECT_HIT_ZONE;
  }

  // =====================================================================
  // 패들 위치 제한
  // =====================================================================

  clampPaddlePosition(paddle: PingPongPaddle): void {
    const halfHeight = paddle.height / 2;
    paddle.y = Phaser.Math.Clamp(
      paddle.y,
      halfHeight + PINGPONG_CONFIG.BOARD_UI_SPACE,
      PINGPONG_CONFIG.GAME_HEIGHT - halfHeight - 50
    );
  }

  // =====================================================================
  // 공 서브 위치
  // =====================================================================

  positionBallForServe(
    ball: PingPongBall,
    playerPaddle: PingPongPaddle,
    aiPaddle: PingPongPaddle,
    servingPlayer: "player" | "ai"
  ): void {
    if (servingPlayer === "player") {
      ball.x = playerPaddle.x + 50;
    } else {
      ball.x = aiPaddle.x - 50;
    }

    ball.y = PINGPONG_CONFIG.GAME_HEIGHT / 2;
    ball.velocityX = 0;
    ball.velocityY = 0;

    this.updateBallSprite(ball);
  }

  serve(ball: PingPongBall, servingPlayer: "player" | "ai"): void {
    const direction = servingPlayer === "player" ? 1 : -1;
    const angle = (Math.random() - 0.5) * 0.3;

    ball.velocityX = Math.cos(angle) * ball.speed * direction;
    ball.velocityY = Math.sin(angle) * ball.speed;
  }
}
