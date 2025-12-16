// game/managers/brickbreacker/BrickBreakerGameManager.ts

interface BrickBreakerConfig {
  width: number;
  height: number;
  paddleSpeed: number;
  ballSpeed: number;
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
  isPlaying: boolean;
  isPaused: boolean;
}

export type GameResult = "win" | "gameOver";

/**
 * 벽돌깨기 게임 로직 관리
 * - 패들/볼 업데이트
 * - 충돌 감지
 * - 점수 계산
 * - 승리/패배 조건
 */
export class BrickBreakerGameManager {
  private scene: Phaser.Scene;
  private gameState: GameState;

  // Game Objects (참조)
  private paddle?: Phaser.Physics.Arcade.Sprite;
  private ball?: Phaser.Physics.Arcade.Sprite;
  private bricks?: Phaser.Physics.Arcade.StaticGroup;

  // Config
  private readonly gameConfig: BrickBreakerConfig;
  private readonly brickLayout: BrickLayoutConfig;
  private readonly pointsPerBrick: number = 10;

  // Callbacks
  private onScoreUpdate?: (score: number) => void;
  private onGameResult?: (result: GameResult) => void;
  private onBrickDestroy?: () => void;

  constructor(
    scene: Phaser.Scene,
    gameConfig: BrickBreakerConfig,
    brickLayout: BrickLayoutConfig,
    callbacks?: {
      onScoreUpdate?: (score: number) => void;
      onGameResult?: (result: GameResult) => void;
      onBrickDestroy?: () => void;
    }
  ) {
    this.scene = scene;
    this.gameConfig = gameConfig;
    this.brickLayout = brickLayout;

    // GameState 초기화
    this.gameState = {
      score: 0,
      isPlaying: true,
      isPaused: false,
    };

    // Callbacks 설정
    if (callbacks) {
      this.onScoreUpdate = callbacks.onScoreUpdate;
      this.onGameResult = callbacks.onGameResult;
      this.onBrickDestroy = callbacks.onBrickDestroy;
    }
  }

  /**
   * 게임 오브젝트 설정
   */
  setGameObjects(
    paddle: Phaser.Physics.Arcade.Sprite,
    ball: Phaser.Physics.Arcade.Sprite,
    bricks: Phaser.Physics.Arcade.StaticGroup
  ): void {
    this.paddle = paddle;
    this.ball = ball;
    this.bricks = bricks;
  }

  /**
   * 패들 이동
   */
  movePaddle(direction: "left" | "right" | "stop"): void {
    if (!this.paddle) return;

    switch (direction) {
      case "left":
        this.paddle.setVelocityX(-this.gameConfig.paddleSpeed);
        break;
      case "right":
        this.paddle.setVelocityX(this.gameConfig.paddleSpeed);
        break;
      case "stop":
        this.paddle.setVelocityX(0);
        break;
    }
  }

  /**
   * 패들과 볼 충돌 처리
   */
  handlePaddleCollision(
    ball: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    paddle:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Tilemaps.Tile
  ): void {
    const ballSprite = ball as Phaser.Physics.Arcade.Sprite;
    const paddleSprite = paddle as Phaser.Physics.Arcade.Sprite;

    const diff = ballSprite.x - paddleSprite.x;
    ballSprite.setVelocityX(diff * 5);
  }

  /**
   * 벽돌과 볼 충돌 처리
   */
  handleBrickCollision(
    ball: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    brick: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    (brick as Phaser.GameObjects.GameObject).destroy();
    this.addScore(this.pointsPerBrick);
    this.onBrickDestroy?.();

    // 모든 벽돌 제거 시 승리
    if (this.bricks?.countActive() === 0) {
      this.handleWin();
    }
  }

  /**
   * 바닥 충돌 처리 (게임 오버)
   */
  handleFloorCollision(): void {
    this.handleGameOver();
  }

  /**
   * 점수 추가
   */
  private addScore(points: number): void {
    this.gameState.score += points;
    this.onScoreUpdate?.(this.gameState.score);
  }

  /**
   * 승리 처리
   */
  private handleWin(): void {
    this.stopGame();
    this.onGameResult?.("win");
  }

  /**
   * 게임 오버 처리
   */
  private handleGameOver(): void {
    this.stopGame();
    this.onGameResult?.("gameOver");
  }

  /**
   * 게임 정지
   */
  private stopGame(): void {
    this.gameState.isPlaying = false;
    this.ball?.setVelocity(0, 0);
    this.paddle?.setVelocity(0, 0);
  }

  /**
   * 게임 상태 가져오기
   */
  getGameState(): GameState {
    return { ...this.gameState };
  }

  /**
   * 점수 가져오기
   */
  getScore(): number {
    return this.gameState.score;
  }

  /**
   * 게임 리셋
   */
  reset(): void {
    this.gameState.score = 0;
    this.gameState.isPlaying = true;
    this.gameState.isPaused = false;
    this.onScoreUpdate?.(0);
  }
}

// Export interfaces for external use
export type { BrickBreakerConfig, BrickLayoutConfig, GameState };
