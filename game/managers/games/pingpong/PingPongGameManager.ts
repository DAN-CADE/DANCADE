// game/managers/games/pingpong/PingPongGameManager.ts

import { BaseGameManager } from "@/game/managers/base";
import { PingPongAIManager } from "./PingPongAIManager";
import { PingPongPhysicsManager } from "./physics/PingPongPhysicsManager";
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
 * - 물리 연산은 PingPongPhysicsManager에 위임
 * - AI 로직은 PingPongAIManager에 위임
 */
export class PingPongGameManager extends BaseGameManager<PingPongGameState, PingPongCallbacks> {
  private playerPaddle!: PingPongPaddle;
  private aiPaddle!: PingPongPaddle;
  private ball!: PingPongBall;
  private board!: Phaser.GameObjects.Image;

  private scoringInProgress: boolean = false;
  private aiReactionTimer: number = 0;

  // 서브 매니저
  private physics: PingPongPhysicsManager;
  private aiManager: PingPongAIManager;

  constructor(
    scene: Phaser.Scene,
    gameState: PingPongGameState,
    callbacks?: PingPongCallbacks
  ) {
    super(scene, gameState, callbacks ?? {});
    this.physics = new PingPongPhysicsManager(scene);
    this.aiManager = new PingPongAIManager();
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

  // =====================================================================
  // 게임 업데이트
  // =====================================================================

  update(deltaSeconds: number): void {
    if (!this.shouldUpdate()) return;

    this.gameState.elapsedTime += deltaSeconds;

    this.updatePlayerPaddle();
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

  // =====================================================================
  // 패들 업데이트
  // =====================================================================

  updatePlayerPaddle(): void {
    this.physics.clampPaddlePosition(this.playerPaddle);
    this.playerPaddle.sprite?.setPosition(this.playerPaddle.x, this.playerPaddle.y);
  }

  movePlayerPaddle(direction: "up" | "down", deltaSeconds: number): void {
    if (direction === "up") {
      this.playerPaddle.y -= this.playerPaddle.speed * deltaSeconds;
    } else {
      this.playerPaddle.y += this.playerPaddle.speed * deltaSeconds;
    }
  }

  private updateAIPaddle(deltaSeconds: number): void {
    if (this.gameState.mode === PingPongMode.SINGLE) {
      this.updateAIPaddleWithGPT(deltaSeconds);
    } else {
      this.updateAIPaddleBasic(deltaSeconds);
    }

    this.physics.clampPaddlePosition(this.aiPaddle);
    this.aiPaddle.sprite?.setPosition(this.aiPaddle.x, this.aiPaddle.y);
  }

  private async updateAIPaddleWithGPT(deltaSeconds: number): Promise<void> {
    const decision = await this.aiManager.updateAI({
      ballX: this.ball.x,
      ballY: this.ball.y,
      ballVelocityX: this.ball.velocityX,
      ballVelocityY: this.ball.velocityY,
      aiPaddleY: this.aiPaddle.y,
      aiPaddleHeight: this.aiPaddle.height,
      gameHeight: PINGPONG_CONFIG.GAME_HEIGHT,
      gameWidth: PINGPONG_CONFIG.GAME_WIDTH,
      difficulty: (this.gameState.difficulty || "medium") as "easy" | "medium" | "hard",
      playerScore: this.gameState.playerScore,
      aiScore: this.gameState.aiScore,
      playerPaddleY: this.playerPaddle.y,
    });

    if (decision.direction === "up") {
      this.aiPaddle.y -= this.aiPaddle.speed * decision.intensity * deltaSeconds;
    } else if (decision.direction === "down") {
      this.aiPaddle.y += this.aiPaddle.speed * decision.intensity * deltaSeconds;
    }
  }

  private updateAIPaddleBasic(deltaSeconds: number): void {
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

  // =====================================================================
  // 공 업데이트 (물리 매니저에 위임)
  // =====================================================================

  private updateBall(deltaSeconds: number): void {
    this.physics.updateBall(
      this.ball,
      this.board,
      deltaSeconds,
      (x, y) => this.callCallback("onNetHit", x, y)
    );
  }

  // =====================================================================
  // 충돌 처리 (물리 매니저에 위임)
  // =====================================================================

  private checkCollisions(): void {
    if (this.physics.checkPaddleBallCollision(this.playerPaddle, this.ball)) {
      this.handlePaddleHit(this.playerPaddle, true);
    }

    if (this.physics.checkPaddleBallCollision(this.aiPaddle, this.ball)) {
      this.handlePaddleHit(this.aiPaddle, false);
    }
  }

  private handlePaddleHit(paddle: PingPongPaddle, isPlayerPaddle: boolean): void {
    const isPerfect = this.physics.handlePaddleHit(paddle, this.ball, isPlayerPaddle);

    // 랠리 카운트 증가
    this.gameState.currentRally++;
    this.gameState.totalRallies++;
    this.callCallback("onRallyUpdate", this.gameState.currentRally);

    // 최장 랠리 기록 업데이트
    if (this.gameState.currentRally > this.gameState.longestRally) {
      this.gameState.longestRally = this.gameState.currentRally;
    }

    // 완벽한 타격
    if (isPerfect) {
      this.gameState.perfectHits++;
      this.callCallback("onPerfectHit");
    }
  }

  // =====================================================================
  // 점수 처리
  // =====================================================================

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
    this.gameState.currentRally = 0;

    if (scorer === "player") {
      this.gameState.playerScore++;
    } else {
      this.gameState.aiScore++;
    }

    this.gameState.servingPlayer = scorer;

    this.callCallback("onScoreUpdate", this.gameState.playerScore, this.gameState.aiScore);
    this.callCallback("onPointScored", scorer);

    if (this.checkWinCondition()) {
      const isPlayerWin = this.gameState.playerScore >= PINGPONG_CONFIG.WINNING_SCORE;
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
      (playerScore >= PINGPONG_CONFIG.WINNING_SCORE && scoreDiff >= PINGPONG_CONFIG.WINNING_MARGIN) ||
      (aiScore >= PINGPONG_CONFIG.WINNING_SCORE && scoreDiff >= PINGPONG_CONFIG.WINNING_MARGIN)
    );
  }

  // =====================================================================
  // 서브 관리
  // =====================================================================

  prepareServe(): void {
    this.gameState.isPlaying = false;
    this.scoringInProgress = false;

    this.physics.positionBallForServe(
      this.ball,
      this.playerPaddle,
      this.aiPaddle,
      this.gameState.servingPlayer
    );

    if (this.gameState.servingPlayer === "player") {
      this.gameState.isPreparingServe = true;
    } else {
      this.gameState.isPreparingServe = false;
      this.scene.time.delayedCall(PINGPONG_CONFIG.SERVE_DELAY, () => {
        this.serve();
      });
    }
  }

  serve(): void {
    this.gameState.isPlaying = true;
    this.gameState.isPreparingServe = false;
    this.physics.serve(this.ball, this.gameState.servingPlayer);
  }

  adjustServePosition(newY: number): void {
    if (!this.gameState.isPreparingServe) return;
    if (this.gameState.servingPlayer !== "player") return;

    const minY = 200;
    const maxY = 400;

    this.ball.y = Phaser.Math.Clamp(newY, minY, maxY);
    this.playerPaddle.y = this.ball.y;

    this.ball.sprite?.setPosition(this.ball.x, this.ball.y);
    this.playerPaddle.sprite?.setPosition(this.playerPaddle.x, this.playerPaddle.y);
  }

  // =====================================================================
  // 리셋
  // =====================================================================

  resetScores(): void {
    this.gameState.playerScore = 0;
    this.gameState.aiScore = 0;
    this.callCallback("onScoreUpdate", 0, 0);
  }

  resetPaddlePositions(): void {
    const centerY = PINGPONG_CONFIG.GAME_HEIGHT / 2;

    this.playerPaddle.y = centerY;
    this.aiPaddle.y = centerY;

    this.playerPaddle.sprite?.setPosition(this.playerPaddle.x, this.playerPaddle.y);
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

    // 게임 기록 리셋
    this.gameState.elapsedTime = 0;
    this.gameState.totalRallies = 0;
    this.gameState.currentRally = 0;
    this.gameState.longestRally = 0;
    this.gameState.perfectHits = 0;
  }

  // =====================================================================
  // 게임 결과
  // =====================================================================

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

  isValidGameResult(): boolean {
    const result = this.getGameResult();

    if (result.elapsedTime < PINGPONG_CONFIG.MIN_PLAY_TIME) {
      console.warn("⚠️ 게임 시간이 너무 짧습니다.");
      return false;
    }

    const totalScore = result.playerScore + result.aiScore;
    const scorePerSecond = totalScore / result.elapsedTime;
    if (scorePerSecond > PINGPONG_CONFIG.MAX_SCORE_PER_SECOND) {
      console.warn("⚠️ 점수 증가 속도가 비정상적입니다.");
      return false;
    }

    if (result.totalRallies < totalScore) {
      console.warn("⚠️ 랠리 수가 점수보다 적습니다.");
      return false;
    }

    if (result.isWin && result.playerScore < PINGPONG_CONFIG.WINNING_SCORE) {
      console.warn("⚠️ 승리 조건이 맞지 않습니다.");
      return false;
    }

    return true;
  }
}
