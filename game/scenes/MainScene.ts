import { type GameConfig } from "@/game/config/gameRegistry";
import { AvatarManager } from "@/game/managers/AvatarManager";
import { ArcadeMachineManager } from "@/game/managers/ArcadeMachineManager";
import { AssetLoader } from "@/game/managers/AssetLoader";
import { CharacterCustomization } from "@/types/character";

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

  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    this.load.image("CommonTile", "/tilesets/CommonTile.png");
    this.load.tilemapTiledJSON("map", "/maps/DanMap5.tmj");
    // this.load.image("arcade-machine", "/assets/arcade-machine.png");
    this.load.json("lpc_config", "/assets/lpc_assets.json");

    this.assetLoader = new AssetLoader(this);

    this.load.on(
      Phaser.Loader.Events.FILE_COMPLETE + "-json-lpc_config",
      (key: string, type: string, data: any) => {
        if (data && data.assets) {
          this.loadCharacterAssets(data);
        }
      }
    );
  }

  create() {
    this.machineManager = new ArcadeMachineManager(this);
    this.avatarManager = new AvatarManager(this);

    this.createMap();
    this.createAvatar();
    this.finishSetup();
  }

  /**
   * 아바타 생성
   */
  private createAvatar(): void {
    const savedCustomization = localStorage.getItem("characterCustomization");
    const lpcData = this.cache.json.get("lpc_config");

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

  private createRandomAvatar(lpcData: any): void {
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
  private loadCharacterAssets(data: any): void {
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
    const tileset = this.map.addTilesetImage("CommonTile", "CommonTile");
    if (!tileset) return;

    this.map.layers.forEach((layer) => {
      this.map.createLayer(layer.name, tileset, 0, 0);
    });

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

    // 1. 벽 충돌
    const wallLayer = this.map.createLayer("walls", "CommonTile");
    if (wallLayer) {
      wallLayer.setCollisionByProperty({ collides: true });
      this.physics.add.collider(avatar, wallLayer);
    }

    // 2. 게임기 충돌
    const machines = this.machineManager.getMachines();
    machines.forEach((machine) => {
      this.physics.add.collider(avatar, machine.sprite);
    });

    // 3. 기타 오브젝트 충돌
    const collisionLayer = this.map.getObjectLayer("CollisionObjects");
    if (collisionLayer) {
      collisionLayer.objects.forEach((obj: any) => {
        const box = this.add.rectangle(
          obj.x + obj.width / 2,
          obj.y + obj.height / 2,
          obj.width,
          obj.height
        );
        this.physics.add.existing(box, true);
        this.physics.add.collider(avatar, box);
      });
    }
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
