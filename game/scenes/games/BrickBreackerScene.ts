// game/scenes/BrickBreakerScene.ts
import { GameConfig } from "@/game/config/gameRegistry";
import { BrickBreakerGameManager } from "@/game/managers/games/brickbreaker/BrickBreakerGameManager";
import { BrickBreakerUIManager } from "@/game/managers/games/brickbreaker/BrickBreakerUIManager";
import { BrickBreakerInputManager } from "@/game/managers/games/brickbreaker/BrickBreakerInputManager";
import { BrickBreakerEffectsManager } from "@/game/managers/games/brickbreaker/BrickBreakerEffectsManager";

import type {
  BrickBreakerConfig,
  BrickLayoutConfig,
} from "@/game/managers/games/brickbreaker/BrickBreakerGameManager";

/**
 * 벽돌깨기 게임 씬
 * 매니저들을 조합하여 게임을 구성
 */
export class BrickBreakerScene extends Phaser.Scene {
  // Managers (게임로직, UI, 입력, 이펙트)
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

  // Constants
  // 게임 기본 설정 (너비, 높이, 속도)
  private readonly GAME_CONFIG: BrickBreakerConfig = {
    width: 800,
    height: 600,
    paddleSpeed: 300,
    ballSpeed: 200,
  };

  // 벽돌 배치 설정 (행, 열, 크기, 간격, 시작 Y 좌표)
  private readonly BRICK_LAYOUT: BrickLayoutConfig = {
    cols: 10,
    rows: 5,
    width: 64,
    height: 32,
    spacing: 4,
    startY: 80,
  };

  // 벽돌 색상 리스트
  private readonly BRICK_COLORS = [
    "element_red_rectangle_glossy",
    "element_yellow_rectangle_glossy",
    "element_green_rectangle_glossy",
    "element_blue_rectangle_glossy",
    "element_purple_rectangle_glossy",
  ];

  // 에셋 경로
  private readonly ASSET_PATH = "/assets/game/kenney_puzzle-pack/png/";

  constructor() {
    super({ key: "BrickBreakerScene" });
  }

  init(data: { gameConfig?: GameConfig }) {
    this.gameConfig = data.gameConfig;
  }

  preload() {
    this.loadAssets();
  }

  create() {
    this.scale.resize(800, 600);
    this.setupScene();
    this.initManagers();
    this.createGameObjects();
    this.setupCollisions();
  }

  update() {
    const direction = this.inputManager.getPaddleMoveDirection();
    this.gameManager.movePaddle(direction);
  }

  shutdown() {
    this.physics.world.off("worldbounds");
    this.inputManager.cleanup();
    this.uiManager.cleanup();
  }

  /**
   * 에셋 로드
   */
  private loadAssets(): void {
    // 배경 이미지 로드
    this.load.image("game_background", "/assets/background/bg 1.png");

    this.load.image("paddle", `${this.ASSET_PATH}paddleBlu.png`);
    this.load.image("ball", `${this.ASSET_PATH}ballBlue.png`);
    this.load.image("buttonDefault", `${this.ASSET_PATH}buttonDefault.png`);
    this.load.image("buttonSelected", `${this.ASSET_PATH}buttonSelected.png`);

    this.BRICK_COLORS.forEach((color) => {
      this.load.image(color, `${this.ASSET_PATH}${color}.png`);
    });
  }

  /**
   * 씬 기본 설정
   */
  private setupScene(): void {
    // 배경 이미지 추가
    const background = this.add.image(400, 300, "game_background");
    background.setDisplaySize(800, 600);
    background.setDepth(-1);

    this.cameras.main.setBackgroundColor("#000000");
  }

  /**
   * 매니저 초기화
   */
  private initManagers(): void {
    // UI Manager
    this.uiManager = new BrickBreakerUIManager(this);

    // Effects Manager
    this.effectsManager = new BrickBreakerEffectsManager(this);

    // Game Manager
    this.gameManager = new BrickBreakerGameManager(
      this,
      this.GAME_CONFIG,
      this.BRICK_LAYOUT,
      {
        onScoreUpdate: (score) => {
          this.uiManager.updateScore(score);
        },
        onGameResult: (result) => {
          this.handleGameResult(result);
        },
        onBrickDestroy: () => {
          // 벽돌 파괴 효과는 필요시 추가
          // this.effectsManager.createBrickDestroyEffect(x, y);
        },
      }
    );

    // Input Manager
    this.inputManager = new BrickBreakerInputManager(this);
  }

  /**
   * 게임 오브젝트 생성
   */
  private createGameObjects(): void {
    this.createPaddle();
    this.createBall();
    this.createBricks();
    this.uiManager.createGameUI();

    this.gameManager.setGameObjects(this.paddle, this.ball, this.bricks);
  }

  /**
   * 패들 생성
   */
  private createPaddle(): void {
    const paddleX = this.GAME_CONFIG.width / 2;
    const paddleY = 550;

    this.paddle = this.physics.add.sprite(paddleX, paddleY, "paddle");
    this.paddle.setScale(1.2);
    this.paddle.setImmovable(true);
    this.paddle.setCollideWorldBounds(true);
  }

  /**
   * 공 생성
   */
  private createBall(): void {
    const ballX = this.GAME_CONFIG.width / 2;
    const ballY = 500;

    this.ball = this.physics.add.sprite(ballX, ballY, "ball");
    this.ball.setCollideWorldBounds(true);
    this.ball.setBounce(1);
    this.ball.setVelocity(
      this.GAME_CONFIG.ballSpeed,
      -this.GAME_CONFIG.ballSpeed
    );

    if (this.ball.body) {
      (this.ball.body as Phaser.Physics.Arcade.Body).onWorldBounds = true;
    }
  }

  /**
   * 벽돌 생성
   */
  private createBricks(): void {
    this.bricks = this.physics.add.staticGroup();

    const { cols, width, spacing, startY, height } = this.BRICK_LAYOUT;
    const totalWidth = cols * width + (cols - 1) * spacing;
    const startX = (this.GAME_CONFIG.width - totalWidth) / 2 + width / 2;

    for (let row = 0; row < this.BRICK_LAYOUT.rows; row++) {
      for (let col = 0; col < cols; col++) {
        const brickX = startX + col * (width + spacing);
        const brickY = startY + row * height;
        const brickColor = this.BRICK_COLORS[row];

        this.bricks.create(brickX, brickY, brickColor);
      }
    }
  }

  /**
   * 충돌 설정
   */
  private setupCollisions(): void {
    // 공과 패들 충돌
    this.physics.add.collider(this.ball, this.paddle, (ball, paddle) => {
      this.gameManager.handlePaddleCollision(
        ball as Phaser.Types.Physics.Arcade.GameObjectWithBody,
        paddle as Phaser.Types.Physics.Arcade.GameObjectWithBody
      );
    });

    // 공과 벽돌 충돌
    this.physics.add.collider(this.ball, this.bricks, (ball, brick) => {
      this.gameManager.handleBrickCollision(
        ball as Phaser.Types.Physics.Arcade.GameObjectWithBody,
        brick as Phaser.Types.Physics.Arcade.GameObjectWithBody
      );
    });

    // 바닥 충돌 감지
    this.physics.world.on("worldbounds", (body: Phaser.Physics.Arcade.Body) => {
      if (body.gameObject === this.ball && body.blocked.down) {
        this.gameManager.handleFloorCollision();
      }
    });
  }

  /**
   * 게임 결과 처리
   */
  private handleGameResult(result: "win" | "gameOver"): void {
    this.uiManager.showEndGameScreen(result, this.gameManager.getScore(), () =>
      this.restartGame()
    );
  }

  /**
   * 게임 재시작
   */
  private restartGame(): void {
    this.scene.restart();
  }
}
