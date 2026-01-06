// game/managers/games/pingpong/PingPongGameManager.ts

import { BaseGameManager } from "@/game/managers/base";
import { PingPongAIManager } from "./PingPongAIManager";
import {
  PINGPONG_CONFIG,
  PingPongPaddle,
  PingPongBall,
  PingPongGameState,
  PingPongGameResult,
  PingPongMode,
} from "@/game/types/pingpong";

type Scorer = "player" | "ai";

interface PingPongCallbacks {
  onScoreUpdate?: (playerScore: number, aiScore: number) => void;
  onGameOver?: (isPlayerWin: boolean) => void;
  onPointScored?: (scorer: Scorer) => void;
  onNetHit?: (x: number, y: number) => void;
  onRallyUpdate?: (count: number) => void;
  onPerfectHit?: () => void;
  [key: string]: unknown;
}

/**
 * 탁구 게임 로직 관리
 */
export class PingPongGameManager extends BaseGameManager<
  PingPongGameState,
  PingPongCallbacks
> {
  private playerPaddle!: PingPongPaddle;
  private aiPaddle!: PingPongPaddle;
  private ball!: PingPongBall;
  private board!: Phaser.GameObjects.Image;

  private aiReactionTimer: number = 0;
  private scoringInProgress: boolean = false;
  private aiManager: PingPongAIManager = new PingPongAIManager();

  constructor(
    scene: Phaser.Scene,
    gameState: PingPongGameState,
    callbacks?: PingPongCallbacks
  ) {
    super(scene, gameState, callbacks ?? {});
  }

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

  update(deltaSeconds: number): void {
    if (!this.shouldUpdate()) return;

    // ✅ 플레이 시간 누적
    this.gameState.elapsedTime += deltaSeconds;

    this.updatePlayerPaddle(deltaSeconds);
    this.updateAIPaddle(deltaSeconds);
    this.updateBall(deltaSeconds);
    this.checkCollisions();
    this.checkScore();
  }

  private shouldUpdate(): boolean {
    return (
      this.gameState.gameMode === "playing" &&
      this.gameState.isPlaying &&
      !this.gameState.isPaused
    );
  }

  updatePlayerPaddle(_deltaSeconds: number): void {
    this.clampPaddlePosition(this.playerPaddle);
    this.playerPaddle.sprite?.setPosition(
      this.playerPaddle.x,
      this.playerPaddle.y
    );
  }

  movePlayerPaddle(direction: "up" | "down", deltaSeconds: number): void {
    if (direction === "up") {
      this.playerPaddle.y -= this.playerPaddle.speed * deltaSeconds;
    } else {
      this.playerPaddle.y += this.playerPaddle.speed * deltaSeconds;
    }
  }

  private updateAIPaddle(deltaSeconds: number): void {
    // 싱글 모드: GPT 기반 AI
    if (this.gameState.mode === PingPongMode.SINGLE) {
      this.updateAIPaddleWithGPT(deltaSeconds);
    } else {
      // 온라인 모드: 기본 AI (폴백)
      this.updateAIPaddleBasic(deltaSeconds);
    }

    this.clampPaddlePosition(this.aiPaddle);
    this.aiPaddle.sprite?.setPosition(this.aiPaddle.x, this.aiPaddle.y);
  }

  private async updateAIPaddleWithGPT(deltaSeconds: number): Promise<void> {
    // PingPongAIManager에서 AI 결정 받기 (GPT + 로컬 계산 하이브리드)
    const decision = await this.aiManager.updateAI({
      ballX: this.ball.x,
      ballY: this.ball.y,
      ballVelocityX: this.ball.velocityX,
      ballVelocityY: this.ball.velocityY,
      aiPaddleY: this.aiPaddle.y,
      aiPaddleHeight: this.aiPaddle.height,
      gameHeight: PINGPONG_CONFIG.GAME_HEIGHT,
      gameWidth: PINGPONG_CONFIG.GAME_WIDTH,
      difficulty: (this.gameState.difficulty || "medium") as
        | "easy"
        | "medium"
        | "hard",
      playerScore: this.gameState.playerScore,
      aiScore: this.gameState.aiScore,
      playerPaddleY: this.playerPaddle.y,
    });

    if (decision.direction === "up") {
      this.aiPaddle.y -=
        this.aiPaddle.speed * decision.intensity * deltaSeconds;
    } else if (decision.direction === "down") {
      this.aiPaddle.y +=
        this.aiPaddle.speed * decision.intensity * deltaSeconds;
    }
  }



  private updateAIPaddleBasic(deltaSeconds: number): void {
    // 온라인 모드용 기본 AI (폴백)
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
  }

  private clampPaddlePosition(paddle: PingPongPaddle): void {
    const halfHeight = paddle.height / 2;
    paddle.y = Phaser.Math.Clamp(
      paddle.y,
      halfHeight + PINGPONG_CONFIG.BOARD_UI_SPACE,
      PINGPONG_CONFIG.GAME_HEIGHT - halfHeight - 50
    );
  }

  private updateBall(deltaSeconds: number): void {
    this.ball.x += this.ball.velocityX * deltaSeconds;
    this.ball.y += this.ball.velocityY * deltaSeconds;

    this.checkTableBoundaryCollision();
    this.checkNetCollision();
    this.updateBallSprite();
  }

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

      this.callCallback("onNetHit", netX, netTopY);

      this.ball.x = prevX > netX ? netX + 15 : netX - 15;
    }
  }

  private updateBallSprite(): void {
    if (this.ball.sprite) {
      this.ball.sprite.setPosition(this.ball.x, this.ball.y);

      const rotationSpeed =
        Math.sqrt(this.ball.velocityX ** 2 + this.ball.velocityY ** 2) * 0.01;
      this.ball.sprite.rotation += rotationSpeed;
    }
  }

  private checkCollisions(): void {
    if (this.checkPaddleBallCollision(this.playerPaddle)) {
      this.handlePaddleHit(this.playerPaddle);
    }

    if (this.checkPaddleBallCollision(this.aiPaddle)) {
      this.handlePaddleHit(this.aiPaddle);
    }
  }

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

  private handlePaddleHit(paddle: PingPongPaddle): void {
    const relativeIntersectY = (this.ball.y - paddle.y) / (paddle.height / 2);
    const normalizedRelativeIntersectionY = Phaser.Math.Clamp(
      relativeIntersectY,
      -1,
      1
    );
    const bounceAngle =
      normalizedRelativeIntersectionY * PINGPONG_CONFIG.MAX_BOUNCE_ANGLE;

    // ✅ 랠리 카운트 증가
    this.gameState.currentRally++;
    this.gameState.totalRallies++;
    this.callCallback("onRallyUpdate", this.gameState.currentRally);

    // ✅ 최장 랠리 기록 업데이트
    if (this.gameState.currentRally > this.gameState.longestRally) {
      this.gameState.longestRally = this.gameState.currentRally;
    }

    // ✅ 완벽한 타격 판정 (패들 중앙 30% 영역)
    if (
      Math.abs(normalizedRelativeIntersectionY) <=
      PINGPONG_CONFIG.PERFECT_HIT_ZONE
    ) {
      this.gameState.perfectHits++;
      this.callCallback("onPerfectHit");
    }

    if (this.ball.speed < PINGPONG_CONFIG.BALL_MAX_SPEED) {
      this.ball.speed += PINGPONG_CONFIG.BALL_SPEED_INCREASE;
    }

    const direction = paddle === this.playerPaddle ? 1 : -1;
    this.ball.velocityX = Math.cos(bounceAngle) * this.ball.speed * direction;
    this.ball.velocityY = Math.sin(bounceAngle) * this.ball.speed;

    if (paddle === this.playerPaddle) {
      this.ball.x = paddle.x + paddle.width / 2 + this.ball.radius;
    } else {
      this.ball.x = paddle.x - paddle.width / 2 - this.ball.radius;
    }
  }

  private checkScore(): void {
    if (this.scoringInProgress) return;

    if (this.ball.x < -this.ball.radius) {
      this.handleScoring("ai");
    } else if (this.ball.x > PINGPONG_CONFIG.GAME_WIDTH + this.ball.radius) {
      this.handleScoring("player");
    }
  }

  private handleScoring(scorer: Scorer): void {
    this.scoringInProgress = true;
    this.gameState.isPlaying = false;

    // ✅ 랠리 리셋 (득점 시)
    this.gameState.currentRally = 0;

    if (scorer === "player") {
      this.gameState.playerScore++;
    } else {
      this.gameState.aiScore++;
    }

    this.gameState.servingPlayer = scorer;

    this.callCallback(
      "onScoreUpdate",
      this.gameState.playerScore,
      this.gameState.aiScore
    );
    this.callCallback("onPointScored", scorer);

    if (this.checkWinCondition()) {
      const isPlayerWin =
        this.gameState.playerScore >= PINGPONG_CONFIG.WINNING_SCORE;
      this.callCallback("onGameOver", isPlayerWin);
    } else {
      this.ball.speed = PINGPONG_CONFIG.BALL_INITIAL_SPEED;

      this.scene.time.delayedCall(1000, () => {
        this.prepareServe();
      });
    }
  }

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

  prepareServe(): void {
    this.gameState.isPlaying = false;
    this.scoringInProgress = false;

    this.positionBallForServe();

    if (this.gameState.servingPlayer === "player") {
      this.gameState.isPreparingServe = true;
    } else {
      this.gameState.isPreparingServe = false;
      this.scene.time.delayedCall(PINGPONG_CONFIG.SERVE_DELAY, () => {
        this.serve();
      });
    }
  }

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

  serve(): void {
    this.gameState.isPlaying = true;
    this.gameState.isPreparingServe = false;

    const direction = this.gameState.servingPlayer === "player" ? 1 : -1;
    const angle = (Math.random() - 0.5) * 0.3;

    this.ball.velocityX = Math.cos(angle) * this.ball.speed * direction;
    this.ball.velocityY = Math.sin(angle) * this.ball.speed;
  }

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

  resetScores(): void {
    this.gameState.playerScore = 0;
    this.gameState.aiScore = 0;
    this.callCallback("onScoreUpdate", 0, 0);
  }

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

  resetGame(): void {
    this.resetScores();
    this.resetPaddlePositions();
    this.ball.speed = PINGPONG_CONFIG.BALL_INITIAL_SPEED;
    this.gameState.isPlaying = false;
    this.gameState.isPaused = false;
    this.gameState.servingPlayer = "player";
    this.scoringInProgress = false;
    this.aiReactionTimer = 0;
    this.aiManager.reset();

    // ✅ 게임 기록 리셋
    this.gameState.elapsedTime = 0;
    this.gameState.totalRallies = 0;
    this.gameState.currentRally = 0;
    this.gameState.longestRally = 0;
    this.gameState.perfectHits = 0;
  }

  // ✅ 게임 결과 반환
  getGameResult(): PingPongGameResult {
    const isWin = this.gameState.playerScore >= PINGPONG_CONFIG.WINNING_SCORE;

    return {
      playerScore: this.gameState.playerScore,
      aiScore: this.gameState.aiScore,
      elapsedTime: Math.round(this.gameState.elapsedTime),
      totalRallies: this.gameState.totalRallies,
      longestRally: this.gameState.longestRally,
      perfectHits: this.gameState.perfectHits,
      isWin,
    };
  }

  // ✅ 게임 결과 검증 (클라이언트 측)
  isValidGameResult(): boolean {
    const result = this.getGameResult();

    // 최소 플레이 시간 체크
    if (result.elapsedTime < PINGPONG_CONFIG.MIN_PLAY_TIME) {
      console.warn("⚠️ 게임 시간이 너무 짧습니다.");
      return false;
    }

    // 점수/시간 비율 체크
    const totalScore = result.playerScore + result.aiScore;
    const scorePerSecond = totalScore / result.elapsedTime;
    if (scorePerSecond > PINGPONG_CONFIG.MAX_SCORE_PER_SECOND) {
      console.warn("⚠️ 점수 증가 속도가 비정상적입니다.");
      return false;
    }

    // 랠리 수 검증 (점수보다 많아야 함)
    if (result.totalRallies < totalScore) {
      console.warn("⚠️ 랠리 수가 점수보다 적습니다.");
      return false;
    }

    // 승리 조건 검증
    if (result.isWin && result.playerScore < PINGPONG_CONFIG.WINNING_SCORE) {
      console.warn("⚠️ 승리 조건이 맞지 않습니다.");
      return false;
    }

    return true;
  }
}
