// handlers/base/PlayerManager.js

const {
  validateRoomExists,
  validatePlayerInRoom,
} = require("./utils/validation");

const { notifyPlayerReady, notifyAllReady } = require("./utils/eventEmitters");

/**
 * 플레이어 관리 클래스
 * - 플레이어 준비 상태, 게임 준비 체크 등
 */
class playerManager {
  /**
   * @param {Object} io - Socket.IO 서버 인스턴스
   * @param {Object} socket - 클라이언트 소켓
   * @param {Map} rooms - 방 목록
   * @param {string} gamePrefix - 게임 타입
   * @param {Object} config - 게임 설정
   */
  constructor(io, socket, rooms, gamePrefix, config) {
    this.io = io;
    this.socket = socket;
    this.rooms = rooms;
    this.gamePrefix = gamePrefix;
    this.config = config;
  }

  /**
   * 이벤트 핸들러 등록
   */
  registerHandlers() {
    this.socket.on(`${this.gamePrefix}:toggleReady`, (data) =>
      this.handleToggleReady(data)
    );
  }

  /**
   * 준비 상태 토글 핸들러
   * @param {Object} data
   * @param {string} data.roomId - 방 ID
   */
  handleToggleReady(data) {
    const { roomId } = data;
    const room = this.rooms.get(roomId);

    // 방 검증
    if (!validateRoomExists(room, this.socket, this.gamePrefix)) {
      return;
    }

    // 플레이어 검증
    const player = validatePlayerInRoom(
      room,
      this.socket.id,
      this.socket,
      this.gamePrefix
    );
    if (!player) return;

    // 방장은 준비 불필요
    if (player.socketId === room.hostSocketId) {
      this.socket.emit(`${this.gamePrefix}:error`, {
        message: "방장은 준비가 필요 없습니다.",
      });
      return;
    }

    // 준비 상태 토글
    player.isReady = !player.isReady;

    console.log(
      `[${this.gamePrefix}][준비토글] ${this.socket.id} - ${player.isReady}`
    );

    // 알림
    notifyPlayerReady(
      this.io,
      roomId,
      this.socket.id,
      player.isReady,
      room,
      this.gamePrefix
    );

    // 모든 플레이어 준비 체크
    this.checkAllReady(room);
  }

  /**
   * 모든 플레이어 준비 상태 체크
   * @param {Object} room - 방 객체
   */
  checkAllReady(room) {
    // 최소 인원 미달
    if (room.players.length < this.config.minPlayers) {
      return;
    }

    // 모든 플레이어 준비 확인 (방장 제외)
    const allReady = room.players.every(
      (p) => p.isReady || p.socketId === room.hostSocketId
    );

    if (allReady) {
      notifyAllReady(this.io, room.roomId, this.gamePrefix);
    }
  }
}

module.exports = playerManager;
