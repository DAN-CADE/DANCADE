// game/managers/games/pingpong/PingPongInputManager.ts

import { BaseInputManager } from "@/game/managers/base";
import {
  PingPongGameState,
  PingPongInputState,
} from "@/game/types/realPingPong";

/**
 * 탁구 게임 입력 관리
 */
export class PingPongInputManager extends BaseInputManager {
  private gameState: PingPongGameState;
  private inputState: PingPongInputState;

  private spaceKey!: Phaser.Input.Keyboard.Key;

  private onSpacePress?: () => void;
  private onColorSelect?: (direction: "left" | "right") => void;
  private onServeAdjust?: (direction: "up" | "down") => void;

  constructor(
    scene: Phaser.Scene,
    gameState: PingPongGameState,
    inputState: PingPongInputState,
    callbacks?: {
      onSpacePress?: () => void;
      onColorSelect?: (direction: "left" | "right") => void;
      onServeAdjust?: (direction: "up" | "down") => void;
    }
  ) {
    super(scene);

    this.gameState = gameState;
    this.inputState = inputState;

    if (callbacks) {
      this.onSpacePress = callbacks.onSpacePress;
      this.onColorSelect = callbacks.onColorSelect;
      this.onServeAdjust = callbacks.onServeAdjust;
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
      this.onSpacePress?.();
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

  registerRestartListener(onRestart: () => void): void {
    const restartHandler = () => {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.scene.input.keyboard?.off("keydown-SPACE", restartHandler);
        onRestart();
      }
    };

    this.scene.input.keyboard?.on("keydown-SPACE", restartHandler);
  }
}
