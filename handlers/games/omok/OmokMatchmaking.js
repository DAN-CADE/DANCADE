const BaseMatchmaking = require("../../base/BaseMatchmaking");

/**
 * OmokMatchmaking
 * - BaseMatchmaking을 상속받아 오목 전용으로 사용
 */
class OmokMatchmaking extends BaseMatchmaking {
  /**
   * @param {Object} io - Socket.IO 서버 인스턴스
   * @param {Object} socket - 클라이언트 소켓
   * @param {Map} rooms - 방 목록
   */
  constructor(io, socket, rooms, supabase) {
    // Base에 설정 전달
    super(io, socket, rooms, "omok", {
      maxPlayers: 2,
      supabase: supabase,
    });
  }

  // =====================================================================
  // 오목 전용: 역할 할당 (흑돌/백돌)
  // =====================================================================

  /**
   * 역할 할당 - 흑돌(1) / 백돌(2)
   * @param {Object} room - 방 객체
   */
  assignRoles(room) {
    room.players.forEach((player, index) => {
      // 첫 번째 플레이어 = 흑돌(선공), 두 번째 = 백돌(후공)
      player.side = index === 0 ? 1 : 2;

      // 개별 알림
      this.io.to(player.socketId).emit("omok:assigned", {
        side: player.side,
        color: player.side,
        roomId: room.roomId,
      });

      console.log(
        `[오목][빠른매칭] ${player.username} → ${
          player.side === 1 ? "흑돌(선공)" : "백돌(후공)"
        } 할당 (방ID: ${room.roomId})`
      );
    });
  }
}

module.exports = OmokMatchmaking;
