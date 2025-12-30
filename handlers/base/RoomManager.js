// handlers/base/RoomManager.js

const {
  generateRoomId,
  getRoomList,
  createRoomData,
  createPlayerData,
} = require("./utils/RoomUtils");

const {
  validateRoomExists,
  validateRoomNotFull,
  validateRoomPassword,
  validateNotAlreadyInRoom,
  validateUsername,
} = require("./utils/Validation");

const {
  broadcastRoomListUpdate,
  notifyPlayerJoined,
  notifyPlayerLeft,
  notifyHostChanged,
  notifyGameAborted,
} = require("./utils/EventEmitters");

/**
 * 방 관리 클래스
 * - 방 생성, 입장, 나가기, 방장 변경 등
 */
class RoomManager {
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
    this.socket.on(`${this.gamePrefix}:createRoom`, (data) =>
      this.handleCreateRoom(data)
    );
    this.socket.on(`${this.gamePrefix}:joinRoom`, (data) =>
      this.handleJoinRoom(data)
    );
    this.socket.on(`${this.gamePrefix}:leaveRoom`, (data) =>
      this.handleLeaveRoom(data)
    );
    this.socket.on(`${this.gamePrefix}:getRoomList`, () =>
      this.handleGetRoomList()
    );
  }

  /**
   * 방 생성 핸들러
   * @param {Object} data
   * @param {string} data.roomName - 방 이름
   * @param {boolean} [data.isPrivate] - 비공개 여부
   * @param {string} [data.password] - 방 비밀번호
   * @param {string} data.username - 사용자 이름
   */
  handleCreateRoom(data) {
    const { roomName, isPrivate, password, username } = data;

    // 검증
    if (!validateUsername(username, this.socket, this.gamePrefix)) {
      return;
    }

    // 방 생성
    const roomId = generateRoomId();
    const roomData = createRoomData({
      roomId,
      roomName,
      gamePrefix: this.gamePrefix,
      hostSocketId: this.socket.id,
      username,
      isPrivate,
      password,
      maxPlayers: this.config.maxPlayers,
    });

    this.rooms.set(roomId, roomData);
    this.socket.join(roomId);

    console.log(
      `[${this.gamePrefix}][방생성] ${roomId} - ${roomData.roomName} (방장: ${this.socket.id})`
    );

    // 응답
    this.socket.emit(`${this.gamePrefix}:roomCreated`, { roomId, roomData });
    broadcastRoomListUpdate(this.io, this.rooms, this.gamePrefix);
  }

  /**
   * 방 입장 핸들러
   * @param {Object} data
   * @param {string} data.roomId - 방 ID
   * @param {string} [data.password] - 방 비밀번호
   * @param {string} data.username - 사용자 이름
   */
  handleJoinRoom(data) {
    const { roomId, password, username } = data;

    // 필수 데이터 체크
    if (!roomId || !username) {
      this.socket.emit(`${this.gamePrefix}:joinError`, {
        message: "방 ID와 사용자 이름이 필요합니다.",
      });
      return;
    }

    const room = this.rooms.get(roomId);

    // 검증
    if (!validateRoomExists(room, this.socket, this.gamePrefix)) return;
    if (!validateRoomNotFull(room, this.socket, this.gamePrefix)) return;
    if (!validateRoomPassword(room, password, this.socket, this.gamePrefix))
      return;
    if (
      !validateNotAlreadyInRoom(
        room,
        this.socket.id,
        this.socket,
        this.gamePrefix
      )
    )
      return;

    // 플레이어 추가
    const newPlayer = createPlayerData(this.socket.id, username);
    room.players.push(newPlayer);
    room.playerCount = room.players.length;
    this.socket.join(roomId);

    console.log(`[${this.gamePrefix}][방입장] ${this.socket.id} → ${roomId}`);

    // 알림
    notifyPlayerJoined(this.io, roomId, newPlayer, room, this.gamePrefix);
    this.socket.emit(`${this.gamePrefix}:joinSuccess`, { roomData: room });
    broadcastRoomListUpdate(this.io, this.rooms, this.gamePrefix);

    // 자동 시작 체크
    if (this.config.autoStart && room.players.length === room.maxPlayers) {
      this.handleAutoStart(room);
    }
  }

  /**
   * 방 나가기 핸들러
   * @param {Object} data
   * @param {string} data.roomId - 방 ID
   */
  handleLeaveRoom(data) {
    const { roomId } = data;
    this.leaveRoom(roomId);
  }

  /**
   * 방 목록 요청 핸들러
   */
  handleGetRoomList() {
    this.socket.emit(
      `${this.gamePrefix}:roomListUpdate`,
      getRoomList(this.rooms, this.gamePrefix)
    );
  }

  /**
   * 방 나가기 실행
   * @param {string} roomId - 방 ID
   */
  leaveRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const playerIndex = room.players.findIndex(
      (p) => p.socketId === this.socket.id
    );
    if (playerIndex === -1) return;

    const wasHost = this.socket.id === room.hostSocketId;
    const leavingPlayer = room.players[playerIndex];

    // 플레이어 제거
    room.players.splice(playerIndex, 1);
    room.playerCount = room.players.length;
    this.socket.leave(roomId);

    console.log(`[${this.gamePrefix}][방퇴장] ${this.socket.id} ← ${roomId}`);

    // 방이 비었으면 삭제
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      console.log(`[${this.gamePrefix}][방삭제] ${roomId}`);
      return;
    }

    // 방장 변경
    if (wasHost) {
      room.hostSocketId = room.players[0].socketId;
      notifyHostChanged(
        this.io,
        roomId,
        room.hostSocketId,
        room,
        this.gamePrefix
      );
      console.log(`[${this.gamePrefix}][방장변경] ${room.hostSocketId}`);
    }

    // 게임 상태에 따른 처리
    if (room.status === "playing") {
      this.handleGameAbortedByLeaving(room, leavingPlayer);
    } else {
      notifyPlayerLeft(
        this.io,
        roomId,
        this.socket.id,
        leavingPlayer.username || "플레이어",
        room,
        this.gamePrefix
      );
    }

    // 나간 플레이어에게 알림
    this.socket.emit(`${this.gamePrefix}:leftRoom`, { roomId });

    // 방 목록 업데이트
    broadcastRoomListUpdate(this.io, this.rooms, this.gamePrefix);
  }

  /**
   * 게임 중 플레이어 나감으로 인한 중단 처리
   * @param {Object} room - 방 객체
   * @param {Object} leavingPlayer - 나간 플레이어
   */
  handleGameAbortedByLeaving(room, leavingPlayer) {
    console.log(
      `[${this.gamePrefix}][게임중단] ${room.roomId} - 플레이어 나감`
    );

    room.status = "finished";

    notifyGameAborted(
      this.io,
      room.roomId,
      "상대방의 연결이 끊어졌습니다.",
      leavingPlayer.username || "플레이어",
      room,
      this.gamePrefix
    );
  }

  /**
   * 자동 시작 처리
   * @param {Object} room - 방 객체
   */
  handleAutoStart(room) {
    console.log(`[${this.gamePrefix}][자동시작] ${room.roomId} - 인원 충족`);

    room.players.forEach((player) => {
      player.isReady = true;
    });

    const { notifyAutoStart } = require("./utils/eventEmitters");
    notifyAutoStart(this.io, room, this.gamePrefix);
  }

  /**
   * 연결 해제 시 모든 방에서 제거
   */
  handleDisconnect() {
    console.log(`[${this.gamePrefix}][연결해제] ${this.socket.id}`);

    this.rooms.forEach((room, roomId) => {
      if (room.gameType === this.gamePrefix) {
        const playerIndex = room.players.findIndex(
          (p) => p.socketId === this.socket.id
        );
        if (playerIndex !== -1) {
          this.leaveRoom(roomId);
        }
      }
    });
  }
}

module.exports = RoomManager;
