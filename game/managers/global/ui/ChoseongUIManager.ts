// game/managers/global/ui/ChoseongUIManager.ts
// 초성 퀴즈 게임 UI 관리

import Phaser from "phaser";
import { AvatarManager } from "../AvatarManager";

export class ChoseongUIManager {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private quizText!: Phaser.GameObjects.Text;
  private inputDisplay!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private cursorDisplay!: Phaser.GameObjects.Text;
  private cursorTimer: Phaser.Time.TimerEvent | null = null;
  private hiddenInput!: HTMLInputElement;

  private currentAnswer: string = "";
  private currentInput: string = "";
  private isPlaying: boolean = false;
  private currentNpc: AvatarManager | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 초성 퀴즈 UI 생성
   */
  public create(): void {
    this.container = this.scene.add
      .container(0, 0)
      .setDepth(10000)
      .setVisible(false);

    const panelWidth = 320;
    const panelHeight = 300;

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

    const tail = this.scene.add
      .rectangle(0, -25, 20, 20, 0x2c3e50)
      .setAngle(45)
      .setStrokeStyle(3, 0xffffff);

    // 문제 초성
    this.quizText = this.scene.add
      .text(0, -panelHeight + 50, "", {
        fontSize: "42px",
        fontStyle: "bold",
        color: "#f1c40f",
      })
      .setOrigin(0.5);

    // 힌트
    this.hintText = this.scene.add
      .text(0, -panelHeight + 95, "", {
        fontSize: "16px",
        color: "#bdc3c7",
        fontStyle: "italic",
      })
      .setOrigin(0.5);

    // 입력창 배경
    const inputBg = this.scene.add
      .rectangle(0, -130, 240, 50, 0x34495e)
      .setStrokeStyle(2, 0x7f8c8d)
      .setInteractive({ useHandCursor: true });

    // 입력 텍스트
    this.inputDisplay = this.scene.add
      .text(0, -130, "", { fontSize: "22px", color: "#ffffff" })
      .setOrigin(0.5);

    // 커서
    this.cursorDisplay = this.scene.add
      .text(0, -130, "|", { fontSize: "22px", color: "#ffffff" })
      .setOrigin(0, 0.5)
      .setVisible(false);

    // 확인 버튼
    const submitBtnBg = this.scene.add
      .rectangle(0, -60, 110, 45, 0x27ae60)
      .setInteractive({ useHandCursor: true });
    const submitBtnText = this.scene.add
      .text(0, -60, "정답 확인", { fontSize: "18px", fontStyle: "bold" })
      .setOrigin(0.5);
    submitBtnBg.on("pointerdown", () => this.handleSubmit());

    // 닫기 버튼
    const closeBtn = this.scene.add
      .text(panelWidth / 2 - 20, -panelHeight - 10, "✕", { fontSize: "22px" })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.hide());

    this.container.add([
      tail,
      panelBg,
      this.quizText,
      this.hintText,
      inputBg,
      this.inputDisplay,
      this.cursorDisplay,
      submitBtnBg,
      submitBtnText,
      closeBtn,
    ]);

    this.setupKoreanInput(inputBg);
  }

  /**
   * 한글 입력 설정
   */
  private setupKoreanInput(inputBg: Phaser.GameObjects.Rectangle): void {
    this.hiddenInput = document.createElement("input");
    this.hiddenInput.type = "text";
    Object.assign(this.hiddenInput.style, {
      position: "fixed",
      top: "-100px",
      left: "0",
      width: "1px",
      height: "1px",
      opacity: "0",
    });
    document.body.appendChild(this.hiddenInput);

    inputBg.on("pointerdown", () => {
      this.hiddenInput.focus();
      this.startCursorBlink();
    });

    this.hiddenInput.addEventListener("input", (e) => {
      const val = (e.target as HTMLInputElement).value;
      this.currentInput = val;
      this.inputDisplay.setText(val);

      // 커서 위치 업데이트
      const textWidth = this.inputDisplay.width;
      const newCursorX = textWidth / 2 + 2;
      this.cursorDisplay.setX(newCursorX);
    });

    this.hiddenInput.addEventListener("blur", () => this.stopCursorBlink());
  }

  private startCursorBlink(): void {
    this.stopCursorBlink();
    this.cursorDisplay.setVisible(true);
    this.cursorTimer = this.scene.time.addEvent({
      delay: 500,
      callback: () => {
        this.cursorDisplay.setVisible(!this.cursorDisplay.visible);
      },
      loop: true,
    });
  }

  private stopCursorBlink(): void {
    if (this.cursorTimer) {
      this.cursorTimer.remove();
      this.cursorTimer = null;
    }
    this.cursorDisplay.setVisible(false);
  }

  /**
   * UI 표시
   */
  public show(
    npc: AvatarManager,
    quiz: string,
    answer: string,
    hint: string
  ): void {
    this.currentNpc = npc;
    this.isPlaying = true;
    this.currentAnswer = answer;
    this.currentInput = "";
    this.hiddenInput.value = "";

    this.quizText.setText(quiz);
    this.hintText.setText(`힌트: ${hint}`);
    this.inputDisplay.setText("");
    this.cursorDisplay.setX(0).setVisible(false);

    const target = npc.getContainer();
    const targetY = target.y - target.displayHeight / 2 - 10;
    this.container.setPosition(target.x, targetY).setVisible(true).setAlpha(1);
  }

  /**
   * UI 숨기기
   */
  public hide(): void {
    this.isPlaying = false;
    this.container.setVisible(false);

    this.hiddenInput.value = "";
    this.hiddenInput.blur();

    // 게임 캔버스로 포커스 복원
    if (this.scene.game.canvas) {
      this.scene.game.canvas.focus();
    }

    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.enabled = true;
    }
  }

  /**
   * 정답 제출
   */
  private handleSubmit(): void {
    if (this.currentInput === this.currentAnswer) {
      this.stopCursorBlink();
      this.quizText.setText("정답! 🎉");
      this.scene.time.delayedCall(1500, () => this.hide());
    } else {
      this.scene.cameras.main.shake(200, 0.005);
      this.currentInput = "";
      this.hiddenInput.value = "";
      this.inputDisplay.setText("");
      this.cursorDisplay.setX(0);
      this.hiddenInput.focus();
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
