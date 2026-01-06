// game/managers/games/pingpong/PingPongUIManager.ts

import { BaseUIManager } from "@/game/managers/base";
import { TEXT_STYLE } from "@/game/types/common/ui.constants";
import { PINGPONG_CONFIG, PingPongGameResult } from "@/game/types/pingpong";

/**
 * 탁구 게임 UI 관리
 */
export class PingPongUIManager extends BaseUIManager {
  private scoreBar?: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Graphics;
  private playerScoreText?: Phaser.GameObjects.Text;
  private aiScoreText?: Phaser.GameObjects.Text;
  private gameStatusText?: Phaser.GameObjects.Text;
  private rallyText?: Phaser.GameObjects.Text;

  private readonly STATUS_MESSAGES: string[] = [
    "11점을 먼저 따는 사람이 승리!",
    "2점 차이로 이기면 승리!",
    "최대한 빠르게 쳐보세요!",
    "↑↓: 이동 | SPACE: 서브",
  ];
  private currentStatusIndex: number = 0;
  private statusTimer?: Phaser.Time.TimerEvent;
  private playerPaddleColorIndex: number = 0;

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
    RALLY: {
      fontFamily: '"Press Start 2P"',
      fontSize: "20px",
      color: "#ffffff",
    },
  };

  createGameUI(): void {
    this.createScoreBoard();
    this.createScoreTexts();
    this.createRallyCounter();
    this.createStatusText();
    this.startStatusTextRotation();
  }

  private createRallyCounter(): void {
    const centerX = PINGPONG_CONFIG.GAME_WIDTH / 2;
    const y = 120;

    this.rallyText = this.scene.add
      .text(centerX, y, "Rally: 0", {
        ...this.PINGPONG_TEXT_STYLE.RALLY,
        color: "#ffd700", // 골드
      })
      .setOrigin(0.5)
      .setAlpha(0.9);

    this.rallyText.setStroke("#996600", 3);
    this.rallyText.setShadow(0, 0, "#ffd700", 5);
  }

  updateRally(count: number): void {
    if (!this.rallyText) return;

    this.rallyText.setText(`Rally: ${count}`);

    // 펄스 애니메이션
    this.scene.tweens.add({
      targets: this.rallyText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: "Back.easeOut",
    });

    // 5의 배수마다 색상 변경
    if (count % 5 === 0 && count > 0) {
      this.rallyText.setColor("#ff1493"); // 핫핑크
      this.scene.time.delayedCall(500, () => {
        this.rallyText?.setColor("#ffd700"); // 골드로 복귀
      });
    }
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
    this.rallyText?.setVisible(true);
  }

  hideGameUI(): void {
    this.playerScoreText?.setVisible(false);
    this.aiScoreText?.setVisible(false);
    this.gameStatusText?.setVisible(false);
    this.scoreBar?.setVisible(false);
    this.rallyText?.setVisible(false);
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

  showModeSelection(onModeSelect: (mode: number) => void): void {
    this.hideGameUI();

    const centerX = PINGPONG_CONFIG.GAME_WIDTH / 2;

    // 배경 추가
    this.createBackgroundOverlay();

    this.scene.add
      .text(centerX, 60, "PING PONG", this.PINGPONG_TEXT_STYLE.TITLE)
      .setOrigin(0.5);

    this.scene.add
      .text(
        centerX,
        130,
        "게임 모드를 선택하세요",
        this.PINGPONG_TEXT_STYLE.SUBTITLE
      )
      .setOrigin(0.5);

    const modes = [
      { label: "SINGLE (VS AI)", value: 1, color: 0x3498db },
      { label: "ONLINE (MULTI)", value: 3, color: 0xe74c3c },
      { label: "EXIT", value: 0, color: 0x95a5a6 },
    ];

    const buttonWidth = 300;
    const buttonHeight = 50;
    const buttonSpacing = 70;
    const startY = 280;

    modes.forEach((mode, index) => {
      const y = startY + index * buttonSpacing;
      this.createButton(
        centerX,
        y,
        buttonWidth,
        buttonHeight,
        mode.label,
        mode.color,
        () => {
          onModeSelect(mode.value);
        }
      );
    });
  }

  private createBackgroundOverlay(): void {
    const width = PINGPONG_CONFIG.GAME_WIDTH;
    const height = PINGPONG_CONFIG.GAME_HEIGHT;

    const bg = this.scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x1a1a1a,
      0.95
    );
    bg.setDepth(-1);
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: number,
    onClick: () => void
  ): void {
    // 버튼 배경
    const button = this.scene.add.rectangle(x, y, width, height, color, 0.85);
    button.setInteractive({ useHandCursor: true });
    button.setDepth(1);

    // 버튼 테두리
    const graphics = this.scene.add.graphics({
      x: x - width / 2,
      y: y - height / 2,
    });
    graphics.lineStyle(2, 0xffffff, 0.9);
    graphics.strokeRect(0, 0, width, height);
    graphics.setDepth(1);

    // 버튼 텍스트
    this.scene.add
      .text(x, y, label, {
        fontFamily:
          '"Press Start 2P", "Malgun Gothic", "맑은 고딕", sans-serif',
        fontSize: "16px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(2);

    // 호버 시 테두리 색상만 변경
    button.on("pointerover", () => {
      graphics.clear();
      graphics.lineStyle(2, 0xffff00, 0.9);
      graphics.strokeRect(0, 0, width, height);
    });

    button.on("pointerout", () => {
      graphics.clear();
      graphics.lineStyle(2, 0xffffff, 0.9);
      graphics.strokeRect(0, 0, width, height);
    });

    button.on("pointerdown", () => {
      onClick();
    });
  }

  showColorSelection(currentColorIndex: number, onConfirm?: () => void): void {
    const centerX = PINGPONG_CONFIG.GAME_WIDTH / 2;

    // 배경 추가
    this.createBackgroundOverlay();

    this.scene.add
      .text(centerX, 60, "PING PONG", this.PINGPONG_TEXT_STYLE.TITLE)
      .setOrigin(0.5);

    this.scene.add
      .text(
        centerX,
        140,
        "플레이어 색상을 선택하세요",
        this.PINGPONG_TEXT_STYLE.SUBTITLE
      )
      .setOrigin(0.5);

    this.createColorOptions(currentColorIndex, (index) => {
      this.playerPaddleColorIndex = index;
      this.updateColorPreview(index);
    });

    this.updateColorPreview(currentColorIndex);

    this.scene.add
      .text(centerX, 430, "마우스로 색상을 클릭하세요", {
        fontSize: "16px",
        color: "#ffff88",
        fontFamily:
          '"Noto Sans KR", "Malgun Gothic", "맑은 고딕", Arial, sans-serif',
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // 확인 버튼
    this.createButton(centerX, 500, 200, 50, "START", 0x2ecc71, () => {
      onConfirm?.();
    });
  }

  private createColorOptions(
    currentColorIndex: number,
    onSelect?: (index: number) => void
  ): void {
    const positions = [250, 550];
    this.colorPreviewPaddles = [];

    positions.forEach((x, index) => {
      const paddleColor = PINGPONG_CONFIG.PADDLE_COLORS[index];
      const paddle = this.scene.add.image(x, 280, "pingpong_player");
      paddle.setScale(0.8);
      paddle.setTint(paddleColor.color);
      paddle.setInteractive({ useHandCursor: true });
      paddle.setDepth(1);

      // 색상 선택 클릭
      paddle.on("pointerdown", () => {
        onSelect?.(index);
      });

      // Hover 효과
      paddle.on("pointerover", () => {
        paddle.setScale(0.95);
      });

      paddle.on("pointerout", () => {
        paddle.setScale(0.8);
      });

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
    onRestart: () => void,
    onHome: () => void,
    gameResult?: PingPongGameResult
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

    if (gameResult) {
      this.createGameStats(gameResult, depth);
    }

    this.createRestartButton(onRestart, 400, 440, depth + 1);

    this.createHomeButton(onHome, 400, 520, depth + 1);
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

  private createGameStats(result: PingPongGameResult, depth: number): void {
    const stats = [
      `Rallies: ${result.totalRallies}`,
      `Longest: ${result.longestRally}`,
      `Perfect: ${result.perfectHits}`,
      `Time: ${result.elapsedTime}s`,
    ];

    const startY = 380;
    this.scene.add
      .text(400, startY, stats.join("  |  "), {
        fontFamily: '"Press Start 2P"',
        fontSize: "10px",
        color: "#95a5a6",
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);
  }

  cleanup(): void {
    this.stopStatusTextRotation();
    this.colorPreviewPaddles = [];
    this.rallyText = undefined;
  }
}
