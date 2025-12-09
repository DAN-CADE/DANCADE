// game/scenes/BrickBreakerScene.ts
export class BrickBreakerScene extends Phaser.Scene {
  private paddle?: Phaser.Physics.Arcade.Sprite;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private bricks?: Phaser.Physics.Arcade.StaticGroup;
  private ball?: Phaser.Physics.Arcade.Sprite;
  private score: number = 0;
  private scoreText?: Phaser.GameObjects.Text;

  create() {
    // 패들 생성 (화면 아래 중앙)
    this.paddle = this.physics.add.sprite(400, 550, "paddle");

    // 패들 설정
    this.paddle.setImmovable(true); // 충돌해도 안 밀림
    this.paddle.setCollideWorldBounds(true); // 화면 밖으로 안 나감

    // 키보드 입력 설정
    this.cursors = this.input.keyboard?.createCursorKeys();

    this.ball = this.physics.add.sprite(400, 500, "ball");
    this.ball.setCollideWorldBounds(true);
    this.ball.setBounce(1);
    this.ball.setVelocity(150, -150);

    // 벽돌 그룹 생성
    this.bricks = this.physics.add.staticGroup();

    // 벽돌 배치
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 10; col++) {
        const brickX = 80 + col * 64;
        const brickY = 50 + row * 32;
        this.bricks.create(brickX, brickY, "brick").setOrigin(0, 0);
      }
    }

    // 패들과 공의 충돌 처리
    if (this.ball.body) {
      (this.ball.body as Phaser.Physics.Arcade.Body).onWorldBounds = true; // 벽 충돌 감지 활성화
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
    this.scoreText = this.add.text(16, 16, "Score: 0", {
      fontSize: "24px",
      color: "#ffffff",
    });

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
    this.scoreText?.setText(`Score: ${this.score}`);

    // 모든 벽돌을 깼는지 확인
    if (this.bricks?.countActive() === 0) {
      this.winGame();
    }
  };

  private winGame() {
    this.ball?.setVelocity(0, 0);
    this.add
      .text(400, 300, "YOU WIN!", {
        fontSize: "64px",
        color: "#00ff00",
      })
      .setOrigin(0.5);

    this.createRestartButton();
  }

  private gameOver() {
    this.ball?.setVelocity(0, 0);

    this.add
      .text(400, 300, "Game Over", {
        fontSize: "64px",
        color: "#ff0000",
      })
      .setOrigin(0.5);

    this.createRestartButton();
  }

  private createRestartButton() {
    const restartBtn = this.add
      .text(400, 400, "🔄 다시 시작", {
        fontSize: "32px",
        color: "#ffffff",
        backgroundColor: "#333333",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // 호버 효과
    restartBtn.on("pointerover", () => {
      restartBtn.setStyle({ backgroundColor: "#555555" });
    });
    restartBtn.on("pointerout", () => {
      restartBtn.setStyle({ backgroundColor: "#333333" });
    });

    // 클릭 시 재시작
    restartBtn.on("pointerdown", () => {
      this.score = 0;
      this.scene.restart();
    });
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
