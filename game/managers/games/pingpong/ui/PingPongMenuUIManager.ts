// game/managers/games/pingpong/ui/PingPongMenuUIManager.ts

import { PINGPONG_CONFIG } from "@/game/types/pingpong";

/**
 * 핑퐁 게임 메뉴 UI 관리
 * - 모드 선택 화면
 * - 색상 선택 화면
 */
export class PingPongMenuUIManager {
  private scene: Phaser.Scene;
  private colorPreviewPaddles: Phaser.GameObjects.Image[] = [];
  private selectedColorIndex: number = 0;

  private readonly TEXT_STYLE = {
    TITLE: {
      fontFamily: '"Press Start 2P", "Malgun Gothic", "맑은 고딕", sans-serif',
      fontSize: "48px",
      color: "#ffffff",
    },
    SUBTITLE: {
      fontFamily:
        '"Noto Sans KR", "Malgun Gothic", "맑은 고딕", Arial, sans-serif',
      fontSize: "28px",
      color: "#ffffff",
      fontStyle: "bold",
    },
    BUTTON: {
      fontFamily: '"Press Start 2P", "Malgun Gothic", "맑은 고딕", sans-serif',
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold",
    },
    HINT: {
      fontSize: "16px",
      color: "#ffff88",
      fontFamily:
        '"Noto Sans KR", "Malgun Gothic", "맑은 고딕", Arial, sans-serif',
      fontStyle: "bold",
    },
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // =====================================================================
  // 모드 선택 화면
  // =====================================================================

  showModeSelection(onModeSelect: (mode: number) => void): void {
    const centerX = PINGPONG_CONFIG.GAME_WIDTH / 2;

    this.createBackgroundOverlay();

    this.scene.add
      .text(centerX, 60, "PING PONG", { ...this.TEXT_STYLE.TITLE, color: "#ffff00" })
      .setOrigin(0.5);

    this.scene.add
      .text(
        centerX,
        130,
        "게임을 시작하려면 아래 버튼을 눌러주세요",
        this.TEXT_STYLE.SUBTITLE
      )
      .setOrigin(0.5);

    const modes = [
      { label: "START", value: 1, color: 0x3498db },
      // TODO: 온라인 모드 구현 후 활성화
      // { label: "ONLINE (MULTI)", value: 3, color: 0xe74c3c },
      { label: "EXIT", value: 0, color: 0x95a5a6 },
    ];

    const buttonWidth = 300;
    const buttonHeight = 50;
    const buttonSpacing = 70;
    const startY = 280;

    modes.forEach((mode, index) => {
      const y = startY + index * buttonSpacing;
      this.createButton(
        centerX,
        y,
        buttonWidth,
        buttonHeight,
        mode.label,
        mode.color,
        () => {
          onModeSelect(mode.value);
        }
      );
    });
  }

  // =====================================================================
  // 색상 선택 화면
  // =====================================================================

  showColorSelection(currentColorIndex: number, onConfirm?: () => void): void {
    this.selectedColorIndex = currentColorIndex;
    const centerX = PINGPONG_CONFIG.GAME_WIDTH / 2;

    this.createBackgroundOverlay();

    this.scene.add
      .text(centerX, 60, "PING PONG", this.TEXT_STYLE.TITLE)
      .setOrigin(0.5);

    this.scene.add
      .text(
        centerX,
        140,
        "플레이어 색상을 선택하세요",
        this.TEXT_STYLE.SUBTITLE
      )
      .setOrigin(0.5);

    this.createColorOptions(currentColorIndex, (index) => {
      this.selectedColorIndex = index;
      this.updateColorPreview(index);
    });

    this.updateColorPreview(currentColorIndex);

    this.scene.add
      .text(centerX, 430, "마우스로 색상을 클릭하세요", this.TEXT_STYLE.HINT)
      .setOrigin(0.5);

    this.createButton(centerX, 500, 200, 50, "START", 0x2ecc71, () => {
      onConfirm?.();
    });
  }

  private createColorOptions(
    currentColorIndex: number,
    onSelect?: (index: number) => void
  ): void {
    const positions = [250, 550];
    this.colorPreviewPaddles = [];

    positions.forEach((x, index) => {
      const paddleColor = PINGPONG_CONFIG.PADDLE_COLORS[index];
      const paddle = this.scene.add.image(x, 280, "pingpong_player");
      paddle.setScale(0.8);
      paddle.setTint(paddleColor.color);
      paddle.setInteractive({ useHandCursor: true });
      paddle.setDepth(1);

      paddle.on("pointerdown", () => {
        onSelect?.(index);
      });

      paddle.on("pointerover", () => {
        paddle.setScale(0.95);
      });

      paddle.on("pointerout", () => {
        paddle.setScale(0.8);
      });

      this.colorPreviewPaddles.push(paddle);
    });
  }

  updateColorPreview(selectedIndex: number): void {
    this.selectedColorIndex = selectedIndex;
    this.colorPreviewPaddles.forEach((paddle, index) => {
      const isSelected = index === selectedIndex;
      paddle.setScale(isSelected ? 1.2 : 0.8);
      paddle.setAlpha(isSelected ? 1.0 : 0.5);
    });
  }

  getSelectedColorIndex(): number {
    return this.selectedColorIndex;
  }

  // =====================================================================
  // 공통 UI 컴포넌트
  // =====================================================================

  private createBackgroundOverlay(): void {
    const width = PINGPONG_CONFIG.GAME_WIDTH;
    const height = PINGPONG_CONFIG.GAME_HEIGHT;

    const bg = this.scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x1a1a1a,
      0.95
    );
    bg.setDepth(-1);
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: number,
    onClick: () => void
  ): void {
    const button = this.scene.add.rectangle(x, y, width, height, color, 0.85);
    button.setInteractive({ useHandCursor: true });
    button.setDepth(1);

    const graphics = this.scene.add.graphics({
      x: x - width / 2,
      y: y - height / 2,
    });
    graphics.lineStyle(2, 0xffffff, 0.9);
    graphics.strokeRect(0, 0, width, height);
    graphics.setDepth(1);

    this.scene.add
      .text(x, y, label, this.TEXT_STYLE.BUTTON)
      .setOrigin(0.5)
      .setDepth(2);

    button.on("pointerover", () => {
      graphics.clear();
      graphics.lineStyle(2, 0xffff00, 0.9);
      graphics.strokeRect(0, 0, width, height);
    });

    button.on("pointerout", () => {
      graphics.clear();
      graphics.lineStyle(2, 0xffffff, 0.9);
      graphics.strokeRect(0, 0, width, height);
    });

    button.on("pointerdown", () => {
      onClick();
    });
  }

  // =====================================================================
  // 정리
  // =====================================================================

  cleanup(): void {
    this.colorPreviewPaddles = [];
  }
}
