// game/managers/pingpong/PingPongInputManager.ts
import {
  PingPongGameState,
  PingPongInputState,
} from "@/game/types/realPingPong";

type GameMode = "menu" | "colorSelect" | "playing";

/**
 * 탁구 게임 입력 관리
 * - 키보드 입력 처리
 * - 게임 모드별 입력 분기
 * - 서브 준비 입력
 */
export class PingPongInputManager {
  private scene: Phaser.Scene;
  private gameState: PingPongGameState;
  private inputState: PingPongInputState;

  // Keyboard Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  // Callbacks
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
    this.scene = scene;
    this.gameState = gameState;
    this.inputState = inputState;

    if (callbacks) {
      this.onSpacePress = callbacks.onSpacePress;
      this.onColorSelect = callbacks.onColorSelect;
      this.onServeAdjust = callbacks.onServeAdjust;
    }

    this.setupInput();
  }

  /**
   * 입력 설정
   */
  private setupInput(): void {
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.spaceKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
  }

  /**
   * 매 프레임 입력 처리
   */
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

  /**
   * 입력 상태 업데이트
   */
  private updateInputState(): void {
    this.inputState.upPressed = this.cursors.up.isDown;
    this.inputState.downPressed = this.cursors.down.isDown;
  }

  /**
   * 스페이스 키 처리
   */
  private handleSpaceKey(): void {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.onSpacePress?.();
    }
  }

  /**
   * 색상 선택 입력 처리
   */
  private handleColorSelectionInput(): void {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.onColorSelect?.("left");
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.onColorSelect?.("right");
    }
  }

  /**
   * 서브 준비 입력 처리
   */
  private handleServePreparationInput(): void {
    if (this.gameState.servingPlayer !== "player") return;

    if (this.cursors.up.isDown) {
      this.onServeAdjust?.("up");
    } else if (this.cursors.down.isDown) {
      this.onServeAdjust?.("down");
    }
  }

  /**
   * 플레이어 이동 방향 가져오기
   */
  getPlayerMoveDirection(): "up" | "down" | null {
    if (!this.gameState.isPlaying) return null;

    if (this.inputState.upPressed) return "up";
    if (this.inputState.downPressed) return "down";
    return null;
  }

  /**
   * 재시작 키 리스너 등록
   */
  registerRestartListener(onRestart: () => void): void {
    const restartHandler = () => {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.scene.input.keyboard?.off("keydown-SPACE", restartHandler);
        onRestart();
      }
    };

    this.scene.input.keyboard?.on("keydown-SPACE", restartHandler);
  }

  /**
   * 정리 (메모리 해제)
   */
  cleanup(): void {
    this.scene.input.keyboard?.removeAllListeners();
  }
}
