// game/managers/base/BaseOnlineUIManager.ts
import { ButtonFactory } from "@/utils/ButtonFactory";
import {
  BUTTON_SIZE,
  ONLINE_MENU_LAYOUT,
} from "@/game/types/common/ui.constants";

interface OnlineMenuOptions {
  onQuickJoin: () => void;
  onCreateRoom: () => void;
  onShowList: () => void;
  onBack: () => void;
  onMainMove: () => void;
  colors: { primary: number; secondary: number; panel: number };
}

type MenuButtonConfig = {
  label: string;
  onClick: () => void;
  color: number;
  textColor: string;
};

export class BaseOnlineUIManager {
  protected readonly UI_DEPTH = 500;
  protected scene: Phaser.Scene;
  private menuContainer: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // ============================================================
  // 온라인 메뉴
  // ============================================================
  public showOnlineMenu(options: OnlineMenuOptions): void {
    this.hideOnlineMenu();

    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    this.menuContainer = this.scene.add.container(0, 0).setDepth(this.UI_DEPTH);

    // ------------------------------------------------------------
    // 레이아웃 설정
    // ------------------------------------------------------------
    const layout = {
      panelWidth: ONLINE_MENU_LAYOUT.PANEL_WIDTH,
      buttonSize: BUTTON_SIZE.MEDIUM,
      buttonGap: ONLINE_MENU_LAYOUT.BUTTON_GAP,
      paddingTop: ONLINE_MENU_LAYOUT.PADDING_TOP,
      paddingBottom: ONLINE_MENU_LAYOUT.PADDING_BOTTOM,
    };

    // ------------------------------------------------------------
    // 온라인 메뉴 버튼
    // ------------------------------------------------------------
    const buttonConfigs: MenuButtonConfig[] = [
      {
        label: "빠른 매칭",
        onClick: options.onQuickJoin,
        color: options.colors.primary,
        textColor: "#ffffff",
      },
      {
        label: "방 만들기",
        onClick: options.onCreateRoom,
        color: options.colors.secondary,
        textColor: "#ffffff",
      },
      {
        label: "방 목록",
        onClick: options.onShowList,
        color: options.colors.secondary,
        textColor: "#ffffff",
      },
      {
        label: "뒤로가기",
        onClick: options.onBack,
        color: 0x6b7280,
        textColor: "#ffffff",
      },
      {
        label: "메인으로",
        onClick: options.onMainMove,
        color: 0xd9d9d9,
        textColor: "#000000",
      },
    ];

    // ------------------------------------------------------------
    // 패널 높이값 계산
    // ------------------------------------------------------------
    const panelHeight =
      layout.paddingTop +
      buttonConfigs.length * layout.buttonSize.height +
      (buttonConfigs.length - 1) * layout.buttonGap +
      layout.paddingBottom;

    // ------------------------------------------------------------
    // 배경 패널
    // ------------------------------------------------------------
    const panel = this.scene.add
      .rectangle(
        centerX,
        centerY,
        layout.panelWidth,
        panelHeight,
        options.colors.panel,
        0.95
      )
      .setStrokeStyle(4, 0xffffff, 0.1)
      .setDepth(this.UI_DEPTH - 1);

    this.menuContainer.add(panel);

    // ------------------------------------------------------------
    // Buttons
    // ------------------------------------------------------------
    const firstButtonY =
      centerY -
      panelHeight / 2 +
      layout.paddingTop +
      layout.buttonSize.height / 2;

    const spacing = layout.buttonSize.height + layout.buttonGap;

    const buttons = buttonConfigs.map((config, index) =>
      ButtonFactory.createButton(
        this.scene,
        centerX,
        firstButtonY + spacing * index,
        config.label,
        config.onClick,
        {
          width: layout.buttonSize.width,
          height: layout.buttonSize.height,
          color: config.color,
          textColor: config.textColor,
        }
      )
    );

    this.menuContainer.add(buttons);
  }

  // ============================================================
  // 정리
  // ============================================================
  public hideOnlineMenu(): void {
    if (!this.menuContainer) return;

    this.menuContainer.destroy(true);
    this.menuContainer = null;
  }

  public cleanup(): void {
    this.hideOnlineMenu();
  }
}
