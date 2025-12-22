import { BaseGameScene } from "@/game/scenes/base/BaseGameScene"; // 경로 확인
import { GameConfig } from "@/game/config/gameRegistry";
import { ASSET_PATHS } from "@/game/constants";

export class StartScene extends BaseGameScene {
  private startButton?: Phaser.GameObjects.Image;
  private gameConfig?: GameConfig;

  constructor() {
    super({ key: "StartScene" });
  }

  init(data: { gameConfig?: GameConfig }) {
    this.gameConfig = data.gameConfig;
  }

  // 1. 에셋 로드 (BaseGameScene의 preload에서 자동 실행)
  protected loadAssets(): void {
    const basePath = ASSET_PATHS.GAME.KENNEY_PUZZLE;
    this.load.image("game_background", "/assets/background/bg 1.png");
    this.load.image("ball", `${basePath}ballBlue.png`);
    this.load.image("paddle", `${basePath}paddleBlu.png`);
    this.load.image("buttonDefault", `${basePath}buttonDefault.png`);
    this.load.image("buttonSelected", `${basePath}buttonSelected.png`);

    ["red", "yellow", "green", "blue", "purple"].forEach((color) => {
      this.load.image(
        `brick_${color}`,
        `${basePath}element_${color}_rectangle_glossy.png`
      );
    });
  }

  // 2. 씬 설정 (배경색, 테두리 등)
  protected setupScene(): void {
    this.cameras.main.setBackgroundColor("#000");
    this.fadeIn();

    // 배경 이미지
    const background = this.add.image(
      this.getRelativeX(400),
      this.getRelativeY(300),
      "game_background"
    );
    background.setDisplaySize(this.GAME_WIDTH, this.GAME_HEIGHT);
    background.setDepth(-1);

    // 핑크색 테두리
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xff006e, 1);
  }

  // 3. 매니저 초기화 (StartScene은 필요 없으므로 비워둠)
  protected initManagers(): void {}

  // 4. 오브젝트 생성 (UI 요소들)
  protected createGameObjects(): void {
    this.createTitle();
    this.createPreview();
    this.createStartButton();
    this.createInstructions();
  }

  // --- 기존 UI 생성 로직 (getRelativeX/Y 사용) ---

  private createTitle(): void {
    const titleStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: "32px",
      color: "#ffffff",
    };
    const subStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: "12px",
      color: "#aaaaaa",
    };
    const gameName = this.gameConfig?.name.toUpperCase() || "BRICK BREAKER";

    this.add
      .text(this.getRelativeX(400), this.getRelativeY(80), gameName, titleStyle)
      .setOrigin(0.5);
    this.add
      .text(
        this.getRelativeX(400),
        this.getRelativeY(130),
        "ARCADE GAME",
        subStyle
      )
      .setOrigin(0.5);
  }

  private createPreview(): void {
    const brickColors = [
      "brick_red",
      "brick_yellow",
      "brick_green",
      "brick_blue",
      "brick_purple",
    ];
    const startX = (this.GAME_WIDTH - 5 * 68) / 2 + 34;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        this.add.image(
          this.getRelativeX(startX + col * 68),
          this.getRelativeY(210 + row * 30),
          brickColors[col]
        );
      }
    }

    this.add
      .image(this.getRelativeX(400), this.getRelativeY(360), "paddle")
      .setScale(1.2);
    const ball = this.add.image(
      this.getRelativeX(400),
      this.getRelativeY(320),
      "ball"
    );
    this.tweens.add({
      targets: ball,
      y: this.getRelativeY(340),
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createStartButton(): void {
    const x = this.getRelativeX(400),
      y = this.getRelativeY(450);
    this.startButton = this.add
      .image(x, y, "buttonDefault")
      .setScale(2)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, "START", {
        fontFamily: '"Press Start 2P"',
        fontSize: "16px",
        color: "#333333",
      })
      .setOrigin(0.5);

    this.startButton.on("pointerover", () =>
      this.startButton?.setScale(2.1).setTexture("buttonSelected")
    );
    this.startButton.on("pointerout", () =>
      this.startButton?.setScale(2).setTexture("buttonDefault")
    );
    this.startButton.on("pointerdown", () => this.startGame());
  }

  private createInstructions(): void {
    this.add
      .text(
        this.getRelativeX(400),
        this.getRelativeY(520),
        "◀︎  ▶︎ USE ARROW KEYS",
        {
          fontFamily: '"Press Start 2P"',
          fontSize: "10px",
          color: "#888888",
        }
      )
      .setOrigin(0.5);
  }

  private startGame(): void {
    const sceneKey = this.gameConfig?.sceneKey || "BrickBreakerScene";
    this.transitionTo(sceneKey, { gameConfig: this.gameConfig });
  }

  // --- BaseGameScene 의무 구현 메서드 (필요 없으면 비워둠) ---
  protected handleGameEnd(): void {}
  protected restartGame(): void {}
}
