import { LpcSprite, PartStyle } from "@/components/avatar/utils/LpcTypes";
import { LpcUtils } from "@/components/avatar/utils/LpcUtils";

export class LpcSpriteManager {  
  constructor() {}

  public getLpcSprite(): LpcSprite | null{
    const LpcSpriteData = localStorage.getItem("LpcSpriteData");

    if (LpcSpriteData) {
      const lpcSprite: LpcSprite = JSON.parse(LpcSpriteData);
      return lpcSprite;
    } else {
      return null;
    }
  }

  public setLpcSprite(lpcSprite: LpcSprite) {
    localStorage.setItem("LpcSpriteData", JSON.stringify(lpcSprite));
  }

  private getStylesByGender(
    styles: PartStyle[] | undefined,
    gender: string
  ): PartStyle[] {
    if (!styles) {
      return []
    };
    return styles.filter((s) => !s.genders || s.genders.includes(gender));
  }

  private getPalettesKey(part: string) {
    return part + "_common"
  }

  // Palettes 전체 정보 조회
  public getPalettes() {
    const lpcSprite = this.getLpcSprite();

    if (lpcSprite) {
      // 포함 항목: hair, skin, eye, clothes 
      const palettes = lpcSprite.definitions.palettes;
      return palettes;
    } else {
      return {};
    }
  }

  // 특정 파츠 색상 조회
  public getPalettesByPart(part: string) {
    const lpcSprite = this.getLpcSprite();

    if (lpcSprite) {
      // 포함 항목: hair, skin, eye, clothes 
      const palettes = lpcSprite.definitions.palettes;
      const palettesKey = this.getPalettesKey(part);
      const colors = palettes[palettesKey];

      return colors;
    } else {
      return [];
    }
  }

  // Lpc Assets 정보 조회
  public getAssets() {
    const lpcSprite = this.getLpcSprite();
    let assets = {};

    if (lpcSprite) {
      assets = lpcSprite.assets;
    } 
    
    return assets;      
  }

  // Lpc Assets 특정 파츠 조회
  public getAssetsByPart(part: string, gender: string = "male") {
    const lpcSprite = this.getLpcSprite();
    if (lpcSprite) {
      const assets = lpcSprite.assets[part];
      let sprite = null;

      if (LpcUtils.isStyledPart(assets)) {
        if (part === 'hair') {
          sprite = this.getStylesByGender(assets.styles, gender);
        } else {
          sprite = assets.styles;
        }
      }

      return sprite;
    } else {
      return [];
    }
  }
}