/* eslint-disable @typescript-eslint/no-require-imports */
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

  /**
   * 이벤트 핸들러 등록
   */
  registerHandlers() {
    super.registerHandlers(); // BaseMatchmaking의 핸들러 등록

    // 방장 색상 선택 변경 (대기 중)
    this.socket.on("pingpong:update_host_preference", (payload) =>
      this.handleUpdateHostPreference(payload)
    );
  }

  /**
   * 방장 성향(색상) 업데이트
   * @param {Object} payload - { color: 'red' | 'blue' }
   */
  handleUpdateHostPreference(payload) {
    const { color } = payload;
    // 현재 소켓이 방장으로 있는 대기 방 찾기
    const room = Array.from(this.rooms.values()).find(
      (r) =>
        r.gameType === "pingpong" &&
        r.status === "waiting" &&
        r.hostSocketId === this.socket.id
    );

    if (room) {
      room.hostColor = color; // 방 정보에 선호 색상 저장
      console.log(
        `[핑퐁][대기방] 방장(${this.socket.id}) 색상 변경 → ${color}`
      );
    }
  }

  // =====================================================================
  // 핑퐁 전용: 역할 할당 (left/right)
  // =====================================================================

  /**
   * 역할 할당 - left(왼쪽) / right(오른쪽)
   * 방장이 선택한 색상(hostColor)을 반영
   * - RED: Left (1P)
   * - BLUE: Right (2P)
   * @param {Object} room - 방 객체
   */
  assignRoles(room) {
    // 방장 기본값: RED(Left)
    const hostColor = room.hostColor || "red";
    const hostSide = hostColor === "red" ? "left" : "right";

    console.log(`[핑퐁][게임시작] 방장 선택 색상: ${hostColor} (${hostSide})`);

    room.players.forEach((player) => {
      const isHost = player.socketId === room.hostSocketId;

      if (isHost) {
        // 방장에게 선택한 사이드 할당
        player.side = hostSide;
        player.role = hostSide === "left" ? 1 : 2;
      } else {
        // 도전자에게 반대 사이드 할당
        player.side = hostSide === "left" ? "right" : "left";
        player.role = hostSide === "left" ? 2 : 1;
      }

      // 개별 알림
      this.io.to(player.socketId).emit("pingpong:assigned", {
        side: player.side,
        role: player.role,
        roomId: this.QUICK_MATCH_ROOM,
        myColor: player.side === "left" ? "red" : "blue", // 클라이언트 표시용
        opponentColor: player.side === "left" ? "blue" : "red",
      });

      console.log(
        `[핑퐁][역할할당] ${player.username}(${isHost ? "방장" : "도전자"}) → ${
          player.side
        } (${player.side === "left" ? "RED" : "BLUE"})`
      );
    });
  }
}

module.exports = PingPongMatchmaking;
