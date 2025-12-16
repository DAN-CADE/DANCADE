import { MapManager } from "@/game/managers/global/MapManager";
import { BaseScene } from "../base";

export class preloadScene extends BaseScene{

    private mapManager!: MapManager;

    constructor(){
      super("preloadScene")
    }

    init() {
      this.mapManager = new MapManager(this);
    }


    preload(){
      this.mapManager.preloadMap()
      this.load.once('complete', () => {
      console.log("✅ All Assets Loaded!");
      // 로딩이 다 끝나면 커스텀 씬으로 데이터 없이 이동 (혹은 기본값 전달)
      this.scene.start('MainScene'); 
    });
    }

}