// game/managers/games/brickbreaker/BrickBreakerGameManager.ts

import { BaseGameManager } from "@/game/managers/base";

/*
  todo: 라이프 시스템 / 볼 발사 메커니즘 / 볼, 패들 리셋 로직
*/

// Callback 타입 정의
interface BrickBreakerCallbacks extends Record<string, unknown> {
  onScoreUpdate?: (score: number) => void;
  onGameResult?: (result: GameResult) => void;
  onBrickDestroy?: () => void;
  onLivesUpdate?: (lives: number) => void;
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

  // 볼 발사 상태 & 초기 위치로 리셋 좌표
  private isBallLaunched: boolean = false;
  private initialBallY: number = 0;
  private initialPaddleX: number = 0;
  private initialPaddleY: number = 0;

  constructor(
    scene: Phaser.Scene,
    gameConfig: BrickBreakerConfig,
    brickLayout: BrickLayoutConfig,
    callbacks: BrickBreakerCallbacks = {}
  ) {
    // ✅ 부모 클래스 초기화
    const initialState: GameState = {
      score: 0,
      lives: gameConfig.initialLives,
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

    // 초기 위치 저장
    this.initialBallY = ball.y;
    this.initialPaddleX = paddle.x;
    this.initialPaddleY = paddle.y;
  }

  launchBall(): void {
    // 이미 발사했거나, 볼이 없거나, 게임이 안 돌아가면 무시
    if (this.isBallLaunched || !this.ball || !this.gameState.isPlaying) return;

    // 랜덤 각도로 볼 발사 (-45도 ~ 45도)
    const angle = Phaser.Math.Between(-45, 45);
    const rad = Phaser.Math.DegToRad(angle);

    // 속도 설정
    this.ball.setVelocity(
      Math.sin(rad) * this.gameConfig.ballSpeed,
      -this.gameConfig.ballSpeed // 위쪽으로 발사
    );

    this.isBallLaunched = true;
  }

  update(delta: number): void {
    //  발사 전: 볼을 패들 위에 고정
    if (!this.isBallLaunched && this.paddle && this.ball) {
      this.ball.setPosition(this.paddle.x, this.paddle.y - 20);
    }
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
    // 라이프 차감
    this.gameState.lives -= 1;
    this.callCallback("onLivesUpdate", this.gameState.lives);

    if (this.gameState.lives <= 0) {
      // 라이프 0이 되었을 때만 게임오버
      this.handleGameOver();
    } else {
      // 라이프 남음: 볼과 패들 리셋
      this.resetBallAndPaddle();
    }
  }

  private resetBallAndPaddle(): void {
    if (!this.ball || !this.paddle) return;

    // 패들 원위치
    this.paddle.setPosition(this.initialPaddleX, this.initialPaddleY);
    this.paddle.setVelocity(0, 0);

    // 볼 원위치 -> 속도 0
    this.ball.setPosition(this.paddle.x, this.initialBallY);
    this.ball.setVelocity(0, 0);

    // 볼 발사 상태 초기화
    this.isBallLaunched = false;
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

  getLives(): number {
    return this.gameState.lives;
  }

  /**
   * 게임 리셋
   */
  resetGame(): void {
    this.gameState.score = 0;
    this.gameState.lives = this.gameConfig.initialLives;
    this.gameState.isPlaying = true;
    this.gameState.isPaused = false;

    // ✅ BaseGameManager의 callCallback 사용
    this.callCallback("onScoreUpdate", 0);
    this.callCallback("onLivesUpdate", this.gameState.lives);

    this.resetBallAndPaddle();
  }
}

// Export interfaces for external use
export type { BrickBreakerConfig, BrickLayoutConfig, GameState };
