// game/managers/pingpong/PingPongUIManager.ts
import { PINGPONG_CONFIG } from "@/game/types/realPingPong";

type GameMode = "menu" | "colorSelect" | "playing";

/**
 * 탁구 게임 UI 관리
 * - 점수판, 텍스트, 버튼 생성
 * - 메뉴 화면, 색상 선택 화면
 * - 게임 오버 화면
 */
export class PingPongUIManager {
  private scene: Phaser.Scene;

  // UI 요소
  private scoreBar?: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Graphics;
  private playerScoreText?: Phaser.GameObjects.Text;
  private aiScoreText?: Phaser.GameObjects.Text;
  private gameStatusText?: Phaser.GameObjects.Text;

  // 상태 메시지
  private readonly STATUS_MESSAGES: string[] = [
    "11점을 먼저 따는 사람이 승리!",
    "2점 차이로 이기면 승리!",
    "최대한 빠르게 쳐보세요!",
    "↑↓: 이동 | SPACE: 서브",
  ];
  private currentStatusIndex: number = 0;
  private statusTimer?: Phaser.Time.TimerEvent;

  // 색상 선택
  private colorPreviewPaddles: Phaser.GameObjects.Image[] = [];

  // 텍스트 스타일
  private readonly TEXT_STYLE = {
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
    BUTTON: {
      fontFamily: '"Press Start 2P"',
      fontSize: "14px",
      color: "#333333",
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
    GAME_OVER: {
      fontFamily: '"Press Start 2P"',
      fontSize: "36px",
    },
    FINAL_SCORE: {
      fontFamily: '"Press Start 2P"',
      fontSize: "32px",
      color: "#ffffff",
    },
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 게임 UI 생성 (점수판, 상태 텍스트)
   */
  createGameUI(): void {
    this.createScoreBoard();
    this.createScoreTexts();
    this.createStatusText();
    this.startStatusTextRotation();
  }

  /**
   * 점수판 배경 생성
   */
  private createScoreBoard(): void {
    const scoreBarBg = this.scene.add.graphics();
    const width = PINGPONG_CONFIG.GAME_WIDTH * 0.8;
    const x = PINGPONG_CONFIG.GAME_WIDTH / 2 - width / 2;

    // 배경
    scoreBarBg.fillStyle(0x1a1a1a, 0.9);
    scoreBarBg.fillRoundedRect(x, 20, width, 60, 10);

    // 테두리
    scoreBarBg.lineStyle(2, 0x00ffaa, 0.8);
    scoreBarBg.strokeRoundedRect(x, 20, width, 60, 10);

    // 내부 하이라이트
    scoreBarBg.lineStyle(1, 0x00ff88, 0.3);
    scoreBarBg.strokeRoundedRect(x + 4, 24, width - 8, 52, 8);

    this.scoreBar = scoreBarBg;
  }

  /**
   * 점수 텍스트 생성
   */
  private createScoreTexts(): void {
    const centerX = PINGPONG_CONFIG.GAME_WIDTH / 2;

    // 플레이어 레이블
    const playerLabel = this.scene.add
      .text(centerX - 80, 35, "PLAYER", {
        ...this.TEXT_STYLE.SCORE_LABEL,
        color: "#00ff88",
      })
      .setOrigin(0.5);
    playerLabel.setStroke("#00aa55", 2);

    // AI 레이블
    const aiLabel = this.scene.add
      .text(centerX + 80, 35, "COMPUTER", {
        ...this.TEXT_STYLE.SCORE_LABEL,
        color: "#ff8844",
      })
      .setOrigin(0.5);
    aiLabel.setStroke("#cc4400", 2);

    // 점수 텍스트
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

  /**
   * 개별 점수 텍스트 생성
   */
  private createScoreText(
    x: number,
    y: number,
    color: string,
    strokeColor: string
  ): Phaser.GameObjects.Text {
    const text = this.scene.add
      .text(x, y, "0", {
        ...this.TEXT_STYLE.SCORE_VALUE,
        color,
      })
      .setOrigin(0.5);
    text.setStroke(strokeColor, 3);
    text.setShadow(0, 0, color, 8);
    return text;
  }

  /**
   * 상태 텍스트 생성
   */
  private createStatusText(): void {
    const centerX = PINGPONG_CONFIG.GAME_WIDTH / 2;
    const y = PINGPONG_CONFIG.GAME_HEIGHT - PINGPONG_CONFIG.STATUS_Y_OFFSET;

    // 배경
    const statusBg = this.scene.add.graphics();
    statusBg.fillStyle(0x000000, 0.8);
    statusBg.fillRoundedRect(centerX - 280, y - 18, 560, 36, 8);
    statusBg.lineStyle(1, 0x00ffaa, 0.6);
    statusBg.strokeRoundedRect(centerX - 280, y - 18, 560, 36, 8);
    statusBg.setDepth(-1);

    // 텍스트
    this.gameStatusText = this.scene.add
      .text(centerX, y, this.STATUS_MESSAGES[0], this.TEXT_STYLE.STATUS)
      .setOrigin(0.5);
  }

  /**
   * 점수 업데이트
   */
  updateScore(playerScore: number, aiScore: number): void {
    this.playerScoreText?.setText(playerScore.toString());
    this.aiScoreText?.setText(aiScore.toString());
  }

  /**
   * 상태 텍스트 업데이트
   */
  updateStatusText(message: string): void {
    this.gameStatusText?.setText(message);
  }

  /**
   * 상태 텍스트 순환 시작
   */
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

  /**
   * 상태 텍스트 순환 중지
   */
  stopStatusTextRotation(): void {
    this.statusTimer?.remove();
  }

  /**
   * 게임 UI 표시
   */
  showGameUI(): void {
    this.playerScoreText?.setVisible(true);
    this.aiScoreText?.setVisible(true);
    this.gameStatusText?.setVisible(true);
    this.scoreBar?.setVisible(true);
  }

  /**
   * 게임 UI 숨기기
   */
  hideGameUI(): void {
    this.playerScoreText?.setVisible(false);
    this.aiScoreText?.setVisible(false);
    this.gameStatusText?.setVisible(false);
    this.scoreBar?.setVisible(false);
  }

  /**
   * 시작 메뉴 표시
   */
  showStartMenu(): void {
    this.hideGameUI();

    const centerX = PINGPONG_CONFIG.GAME_WIDTH / 2;

    this.scene.add
      .text(centerX, 150, "PING PONG", this.TEXT_STYLE.TITLE)
      .setOrigin(0.5);

    const startText = this.scene.add
      .text(centerX, 380, "PRESS SPACE TO START", this.TEXT_STYLE.BLINK)
      .setOrigin(0.5);

    this.scene.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * 색상 선택 화면 표시
   */
  showColorSelection(currentColorIndex: number): void {
    const centerX = PINGPONG_CONFIG.GAME_WIDTH / 2;

    this.scene.add
      .text(centerX, 150, "플레이어를 선택하세요", this.TEXT_STYLE.SUBTITLE)
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

  /**
   * 색상 옵션 생성
   */
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

  /**
   * 색상 선택 미리보기 업데이트
   */
  updateColorPreview(selectedIndex: number): void {
    this.colorPreviewPaddles.forEach((paddle, index) => {
      const isSelected = index === selectedIndex;
      paddle.setScale(isSelected ? 1.2 : 0.8);
      paddle.setAlpha(isSelected ? 1.0 : 0.5);
    });
  }

  /**
   * 게임 오버 화면 생성
   */
  showGameOverScreen(
    isPlayerWin: boolean,
    playerScore: number,
    aiScore: number,
    onRestart: () => void
  ): void {
    const depth = 10;
    const winner = isPlayerWin ? "YOU WIN!" : "GAME OVER";

    // 오버레이
    this.scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.7).setDepth(depth);

    // 결과 텍스트
    const resultText = this.scene.add
      .text(400, 200, winner, {
        ...this.TEXT_STYLE.GAME_OVER,
        color: isPlayerWin ? "#2ecc71" : "#e74c3c",
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);

    // 애니메이션
    this.scene.tweens.add({
      targets: resultText,
      ...(isPlayerWin
        ? { scale: 1.1, duration: 300 }
        : { alpha: 0.3, duration: 500 }),
      yoyo: true,
      repeat: -1,
    });

    // 최종 점수 표시
    this.createFinalScoreDisplay(playerScore, aiScore, depth);

    // 재시작 버튼
    this.createRestartButton(onRestart, depth + 1);
  }

  /**
   * 최종 점수 표시
   */
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
        this.TEXT_STYLE.FINAL_SCORE
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

  /**
   * 재시작 버튼 생성
   */
  createRestartButton(onRestart: () => void, depth: number = 0): void {
    const buttonY = 440;

    const restartBtnBg = this.scene.add
      .rectangle(400, buttonY, 200, 60, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth);

    this.scene.add
      .text(400, buttonY, "RETRY", this.TEXT_STYLE.BUTTON)
      .setOrigin(0.5)
      .setDepth(depth);

    restartBtnBg.on("pointerover", () => {
      restartBtnBg.setFillStyle(0xe0e0e0);
      restartBtnBg.setScale(1.05);
    });

    restartBtnBg.on("pointerout", () => {
      restartBtnBg.setFillStyle(0xffffff);
      restartBtnBg.setScale(1);
    });

    restartBtnBg.on("pointerdown", () => {
      onRestart();
    });
  }

  /**
   * 정리 (메모리 해제)
   */
  cleanup(): void {
    this.stopStatusTextRotation();
    this.colorPreviewPaddles = [];
  }
}
