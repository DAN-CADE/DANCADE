// game/scenes/TestScene.ts
import * as Phaser from "phaser"; // 👈 이렇게 변경!

export class TestScene extends Phaser.Scene {
  private score: number = 0;
  private scoreText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "TestScene" });
  }

  preload() {
    console.log("preload 실행");
  }

  create() {
    console.log("create 실행");

    // 배경
    this.add.circle(400, 300, 800, 600, 0x1e90ff);

    // 점수 텍스트
    this.scoreText = this.add.text(16, 16, "Score: 0", {
      fontSize: "32px",
      color: "#ffffff",
    });

    // 테스트용 사각형
    this.add.circle(400, 300, 50, 0xffff00);

    // 클릭하면 점수 증가
    this.input.on("pointerdown", () => {
      this.score += 10;
      this.scoreText?.setText(`Score: ${this.score}`);
    });
  }

  update() {
    // 매 프레임마다 실행
  }
}
