// game/scenes/core/MainScene.ts
import { BaseScene } from "@/game/scenes/base";
import { MapManager } from "@/game/managers/global/MapManager";
import { AvatarManager } from "@/game/managers/global/AvatarManager";

export class MainScene extends BaseScene {
  private readonly PLAYER_START_X = 960;
  private readonly PLAYER_START_Y = 544;

  private mapManager!: MapManager;
  private avatarManager!: AvatarManager;

  constructor() {
    super({ key: "MainScene" });
    this.mapManager = new MapManager(this);
    this.avatarManager = new AvatarManager(this)
  }

  preload() {
  }

  create() {
    this.mapManager.createMap()
    this.avatarManager.createAvatar(this.PLAYER_START_X, this.PLAYER_START_Y);
    this.mapManager.setupCollisions(this.avatarManager.getContainer())
  }

  update() {
    this.avatarManager.update();
  }
}