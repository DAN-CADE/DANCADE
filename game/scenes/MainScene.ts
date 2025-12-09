// game/scenes/MainScene.ts
export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;

  // 게임기 정보
  // game/scenes/MainScene.ts - scene 이름 수정
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

  create() {
    // 배경색
    this.cameras.main.setBackgroundColor("#1a1a2e");

    // 임시 플레이어 (사각형)
    const graphics = this.add.graphics();
    graphics.fillStyle(0x00ff00, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture("player", 32, 32);
    graphics.destroy();

    this.player = this.physics.add.sprite(400, 300, "player");
    this.player.setCollideWorldBounds(true);

    // 게임기들 표시
    this.arcadeMachines.forEach((arcade, index) => {
      const color = index === 0 ? 0xff0000 : 0x0000ff;
      this.add.rectangle(arcade.x, arcade.y, 64, 64, color);
      this.add
        .text(arcade.x, arcade.y - 50, arcade.name, {
          fontSize: "14px",
          backgroundColor: "#000",
          padding: { x: 5, y: 3 },
        })
        .setOrigin(0.5);
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
      .setVisible(false);

    // 안내 텍스트
    this.add.text(
      10,
      10,
      "Use Arrow keys to move\nGet close to arcade and press E",
      {
        fontSize: "16px",
        backgroundColor: "#000",
        padding: { x: 10, y: 5 },
      }
    );

    console.log("MainScene created!");
  }

  update() {
    this.handlePlayerMovement();
    this.checkNearbyArcade();
    this.handleInteraction();
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
          .setPosition(this.player.x, this.player.y - 40)
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
