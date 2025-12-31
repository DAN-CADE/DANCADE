// game/managers/games/omok/network/OmokNetworkManager.ts

import { BaseGameNetworkManager } from "@/game/managers/base/multiplayer/game/BaseGameNetworkManager";
import type { OmokMoveData } from "@/game/types/omok";

/**
 * OmokNetworkManager
 * - BaseGameNetworkManager를 상속받아 오목 전용으로 사용
 * - 공통 로직(빠른 매칭, 역할 배정, 게임 종료)은 Base에서 처리
 * - 오목 전용 액션(수 전송)만 구현
 */
export class OmokNetworkManager extends BaseGameNetworkManager<
  {},
  OmokMoveData
> {
  constructor(
    scene: Phaser.Scene,
    callbacks: {
      onWaiting?: (message: string) => void;
      onColorAssigned?: (color: number, roomId?: string) => void;
      onOpponentMove?: (data: OmokMoveData) => void;
      onGameStart?: () => void;
    }
  ) {
    // Base에 전달 (역할 배정 콜백 이름 변경)
    super(scene, {}, "omok", {
      onWaiting: callbacks.onWaiting,
      onRoleAssigned: callbacks.onColorAssigned, // 역할 = 색깔
      onOpponentAction: callbacks.onOpponentMove,
      onGameStart: callbacks.onGameStart,
    });

    // 소켓 초기화
    if (!this.isSocketInitialized()) {
      this.initializeSocket();
    }
  }

  // =====================================================================
  // 오목 전용: 수 전송/수신
  // =====================================================================

  /**
   * 상대방 수 핸들러 설정
   */
  protected setupGameActionHandlers(): void {
    this.safeOnTyped<OmokMoveData>("omok:moved", (data) => {
      // 내 수는 무시
      if (data.socketId !== this.socket.id) {
        console.log("[OmokNetwork] 상대방 수:", data);
        this.gameCallbacks.onOpponentAction?.(data);
      }
    });
  }

  /**
   * 수 전송
   */
  public sendGameAction(action: OmokMoveData): void {
    this.sendMove(action.row, action.col, action.color);
  }

  /**
   * 수 전송 (오목 전용 메서드 - 기존 코드 호환용)
   */
  public sendMove(row: number, col: number, color: number): void {
    if (!this.roomId) {
      console.error("[OmokNetwork] roomId 없음");
      return;
    }

    const payload: OmokMoveData = {
      roomId: this.roomId,
      row,
      col,
      color,
      socketId: this.socket.id,
    };

    console.log("[OmokNetwork] 수 전송:", payload);
    this.safeEmit("omok:move", payload);
  }

  // =====================================================================
  // BaseGameManager 구현
  // =====================================================================

  setGameObjects(): void {
    // 네트워크 매니저는 게임 오브젝트 없음
  }

  resetGame(): void {
    // 네트워크 매니저는 게임 리셋 없음
  }
}
