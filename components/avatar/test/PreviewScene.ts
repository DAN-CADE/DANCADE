// game/scenes/PreviewScene.ts
import Phaser from "phaser";
import type { CharacterCustomization } from "@/types/character";
import type { LPCData } from "@/types/lpc";

export class PreviewScene extends Phaser.Scene {
  private avatarContainer!: Phaser.GameObjects.Container;
  private partLayers: { [key: string]: Phaser.GameObjects.Sprite } = {};
  private customization!: CharacterCustomization;

  constructor() {
    super({ key: "PreviewScene" });
  }

  init(data: { customization: CharacterCustomization }) {
    this.customization = data.customization;
    console.log("🎨 Preview init:", this.customization);
  }

  preload() {
    this.load.json("lpc_config", "/assets/lpc_assets.json");

    this.load.on(
      Phaser.Loader.Events.FILE_COMPLETE + "-json-lpc_config",
      (key: string, type: string, data: LPCData) => {
        if (data && data.assets) {
          this.loadCustomAssets();
        }
      }
    );
  }

  create() {
    this.cameras.main.setBackgroundColor("#2d2d2d");
    this.avatarContainer = this.add.container(200, 200);

    const lpcData = this.cache.json.get("lpc_config") as LPCData;
    if (lpcData) {
      this.createCustomCharacter();
    }

    this.cameras.main.setZoom(2.5);
    this.cameras.main.centerOn(200, 200);
  }

  private loadCustomAssets() {
    const frameConfig = { frameWidth: 64, frameHeight: 64 };
    const { customization } = this;

    this.load.spritesheet(
      `body_${customization.skin}`,
      `/assets/spritesheets/body/teen/${customization.skin}.png`,
      frameConfig
    );

    this.load.spritesheet(
      `head_${customization.gender}_${customization.skin}`,
      `/assets/spritesheets/head/heads/human/${customization.gender}/${customization.skin}.png`,
      frameConfig
    );

    this.load.spritesheet(
      `eyes_${customization.eyes}`,
      `/assets/spritesheets/eyes/human/adult/${customization.eyes}.png`,
      frameConfig
    );

    this.load.spritesheet(
      `nose_${customization.skin}`,
      `/assets/spritesheets/nose/button/adult/${customization.skin}.png`,
      frameConfig
    );

    this.load.spritesheet(
      `hair_${customization.hair.style}_${customization.gender}_${customization.hair.color}`,
      `/assets/spritesheets/hair/${customization.hair.style}/${customization.gender}/${customization.hair.color}.png`,
      frameConfig
    );

    this.load.spritesheet(
      `torso_${customization.torso.style}_${customization.torso.color}`,
      `/assets/spritesheets/torso/clothes/${customization.torso.style}/teen/${customization.torso.color}.png`,
      frameConfig
    );

    this.load.spritesheet(
      `legs_${customization.legs.style}_${customization.legs.color}`,
      `/assets/spritesheets/legs/${customization.legs.style}/teen/${customization.legs.color}.png`,
      frameConfig
    );

    this.load.spritesheet(
      `feet_${customization.feet.style}_${customization.feet.color}`,
      `/assets/spritesheets/feet/${customization.feet.style}/thin/${customization.feet.color}.png`,
      frameConfig
    );

    this.load.start();
  }

  private createCustomCharacter() {
    const { customization } = this;

    const partOrder = [
      { key: `body_${customization.skin}` },
      { key: `head_${customization.gender}_${customization.skin}` },
      { key: `eyes_${customization.eyes}` },
      { key: `nose_${customization.skin}` },
      {
        key: `hair_${customization.hair.style}_${customization.gender}_${customization.hair.color}`,
      },
      {
        key: `torso_${customization.torso.style}_${customization.torso.color}`,
      },
      {
        key: `legs_${customization.legs.style}_${customization.legs.color}`,
      },
      {
        key: `feet_${customization.feet.style}_${customization.feet.color}`,
      },
    ];

    partOrder.forEach(({ key }) => {
      if (this.textures.exists(key)) {
        const sprite = this.add.sprite(0, 0, key, 130);
        sprite.setOrigin(0.5, 0.5);
        this.avatarContainer.add(sprite);
        this.partLayers[key] = sprite;
        console.log(`✅ Added: ${key}`);
      } else {
        console.warn(`⚠️ Missing: ${key}`);
      }
    });
  }
}
