// handlers/base/RoomManager.js

const axios = require("axios");

const NEXT_API_URL = process.env.NEXT_API_URL || "http://localhost:3000";

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
  notifyAutoStart,
} = require("./utils/EventEmitters");

// =====================================================================
/**
 * 방 관리 클래스
 */
// =====================================================================
class RoomManager {
  constructor(io, socket, rooms, gamePrefix, config) {
    this.io = io;
    this.socket = socket;
    this.rooms = rooms;
    this.gamePrefix = gamePrefix;
    this.config = config;
  }

  // ----------------------------- 이벤트 등록

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
    this.socket.on(`${this.gamePrefix}:requestRematch`, (data) =>
      this.handleRequestRematch(data)
    );
    this.socket.on(`${this.gamePrefix}:acceptRematch`, (data) =>
      this.handleAcceptRematch(data)
    );
    this.socket.on(`${this.gamePrefix}:declineRematch`, (data) =>
      this.handleDeclineRematch(data)
    );
  }

  // ----------------------------- 방 생성

  async handleCreateRoom(data) {
    const { roomName, isPrivate, password, userId, username, userUUID } = data;

    console.log(`[${this.gamePrefix}] 방 생성 요청:`, { roomName, username });

    // 유효성 검증
    if (!validateUsername(username, this.socket, this.gamePrefix)) {
      return;
    }

    // 방 데이터 생성
    const roomId = generateRoomId();
    const roomData = createRoomData({
      roomId,
      roomName,
      gamePrefix: this.gamePrefix,
      hostSocketId: this.socket.id,
      userId,
      username,
      userUUID,
      isPrivate,
      password,
      maxPlayers: this.config.maxPlayers,
    });

    // 방 등록 및 소켓 룸 참가
    this.rooms.set(roomId, roomData);
    this.socket.join(roomId);

    // DB 저장
    await this.saveRoomToDatabase(
      roomId,
      roomName,
      userUUID,
      isPrivate,
      password
    );

    // 클라이언트에 응답
    this.socket.emit(`${this.gamePrefix}:roomCreated`, { roomId, roomData });
    await broadcastRoomListUpdate(this.io, this.rooms, this.gamePrefix);

    console.log(`[${this.gamePrefix}] 방 생성 완료: ${roomId}`);
  }

  async saveRoomToDatabase(roomId, roomName, userUUID, isPrivate, password) {
    try {
      await axios.post(`${NEXT_API_URL}/api/rooms`, {
        id: roomId,
        room_name: roomName,
        game_type: this.gamePrefix,
        host_user_id: userUUID ?? null,
        status: "waiting",
        is_private: isPrivate,
        password: password,
        max_players: this.config.maxPlayers,
      });
    } catch (error) {
      console.error(`[${this.gamePrefix}] DB 저장 실패:`, error.message);
    }
  }

  // ----------------------------- 방 입장

  async handleJoinRoom(data) {
    const { roomId, password, userId, username, userUUID } = data;

    // 필수 데이터 확인
    if (!this.validateJoinData(roomId, username)) {
      return;
    }

    const room = this.rooms.get(roomId);

    // 방 입장 가능 여부 검증
    if (!this.canJoinRoom(room, password)) {
      return;
    }

    // 플레이어 추가
    this.addPlayerToRoom(room, roomId, username, userId, userUUID);

    // 자동 시작 확인
    this.checkAutoStart(room);
  }

  validateJoinData(roomId, username) {
    if (!roomId || !username) {
      this.socket.emit(`${this.gamePrefix}:joinError`, {
        message: "방 ID와 사용자 이름이 필요합니다.",
      });
      return false;
    }
    return true;
  }

  canJoinRoom(room, password) {
    return (
      validateRoomExists(room, this.socket, this.gamePrefix) &&
      validateRoomNotFull(room, this.socket, this.gamePrefix) &&
      validateRoomPassword(room, password, this.socket, this.gamePrefix) &&
      validateNotAlreadyInRoom(
        room,
        this.socket.id,
        this.socket,
        this.gamePrefix
      )
    );
  }

  async addPlayerToRoom(room, roomId, username, userId, userUUID) {
    const newPlayer = createPlayerData(
      this.socket.id,
      username,
      userId,
      userUUID
    );

    room.players.push(newPlayer);
    room.playerCount = room.players.length;
    this.socket.join(roomId);

    console.log(
      `[${this.gamePrefix}] 입장: ${username} (${userId}) → ${roomId}`
    );

    // 입장 알림
    notifyPlayerJoined(this.io, roomId, newPlayer, room, this.gamePrefix);
    this.socket.emit(`${this.gamePrefix}:joinSuccess`, { roomData: room });
    await broadcastRoomListUpdate(this.io, this.rooms, this.gamePrefix);
  }

  checkAutoStart(room) {
    if (this.config.autoStart && room.players.length === room.maxPlayers) {
      console.log(`[${this.gamePrefix}] 자동 시작: ${room.roomId}`);

      room.players.forEach((player) => {
        player.isReady = true;
      });

      notifyAutoStart(this.io, room, this.gamePrefix);
    }
  }

  // ----------------------------- 방 퇴장

  handleLeaveRoom(data) {
    const { roomId } = data;
    this.leaveRoom(roomId);
  }

  async leaveRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const playerIndex = room.players.findIndex(
      (p) => p.socketId === this.socket.id
    );
    if (playerIndex === -1) return;

    const wasHost = this.socket.id === room.hostSocketId;
    const leavingPlayer = room.players[playerIndex];

    // 플레이어 제거
    this.removePlayerFromRoom(room, roomId, playerIndex);

    // 방이 비었으면 삭제
    if (room.players.length === 0) {
      return await this.deleteEmptyRoom(roomId);
    }

    // 방장 변경 처리
    if (wasHost) {
      this.changeHost(room, roomId);
    }

    // 게임 상태별 처리
    this.handleLeaveByGameStatus(room, leavingPlayer);

    await broadcastRoomListUpdate(this.io, this.rooms, this.gamePrefix);
  }

  removePlayerFromRoom(room, roomId, playerIndex) {
    room.players.splice(playerIndex, 1);
    room.playerCount = room.players.length;
    this.socket.leave(roomId);

    console.log(`[${this.gamePrefix}] 퇴장: ${this.socket.id} ← ${roomId}`);

    this.socket.emit(`${this.gamePrefix}:leftRoom`, { roomId });
  }

  async deleteEmptyRoom(roomId) {
    this.rooms.delete(roomId);
    console.log(`[${this.gamePrefix}] 방 삭제: ${roomId}`);
    await broadcastRoomListUpdate(this.io, this.rooms, this.gamePrefix);
  }

  changeHost(room, roomId) {
    room.hostSocketId = room.players[0].socketId;
    notifyHostChanged(
      this.io,
      roomId,
      room.hostSocketId,
      room,
      this.gamePrefix
    );
    console.log(`[${this.gamePrefix}] 방장 변경: ${room.hostSocketId}`);
  }

  handleLeaveByGameStatus(room, leavingPlayer) {
    if (room.status === "playing") {
      this.abortGame(room, leavingPlayer);
    } else {
      notifyPlayerLeft(
        this.io,
        room.roomId,
        this.socket.id,
        leavingPlayer.username || "플레이어",
        room,
        this.gamePrefix
      );
    }
  }

  abortGame(room, leavingPlayer) {
    console.log(`[${this.gamePrefix}] 게임 중단: ${room.roomId}`);

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

  // ----------------------------- 방 목록 조회

  async handleGetRoomList() {
    try {
      console.log(`[${this.gamePrefix}] 방 목록 요청`);

      const roomList = await getRoomList(this.rooms, this.gamePrefix);

      console.log(`[${this.gamePrefix}] 방 목록 조회 완료:`, {
        count: roomList?.length,
        isArray: Array.isArray(roomList),
      });

      this.socket.emit(`${this.gamePrefix}:roomListUpdate`, roomList);
    } catch (error) {
      console.error(`[${this.gamePrefix}] 방 목록 조회 실패:`, error);
      this.socket.emit(`${this.gamePrefix}:error`, {
        message: "방 목록을 불러올 수 없습니다.",
      });
    }
  }

  // ----------------------------- 재대결

  handleRequestRematch(data) {
    const { roomId } = data;
    const room = this.rooms.get(roomId);

    if (!room) {
      this.socket.emit(`${this.gamePrefix}:error`, {
        message: "방을 찾을 수 없습니다.",
      });
      return;
    }

    const requester = room.players.find((p) => p.socketId === this.socket.id);
    if (!requester) {
      this.socket.emit(`${this.gamePrefix}:error`, {
        message: "방에 참가하지 않은 사용자입니다.",
      });
      return;
    }

    console.log(`[${this.gamePrefix}] 재대결 요청: ${requester.username}`);

    // 재대결 요청 상태 초기화
    room.rematchRequests = room.rematchRequests || {};
    room.rematchRequests[this.socket.id] = true;

    // 상대방에게 재대결 요청 알림
    this.io.to(roomId).emit(`${this.gamePrefix}:rematchRequested`, {
      requester: requester.username,
      socketId: this.socket.id, // 누가 요청했는지 구분하기 위함
    });

    console.log(`[${this.gamePrefix}] 재대결 요청 전송 완료`);
  }

  handleAcceptRematch(data) {
    const { roomId } = data;
    const room = this.rooms.get(roomId);

    if (!room) {
      this.socket.emit(`${this.gamePrefix}:error`, {
        message: "방을 찾을 수 없습니다.",
      });
      return;
    }

    const accepter = room.players.find((p) => p.socketId === this.socket.id);
    if (!accepter) {
      return;
    }

    console.log(`[${this.gamePrefix}] 재대결 수락: ${accepter.username}`);

    // 수락 상태 추가
    room.rematchRequests = room.rematchRequests || {};
    room.rematchRequests[this.socket.id] = true;

    // 상대방에게 수락 알림
    this.socket.to(roomId).emit(`${this.gamePrefix}:rematchAccepted`, {
      accepter: accepter.username,
    });

    // 양쪽 모두 수락했는지 확인
    const allAccepted = room.players.every(
      (p) => room.rematchRequests[p.socketId] === true
    );

    if (allAccepted) {
      console.log(`[${this.gamePrefix}] 양쪽 모두 수락 - 재대결 시작`);
      this.startRematch(room);
    }
  }

  handleDeclineRematch(data) {
    const { roomId } = data;
    const room = this.rooms.get(roomId);

    if (!room) return;

    const decliner = room.players.find((p) => p.socketId === this.socket.id);
    if (!decliner) return;

    console.log(`[${this.gamePrefix}] 재대결 거절: ${decliner.username}`);

    // 재대결 요청 초기화
    room.rematchRequests = {};

    // 상대방에게 거절 알림
    this.socket.to(roomId).emit(`${this.gamePrefix}:rematchDeclined`, {
      decliner: decliner.username,
    });
  }

  startRematch(room) {
    // 게임 상태 초기화
    room.status = "waiting";
    room.rematchRequests = {};

    // 플레이어 상태 초기화
    room.players.forEach((player) => {
      player.isReady = false;
      player.side = null;
    });

    console.log(`[${this.gamePrefix}] 재대결 시작: ${room.roomId}`);

    // 양쪽에 재대결 시작 알림
    this.io.to(room.roomId).emit(`${this.gamePrefix}:rematchStart`);

    // 약간의 딜레이 후 게임 자동 시작
    setTimeout(() => {
      this.autoStartRematch(room);
    }, 1000);
  }

  autoStartRematch(room) {
    if (room.players.length < 2) {
      console.warn(
        `[${this.gamePrefix}] 재대결 자동 시작 실패 - 플레이어 부족`
      );
      return;
    }

    // 모든 플레이어를 준비 상태로 변경
    room.players.forEach((player) => {
      player.isReady = true;
    });

    room.status = "playing";
    room.startTime = Date.now();

    console.log(`[${this.gamePrefix}] 재대결 게임 자동 시작: ${room.roomId}`);

    // 게임 시작 이벤트 발송
    this.io.to(room.roomId).emit(`${this.gamePrefix}:gameStart`, {
      roomData: room,
      roomId: room.roomId,
    });
  }

  // ----------------------------- 연결 해제 처리

  handleDisconnect() {
    console.log(`[${this.gamePrefix}] 연결 해제: ${this.socket.id}`);

    this.rooms.forEach((room, roomId) => {
      if (room.gameType === this.gamePrefix) {
        const hasPlayer = room.players.some(
          (p) => p.socketId === this.socket.id
        );
        if (hasPlayer) {
          this.leaveRoom(roomId);
        }
      }
    });
  }
}

module.exports = RoomManager;
