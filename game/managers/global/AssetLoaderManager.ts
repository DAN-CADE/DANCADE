// game/managers/AssetLoaderManager.ts
import { CharacterCustomization } from "@/types/character";

/**
 * AssetLoaderManager - LPC 에셋 로딩 전담
 */
export class AssetLoaderManager {
  private scene: Phaser.Scene;
  private readonly FRAME_CONFIG = { frameWidth: 64, frameHeight: 64 };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 커스터마이징된 에셋 로드
   */
  loadCustomAssets(customization: CharacterCustomization): void {
    console.log("Loading custom assets for:", customization);

    this.scene.load.spritesheet(
      `body_${customization.skin}`,
      `/assets/spritesheets/body/teen/${customization.skin}.png`,
      this.FRAME_CONFIG
    );

    this.scene.load.spritesheet(
      `head_${customization.gender}_${customization.skin}`,
      `/assets/spritesheets/head/heads/human/${customization.gender}/${customization.skin}.png`,
      this.FRAME_CONFIG
    );

    this.scene.load.spritesheet(
      `eyes_${customization.eyes}`,
      `/assets/spritesheets/eyes/human/adult/${customization.eyes}.png`,
      this.FRAME_CONFIG
    );

    this.scene.load.spritesheet(
      `nose_${customization.skin}`,
      `/assets/spritesheets/nose/button/adult/${customization.skin}.png`,
      this.FRAME_CONFIG
    );

    this.scene.load.spritesheet(
      `hair_${customization.hair.style}_${customization.gender}_${customization.hair.color}`,
      `/assets/spritesheets/hair/${customization.hair.style}/${customization.gender}/${customization.hair.color}.png`,
      this.FRAME_CONFIG
    );

    this.scene.load.spritesheet(
      `torso_${customization.torso.style}_${customization.torso.color}`,
      `/assets/spritesheets/torso/clothes/${customization.torso.style}/teen/${customization.torso.color}.png`,
      this.FRAME_CONFIG
    );

    this.scene.load.spritesheet(
      `legs_${customization.legs.style}_${customization.legs.color}`,
      `/assets/spritesheets/legs/${customization.legs.style}/teen/${customization.legs.color}.png`,
      this.FRAME_CONFIG
    );

    this.scene.load.spritesheet(
      `feet_${customization.feet.style}_${customization.feet.color}`,
      `/assets/spritesheets/feet/${customization.feet.style}/thin/${customization.feet.color}.png`,
      this.FRAME_CONFIG
    );

    this.scene.load.start();
  }

  /**
   * 기본 에셋 로드 (랜덤용)
   */
  loadDefaultAssets(data: any): void {
    console.log("📦 Loading default assets");

    const palettes = data.definitions.palettes;

    // 기본 파츠
    this.loadBasicParts(data.assets, palettes);

    // 헤어
    this.loadHairAssets(data.assets.hair, palettes);

    // 옷
    this.loadClothingAssets(data.assets, palettes);

    this.scene.load.start();
  }

  private loadBasicParts(assets: any, palettes: any): void {
    const basicParts = ["body", "head", "eyes", "nose"];

    basicParts.forEach((partName) => {
      const config = assets[partName];
      if (!config) return;

      const colors = this.resolveColors(config.colors, palettes);
      const genders = config.genders || [""];

      genders.forEach((gender: string) => {
        colors.forEach((color: string) => {
          let path = config.path.replace("{color}", color);
          if (path.includes("{gender}")) {
            path = path.replace("{gender}", gender);
          }

          const key = this.getAssetKey(partName, null, gender, color);
          this.scene.load.spritesheet(key, path, this.FRAME_CONFIG);
        });
      });
    });
  }

  private loadHairAssets(hairConfig: any, palettes: any): void {
    if (!hairConfig || !hairConfig.config) return;

    const template = hairConfig.config.path_template;
    const defaultColors = this.resolveColors(
      hairConfig.config.default_colors,
      palettes
    );

    const basicStyles = hairConfig.styles.filter(
      (s: any) => s.id === "plain" || s.id === "long_straight"
    );

    basicStyles.forEach((style: any) => {
      const genders = style.genders || [""];
      const colors = style.colors || defaultColors.slice(0, 5);

      genders.forEach((gender: string) => {
        colors.forEach((color: string) => {
          let path = template
            .replace("{style}", style.id)
            .replace("{color}", color);
          if (path.includes("{gender}")) {
            path = path.replace("{gender}", gender);
          }

          const key = this.getAssetKey("hair", style.id, gender, color);
          this.scene.load.spritesheet(key, path, this.FRAME_CONFIG);
        });
      });
    });
  }

  private loadClothingAssets(assets: any, palettes: any): void {
    ["torso", "legs", "feet"].forEach((partType) => {
      const config = assets[partType];
      if (!config || !config.config) return;

      const template = config.config.path_template;
      const colors = this.resolveColors(
        config.config.default_colors,
        palettes
      ).slice(0, 5);

      const firstStyle = config.styles[0];
      if (!firstStyle) return;

      colors.forEach((color: string) => {
        const styleId = firstStyle.path_segment || firstStyle.id;
        let path = template
          .replace("{style}", styleId)
          .replace("{color}", color);

        const key = this.getAssetKey(partType, styleId, "", color);
        this.scene.load.spritesheet(key, path, this.FRAME_CONFIG);
      });
    });
  }

  // 헬퍼 메서드
  private resolveColors(colorDef: any, palettes: any): string[] {
    if (Array.isArray(colorDef)) return colorDef;
    if (colorDef?.$ref) return palettes[colorDef.$ref] || [];
    return [];
  }

  private getAssetKey(
    prefix: string,
    style: string | null,
    gender: string,
    color: string
  ): string {
    const parts = [prefix];
    if (style) parts.push(style);
    if (gender) parts.push(gender);
    parts.push(color);
    return parts.join("_");
  }
}
