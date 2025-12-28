// handlers/games/omok/OmokGameManager.js

const {
  validateRoomExists,
  validateIsHost,
} = require("../../base/utils/validation");

/**
 * 오목 게임 시작/종료 관리
 */
class omokGameManager {
  /**
   * @param {Object} io - Socket.IO 서버 인스턴스
   * @param {Object} socket - 클라이언트 소켓
   * @param {Map} rooms - 방 목록
   */
  constructor(io, socket, rooms) {
    this.io = io;
    this.socket = socket;
    this.rooms = rooms;
    this.gamePrefix = "omok";
  }

  /**
   * 이벤트 핸들러 등록
   */
  registerHandlers() {
    this.socket.on("omok:startGame", (data) => this.handleStartGame(data));
    this.socket.on("omok:move", (data) => this.handleMove(data));
    this.socket.on("omok:gameOver", (data) => this.handleGameOver(data));
  }

  /**
   * 게임 시작 핸들러
   * @param {Object} data
   * @param {string} data.roomId - 방 ID
   */
  handleStartGame(data) {
    const { roomId } = data;
    const room = this.rooms.get(roomId);

    // 검증
    if (!validateRoomExists(room, this.socket, this.gamePrefix)) return;
    if (!validateIsHost(room, this.socket.id, this.socket, this.gamePrefix))
      return;

    if (room.players.length < 2) {
      this.socket.emit("omok:error", {
        message: "2명이 모여야 시작할 수 있습니다.",
      });
      return;
    }

    const allReady = room.players.every(
      (p) => p.isReady || p.socketId === room.hostSocketId
    );

    if (!allReady) {
      this.socket.emit("omok:error", {
        message: "모든 플레이어가 준비해야 합니다.",
      });
      return;
    }

    // 게임 시작
    this.startGame(room);
  }

  /**
   * 게임 시작 실행
   * @param {Object} room - 방 객체
   */
  startGame(room) {
    room.status = "playing";
    console.log(`[오목][게임시작] ${room.roomId}`);

    // 색깔 할당
    this.assignColors(room);

    // 게임 시작 알림
    this.io.to(room.roomId).emit("omok:gameStart", {
      roomData: room,
      roomId: room.roomId,
    });

    console.log(`[오목][게임시작완료] ${room.roomId}`);
  }

  /**
   * 플레이어에게 색깔 할당 (방장=흑돌, 입장자=백돌)
   * @param {Object} room - 방 객체
   */
  assignColors(room) {
    room.players.forEach((p) => {
      const isHost = p.socketId === room.hostSocketId;
      p.color = isHost ? 1 : 2; // 방장=흑돌(1), 입장자=백돌(2)

      this.io.to(p.socketId).emit("omok:assigned", {
        color: p.color,
        roomId: room.roomId,
      });

      console.log(
        `[오목][색깔할당] ${p.username} → ${
          p.color === 1 ? "흑돌(선공)" : "백돌(후공)"
        } ${isHost ? "(방장)" : ""}`
      );
    });
  }

  /**
   * 수 전송 핸들러
   * @param {Object} data
   * @param {string} data.roomId - 방 ID
   * @param {number} data.row - 행
   * @param {number} data.col - 열
   * @param {number} data.color - 돌 색깔
   */
  handleMove(data) {
    const { roomId, row, col, color } = data;

    // 필수 데이터 체크
    if (
      !roomId ||
      row === undefined ||
      col === undefined ||
      color === undefined
    ) {
      this.socket.emit("omok:error", { message: "잘못된 수 데이터" });
      return;
    }

    const room = this.rooms.get(roomId);
    if (!validateRoomExists(room, this.socket, this.gamePrefix)) return;

    // 상대방에게 수 전송
    this.socket.to(roomId).emit("omok:moved", {
      socketId: this.socket.id,
      row,
      col,
      color,
    });
  }

  /**
   * 게임 종료 핸들러
   * @param {Object} data
   * @param {string} data.roomId - 방 ID
   * @param {number} data.winner - 승자 (1: 흑, 2: 백)
   */
  handleGameOver(data) {
    const { roomId, winner } = data;

    const room = this.rooms.get(roomId);
    if (room) {
      room.status = "finished";
      this.io.to(roomId).emit("omok:gameOver", { winner, roomData: room });

      // 빠른 매칭 방은 삭제
      if (roomId === "omok_quick_match") {
        this.rooms.delete(roomId);
      }
    }
  }
}

module.exports = omokGameManager;
