import { BaseInputManager } from "../base/BaseInputManager";
import { GameConfig } from "@/game/config/gameRegistry";

export class InteractionManager extends BaseInputManager {
  private interactKey: Phaser.Input.Keyboard.Key | undefined;
  private interactPrompt: Phaser.GameObjects.Text | undefined;
  private currentNearbyGame: GameConfig | null = null;

  private readonly PROMPT_CONFIG = {
    Y_OFFSET: 120, // 게임기 위로 60px
    Y_POSITION: 150,
    FONT_SIZE: "16px",
    BACKGROUND_COLOR: "#000",
    TEXT_COLOR: "#ffff00",
    PADDING: { x: 10, y: 5 },
    DEPTH: 1000,
  };

  constructor(scene: Phaser.Scene) {
    super(scene); // BaseInputManager의 생성자 호출
    this.setupInteractKey();
    this.createPrompt();
  }

  private setupInteractKey(): void {
    // BaseInputManager의 addKey 헬퍼를 활용
    this.interactKey = this.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  private createPrompt(): void {
    this.interactPrompt = this.scene.add
      .text(
        0, // 초기 위치는 0으로
        0,
        "",
        {
          fontSize: this.PROMPT_CONFIG.FONT_SIZE,
          backgroundColor: this.PROMPT_CONFIG.BACKGROUND_COLOR,
          padding: this.PROMPT_CONFIG.PADDING,
          color: this.PROMPT_CONFIG.TEXT_COLOR,
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(1) // 1로 변경 (월드 좌표 기준)
      .setDepth(this.PROMPT_CONFIG.DEPTH)
      .setVisible(false);
  }

  public update(
    nearbyInfo: { game: GameConfig; x: number; y: number } | null
  ): void {
    this.currentNearbyGame = nearbyInfo?.game || null;

    if (nearbyInfo) {
      // 게임기 위치 기준으로 텍스트 배치 (게임기 위쪽에 표시)
      this.interactPrompt?.setPosition(
        nearbyInfo.x,
        nearbyInfo.y - this.PROMPT_CONFIG.Y_OFFSET // Y_OFFSET: 60 정도
      );

      if (!this.interactPrompt?.visible) {
        this.showPrompt(`Press E to play ${nearbyInfo.game.name}`);
      }
    } else {
      this.hidePrompt();
    }
  }

  public isInteracting(): boolean {
    return (
      // isDown -> 꾹 누르고 있을 때 매 프레임이 실행되는 문제가 있을 수 있다
      // JustDown -> 눌렀을 때 한 번만 true 반환 (딱 한 번 눌린 시점)
      Phaser.Input.Keyboard.JustDown(this.interactKey!) &&
      this.currentNearbyGame !== null
    );
  }

  private showPrompt(message: string): void {
    if (this.interactPrompt) {
      this.interactPrompt.setText(message).setVisible(true);
    }
  }

  private hidePrompt(): void {
    this.interactPrompt?.setVisible(false);
  }

  public destroy(): void {
    // BaseInputManager의 이벤트 리스너 정리
    this.cleanup();
    // 상호작용 프롬프트 제거
    this.interactPrompt?.destroy();
  }
}
