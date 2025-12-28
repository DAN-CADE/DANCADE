// game/managers/games/Omok/ui/OmokModeSelectionRenderer.ts
import { ButtonFactory } from "@/utils/ButtonFactory";
import { OMOK_CONFIG, OmokMode } from "@/game/types/omok";

/**
 * 모드 버튼 정보
 */
interface ModeButtonConfig {
  label: string;
  mode: OmokMode;
  color: number;
}

/**
 * OmokModeSelectionRenderer
 * - 모드 선택 UI 렌더링만 담당
 */
export class OmokModeSelectionRenderer {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;

  // 레이아웃 상수
  private readonly LAYOUT = {
    PANEL_WIDTH: 450,
    PANEL_HEIGHT: 380,
    PANEL_Y_OFFSET: -190,
    FIRST_BUTTON_Y: -110,
    BUTTON_SPACING: 110,
  } as const;

  // 버튼 설정
  private readonly MODE_BUTTONS: ModeButtonConfig[] = [
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
  ];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // =====================================================================
  // Public API
  // =====================================================================

  /**
   * 모드 선택 UI 표시
   * @param onSelect - 모드 선택 콜백
   */
  public show(onSelect: (mode: OmokMode) => void): void {
    this.clear();

    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // 컨테이너 생성
    this.container = this.scene.add
      .container(centerX, centerY)
      .setDepth(OMOK_CONFIG.DEPTH.UI);

    // 패널 생성
    this.createPanel();

    // 버튼 생성
    this.createButtons(onSelect);
  }

  /**
   * UI 제거
   */
  public clear(): void {
    this.container?.destroy();
    this.container = null;
  }

  // =====================================================================
  // Private 렌더링 로직
  // =====================================================================

  /**
   * 패널 생성
   */
  private createPanel(): void {
    const { PANEL_WIDTH, PANEL_HEIGHT, PANEL_Y_OFFSET } = this.LAYOUT;

    const panel = this.scene.add.graphics();
    panel.fillStyle(OMOK_CONFIG.COLORS.PANEL, 0.95);
    panel.fillRoundedRect(
      -PANEL_WIDTH / 2,
      PANEL_Y_OFFSET,
      PANEL_WIDTH,
      PANEL_HEIGHT,
      30
    );
    panel.lineStyle(4, 0xffffff, 0.1);
    panel.strokeRoundedRect(
      -PANEL_WIDTH / 2,
      PANEL_Y_OFFSET,
      PANEL_WIDTH,
      PANEL_HEIGHT,
      30
    );

    this.container!.add(panel);
  }

  /**
   * 버튼들 생성
   */
  private createButtons(onSelect: (mode: OmokMode) => void): void {
    const buttons = this.MODE_BUTTONS.map((config, index) =>
      this.createButton(config, index, onSelect)
    );

    this.container!.add(buttons);
  }

  /**
   * 개별 버튼 생성
   */
  private createButton(
    config: ModeButtonConfig,
    index: number,
    onSelect: (mode: OmokMode) => void
  ): Phaser.GameObjects.Container {
    const { FIRST_BUTTON_Y, BUTTON_SPACING } = this.LAYOUT;

    return ButtonFactory.createButton(
      this.scene,
      0,
      FIRST_BUTTON_Y + index * BUTTON_SPACING,
      config.label,
      () => {
        this.clear();
        onSelect(config.mode);
      },
      {
        width: OMOK_CONFIG.BUTTON_SIZE.LARGE.width,
        height: OMOK_CONFIG.BUTTON_SIZE.LARGE.height,
        color: config.color,
        textColor: "#ffffff",
      }
    );
  }
}
