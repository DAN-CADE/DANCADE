// game/managers/global/ui/RPSGameUIManager.ts
// 가위바위보 게임 UI 관리

import Phaser from "phaser";
import { AvatarManager } from "../AvatarManager";

export type Choice = "rock" | "paper" | "scissors";

const EMOJIS: Record<Choice, string> = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️",
};

export class RPSGameUIManager {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private resultText!: Phaser.GameObjects.Text;
  private isPlaying: boolean = false;
  private currentNpc: AvatarManager | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 가위바위보 UI 초기 생성
   */
  public create(): void {
    this.container = this.scene.add
      .container(0, 0)
      .setDepth(10000)
      .setVisible(false);

    const panelWidth = 320;
    const panelHeight = 220;

    // 패널 배경
    const panelBg = this.scene.add
      .rectangle(
        0,
        -panelHeight / 2 - 20,
        panelWidth,
        panelHeight,
        0x2c3e50,
        0.95
      )
      .setStrokeStyle(3, 0xffffff)
      .setInteractive();

    // 말풍선 꼬리
    const tail = this.scene.add
      .rectangle(0, -25, 20, 20, 0x2c3e50)
      .setAngle(45)
      .setStrokeStyle(3, 0xffffff);

    // 결과 텍스트
    this.resultText = this.scene.add
      .text(0, -panelHeight + 20, "준비됐어?", {
        fontSize: "20px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // 선택 버튼들
    const choices: Choice[] = ["rock", "paper", "scissors"];
    const buttons = choices
      .map((choice, index) => {
        const xPos = -90 + index * 90;
        const yPos = -75;

        const btnBg = this.scene.add
          .rectangle(xPos, yPos, 80, 80, 0x34495e)
          .setStrokeStyle(2, 0x7f8c8d)
          .setInteractive({ useHandCursor: true });

        const btnIcon = this.scene.add
          .text(xPos, yPos, EMOJIS[choice], { fontSize: "30px" })
          .setOrigin(0.5);

        btnBg.on("pointerdown", () => {
          this.handlePlay(choice);
          this.hide();
        });

        return [btnBg, btnIcon];
      })
      .flat();

    // 닫기 버튼
    const closeBtn = this.scene.add
      .text(panelWidth / 2 - 20, -panelHeight - 10, "✕", { fontSize: "22px" })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.hide());

    this.container.add([tail, panelBg, this.resultText, ...buttons, closeBtn]);
  }

  /**
   * UI 표시
   */
  public show(npc: AvatarManager): void {
    this.currentNpc = npc;
    this.isPlaying = true;

    const target = npc.getContainer();
    const targetY = target.y - target.displayHeight / 2 - 10;

    this.container.setPosition(target.x, targetY).setVisible(true).setAlpha(1);
    this.resultText.setText("가위 바위 보!");
  }

  /**
   * UI 숨기기
   */
  public hide(): void {
    this.isPlaying = false;
    this.container.setVisible(false);
  }

  /**
   * 게임 진행
   */
  private handlePlay(playerChoice: Choice): void {
    const options: Choice[] = ["rock", "paper", "scissors"];
    const npcChoice = options[Math.floor(Math.random() * 3)];

    const win =
      (playerChoice === "rock" && npcChoice === "scissors") ||
      (playerChoice === "paper" && npcChoice === "rock") ||
      (playerChoice === "scissors" && npcChoice === "paper");

    const result =
      playerChoice === npcChoice
        ? "비겼어!"
        : win
        ? "네가 이겼어!"
        : "내가 이겼다!";

    this.resultText.setText(`나:${npcChoice}\n${result}`);

    if (this.currentNpc) {
      this.showSpeechBubble(this.currentNpc, `${npcChoice}! ${result}`, 2000);
    }
  }

  /**
   * 말풍선 표시
   */
  public showSpeechBubble(
    target: AvatarManager,
    message: string,
    duration: number = 3000
  ): Phaser.GameObjects.Container {
    const npc = target.getContainer();
    const x = npc.x;
    const y = npc.y - npc.displayHeight / 2 - 20;

    const padding = 12;
    const arrowHeight = 12;

    const text = this.scene.add.text(0, 0, message, {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#000",
      align: "center",
      wordWrap: { width: 160 },
    });

    const b = text.getBounds();
    const width = b.width + padding * 2;
    const height = b.height + padding * 2;
    const bubbleX = -width / 2;
    const bubbleY = -height - arrowHeight;

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xffffff, 1).lineStyle(2, 0x000000, 1);
    graphics.fillRoundedRect(bubbleX, bubbleY, width, height, 10);
    graphics.strokeRoundedRect(bubbleX, bubbleY, width, height, 10);
    graphics
      .beginPath()
      .moveTo(-8, -arrowHeight)
      .lineTo(0, 0)
      .lineTo(8, -arrowHeight)
      .closePath()
      .fillPath()
      .strokePath();

    text.setPosition(bubbleX + padding, bubbleY + padding);

    const container = this.scene.add
      .container(x, y, [graphics, text])
      .setDepth(100);

    if (duration > 0) {
      this.scene.time.delayedCall(duration, () => container.destroy());
    }

    return container;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
