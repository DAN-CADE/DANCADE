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
  loadCustomAssets(customization: CharacterState): void {
    console.log("Loading custom assets for:", customization);

    const parts = customization.parts;

    this.scene.load.spritesheet(
      `body_${parts.body?.color}`,
      `/assets/spritesheets/body/teen/${parts.body?.color}.png`,
      this.FRAME_CONFIG
    );

    this.scene.load.spritesheet(
      `head_${customization.gender}_${parts.head?.color}`,
      `/assets/spritesheets/head/heads/human/${customization.gender}/${parts.head?.color}.png`,
      this.FRAME_CONFIG
    );

    this.scene.load.spritesheet(
      `eyes_${parts.eyes?.color}`,
      `/assets/spritesheets/eyes/human/adult/${parts.eyes?.color}.png`,
      this.FRAME_CONFIG
    );

    this.scene.load.spritesheet(
      `hair_${parts.hair?.styleId}_${customization.gender}_${parts.hair?.color}`,
      `/assets/spritesheets/hair/${parts.hair?.styleId}/${customization.gender}/${parts.hair?.color}.png`,
      this.FRAME_CONFIG
    );

    this.scene.load.spritesheet(
      `torso_${parts.torso?.styleId}_${parts.torso?.color}`,
      `/assets/spritesheets/torso/clothes/${parts.torso?.styleId}/teen/${parts.torso?.color}.png`,
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
