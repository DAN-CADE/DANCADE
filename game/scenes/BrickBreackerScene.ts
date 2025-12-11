// game/scenes/BrickBreakerScene.ts
import { GameConfig } from "@/game/config/gameRegistry";

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

type EndGameType = "win" | "gameOver";

export class BrickBreakerScene extends Phaser.Scene {
  // Game Meta
  private gameConfig?: GameConfig;

  // Game Objects
  private paddle?: Phaser.Physics.Arcade.Sprite;
  private ball?: Phaser.Physics.Arcade.Sprite;
  private bricks?: Phaser.Physics.Arcade.StaticGroup;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private scoreText?: Phaser.GameObjects.Text;

  // Game State
  private score: number = 0;

  // Constants
  private readonly GAME_CONFIG: BrickBreakerConfig = {
    width: 800,
    height: 600,
    paddleSpeed: 300,
    ballSpeed: 200,
  };

  private readonly BRICK_LAYOUT: BrickLayoutConfig = {
    cols: 10,
    rows: 5,
    width: 64,
    height: 32,
    spacing: 4,
    startY: 80,
  };

  private readonly BRICK_COLORS = [
    "element_red_rectangle_glossy",
    "element_yellow_rectangle_glossy",
    "element_green_rectangle_glossy",
    "element_blue_rectangle_glossy",
    "element_purple_rectangle_glossy",
  ];

  private readonly ASSET_PATH = "/assets/game/kenney_puzzle-pack/png/";
  private readonly POINTS_PER_BRICK = 10;

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
    this.setupScene();
    this.createGameObjects();
    this.setupCollisions();
    this.setupInput();
  }

  update() {
    this.handlePaddleMovement();
  }

  shutdown() {
    this.physics.world.off("worldbounds");
  }

  /**
   * 에셋 로드
   */
  private loadAssets(): void {
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
    this.cameras.main.setBackgroundColor("#2c3e50");
  }

  /**
   * 게임 오브젝트 생성
   */
  private createGameObjects(): void {
    this.createPaddle();
    this.createBall();
    this.createBricks();
    this.createScoreText();
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
   * 점수 텍스트 생성
   */
  private createScoreText(): void {
    this.scoreText = this.add.text(16, 16, "SCORE: 0", {
      fontFamily: '"Press Start 2P"',
      fontSize: "14px",
      color: "#ffffff",
    });
  }

  /**
   * 충돌 설정
   */
  private setupCollisions(): void {
    // 공과 패들 충돌
    this.physics.add.collider(
      this.ball!,
      this.paddle!,
      this.handlePaddleCollision,
      undefined,
      this
    );

    // 공과 벽돌 충돌
    this.physics.add.collider(
      this.ball!,
      this.bricks!,
      this.handleBrickCollision,
      undefined,
      this
    );

    // 바닥 충돌 감지
    this.physics.world.on("worldbounds", (body: Phaser.Physics.Arcade.Body) => {
      if (body.gameObject === this.ball && body.blocked.down) {
        this.handleGameOver();
      }
    });
  }

  /**
   * 입력 설정
   */
  private setupInput(): void {
    this.cursors = this.input.keyboard?.createCursorKeys();
  }

  /**
   * 패들 이동 처리
   */
  private handlePaddleMovement(): void {
    if (!this.paddle || !this.cursors) return;

    if (this.cursors.left.isDown) {
      this.paddle.setVelocityX(-this.GAME_CONFIG.paddleSpeed);
    } else if (this.cursors.right.isDown) {
      this.paddle.setVelocityX(this.GAME_CONFIG.paddleSpeed);
    } else {
      this.paddle.setVelocityX(0);
    }
  }

  /**
   * 패들 충돌 처리
   */
  private handlePaddleCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
    (ball, paddle) => {
      const ballSprite = ball as Phaser.Physics.Arcade.Sprite;
      const paddleSprite = paddle as Phaser.Physics.Arcade.Sprite;

      const diff = ballSprite.x - paddleSprite.x;
      ballSprite.setVelocityX(diff * 5);
    };

  /**
   * 벽돌 충돌 처리
   */
  private handleBrickCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
    (ball, brick) => {
      (brick as Phaser.GameObjects.GameObject).destroy();
      this.updateScore(this.POINTS_PER_BRICK);

      if (this.bricks?.countActive() === 0) {
        this.handleWin();
      }
    };

  /**
   * 점수 업데이트
   */
  private updateScore(points: number): void {
    this.score += points;
    this.scoreText?.setText(`SCORE: ${this.score}`);
  }

  /**
   * 게임 승리 처리
   */
  private handleWin(): void {
    this.stopGame();
    this.showEndGameScreen("win");
  }

  /**
   * 게임 오버 처리
   */
  private handleGameOver(): void {
    this.stopGame();
    this.showEndGameScreen("gameOver");
  }

  /**
   * 게임 정지
   */
  private stopGame(): void {
    this.ball?.setVelocity(0, 0);
    this.paddle?.setVelocity(0, 0);
  }

  /**
   * 종료 화면 표시 (통합)
   */
  private showEndGameScreen(type: EndGameType): void {
    const depth = 10;
    const config = this.getEndGameConfig(type);

    // 반투명 오버레이
    this.add
      .rectangle(
        this.GAME_CONFIG.width / 2,
        this.GAME_CONFIG.height / 2,
        this.GAME_CONFIG.width,
        this.GAME_CONFIG.height,
        0x000000,
        config.overlayAlpha
      )
      .setDepth(depth);

    // 메인 텍스트
    const mainText = this.add
      .text(400, 200, config.mainText, {
        fontFamily: '"Press Start 2P"',
        fontSize: "36px",
        color: config.mainColor,
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);

    // 애니메이션 효과
    this.tweens.add({
      targets: mainText,
      ...config.animation,
      yoyo: true,
      repeat: -1,
    });

    // 점수 표시
    this.createScoreDisplay(depth);

    // 재시작 버튼
    this.createRestartButton(depth + 1);
  }

  /**
   * 종료 화면 설정 가져오기
   */
  private getEndGameConfig(type: EndGameType) {
    const configs = {
      win: {
        mainText: "YOU WIN!",
        mainColor: "#2ecc71",
        overlayAlpha: 0.6,
        animation: { scale: 1.1, duration: 300 },
      },
      gameOver: {
        mainText: "GAME OVER",
        mainColor: "#e74c3c",
        overlayAlpha: 0.7,
        animation: { alpha: 0.3, duration: 500 },
      },
    };

    return configs[type];
  }

  /**
   * 점수 표시 생성
   */
  private createScoreDisplay(depth: number): void {
    this.add
      .text(400, 280, "SCORE", {
        fontFamily: '"Press Start 2P"',
        fontSize: "14px",
        color: "#95a5a6",
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);

    this.add
      .text(400, 320, `${this.score}`, {
        fontFamily: '"Press Start 2P"',
        fontSize: "32px",
        color: "#f1c40f",
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);
  }

  /**
   * 재시작 버튼 생성
   */
  private createRestartButton(depth: number): void {
    const buttonY = 400;
    const buttonStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: "14px",
      color: "#333333",
    };

    const restartBtnBg = this.add
      .image(400, buttonY, "buttonDefault")
      .setScale(3, 1.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth);

    this.add
      .text(400, buttonY, "RETRY", buttonStyle)
      .setOrigin(0.5)
      .setDepth(depth);

    restartBtnBg.on("pointerover", () => {
      restartBtnBg.setTexture("buttonSelected").setScale(3.1, 1.6);
    });

    restartBtnBg.on("pointerout", () => {
      restartBtnBg.setTexture("buttonDefault").setScale(3, 1.5);
    });

    restartBtnBg.on("pointerdown", () => {
      this.restartGame();
    });
  }

  /**
   * 게임 재시작
   */
  private restartGame(): void {
    this.score = 0;
    this.scene.restart();
  }
}
