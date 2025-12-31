// game/managers/global/AvatarManager.ts
import { BaseGameManager } from "../base/BaseGameManager";
import LpcCharacter from "@/components/avatar/core/LpcCharacter";
import { LpcLoader } from "@/components/avatar/core/LpcLoader";
import { LpcSpriteManager } from "./LpcSpriteManager";
import type {
  CharacterState,
  LpcSprite,
} from "@/components/avatar/utils/LpcTypes";
import { ASSET_PATHS } from "@/game/constants";
import { NPC_CONFIG, NpcType } from "@/components/avatar/core/LpcNpc";
import { MainScene } from "@/game/scenes/core/MainScene";

// 1. 상태 타입 정의 (BaseGameManager 규격)
interface AvatarManagerState {
  isCreated: boolean;
}

export class AvatarManager extends BaseGameManager<AvatarManagerState> {
  private lpcSpriteManager: LpcSpriteManager;
  private avatarContainer!: LpcCharacter;
  private isInteracting!: boolean;
  public npcType?: NpcType

  constructor(scene: Phaser.Scene) {
    // 부모 클래스 초기화 (초기 상태: 아직 생성 안 됨)
    super(scene, { isCreated: false }, {});
    this.lpcSpriteManager = new LpcSpriteManager();
  }

  // 에셋 로직
  public preloadAvatar() {
    this.scene.load.json("lpc_config", ASSET_PATHS.LPC.CONFIG);
    this.scene.load.once(
      `filecomplete-json-lpc_config`,
      (key: string, type: string, data: LpcSprite) => {
        if (data?.assets) {
          // 수정: 클래스 명이 아니라 생성한 인스턴스를 사용합니다.
          this.lpcSpriteManager.setLpcSprite(data as unknown as LpcSprite);
          LpcLoader.loadAssets(this.scene, data as any);
        }
      }
    );
  }

  // 캐릭터 생성 (MainScene에서 호출)
  // AvatarDataManager로부터 전달받은 최신 커스텀 데이터
  public createAvatar(
    x: number,
    y: number,
    data?: CharacterState | null,
    isNpc?: boolean
  ): void {
    try {
      // 1. 데이터 우선순위 결정: 인자로 받은 데이터 > 로컬 스토리지 > 기본값
      const finalData = data;

      // 2. 로컬스토리지에서 닉네임 가져오기
      let playerName = "Player";
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          playerName = parsedUser.nickname || "Player";
        }
      } catch (error) {
        console.error("사용자 정보 로드 오류:", error);
      }

      // 3. 캐릭터 컨테이너 생성
      this.avatarContainer = new LpcCharacter(
        this.scene,
        x,
        y,
        playerName,
        this.lpcSpriteManager
      );

      if (!isNpc) {
        if (finalData) {
          this.avatarContainer.setCustomPart(finalData);
        } else {
          this.avatarContainer.setDefaultPart("female");
        }
        this.scene.physics.add.existing(this.avatarContainer);
        this.scene.cameras.main.startFollow(this.avatarContainer, true, 0.1, 0.1);
      } else {
        this.avatarContainer.setDefaultPart("female");
      }

      // 5. 물리 엔진 및 카메라 설정
      this.scene.physics.add.existing(this.avatarContainer);
      this.scene.cameras.main.startFollow(this.avatarContainer, true, 0.1, 0.1);

      this.gameState.isCreated = true;
      console.log("캐릭터 생성 완료");
    } catch (error) {
      console.error("캐릭터 생성 중 오류 발생", error);
    }
  }

   // NPC 전용 생성 메서드
  public createNPC(x: number, y: number, type: NpcType): AvatarManager {
    const config = NPC_CONFIG[type];
    this.npcType = type;
    
    // 부모의 createAvatar 호출
    this.avatarContainer = new LpcCharacter(
      this.scene,
      x,
      y,
      config.name,
      this.lpcSpriteManager
    );

    // this.createAvatar(x, y, null, config.name, true)
    this.avatarContainer.setDefaultPart(config.defaultSprite);

    return this;
  }

 // Player 클래스 내부 (또는 상호작용 로직 담당 클래스)
public tryInteract(targetNpcManagers: AvatarManager[]) {
    // 1. 플레이어 컨테이너가 없으면 중단
    if (!this.avatarContainer) {
      console.error("플레이어 아바타가 로드되지 않았습니다.");
      return;
    }

    if (this.isInteracting) return;

    let closestNpc: AvatarManager | null = null;
    let minDistance = 80;

    targetNpcManagers.forEach((npcMgr) => {
      // 2. npcMgr이나 내부 컨테이너가 존재하는지 엄격히 체크
      const npcContainer = npcMgr?.getContainer?.();
      
      if (!npcContainer || !npcContainer.x) {
        console.warn("유효하지 않은 NPC 객체가 포함되어 있습니다.");
        return;
      }

      const distance = Phaser.Math.Distance.Between(
        this.avatarContainer.x, 
        this.avatarContainer.y,
        npcContainer.x, 
        npcContainer.y
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestNpc = npcMgr;
      }
    });

    if (closestNpc) {
      this.handleNPCInteraction(closestNpc);
    }
  }

public handleNPCInteraction(targetNpcManager: AvatarManager) {
    const type = targetNpcManager.npcType;
    if (!type || !NPC_CONFIG[type]) return;

    this.isInteracting = true;

    // 1. NPC 전용 인터랙션 실행 (Container를 넘겨줌)
    NPC_CONFIG[type].interaction(this.scene as MainScene, targetNpcManager);

    // 2. NPC 이름표 변경 등의 피드백 (커스텀 메서드 확인 필요)
    // targetNpcManager.getContainer()가 setDisplayName이라는 메서드를 가지고 있는지 확인하세요.
    // 보통은 container 내부의 text 객체를 수정해야 합니다.
    const nameTag = (targetNpcManager as any).nameTag; // 예시
    if (nameTag) nameTag.setText("!");

    // 3. 상호작용 해제 로직
    // 가위바위보의 경우 UI를 닫을 때 false로 해주는 것이 좋으나, 
    // 우선 간단하게 타이머로 구현 시 길이를 조절하세요.
    this.scene.time.delayedCall(1000, () => {
        this.isInteracting = false;
        // 다시 원래 이름으로 복구
        if (nameTag) nameTag.setText(NPC_CONFIG[type].name);
    });
}

  public update(): void {
    if (this.gameState.isCreated && this.avatarContainer) {
      this.avatarContainer.update();
    }
  }

  public getContainer(): LpcCharacter {
    return this.avatarContainer;
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.avatarContainer.x, y: this.avatarContainer.y };
  }

  // BaseGameManager 필수 구현
  public setGameObjects(): void {}
  public resetGame(): void {
    if (this.avatarContainer) {
      this.avatarContainer.destroy();
      this.gameState.isCreated = false;
    }
  }
}
