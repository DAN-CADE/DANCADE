// game/scenes/BrickBreakerScene.ts
export class BrickBreakerScene extends Phaser.Scene {
  private paddle?: Phaser.Physics.Arcade.Sprite;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private bricks?: Phaser.Physics.Arcade.StaticGroup;
  private ball?: Phaser.Physics.Arcade.Sprite;
  private score: number = 0;
  private scoreText?: Phaser.GameObjects.Text;

  // 벽돌 색상 배열
  private brickColors = [
    "element_red_rectangle_glossy",
    "element_yellow_rectangle_glossy",
    "element_green_rectangle_glossy",
    "element_blue_rectangle_glossy",
    "element_purple_rectangle_glossy",
  ];

  constructor() {
    super({ key: "BrickBreakerScene" });
  }

  preload() {
    const basePath = "/assets/game/kenney_puzzle-pack/png/";

    // 패들
    this.load.image("paddle", `${basePath}paddleBlu.png`);

    // 공
    this.load.image("ball", `${basePath}ballBlue.png`);

    // 벽돌 (여러 색상)
    this.brickColors.forEach((color) => {
      this.load.image(color, `${basePath}${color}.png`);
    });

    // UI 버튼
    this.load.image("buttonDefault", `${basePath}buttonDefault.png`);
    this.load.image("buttonSelected", `${basePath}buttonSelected.png`);
  }

  create() {
    // 배경색
    this.cameras.main.setBackgroundColor("#2c3e50");

    // 패들 생성 (화면 아래 중앙)
    this.paddle = this.physics.add.sprite(400, 550, "paddle");
    this.paddle.setScale(1.2);

    // 패들 설정
    this.paddle.setImmovable(true); // 충돌해도 안 밀림
    this.paddle.setCollideWorldBounds(true); // 화면 밖으로 안 나감

    // 키보드 입력 설정
    this.cursors = this.input.keyboard?.createCursorKeys();

    // 공 생성
    this.ball = this.physics.add.sprite(400, 500, "ball");
    this.ball.setCollideWorldBounds(true);
    this.ball.setBounce(1);
    this.ball.setVelocity(200, -200);

    // 벽돌 그룹 생성
    this.bricks = this.physics.add.staticGroup();

    // 벽돌 배치 (가운데 정렬)
    const brickWidth = 64;
    const brickSpacing = 4;
    const cols = 10;
    const totalWidth = cols * brickWidth + (cols - 1) * brickSpacing;
    const startX = (800 - totalWidth) / 2 + brickWidth / 2; // 게임 너비 800 기준 가운데 정렬

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < cols; col++) {
        const brickX = startX + col * (brickWidth + brickSpacing);
        const brickY = 80 + row * 32;
        const brickColor = this.brickColors[row];
        this.bricks.create(brickX, brickY, brickColor);
      }
    }

    // 패들과 공의 충돌 처리
    if (this.ball.body) {
      (this.ball.body as Phaser.Physics.Arcade.Body).onWorldBounds = true;
    }

    // 벽 충돌 이벤트 리스너
    this.physics.world.on("worldbounds", (body: Phaser.Physics.Arcade.Body) => {
      if (body.gameObject === this.ball) {
        // 아래쪽 벽에 부딪혔는지 확인
        if (body.blocked.down) {
          this.gameOver();
        }
      }
    });

    // 점수 텍스트
    this.scoreText = this.add.text(16, 16, "SCORE: 0", {
      fontFamily: '"Press Start 2P"',
      fontSize: "14px",
      color: "#ffffff",
    });

    // 게임 규칙 안내 텍스트
    this.add
      .text(400, 560, "모든 벽돌을 깨면 승리! | A/D: 패들 이동", {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // 공과 패들 충돌
    this.physics.add.collider(
      this.ball,
      this.paddle,
      this.hitPaddle,
      undefined,
      this
    );

    // 공과 벽돌 충돌
    this.physics.add.collider(
      this.ball,
      this.bricks,
      this.hitBrick,
      undefined,
      this
    );

    this.cursors = this.input.keyboard?.createCursorKeys();
  }

  private hitPaddle: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    ball,
    paddle
  ) => {
    // 패들의 어느 위치에 맞았는지에 따라 반사 각도 조절
    const ballSprite = ball as Phaser.Physics.Arcade.Sprite;
    const paddleSprite = paddle as Phaser.Physics.Arcade.Sprite;

    const diff = ballSprite.x - paddleSprite.x;
    ballSprite.setVelocityX(diff * 5);
  };

  private hitBrick: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    ball,
    brick
  ) => {
    // 벽돌 제거
    (brick as Phaser.GameObjects.GameObject).destroy();

    // 점수 증가
    this.score += 10;
    this.scoreText?.setText(`SCORE: ${this.score}`);

    // 모든 벽돌을 깼는지 확인
    if (this.bricks?.countActive() === 0) {
      this.winGame();
    }
  };

  private winGame() {
    this.ball?.setVelocity(0, 0);
    this.paddle?.setVelocity(0, 0);

    // 반투명 오버레이 (승리는 좀 더 밝게)
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.6);
    overlay.setDepth(10);

    // YOU WIN 텍스트
    const winText = this.add
      .text(400, 200, "YOU WIN!", {
        fontFamily: '"Press Start 2P"',
        fontSize: "36px",
        color: "#2ecc71",
      })
      .setOrigin(0.5)
      .setDepth(11);

    // 반짝임 효과
    this.tweens.add({
      targets: winText,
      scale: 1.1,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    // 최종 점수 표시
    this.add
      .text(400, 280, `SCORE`, {
        fontFamily: '"Press Start 2P"',
        fontSize: "14px",
        color: "#95a5a6",
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.add
      .text(400, 320, `${this.score}`, {
        fontFamily: '"Press Start 2P"',
        fontSize: "32px",
        color: "#f1c40f",
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.createRestartButton(11);
  }

  private gameOver() {
    this.ball?.setVelocity(0, 0);
    this.paddle?.setVelocity(0, 0);

    // 반투명 오버레이
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
    overlay.setDepth(10);

    // GAME OVER 텍스트
    const gameOverText = this.add
      .text(400, 200, "GAME OVER", {
        fontFamily: '"Press Start 2P"',
        fontSize: "36px",
        color: "#e74c3c",
      })
      .setOrigin(0.5)
      .setDepth(11);

    // 점멸 효과
    this.tweens.add({
      targets: gameOverText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // 최종 점수 표시
    this.add
      .text(400, 280, `SCORE`, {
        fontFamily: '"Press Start 2P"',
        fontSize: "14px",
        color: "#95a5a6",
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.add
      .text(400, 320, `${this.score}`, {
        fontFamily: '"Press Start 2P"',
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.createRestartButton(11);
  }

  private createRestartButton(depth: number = 0) {
    const buttonStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: "14px",
      color: "#333333",
    };

    // 다시 시작 버튼 (Y: 400)
    const restartBtnBg = this.add
      .image(400, 400, "buttonDefault")
      .setScale(3, 1.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth);

    this.add
      .text(400, 400, "RETRY", buttonStyle)
      .setOrigin(0.5)
      .setDepth(depth);

    restartBtnBg.on("pointerover", () => {
      restartBtnBg.setTexture("buttonSelected").setScale(3.1, 1.6);
    });
    restartBtnBg.on("pointerout", () => {
      restartBtnBg.setTexture("buttonDefault").setScale(3, 1.5);
    });
    restartBtnBg.on("pointerdown", () => {
      this.score = 0;
      this.scene.restart();
    });
  }

  /**
   * 게임 규칙 안내 표시
   */
  private showGameInstructions() {
    // 반투명 오버레이
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
    overlay.setDepth(100);

    // 제목
    this.add
      .text(400, 150, "BRICK BREAKER", {
        fontFamily: '"Press Start 2P"',
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(101);

    // 게임 규칙
    const instructions = [
      "HOW TO PLAY:",
      "",
      "• Use LEFT/RIGHT arrows to move paddle",
      "• Bounce the ball to break all bricks",
      "• Don't let the ball fall down!",
      "• Break all bricks to win",
      "",
      "PRESS SPACE TO START",
    ];

    instructions.forEach((instruction, index) => {
      const isTitle = instruction === "HOW TO PLAY:";
      const isStart = instruction === "PRESS SPACE TO START";
      const isEmpty = instruction === "";

      if (!isEmpty) {
        const text = this.add
          .text(400, 200 + index * 25, instruction, {
            fontFamily:
              isTitle || isStart ? '"Press Start 2P"' : "Arial, sans-serif",
            fontSize: isTitle ? "16px" : isStart ? "14px" : "12px",
            color: isTitle ? "#00ff88" : isStart ? "#ffff00" : "#cccccc",
          })
          .setOrigin(0.5)
          .setDepth(101);

        // 시작 텍스트 깜빡임 효과
        if (isStart) {
          this.tweens.add({
            targets: text,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1,
          });
        }
      }
    });

    // 스페이스 키로 시작
    const spaceKey = this.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    const startHandler = () => {
      if (Phaser.Input.Keyboard.JustDown(spaceKey!)) {
        // 오버레이와 텍스트들 제거
        overlay.destroy();
        this.children.list
          .filter(
            (child) =>
              "depth" in child &&
              (child as Phaser.GameObjects.GameObject & { depth: number })
                .depth >= 100
          )
          .forEach((child) => child.destroy());
        this.input.keyboard?.off("keydown-SPACE", startHandler);
      }
    };
    this.input.keyboard?.on("keydown-SPACE", startHandler);
  }

  update() {
    if (!this.paddle || !this.cursors) return;

    // 왼쪽 화살표 키를 누르고 있으면
    if (this.cursors.left.isDown) {
      this.paddle.setVelocityX(-300); // 왼쪽으로 이동
    }
    // 오른쪽 화살표 키를 누르고 있으면
    else if (this.cursors.right.isDown) {
      this.paddle.setVelocityX(300); // 오른쪽으로 이동
    }
    // 아무 키도 안 누르고 있으면
    else {
      this.paddle.setVelocityX(0); // 멈춤
    }
  }
}
