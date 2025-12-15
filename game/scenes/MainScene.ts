import { type GameConfig } from "@/game/config/gameRegistry";
import { AvatarManager } from "@/game/managers/AvatarManager";
import { ArcadeMachineManager } from "@/game/managers/ArcadeMachineManager";
import { AssetLoader } from "@/game/managers/AssetLoader";
import { CharacterCustomization } from "@/types/character";
import { LPCData } from "@/types/lpc";

const TILE_IMAGES: Array<[string, string]> = [
  ["CommonTile", "/tilesets/CommonTile.png"],
  ["Plants", "/tilesets/Plants.png"],
  ["arcade1", "/tilesets/arcade1.png"],
  ["arcade2", "/tilesets/arcade2.png"],
  ["BlueChair", "/tilesets/BlueChair.png"],
  ["button", "/tilesets/button.png"],
  ["button2", "/tilesets/button2.png"],
  ["desk1", "/tilesets/desk1.png"],
  ["desk2", "/tilesets/desk2.png"],
  ["electronic", "/tilesets/electronic.png"],
  ["mainDesk", "/tilesets/mainDesk.png"],
  ["RedChair", "/tilesets/RedChair.png"],
  ["storefrontSign", "/tilesets/storefrontSign.png"],
  ["userButton", "/tilesets/userButton.png"],
];

export class MainScene extends Phaser.Scene {
  private readonly FADE_DURATION = 1000;
  private readonly PLAYER_START_X = 960;
  private readonly PLAYER_START_Y = 544;

  private map!: Phaser.Tilemaps.Tilemap;
  private machineManager!: ArcadeMachineManager;
  private avatarManager!: AvatarManager;
  private assetLoader!: AssetLoader;

  private interactKey!: Phaser.Input.Keyboard.Key;
  private interactPrompt!: Phaser.GameObjects.Text;
  private nearbyGame: GameConfig | null = null;
  private wallsLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private object1Layer: Phaser.Tilemaps.TilemapLayer | null = null;
  private object2Layer: Phaser.Tilemaps.TilemapLayer | null = null;

  private addTilemapCollision(
    avatar: Phaser.GameObjects.GameObject,
    layer?: Phaser.Tilemaps.TilemapLayer | null) 
  {
    if (!layer) return;
    layer.setCollisionByProperty({ collides: true });
    this.physics.add.collider(avatar, layer);
  }

  private loadImages(images: [string, string][]) {
    images.forEach(([key, path]) => this.load.image(key, path));
  }

  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    this.loadImages(TILE_IMAGES);
    this.load.tilemapTiledJSON("map", "/maps/DanArcadeLast8.tmj");
    this.load.json("lpc_config", "/assets/lpc_assets.json");
    this.load.image("bg1_1", "/tilesets/bg1_1.png");

    this.assetLoader = new AssetLoader(this);

    this.load.on(
      Phaser.Loader.Events.FILE_COMPLETE + "-json-lpc_config",
      (key: string, type: string, data: LPCData) => {
        if (data && data.assets) {
          this.loadCharacterAssets(data);
        }
      }
    );
  }

  create() {
    this.machineManager = new ArcadeMachineManager(this);
    this.avatarManager = new AvatarManager(this);
    this.scale.resize(window.innerWidth, window.innerHeight);

    this.createMap();
    this.createAvatar();
    this.finishSetup();
    this.scale.on("resize", this.handleResize, this);
  }
  handleResize(gameSize: Phaser.Structs.Size) {
    // 씬이 활성화되어 있을 때만 실행
    if (!this.scene.isActive()) return;

    this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
  }

  /**
   * 아바타 생성
   */
  private createAvatar(): void {
    const savedCustomization = localStorage.getItem("characterCustomization"); // {"gender":"male","skinTone":"light",...}
    const lpcData = this.cache.json.get("lpc_config") as LPCData;

    if (savedCustomization && lpcData) {
      try {
        const customization: CharacterCustomization =
          JSON.parse(savedCustomization);
        this.avatarManager.createCustomAvatar(
          this.PLAYER_START_X,
          this.PLAYER_START_Y,
          customization
        );
      } catch (error) {
        console.error(error);
        this.createRandomAvatar(lpcData);
      }
    } else {
      this.createRandomAvatar(lpcData);
    }
  }

  private createRandomAvatar(lpcData: LPCData): void {
    const savedSeed = localStorage.getItem("selectedCharacterSeed");
    if (savedSeed) {
      Phaser.Math.RND.sow([savedSeed]);
    }

    this.avatarManager.createRandomAvatar(
      this.PLAYER_START_X,
      this.PLAYER_START_Y,
      lpcData
    );
  }

  /**
   * 에셋 로딩
   */
  private loadCharacterAssets(data: LPCData): void {
    const savedCustomization = localStorage.getItem("characterCustomization");

    if (savedCustomization) {
      try {
        const customization: CharacterCustomization =
          JSON.parse(savedCustomization);
        this.assetLoader.loadCustomAssets(customization);
        return;
      } catch (error) {
        console.error(error);
      }
    }

    this.assetLoader.loadDefaultAssets(data);
  }

  private finishSetup(): void {
    this.machineManager.parseFromMap(this.map);
    this.setupCollisions();
    this.setupInput();
    this.createUI();
  }

  update(time: number, delta: number): void {
    this.avatarManager.update(delta);
    this.checkNearbyArcade();
    this.handleInteraction();
    this.updateUI();
  }

  // ============================================================
  // 맵 & UI
  // ============================================================

  private createMap(): void {
    this.map = this.make.tilemap({ key: "map" });

    this.add.image(0, 0, "bg1_1").setOrigin(0, 0).setDepth(-1);

    // Tiled tilesets[].name 과 일치하는 이름으로 addTilesetImage
    const common = this.map.addTilesetImage("CommonTile", "CommonTile");
    const mainDesk = this.map.addTilesetImage("mainDesk", "mainDesk");
    const desk2 = this.map.addTilesetImage("desk2", "desk2");
    const desk1 = this.map.addTilesetImage("desk1", "desk1");
    const arcade1 = this.map.addTilesetImage("arcade1", "arcade1");
    const arcade2 = this.map.addTilesetImage("arcade2", "arcade2");
    const blueChair = this.map.addTilesetImage("BlueChair", "BlueChair");
    const redChair = this.map.addTilesetImage("RedChair", "RedChair");
    const plants = this.map.addTilesetImage("Plants", "Plants");
    const button = this.map.addTilesetImage("button", "button");
    const button2 = this.map.addTilesetImage("button2", "button2");
    const storefrontSign = this.map.addTilesetImage(
      "storefrontSign",
      "storefrontSign"
    );
    const electronic = this.map.addTilesetImage("electronic", "electronic");
    const userButton = this.map.addTilesetImage("userButton", "userButton");

    const tilesetsRaw = [
      common,
      mainDesk,
      desk2,
      desk1,
      arcade1,
      arcade2,
      blueChair,
      redChair,
      plants,
      button,
      button2,
      storefrontSign,
      electronic,
      userButton,
    ];
    const tilesets = tilesetsRaw.filter(
      (ts): ts is Phaser.Tilemaps.Tileset => ts !== null
    );

    if (!tilesets) return;

    this.map.createLayer("ground", tilesets, 0, 0);
    this.wallsLayer = this.map.createLayer("walls", tilesets, 0, 0);
    this.object1Layer = this.map.createLayer("object1", tilesets, 0, 0);
    this.object2Layer = this.map.createLayer("object2", tilesets, 0, 0);

    this.cameras.main.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );
  }

  // 충돌 설정
  private setupCollisions(): void {
    const avatar = this.avatarManager.getContainer();

      this.addTilemapCollision(avatar, this.wallsLayer);
      this.addTilemapCollision(avatar, this.object1Layer);
      this.addTilemapCollision(avatar, this.object2Layer);
  }

  private setupInput(): void {
    this.interactKey = this.input.keyboard!.addKey("E");
  }

  private createUI(): void {
    this.interactPrompt = this.add
      .text(0, 0, "", {
        fontSize: "16px",
        backgroundColor: "#000",
        padding: { x: 10, y: 5 },
        color: "#ffff00",
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setScrollFactor(0)
      .setDepth(1000);
  }

  private checkNearbyArcade(): void {
    const pos = this.avatarManager.getPosition();
    const nearest = this.machineManager.findNearestMachine(pos.x, pos.y);

    this.machineManager.clearAllHighlights();

    if (nearest) {
      this.nearbyGame = nearest.game;
      this.machineManager.highlightMachine(nearest);
      this.interactPrompt
        .setText(`Press E to play ${nearest.game.name}`)
        .setVisible(true);
    } else {
      this.nearbyGame = null;
      this.interactPrompt.setVisible(false);
    }
  }

  private handleInteraction(): void {
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) && this.nearbyGame) {
      this.launchGame(this.nearbyGame);
    }
  }

  private updateUI(): void {
    if (this.interactPrompt.visible) {
      this.interactPrompt.setPosition(this.cameras.main.width / 2, 100);
    }
  }

  private launchGame(game: GameConfig): void {
    this.cameras.main.fadeOut(this.FADE_DURATION, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start(game.sceneKey, {
        returnScene: "MainScene",
        playerPosition: this.avatarManager.getPosition(),
      });
    });
  }

  shutdown(): void {
    this.machineManager.destroy();
  }
}
