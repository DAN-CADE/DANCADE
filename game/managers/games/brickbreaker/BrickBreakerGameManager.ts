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
  elapsedTime: number; // 플레이 시간
  bricksDestroyed: number; // 제거된 벽돌 수
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

  // 일시정지 전 속도 저장용
  private savedBallVelocity?: { x: number; y: number };
  private savedPaddleVelocity?: number;

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
      elapsedTime: 0,
      bricksDestroyed: 0,
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

    // 게임 플레이 중일 때만 시간 누적
    if (this.gameState.isPlaying && !this.gameState.isPaused) {
      this.gameState.elapsedTime += delta / 1000; // 초 단위 누적
    }
  }

  /**
   * 패들 이동
   */
  movePaddle(direction: "left" | "right" | "stop"): void {
    if (!this.paddle) return;

    const paddleHalfWidth = this.paddle.displayWidth / 2;

    switch (direction) {
      case "left":
        // 왼쪽 경계 체크: 패들이 왼쪽 끝에 닿지 않으면 이동
        if (this.paddle.x > paddleHalfWidth) {
          this.paddle.setVelocityX(-this.gameConfig.paddleSpeed);
        } else {
          this.paddle.setVelocityX(0);
        }
        break;
      case "right":
        // 오른쪽 경계 체크: 패들이 오른쪽 끝에 닿지 않으면 이동
        if (this.paddle.x < this.gameConfig.width - paddleHalfWidth) {
          this.paddle.setVelocityX(this.gameConfig.paddleSpeed);
        } else {
          this.paddle.setVelocityX(0);
        }
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

    // ✅ 수직 속도가 너무 작으면 보정 (너무 수평으로 움직이는 것 방지)
    if (ballSprite.body && Math.abs(ballSprite.body.velocity.y) < 50) {
      ballSprite.setVelocityY(ballSprite.body.velocity.y > 0 ? 100 : -100);
    }
  }

  /**
   * 벽돌과 볼 충돌 처리
   */
  handleBrickCollision(
    ball: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    brick: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    (brick as Phaser.GameObjects.GameObject).destroy();

    this.gameState.bricksDestroyed += 1;

    this.addScore(this.pointsPerBrick);
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
   * 일시정지 토글
   */
  pauseGame(): void {
    if (!this.gameState.isPlaying || this.gameState.isPaused) {
      console.log(
        "⏸ 일시정지 불가능 - isPlaying:",
        this.gameState.isPlaying,
        "isPaused:",
        this.gameState.isPaused
      );
      return;
    }

    console.log("⏸ 게임 일시정지 시작");

    // 현재 속도 저장
    if (this.ball?.body) {
      this.savedBallVelocity = {
        x: this.ball.body.velocity.x,
        y: this.ball.body.velocity.y,
      };
    }
    if (this.paddle?.body) {
      this.savedPaddleVelocity = this.paddle.body.velocity.x;
    }

    console.log(
      "저장된 속도 - 공:",
      this.savedBallVelocity,
      "패들:",
      this.savedPaddleVelocity
    );

    // 속도 0으로 + 물리 비활성화
    this.ball?.setVelocity(0, 0);
    this.paddle?.setVelocity(0, 0);

    // 물리 엔진에서 제외
    if (this.ball?.body) {
      this.ball.body.enable = false;
    }
    if (this.paddle?.body) {
      this.paddle.body.enable = false;
    }

    this.gameState.isPaused = true;
    console.log("✅ isPaused = true, 콜백 호출");
    this.callCallback("onGamePause");
  }

  /**
   * 일시정지 해제
   */
  resumeGame(): void {
    if (!this.gameState.isPaused) {
      console.log("▶ 재개 불가능 - isPaused:", this.gameState.isPaused);
      return;
    }

    console.log("▶ 게임 재개 시작");

    // 물리 엔진에 다시 추가
    if (this.ball?.body) {
      this.ball.body.enable = true;
    }
    if (this.paddle?.body) {
      this.paddle.body.enable = true;
    }

    // 저장된 속도 복원 (물리 활성화 후 속도 설정)
    if (this.ball && this.savedBallVelocity) {
      this.ball.setVelocity(this.savedBallVelocity.x, this.savedBallVelocity.y);
      console.log("복원된 공 속도:", this.savedBallVelocity);
    }
    if (this.paddle && this.savedPaddleVelocity !== undefined) {
      this.paddle.setVelocityX(this.savedPaddleVelocity);
      console.log("복원된 패들 속도:", this.savedPaddleVelocity);
    }

    this.gameState.isPaused = false;
    console.log("✅ isPaused = false, 콜백 호출");
    this.callCallback("onGameResume");
  }

  /**
   * 일시정지 토글
   */
  togglePause(): void {
    if (this.gameState.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
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
   * 일시정지 상태 확인
   */
  isPaused(): boolean {
    return this.gameState.isPaused;
  }

  /**
   * 게임 결과 데이터 반환 (서버 전송용)
   */
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

  /**
   * 게임 리셋
   */
  resetGame(): void {
    this.gameState.score = 0;
    this.gameState.lives = this.gameConfig.initialLives;
    this.gameState.isPlaying = true;
    this.gameState.isPaused = false;
    this.gameState.elapsedTime = 0;
    this.gameState.bricksDestroyed = 0;

    // ✅ BaseGameManager의 callCallback 사용
    this.callCallback("onScoreUpdate", 0);
    this.callCallback("onLivesUpdate", this.gameState.lives);

    this.resetBallAndPaddle();
  }
}

// Export interfaces for external use
export type { BrickBreakerConfig, BrickLayoutConfig, GameState };
