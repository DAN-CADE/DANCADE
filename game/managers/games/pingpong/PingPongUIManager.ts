// game/managers/games/pingpong/PingPongUIManager.ts

import { BaseUIManager } from "@/game/managers/base";
import { PINGPONG_CONFIG, PingPongGameResult } from "@/game/types/pingpong";
import { PingPongMenuUIManager } from "./ui/PingPongMenuUIManager";
import { PingPongGameOverUIManager } from "./ui/PingPongGameOverUIManager";

/**
 * 탁구 게임 UI 관리 (통합)
 * - 게임 플레이 UI (스코어보드, 상태 텍스트, 랠리 카운터)
 * - 메뉴 UI는 PingPongMenuUIManager에 위임
 * - 게임 오버 UI는 PingPongGameOverUIManager에 위임
 */
export class PingPongUIManager extends BaseUIManager {
  // 서브 매니저
  private menuUI: PingPongMenuUIManager;
  private gameOverUI: PingPongGameOverUIManager;

  // 게임 플레이 UI 요소
  private scoreBar?: Phaser.GameObjects.Graphics;
  private playerScoreText?: Phaser.GameObjects.Text;
  private aiScoreText?: Phaser.GameObjects.Text;
  private gameStatusText?: Phaser.GameObjects.Text;
  private rallyText?: Phaser.GameObjects.Text;

  // 상태 메시지 로테이션
  private readonly STATUS_MESSAGES: string[] = [
    "11점을 먼저 따는 사람이 승리!",
    "2점 차이로 이기면 승리!",
    "최대한 빠르게 쳐보세요!",
    "↑↓: 이동 | SPACE: 서브",
  ];
  private currentStatusIndex: number = 0;
  private statusTimer?: Phaser.Time.TimerEvent;

  private readonly TEXT_STYLE = {
    SCORE_LABEL: {
      fontFamily: '"Press Start 2P"',
      fontSize: "10px",
    },
    SCORE_VALUE: {
      fontFamily: '"Press Start 2P"',
      fontSize: "24px",
    },
    STATUS: {
      fontFamily: '"Noto Sans KR", "Malgun Gothic", "맑은 고딕", Arial, sans-serif',
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold",
    },
    RALLY: {
      fontFamily: '"Press Start 2P"',
      fontSize: "20px",
      color: "#ffffff",
    },
  };

  constructor(scene: Phaser.Scene) {
    super(scene);
    this.menuUI = new PingPongMenuUIManager(scene);
    this.gameOverUI = new PingPongGameOverUIManager(scene);
  }

  // =====================================================================
  // 게임 플레이 UI
  // =====================================================================

  createGameUI(): void {
    this.createScoreBoard();
    this.createScoreTexts();
    this.createRallyCounter();
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

    // Player Label
    const playerLabel = this.scene.add
      .text(centerX - 80, 35, "PLAYER", {
        ...this.TEXT_STYLE.SCORE_LABEL,
        color: "#00ff88",
      })
      .setOrigin(0.5);
    playerLabel.setStroke("#00aa55", 2);

    // AI Label
    const aiLabel = this.scene.add
      .text(centerX + 80, 35, "COMPUTER", {
        ...this.TEXT_STYLE.SCORE_LABEL,
        color: "#ff8844",
      })
      .setOrigin(0.5);
    aiLabel.setStroke("#cc4400", 2);

    // Score texts
    this.playerScoreText = this.createScoreText(centerX - 80, 55, "#00ffdd", "#00aa99");
    this.aiScoreText = this.createScoreText(centerX + 80, 55, "#ffaa44", "#cc6600");
  }

  private createScoreText(
    x: number,
    y: number,
    color: string,
    strokeColor: string
  ): Phaser.GameObjects.Text {
    const text = this.scene.add
      .text(x, y, "0", { ...this.TEXT_STYLE.SCORE_VALUE, color })
      .setOrigin(0.5);
    text.setStroke(strokeColor, 3);
    text.setShadow(0, 0, color, 8);
    return text;
  }

  private createRallyCounter(): void {
    const centerX = PINGPONG_CONFIG.GAME_WIDTH / 2;
    const y = 120;

    this.rallyText = this.scene.add
      .text(centerX, y, "Rally: 0", { ...this.TEXT_STYLE.RALLY, color: "#ffd700" })
      .setOrigin(0.5)
      .setAlpha(0.9);

    this.rallyText.setStroke("#996600", 3);
    this.rallyText.setShadow(0, 0, "#ffd700", 5);
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
      .text(centerX, y, this.STATUS_MESSAGES[0], this.TEXT_STYLE.STATUS)
      .setOrigin(0.5);
  }

  // =====================================================================
  // UI 업데이트
  // =====================================================================

  updateScore(playerScore: number, aiScore: number): void {
    this.playerScoreText?.setText(playerScore.toString());
    this.aiScoreText?.setText(aiScore.toString());
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
      this.rallyText.setColor("#ff1493");
      this.scene.time.delayedCall(500, () => {
        this.rallyText?.setColor("#ffd700");
      });
    }
  }

  updateStatusText(message: string): void {
    this.gameStatusText?.setText(message);
  }

  private startStatusTextRotation(): void {
    this.statusTimer = this.scene.time.addEvent({
      delay: 3000,
      callback: () => {
        this.currentStatusIndex = (this.currentStatusIndex + 1) % this.STATUS_MESSAGES.length;
        this.gameStatusText?.setText(this.STATUS_MESSAGES[this.currentStatusIndex]);
      },
      loop: true,
    });
  }

  stopStatusTextRotation(): void {
    this.statusTimer?.remove();
  }

  // =====================================================================
  // UI 가시성
  // =====================================================================

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

  // =====================================================================
  // 메뉴 UI (위임)
  // =====================================================================

  showModeSelection(onModeSelect: (mode: number) => void): void {
    this.hideGameUI();
    this.menuUI.showModeSelection(onModeSelect);
  }

  showColorSelection(currentColorIndex: number, onConfirm?: () => void): void {
    this.menuUI.showColorSelection(currentColorIndex, onConfirm);
  }

  updateColorPreview(selectedIndex: number): void {
    this.menuUI.updateColorPreview(selectedIndex);
  }

  // =====================================================================
  // 게임 오버 UI (위임)
  // =====================================================================

  showGameOverScreen(
    isPlayerWin: boolean,
    playerScore: number,
    aiScore: number,
    onRestart: () => void,
    onHome: () => void,
    gameResult?: PingPongGameResult
  ): void {
    this.gameOverUI.showGameOverScreen(
      isPlayerWin,
      playerScore,
      aiScore,
      onRestart,
      onHome,
      gameResult
    );
  }

  // =====================================================================
  // 정리
  // =====================================================================

  cleanup(): void {
    this.stopStatusTextRotation();
    this.menuUI.cleanup();
    this.gameOverUI.cleanup();
    this.rallyText = undefined;
  }
}
