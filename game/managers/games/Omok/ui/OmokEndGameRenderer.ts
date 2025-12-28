// game/managers/games/Omok/ui/OmokEndGameRenderer.ts
import { ButtonFactory } from "@/utils/ButtonFactory";
import { OMOK_CONFIG } from "@/game/types/omok";

/**
 * OmokEndGameRenderer
 * - 게임 종료 UI 렌더링만 담당
 */
export class OmokEndGameRenderer {
  private scene: Phaser.Scene;
  private endGameUI: Phaser.GameObjects.Container | null = null;

  // 레이아웃 상수
  private readonly LAYOUT = {
    BUTTON_Y_OFFSET: 50,
    BUTTON_SPACING: 240, // 중앙 기준 좌우로
  } as const;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // =====================================================================
  // Public API
  // =====================================================================

  /**
   * 게임 종료 UI 표시
   * @param winnerName - 승자 이름
   * @param onRestart - 재시작 콜백
   * @param onExit - 나가기 콜백
   */
  public show(
    winnerName: string,
    onRestart: () => void,
    onExit: () => void
  ): void {
    this.clear();

    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // 컨테이너 생성
    this.endGameUI = this.scene.add
      .container(centerX, centerY)
      .setDepth(OMOK_CONFIG.DEPTH.MESSAGE);

    // 반투명 배경
    this.createOverlay(centerX, centerY);

    // 승자 텍스트
    this.createWinnerText(winnerName);

    // 버튼들
    this.createButtons(onRestart, onExit);
  }

  /**
   * UI 제거
   */
  public clear(): void {
    this.endGameUI?.destroy();
    this.endGameUI = null;
  }

  // =====================================================================
  // Private 렌더링 로직
  // =====================================================================

  /**
   * 반투명 오버레이 생성
   */
  private createOverlay(centerX: number, centerY: number): void {
    const { width, height } = this.scene.scale;

    const overlay = this.scene.add
      .rectangle(-centerX, -centerY, width, height, 0x000000, 0.7)
      .setOrigin(0, 0);

    this.endGameUI!.add(overlay);
  }

  /**
   * 승자 텍스트 생성
   */
  private createWinnerText(winnerName: string): void {
    const winText = this.scene.add
      .text(0, -100, `🎉 ${winnerName} 승리! 🎉`, {
        ...OMOK_CONFIG.TEXT_STYLE.TITLE,
        color: OMOK_CONFIG.COLORS.GOLD,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setScale(0)
      .setShadow(4, 4, "#000000", 8);

    // 팝 애니메이션
    this.scene.tweens.add({
      targets: winText,
      scale: 1,
      duration: 500,
      ease: "Back.easeOut",
    });

    this.endGameUI!.add(winText);
  }

  /**
   * 버튼들 생성
   */
  private createButtons(onRestart: () => void, onExit: () => void): void {
    const { BUTTON_Y_OFFSET, BUTTON_SPACING } = this.LAYOUT;

    // 재시작 버튼
    const restartBtn = ButtonFactory.createButton(
      this.scene,
      -BUTTON_SPACING / 2,
      BUTTON_Y_OFFSET,
      "RESTART",
      () => {
        this.clear();
        onRestart();
      },
      {
        width: OMOK_CONFIG.BUTTON_SIZE.MEDIUM.width,
        height: OMOK_CONFIG.BUTTON_SIZE.MEDIUM.height,
        color: OMOK_CONFIG.COLORS.PRIMARY,
        textColor: "#ffffff",
      }
    );

    // 나가기 버튼
    const exitBtn = ButtonFactory.createButton(
      this.scene,
      BUTTON_SPACING / 2,
      BUTTON_Y_OFFSET,
      "EXIT",
      () => {
        this.clear();
        onExit();
      },
      {
        width: OMOK_CONFIG.BUTTON_SIZE.MEDIUM.width,
        height: OMOK_CONFIG.BUTTON_SIZE.MEDIUM.height,
        color: OMOK_CONFIG.COLORS.DANGER,
        textColor: "#ffffff",
      }
    );

    this.endGameUI!.add([restartBtn, exitBtn]);

    // 버튼 애니메이션 (순차적)
    this.animateButtons([restartBtn, exitBtn]);
  }

  /**
   * 버튼 애니메이션
   */
  private animateButtons(buttons: Phaser.GameObjects.Container[]): void {
    buttons.forEach((btn, index) => {
      btn.setAlpha(0);
      btn.y += 20;

      this.scene.tweens.add({
        targets: btn,
        alpha: 1,
        y: btn.y - 20,
        duration: 300,
        delay: 200 + index * 100,
        ease: "Power2.easeOut",
      });
    });
  }
}
