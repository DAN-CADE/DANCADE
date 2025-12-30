// handlers/base/BaseMatchmaking.js

/**
 * BaseMatchmaking
 * - 모든 게임의 빠른 매칭 공통 로직
 * - 방 생성, 플레이어 추가, 게임 시작 처리
 * - 게임별로 역할 할당만 커스터마이징
 */
class BaseMatchmaking {
  /**
   * @param {Object} io - Socket.IO 서버 인스턴스
   * @param {Object} socket - 클라이언트 소켓
   * @param {Map} rooms - 방 목록
   * @param {string} gamePrefix - 게임 타입 (예: "omok", "pingpong")
   * @param {Object} config - 매칭 설정
   * @param {number} [config.maxPlayers=2] - 최대 플레이어 수
   * @param {string} [config.quickMatchRoomId] - 빠른 매칭 방 ID (기본: "{gamePrefix}_quick_match")
   */
  constructor(io, socket, rooms, gamePrefix, config = {}) {
    this.io = io;
    this.socket = socket;
    this.rooms = rooms;
    this.gamePrefix = gamePrefix;

    // 설정
    this.maxPlayers = config.maxPlayers || 2;
    this.QUICK_MATCH_ROOM =
      config.quickMatchRoomId || `${gamePrefix}_quick_match`;

    console.log(
      `[${this.gamePrefix}][Matchmaking] 초기화 (최대: ${this.maxPlayers}명)`
    );
  }

  /**
   * 이벤트 핸들러 등록
   */
  registerHandlers() {
    this.socket.on(`${this.gamePrefix}:quickMatch`, () =>
      this.handleQuickMatch()
    );
  }

  // =====================================================================
  // 빠른 매칭 로직 (완전 공통)
  // =====================================================================

  /**
   * 빠른 매칭 핸들러
   */
  handleQuickMatch() {
    console.log(`[${this.gamePrefix}][빠른매칭] 요청: ${this.socket.id}`);

    let room = this.rooms.get(this.QUICK_MATCH_ROOM);

    // 방이 없으면 생성
    if (!room) {
      room = this.createQuickMatchRoom();
      this.rooms.set(this.QUICK_MATCH_ROOM, room);
    }

    // 방이 가득 찼으면 에러
    if (room.players.length >= this.maxPlayers) {
      this.socket.emit(`${this.gamePrefix}:error`, {
        message: "매칭 실패. 다시 시도해주세요.",
      });
      return;
    }

    // 플레이어 추가
    this.addPlayerToQuickMatch(room);

    const numClients = room.players.length;
    console.log(
      `[${this.gamePrefix}][빠른매칭] ${this.socket.id} 입장 → 현재 대기: ${numClients}/${this.maxPlayers}명`
    );

    // 대기 중
    if (numClients < this.maxPlayers) {
      this.socket.emit(`${this.gamePrefix}:waiting`, {
        message: `상대를 찾는 중입니다... (${numClients}/${this.maxPlayers})`,
      });
      return;
    }

    // 인원 충족 → 게임 시작
    if (numClients === this.maxPlayers) {
      this.startQuickMatchGame(room);
    }
  }

  // =====================================================================
  // 방 생성 (완전 공통)
  // =====================================================================

  /**
   * 빠른 매칭 방 생성
   * @returns {Object} 방 데이터
   */
  createQuickMatchRoom() {
    console.log(
      `[${this.gamePrefix}][빠른매칭] 방 생성: ${this.QUICK_MATCH_ROOM}`
    );

    return {
      roomId: this.QUICK_MATCH_ROOM,
      roomName: "빠른 매칭",
      gameType: this.gamePrefix,
      hostSocketId: this.socket.id,
      players: [],
      isPrivate: false,
      password: "",
      maxPlayers: this.maxPlayers,
      playerCount: 0,
      status: "waiting",
      createdAt: Date.now(),
    };
  }

  // =====================================================================
  // 플레이어 추가 (완전 공통)
  // =====================================================================

  /**
   * 빠른 매칭 방에 플레이어 추가
   * @param {Object} room - 방 객체
   */
  addPlayerToQuickMatch(room) {
    const player = {
      socketId: this.socket.id,
      username: `플레이어${room.players.length + 1}`,
      isReady: true, // 빠른 매칭은 자동 준비
      joinedAt: Date.now(),
    };

    room.players.push(player);
    room.playerCount = room.players.length;
    this.socket.join(this.QUICK_MATCH_ROOM);

    console.log(
      `[${this.gamePrefix}][빠른매칭] 플레이어 추가: ${player.username} (${this.socket.id})`
    );
  }

  // =====================================================================
  // 게임 시작 (공통 + 추상)
  // =====================================================================

  /**
   * 빠른 매칭 게임 시작
   * @param {Object} room - 방 객체
   */
  startQuickMatchGame(room) {
    console.log(
      `[${this.gamePrefix}][빠른매칭] 매칭 성공! 게임 시작 (${room.players.length}명)`
    );

    // 역할 할당 (게임별로 다름)
    this.assignRoles(room);

    // 게임 상태 변경
    room.status = "playing";

    // 게임 시작 알림
    this.io.to(this.QUICK_MATCH_ROOM).emit(`${this.gamePrefix}:gameStart`, {
      roomId: this.QUICK_MATCH_ROOM,
      roomData: room,
    });

    console.log(`[${this.gamePrefix}][빠른매칭] 게임 시작 완료`);
  }

  // =====================================================================
  // 추상 메서드 (게임별 구현 필요)
  // =====================================================================

  /**
   * 역할 할당 (게임별로 구현)
   * @param {Object} room - 방 객체
   *
   * @example
   * // 오목: 흑돌/백돌
   * assignRoles(room) {
   *   room.players[0].color = 1; // 흑돌
   *   room.players[1].color = 2; // 백돌
   * }
   *
   * @example
   * // 핑퐁: 왼쪽/오른쪽
   * assignRoles(room) {
   *   room.players[0].side = "left";
   *   room.players[1].side = "right";
   * }
   */
  assignRoles(room) {
    throw new Error(
      `${this.gamePrefix}Matchmaking must implement assignRoles(room) method`
    );
  }

  // =====================================================================
  // 유틸리티
  // =====================================================================

  /**
   * 현재 대기 중인 플레이어 수
   * @returns {number}
   */
  getWaitingPlayersCount() {
    const room = this.rooms.get(this.QUICK_MATCH_ROOM);
    return room ? room.players.length : 0;
  }

  /**
   * 빠른 매칭 방 삭제
   */
  clearQuickMatchRoom() {
    this.rooms.delete(this.QUICK_MATCH_ROOM);
    console.log(`[${this.gamePrefix}][빠른매칭] 방 삭제`);
  }
}

module.exports = BaseMatchmaking;
