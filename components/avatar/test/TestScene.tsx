import Phaser from 'phaser';
import Player from '../core/LpcCharacter';
import { PartType } from '../utils/LpcTypes';

// -------------------- [Interfaces: JSON Schema] --------------------

// 1. 공통 팔레트 정의
interface PaletteParams {
  [key: string]: string[];
}

// 2. 색상 참조 타입
type ColorDef = string[] | { $ref: string };

// 3. 일반 파츠 설정 (Body, Head, Eyes 등 - 스타일 없이 색상만 존재)
interface StandardPartConfig {
  tier?: "basic" | "point";
  prefix?: string;
  path: string;
  colors: ColorDef;
  genders?: string[];
}

// 4. 스타일 정의 (Hair, Clothes 등)
interface PartStyle {
  id: string; // 고유 ID (예: "tshirt")
  name?: string; // 표시 이름 (예: "반팔 티셔츠")
  tier?: "basic" | "point";
  price?: number;
  path_segment?: string; // 폴더 경로가 id와 다를 경우 사용 (예: "shortsleeve/tshirt")
  genders?: string[];
  colors?: string[]; // 특정 스타일 전용 색상
}

// 5. 스타일이 있는 파츠 설정 (Hair + Torso, Legs, Feet)
interface StyledPartConfig {
  config: {
    description?: string;
    path_template: string; // 예: "/assets/.../{style}/.../{color}.png"
    default_colors: ColorDef;
  };
  styles: PartStyle[];
}

// 6. Assets 내부 값
type AssetConfig = StandardPartConfig | StyledPartConfig;

// 7. 전체 JSON 루트
interface LpcRootData {
  definitions: {
    palettes: PaletteParams;
  };
  assets: {
    [key: string]: AssetConfig;
  };
}

// 8. 캐릭터 상태 인터페이스
interface CharacterState {
  gender: string;
  parts: {
    [key in PartType]?: {
      styleId?: string;
      color: string;
    };
  };
}

// -------------------- [MainScene Class] --------------------

export default class MainScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;

  // UI 상태 관리
  private currentState: CharacterState = {
    gender: "male", // 초기 성별
    parts: {},
  };

  // 카메라 관련 변수
  private readonly ZOOM_MIN = 1;
  private readonly ZOOM_MAX = 10;
  private readonly ZOOM_FACTOR = 0.5;

  // 게임기 정보
  private arcadeMachines = [
    { id: "game1", x: 200, y: 200, scene: "StartScene", name: "Brick Breaker" },
  ];
  private nearbyGame: { id: string; scene: string; name: string } | null = null;
  private interactPrompt!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    this.load.image("CommonTile", "/tilesets/CommonTile.png");
    this.load.tilemapTiledJSON("map", "/maps/DanArcadeLast1.tmj");
    this.load.json("lpc_config", "/assets/lpc_assets.json");

    // JSON 로드 완료 시 에셋 파싱 시작
    this.load.on(
      Phaser.Loader.Events.FILE_COMPLETE + "-json-lpc_config",
      (key: string, type: string, data: LpcRootData) => {
        if (data && data.assets) {
          this.loadLpcAssets(data);
        }
      }
    );
  }

  /**
   * [CORE] JSON 데이터를 기반으로 스프라이트 시트 로드
   */
  private loadLpcAssets(data: LpcRootData) {
    this.registry.set("lpc_data", data);
    const frameConfig = { frameWidth: 64, frameHeight: 64 };
    const palettes = data.definitions.palettes;

    Object.entries(data.assets).forEach(([partName, config]) => {
      // 1. 스타일이 있는 파츠 (Hair, Torso, Legs, Feet)
      if (this.isStyledPart(config)) {
        const template = config.config.path_template;
        const defaultColors = this.resolveColors(
          config.config.default_colors,
          palettes
        );

        config.styles.forEach((style) => {
          const styleColors = style.colors ? style.colors : defaultColors;
          const styleGenders =
            style.genders && style.genders.length > 0 ? style.genders : [""];

          // 경로 생성에 사용할 문자열 (path_segment가 있으면 우선 사용, 없으면 id)
          // 예: id="tshirt"지만 경로는 "shortsleeve/tshirt"일 수 있음
          const pathStyleStr = style.path_segment || style.id;

          styleGenders.forEach((gender) => {
            styleColors.forEach((color) => {
              // Phaser 캐시 키: partName_styleId_gender_color
              const assetKey = this.getAssetKey(
                partName,
                style.id,
                gender,
                color
              );

              // 파일 경로 생성
              let assetPath = template
                .replace("{style}", pathStyleStr)
                .replace("{color}", color);

              // 템플릿에 {gender}가 있는 경우에만 치환 (성별 없는 옷 대비)
              if (assetPath.includes("{gender}")) {
                assetPath = assetPath.replace("{gender}", gender);
              }

              this.load.spritesheet(assetKey, assetPath, frameConfig);
            });
          });
        });
      }
      // 2. 일반 파츠 (Body, Head, Eyes, Nose)
      else {
        const partConfig = config as StandardPartConfig;
        const colors = this.resolveColors(partConfig.colors, palettes);
        const prefix = partConfig.prefix || partName;
        const genders =
          partConfig.genders && partConfig.genders.length > 0
            ? partConfig.genders
            : [""];

        genders.forEach((gender) => {
          colors.forEach((color) => {
            const assetKey = this.getAssetKey(prefix, null, gender, color);
            let assetPath = partConfig.path.replace("{color}", color);

            if (assetPath.includes("{gender}")) {
              assetPath = assetPath.replace("{gender}", gender);
            }

            this.load.spritesheet(assetKey, assetPath, frameConfig);
          });
        });
      }
    });

    this.load.start();
  }

  create() {
    this.createBackground();
    this.createPlayer();
    this.setupCamera();
    this.setGame();

    // 데이터 로드 완료 확인 후 UI 생성
    if (this.registry.get("lpc_data")) {
      this.createMakerUI();
    }
  }

  update() {
    this.checkNearbyArcade();
    this.handleInteraction();
    if (this.player) {
      this.player.update();
      this.player.refresh();
    }
  }

  // -------------------- [Setup Methods] --------------------

  private createBackground() {
    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage("CommonTile", "CommonTile");
    if (tileset) {
      map.layers.forEach((layer) => {
        map.createLayer(layer.name, tileset, 0, 0);
      });
    }
  }

  private createPlayer() {
    this.player = new Player(this, 400, 300, "Player");
    this.player.setScale(0.5); // LPC 에셋 크기에 따라 조절
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 초기 랜덤 설정
    if (this.registry.get("lpc_data")) {
      this.randomizeCharacter();
    }
  }

  private setupCamera() {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, this.scale.width, this.scale.height);

    // 줌
    this.input.on("wheel", (_: any, __: any, ___: any, deltaY: number) => {
      const newZoom = Phaser.Math.Clamp(
        camera.zoom + (deltaY > 0 ? -this.ZOOM_FACTOR : this.ZOOM_FACTOR),
        this.ZOOM_MIN,
        this.ZOOM_MAX
      );
      camera.setZoom(newZoom);
    });
  }

  private setGame() {
    // 게임기 예시
    this.arcadeMachines.forEach((arcade) => {
      this.add.rectangle(arcade.x, arcade.y, 64, 64, 0x0000ff);
    });

    this.interactKey = this.input.keyboard!.addKey("E");
    this.interactPrompt = this.add
      .text(0, 0, "", { fontSize: "16px", backgroundColor: "#000" })
      .setVisible(false);
  }

  private checkNearbyArcade() {
    const interactionRadius = 80;
    let foundNearby = false;

    for (const machine of this.arcadeMachines) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        machine.x,
        machine.y
      );

      if (distance < interactionRadius) {
        this.nearbyGame = machine;
        this.interactPrompt
          .setText(`Press E to play ${machine.name}`)
          .setVisible(true);
        foundNearby = true;
        break;
      }
    }

    if (!foundNearby) {
      this.nearbyGame = null;
      this.interactPrompt.setVisible(false);
    }
  }

  private handleInteraction() {
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) && this.nearbyGame) {
      console.log(`Launching: ${this.nearbyGame.name}`);
      this.launchGame(this.nearbyGame.scene);
    }
  }

  private launchGame(sceneName: string) {
    console.log(`Starting scene: ${sceneName}`);
    this.scene.start(sceneName);
  }

  // -------------------- [Logic: Randomization] --------------------

  public randomizeCharacter() {
    const data = this.registry.get("lpc_data") as LpcRootData;
    if (!data) return;

    const palettes = data.definitions.palettes;
    const assets = data.assets;

    // 1. 성별 랜덤 (UI 갱신을 위해 상태 먼저 변경)
    this.currentState.gender = Phaser.Math.RND.pick(["male", "female"]);

    // 2. 파츠별 랜덤 선택
    Object.keys(assets).forEach((key) => {
      const partName = key as PartType;

      // Head, Nose는 Body 색상을 따라가므로 랜덤 루프에서 제외
      if (partName === "head" || partName === "nose") return;

      const config = assets[key];

      // (A) 스타일형 파츠 (Hair, Clothes 등)
      if (this.isStyledPart(config)) {
        // 현재 성별에서 사용 가능한 스타일 필터링
        const validStyles = config.styles.filter(
          (s) =>
            !s.genders ||
            s.genders.length === 0 ||
            s.genders.includes(this.currentState.gender)
        );

        if (validStyles.length > 0) {
          const style = Phaser.Math.RND.pick(validStyles);

          // [중요] 스타일 전용 색상이 있으면 그것을 사용, 없으면 기본값 사용
          // 예: Idol 헤어는 colors가 정의되어 있어 Pink, Mint 등이 포함됨
          const colorDef = style.colors || config.config.default_colors;
          const validColors = this.resolveColors(colorDef, palettes);

          const color = Phaser.Math.RND.pick(validColors);

          this.updatePartState(partName, { styleId: style.id, color });
        }
      }
      // (B) 일반 파츠 (Body, Eyes 등)
      else {
        const colors = this.resolveColors(config.colors, palettes);
        if (colors.length > 0) {
          const color = Phaser.Math.RND.pick(colors);
          this.updatePartState(partName, { color });
        }
      }
    });

    // 3. Body 색상이 정해졌으면 Head와 Nose에 동일한 색상 강제 적용
    const bodyState = this.currentState.parts["body"];
    if (bodyState && bodyState.color) {
      this.updatePartState("head", { color: bodyState.color });
      this.updatePartState("nose", { color: bodyState.color });
    }
  }

  // -------------------- [UI Logic] --------------------

  private createMakerUI() {
    // 1. 기존 UI 제거
    const existingUI = document.getElementById("maker-ui");
    if (existingUI) existingUI.remove();

    const data = this.registry.get("lpc_data") as LpcRootData;

    // 2. Root 컨테이너
    const root = document.createElement("div");
    root.id = "maker-ui";
    root.style.cssText = `position:absolute; top:10px; right:10px; width:280px; background:rgba(0,0,0,0.85); color:white; padding:15px; border-radius:8px; font-family:sans-serif; max-height:90vh; overflow-y:auto; box-shadow: 0 4px 6px rgba(0,0,0,0.3);`;

    document.body.appendChild(root);

    // 3. 성별 선택
    this.createSelectGroup(
      root,
      "GENDER",
      ["male", "female"],
      this.currentState.gender,
      (val) => {
        this.currentState.gender = val;
        this.createMakerUI(); // 성별 변경 시 사용 가능한 스타일이 달라지므로 UI 재생성
        this.updateCharacterParts();
      }
    );

    // 4. 파츠 UI 생성
    const partOrder = ["body", "eyes", "hair", "torso", "legs", "feet"];

    partOrder.forEach((partName) => {
      const config = data.assets[partName];
      if (!config) return;

      const container = document.createElement("div");
      container.style.cssText =
        "margin-bottom: 12px; border-bottom: 1px solid #444; padding-bottom: 8px;";
      container.innerHTML = `<div style="font-size:12px; color:#aaa; margin-bottom:4px; text-transform:uppercase;">${partName}</div>`;
      root.appendChild(container);

      // (A) 스타일형 파츠 (Style Select + Color Select)
      if (this.isStyledPart(config)) {
        // 1. 유효한 스타일 목록 필터링
        const validStyles = config.styles.filter(
          (s) =>
            !s.genders ||
            s.genders.length === 0 ||
            s.genders.includes(this.currentState.gender)
        );

        // 현재 스타일이 유효하지 않으면 첫 번째로 강제 변경
        let curStyleId = this.currentState.parts[partName as PartType]?.styleId;
        if (!curStyleId || !validStyles.find((s) => s.id === curStyleId)) {
          curStyleId = validStyles[0]?.id;
          // 여기서 state 업데이트는 아래 로직에서 처리됨
        }

        // --- 스타일 Select 생성 ---
        const styleSelect = document.createElement("select");
        styleSelect.style.cssText =
          "width:100%; padding:5px; background:#333; color:white; border:1px solid #555; border-radius:4px; margin-bottom:5px;";

        validStyles.forEach((s) => {
          const opt = document.createElement("option");
          opt.value = s.id;
          let text = s.name || s.id;
          if (s.tier === "point") {
            text += ` [${s.price}P]`;
            opt.style.color = "#ffd700"; // 골드 색상
          }
          opt.innerText = text;
          if (s.id === curStyleId) opt.selected = true;
          styleSelect.appendChild(opt);
        });
        container.appendChild(styleSelect);

        // --- 색상 Select 생성 (미리 생성해둠) ---
        const colorSelect = document.createElement("select");
        colorSelect.style.cssText =
          "width:100%; padding:5px; background:#333; color:white; border:1px solid #555; border-radius:4px;";
        container.appendChild(colorSelect);

        // [핵심] 스타일 변경 시 색상 목록을 갱신하는 함수
        const updateColorOptions = (styleId: string) => {
          const styleObj = validStyles.find((s) => s.id === styleId);
          if (!styleObj) return;

          // 스타일 전용 색상 우선, 없으면 기본 색상 사용
          const colorDef = styleObj.colors || config.config.default_colors;
          const availableColors = this.resolveColors(
            colorDef,
            data.definitions.palettes
          );

          // 기존 선택된 색상 유지 시도
          const curColor = this.currentState.parts[partName as PartType]?.color;

          // Select 옵션 초기화
          colorSelect.innerHTML = "";
          availableColors.forEach((c) => {
            const opt = document.createElement("option");
            opt.value = c;
            opt.innerText = c;
            colorSelect.appendChild(opt);
          });

          // 유효한 색상 결정 (기존 색상이 목록에 없으면 첫 번째 색상 선택)
          // 예: Pink Idol 머리였다가 Plain으로 바꾸면 Pink는 없으므로 Ash로 변경
          let newColor =
            curColor && availableColors.includes(curColor)
              ? curColor
              : availableColors[0];

          colorSelect.value = newColor;

          // 상태 업데이트
          this.updatePartState(partName as PartType, {
            styleId: styleId,
            color: newColor,
          });
        };

        // 이벤트 바인딩
        styleSelect.onchange = (e) => {
          const val = (e.target as HTMLSelectElement).value;
          updateColorOptions(val); // 스타일이 바뀌면 색상 목록도 바뀜
        };

        colorSelect.onchange = (e) => {
          const val = (e.target as HTMLSelectElement).value;
          this.updatePartState(partName as PartType, { color: val });
        };

        // 초기화 실행
        updateColorOptions(curStyleId!);
      }
      // (B) 일반 파츠 (Color Select Only)
      else {
        const standardConfig = config as StandardPartConfig;
        const colors = this.resolveColors(
          standardConfig.colors,
          data.definitions.palettes
        );

        let curColor = this.currentState.parts[partName as PartType]?.color;
        if (!curColor || !colors.includes(curColor)) curColor = colors[0];

        // 상태 동기화
        this.updatePartState(partName as PartType, { color: curColor });

        this.createSelectBox(
          container,
          colors.map((c) => ({ value: c, text: c })),
          curColor,
          (val) => {
            this.updatePartState(partName as PartType, { color: val });
          }
        );
      }
    });

    // 5. 랜덤 버튼
    const randomBtn = document.createElement("button");
    randomBtn.innerText = "🎲 RANDOMIZE";
    randomBtn.style.cssText =
      "width:100%; padding:12px; background:#4CAF50; color:white; border:none; border-radius:4px; margin-top:15px; cursor:pointer; font-weight:bold; font-size:14px;";

    randomBtn.onmouseover = () => (randomBtn.style.background = "#45a049");
    randomBtn.onmouseout = () => (randomBtn.style.background = "#4CAF50");

    randomBtn.onclick = () => {
      this.randomizeCharacter();
      this.createMakerUI(); // 랜덤 값에 맞춰 UI 전체 갱신
    };

    root.appendChild(randomBtn);

    // UI 생성 직후 캐릭터 업데이트 (초기 로드 시 싱크 맞춤)
    this.updateCharacterParts();
  }

  private updatePartState(
    partName: PartType,
    detail: { styleId?: string; color?: string }
  ) {
    if (!this.currentState.parts[partName]) {
      this.currentState.parts[partName] = { color: "default" };
    }
    const st = this.currentState.parts[partName]!;
    if (detail.styleId) st.styleId = detail.styleId;
    if (detail.color) st.color = detail.color;

    // [수정] Body 색상이 변경되면 Head와 Nose 색상도 강제로 동기화
    if (partName === "body" && detail.color) {
      const targets: PartType[] = ["head", "nose"];

      targets.forEach((target) => {
        if (!this.currentState.parts[target]) {
          this.currentState.parts[target] = { color: detail.color! };
        } else {
          this.currentState.parts[target]!.color = detail.color!;
        }
      });
    }

    // UI 이벤트에서 호출된 경우 바로 반영
    this.updateCharacterParts();
  }

  /**
   * 현재 State를 바탕으로 Player 파츠 교체
   */
  private updateCharacterParts() {
    const data = this.registry.get("lpc_data") as LpcRootData;
    const gender = this.currentState.gender;

    Object.keys(this.currentState.parts).forEach((key) => {
      const partName = key as PartType;
      const state = this.currentState.parts[partName]!;
      const config = data.assets[partName];

      let assetKey = "";

      // 1. 스타일형 파츠 키 생성
      if (this.isStyledPart(config)) {
        if (state.styleId) {
          // 키 형식: partName_styleId_gender_color
          assetKey = this.getAssetKey(
            partName,
            state.styleId,
            gender,
            state.color
          );

          // Fallback: 해당 성별 키가 없으면 공용(gender='') 키 시도
          if (!this.textures.exists(assetKey)) {
            assetKey = this.getAssetKey(
              partName,
              state.styleId,
              "",
              state.color
            );
          }
        }
      }
      // 2. 일반 파츠 키 생성
      else {
        const standardConfig = config as StandardPartConfig;
        const prefix = standardConfig.prefix || partName;
        assetKey = this.getAssetKey(prefix, null, gender, state.color);

        if (!this.textures.exists(assetKey)) {
          assetKey = this.getAssetKey(prefix, null, "", state.color);
        }
      }

      if (this.textures.exists(assetKey)) {
        this.player.setPart(partName, assetKey);
      }
    });

    this.player.refresh();
  }

  // -------------------- [Helpers] --------------------

  private createSelectGroup(
    parent: HTMLElement,
    label: string,
    options: string[],
    selected: string,
    onChange: (val: string) => void
  ) {
    const div = document.createElement("div");
    div.style.marginBottom = "15px";
    div.innerHTML = `<div style="font-weight:bold; margin-bottom:5px;">${label}</div>`;
    this.createSelectBox(
      div,
      options.map((o) => ({ value: o, text: o })),
      selected,
      onChange
    );
    parent.appendChild(div);
  }

  private createSelectBox(
    parent: HTMLElement,
    options: { value: string; text: string; color?: string }[],
    selectedValue: string,
    onChange: (val: string) => void
  ) {
    const select = document.createElement("select");
    select.style.cssText =
      "width:100%; padding:5px; background:#333; color:white; border:1px solid #555; border-radius:4px; margin-bottom:5px;";

    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.innerText = opt.text;
      option.selected = opt.value === selectedValue;
      if (opt.color) option.style.color = opt.color;
      select.appendChild(option);
    });

    select.onchange = (e) => onChange((e.target as HTMLSelectElement).value);
    parent.appendChild(select);
  }

  // 타입 가드: config에 styles 배열이 있는지 확인
  private isStyledPart(config: AssetConfig): config is StyledPartConfig {
    return (config as StyledPartConfig).styles !== undefined;
  }

  private resolveColors(colorDef: ColorDef, palettes: PaletteParams): string[] {
    if (Array.isArray(colorDef)) return colorDef;
    if (colorDef && colorDef.$ref) return palettes[colorDef.$ref] || [];
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
