// handlers/games/omok/OmokMatchmaking.js

/**
 * 오목 빠른 매칭 관리
 */
class omokMatchmaking {
  /**
   * @param {Object} io - Socket.IO 서버 인스턴스
   * @param {Object} socket - 클라이언트 소켓
   * @param {Map} rooms - 방 목록
   */
  constructor(io, socket, rooms) {
    this.io = io;
    this.socket = socket;
    this.rooms = rooms;
    this.QUICK_MATCH_ROOM = "omok_quick_match";
  }

  /**
   * 이벤트 핸들러 등록
   */
  registerHandlers() {
    this.socket.on("omok:quickMatch", () => this.handleQuickMatch());
  }

  /**
   * 빠른 매칭 핸들러
   */
  handleQuickMatch() {
    console.log(`[Omok] 빠른 매칭 요청: ${this.socket.id}`);

    let room = this.rooms.get(this.QUICK_MATCH_ROOM);

    // 방이 없으면 생성
    if (!room) {
      room = this.createQuickMatchRoom();
      this.rooms.set(this.QUICK_MATCH_ROOM, room);
    }

    // 방이 가득 찼으면 에러
    if (room.players.length >= 2) {
      this.socket.emit("omok:error", {
        message: "매칭 실패. 다시 시도해주세요.",
      });
      return;
    }

    // 플레이어 추가
    this.addPlayerToQuickMatch(room);

    const numClients = room.players.length;
    console.log(`[Omok] ${this.socket.id} 입장 -> 현재 대기: ${numClients}명`);

    // 1명이면 대기
    if (numClients === 1) {
      this.socket.emit("omok:waiting", {
        message: "상대를 찾는 중입니다...",
      });
      return;
    }

    // 2명이면 게임 시작
    if (numClients === 2) {
      this.startQuickMatchGame(room);
    }
  }

  /**
   * 빠른 매칭 방 생성
   * @returns {Object} 방 데이터
   */
  createQuickMatchRoom() {
    return {
      roomId: this.QUICK_MATCH_ROOM,
      roomName: "빠른 매칭",
      gameType: "omok",
      hostSocketId: this.socket.id,
      players: [],
      isPrivate: false,
      password: "",
      maxPlayers: 2,
      playerCount: 0,
      status: "waiting",
      createdAt: Date.now(),
    };
  }

  /**
   * 빠른 매칭 방에 플레이어 추가
   * @param {Object} room - 방 객체
   */
  addPlayerToQuickMatch(room) {
    const player = {
      socketId: this.socket.id,
      username: `플레이어${room.players.length + 1}`,
      isReady: true,
      joinedAt: Date.now(),
    };

    room.players.push(player);
    room.playerCount = room.players.length;
    this.socket.join(this.QUICK_MATCH_ROOM);
  }

  /**
   * 빠른 매칭 게임 시작
   * @param {Object} room - 방 객체
   */
  startQuickMatchGame(room) {
    console.log("[Omok] 매칭 성공! 게임 시작");

    // 색깔 할당
    room.players.forEach((p, index) => {
      p.color = index === 0 ? 1 : 2;

      this.io.to(p.socketId).emit("omok:assigned", {
        color: p.color,
        roomId: this.QUICK_MATCH_ROOM,
      });

      console.log(
        `[Omok] ${p.socketId} → ${p.color === 1 ? "흑돌" : "백돌"} 할당`
      );
    });

    room.status = "playing";

    // 게임 시작 알림
    this.io.to(this.QUICK_MATCH_ROOM).emit("omok:gameStart", {
      roomId: this.QUICK_MATCH_ROOM,
      roomData: room,
    });
  }
}

module.exports = omokMatchmaking;
