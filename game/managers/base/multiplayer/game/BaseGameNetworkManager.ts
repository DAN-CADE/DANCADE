// game/managers/base/multiplayer/game/BaseGameNetworkManager.ts

import { BaseNetworkManager } from "@/game/managers/base/BaseNetworkManager";

/**
 * 게임 진행 중 네트워크 콜백
 */
export interface GameNetworkCallbacks<TGameAction> {
  onWaiting?: (message: string) => void;
  onRoleAssigned?: (role: number, roomId?: string) => void; // 역할 배정 (1P/2P, 흑/백 등)
  onOpponentAction?: (action: TGameAction) => void; // 상대방 액션
  onGameStart?: () => void;
  onGameOver?: (winner: number) => void;
}

/**
 * BaseGameNetworkManager
 * - 게임 진행 중 네트워크 로직의 공통 구조
 * - 빠른 매칭, 역할 배정, 액션 전송 등
 * - 게임별로 액션 타입만 다르게 설정
 */
export abstract class BaseGameNetworkManager<
  TState,
  TGameAction
> extends BaseNetworkManager<TState> {
  protected gamePrefix: string;
  protected gameCallbacks: GameNetworkCallbacks<TGameAction>;

  constructor(
    scene: Phaser.Scene,
    gameState: TState,
    gamePrefix: string,
    callbacks: GameNetworkCallbacks<TGameAction>
  ) {
    super(scene, gameState, null);
    this.gamePrefix = gamePrefix;
    this.gameCallbacks = callbacks;
  }

  // =====================================================================
  // 공통: 게임 핸들러 설정
  // =====================================================================

  protected setupGameHandlers(): void {
    this.setupQuickMatchHandlers();
    this.setupRoleAssignmentHandlers();
    this.setupGameActionHandlers();
    this.setupGameFlowHandlers();
  }

  // =====================================================================
  // 빠른 매칭 (완전 공통)
  // =====================================================================

  /**
   * 빠른 매칭 핸들러 설정
   */
  private setupQuickMatchHandlers(): void {
    // 매칭 대기
    this.safeOnTyped<{ message: string }>(
      `${this.gamePrefix}:waiting`,
      (data) => {
        console.log(`[${this.gamePrefix}Network] 매칭 대기:`, data.message);
        this.gameCallbacks.onWaiting?.(data.message);
      }
    );
  }

  /**
   * 빠른 매칭 요청
   */
  public joinMatch(): void {
    if (!this.isConnected()) {
      console.error(`[${this.gamePrefix}Network] 소켓 미연결`);
      return;
    }

    this.safeEmit(`${this.gamePrefix}:quickMatch`);
    console.log(`[${this.gamePrefix}Network] 빠른 매칭 요청`);
  }

  // =====================================================================
  // 역할 배정 (완전 공통)
  // =====================================================================

  /**
   * 역할 배정 핸들러 설정
   */
  private setupRoleAssignmentHandlers(): void {
    this.safeOnTyped<{ color: number; roomId: string }>(
      `${this.gamePrefix}:assigned`,
      (data) => {
        console.log(`[${this.gamePrefix}Network] 역할 배정:`, data);

        if (data.roomId) {
          this.setRoomId(data.roomId);
        }

        this.gameCallbacks.onRoleAssigned?.(data.color, data.roomId);
      }
    );
  }

  // =====================================================================
  // 게임 액션 (게임별 구현)
  // =====================================================================

  /**
   * 게임 액션 핸들러 설정 (게임별 구현)
   */
  protected abstract setupGameActionHandlers(): void;

  /**
   * 게임 액션 전송 (게임별 구현)
   */
  public abstract sendGameAction(action: TGameAction): void;

  // =====================================================================
  // 게임 흐름 (완전 공통)
  // =====================================================================

  /**
   * 게임 시작/종료 핸들러 설정
   */
  private setupGameFlowHandlers(): void {
    // 게임 시작
    this.safeOnTyped<{ roomId: string; roomData: any }>(
      `${this.gamePrefix}:gameStart`,
      (data) => {
        console.log(`🎮 [${this.gamePrefix}Network] 게임 시작:`, data);
        this.gameCallbacks.onGameStart?.();
      }
    );

    // 게임 종료
    this.safeOnTyped<{ winner: number; roomData: any }>(
      `${this.gamePrefix}:gameOver`,
      (data) => {
        console.log(`[${this.gamePrefix}Network] 게임 종료:`, data);
        this.gameCallbacks.onGameOver?.(data.winner);
      }
    );
  }

  /**
   * 게임 종료 알림 (완전 공통)
   */
  public notifyGameOver(winner: number): void {
    if (!this.roomId) {
      console.error(`[${this.gamePrefix}Network] roomId 없음`);
      return;
    }

    const payload = {
      roomId: this.roomId,
      winner,
    };

    console.log(`[${this.gamePrefix}Network] 게임 종료 알림:`, payload);
    this.safeEmit(`${this.gamePrefix}:gameOver`, payload);
  }

  // =====================================================================
  // 정리
  // =====================================================================

  public cleanup(): void {
    this.safeOff(`${this.gamePrefix}:waiting`);
    this.safeOff(`${this.gamePrefix}:assigned`);
    this.safeOff(`${this.gamePrefix}:gameStart`);
    this.safeOff(`${this.gamePrefix}:gameOver`);

    console.log(`[${this.gamePrefix}Network] 정리 완료`);
  }
}
