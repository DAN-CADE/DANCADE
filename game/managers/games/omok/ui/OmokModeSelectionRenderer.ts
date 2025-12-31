// game/managers/games/Omok/ui/OmokModeSelectionRenderer.ts
import { ButtonFactory } from "@/utils/ButtonFactory";
import { OMOK_CONFIG, OmokMode } from "@/game/types/omok";
import {
  BUTTON_SIZE,
  COMMON_COLORS,
  ONLINE_MENU_LAYOUT,
} from "@/game/types/common/ui.constants";

interface ModeButtonConfig {
  label: string;
  mode: OmokMode;
  color: number;
}

export class OmokModeSelectionRenderer {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;

  // ------------------------------------------------------------
  // 레이아웃 설정
  // ------------------------------------------------------------

  private readonly layout = {
    panelWidth: 450,
    buttonSize: BUTTON_SIZE.MEDIUM,
    buttonGap: 20,
    paddingTop: 60,
    paddingBottom: 60,
    panelCornerRadius: 30,
  } as const;

  // ------------------------------------------------------------
  // Button configs
  // ------------------------------------------------------------
  private readonly modeButtons: ModeButtonConfig[] = [
    {
      label: "SINGLE (VS GPT)",
      mode: OmokMode.SINGLE,
      color: OMOK_CONFIG.COLORS.PRIMARY,
    },
    {
      label: "OFFLINE",
      mode: OmokMode.LOCAL,
      color: OMOK_CONFIG.COLORS.SECONDARY,
    },
    {
      label: "ONLINE (MULTI)",
      mode: OmokMode.ONLINE,
      color: 0x686de0,
    },
    {
      label: "EXIT",
      mode: OmokMode.NONE,
      color: COMMON_COLORS.NEUTRAL,
    },
  ];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // =====================================================================
  // Public API
  // =====================================================================

  public show(onSelect: (mode: OmokMode) => void): void {
    this.clear();

    const { width, height } = this.scene.scale;

    this.container = this.scene.add
      .container(width / 2, height / 2)
      .setDepth(OMOK_CONFIG.DEPTH.UI);

    const panelHeight = this.calculatePanelHeight();

    this.createPanel(panelHeight);
    this.createButtons(panelHeight, onSelect);
  }

  public clear(): void {
    this.container?.destroy(true);
    this.container = null;
  }

  // =====================================================================
  // Private helpers
  // =====================================================================

  private calculatePanelHeight(): number {
    const { buttonSize, buttonGap, paddingTop, paddingBottom } = this.layout;
    const count = this.modeButtons.length;

    return (
      paddingTop +
      count * buttonSize.height +
      (count - 1) * buttonGap +
      paddingBottom
    );
  }

  private createPanel(panelHeight: number): void {
    const { panelWidth, panelCornerRadius } = this.layout;

    const panel = this.scene.add.graphics();

    panel.fillStyle(OMOK_CONFIG.COLORS.PANEL, 0.95);
    panel.fillRoundedRect(
      -panelWidth / 2,
      -panelHeight / 2,
      panelWidth,
      panelHeight,
      panelCornerRadius
    );

    panel.lineStyle(4, 0xffffff, 0.1);
    panel.strokeRoundedRect(
      -panelWidth / 2,
      -panelHeight / 2,
      panelWidth,
      panelHeight,
      panelCornerRadius
    );

    this.container!.add(panel);
  }

  private createButtons(
    panelHeight: number,
    onSelect: (mode: OmokMode) => void
  ): void {
    const layout = {
      panelWidth: ONLINE_MENU_LAYOUT.PANEL_WIDTH,
      buttonSize: BUTTON_SIZE.MEDIUM,
      buttonGap: ONLINE_MENU_LAYOUT.BUTTON_GAP,
      paddingTop: ONLINE_MENU_LAYOUT.PADDING_TOP,
      paddingBottom: ONLINE_MENU_LAYOUT.PADDING_BOTTOM,
    };

    const { buttonSize, buttonGap, paddingTop } = this.layout;

    const firstButtonY = -panelHeight / 2 + paddingTop + buttonSize.height / 2;

    const spacing = buttonSize.height + buttonGap;

    const buttons = this.modeButtons.map((config, index) =>
      ButtonFactory.createButton(
        this.scene,
        0,
        firstButtonY + index * spacing,
        config.label,
        () => {
          this.clear();
          onSelect(config.mode);
        },
        {
          width: buttonSize.width,
          height: buttonSize.height,
          color: config.color,
          textColor: "#ffffff",
        }
      )
    );

    this.container!.add(buttons);
  }
}
