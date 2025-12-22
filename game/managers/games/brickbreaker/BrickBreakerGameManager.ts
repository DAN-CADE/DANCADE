// game/managers/games/brickbreaker/BrickBreakerGameManager.ts

import { BaseGameManager } from "@/game/managers/base";

// Callback 타입 정의
interface BrickBreakerCallbacks extends Record<string, unknown> {
  onScoreUpdate?: (score: number) => void;
  onGameResult?: (result: GameResult) => void;
  onBrickDestroy?: () => void;
}

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

export const BRICKBREAKER_CONFIG: BrickBreakerConfig = {
  width: 800,
  height: 600,
  paddleSpeed: 300,
  ballSpeed: 200,
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
 * - 패들/볼 업데이트
 * - 충돌 감지
 * - 점수 계산
 * - 승리/패배 조건
 */
export class BrickBreakerGameManager extends BaseGameManager<
  GameState,
  BrickBreakerCallbacks
> {
  // Game Objects (참조)
  private paddle?: Phaser.Physics.Arcade.Sprite;
  private ball?: Phaser.Physics.Arcade.Sprite;
  private bricks?: Phaser.Physics.Arcade.StaticGroup;

  // Config
  private readonly gameConfig: BrickBreakerConfig;
  private readonly brickLayout: BrickLayoutConfig;
  private readonly pointsPerBrick: number = 10;

  constructor(
    scene: Phaser.Scene,
    gameConfig: BrickBreakerConfig,
    brickLayout: BrickLayoutConfig,
    callbacks: BrickBreakerCallbacks = {}
  ) {
    // ✅ 부모 클래스 초기화
    const initialState: GameState = {
      score: 0,
      isPlaying: true,
      isPaused: false,
    };

    super(scene, initialState, callbacks);

    // ✅ 자식 클래스 속성 초기화
    this.gameConfig = gameConfig;
    this.brickLayout = brickLayout;
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
    // ✅ BaseGameManager의 callCallback 사용
    this.callCallback("onBrickDestroy");

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
    // ✅ BaseGameManager의 callCallback 사용
    this.callCallback("onScoreUpdate", this.gameState.score);
  }

  /**
   * 승리 처리
   */
  private handleWin(): void {
    this.stopGame();
    // ✅ BaseGameManager의 callCallback 사용
    this.callCallback("onGameResult", "win");
  }

  /**
   * 게임 오버 처리
   */
  private handleGameOver(): void {
    this.stopGame();
    // ✅ BaseGameManager의 callCallback 사용
    this.callCallback("onGameResult", "gameOver");
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
   * 점수 가져오기
   */
  getScore(): number {
    return this.gameState.score;
  }

  /**
   * 게임 리셋
   */
  resetGame(): void {
    this.gameState.score = 0;
    this.gameState.isPlaying = true;
    this.gameState.isPaused = false;
    // ✅ BaseGameManager의 callCallback 사용
    this.callCallback("onScoreUpdate", 0);
  }
}

// Export interfaces for external use
export type { BrickBreakerConfig, BrickLayoutConfig, GameState };
