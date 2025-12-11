//게임 로직

// game/managers/pingpong/PingPongGameManager.ts
import {
  PINGPONG_CONFIG,
  PingPongPaddle,
  PingPongBall,
  PingPongGameState,
} from "@/game/types/realPingPong";

type Scorer = "player" | "ai";

/**
 * 탁구 게임 로직 관리
 * - 패들/볼 업데이트
 * - 충돌 감지
 * - 점수 계산
 * - 승리 조건
 */
export class PingPongGameManager {
  private scene: Phaser.Scene;
  private gameState: PingPongGameState;

  // Game Objects (참조)
  private playerPaddle!: PingPongPaddle;
  private aiPaddle!: PingPongPaddle;
  private ball!: PingPongBall;
  private board!: Phaser.GameObjects.Image;

  // Internal State
  private aiReactionTimer: number = 0;
  private scoringInProgress: boolean = false;

  // Callbacks
  private onScoreUpdate?: (playerScore: number, aiScore: number) => void;
  private onGameOver?: (isPlayerWin: boolean) => void;
  private onPointScored?: (scorer: Scorer) => void;
  private onNetHit?: (x: number, y: number) => void;

  constructor(
    scene: Phaser.Scene,
    gameState: PingPongGameState,
    callbacks?: {
      onScoreUpdate?: (playerScore: number, aiScore: number) => void;
      onGameOver?: (isPlayerWin: boolean) => void;
      onPointScored?: (scorer: Scorer) => void;
      onNetHit?: (x: number, y: number) => void;
    }
  ) {
    this.scene = scene;
    this.gameState = gameState;

    if (callbacks) {
      this.onScoreUpdate = callbacks.onScoreUpdate;
      this.onGameOver = callbacks.onGameOver;
      this.onPointScored = callbacks.onPointScored;
      this.onNetHit = callbacks.onNetHit;
    }
  }

  /**
   * 게임 오브젝트 설정
   */
  setGameObjects(
    playerPaddle: PingPongPaddle,
    aiPaddle: PingPongPaddle,
    ball: PingPongBall,
    board: Phaser.GameObjects.Image
  ): void {
    this.playerPaddle = playerPaddle;
    this.aiPaddle = aiPaddle;
    this.ball = ball;
    this.board = board;
  }

  /**
   * 매 프레임 업데이트
   */
  update(deltaSeconds: number): void {
    if (!this.shouldUpdate()) return;

    this.updatePlayerPaddle(deltaSeconds);
    this.updateAIPaddle(deltaSeconds);
    this.updateBall(deltaSeconds);
    this.checkCollisions();
    this.checkScore();
  }

  /**
   * 업데이트 필요 여부 확인
   */
  private shouldUpdate(): boolean {
    return (
      this.gameState.gameMode === "playing" &&
      this.gameState.isPlaying &&
      !this.gameState.isPaused
    );
  }

  /**
   * 플레이어 패들 업데이트
   */
  updatePlayerPaddle(deltaSeconds: number): void {
    // 외부에서 inputState를 통해 이동 방향이 설정됨
    // 여기서는 실제 이동만 처리
    this.clampPaddlePosition(this.playerPaddle);
    this.playerPaddle.sprite?.setPosition(
      this.playerPaddle.x,
      this.playerPaddle.y
    );
  }

  /**
   * 플레이어 패들 이동 (외부에서 호출)
   */
  movePlayerPaddle(direction: "up" | "down", deltaSeconds: number): void {
    if (direction === "up") {
      this.playerPaddle.y -= this.playerPaddle.speed * deltaSeconds;
    } else {
      this.playerPaddle.y += this.playerPaddle.speed * deltaSeconds;
    }
  }

  /**
   * AI 패들 업데이트
   */
  private updateAIPaddle(deltaSeconds: number): void {
    this.aiReactionTimer += deltaSeconds;

    if (this.aiReactionTimer >= PINGPONG_CONFIG.AI_REACTION_DELAY) {
      if (this.ball.velocityX > 0) {
        const diff = this.ball.y - this.aiPaddle.y;

        if (Math.abs(diff) > PINGPONG_CONFIG.AI_MOVE_THRESHOLD) {
          const moveDirection = diff > 0 ? 1 : -1;
          this.aiPaddle.y += moveDirection * this.aiPaddle.speed * deltaSeconds;
        }
      }

      this.aiReactionTimer = 0;
    }

    this.clampPaddlePosition(this.aiPaddle);
    this.aiPaddle.sprite?.setPosition(this.aiPaddle.x, this.aiPaddle.y);
  }

  /**
   * 패들 위치 제한
   */
  private clampPaddlePosition(paddle: PingPongPaddle): void {
    const halfHeight = paddle.height / 2;
    paddle.y = Phaser.Math.Clamp(
      paddle.y,
      halfHeight + PINGPONG_CONFIG.BOARD_UI_SPACE,
      PINGPONG_CONFIG.GAME_HEIGHT - halfHeight - 50
    );
  }

  /**
   * 볼 업데이트
   */
  private updateBall(deltaSeconds: number): void {
    this.ball.x += this.ball.velocityX * deltaSeconds;
    this.ball.y += this.ball.velocityY * deltaSeconds;

    this.checkTableBoundaryCollision();
    this.checkNetCollision();
    this.updateBallSprite();
  }

  /**
   * 테이블 경계 충돌 체크
   */
  private checkTableBoundaryCollision(): void {
    const boardBounds = this.board.getBounds();
    const topBound = boardBounds.top + PINGPONG_CONFIG.BOARD_BOUNDARY_OFFSET;
    const bottomBound =
      boardBounds.bottom - PINGPONG_CONFIG.BOARD_BOUNDARY_OFFSET;

    if (
      this.ball.y <= topBound + this.ball.radius ||
      this.ball.y >= bottomBound - this.ball.radius
    ) {
      this.ball.velocityY *= -PINGPONG_CONFIG.TABLE_ENERGY_LOSS;
      this.ball.y = Phaser.Math.Clamp(
        this.ball.y,
        topBound + this.ball.radius,
        bottomBound - this.ball.radius
      );
    }
  }

  /**
   * 네트 충돌 체크
   */
  private checkNetCollision(): void {
    const netX = PINGPONG_CONFIG.GAME_WIDTH / 2;
    const boardBounds = this.board.getBounds();
    const tableY = boardBounds.centerY;
    const netHeight = PINGPONG_CONFIG.NET_HEIGHT;
    const netTopY = tableY - netHeight;

    const prevX =
      this.ball.x -
      this.ball.velocityX * PINGPONG_CONFIG.BALL_PREVIOUS_FRAME_TIME;
    const crossingNet =
      (prevX < netX && this.ball.x >= netX) ||
      (prevX > netX && this.ball.x <= netX);

    if (
      crossingNet &&
      this.ball.y > netTopY &&
      this.ball.y < tableY + this.ball.radius
    ) {
      this.ball.velocityX *= -PINGPONG_CONFIG.NET_COLLISION_REDUCTION;
      this.ball.velocityY += PINGPONG_CONFIG.NET_BOUNCE_ADDITION;

      // 네트 히트 효과 콜백
      this.onNetHit?.(netX, netTopY);

      this.ball.x = prevX > netX ? netX + 15 : netX - 15;
    }
  }

  /**
   * 볼 스프라이트 업데이트
   */
  private updateBallSprite(): void {
    if (this.ball.sprite) {
      this.ball.sprite.setPosition(this.ball.x, this.ball.y);

      const rotationSpeed =
        Math.sqrt(this.ball.velocityX ** 2 + this.ball.velocityY ** 2) * 0.01;
      this.ball.sprite.rotation += rotationSpeed;
    }
  }

  /**
   * 충돌 체크
   */
  private checkCollisions(): void {
    if (this.checkPaddleBallCollision(this.playerPaddle)) {
      this.handlePaddleHit(this.playerPaddle);
    }

    if (this.checkPaddleBallCollision(this.aiPaddle)) {
      this.handlePaddleHit(this.aiPaddle);
    }
  }

  /**
   * 패들과 볼 충돌 체크
   */
  private checkPaddleBallCollision(paddle: PingPongPaddle): boolean {
    const ballLeft = this.ball.x - this.ball.radius;
    const ballRight = this.ball.x + this.ball.radius;
    const ballTop = this.ball.y - this.ball.radius;
    const ballBottom = this.ball.y + this.ball.radius;

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
   * 패들 히트 처리
   */
  private handlePaddleHit(paddle: PingPongPaddle): void {
    const relativeIntersectY = (this.ball.y - paddle.y) / (paddle.height / 2);
    const normalizedRelativeIntersectionY = Phaser.Math.Clamp(
      relativeIntersectY,
      -1,
      1
    );
    const bounceAngle =
      normalizedRelativeIntersectionY * PINGPONG_CONFIG.MAX_BOUNCE_ANGLE;

    if (this.ball.speed < PINGPONG_CONFIG.BALL_MAX_SPEED) {
      this.ball.speed += PINGPONG_CONFIG.BALL_SPEED_INCREASE;
    }

    const direction = paddle === this.playerPaddle ? 1 : -1;
    this.ball.velocityX = Math.cos(bounceAngle) * this.ball.speed * direction;
    this.ball.velocityY = Math.sin(bounceAngle) * this.ball.speed;

    // 볼 위치 조정
    if (paddle === this.playerPaddle) {
      this.ball.x = paddle.x + paddle.width / 2 + this.ball.radius;
    } else {
      this.ball.x = paddle.x - paddle.width / 2 - this.ball.radius;
    }
  }

  /**
   * 점수 체크
   */
  private checkScore(): void {
    if (this.scoringInProgress) return;

    if (this.ball.x < -this.ball.radius) {
      this.handleScoring("ai");
    } else if (this.ball.x > PINGPONG_CONFIG.GAME_WIDTH + this.ball.radius) {
      this.handleScoring("player");
    }
  }

  /**
   * 득점 처리
   */
  private handleScoring(scorer: Scorer): void {
    this.scoringInProgress = true;
    this.gameState.isPlaying = false;

    if (scorer === "player") {
      this.gameState.playerScore++;
    } else {
      this.gameState.aiScore++;
    }

    this.gameState.servingPlayer = scorer;

    // 점수 업데이트 콜백
    this.onScoreUpdate?.(this.gameState.playerScore, this.gameState.aiScore);

    // 득점 콜백
    this.onPointScored?.(scorer);

    // 승리 조건 체크
    if (this.checkWinCondition()) {
      const isPlayerWin =
        this.gameState.playerScore >= PINGPONG_CONFIG.WINNING_SCORE;
      this.onGameOver?.(isPlayerWin);
    } else {
      // 다음 라운드 준비
      this.ball.speed = PINGPONG_CONFIG.BALL_INITIAL_SPEED;
    }
  }

  /**
   * 승리 조건 체크
   */
  private checkWinCondition(): boolean {
    const playerScore = this.gameState.playerScore;
    const aiScore = this.gameState.aiScore;
    const scoreDiff = Math.abs(playerScore - aiScore);

    return (
      (playerScore >= PINGPONG_CONFIG.WINNING_SCORE &&
        scoreDiff >= PINGPONG_CONFIG.WINNING_MARGIN) ||
      (aiScore >= PINGPONG_CONFIG.WINNING_SCORE &&
        scoreDiff >= PINGPONG_CONFIG.WINNING_MARGIN)
    );
  }

  /**
   * 서브 준비
   */
  prepareServe(): void {
    this.gameState.isPlaying = false;
    this.scoringInProgress = false;

    this.positionBallForServe();

    if (this.gameState.servingPlayer === "player") {
      this.gameState.isPreparingServe = true;
    } else {
      this.gameState.isPreparingServe = false;
      // AI 자동 서브
      this.scene.time.delayedCall(PINGPONG_CONFIG.SERVE_DELAY, () => {
        this.serve();
      });
    }
  }

  /**
   * 서브 위치 설정
   */
  private positionBallForServe(): void {
    if (this.gameState.servingPlayer === "player") {
      this.ball.x = this.playerPaddle.x + 50;
    } else {
      this.ball.x = this.aiPaddle.x - 50;
    }

    this.ball.y = PINGPONG_CONFIG.GAME_HEIGHT / 2;
    this.ball.velocityX = 0;
    this.ball.velocityY = 0;

    this.updateBallSprite();
  }

  /**
   * 서브 실행
   */
  serve(): void {
    this.gameState.isPlaying = true;
    this.gameState.isPreparingServe = false;

    const direction = this.gameState.servingPlayer === "player" ? 1 : -1;
    const angle = (Math.random() - 0.5) * 0.3;

    this.ball.velocityX = Math.cos(angle) * this.ball.speed * direction;
    this.ball.velocityY = Math.sin(angle) * this.ball.speed;
  }

  /**
   * 서브 준비 중 볼 위치 조정
   */
  adjustServePosition(newY: number): void {
    if (!this.gameState.isPreparingServe) return;
    if (this.gameState.servingPlayer !== "player") return;

    const minY = 200;
    const maxY = 400;

    this.ball.y = Phaser.Math.Clamp(newY, minY, maxY);
    this.playerPaddle.y = this.ball.y;

    this.updateBallSprite();
    this.playerPaddle.sprite?.setPosition(
      this.playerPaddle.x,
      this.playerPaddle.y
    );
  }

  /**
   * 점수 리셋
   */
  resetScores(): void {
    this.gameState.playerScore = 0;
    this.gameState.aiScore = 0;
    this.onScoreUpdate?.(0, 0);
  }

  /**
   * 패들 위치 리셋
   */
  resetPaddlePositions(): void {
    const centerY = PINGPONG_CONFIG.GAME_HEIGHT / 2;

    this.playerPaddle.y = centerY;
    this.aiPaddle.y = centerY;

    this.playerPaddle.sprite?.setPosition(
      this.playerPaddle.x,
      this.playerPaddle.y
    );
    this.aiPaddle.sprite?.setPosition(this.aiPaddle.x, this.aiPaddle.y);
  }

  /**
   * 게임 리셋
   */
  reset(): void {
    this.resetScores();
    this.resetPaddlePositions();
    this.ball.speed = PINGPONG_CONFIG.BALL_INITIAL_SPEED;
    this.gameState.isPlaying = false;
    this.gameState.isPaused = false;
    this.gameState.servingPlayer = "player";
    this.scoringInProgress = false;
    this.aiReactionTimer = 0;
  }
}
