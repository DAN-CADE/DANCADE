// game/managers/games/brickbreaker/BrickBreakerGameManager.ts

import { BaseGameManager } from "@/game/managers/base";
import { BrickBreakerPhysicsManager } from "./physics/BrickBreakerPhysicsManager";

// Callback 타입 정의
interface BrickBreakerCallbacks extends Record<string, unknown> {
  onScoreUpdate?: (score: number) => void;
  onGameResult?: (result: GameResult) => void;
  onBrickDestroy?: (x: number, y: number, brickColor: string) => void;
  onLivesUpdate?: (lives: number) => void;
  onGamePause?: () => void;
  onGameResume?: () => void;
}

interface BrickBreakerConfig {
  width: number;
  height: number;
  paddleSpeed: number;
  ballSpeed: number;
  initialLives: number;
}

interface BrickLayoutConfig {
  cols: number;
  rows: number;
  width: number;
  height: number;
  spacing: number;
  startY: number;
}

interface GameState {
  score: number;
  lives: number;
  isPlaying: boolean;
  isPaused: boolean;
  elapsedTime: number;
  bricksDestroyed: number;
}

export const BRICKBREAKER_CONFIG: BrickBreakerConfig = {
  width: 800,
  height: 600,
  paddleSpeed: 300,
  ballSpeed: 200,
  initialLives: 3,
};

export const BRICK_LAYOUT: BrickLayoutConfig = {
  cols: 10,
  rows: 5,
  width: 64,
  height: 32,
  spacing: 4,
  startY: 80,
};

export type GameResult = "win" | "gameOver";

/**
 * 벽돌깨기 게임 로직 관리
 * - 물리 연산은 BrickBreakerPhysicsManager에 위임
 */
export class BrickBreakerGameManager extends BaseGameManager<GameState, BrickBreakerCallbacks> {
  // Game Objects (참조)
  private paddle?: Phaser.Physics.Arcade.Sprite;
  private ball?: Phaser.Physics.Arcade.Sprite;
  private bricks?: Phaser.Physics.Arcade.StaticGroup;

  // Config
  private readonly gameConfig: BrickBreakerConfig;
  private readonly brickLayout: BrickLayoutConfig;
  private readonly pointsPerBrick: number = 10;

  // 서브 매니저
  private physics: BrickBreakerPhysicsManager;

  // 볼 발사 상태 & 초기 위치
  private isBallLaunched: boolean = false;
  private initialBallY: number = 0;
  private initialPaddleX: number = 0;
  private initialPaddleY: number = 0;

  // 일시정지 전 속도 저장용
  private savedBallVelocity?: { x: number; y: number };
  private savedPaddleVelocity?: number;

  constructor(
    scene: Phaser.Scene,
    gameConfig: BrickBreakerConfig,
    brickLayout: BrickLayoutConfig,
    callbacks: BrickBreakerCallbacks = {}
  ) {
    const initialState: GameState = {
      score: 0,
      lives: gameConfig.initialLives,
      isPlaying: true,
      isPaused: false,
      elapsedTime: 0,
      bricksDestroyed: 0,
    };

    super(scene, initialState, callbacks);

    this.gameConfig = gameConfig;
    this.brickLayout = brickLayout;
    this.physics = new BrickBreakerPhysicsManager(scene, gameConfig);
  }

  // =====================================================================
  // 게임 오브젝트 설정
  // =====================================================================

  setGameObjects(
    paddle: Phaser.Physics.Arcade.Sprite,
    ball: Phaser.Physics.Arcade.Sprite,
    bricks: Phaser.Physics.Arcade.StaticGroup
  ): void {
    this.paddle = paddle;
    this.ball = ball;
    this.bricks = bricks;

    this.initialBallY = ball.y;
    this.initialPaddleX = paddle.x;
    this.initialPaddleY = paddle.y;
  }

  // =====================================================================
  // 게임 업데이트
  // =====================================================================

  update(delta: number): void {
    // 발사 전: 볼을 패들 위에 고정
    if (!this.isBallLaunched && this.paddle && this.ball) {
      this.physics.attachBallToPaddle(this.ball, this.paddle);
    }

    // 게임 플레이 중일 때만 시간 누적
    if (this.gameState.isPlaying && !this.gameState.isPaused) {
      this.gameState.elapsedTime += delta / 1000;
    }
  }

  // =====================================================================
  // 패들/공 제어 (물리 매니저에 위임)
  // =====================================================================

  launchBall(): void {
    if (this.isBallLaunched || !this.ball || !this.gameState.isPlaying) return;

    this.physics.launchBall(this.ball);
    this.isBallLaunched = true;
  }

  movePaddle(direction: "left" | "right" | "stop"): void {
    if (!this.paddle) return;
    this.physics.movePaddle(this.paddle, direction);
  }

  // =====================================================================
  // 충돌 처리
  // =====================================================================

  handlePaddleCollision(
    ball: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    paddle: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    this.physics.handlePaddleCollision(
      ball as Phaser.Physics.Arcade.Sprite,
      paddle as Phaser.Physics.Arcade.Sprite
    );
  }

  handleBrickCollision(
    ball: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    brick: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    const brickSprite = brick as Phaser.Physics.Arcade.Sprite;
    const brickX = brickSprite.x;
    const brickY = brickSprite.y;
    const brickTexture = brickSprite.texture.key;

    brickSprite.destroy();

    this.gameState.bricksDestroyed += 1;
    this.addScore(this.pointsPerBrick);
    this.callCallback("onBrickDestroy", brickX, brickY, brickTexture);

    if (this.bricks?.countActive() === 0) {
      this.handleWin();
    }
  }

  handleFloorCollision(): void {
    this.gameState.lives -= 1;
    this.callCallback("onLivesUpdate", this.gameState.lives);

    if (this.gameState.lives <= 0) {
      this.handleGameOver();
    } else {
      this.resetBallAndPaddle();
    }
  }

  private resetBallAndPaddle(): void {
    if (!this.ball || !this.paddle) return;

    this.physics.resetBallAndPaddle(
      this.ball,
      this.paddle,
      this.initialPaddleX,
      this.initialPaddleY,
      this.initialBallY
    );
    this.isBallLaunched = false;
  }

  // =====================================================================
  // 일시정지 (물리 매니저에 위임)
  // =====================================================================

  pauseGame(): void {
    if (!this.gameState.isPlaying || this.gameState.isPaused) return;
    if (!this.ball || !this.paddle) return;

    const saved = this.physics.saveVelocities(this.ball, this.paddle);
    this.savedBallVelocity = saved.ballVelocity;
    this.savedPaddleVelocity = saved.paddleVelocity;

    this.physics.freezeObjects(this.ball, this.paddle);

    this.gameState.isPaused = true;
    this.callCallback("onGamePause");
  }

  resumeGame(): void {
    if (!this.gameState.isPaused) return;
    if (!this.ball || !this.paddle) return;

    this.physics.unfreezeObjects(
      this.ball,
      this.paddle,
      this.savedBallVelocity ?? { x: 0, y: 0 },
      this.savedPaddleVelocity ?? 0
    );

    this.gameState.isPaused = false;
    this.callCallback("onGameResume");
  }

  togglePause(): void {
    if (this.gameState.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  // =====================================================================
  // 점수 및 게임 상태
  // =====================================================================

  private addScore(points: number): void {
    this.gameState.score += points;
    this.callCallback("onScoreUpdate", this.gameState.score);
  }

  private handleWin(): void {
    this.stopGame();
    this.callCallback("onGameResult", "win");
  }

  private handleGameOver(): void {
    this.stopGame();
    this.callCallback("onGameResult", "gameOver");
  }

  private stopGame(): void {
    this.gameState.isPlaying = false;
    this.ball?.setVelocity(0, 0);
    this.paddle?.setVelocity(0, 0);
  }

  // =====================================================================
  // Getters
  // =====================================================================

  getScore(): number {
    return this.gameState.score;
  }

  getLives(): number {
    return this.gameState.lives;
  }

  isPaused(): boolean {
    return this.gameState.isPaused;
  }

  getGameResult(): {
    score: number;
    elapsedTime: number;
    bricksDestroyed: number;
    isWin: boolean;
    lives: number;
  } {
    return {
      score: this.gameState.score,
      elapsedTime: Math.floor(this.gameState.elapsedTime),
      bricksDestroyed: this.gameState.bricksDestroyed,
      isWin: this.bricks?.countActive() === 0,
      lives: this.gameState.lives,
    };
  }

  // =====================================================================
  // 리셋
  // =====================================================================

  resetGame(): void {
    this.gameState.score = 0;
    this.gameState.lives = this.gameConfig.initialLives;
    this.gameState.isPlaying = true;
    this.gameState.isPaused = false;
    this.gameState.elapsedTime = 0;
    this.gameState.bricksDestroyed = 0;

    this.callCallback("onScoreUpdate", 0);
    this.callCallback("onLivesUpdate", this.gameState.lives);

    this.resetBallAndPaddle();
  }
}

// Export interfaces for external use
export type { BrickBreakerConfig, BrickLayoutConfig, GameState };
