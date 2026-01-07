// game/managers/games/pingpong/ui/PingPongGameOverUIManager.ts

import { TEXT_STYLE } from "@/game/types/common/ui.constants";
import { PingPongGameResult } from "@/game/types/pingpong";

/**
 * 핑퐁 게임 종료 화면 UI 관리
 * - 게임 오버 화면
 * - 최종 점수 표시
 * - 게임 통계 표시
 */
export class PingPongGameOverUIManager {
  private scene: Phaser.Scene;

  private readonly TEXT_STYLE = {
    FINAL_SCORE: {
      fontFamily: '"Press Start 2P"',
      fontSize: "32px",
      color: "#ffffff",
    },
    LABEL: {
      fontFamily: '"Press Start 2P"',
      fontSize: "14px",
      color: "#95a5a6",
    },
    STATS: {
      fontFamily: '"Press Start 2P"',
      fontSize: "10px",
      color: "#95a5a6",
    },
    BUTTON: {
      fontFamily: '"Press Start 2P"',
      fontSize: "14px",
      color: "#ffffff",
    },
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // =====================================================================
  // 게임 오버 화면
  // =====================================================================

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
    this.createResultText(winner, isPlayerWin, depth);
    this.createFinalScoreDisplay(playerScore, aiScore, depth);

    if (gameResult) {
      this.createGameStats(gameResult, depth);
    }

    this.createRestartButton(onRestart, 400, 440, depth + 1);
    this.createHomeButton(onHome, 400, 520, depth + 1);
  }

  // =====================================================================
  // UI 컴포넌트
  // =====================================================================

  private createOverlay(alpha: number, depth: number): void {
    const overlay = this.scene.add.rectangle(
      400,
      300,
      800,
      600,
      0x000000,
      alpha
    );
    overlay.setDepth(depth);
  }

  private createResultText(text: string, isWin: boolean, depth: number): void {
    const resultText = this.scene.add
      .text(400, 200, text, {
        ...TEXT_STYLE.GAME_OVER,
        color: isWin ? "#2ecc71" : "#e74c3c",
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);

    this.scene.tweens.add({
      targets: resultText,
      ...(isWin
        ? { scale: 1.1, duration: 300 }
        : { alpha: 0.3, duration: 500 }),
      yoyo: true,
      repeat: -1,
    });
  }

  private createFinalScoreDisplay(
    playerScore: number,
    aiScore: number,
    depth: number
  ): void {
    this.scene.add
      .text(400, 280, "PLAYER", this.TEXT_STYLE.LABEL)
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
      .text(400, 360, "COMPUTER", this.TEXT_STYLE.LABEL)
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
      .text(400, startY, stats.join("  |  "), this.TEXT_STYLE.STATS)
      .setOrigin(0.5)
      .setDepth(depth + 1);
  }

  private createRestartButton(
    onRestart: () => void,
    x: number,
    y: number,
    depth: number
  ): void {
    const button = this.scene.add
      .text(x, y, "▶ RESTART", this.TEXT_STYLE.BUTTON)
      .setOrigin(0.5)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true });

    button.on("pointerover", () => button.setColor("#ffff00"));
    button.on("pointerout", () => button.setColor("#ffffff"));
    button.on("pointerdown", onRestart);
  }

  private createHomeButton(
    onHome: () => void,
    x: number,
    y: number,
    depth: number
  ): void {
    const button = this.scene.add
      .text(x, y, "🏠 HOME", this.TEXT_STYLE.BUTTON)
      .setOrigin(0.5)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true });

    button.on("pointerover", () => button.setColor("#ffff00"));
    button.on("pointerout", () => button.setColor("#ffffff"));
    button.on("pointerdown", onHome);
  }

  // =====================================================================
  // 정리
  // =====================================================================

  cleanup(): void {
    // 필요시 정리 로직 추가
  }
}
