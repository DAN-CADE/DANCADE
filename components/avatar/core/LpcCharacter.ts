import * as Phaser from "phaser";
import { CharacterState, LpcSprite, PartType } from "../utils/LpcTypes";
import { LpcUtils } from "../utils/LpcUtils";
import { LpcSpriteManager } from "@/game/managers/global/LpcSpriteManager";

const DEFAULT_PART: Partial<Record<PartType, string>> = {
  body: "body_light",
  head: "head_male_light",
  eyes: "eyes_blue",
  nose: "nose_light",
  hair: "hair_male_idol_black",
  torso: "torso_longSleeve_white",
  legs: "legs_cuffed_black",
  feet: "feet_shoes_black",
};

const FRAMES_PER_ROW = 13;
const ROW_DIR = { up: 0, left: 1, down: 2, right: 3 };
const JUMP_ROW_START = 26; // 27번째 줄 (0-index)
const THRUST_ROW_START = 12; // 찌르기 시작 줄 (기본 LPC 기준)

const LPC_ANIMS = {
  frameRate: 10,
  walk: {
    up: { start: 105, end: 112 },
    left: { start: 118, end: 125 },
    down: { start: 131, end: 138 },
    right: { start: 144, end: 151 },
  },
  idle: {
    up: 104,
    left: 117,
    down: 130,
    right: 143,
  },
};

// 애니메이션별 시작 Row(행) 위치
const ACTION_ROW_OFFSET = {
  cast: 0,
  thrust: 4,
  walk: 8,
  slash: 12,
  shoot: 16,
  jump: 26, // 27번째 줄 (index 26)
};


export default class LpcCharacter extends Phaser.GameObjects.Container {
  private nameTag: Phaser.GameObjects.Text;
  private keys!: { [key: string]: Phaser.Input.Keyboard.Key };
  private speed: number = 160;
  private lpcSpriteManager!: LpcSpriteManager;

  // 파츠별 스프라이트 저장소
  private parts: Partial<Record<PartType, Phaser.GameObjects.Sprite>> = {};

  // 렌더링 순서 (뒤 -> 앞)
  private readonly layerOrder: PartType[] = [
    "body",
    "head",
    "eyes",
    "nose",
    "legs",
    "feet",
    "torso",
    "hair",
  ];

  // 상태 변수
  private currentDirection: "up" | "down" | "left" | "right" = "down";
  private isMoving: boolean = false;
  private isJumping: boolean = false;
  private isThrusting: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    name: string,
    lpcManager: LpcSpriteManager
  ) {
    super(scene, x, y);
    this.lpcSpriteManager = lpcManager;

    // 1. Scene 및 Physics 등록
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 2. 물리 바디 설정 (Hitbox)
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(32, 32);
    body.setOffset(-16, 16);
    body.setCollideWorldBounds(false);

    // 3. 파츠 스프라이트 초기화
    this.layerOrder.forEach((part) => {
      // Container 자식으로 추가하기 위해 new Sprite 사용 (scene.add.sprite 아님)
      const sprite = new Phaser.GameObjects.Sprite(scene, 0, 0, "");
      sprite.setOrigin(0.5, 0.5);
      sprite.setVisible(false);

      this.parts[part] = sprite;
      this.add(sprite); // 컨테이너에 추가
    });

    // 4. 이름표 추가
    this.nameTag = scene.add
      .text(0, -40, name, {
        fontSize: "14px",
        color: "#00d9b8",
        stroke: "#000000",
        strokeThickness: 3,
        align: "center",
      })
      .setOrigin(0.5);
    this.add(this.nameTag);

    // 5. 키보드 입력 설정
    if (scene.input.keyboard) {
      this.keys = scene.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE, // 점프 키 추가
        z: Phaser.Input.Keyboard.KeyCodes.Z,          // 찌르기 키 추가
      }) as { [key: string]: Phaser.Input.Keyboard.Key };
    }
  }

  /**
   * 캐릭터의 특정 부위 스킨을 변경 및 애니메이션 등록
   */
  public setPart(part: PartType, textureKey: string) {
    const sprite = this.parts[part];
    if (!sprite) return;

    if (textureKey && textureKey !== "") {
      sprite.setTexture(textureKey);
      sprite.setVisible(true);

      // 새 텍스처에 대한 애니메이션 생성
      this.ensureAnimations(textureKey);

      // 현재 상태에 맞게 프레임 즉시 설정 (깜빡임 방지)
      if (!this.isMoving) {
        sprite.setFrame(LPC_ANIMS.idle[this.currentDirection]);
      }
    } else {
      sprite.setVisible(false);
    }
  }

  /**
   * 강제로 애니메이션 상태를 갱신 (옷 갈아입은 후 등)
   */
  public refresh() {
    this.playLayeredAnimations(true);
  }

  /**
   * 프레임 업데이트 루프
   */
  update() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    // 1. 키 존재 여부 확인 후 입력 감지
    const isSpaceJustDown = this.keys.space && Phaser.Input.Keyboard.JustDown(this.keys.space);
    const isZJustDown = this.keys.z && Phaser.Input.Keyboard.JustDown(this.keys.z);

    let velocityX = 0;
    let velocityY = 0;

    // 2. 점프나 찌르기 중이 아닐 때만 이동 가능
    if (!this.isJumping && !this.isThrusting) {
      if (this.keys.left.isDown) velocityX = -1;
      else if (this.keys.right.isDown) velocityX = 1;

      if (this.keys.up.isDown) velocityY = -1;
      else if (this.keys.down.isDown) velocityY = 1;

      // 이동 처리
      if (velocityX !== 0 || velocityY !== 0) {
        body.velocity.x = velocityX;
        body.velocity.y = velocityY;
        body.velocity.normalize().scale(this.speed);
      } else {
        body.setVelocity(0, 0);
      }

      // 방향 설정
      if (velocityX < 0) this.currentDirection = "left";
      else if (velocityX > 0) this.currentDirection = "right";
      else if (velocityY < 0) this.currentDirection = "up";
      else if (velocityY > 0) this.currentDirection = "down";

      this.isMoving = velocityX !== 0 || velocityY !== 0;
    }

    // 3. 애니메이션 상태 결정 및 재생
    if (isSpaceJustDown && !this.isJumping) {
      this.isJumping = true;
      this.playLayeredAnimations(true);
    } else if (isZJustDown && !this.isThrusting) {
      this.isThrusting = true;
      this.playLayeredAnimations(true);
    } else if (!this.isJumping && !this.isThrusting) {
      // 이동 또는 대기 애니메이션
      this.playLayeredAnimations();
    }
  } 

  /**
   * 특정 텍스처에 대한 4방향 걷기/대기 애니메이션 생성
   */
  private ensureAnimations(textureKey: string) {
    if (!textureKey) return;
    const anims = this.scene.anims;
    if (anims.exists(`${textureKey}-down`)) return;

    const config = { frameRate: LPC_ANIMS.frameRate, repeat: -1 };
    const directions: ('up' | 'left' | 'down' | 'right')[] = ['up', 'left', 'down', 'right'];

    directions.forEach((dir) => {
      const dirIdx = ROW_DIR[dir];

      // 1. Walk (기존 동일)
      anims.create({
        key: `${textureKey}-${dir}`,
        frames: anims.generateFrameNumbers(textureKey, LPC_ANIMS.walk[dir]),
        ...config,
      });

      // 2. Thrust (찌르기): 0-1-2-3-4-5-6-7 패턴
      anims.create({
        key: `${textureKey}-thrust-${dir}`,
        frames: anims.generateFrameNumbers(textureKey, {
          frames: [0, 1, 2, 3, 4, 5].map(f => (THRUST_ROW_START + dirIdx) * FRAMES_PER_ROW + f)
        }),
        frameRate: LPC_ANIMS.frameRate,
        repeat: 0
      });

      // 3. Jump (점프): 27번째 줄부터 시작, 0-1-2-3-4-1 패턴
      anims.create({
        key: `${textureKey}-jump-${dir}`,
        frames: anims.generateFrameNumbers(textureKey, {
          frames: [0, 1, 2, 3, 4, 1].map(f => (JUMP_ROW_START + dirIdx) * FRAMES_PER_ROW + f)
        }),
        frameRate: LPC_ANIMS.frameRate,
        repeat: 0
      });      
      
      // 4. Idle (기존 동일)
      anims.create({
        key: `${textureKey}-idle-${dir}`,
        frames: [{ key: textureKey, frame: LPC_ANIMS.idle[dir] }],
        frameRate: 0,
      });
    });
  }

  /**
   * 모든 활성화된 레이어의 애니메이션을 현재 상태에 맞춰 재생
   * @param force true일 경우 현재 재생 중이어도 강제로 다시 시작 (스킨 변경 시 사용)
   */
  private playLayeredAnimations(force: boolean = false) {
    let actionSuffix = "";
    if (this.isJumping) actionSuffix = `-jump-${this.currentDirection}`;
    else if (this.isThrusting) actionSuffix = `-thrust-${this.currentDirection}`;
    else actionSuffix = `${this.isMoving ? "" : "-idle"}-${this.currentDirection}`;

    this.layerOrder.forEach((part) => {
      const sprite = this.parts[part];
      if (!sprite?.visible) return;

      let animKey = `${sprite.texture.key}${actionSuffix}`;

      // 헤어인데 점프 중이라면?
      if (part === 'hair' && this.isJumping) {
        // 점프 애니메이션 대신 현재 방향의 idle(대기) 프레임을 고정 재생
        animKey = `${sprite.texture.key}-idle-${this.currentDirection}`;
      }

      if (this.scene.anims.exists(animKey)) {
        if (force || sprite.anims.currentAnim?.key !== animKey) {
          sprite.play(animKey, true);
          
          // 애니메이션 완료 시 Y축 리셋을 위한 콜백
          if (part === 'body' && (this.isJumping || this.isThrusting)) {
            sprite.once('animationcomplete', () => {
              this.isJumping = false;
              this.isThrusting = false;
              this.parts['hair']?.setY(0);
              this.playLayeredAnimations(true);
            });
          }
        }
      }
    });
  }

  public setDefaultPart(gender: string) {
    const hair =
      gender === "male"
        ? "hair_male_idol_black"
        : "hair_female_long_straight_black";
    const parts = {
      ...DEFAULT_PART,
      head: `head_${gender}_light`,
      hair: hair,
    };

    // 생성 시점에 정의된 DEFAULT_PART 순회하며 적용
    (Object.keys(parts) as PartType[]).forEach((part) => {
      const textureKey = parts[part];

      // 텍스처 키가 있고, 실제로 Scene에 로드되어 있는지 확인
      if (textureKey && this.scene.textures.exists(textureKey)) {
        this.setPart(part, textureKey);
      }
    });
  }

  public setCustomPart(state: CharacterState) {
    const lpcData = this.lpcSpriteManager.getLpcSprite();

    if (!lpcData) {
      console.log("LpcSprite Error");
      return;
    }
    const gender = state.gender;

    Object.keys(state.parts).forEach((key) => {
      const partName = key as PartType;
      const partState = state.parts[partName];
      if (!partState) return;

      const config = lpcData.assets[partName];
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
          if (!this.scene.textures.exists(assetKey)) {
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

        if (!this.scene.textures.exists(assetKey)) {
          assetKey = LpcUtils.getAssetKey(partName, null, "", partState.color);
        }
      }

      if (this.scene.textures.exists(assetKey)) {
        this.setPart(partName, assetKey);
      }
    });
  }

  // 이름 변경용
  public setDisplayName(newName: string) {
    if (this.nameTag) {
      this.nameTag.setText(newName);
    }
  }

  // UI 미리보기용 강제 방향 설정 (키보드 입력 무시)
  public setPreviewDirection(direction: "up" | "down" | "left" | "right") {
    this.currentDirection = direction;
    this.isMoving = false; // 걷지 않고 서있는 상태
    this.playLayeredAnimations(true);
  }

  /**
   * 원격 플레이어 애니메이션 상태 설정 (소켓으로부터)
   * @param direction 캐릭터 방향
   * @param isMoving 이동 상태 (true: 걷기, false: 정지)
   */
  public setAnimationState(
    direction: "up" | "down" | "left" | "right",
    isMoving: boolean
  ): void {
    const oldDirection = this.currentDirection;
    const oldMoving = this.isMoving;

    this.currentDirection = direction;
    this.isMoving = isMoving;

    // 상태 변화 시에만 애니메이션 업데이트
    if (oldDirection !== this.currentDirection || oldMoving !== this.isMoving) {
      this.playLayeredAnimations();
    }
  }

  /**
   * 현재 애니메이션 상태 반환
   */
  public getAnimationState(): {
    direction: "up" | "down" | "left" | "right";
    isMoving: boolean;
  } {
    return {
      direction: this.currentDirection,
      isMoving: this.isMoving,
    };
  }
}
