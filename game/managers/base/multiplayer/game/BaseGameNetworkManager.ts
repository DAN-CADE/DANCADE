import { BaseNetworkManager } from "@/game/managers/base/BaseNetworkManager";
import { GameNetworkCallbacks } from "@/game/types/multiplayer/network.types";
import { getCurrentUser } from "@/lib/utils/auth";

export abstract class BaseGameNetworkManager<
  TGameAction,
  TRole = number
> extends BaseNetworkManager {
  protected gamePrefix: string;
  protected gameCallbacks: GameNetworkCallbacks<TGameAction, TRole>;

  constructor(
    gamePrefix: string,
    callbacks: GameNetworkCallbacks<TGameAction, TRole>
  ) {
    super();
    this.gamePrefix = gamePrefix;
    this.gameCallbacks = callbacks;
  }

  protected setupGameHandlers(): void {
    this.setupQuickMatchHandlers();
    this.setupRoleAssignmentHandlers();
    this.setupGameActionHandlers();
    this.setupGameFlowHandlers();
  }

  // =====================================================================
  // =====================================================================

  private setupQuickMatchHandlers(): void {
    this.safeOnTyped<{ message: string }>(
      `${this.gamePrefix}:waiting`,
      (data) => {
        console.log(
          `[${this.gamePrefix}NetworkManager] 매칭 대기:`,
          data.message
        );
        this.gameCallbacks.onWaiting?.(data.message);
      }
    );
  }

  public async joinMatch(): Promise<void> {
    if (!this.isConnected()) {
      console.error(`[${this.gamePrefix}NetworkManager] 소켓 미연결`);
      return;
    }

    const user = await getCurrentUser();
    if (!user) {
      console.error(`[${this.gamePrefix}NetworkManager] 유저 정보 없음`);
      return;
    }

    const payload = {
      userId: user.userId,
      nickname: user.nickname,
      uuid: user.uuid || user.userId,
    };

    this.safeEmit(`${this.gamePrefix}:quickMatch`, payload);
    console.log(`[${this.gamePrefix}NetworkManager] 빠른 매칭 요청`, payload);
  }

  // =====================================================================
  // =====================================================================

  protected setupRoleAssignmentHandlers(): void {
    this.safeOnTyped<{ role: TRole; roomId: string }>(
      `${this.gamePrefix}:assigned`,
      (data) => {
        this.gameCallbacks.onRoleAssigned?.(data.role, data.roomId);
      }
    );
  }

  // =====================================================================
  // =====================================================================

  private setupGameFlowHandlers(): void {
    this.safeOnTyped<{ roomId: string; roomData: unknown }>(
      `${this.gamePrefix}:gameStart`,
      (data) => {
        console.log(`[${this.gamePrefix}NetworkManager] 게임 시작`, data);
        this.gameCallbacks.onGameStart?.();
      }
    );

    this.safeOnTyped<{ winner: TRole; roomData: unknown }>(
      `${this.gamePrefix}:gameOver`,
      (data) => {
        console.log(`[${this.gamePrefix}Network] 게임 종료:`, data);
        this.gameCallbacks.onGameOver?.(data.winner);
      }
    );
  }

  public notifyGameOver(winner: TRole): void {
    if (!this.getRoomId()) {
      console.error(`[${this.gamePrefix}NetworkManager] roomId 없음`);
      return;
    }

    const payload = {
      roomId: this.getRoomId(),
      winner,
    };

    console.log(`[${this.gamePrefix}NetworkManager] 게임 종료 알림`, payload);
    this.safeEmit(`${this.gamePrefix}:gameOver`, payload);
  }

  // =====================================================================
  // =====================================================================

  protected abstract setupGameActionHandlers(): void;

  protected abstract sendGameAction(action: TGameAction): void;

  // =====================================================================
  // =====================================================================

  cleanup(): void {
    this.safeOff(`${this.gamePrefix}:waiting`);
    this.safeOff(`${this.gamePrefix}:assigned`);
    this.safeOff(`${this.gamePrefix}:gameStart`);
    this.safeOff(`${this.gamePrefix}:gameOver`);

    console.log(`[${this.gamePrefix}Network] 정리 완료`);
  }
}
