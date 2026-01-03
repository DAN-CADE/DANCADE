// game/managers/games/pingpong/PingPongUIManager.ts

import { BaseUIManager } from "@/game/managers/base";
import { TEXT_STYLE } from "@/game/types/common/ui.constants";
import { PINGPONG_CONFIG } from "@/game/types/realPingPong";

/**
 * 탁구 게임 UI 관리
 */
export class PingPongUIManager extends BaseUIManager {
  private scoreBar?: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Graphics;
  private playerScoreText?: Phaser.GameObjects.Text;
  private aiScoreText?: Phaser.GameObjects.Text;
  private gameStatusText?: Phaser.GameObjects.Text;

  private readonly STATUS_MESSAGES: string[] = [
    "11점을 먼저 따는 사람이 승리!",
    "2점 차이로 이기면 승리!",
    "최대한 빠르게 쳐보세요!",
    "↑↓: 이동 | SPACE: 서브",
  ];
  private currentStatusIndex: number = 0;
  private statusTimer?: Phaser.Time.TimerEvent;

  private colorPreviewPaddles: Phaser.GameObjects.Image[] = [];

  private readonly PINGPONG_TEXT_STYLE = {
    TITLE: {
      fontFamily: '"Press Start 2P", "Malgun Gothic", "맑은 고딕", sans-serif',
      fontSize: "48px",
      color: "#ffffff",
    },
    SUBTITLE: {
      fontFamily:
        '"Noto Sans KR", "Malgun Gothic", "맑은 고딕", Arial, sans-serif',
      fontSize: "28px",
      color: "#ffffff",
      fontStyle: "bold",
    },
    SCORE_LABEL: {
      fontFamily: '"Press Start 2P"',
      fontSize: "10px",
    },
    SCORE_VALUE: {
      fontFamily: '"Press Start 2P"',
      fontSize: "24px",
    },
    STATUS: {
      fontFamily:
        '"Noto Sans KR", "Malgun Gothic", "맑은 고딕", Arial, sans-serif',
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold",
    },
    BLINK: {
      fontFamily: '"Press Start 2P"',
      fontSize: "16px",
      color: "#ffff00",
    },
    FINAL_SCORE: {
      fontFamily: '"Press Start 2P"',
      fontSize: "32px",
      color: "#ffffff",
    },
  };

  createGameUI(): void {
    this.createScoreBoard();
    this.createScoreTexts();
    this.createStatusText();
    this.startStatusTextRotation();
  }

  private createScoreBoard(): void {
    const scoreBarBg = this.scene.add.graphics();
    const width = PINGPONG_CONFIG.GAME_WIDTH * 0.8;
    const x = PINGPONG_CONFIG.GAME_WIDTH / 2 - width / 2;

    scoreBarBg.fillStyle(0x1a1a1a, 0.9);
    scoreBarBg.fillRoundedRect(x, 20, width, 60, 10);

    scoreBarBg.lineStyle(2, 0x00ffaa, 0.8);
    scoreBarBg.strokeRoundedRect(x, 20, width, 60, 10);

    scoreBarBg.lineStyle(1, 0x00ff88, 0.3);
    scoreBarBg.strokeRoundedRect(x + 4, 24, width - 8, 52, 8);

    this.scoreBar = scoreBarBg;
  }

  private createScoreTexts(): void {
    const centerX = PINGPONG_CONFIG.GAME_WIDTH / 2;

    const playerLabel = this.scene.add
      .text(centerX - 80, 35, "PLAYER", {
        ...this.PINGPONG_TEXT_STYLE.SCORE_LABEL,
        color: "#00ff88",
      })
      .setOrigin(0.5);
    playerLabel.setStroke("#00aa55", 2);

    const aiLabel = this.scene.add
      .text(centerX + 80, 35, "COMPUTER", {
        ...this.PINGPONG_TEXT_STYLE.SCORE_LABEL,
        color: "#ff8844",
      })
      .setOrigin(0.5);
    aiLabel.setStroke("#cc4400", 2);

    this.playerScoreText = this.createScoreText(
      centerX - 80,
      55,
      "#00ffdd",
      "#00aa99"
    );
    this.aiScoreText = this.createScoreText(
      centerX + 80,
      55,
      "#ffaa44",
      "#cc6600"
    );
  }

  private createScoreText(
    x: number,
    y: number,
    color: string,
    strokeColor: string
  ): Phaser.GameObjects.Text {
    const text = this.scene.add
      .text(x, y, "0", {
        ...this.PINGPONG_TEXT_STYLE.SCORE_VALUE,
        color,
      })
      .setOrigin(0.5);
    text.setStroke(strokeColor, 3);
    text.setShadow(0, 0, color, 8);
    return text;
  }

  private createStatusText(): void {
    const centerX = PINGPONG_CONFIG.GAME_WIDTH / 2;
    const y = PINGPONG_CONFIG.GAME_HEIGHT - PINGPONG_CONFIG.STATUS_Y_OFFSET;

    const statusBg = this.scene.add.graphics();
    statusBg.fillStyle(0x000000, 0.8);
    statusBg.fillRoundedRect(centerX - 280, y - 18, 560, 36, 8);
    statusBg.lineStyle(1, 0x00ffaa, 0.6);
    statusBg.strokeRoundedRect(centerX - 280, y - 18, 560, 36, 8);
    statusBg.setDepth(-1);

    this.gameStatusText = this.scene.add
      .text(
        centerX,
        y,
        this.STATUS_MESSAGES[0],
        this.PINGPONG_TEXT_STYLE.STATUS
      )
      .setOrigin(0.5);
  }

  updateScore(playerScore: number, aiScore: number): void {
    this.playerScoreText?.setText(playerScore.toString());
    this.aiScoreText?.setText(aiScore.toString());
  }

  updateStatusText(message: string): void {
    this.gameStatusText?.setText(message);
  }

  private startStatusTextRotation(): void {
    this.statusTimer = this.scene.time.addEvent({
      delay: 3000,
      callback: () => {
        this.currentStatusIndex =
          (this.currentStatusIndex + 1) % this.STATUS_MESSAGES.length;
        this.gameStatusText?.setText(
          this.STATUS_MESSAGES[this.currentStatusIndex]
        );
      },
      loop: true,
    });
  }

  stopStatusTextRotation(): void {
    this.statusTimer?.remove();
  }

  showGameUI(): void {
    this.playerScoreText?.setVisible(true);
    this.aiScoreText?.setVisible(true);
    this.gameStatusText?.setVisible(true);
    this.scoreBar?.setVisible(true);
  }

  hideGameUI(): void {
    this.playerScoreText?.setVisible(false);
    this.aiScoreText?.setVisible(false);
    this.gameStatusText?.setVisible(false);
    this.scoreBar?.setVisible(false);
  }

  showStartMenu(): void {
    this.hideGameUI();

    const centerX = PINGPONG_CONFIG.GAME_WIDTH / 2;

    this.scene.add
      .text(centerX, 150, "PING PONG", this.PINGPONG_TEXT_STYLE.TITLE)
      .setOrigin(0.5);

    const startText = this.scene.add
      .text(
        centerX,
        380,
        "PRESS SPACE TO START",
        this.PINGPONG_TEXT_STYLE.BLINK
      )
      .setOrigin(0.5);

    this.scene.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  showColorSelection(currentColorIndex: number): void {
    const centerX = PINGPONG_CONFIG.GAME_WIDTH / 2;

    this.scene.add
      .text(
        centerX,
        150,
        "플레이어를 선택하세요",
        this.PINGPONG_TEXT_STYLE.SUBTITLE
      )
      .setOrigin(0.5);

    this.createColorOptions();
    this.updateColorPreview(currentColorIndex);

    this.scene.add
      .text(centerX, 450, "← → 키로 선택, SPACE로 확인", {
        fontSize: "18px",
        color: "#ffffff",
        fontFamily:
          '"Noto Sans KR", "Malgun Gothic", "맑은 고딕", Arial, sans-serif',
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  }

  private createColorOptions(): void {
    const positions = [250, 550];
    this.colorPreviewPaddles = [];

    positions.forEach((x, index) => {
      const paddle = this.scene.add.image(x, 300, "pingpong_player");
      paddle.setScale(0.8);
      paddle.setTint(PINGPONG_CONFIG.PADDLE_COLORS[index].color);
      this.colorPreviewPaddles.push(paddle);
    });
  }

  updateColorPreview(selectedIndex: number): void {
    this.colorPreviewPaddles.forEach((paddle, index) => {
      const isSelected = index === selectedIndex;
      paddle.setScale(isSelected ? 1.2 : 0.8);
      paddle.setAlpha(isSelected ? 1.0 : 0.5);
    });
  }

  showGameOverScreen(
    isPlayerWin: boolean,
    playerScore: number,
    aiScore: number,
    onRestart: () => void
  ): void {
    const depth = 10;
    const winner = isPlayerWin ? "YOU WIN!" : "GAME OVER";

    this.createOverlay(0.7, depth);

    const resultText = this.scene.add
      .text(400, 200, winner, {
        ...TEXT_STYLE.GAME_OVER,
        color: isPlayerWin ? "#2ecc71" : "#e74c3c",
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);

    this.scene.tweens.add({
      targets: resultText,
      ...(isPlayerWin
        ? { scale: 1.1, duration: 300 }
        : { alpha: 0.3, duration: 500 }),
      yoyo: true,
      repeat: -1,
    });

    this.createFinalScoreDisplay(playerScore, aiScore, depth);

    this.createRestartButton(onRestart, 400, 440, depth + 1);

    this.createHomeButton(() => {}, 400, 520, depth + 1);
  }

  private createFinalScoreDisplay(
    playerScore: number,
    aiScore: number,
    depth: number
  ): void {
    this.scene.add
      .text(400, 280, "PLAYER", {
        fontFamily: '"Press Start 2P"',
        fontSize: "14px",
        color: "#95a5a6",
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);

    this.scene.add
      .text(
        400,
        320,
        `${playerScore} - ${aiScore}`,
        this.PINGPONG_TEXT_STYLE.FINAL_SCORE
      )
      .setOrigin(0.5)
      .setDepth(depth + 1);

    this.scene.add
      .text(400, 360, "COMPUTER", {
        fontFamily: '"Press Start 2P"',
        fontSize: "14px",
        color: "#95a5a6",
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);
  }

  cleanup(): void {
    this.stopStatusTextRotation();
    this.colorPreviewPaddles = [];
  }
}
