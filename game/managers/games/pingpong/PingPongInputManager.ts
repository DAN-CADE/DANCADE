// game/managers/games/pingpong/PingPongInputManager.ts

import { BaseInputManager } from "@/game/managers/base";
import { PingPongGameState, PingPongInputState } from "@/game/types/pingpong";

/**
 * 탁구 게임 입력 관리
 */
export class PingPongInputManager extends BaseInputManager {
  private gameState: PingPongGameState;
  private inputState: PingPongInputState;

  private spaceKey!: Phaser.Input.Keyboard.Key;

  private onColorSelect?: (direction: "left" | "right") => void;
  private onServeAdjust?: (direction: "up" | "down") => void;
  private onServe?: () => void;

  constructor(
    scene: Phaser.Scene,
    gameState: PingPongGameState,
    inputState: PingPongInputState,
    callbacks?: {
      onColorSelect?: (direction: "left" | "right") => void;
      onServeAdjust?: (direction: "up" | "down") => void;
      onServe?: () => void;
    }
  ) {
    super(scene);

    this.gameState = gameState;
    this.inputState = inputState;

    if (callbacks) {
      this.onColorSelect = callbacks.onColorSelect;
      this.onServeAdjust = callbacks.onServeAdjust;
      this.onServe = callbacks.onServe;
    }

    this.spaceKey = this.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)!;
  }

  update(): void {
    this.updateInputState();
    this.handleSpaceKey();

    switch (this.gameState.gameMode) {
      case "colorSelect":
        this.handleColorSelectionInput();
        break;
      case "playing":
        if (this.gameState.isPreparingServe) {
          this.handleServePreparationInput();
        }
        break;
    }
  }

  private updateInputState(): void {
    if (!this.cursors) return;
    this.inputState.upPressed = this.cursors.up.isDown;
    this.inputState.downPressed = this.cursors.down.isDown;
  }

  private handleSpaceKey(): void {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      if (
        this.gameState.gameMode === "playing" &&
        this.gameState.isPreparingServe
      ) {
        this.onServe?.();
      }
    }
  }

  private handleColorSelectionInput(): void {
    if (!this.cursors) return;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.onColorSelect?.("left");
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.onColorSelect?.("right");
    }
  }

  private handleServePreparationInput(): void {
    if (!this.cursors) return;
    if (this.gameState.servingPlayer !== "player") return;

    if (this.cursors.up.isDown) {
      this.onServeAdjust?.("up");
    } else if (this.cursors.down.isDown) {
      this.onServeAdjust?.("down");
    }
  }

  getPlayerMoveDirection(): "up" | "down" | null {
    if (!this.gameState.isPlaying) return null;

    if (this.inputState.upPressed) return "up";
    if (this.inputState.downPressed) return "down";
    return null;
  }

  registerRestartListener(_onRestart: () => void): void {
    // 재시작은 UI 버튼 클릭으로 처리됨
  }
}
