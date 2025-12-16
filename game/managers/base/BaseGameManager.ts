// game/managers/base/BaseGameManager.ts
export abstract class BaseGameManager<
  TGameState = unknown,
  TCallbacks extends Record<string, unknown> = Record<string, unknown>
> {
  protected scene: Phaser.Scene;
  protected gameState: TGameState;
  protected callbacks: TCallbacks;

  constructor(
    scene: Phaser.Scene,
    gameState: TGameState,
    callbacks: TCallbacks
  ) {
    this.scene = scene;
    this.gameState = gameState;
    this.callbacks = callbacks;
  }

  /**
   * 게임 오브젝트 설정 (각 게임에서 구현)
   */
  abstract setGameObjects(...args: unknown[]): void;

  /**
   * 게임 리셋 (각 게임에서 구현)
   */
  abstract resetGame(...args: unknown[]): void;

  /**
   * 게임 상태 가져오기
   */
  getGameState(): TGameState {
    return this.gameState;
  }

  /**
   * Callback 호출 헬퍼
   */
  protected callCallback(
    callbackName: keyof TCallbacks,
    ...args: unknown[]
  ): void {
    const callback = this.callbacks[callbackName];
    if (typeof callback === "function") {
      (callback as (...args: unknown[]) => unknown)(...args);
    }
  }

  /**
   * 게임 매니저 종료 시 처리 (각 게임에서 구현)
   */
  destroy(): void {
    // 기본 종료 로직 (필요시 오버라이드)
  }
}
