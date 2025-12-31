// server/handlers/games/pingpong/PingPongMatchmaking.js

const BaseMatchmaking = require("../../base/BaseMatchmaking");

/**
 * PingPongMatchmaking
 * - BaseMatchmaking을 상속받아 핑퐁 전용으로 사용
 * - 역할 할당(왼쪽/오른쪽)만 구현하면 끝!
 */
class PingPongMatchmaking extends BaseMatchmaking {
  /**
   * @param {Object} io - Socket.IO 서버 인스턴스
   * @param {Object} socket - 클라이언트 소켓
   * @param {Map} rooms - 방 목록
   */
  constructor(io, socket, rooms) {
    // Base에 설정 전달
    super(io, socket, rooms, "pingpong", {
      maxPlayers: 2, // 핑퐁은 2명
      quickMatchRoomId: "pingpong_quick_match",
    });
  }

  // =====================================================================
  // 핑퐁 전용: 역할 할당 (left/right)
  // =====================================================================

  /**
   * 역할 할당 - left(왼쪽) / right(오른쪽)
   * @param {Object} room - 방 객체
   */
  assignRoles(room) {
    room.players.forEach((player, index) => {
      // 첫 번째 플레이어 = left(선공), 두 번째 = right(후공)
      player.side = index === 0 ? "left" : "right";
      player.role = index + 1; // 1 or 2 (클라이언트 호환용)

      // 개별 알림
      this.io.to(player.socketId).emit("pingpong:assigned", {
        side: player.side,
        role: player.role,
        roomId: this.QUICK_MATCH_ROOM,
      });

      console.log(
        `[핑퐁][빠른매칭] ${player.username} → ${
          player.side === "left" ? "왼쪽(선공)" : "오른쪽(후공)"
        } 할당`
      );
    });
  }
}

module.exports = PingPongMatchmaking;
