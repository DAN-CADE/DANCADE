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
import { LPCData } from "@/types/lpc";

// 1. 상태 타입 정의 (BaseGameManager 규격)
interface AvatarManagerState {
  isCreated: boolean;
}

export class AvatarManager extends BaseGameManager<AvatarManagerState> {
  private lpcSpriteManager: LpcSpriteManager;
  private avatarContainer!: LpcCharacter;

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
      (key, type, data: LPCData) => {
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
    data?: CharacterState | null
  ): void {
    try {
      // 1. 데이터 우선순위 결정: 인자로 받은 데이터 > 로컬 스토리지 > 기본값
      const finalData = data;

      // 2. 캐릭터 컨테이너 생성
      this.avatarContainer = new LpcCharacter(
        this.scene,
        x,
        y,
        "player_avatar",
        this.lpcSpriteManager
      );

      // 3. 파츠 적용
      if (finalData) {
        // 데이터가 있으면 커스텀 파츠 적용
        this.avatarContainer.setCustomPart(finalData);
      } else {
        // 데이터가 아예 없는 경우 방어 코드로 기본 캐릭터 설정
        this.avatarContainer.setDefaultPart("female");
      }

      // 4. 물리 엔진 및 카메라 설정
      this.scene.physics.add.existing(this.avatarContainer);
      this.scene.cameras.main.startFollow(this.avatarContainer, true, 0.1, 0.1);

      this.gameState.isCreated = true;
      console.log("캐릭터 생성 완료");
    } catch (error) {
      console.error("캐릭터 생성 중 오류 발생", error);
    }
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
