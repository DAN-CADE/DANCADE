import { BaseInputManager } from "../base/BaseInputManager";
import { GameConfig } from "@/game/config/gameRegistry";

export class InteractionManager extends BaseInputManager {
  private interactKey: Phaser.Input.Keyboard.Key | undefined;
  private interactPrompt: Phaser.GameObjects.Text | undefined;
  private currentNearbyGame: GameConfig | null = null;

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
      .text(this.scene.cameras.main.width / 2, 100, "", {
        fontSize: "16px",
        backgroundColor: "#000",
        padding: { x: 10, y: 5 },
        color: "#ffff00",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false);
  }

  public update(nearbyGame: GameConfig | null): void {
    // ArcadeMachineManager로부터 받은 정보를 담고 있으면서,
    // 현재 플레이어가 게임기 근처에 있는지를 판단하는 기준을 가짐.
    this.currentNearbyGame = nearbyGame;

    if (nearbyGame) {
      if (!this.interactPrompt?.visible) {
        this.showPrompt(`Press E to play ${nearbyGame.name}`);
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
