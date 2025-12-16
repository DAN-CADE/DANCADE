// game/scenes/core/StartScene.ts

import { BaseScene } from "@/game/scenes/base";
import { GameConfig } from "@/game/config/gameRegistry";
import { ASSET_PATHS } from "@/game/constants";

export class StartScene extends BaseScene {
  // ✅ BaseScene 상속
  private startButton?: Phaser.GameObjects.Image;
  private gameConfig?: GameConfig;

  constructor() {
    super({ key: "StartScene" });
  }

  init(data: { gameConfig?: GameConfig }) {
    this.gameConfig = data.gameConfig;
  }

  preload() {
    const basePath = ASSET_PATHS.GAME.KENNEY_PUZZLE;

    this.load.image("game_background", "/assets/background/bg 1.png");

    this.load.image("ball", `${basePath}ballBlue.png`);
    this.load.image("paddle", `${basePath}paddleBlu.png`);
    this.load.image("buttonDefault", `${basePath}buttonDefault.png`);
    this.load.image("buttonSelected", `${basePath}buttonSelected.png`);

    this.load.image("brick_red", `${basePath}element_red_rectangle_glossy.png`);
    this.load.image(
      "brick_yellow",
      `${basePath}element_yellow_rectangle_glossy.png`
    );
    this.load.image(
      "brick_green",
      `${basePath}element_green_rectangle_glossy.png`
    );
    this.load.image(
      "brick_blue",
      `${basePath}element_blue_rectangle_glossy.png`
    );
    this.load.image(
      "brick_purple",
      `${basePath}element_purple_rectangle_glossy.png`
    );
  }

  create() {
    this.scale.resize(800, 600);

    const background = this.add.image(400, 300, "game_background");
    background.setDisplaySize(800, 600);
    background.setDepth(-1);

    this.cameras.main.setBackgroundColor("#000000");

    this.createTitle();
    this.createPreview();
    this.createStartButton();
    this.createInstructions();
  }

  private createTitle(): void {
    const titleStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: "32px",
      color: "#ffffff",
    };

    const subtitleStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: "12px",
      color: "#aaaaaa",
    };

    const descriptionStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: "14px",
      color: "#00ff88",
    };

    const gameName = this.gameConfig?.name.toUpperCase() || "BRICK BREAKER";
    this.add.text(400, 80, gameName, titleStyle).setOrigin(0.5);
    this.add.text(400, 130, "ARCADE GAME", subtitleStyle).setOrigin(0.5);

    if (this.gameConfig?.description) {
      this.add
        .text(400, 160, this.gameConfig.description, descriptionStyle)
        .setOrigin(0.5);
    }
  }

  private createPreview(): void {
    const brickColors = [
      "brick_red",
      "brick_yellow",
      "brick_green",
      "brick_blue",
      "brick_purple",
    ];
    const brickWidth = 64;
    const brickSpacing = 4;
    const cols = 5;
    const totalWidth = cols * brickWidth + (cols - 1) * brickSpacing;
    const startX = (800 - totalWidth) / 2 + brickWidth / 2;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * (brickWidth + brickSpacing);
        const y = 210 + row * 30;
        this.add.image(x, y, brickColors[col]);
      }
    }

    this.add.image(400, 360, "paddle").setScale(1.2);

    const ball = this.add.image(400, 320, "ball");
    this.tweens.add({
      targets: ball,
      y: 340,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createStartButton(): void {
    const buttonStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: "16px",
      color: "#333333",
    };

    this.startButton = this.add
      .image(400, 450, "buttonDefault")
      .setScale(2)
      .setInteractive({ useHandCursor: true });

    this.add.text(400, 450, "START", buttonStyle).setOrigin(0.5);

    this.startButton.on("pointerover", () => {
      this.startButton?.setTexture("buttonSelected");
      this.startButton?.setScale(2.1);
    });

    this.startButton.on("pointerout", () => {
      this.startButton?.setTexture("buttonDefault");
      this.startButton?.setScale(2);
    });

    this.startButton.on("pointerdown", () => {
      this.startGame();
    });

    this.input.keyboard?.once("keydown-SPACE", () => {
      this.startGame();
    });
  }

  private createInstructions(): void {
    const infoStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: "10px",
      color: "#888888",
    };

    this.add.text(400, 520, "◀︎  ▶︎ USE ARROW KEYS", infoStyle).setOrigin(0.5);

    this.add
      .text(400, 550, "PRESS SPACE TO START", {
        fontFamily: '"Press Start 2P"',
        fontSize: "8px",
        color: "#666666",
      })
      .setOrigin(0.5);
  }

  private startGame(): void {
    const sceneKey = this.gameConfig?.sceneKey || "BrickBreakerScene";

    // ✅ BaseScene의 transitionTo 활용 가능 (선택)
    // this.transitionTo(sceneKey, { gameConfig: this.gameConfig });

    // 기존 방식 유지
    if (sceneKey === "StartScene") {
      this.scene.start("BrickBreakerScene", {
        gameConfig: this.gameConfig,
      });
    } else {
      this.scene.start(sceneKey, {
        gameConfig: this.gameConfig,
      });
    }
  }
}
