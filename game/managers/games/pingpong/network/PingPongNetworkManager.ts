// game/managers/games/pingpong/network/PingPongNetworkManager.ts

import { BaseGameNetworkManager } from "@/game/managers/base/multiplayer/game/BaseGameNetworkManager";
import type {
  PingPongHitData,
  PingPongPaddleMoveData,
} from "@/game/types/pingpong/index";

/**
 * PingPongNetworkManager
 * - BaseGameNetworkManager를 상속받아 핑퐁 전용으로 사용
 * - 공통 로직(빠른 매칭, 역할 배정, 게임 종료)은 Base에서 처리
 * - 핑퐁 전용 액션(공 치기, 패들 이동)만 구현
 */
export class PingPongNetworkManager extends BaseGameNetworkManager<
  PingPongHitData,
  number
> {
  private lastPaddleSyncTime: number = 0;
  private readonly PADDLE_SYNC_INTERVAL = 50; // 50ms마다 패들 위치 전송
  private onRoleAssignedCallback?: (
    role: "left" | "right",
    roomId?: string
  ) => void;

  constructor(
    scene: Phaser.Scene,
    callbacks: {
      onWaiting?: (message: string) => void;
      onRoleAssigned?: (role: "left" | "right", roomId?: string) => void;
      onOpponentHit?: (data: PingPongHitData) => void;
      onOpponentMove?: (data: PingPongPaddleMoveData) => void;
      onGameStart?: () => void;
    }
  ) {
    // Base에 전달 (역할 배정 콜백 이름 변경)
    super("pingpong", {
      onWaiting: callbacks.onWaiting,
      onRoleAssigned: (role: number, roomId?: string) => {
        // role: 1 = left, 2 = right
        const pingpongRole = role === 1 ? "left" : "right";
        callbacks.onRoleAssigned?.(pingpongRole, roomId);
      },
      onOpponentAction: callbacks.onOpponentHit,
      onGameStart: callbacks.onGameStart,
    });

    // 추가 핸들러 설정
    this.setupPaddleMoveHandler(callbacks.onOpponentMove);

    // 소켓 초기화
    if (!this.isSocketInitialized()) {
      this.initializeSocket();
    }
  }

  // =====================================================================
  // 핑퐁 전용: 공 치기/패들 이동
  // =====================================================================

  /**
   * 상대방 공 치기 핸들러 설정
   */
  protected setupGameActionHandlers(): void {
    this.safeOnTyped<PingPongHitData>("pingpong:hit", (data) => {
      // 내 액션은 무시
      if (data.socketId !== this.socket.id) {
        console.log("[PingPongNetwork] 상대방 공 치기:", data);
        this.gameCallbacks.onOpponentAction?.(data);
      }
    });
  }

  /**
   * 상대방 패들 이동 핸들러 설정
   */
  private setupPaddleMoveHandler(
    callback?: (data: PingPongPaddleMoveData) => void
  ): void {
    this.safeOnTyped<PingPongPaddleMoveData>("pingpong:paddleMove", (data) => {
      // 내 패들은 무시
      if (data.socketId !== this.socket.id) {
        callback?.(data);
      }
    });
  }

  /**
   * 공 치기 전송
   */
  public sendGameAction(action: PingPongHitData): void {
    this.sendHit(
      action.ballX,
      action.ballY,
      action.ballVelocityX,
      action.ballVelocityY,
      action.ballSpeed,
      action.paddleY
    );
  }

  /**
   * 공 치기 전송 (핑퐁 전용 메서드)
   */
  public sendHit(
    ballX: number,
    ballY: number,
    ballVelocityX: number,
    ballVelocityY: number,
    ballSpeed: number,
    paddleY: number
  ): void {
    if (!this.roomId) {
      console.error("[PingPongNetwork] roomId 없음");
      return;
    }

    if (!this.socket.id) {
      console.error("[PingPongNetwork] socket.id 없음");
      return;
    }

    const payload: PingPongHitData = {
      roomId: this.roomId,
      socketId: this.socket.id,
      ballX,
      ballY,
      ballVelocityX,
      ballVelocityY,
      ballSpeed,
      paddleY,
      timestamp: Date.now(),
    };

    console.log("[PingPongNetwork] 공 치기 전송:", payload);
    this.safeEmit("pingpong:hit", payload);
  }

  /**
   * 패들 위치 전송 (쓰로틀링 적용)
   */
  public sendPaddleMove(paddleY: number): void {
    const now = Date.now();

    // 쓰로틀링: 50ms마다만 전송
    if (now - this.lastPaddleSyncTime < this.PADDLE_SYNC_INTERVAL) {
      return;
    }

    if (!this.roomId) {
      console.error("[PingPongNetwork] roomId 없음");
      return;
    }

    if (!this.socket.id) {
      console.error("[PingPongNetwork] socket.id 없음");
      return;
    }

    const payload: PingPongPaddleMoveData = {
      roomId: this.roomId,
      socketId: this.socket.id,
      paddleY,
      timestamp: now,
    };

    this.safeEmit("pingpong:paddleMove", payload);
    this.lastPaddleSyncTime = now;
  }

  // =====================================================================
  // BaseGameManager 구현
  // =====================================================================

  setGameObjects(): void {
    // 네트워크 매니저는 게임 오브젝트 없음
  }

  resetGame(): void {
    // 네트워크 매니저는 게임 리셋 없음
    this.lastPaddleSyncTime = 0;
  }

  // =====================================================================
  // 정리
  // =====================================================================

  public cleanup(): void {
    super.cleanup();
    this.safeOff("pingpong:hit");
    this.safeOff("pingpong:paddleMove");
    this.lastPaddleSyncTime = 0;
  }
}
