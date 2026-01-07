// game/managers/games/brickbreaker/BrickBreakerUIManager.ts

import { BaseUIManager } from "@/game/managers/base";
import { GameResult } from "./BrickBreakerGameManager";
import { TEXT_STYLE } from "@/game/types/common/ui.constants";

/**
 * 벽돌깨기 UI 관리
 */
export class BrickBreakerUIManager extends BaseUIManager {
  // ✅ 추가: 게임 크기 상수
  private readonly GAME_WIDTH = 800;
  private readonly GAME_HEIGHT = 600;

  private scoreText?: Phaser.GameObjects.Text;
  private livesText?: Phaser.GameObjects.Text;
  private lifeIcons: Phaser.GameObjects.Text[] = []; // ✅ 추가: 하트 아이콘
  private pauseButton?: Phaser.GameObjects.Text;
  private pauseOverlay?: Phaser.GameObjects.Rectangle;
  private pauseText?: Phaser.GameObjects.Text;
  private pauseHelpTexts: Phaser.GameObjects.Text[] = []; // ✅ 추가
  private isPauseScreenShown: boolean = false;
  private onPauseToggle?: () => void;

  setPauseToggleCallback(callback: () => void): void {
    this.onPauseToggle = callback;
  }

  createGameUI(): void {
    this.createScoreText();
    this.createLivesDisplay();
    this.createPauseButton();
  }

  private createScoreText(): void {
    this.scoreText = this.scene.add.text(16, 16, "SCORE: 0", {
      fontFamily: '"Press Start 2P"',
      fontSize: "24px",
      color: "#f1c40f",
      stroke: "#000000",
      strokeThickness: 4,
    });
  }

  private createLivesDisplay(): void {
    const startX = this.GAME_WIDTH - 200;
    const startY = 20;

    // "LIVES:" 텍스트
    this.livesText = this.scene.add.text(startX, startY, "LIVES:", {
      fontFamily: '"Press Start 2P"',
      fontSize: "16px",
      color: "#f1c40f",
      stroke: "#000000",
      strokeThickness: 3,
    });

    // 하트 아이콘 3개
    this.lifeIcons = [];
    for (let i = 0; i < 3; i++) {
      const heart = this.scene.add.text(startX + 90 + i * 35, startY, "♥", {
        fontSize: "24px",
        color: "#e74c3c",
      });
      this.lifeIcons.push(heart);
    }
  }

  updateScore(score: number): void {
    this.scoreText?.setText(`SCORE: ${score}`);
  }

  updateLives(lives: number): void {
    // 하트 아이콘 업데이트
    this.lifeIcons?.forEach((icon, index) => {
      icon.setAlpha(index < lives ? 1 : 0.3);
    });
  }

  private createPauseButton(): void {
    this.pauseButton = this.scene.add
      .text(this.GAME_WIDTH - 20, this.GAME_HEIGHT - 20, "⏸", {
        // ✅ 수정
        fontFamily: "Arial",
        fontSize: "36px",
        color: "#ffffff",
        backgroundColor: "#333333",
        padding: { x: 10, y: 8 },
      })
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(5);

    // 호버 효과
    this.pauseButton.on("pointerover", () => {
      this.pauseButton?.setStyle({ backgroundColor: "#555555" });
    });

    this.pauseButton.on("pointerout", () => {
      this.pauseButton?.setStyle({ backgroundColor: "#333333" });
    });

    this.pauseButton.on("pointerdown", () => {
      this.onPauseToggle?.();
    });
  }

  togglePauseScreen(isPaused?: boolean): void {
    if (isPaused !== undefined) {
      if (isPaused && !this.isPauseScreenShown) {
        this.showPauseScreen();
        this.pauseButton?.setText("▶"); // ✅ 추가
      } else if (!isPaused && this.isPauseScreenShown) {
        this.hidePauseScreen();
        this.pauseButton?.setText("⏸"); // ✅ 추가
      }
    } else {
      if (this.isPauseScreenShown) {
        this.hidePauseScreen();
        this.pauseButton?.setText("⏸");
      } else {
        this.showPauseScreen();
        this.pauseButton?.setText("▶");
      }
    }
  }

  private showPauseScreen(): void {
    this.pauseOverlay = this.scene.add.rectangle(
      this.GAME_WIDTH / 2, // ✅ 수정
      this.GAME_HEIGHT / 2, // ✅ 수정
      this.GAME_WIDTH, // ✅ 수정
      this.GAME_HEIGHT, // ✅ 수정
      0x000000,
      0.75
    );
    this.pauseOverlay.setDepth(10);

    this.pauseText = this.scene.add
      .text(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2 - 80, "PAUSED", {
        // ✅ 수정
        fontFamily: '"Press Start 2P"',
        fontSize: "64px",
        color: "#f1c40f",
        align: "center",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(11);

    // ✅ 수정: 참조 저장
    const helpText1 = this.scene.add
      .text(
        this.GAME_WIDTH / 2,
        this.GAME_HEIGHT / 2 + 30,
        "Press ESC to Resume",
        {
          fontFamily: "Arial",
          fontSize: "18px",
          color: "#ffffff",
          align: "center",
        }
      )
      .setOrigin(0.5, 0.5)
      .setDepth(11);

    const helpText2 = this.scene.add
      .text(
        this.GAME_WIDTH / 2,
        this.GAME_HEIGHT / 2 + 65,
        "or click pause button",
        {
          fontFamily: "Arial",
          fontSize: "16px",
          color: "#bdc3c7",
          align: "center",
        }
      )
      .setOrigin(0.5, 0.5)
      .setDepth(11);

    this.pauseHelpTexts = [helpText1, helpText2]; // ✅ 추가

    this.isPauseScreenShown = true;
  }

  private hidePauseScreen(): void {
    this.pauseOverlay?.destroy();
    this.pauseText?.destroy();

    // ✅ 추가: 도움말 텍스트 제거
    this.pauseHelpTexts.forEach((text) => text.destroy());
    this.pauseHelpTexts = [];

    this.isPauseScreenShown = false;
  }

  showEndGameScreen(
    result: GameResult,
    score: number,
    onRestart: () => void,
    onHome: () => void
  ): void {
    const depth = 10;
    const config = this.getEndGameConfig(result);

    this.createOverlay(config.overlayAlpha, depth);

    const mainText = this.scene.add
      .text(400, 200, config.mainText, {
        ...TEXT_STYLE.GAME_OVER,
        color: config.mainColor,
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);

    this.scene.tweens.add({
      targets: mainText,
      ...config.animation,
      yoyo: true,
      repeat: -1,
    });

    this.createScoreDisplay(score, depth);
    this.createRestartButton(onRestart, 400, 400, depth + 1);
    this.createHomeButton(onHome, 400, 480, depth + 1);
  }

  private getEndGameConfig(result: GameResult) {
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

    return configs[result];
  }

  private createScoreDisplay(score: number, depth: number): void {
    this.scene.add
      .text(400, 280, "SCORE", {
        fontFamily: '"Press Start 2P"',
        fontSize: "14px",
        color: "#95a5a6",
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);

    this.scene.add
      .text(400, 320, `${score}`, {
        fontFamily: '"Press Start 2P"',
        fontSize: "32px",
        color: "#f1c40f",
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);
  }

  cleanup(): void {
    // ✅ 추가: 일시정지 화면도 정리
    this.hidePauseScreen();
    // ✅ 추가: 하트 아이콘 정리
    this.lifeIcons.forEach((icon) => icon.destroy());
    this.lifeIcons = [];
  }
}
