// game/managers/brickbracker/BrickBreakerUIManager.ts
import { GameResult } from "./BrickBreakerGameManager";

/**
 * 벽돌깨기 UI 관리
 * - 점수판, 텍스트, 버튼 생성
 * - 게임 오버 화면
 * - 승리 화면
 */
export class BrickBreakerUIManager {
  private scene: Phaser.Scene;

  // UI Elements
  private scoreText?: Phaser.GameObjects.Text;

  // Text Styles
  private readonly TEXT_STYLE = {
    SCORE: {
      fontFamily: '"Press Start 2P"',
      fontSize: "14px",
      color: "#ffffff",
    },
    GAME_OVER: {
      fontFamily: '"Press Start 2P"',
      fontSize: "36px",
    },
    SCORE_LABEL: {
      fontFamily: '"Press Start 2P"',
      fontSize: "14px",
      color: "#95a5a6",
    },
    SCORE_VALUE: {
      fontFamily: '"Press Start 2P"',
      fontSize: "32px",
      color: "#f1c40f",
    },
    BUTTON: {
      fontFamily: '"Press Start 2P"',
      fontSize: "14px",
      color: "#333333",
    },
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 게임 UI 생성
   */
  createGameUI(): void {
    this.createScoreText();
  }

  /**
   * 점수 텍스트 생성
   */
  private createScoreText(): void {
    this.scoreText = this.scene.add.text(
      16,
      16,
      "SCORE: 0",
      this.TEXT_STYLE.SCORE
    );
  }

  /**
   * 점수 업데이트
   */
  updateScore(score: number): void {
    this.scoreText?.setText(`SCORE: ${score}`);
  }

  /**
   * 게임 오버 화면 표시
   */
  showEndGameScreen(
    result: GameResult,
    score: number,
    onRestart: () => void
  ): void {
    const depth = 10;
    const config = this.getEndGameConfig(result);

    // 반투명 오버레이
    this.scene.add
      .rectangle(400, 300, 800, 600, 0x000000, config.overlayAlpha)
      .setDepth(depth);

    // 메인 텍스트
    const mainText = this.scene.add
      .text(400, 200, config.mainText, {
        ...this.TEXT_STYLE.GAME_OVER,
        color: config.mainColor,
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);

    // 애니메이션
    this.scene.tweens.add({
      targets: mainText,
      ...config.animation,
      yoyo: true,
      repeat: -1,
    });

    // 점수 표시
    this.createScoreDisplay(score, depth);

    // 재시작 버튼
    this.createRestartButton(onRestart, depth + 1);
  }

  /**
   * 종료 화면 설정 가져오기
   */
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

  /**
   * 점수 표시 생성
   */
  private createScoreDisplay(score: number, depth: number): void {
    this.scene.add
      .text(400, 280, "SCORE", this.TEXT_STYLE.SCORE_LABEL)
      .setOrigin(0.5)
      .setDepth(depth + 1);

    this.scene.add
      .text(400, 320, `${score}`, this.TEXT_STYLE.SCORE_VALUE)
      .setOrigin(0.5)
      .setDepth(depth + 1);
  }

  /**
   * 재시작 버튼 생성
   */
  private createRestartButton(onRestart: () => void, depth: number): void {
    const buttonY = 400;

    const restartBtnBg = this.scene.add
      .image(400, buttonY, "buttonDefault")
      .setScale(3, 1.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth);

    this.scene.add
      .text(400, buttonY, "RETRY", this.TEXT_STYLE.BUTTON)
      .setOrigin(0.5)
      .setDepth(depth);

    restartBtnBg.on("pointerover", () => {
      restartBtnBg.setTexture("buttonSelected").setScale(3.1, 1.6);
    });

    restartBtnBg.on("pointerout", () => {
      restartBtnBg.setTexture("buttonDefault").setScale(3, 1.5);
    });

    restartBtnBg.on("pointerdown", () => {
      onRestart();
    });
  }

  /**
   * 정리 (메모리 해제)
   */
  cleanup(): void {
    // UI cleanup if needed
  }
}
