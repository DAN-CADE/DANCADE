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
    this.load.image("Plants", "/tilesets/Plants.png");      
    this.load.image("arcade1", "/tilesets/arcade1.png");
    this.load.image("arcade2", "/tilesets/arcade2.png");
    this.load.image("BlueChair", "/tilesets/BlueChair.png");
    this.load.image("button", "/tilesets/button.png");
    this.load.image("button2", "/tilesets/button2.png");
    this.load.image("desk1", "/tilesets/desk1.png");
    this.load.image("desk2", "/tilesets/desk2.png");
    this.load.image("electronic", "/tilesets/electronic.png");
    this.load.image("mainDesk", "/tilesets/mainDesk.png");
    this.load.image("RedChair", "/tilesets/RedChair.png");
    this.load.image("storefrontSign", "/tilesets/storefrontSign.png");
    this.load.image("userButton", "/tilesets/userButton.png");
    this.load.tilemapTiledJSON("map", "/maps/DanArcadeLast1.tmj");

    this.load.image("bg1_1", "/tilesets/bg1_1.png");



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

    this.add.image(0, 0, "bg1_1")
    .setOrigin(0, 0)
    .setDepth(-1);

        // Tiled tilesets[].name 과 일치하는 이름으로 addTilesetImage
    const common = map.addTilesetImage("CommonTile", "CommonTile");
    const mainDesk = map.addTilesetImage("mainDesk", "mainDesk");
    const desk2 = map.addTilesetImage("desk2", "desk2");
    const desk1 = map.addTilesetImage("desk1", "desk1");
    const arcade1 = map.addTilesetImage("arcade1", "arcade1");
    const arcade2 = map.addTilesetImage("arcade2", "arcade2");
    const blueChair = map.addTilesetImage("BlueChair", "BlueChair");
    const redChair = map.addTilesetImage("RedChair", "RedChair");
    const plants = map.addTilesetImage("Plants", "Plants");
    const button = map.addTilesetImage("button", "button");
    const button2 = map.addTilesetImage("button2", "button2");
    const storefrontSign = map.addTilesetImage("storefrontSign", "storefrontSign");
    const electronic = map.addTilesetImage("electronic", "electronic");
    const userButton = map.addTilesetImage("userButton", "userButton");

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
      userButton
      
    ];

    const tilesets = tilesetsRaw.filter((ts): ts is Phaser.Tilemaps.Tileset => ts !== null);


    this.add.image(0, 0, "bg1_1").setOrigin(0, 0);
    // ground, walls 레이어만 생성
    map.createLayer("ground", tilesets , 0, 0);
    const wallsLayer = map.createLayer("walls", tilesets, 0, 0);
    map.createLayer("object1", tilesets, 0, 0);
    map.createLayer("boject2", tilesets, 0, 0); // 오타지만 Tiled name이 boject2니까 그대로
  
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
