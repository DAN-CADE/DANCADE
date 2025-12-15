// game/managers/AvatarManager.ts
import LpcCharacter from "@/components/avatar/core/LpcCharacter";
import { LpcLoader } from "@/components/avatar/core/LpcLoader";
import { CharacterState, LpcRootData, PartType } from "@/components/avatar/utils/LpcTypes";
import { LpcUtils } from "@/components/avatar/utils/LpcUtils";
import { CharacterCustomization } from "@/types/character";
import { LPCData, LPCAssetConfig, LPCPalettes } from "@/types/lpc";

/**
 * AvatarManager - 아바타 생성 및 애니메이션 관리
 */
export class AvatarManager {
  private scene: Phaser.Scene;
  private avatarContainer!: LpcCharacter;
  private partLayers: { [key: string]: Phaser.GameObjects.Sprite } = {};
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  // 애니메이션
  private currentDirection: string = "down";
  private isMoving: boolean = false;
  private animationTimer: number = 0;

  // 상수
  private readonly PLAYER_SPEED = 200;
  private readonly ANIMATION_SPEED = 150;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 커스터마이징된 캐릭터 생성
   */
  createCustomAvatar(
    x: number,
    y: number,
    customization?: CharacterState
  ): void {
    this.avatarContainer = new LpcCharacter(this.scene, x, y, 'test');
    this.avatarContainer.setDefaultPart(this.scene, "female");
    this.avatarContainer.refresh();




    // this.avatarContainer = this.scene.add.container(x, y);
    // this.scene.physics.add.existing(this.avatarContainer);

    // const body = this.avatarContainer.body as Phaser.Physics.Arcade.Body;
    // if (body) {
    //   body.setSize(32, 48);
    //   body.setOffset(-16, -24);
    // }

    // this.applyCustomization(customization);
    // this.setupCamera();
    // this.setupInput();

    console.log("✅ Custom avatar created");
  }

  /**
   * 랜덤 캐릭터 생성
   */
  createRandomAvatar(x: number, y: number, lpcData: LPCData): void {
    // this.avatarContainer = this.scene.add.container(x, y);
    // this.scene.physics.add.existing(this.avatarContainer);

    // const body = this.avatarContainer.body as Phaser.Physics.Arcade.Body;
    // if (body) {
    //   body.setSize(32, 48);
    //   body.setOffset(-16, -24);
    // }

    // this.createRandomCharacter(lpcData);
    // this.setupCamera();
    // this.setupInput();
  }

  /**
   * 커스터마이징 적용
   */
  private applyCustomization(customization: CharacterState): void {
    // console.log(customization)
    // const gender = customization.gender;
    // let partOrder:any[] = [];
    
    // Object.keys(customization.parts).forEach(key => {
    //     const partName = key as PartType; // 'body', 'hair', 'legs' ...
    //     const partState = customization.parts[partName];

    //     // 데이터가 없으면 스킵
    //     if (!partState) return;

    //     // 1. 파라미터 추출
    //     // styleId가 있으면 사용하고, 없으면(body, eyes 등) null 처리
    //     const styleId = partState.styleId || null; 
    //     const color = partState.color || undefined;

    //     // 2. 요청하신 함수 호출 (Asset Key 생성)
    //     const assetKey = LpcUtils.getAssetKey(
    //         partName, 
    //         styleId, 
    //         gender, 
    //         color
    //     );

    //     partOrder.push({name:partName, assetKey})
        
    // });

    // partOrder.forEach(({ name, key }) => {
    //   if (this.scene.textures.exists(key)) {
    //     const sprite = this.scene.add.sprite(0, 0, key, 130);
    //     sprite.setOrigin(0.5, 0.5);
    //     this.avatarContainer.add(sprite);
    //     this.partLayers[name] = sprite;
    //     console.log(`✅ ${name}: ${key}`);
    //   } else {
    //     console.warn(`⚠️ Missing texture: ${key}`);
    //   }
    // });
  }

  /**
   * 랜덤 캐릭터 생성
   */
  private createRandomCharacter(data: LPCData): void {
    const palettes = data.definitions.palettes;
    const assets = data.assets;

    const skinColors = this.resolveColors(palettes.skin_common, palettes);
    const selectedSkin = Phaser.Math.RND.pick(skinColors);
    const selectedGender = Phaser.Math.RND.pick(["male", "female"]);

    console.log("👤 Gender:", selectedGender, "Skin:", selectedSkin);

    const partOrder = [
      "body",
      "head",
      "eyes",
      "nose",
      "hair",
      "torso",
      "legs",
      "feet",
    ];

    partOrder.forEach((partName) => {
      const config = assets[partName];
      if (!config) return;

      const textureKey = this.getTextureKey(
        partName,
        config,
        selectedGender,
        selectedSkin,
        palettes
      );

      if (textureKey && this.scene.textures.exists(textureKey)) {
        const sprite = this.scene.add.sprite(0, 0, textureKey, 130);
        sprite.setOrigin(0.5, 0.5);
        this.avatarContainer.add(sprite);
        this.partLayers[partName] = sprite;
        console.log(`✅ ${partName}: ${textureKey}`);
      }
    });
  }

  /**
   * 텍스처 키 생성 (복잡한 로직 분리)
   */
  private getTextureKey(
    partName: string,
    config: LPCAssetConfig,
    selectedGender: string,
    selectedSkin: string,
    palettes: LPCPalettes
  ): string {
    if (["body", "head", "nose"].includes(partName)) {
      const gender = config.genders?.includes(selectedGender)
        ? selectedGender
        : "";
      return this.getAssetKey(partName, null, gender, selectedSkin);
    }

    if (partName === "eyes") {
      const eyeColors = this.resolveColors(config.colors, palettes);
      const eyeColor = Phaser.Math.RND.pick(eyeColors);
      return this.getAssetKey(partName, null, "", eyeColor);
    }

    if (partName === "hair" && config.styles) {
      const styles = config.styles.filter(
        (s) => !s.genders || s.genders.includes(selectedGender)
      );
      if (styles.length > 0) {
        const style = Phaser.Math.RND.pick(styles);
        const colors =
          style.colors ||
          this.resolveColors(config.config?.default_colors, palettes).slice(
            0,
            5
          );
        const hairColor = Phaser.Math.RND.pick(colors);
        return this.getAssetKey("hair", style.id, selectedGender, hairColor);
      }
    }

    if (["torso", "legs", "feet"].includes(partName) && config.styles) {
      const colors = this.resolveColors(
        config.config?.default_colors,
        palettes
      ).slice(0, 5);
      const color = Phaser.Math.RND.pick(colors);
      const style = config.styles[0];
      const styleId = style.path_segment || style.id;
      return this.getAssetKey(partName, styleId, "", color);
    }

    return "";
  }

  /**
   * 업데이트 (매 프레임)
   */
  update(delta: number): void {
    this.avatarContainer.update();
    // this.updateMovement(delta);
  }

  /**
   * 이동 처리
   */
  private updateMovement(delta: number): void {
    if (!this.avatarContainer || !this.avatarContainer.body) return;

    const body = this.avatarContainer.body as Phaser.Physics.Arcade.Body;
    let velocityX = 0;
    let velocityY = 0;
    let newDirection = this.currentDirection;
    let moving = false;

    if (this.cursors.left.isDown) {
      velocityX = -this.PLAYER_SPEED;
      moving = true;
    } else if (this.cursors.right.isDown) {
      velocityX = this.PLAYER_SPEED;
      moving = true;
    }

    if (this.cursors.up.isDown) {
      velocityY = -this.PLAYER_SPEED;
      moving = true;
    } else if (this.cursors.down.isDown) {
      velocityY = this.PLAYER_SPEED;
      moving = true;
    }

    body.setVelocity(velocityX, velocityY);

    if (velocityX !== 0 && velocityY !== 0) {
      body.setVelocity(velocityX * 0.707, velocityY * 0.707);
    }

    if (velocityX < 0) newDirection = "left";
    else if (velocityX > 0) newDirection = "right";
    else if (velocityY < 0) newDirection = "up";
    else if (velocityY > 0) newDirection = "down";

    if (newDirection !== this.currentDirection) {
      this.currentDirection = newDirection;
      this.animationTimer = 0;
    }

    this.isMoving = moving;

    if (moving) {
      this.animationTimer += delta;
      this.playWalkAnimation();
    } else {
      this.setIdleFrame();
    }
  }

  /**
   * 걷기 애니메이션
   */
  private playWalkAnimation(): void {
    const directions: { [key: string]: number[] } = {
      up: [105, 106, 107, 108, 109, 110, 111, 112],
      left: [118, 119, 120, 121, 122, 123, 124, 125],
      down: [131, 132, 133, 134, 135, 136, 137, 138],
      right: [144, 145, 146, 147, 148, 149, 150, 151],
    };

    const frames = directions[this.currentDirection] || [
      131, 132, 133, 134, 135, 136, 137, 138,
    ];
    const cycleIndex =
      Math.floor(this.animationTimer / this.ANIMATION_SPEED) % 8;
    const frameIndex = frames[cycleIndex];

    this.setAllSpritesFrame(frameIndex);
  }

  /**
   * 정지 프레임
   */
  private setIdleFrame(): void {
    const idleFrames: { [key: string]: number } = {
      up: 104,
      left: 117,
      down: 130,
      right: 143,
    };

    const frame = idleFrames[this.currentDirection] || 130;
    this.setAllSpritesFrame(frame);
  }

  private setAllSpritesFrame(frame: number): void {
    Object.values(this.partLayers).forEach((sprite) => {
      if (sprite && sprite.texture && sprite.texture.frameTotal > frame) {
        sprite.setFrame(frame);
      }
    });
  }

  private setupCamera(): void {
    this.scene.cameras.main.startFollow(this.avatarContainer, true, 0.1, 0.1);
  }

  private setupInput(): void {
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
  }

  // 헬퍼 메서드
  private resolveColors(
    colorDef: string[] | { $ref: string } | undefined,
    palettes: LPCPalettes
  ): string[] {
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

  // Getter
  getContainer(): Phaser.GameObjects.Container {
    return this.avatarContainer;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.avatarContainer.x, y: this.avatarContainer.y };
  }
}
