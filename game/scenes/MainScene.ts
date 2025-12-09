// game/scenes/MainScene.ts
export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private map!: Phaser.Tilemaps.Tilemap;

  // 게임기 정보
  private arcadeMachines = [
    {
      id: "game1",
      x: 200,
      y: 200,
      scene: "StartScene",
      name: "Brick Breaker",
    },
    { id: "game2", x: 600, y: 200, scene: "Test", name: "Test Game" },
  ];

  private nearbyGame: { id: string; scene: string; name: string } | null = null;
  private interactPrompt!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    // 맵 리소스 로드
    this.load.image("CommonTile", "/tilesets/CommonTile.png");
    this.load.tilemapTiledJSON("map", "/maps/DanMap5.tmj");

    this.load.spritesheet(
      "player",
      "/assets/spritesheets/body/zombie/universal.png",
      // "/tilesets/CommonTile.png",
      {
        frameWidth: 64,
        frameHeight: 64,
      }
    );
  }

  create() {
    // 맵 생성
    this.map = this.make.tilemap({ key: "map" });
    const tileset = this.map.addTilesetImage("CommonTile", "CommonTile");

    // 모든 레이어 생성
    this.map.layers.forEach((layer) => {
      this.map.createLayer(layer.name, tileset ?? [], 0, 0);
    });

    // 카메라 설정 (맵 크기에 맞춤)
    this.cameras.main.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );

    this.player = this.physics.add.sprite(960, 544, "player", 0); // 0은 첫 번째 프레임
    this.player.setCollideWorldBounds(true);

    // 카메라가 플레이어 따라가도록
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 게임기들 표시 (나중에 맵의 Object Layer에서 가져올 예정)
    this.arcadeMachines.forEach((arcade, index) => {
      const color = index === 0 ? 0xff0000 : 0x0000ff;
      this.add.rectangle(arcade.x, arcade.y, 64, 64, color);
      this.add
        .text(arcade.x, arcade.y - 50, arcade.name, {
          fontSize: "14px",
          backgroundColor: "#000",
          padding: { x: 5, y: 3 },
        })
        .setOrigin(0.5)
        .setScrollFactor(1); // 카메라와 함께 스크롤
    });

    // 키보드 설정
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.interactKey = this.input.keyboard!.addKey("E");

    // 상호작용 프롬프트
    this.interactPrompt = this.add
      .text(0, 0, "", {
        fontSize: "16px",
        backgroundColor: "#000",
        padding: { x: 10, y: 5 },
        color: "#ffff00",
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setScrollFactor(0); // 화면 고정

    console.log("MainScene with map created!");
  }

  update() {
    this.handlePlayerMovement();
    this.checkNearbyArcade();
    this.handleInteraction();

    // 프롬프트를 플레이어 위에 표시 (카메라 좌표 고려)
    if (this.interactPrompt.visible) {
      const screenPos = this.cameras.main.getWorldPoint(
        this.player.x,
        this.player.y - 40
      );
      this.interactPrompt.setPosition(
        this.cameras.main.width / 2,
        screenPos.y - this.cameras.main.scrollY
      );
    }
  }

  private handlePlayerMovement() {
    const speed = 200;

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
    } else {
      this.player.setVelocityY(0);
    }
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
}
