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
  public getPalettes(lpcSprite:LpcSprite) {
    if (lpcSprite) {
      // 포함 항목: hair, skin, eye, clothes
      const palettes = lpcSprite.definitions.palettes;
      return palettes;
    } else {
      return {};
    }
  }

  // 특정 파츠 색상 조회
  public getPalettesByPart(lpcSprite:LpcSprite, part: string) {
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
  public getAssets(lpcSprite:LpcSprite) {
    let assets = {};

    if (lpcSprite) {
      assets = lpcSprite.assets;
    }

    return assets;
  }

  // Lpc Assets 특정 파츠 조회
  public getAssetsByPart(lpcSprite:LpcSprite, part: string, gender: string = "male") {
    if (!lpcSprite) return [];

    const assets = lpcSprite.assets[part];
    if (LpcUtils.isStyledPart(assets)) {
      return (assets.styles || []).filter(
        (s) => !s.genders || s.genders.includes(gender)
      );
    }
    return [];
  }

  /**
   * 초기 파츠
   */
  public getInitialPart(lpcSprite:LpcSprite, gender:string = 'male') {
    if (lpcSprite) {
      const initData = LpcUtils.getInitialState(lpcSprite, gender)
      return initData;
    } else {
      return null;
    }
  }

  /**
   * 랜덤 파츠 정보 생성
   */
  public getRandomPart(lpcSprite:LpcSprite,) {
    if (lpcSprite) {
      const randomData = LpcUtils.getRandomState(lpcSprite)
      return randomData;
    } else {
      return null;
    }
  }
}
