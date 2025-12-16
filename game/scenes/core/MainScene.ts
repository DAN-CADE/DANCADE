// game/scenes/core/MainScene.ts

import { MapManager } from "@/game/managers/global/MapManager";
import { BaseScene } from "@/game/scenes/base";

export class MainScene extends BaseScene {
  private mapManager!: MapManager;

  
  constructor() {
    super({ key: "MainScene" });
  }

   
  init() {
    this.mapManager = new MapManager(this);
  }

  preload() {
  }

  create() {
  }


  update() {
  }
}