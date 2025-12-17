// game/scenes/core/MainScene.ts
import { BaseGameScene } from "@/game/scenes/base/BaseGameScene";
import { MapManager } from "@/game/managers/global/MapManager";
import { AvatarManager } from "@/game/managers/global/AvatarManager";
import { ArcadeMachineManager } from "@/game/managers/global/ArcadeMachineManager";
import { InteractionManager } from "@/game/managers/global/InteractionManager";

export class MainScene extends BaseGameScene {
  private mapManager!: MapManager;
  private avatarManager!: AvatarManager;
  private arcadeManager!: ArcadeMachineManager;
  private interactionManager!: InteractionManager;

  constructor() {
    super({ key: "MainScene" });
  }

  // 무엇을 로드할 것인가
  protected loadAssets(): void {
    this.mapManager = new MapManager(this);
    this.mapManager.preloadMap();
  }

  // 씬 기본 설정
  protected setupScene(): void {
    this.cameras.main.setBackgroundColor("#000000");
  }

  // 어떤 도구(매니저)들을 사용할 것인가
  protected initManagers(): void {
    this.avatarManager = new AvatarManager(this);
    this.arcadeManager = new ArcadeMachineManager(this);
    this.interactionManager = new InteractionManager(this);
  }

  // 화면에 무엇을 그릴 것인가
  protected createGameObjects(): void {
    this.mapManager.createMap();
    this.avatarManager.createAvatar(960, 544);

    const map = this.mapManager.getMap();
    if (map) this.arcadeManager.setGameObjects(map);

    this.mapManager.setupCollisions(this.avatarManager.getContainer());
  }

  update(): void {
    // 플레이어의 현재 좌표를 가져오고
    this.avatarManager.update();

    const playerPos = this.avatarManager.getPosition();
    const nearby = this.arcadeManager.update(playerPos);

    // 좌표를 던져서 근처에 게임기가 있는지 확인
    this.interactionManager.update(nearby);

    // 그 결과를 interactionManager에 전달하여 "E를 눌러라"는 메시지 띄울지 결정
    if (this.interactionManager.isInteracting() && nearby) {
      // 상호작용 성공 시 transitionTo로 부드럽게 게임 전환
      this.transitionTo(nearby.sceneKey);
    }
  }

  // 메모리 누수 방지
  protected cleanupManagers(): void {
    // shutdown 시 호출될 정리 로직
    this.arcadeManager.destroy();
    this.interactionManager.destroy();
  }

  // 게임 종료 처리 구현 필수.
  protected handleGameEnd(): void {}
  protected restartGame(): void {}
}
