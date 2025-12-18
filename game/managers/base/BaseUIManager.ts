// game/managers/base/BaseUIManager.ts

/**
 * UI 매니저의 베이스 클래스
 * 게임 UI의 공통 패턴 제공
 */
export abstract class BaseUIManager {
  protected scene: Phaser.Scene;

  // 공통 텍스트 스타일 (각 게임에서 오버라이드 가능)
  protected readonly TEXT_STYLE = {
    SCORE: {
      fontFamily: '"Press Start 2P"',
      fontSize: "14px",
      color: "#ffffff",
    },
    GAME_OVER: {
      fontFamily: '"Press Start 2P"',
      fontSize: "36px",
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
   * 게임 UI 생성 (각 게임에서 구현)
   */
  abstract createGameUI(): void;

  /**
   * 재시작 버튼 생성 (공통 패턴)
   */
  protected createRestartButton(
    onRestart: () => void,
    x: number = 400,
    y: number = 400,
    depth: number = 0
  ): void {
    const restartBtnBg = this.scene.add
      .rectangle(x, y, 200, 60, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth);

    this.scene.add
      .text(x, y, "RETRY", this.TEXT_STYLE.BUTTON)
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
   * 홈 버튼 생성 (공통 패턴)
   */
  protected createHomeButton(
    onHome: () => void,
    x: number = 750,
    y: number = 50,
    depth: number = 0
  ): void {
    const homeBtnBg = this.scene.add
      .rectangle(x, y, 200, 60, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth);

    this.scene.add
      .text(x, y, "HOME", this.TEXT_STYLE.BUTTON)
      .setOrigin(0.5)
      .setDepth(depth);

    homeBtnBg.on("pointerover", () => {
      homeBtnBg.setFillStyle(0xe0e0e0);
      homeBtnBg.setScale(1.05);
    });

    homeBtnBg.on("pointerout", () => {
      homeBtnBg.setFillStyle(0xffffff);
      homeBtnBg.setScale(1);
    });

    homeBtnBg.on("pointerdown", () => {
      window.location.href = "/game";
    });
  }

  /**
   * 오버레이 생성 (공통 패턴)
   */
  protected createOverlay(
    alpha: number = 0.7,
    depth: number = 10
  ): Phaser.GameObjects.Rectangle {
    return this.scene.add
      .rectangle(400, 300, 800, 600, 0x000000, alpha)
      .setDepth(depth);
  }

  /**
   * 정리 (각 게임에서 구현)
   */
  abstract cleanup(): void;
}
