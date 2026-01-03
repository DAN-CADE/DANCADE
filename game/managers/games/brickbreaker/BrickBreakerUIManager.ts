// game/managers/games/brickbreaker/BrickBreakerUIManager.ts

import { BaseUIManager } from "@/game/managers/base";
import { GameResult } from "./BrickBreakerGameManager";
import { TEXT_STYLE } from "@/game/types/common/ui.constants";

/**
 * 벽돌깨기 UI 관리
 */
export class BrickBreakerUIManager extends BaseUIManager {
  private scoreText?: Phaser.GameObjects.Text;

  createGameUI(): void {
    this.createScoreText();
  }

  private createScoreText(): void {
    this.scoreText = this.scene.add.text(16, 16, "SCORE: 0", TEXT_STYLE.SCORE);
  }

  updateScore(score: number): void {
    this.scoreText?.setText(`SCORE: ${score}`);
  }

  showEndGameScreen(
    result: GameResult,
    score: number,
    onRestart: () => void,
    onHome: () => void
  ): void {
    const depth = 10;
    const config = this.getEndGameConfig(result);

    // 오버레이
    this.createOverlay(config.overlayAlpha, depth);

    // 메인 텍스트
    const mainText = this.scene.add
      .text(400, 200, config.mainText, {
        ...TEXT_STYLE.GAME_OVER,
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
    this.createRestartButton(onRestart, 400, 400, depth + 1);

    // 홈으로 가기 버튼
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
    // UI cleanup if needed
  }
}
