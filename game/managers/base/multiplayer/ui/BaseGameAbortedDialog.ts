// game/managers/base/multiplayer/ui/BaseGameAbortedDialog.ts

import { ButtonFactory } from "@/utils/ButtonFactory";

/**
 * 게임 중단 다이얼로그 설정
 */
export interface GameAbortedDialogConfig {
  colors: {
    overlay: number;
    overlayAlpha: number;
    titleText: string;
    reasonText: string;
    buttonColor: number;
  };
  textStyle: {
    title: Partial<Phaser.Types.GameObjects.Text.TextStyle>;
    reason: Partial<Phaser.Types.GameObjects.Text.TextStyle>;
  };
  depth: number;
}

/**
 * BaseGameAbortedDialog
 * - 온라인 게임 중단 시 표시되는 다이얼로그
 * - 모든 게임에서 동일한 구조
 * - 게임별로 색상/텍스트만 커스터마이징
 */
export class BaseGameAbortedDialog {
  protected scene: Phaser.Scene;
  protected config: GameAbortedDialogConfig;
  private dialogElements: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, config: GameAbortedDialogConfig) {
    this.scene = scene;
    this.config = config;
  }

  // =====================================================================
  // Public API
  // =====================================================================

  /**
   * 게임 중단 다이얼로그 표시
   * @param reason - 중단 이유
   * @param leavingPlayer - 나간 플레이어 이름
   * @param onConfirm - 확인 버튼 콜백
   */
  public show(
    reason: string,
    leavingPlayer: string,
    onConfirm: () => void
  ): void {
    this.clear();

    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // 배경 오버레이
    const overlay = this.createOverlay(centerX, centerY, width, height);
    this.dialogElements.push(overlay);

    // 타이틀
    const titleText = this.createTitleText(centerX, centerY - 50);
    this.dialogElements.push(titleText);

    // 중단 이유
    const reasonText = this.createReasonText(centerX, centerY + 20, reason);
    this.dialogElements.push(reasonText);

    // 나간 플레이어 (선택적)
    if (leavingPlayer) {
      const playerText = this.createPlayerText(
        centerX,
        centerY + 60,
        leavingPlayer
      );
      this.dialogElements.push(playerText);
    }

    // 확인 버튼
    const confirmButton = this.createConfirmButton(
      centerX,
      centerY + 120,
      onConfirm
    );
    this.dialogElements.push(confirmButton);
  }

  /**
   * 다이얼로그 제거
   */
  public clear(): void {
    this.dialogElements.forEach((element) => element.destroy());
    this.dialogElements = [];
  }

  // =====================================================================
  // Private 렌더링 로직
  // =====================================================================

  /**
   * 오버레이 생성
   */
  private createOverlay(
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ): Phaser.GameObjects.Rectangle {
    const { overlay, overlayAlpha } = this.config.colors;

    return this.scene.add
      .rectangle(centerX, centerY, width, height, overlay, overlayAlpha)
      .setDepth(this.config.depth - 1);
  }

  /**
   * 타이틀 텍스트 생성
   */
  private createTitleText(x: number, y: number): Phaser.GameObjects.Text {
    return this.scene.add
      .text(x, y, "⚠️ 게임 중단", {
        ...this.config.textStyle.title,
        color: this.config.colors.titleText,
      })
      .setOrigin(0.5)
      .setDepth(this.config.depth);
  }

  /**
   * 중단 이유 텍스트 생성
   */
  private createReasonText(
    x: number,
    y: number,
    reason: string
  ): Phaser.GameObjects.Text {
    return this.scene.add
      .text(x, y, reason, {
        ...this.config.textStyle.reason,
        color: this.config.colors.reasonText,
      })
      .setOrigin(0.5)
      .setDepth(this.config.depth);
  }

  /**
   * 나간 플레이어 텍스트 생성
   */
  private createPlayerText(
    x: number,
    y: number,
    playerName: string
  ): Phaser.GameObjects.Text {
    return this.scene.add
      .text(x, y, `(${playerName}님이 나갔습니다)`, {
        ...this.config.textStyle.reason,
        fontSize: "18px",
        color: this.config.colors.reasonText,
      })
      .setOrigin(0.5)
      .setDepth(this.config.depth);
  }

  /**
   * 확인 버튼 생성
   */
  private createConfirmButton(
    x: number,
    y: number,
    onConfirm: () => void
  ): Phaser.GameObjects.Container {
    const button = ButtonFactory.createButton(
      this.scene,
      x,
      y,
      "확인",
      () => {
        this.clear();
        onConfirm();
      },
      {
        width: 200,
        height: 60,
        color: this.config.colors.buttonColor,
        textColor: "#ffffff",
      }
    );

    button.setDepth(this.config.depth);
    return button;
  }
}
