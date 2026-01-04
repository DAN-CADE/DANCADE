import {
  COMMON_COLORS,
  ONLINE_MENU_LAYOUT,
  TEXT_STYLE,
  UI_DEPTH,
  BUTTON_SIZE,
} from "@/game/types/common/ui.constants";
import { OmokMode } from "@/game/types/omok";
import { OMOK_MODE_BUTTONS } from "@/game/types/omok/omok.constants";
import { ButtonSizeKey, LayoutInfo } from "@/game/types/common/ui.types";
import { BaseUIManager } from "@/game/managers/base/BaseUIManager";

export class OmokModeSelectionRenderer extends BaseUIManager {
  private container: Phaser.GameObjects.Container | null = null;
  private readonly BUTTON_SIZE_KEY: ButtonSizeKey = "MEDIUM";

  constructor(scene: Phaser.Scene) {
    super(scene);
  }

  // =====================================================================
  // =====================================================================

  public createGameUI(): void {}

  public cleanup(): void {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }

  // =====================================================================
  // =====================================================================

  public show(onSelect: (mode: OmokMode) => void): void {
    this.cleanup();

    const { width, height } = this.scene.scale;
    const layout = this.getLayoutInfo();
    const panelHeight = this.calculatePanelHeight(layout);

    this.container = this.scene.add
      .container(width / 2, height / 2)
      .setDepth(UI_DEPTH.UI);

    this.createPanel(panelHeight);
    this.createButtons(panelHeight, layout, onSelect);
  }

  // =====================================================================
  // =====================================================================

  private getLayoutInfo(): LayoutInfo {
    const { height: buttonHeight } = BUTTON_SIZE[this.BUTTON_SIZE_KEY];
    const buttonGap = ONLINE_MENU_LAYOUT.BUTTON_GAP;

    return {
      buttonHeight,
      buttonGap,
      paddingTop: ONLINE_MENU_LAYOUT.PADDING_TOP,
      spacing: buttonHeight + buttonGap,
    };
  }

  private calculatePanelHeight(layout: LayoutInfo): number {
    const count = OMOK_MODE_BUTTONS.length;
    return (
      layout.paddingTop +
      count * layout.buttonHeight +
      (count - 1) * layout.buttonGap +
      ONLINE_MENU_LAYOUT.PADDING_BOTTOM
    );
  }

  private createPanel(panelHeight: number): void {
    const { PANEL_WIDTH, PANEL_RADIUS } = ONLINE_MENU_LAYOUT;
    const panel = this.scene.add.graphics();

    panel.fillStyle(COMMON_COLORS.PANEL_DARK);
    panel.fillRoundedRect(
      -PANEL_WIDTH / 2,
      -panelHeight / 2,
      PANEL_WIDTH,
      panelHeight,
      PANEL_RADIUS
    );

    panel.lineStyle(4, COMMON_COLORS.WHITE, 0.1);
    panel.strokeRoundedRect(
      -PANEL_WIDTH / 2,
      -panelHeight / 2,
      PANEL_WIDTH,
      panelHeight,
      PANEL_RADIUS
    );

    this.container?.add(panel);
  }

  private createButtons(
    panelHeight: number,
    layout: LayoutInfo,
    onSelect: (mode: OmokMode) => void
  ): void {
    const firstButtonY =
      -panelHeight / 2 + layout.paddingTop + layout.buttonHeight / 2;

    const buttons = OMOK_MODE_BUTTONS.map((config, index) => {
      return this.createCommonButton(
        0,
        firstButtonY + index * layout.spacing,
        config.label,
        () => {
          this.cleanup();
          onSelect(config.value);
        },
        {
          size: this.BUTTON_SIZE_KEY,
          color: config.color,
          textColor: "#ffffff",
          fontSize: TEXT_STYLE.NORMAL.fontSize,
        }
      );
    });

    this.container?.add(buttons);
  }
}
