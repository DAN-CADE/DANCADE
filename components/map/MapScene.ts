// /game/MapScene.ts
import Phaser from "phaser";
import Player from "@/components/avatar/Player";

export default class MapScene extends Phaser.Scene {
  private player!: Player;

  constructor() {
    super("MapScene");
  }

  preload() {
    // 맵 리소스
    this.load.image("CommonTile", "/tilesets/CommonTile.png");
    this.load.tilemapTiledJSON("map", "/maps/DanMap8.tmj");

  // Body (teen / black)
  this.load.spritesheet(
    "body_black",
    "/assets/spritesheets/body/teen/black.png",
    { frameWidth: 64, frameHeight: 64 }
  );

  // Eyes (human / adult / blue)
  this.load.spritesheet(
    "eyes_blue",
    "/assets/spritesheets/eyes/human/adult/blue.png",
    { frameWidth: 64, frameHeight: 64 }
  );

  // Hair (bangslong / male / black)
  this.load.spritesheet(
    "hair_black",
    "/assets/spritesheets/hair/bangslong/male/black.png",
    { frameWidth: 64, frameHeight: 64 }
  );
  }

  create() {
    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage("CommonTile", "CommonTile");

      console.log("BODY EXISTS:", this.textures.exists("body_black"));
      console.log("HAIR EXISTS:", this.textures.exists("hair_black"));
      console.log("EYES EXISTS:", this.textures.exists("eyes_default"));

    // ground, walls 레이어만 생성
    map.createLayer("ground", tileset ?? [], 0, 0);
    const wallsLayer = map.createLayer("walls", tileset?? [], 0, 0);
  
    this.physics.world.createDebugGraphic();

    // 1) Player 생성
    this.player = new Player(this, 700, 600, "원찬");

      // 충돌 설정
    wallsLayer?.setCollisionByProperty({ collides: true });
    this.physics.add.collider(this.player, wallsLayer?? []);
    // // 2) 파츠 장착
    this.player.setPart("body", "body_black");
    this.player.setPart("hair", "hair_black");
    this.player.setPart("eyes", "eyes_blue");

    

    // 3) 카메라 따라가기
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(2);
    
  }

  update() {
    this.player.update();
  }
}
