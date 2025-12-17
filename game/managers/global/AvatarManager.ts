import LpcCharacter from "@/components/avatar/core/LpcCharacter";
import { LpcLoader } from "@/components/avatar/core/LpcLoader";
import { LpcUtils } from "@/components/avatar/utils/LpcUtils";
import { LpcSpriteManager } from "./LpcSpriteManager";

/**
 * AvatarManager - 아바타 생성 및 애니메이션 관리
 */
export class AvatarManager {
  private scene: Phaser.Scene;
  private lpcSpriteManager!: LpcSpriteManager;
  private avatarContainer!: LpcCharacter;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.lpcSpriteManager = new LpcSpriteManager();
  }

  public preloadAvatar() {
    this.scene.load.json("lpc_config", "/assets/lpc_assets.json");
    this.scene.load.on(
      Phaser.Loader.Events.FILE_COMPLETE + "-json-lpc_config",
      (key: string, type: string, data: any) => {
        if (data && data.assets) {
          this.lpcSpriteManager.setLpcSprite(data);
          LpcLoader.loadAssets(this.scene, data);
        }
      }
    );
  }

  /**
   * 캐릭터 생성
   */
  createAvatar(x: number, y: number): void {
    try {
      const characterCustomization = localStorage.getItem(
        "characterCustomization"
      );
      let customizationData = null;

      if (characterCustomization) {
        customizationData = JSON.parse(characterCustomization);
      }

      this.avatarContainer = new LpcCharacter(this.scene, x, y, "test");
      if (customizationData) {
        this.avatarContainer.setCustomPart(customizationData);
      } else {
        this.avatarContainer.setDefaultPart("female");
      }

      this.scene.physics.add.existing(this.avatarContainer);
      this.scene.cameras.main.startFollow(this.avatarContainer, true, 0.1, 0.1);
    } catch (error) {
      console.error(error);
    }

    console.log("✅ Avatar created");
  }

  /**
   * 초기 파츠
   */
  getInitialPart(gender: string = "male") {
    const lpcData = this.lpcSpriteManager.getLpcSprite();
    if (lpcData) {
      const initData = LpcUtils.getInitialState(lpcData, gender);
      return initData;
    } else {
      return null;
    }
  }

  /**
   * 랜덤 파츠 정보 생성
   */
  getRandomPart() {
    const lpcData = this.lpcSpriteManager.getLpcSprite();
    if (lpcData) {
      const randomData = LpcUtils.getRandomState(lpcData);
      return randomData;
    } else {
      return null;
    }
  }

  /**
   * 업데이트 (매 프레임)
   */
  update() {
    this.avatarContainer.update();
  }

  // Getter
  getContainer(): Phaser.GameObjects.Container {
    return this.avatarContainer;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.avatarContainer.x, y: this.avatarContainer.y };
  }
}
import type { CharacterState } from "@/components/avatar/utils/LpcTypes";
