import { LpcSprite, PartStyle } from "@/components/avatar/utils/LpcTypes";
import { LpcUtils } from "@/components/avatar/utils/LpcUtils";

export class LpcSpriteManager {
  constructor() {}

  private cachedData: LpcSprite | null = null;
  private readonly STORAGE_KEY = "LpcSpriteData";

  // 데이터 저장 (AvatarManager에서 호출)
  public setLpcSprite(lpcSprite: LpcSprite) {
    this.cachedData = lpcSprite;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lpcSprite));
  }

  // 데이터를 가져옴 (메모리 우선, 없으면 스토리지)
  public getLpcSprite(): LpcSprite | null {
    if (this.cachedData) return this.cachedData;

    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      this.cachedData = JSON.parse(data);
      return this.cachedData;
    }
    return null;
  }

  public getStylesByGender(
    styles: PartStyle[] | undefined,
    gender: string
  ): PartStyle[] {
    if (!styles) {
      return [];
    }
    return styles.filter((s) => !s.genders || s.genders.includes(gender));
  }

  public getPalettesKey(part: string) {
    return part + "_common";
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
    if (!lpcSprite) return [];

    const assets = lpcSprite.assets[part];
    if (LpcUtils.isStyledPart(assets)) {
      return (assets.styles || []).filter(
        (s) => !s.genders || s.genders.includes(gender)
      );
    }
    return [];
  }
}
