import * as Phaser from "phaser";

export default class MapScene extends Phaser.Scene {
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
    this.load.tilemapTiledJSON("map", "/maps/DanArcadeLast8.tmj");
    this.load.image("bg1_1", "/tilesets/bg1_1.png");
  }

  create() {
    const map = this.make.tilemap({ key: "map" });

    this.add.image(0, 0, "bg1_1").setOrigin(0, 0).setDepth(-1);

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
    const storefrontSign = map.addTilesetImage(
      "storefrontSign",
      "storefrontSign"
    );
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
      userButton,
    ];

    const tilesets = tilesetsRaw.filter(
      (ts): ts is Phaser.Tilemaps.Tileset => ts !== null
    );

    this.add.image(0, 0, "bg1_1").setOrigin(0, 0);
    map.createLayer("ground", tilesets, 0, 0);
    map.createLayer("object1", tilesets, 0, 0);
    map.createLayer("object2", tilesets, 0, 0);
    const wallsLayer = map.createLayer("walls", tilesets, 0, 0);

    this.physics.world.createDebugGraphic();

    // 충돌 설정
    wallsLayer?.setCollisionByProperty({ collides: true });
  }
}
