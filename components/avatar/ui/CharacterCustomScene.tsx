import Phaser from "phaser";
import LpcCharacter from "../core/LpcCharacter";
import { CharacterState, LpcSprite, PartType } from "../utils/LpcTypes";
import { LpcUtils } from "../utils/LpcUtils";
import { LpcSpriteManager } from "@/game/managers/global/LpcSpriteManager";

export default class CharacterCustomScene extends Phaser.Scene {
  private character!: LpcCharacter;
  private lpcData!: LpcSprite | null;
  private lpcSpriteManager!: LpcSpriteManager;

  constructor() {
    super("CharacterCustomScene");
  }

  init() {
    this.lpcSpriteManager = new LpcSpriteManager();
  }

  create() {
    // 1. 캐릭터 생성
    this.character = new LpcCharacter(
      this,
      200,
      200,
      "",
      this.lpcSpriteManager
    );

    // 2. LPC 데이터 로드 (PreloadScene에서 이미 로드됨, 파싱만 수행)
    this.lpcData = this.lpcSpriteManager.getLpcSprite();

    this.cameras.main.setZoom(2.5);
    this.cameras.main.centerOn(200, 200);

    // 3. Registry에 이미 값이 있다면 적용
    const currentData = this.registry.get("customization");
    if (currentData) {
      this.updatePlayerVisuals(currentData);
    } else if (this.lpcData) {
      // 데이터가 없으면 랜덤
      this.updatePlayerVisuals(LpcUtils.getRandomState(this.lpcData));
    }

    // 4. React에서 registry 값을 바꿀 때마다 실행됨
    this.registry.events.on(
      "changedata-customization",
      (parent: any, newValue: CharacterState) => {
        this.updatePlayerVisuals(newValue);
      }
    );
  }

  private updatePlayerVisuals(state: CharacterState) {
    if (!this.lpcData) return;

    const gender = state.gender;

    Object.keys(state.parts).forEach((key) => {
      const partName = key as PartType;
      const partState = state.parts[partName];
      if (!partState || !this.lpcData) return;

      const config = this.lpcData.assets[partName];
      let assetKey = "";

      if (LpcUtils.isStyledPart(config)) {
        if (partState.styleId) {
          assetKey = LpcUtils.getAssetKey(
            partName,
            partState.styleId,
            gender,
            partState.color
          );
          // Fallback: 성별 없는 옷
          if (!this.textures.exists(assetKey)) {
            assetKey = LpcUtils.getAssetKey(
              partName,
              partState.styleId,
              "",
              partState.color
            );
          }
        }
      } else {
        assetKey = LpcUtils.getAssetKey(
          partName,
          null,
          gender,
          partState.color
        );

        if (!this.textures.exists(assetKey)) {
          assetKey = LpcUtils.getAssetKey(partName, null, "", partState.color);
        }
      }

      if (this.textures.exists(assetKey)) {
        this.character.setPart(partName, assetKey);
      }
    });
  }
}
