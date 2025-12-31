// utils/ButtonFactory.ts
// - 공통 버튼 생성 유틸리티

import { BUTTON_SIZE } from "@/game/types/omok";

export type ButtonSizeKey = keyof typeof BUTTON_SIZE;

export interface ButtonOptions {
  size?: ButtonSizeKey;
  color?: number;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  cornerRadius?: number;
}

/**
 * 공통 버튼 생성 유틸리티
 */
export class ButtonFactory {
  /**
   * 기본 버튼 생성
   */
  static createButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    callback: () => void,
    options: ButtonOptions = {}
  ): Phaser.GameObjects.Container {
    const {
      size = "MEDIUM",
      color = 0xffffff,
      textColor = "#333333",
      fontSize = "16px",
      fontFamily = "NeoDunggeunmo",
      // cornerRadius = 12,
    } = options;

    const { width, height } = BUTTON_SIZE[size];

    const container = scene.add
      .container(x, y)
      .setSize(width, height)
      .setInteractive({ useHandCursor: true });

    // 배경 그래픽
    const bg = scene.add.graphics();
    const render = (isHover = false) => {
      bg.clear();
      bg.fillStyle(color, isHover ? 0.8 : 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
      bg.lineStyle(2, 0xffffff, isHover ? 1 : 0.3);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    };
    render();

    // 텍스트
    const label = scene.add
      .text(0, 0, text, {
        fontSize,
        fontFamily,
        color: textColor,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    container.add([bg, label]);

    // 인터랙션
    container.on("pointerover", () => {
      render(true);
      scene.tweens.add({ targets: container, scale: 1.05, duration: 100 });
    });

    container.on("pointerout", () => {
      render(false);
      scene.tweens.add({ targets: container, scale: 1, duration: 100 });
    });

    container.on("pointerdown", () => {
      scene.tweens.add({
        targets: container,
        scale: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: () => callback(),
      });
    });

    return container;
  }

  /**
   * 메뉴용 버튼 (넓은 버튼)
   */
  static createMenuButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    callback: () => void,
    color: number = 0x4a9eff
  ): Phaser.GameObjects.Container {
    return ButtonFactory.createButton(scene, x, y, text, callback, {
      size: "LARGE",
      color,
      textColor: "#ffffff",
    });
  }

  /**
   * 작은 버튼 (게임 내)
   */
  static createSmallButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    callback: () => void,
    color: number = 0x4ecca3
  ): Phaser.GameObjects.Container {
    return ButtonFactory.createButton(scene, x, y, text, callback, {
      size: "SMALL",
      color,
      textColor: "#ffffff",
      fontSize: "14px",
    });
  }
}
