import { BaseGameNetworkManager } from "@/game/managers/base/multiplayer/game/BaseGameNetworkManager";
import {
  OmokSideType,
  OmokMoveData,
  OmokEvent,
  Point,
  OmokSide,
} from "@/game/types/omok";
import { GameNetworkCallbacks } from "@/game/types/multiplayer/network.types";

export class OmokNetworkManager extends BaseGameNetworkManager<
  OmokMoveData,
  OmokSideType
> {
  constructor(callbacks: GameNetworkCallbacks<OmokMoveData, OmokSideType>) {
    super("omok", callbacks);

    if (!this.isSocketInitialized()) {
      this.initializeSocket();
    }
  }

  // =====================================================================
  // =====================================================================

  protected setupGameActionHandlers() {
    this.safeOnTyped<OmokMoveData>(OmokEvent.MOVED, (data) => {
      if (data.socketId !== this.getSocketId()) {
        console.log("[OmokNetworkManager] 상대방 수:", data);
        this.gameCallbacks.onOpponentAction?.(data);
      }
    });

    this.safeOnTyped<OmokMoveData>(OmokEvent.ASSIGNED, (data) => {
      console.log("[NetworkManager] 서버로부터 색상 수신 (safeOnTyped):", data);

      const role = data.side === 1 ? OmokSide.BLACK : OmokSide.WHITE;
      this.gameCallbacks.onRoleAssigned?.(role, data.roomId);
    });
  }

  public sendGameAction(action: OmokMoveData): void {
    this.sendMove({ row: action.row, col: action.col }, action.side);
  }

  // =====================================================================
  // =====================================================================

  public sendMove(point: Point, side: OmokSideType) {
    const roomId = this.getRoomId();
    const socketId = this.getSocketId();

    if (!roomId) {
      console.error("[OmokNetworkManager] roomId 없음");
      return;
    }

    const { row, col } = point;

    if (socketId) {
      const payload: OmokMoveData = {
        roomId,
        row,
        col,
        side,
        socketId,
      };

      console.log("[OmokNetworkManager] 수 전송:", payload);

      this.safeEmit(OmokEvent.MOVE, payload);
    } else {
      console.error("[OmokNetworkManager] socketId 없음");
    }
  }
}
