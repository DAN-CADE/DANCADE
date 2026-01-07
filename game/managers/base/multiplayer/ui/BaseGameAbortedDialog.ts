import { GameAbortedDialogConfig } from "@/game/types/common/ui.types";
import { UI_DEPTH } from "@/game/types/common/ui.constants";
import { BaseUIManager } from "@/game/managers/base/BaseUIManager";

export class BaseGameAbortedDialog extends BaseUIManager {
  protected config: GameAbortedDialogConfig;

  constructor(scene: Phaser.Scene, config: GameAbortedDialogConfig) {
    super(scene);
    this.config = config;
  }

  // BaseUIManager 필수 구현
  public createGameUI(): void {}

  /**
   * 게임 중단 다이얼로그 표시
   */
  public show(
    reason: string,
    leavingPlayer: string,
    onConfirm: () => void
  ): void {
    // 1. 기존 UI 정리 (BaseUIManager의 cleanup 활용 가능)
    this.clear();

    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // 2. 배경 오버레이 (Depth는 UI_DEPTH 시스템 준수)
    this.renderOverlay(centerX, centerY, width, height);

    // 3. 타이틀 텍스트
    this.createText(centerX, centerY - 50, "⚠️ 게임 중단", {
      ...this.config.textStyle.title,
      color: this.config.colors.titleText,
    });

    // 4. 중단 이유 텍스트
    this.createText(centerX, centerY + 20, reason, {
      ...this.config.textStyle.reason,
      color: this.config.colors.reasonText,
    });

    // 5. 나간 플레이어 (선택적)
    if (leavingPlayer) {
      this.createText(
        centerX,
        centerY + 60,
        `(${leavingPlayer}님이 나갔습니다)`,
        {
          ...this.config.textStyle.reason,
          fontSize: "18px",
          color: this.config.colors.reasonText,
        }
      );
    }

    // 6. 확인 버튼 (BaseUIManager의 공통 버튼 메서드 사용)
    this.createCommonButton(
      centerX,
      centerY + 130,
      "확인",
      () => {
        this.clear();
        onConfirm();
      },
      {
        size: "MEDIUM",
        color: this.config.colors.buttonColor,
        textColor: "#ffffff",
      }
    ).setDepth(UI_DEPTH.UI + 1);
  }

  /**
   * 다이얼로그 및 관련 UI 제거
   */
  public clear(): void {
    // UI_DEPTH.UI 근처의 모든 객체를 찾아서 제거 (타입 캐스팅 적용)
    const list = this.scene.children.list as Phaser.GameObjects.Image[];
    const targets = list.filter((child) => child.depth >= UI_DEPTH.UI - 5);

    targets.forEach((child) => child.destroy());
  }

  public cleanup(): void {
    this.clear();
  }

  // =====================================================================
  // Helper 렌더링 로직 (BaseUIManager 스타일로 통합)
  // =====================================================================

  private renderOverlay(x: number, y: number, w: number, h: number): void {
    const { overlay, overlayAlpha } = this.config.colors;
    this.scene.add
      .rectangle(x, y, w, h, overlay, overlayAlpha)
      .setDepth(UI_DEPTH.UI - 1);
  }

  private createText(x: number, y: number, text: string, style: object): void {
    this.scene.add.text(x, y, text, style).setOrigin(0.5).setDepth(UI_DEPTH.UI);
  }
}
