// game/managers/base/BaseUIManager.ts

import { TEXT_STYLE } from "@/game/types/common/ui.constants";
import { ButtonFactory } from "@/utils/ButtonFactory";

/**
 * UI 매니저의 베이스 클래스
 * 게임 UI의 공통 패턴 제공
 */
export abstract class BaseUIManager {
  protected scene: Phaser.Scene;

  /**
   * 게임 UI에서 사용하는 텍스트 스타일 별칭
   * (실제 정의는 ui.constants.ts)
   */
  protected readonly GAME_TEXT = {
    SCORE: TEXT_STYLE.SMALL,
    BUTTON: TEXT_STYLE.SMALL,
    GAME_OVER: {
      ...TEXT_STYLE.TITLE,
      fontSize: "36px",
    },
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 게임 UI 생성 (각 게임에서 구현)
   */
  abstract createGameUI(): void;

  /**
   * 재시작 버튼 생성 (공통 패턴)
   */
  protected createRestartButton(
    onRestart: () => void,
    x = 400,
    y = 400,
    depth = 0
  ): Phaser.GameObjects.Container {
    const style = this.GAME_TEXT.BUTTON;

    const button = ButtonFactory.createButton(
      this.scene,
      x,
      y,
      "RETRY",
      onRestart,
      {
        size: "SMALL",
        color: 0x000000,
        textColor: style.color,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
      }
    );

    return button.setDepth(depth);
  }

  /**
   * 홈 버튼 생성 (공통 패턴)
   */
  protected createHomeButton(
    onHome: () => void,
    x = 750,
    y = 50,
    depth = 0
  ): Phaser.GameObjects.Container {
    const style = this.GAME_TEXT.BUTTON;

    const button = ButtonFactory.createButton(
      this.scene,
      x,
      y,
      "HOME",
      onHome,
      {
        size: "SMALL",
        color: 0x000000,
        textColor: style.color,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
      }
    );

    return button.setDepth(depth);
  }

  /**
   * 오버레이 생성 (공통 패턴)
   */
  protected createOverlay(
    alpha = 0.7,
    depth = 10
  ): Phaser.GameObjects.Rectangle {
    return this.scene.add
      .rectangle(400, 300, 800, 600, 0x000000, alpha)
      .setDepth(depth);
  }

  /**
   * 정리 (각 게임에서 구현)
   */
  abstract cleanup(): void;
}
