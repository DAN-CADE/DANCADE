// game/managers/base/BaseOnlineUIManager.ts
import { ButtonFactory } from "@/utils/ButtonFactory";

interface OnlineMenuOptions {
  onQuickJoin: () => void;
  onCreateRoom: () => void;
  onShowList: () => void;
  onBack: () => void;
  onMainMove: () => void;
  colors: { primary: number; secondary: number; panel: number };
}

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

    // ✅ 버튼 개수에 따른 패널 높이 계산
    const buttonCount = 5; // 빠른 매칭, 방 만들기, 방 목록, 뒤로가기, 메인으로
    const buttonHeight = 70;
    const buttonGap = 20;
    const paddingTop = 60;
    const paddingBottom = 60;
    const panelHeight =
      paddingTop +
      buttonCount * buttonHeight +
      (buttonCount - 1) * buttonGap +
      paddingBottom;

    // 배경 패널
    const panel = this.scene.add
      .rectangle(centerX, centerY, 450, panelHeight, options.colors.panel, 0.95)
      .setStrokeStyle(4, 0xffffff, 0.1)
      .setDepth(this.UI_DEPTH - 1);

    this.menuContainer.add(panel);

    // ✅ 버튼 위치 계산
    const firstButtonY =
      centerY - panelHeight / 2 + paddingTop + buttonHeight / 2;
    const spacing = buttonHeight + buttonGap;

    // ✅ 버튼 생성
    const buttons = [
      ButtonFactory.createButton(
        this.scene,
        centerX,
        firstButtonY,
        "빠른 매칭",
        options.onQuickJoin,
        {
          width: 350,
          height: buttonHeight,
          color: options.colors.primary,
          textColor: "#ffffff",
        }
      ),
      ButtonFactory.createButton(
        this.scene,
        centerX,
        firstButtonY + spacing,
        "방 만들기",
        options.onCreateRoom,
        {
          width: 350,
          height: buttonHeight,
          color: options.colors.secondary,
          textColor: "#ffffff",
        }
      ),
      ButtonFactory.createButton(
        this.scene,
        centerX,
        firstButtonY + spacing * 2,
        "방 목록",
        options.onShowList,
        {
          width: 350,
          height: buttonHeight,
          color: options.colors.secondary,
          textColor: "#ffffff",
        }
      ),
      ButtonFactory.createButton(
        this.scene,
        centerX,
        firstButtonY + spacing * 3,
        "뒤로가기",
        options.onBack,
        {
          width: 350,
          height: buttonHeight,
          color: 0x6b7280,
          textColor: "#ffffff",
        }
      ),
      ButtonFactory.createButton(
        this.scene,
        centerX,
        firstButtonY + spacing * 4,
        "메인으로",
        options.onMainMove,
        {
          width: 350,
          height: buttonHeight,
          color: 0xd9d9d9,
          textColor: "#000000",
        }
      ),
    ];

    this.menuContainer.add(buttons);
  }

  public hideOnlineMenu(): void {
    if (this.menuContainer) {
      this.menuContainer.destroy();
      this.menuContainer = null;
    }
  }

  public cleanup(): void {
    this.hideOnlineMenu();
  }
}
