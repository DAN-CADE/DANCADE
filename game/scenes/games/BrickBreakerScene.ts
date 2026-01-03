// game/scenes/games/BrickBreakerScene.ts

import { BaseGameScene } from "@/game/scenes/base/BaseGameScene";
import { GameConfig } from "@/game/config/gameRegistry";
import {
  BrickBreakerGameManager,
  BRICK_LAYOUT,
  BRICKBREAKER_CONFIG,
} from "@/game/managers/games/brickbreaker/BrickBreakerGameManager";
import { BrickBreakerUIManager } from "@/game/managers/games/brickbreaker/BrickBreakerUIManager";
import { BrickBreakerInputManager } from "@/game/managers/games/brickbreaker/BrickBreakerInputManager";
import { BrickBreakerEffectsManager } from "@/game/managers/games/brickbreaker/BrickBreakerEffectsManager";

import type {
  BrickBreakerConfig,
  BrickLayoutConfig,
} from "@/game/managers/games/brickbreaker/BrickBreakerGameManager";

export class BrickBreakerScene extends BaseGameScene {
  // Managers
  private gameManager!: BrickBreakerGameManager;
  private uiManager!: BrickBreakerUIManager;
  private inputManager!: BrickBreakerInputManager;
  private effectsManager!: BrickBreakerEffectsManager;

  // Game Objects
  private paddle!: Phaser.Physics.Arcade.Sprite;
  private ball!: Phaser.Physics.Arcade.Sprite;
  private bricks!: Phaser.Physics.Arcade.StaticGroup;

  // Game Meta
  private gameConfig?: GameConfig;

  private readonly GAME_CONFIG: BrickBreakerConfig = BRICKBREAKER_CONFIG;
  private readonly BRICK_LAYOUT: BrickLayoutConfig = BRICK_LAYOUT;

  private readonly BRICK_COLORS = [
    "element_red_rectangle_glossy",
    "element_yellow_rectangle_glossy",
    "element_green_rectangle_glossy",
    "element_blue_rectangle_glossy",
    "element_purple_rectangle_glossy",
  ];

  private readonly ASSET_PATH = "/assets/game/kenney_puzzle-pack/png/";

  constructor() {
    super({ key: "BrickBreakerScene" });
  }

  init(data: { gameConfig?: GameConfig }) {
    this.gameConfig = data.gameConfig;
  }

  // 1. 에셋 로드
  protected loadAssets(): void {
    this.load.image("paddle", `${this.ASSET_PATH}paddleBlu.png`);
    this.load.image("ball", `${this.ASSET_PATH}ballBlue.png`);
    this.load.image("buttonDefault", `${this.ASSET_PATH}buttonDefault.png`);
    this.load.image("buttonSelected", `${this.ASSET_PATH}buttonSelected.png`);

    this.BRICK_COLORS.forEach((color) => {
      this.load.image(color, `${this.ASSET_PATH}${color}.png`);
    });
  }

  protected centerViewport(backgroundColor: string = "#000000"): void {
    const { width: screenWidth, height: screenHeight } = this.scale;

    // 1. 캔버스 자체 스타일 수정 (뷰포트 바깥 영역)
    if (this.game && this.game.canvas) {
      this.game.canvas.style.backgroundColor = backgroundColor;
    }

    // 2. 카메라 배경색 설정
    this.cameras.main.setBackgroundColor(backgroundColor);

    // 3. 뷰포트 설정 (중앙 정렬)
    this.cameras.main.setViewport(
      (screenWidth - this.GAME_WIDTH) / 2,
      (screenHeight - this.GAME_HEIGHT) / 2,
      this.GAME_WIDTH,
      this.GAME_HEIGHT
    );
  }

  // 2. 씬 기본 설정
  protected setupScene(): void {
    this.centerViewport("#000000");

    // 뷰포트 안쪽은 이제 무조건 800x600
    this.physics.world.setBounds(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);

    // 배경 이미지
    const background = this.add.image(400, 300, "game_background");
    background.setDisplaySize(this.GAME_WIDTH, this.GAME_HEIGHT);
    background.setDepth(-1);

    // 핑크색 테두리 (가이드라인)
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xff006e, 1);
    graphics.strokeRect(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);
  }

  // 3. 매니저 초기화
  protected initManagers(): void {
    this.uiManager = new BrickBreakerUIManager(this);
    this.effectsManager = new BrickBreakerEffectsManager(this);
    this.inputManager = new BrickBreakerInputManager(this);

    this.gameManager = new BrickBreakerGameManager(
      this,
      this.GAME_CONFIG,
      this.BRICK_LAYOUT,
      {
        onScoreUpdate: (score) => {
          this.uiManager.updateScore(score);
        },
        onGameResult: (result) => {
          this.handleGameEnd(result);
        },
        onBrickDestroy: () => {
          // 벽돌 파괴 효과
        },
      }
    );
  }

  // 4. 게임 오브젝트 생성
  protected createGameObjects(): void {
    this.createPaddle();
    this.createBall();
    this.createBricks();
    this.uiManager.createGameUI();

    this.gameManager.setGameObjects(this.paddle, this.ball, this.bricks);
    this.setupCollisions();
  }

  // 5. 게임 종료 및 재시작 로직
  protected handleGameEnd(result: string): void {
    this.uiManager.showEndGameScreen(
      result as "win" | "gameOver",
      this.gameManager.getScore(),
      () => this.restartGame(),
      () => this.goHome()
    );
  }

  protected restartGame(): void {
    this.scene.restart();
  }

  private goHome(): void {
    this.scene.start("MainScene");
  }

  protected cleanupManagers(): void {
    this.physics.world.off("worldbounds");
    this.inputManager.cleanup();
    this.uiManager.cleanup();
  }

  update(): void {
    const direction = this.inputManager.getPaddleMoveDirection();
    this.gameManager.movePaddle(direction);
  }

  // ============================================================
  // 게임 오브젝트 생성 메서드들
  // ============================================================

  private createPaddle(): void {
    const paddleX = this.GAME_CONFIG.width / 2;
    const paddleY = 550;

    this.paddle = this.physics.add.sprite(paddleX, paddleY, "paddle");
    this.paddle.setScale(1.2).setImmovable(true).setCollideWorldBounds(true);
  }

  private createBall(): void {
    const ballX = this.GAME_CONFIG.width / 2;
    const ballY = 500;

    this.ball = this.physics.add.sprite(ballX, ballY, "ball");
    this.ball.setCollideWorldBounds(true).setBounce(1);
    this.ball.setVelocity(
      this.GAME_CONFIG.ballSpeed,
      -this.GAME_CONFIG.ballSpeed
    );

    if (this.ball.body) {
      (this.ball.body as Phaser.Physics.Arcade.Body).onWorldBounds = true;
    }
  }

  private createBricks(): void {
    this.bricks = this.physics.add.staticGroup();

    const { cols, width, spacing, startY, height } = this.BRICK_LAYOUT;
    const totalWidth = cols * width + (cols - 1) * spacing;
    const startX = (800 - totalWidth) / 2 + width / 2;

    for (let row = 0; row < this.BRICK_LAYOUT.rows; row++) {
      for (let col = 0; col < cols; col++) {
        const brickX = startX + col * (width + spacing);
        const brickY = startY + row * height;
        const brickColor = this.BRICK_COLORS[row];

        this.bricks.create(brickX, brickY, brickColor);
      }
    }
  }

  private setupCollisions(): void {
    // 1. 패들 충돌
    this.physics.add.collider(this.ball, this.paddle, (ball, paddle) => {
      this.gameManager.handlePaddleCollision(
        ball as Phaser.Types.Physics.Arcade.GameObjectWithBody,
        paddle as Phaser.Types.Physics.Arcade.GameObjectWithBody
      );
    });

    // 2. 벽돌 충돌
    this.physics.add.collider(this.ball, this.bricks, (ball, brick) => {
      this.gameManager.handleBrickCollision(
        ball as Phaser.Types.Physics.Arcade.GameObjectWithBody,
        brick as Phaser.Types.Physics.Arcade.GameObjectWithBody
      );
    });

    // 3. 바닥 충돌 (월드 경계)
    this.physics.world.on("worldbounds", (body: Phaser.Physics.Arcade.Body) => {
      if (body.gameObject === this.ball && body.blocked.down) {
        this.gameManager.handleFloorCollision();
      }
    });
  }
}
