import { BaseScene } from "@/game/scenes/base";
import { MapManager } from "@/game/managers/global/MapManager";
import { AvatarManager } from "@/game/managers/global/AvatarManager";

export class PreloadScene extends BaseScene {
    private mapManager!: MapManager;
    private avatarManager!: AvatarManager;

    constructor(){
      super("preloadScene")
    }

    init() {
      this.avatarManager = new AvatarManager(this)
      this.mapManager = new MapManager(this);
    }

    preload(){
      this.mapManager.preloadMap()
      this.avatarManager.preloadAvatar()

      this.load.once('complete', () => {
        console.log("✅ All Assets Loaded!");
        if (this.scene.manager.keys["MainScene"]) {
          this.scene.start("MainScene");
        } else if (this.scene.manager.keys["CharacterCustomScene"]) { 
          this.scene.start("CharacterCustomScene");
        }else {
          console.error("No next scene found after PreloadScene!");
        }
      });
    }

}