import { BaseUIManager } from "@/game/managers/base/BaseUIManager";
import {
  RoomUIConfig,
  ButtonSizeKey,
  OnlineMenuOptions,
} from "@/game/types/common/ui.types";
import { UI_DEPTH } from "@/game/types/common/ui.constants";

export class BaseOnlineUIManager extends BaseUIManager {
  protected config: RoomUIConfig;
  private menuContainer: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene, config: RoomUIConfig) {
    super(scene);
    this.config = config;
  }

  public createGameUI(): void {}

  // ============================================================
  // ============================================================
  public showOnlineMenu(options: OnlineMenuOptions): void {
    this.cleanup();

    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // 레이아웃 설정 (Config 기반)
    const { panelWidth, buttonGap } = this.config.layout;
    const buttonSizeKey: ButtonSizeKey = "MEDIUM";

    // 버튼 설정 정의
    // scene에서 받은 콜백이 options로 들어감
    const buttonConfigs = [
      {
        label: "빠른 매칭",
        onClick: options.onQuickJoin,
        color: this.config.colors.primary,
      },
      {
        label: "방 만들기",
        onClick: options.onCreateRoom,
        color: this.config.colors.cardInactive,
      },
      {
        label: "방 목록",
        onClick: options.onShowList,
        color: this.config.colors.cardInactive,
      },
      { label: "뒤로가기", onClick: options.onBack, color: 0x6b7280 },
      {
        label: "메인으로",
        onClick: options.onMainMove,
        color: 0xd9d9d9,
        textColor: "#000000",
      },
    ];

    const paddingTop = 60;
    const paddingBottom = 60;
    const buttonHeight = 50;
    const panelHeight =
      paddingTop +
      paddingBottom +
      buttonConfigs.length * buttonHeight +
      (buttonConfigs.length - 1) * buttonGap;

    this.menuContainer = this.scene.add.container(0, 0).setDepth(UI_DEPTH.UI);

    const panel = this.scene.add
      .rectangle(
        centerX,
        centerY,
        panelWidth,
        panelHeight,
        this.config.colors.panel,
        0.95
      )
      .setStrokeStyle(4, 0xffffff, 0.1);

    this.menuContainer.add(panel);

    // 버튼 배치
    let currentY = centerY - panelHeight / 2 + paddingTop + buttonHeight / 2;

    buttonConfigs.forEach((cfg) => {
      const btn = this.createCommonButton(
        centerX,
        currentY,
        cfg.label,
        cfg.onClick,
        {
          size: buttonSizeKey,
          color: cfg.color,
          textColor: cfg.textColor || "#ffffff",
        }
      );

      this.menuContainer?.add(btn);
      currentY += buttonHeight + buttonGap;
    });
  }

  // ============================================================
  // 정리 로직
  // ============================================================
  public hideOnlineMenu(): void {
    if (this.menuContainer) {
      this.menuContainer.destroy();
      this.menuContainer = null;
    }
  }

  public cleanup(): void {
    this.hideOnlineMenu();

    const list = this.scene.children.list as Phaser.GameObjects.Image[];

    const targets = list.filter((child) => child.depth >= UI_DEPTH.UI - 5);

    targets.forEach((child) => child.destroy());
  }
}
