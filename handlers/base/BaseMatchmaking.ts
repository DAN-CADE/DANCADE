import type { SupabaseClient } from "@supabase/supabase-js";
import { generateRoomId } from "./utils/RoomUtils";
import {
  GameIO,
  GameSocket,
  MatchmakingConfig,
  QuickMatchPayload,
} from "../../types/server/server.types";
import { ServerRoom } from "../../game/types/multiplayer/room.types";

// =====================================================================
/**
 * BaseMatchmaking
 * - 모든 게임의 빠른 매칭 공통 로직
 * - 방 생성, 플레이어 추가, 게임 시작 처리
 * - 게임별로 역할 할당만 커스터마이징
 */
// =====================================================================
export abstract class BaseMatchmaking {
  protected io: GameIO;
  protected socket: GameSocket;
  protected rooms: Map<string, ServerRoom>;
  protected gamePrefix: string;
  protected maxPlayers: number;
  protected QUICK_MATCH_ROOM: string;
  protected supabase?: SupabaseClient;

  /**
   * @param io - Socket.IO 서버 인스턴스
   * @param socket - 클라이언트 소켓
   * @param rooms - 방 목록
   * @param gamePrefix - 게임 타입 (예: "omok", "pingpong")
   * @param config - 매칭 설정
   */
  constructor(
    io: GameIO,
    socket: GameSocket,
    rooms: Map<string, ServerRoom>,
    gamePrefix: string,
    config: MatchmakingConfig = {}
  ) {
    this.io = io;
    this.socket = socket;
    this.rooms = rooms;
    this.gamePrefix = gamePrefix;

    // 설정
    this.maxPlayers = config.maxPlayers || 2;
    this.QUICK_MATCH_ROOM =
      config.quickMatchRoomId || `${gamePrefix}_quick_match`;
    this.supabase = config.supabase;

    console.log(
      `[${this.gamePrefix}][Matchmaking] 초기화 (최대: ${this.maxPlayers}명)`
    );
  }

  // =====================================================================
  /**
   * 이벤트 핸들러 등록
   */
  // =====================================================================
  registerHandlers(): void {
    this.socket.on(
      `${this.gamePrefix}:quickMatch`,
      (payload: QuickMatchPayload) => this.handleQuickMatch(payload)
    );
  }

  // =====================================================================
  // 빠른 매칭 로직 (완전 공통)
  // =====================================================================

  /**
   * 빠른 매칭 핸들러
   */
  protected async handleQuickMatch(payload: QuickMatchPayload): Promise<void> {
    console.log(`[${this.gamePrefix}][빠른매칭] 요청: ${this.socket.id}`);

    // 대기 중인 방 찾기
    let room = Array.from(this.rooms.values()).find(
      (r) =>
        r.isQuickMatch &&
        r.status === "waiting" &&
        r.players.length < this.maxPlayers
    );

    // 방이 없으면 새로 생성
    if (!room) {
      room = await this.createQuickMatchRoom(payload);
      this.rooms.set(room.roomId, room);
    }

    // 방이 가득 찼으면 에러
    if (room.players.length >= this.maxPlayers) {
      this.socket.emit(`${this.gamePrefix}:error`, {
        message: "매칭 실패. 다시 시도해주세요.",
      });
      return;
    }

    // 플레이어 추가
    this.addPlayerToQuickMatch(room, payload);

    this.socket.join(room.roomId);

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
   */
  protected async createQuickMatchRoom(
    payload: QuickMatchPayload
  ): Promise<ServerRoom> {
    const newRoomId = generateRoomId();
    const hostUUID = payload?.uuid || payload?.userId;

    let quickMatchCount = 0;

    // Supabase로 빠른 매칭 방 개수 조회
    if (this.supabase) {
      try {
        const { count, error } = await this.supabase
          .from("multi_rooms")
          .select("*", { count: "exact", head: true })
          .like("room_name", "빠른 매칭 %");

        if (error) {
          console.error(`[DB에러] 빠른매칭 카운트 실패:`, error.message);
        } else {
          quickMatchCount = count || 0;
        }
      } catch (err) {
        console.error(`[서버에러]`, err);
      }
    }

    const roomName = `빠른 매칭 #${quickMatchCount + 1}`;

    console.log(`[${this.gamePrefix}][빠른매칭] DB 방 생성 시작: ${newRoomId}`);

    // Supabase에 방 정보 저장
    if (this.supabase) {
      try {
        const { error } = await this.supabase.from("multi_rooms").insert({
          id: newRoomId,
          host_user_id: hostUUID,
          room_name: roomName,
          game_type: this.gamePrefix,
          is_private: false,
          status: "waiting",
          max_players: this.maxPlayers,
          created_at: new Date().toISOString(),
        });

        if (error) {
          console.error(`[DB에러] 빠른매칭 방 생성 실패:`, error.message);
        } else {
          console.log(`[DB성공] 빠른매칭 방 생성 완료: ${newRoomId}`);
        }
      } catch (err) {
        console.error(
          `[${this.gamePrefix}][DB에러] 방 생성 실패:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    return {
      roomId: newRoomId,
      roomName: roomName,
      gameType: this.gamePrefix,
      hostSocketId: this.socket.id,
      players: [],
      isPrivate: false,
      password: "",
      maxPlayers: this.maxPlayers,
      playerCount: 0,
      status: "waiting",
      createdAt: Date.now(),
      isQuickMatch: true,
    };
  }

  // =====================================================================
  // 플레이어 추가 (완전 공통)
  // =====================================================================

  /**
   * 빠른 매칭 방에 플레이어 추가
   */
  protected addPlayerToQuickMatch(
    room: ServerRoom,
    payload: QuickMatchPayload
  ): void {
    const player = {
      socketId: this.socket.id,
      username: payload?.nickname || `플레이어${room.players.length + 1}`,
      userId: payload?.uuid || payload?.userId || null,
      userUUID: payload?.uuid || payload?.userId || null,
      isReady: true, // 빠른 매칭은 자동 준비
      joinedAt: Date.now(),
    };

    room.players.push(player);
    room.playerCount = room.players.length;

    this.socket.join(room.roomId);

    console.log(
      `[${this.gamePrefix}][빠른매칭] 플레이어 추가: ${player.username} (${this.socket.id})`
    );
  }

  // =====================================================================
  // 게임 시작 (공통 + 추상)
  // =====================================================================

  /**
   * 빠른 매칭 게임 시작
   */
  protected startQuickMatchGame(room: ServerRoom): void {
    console.log(
      `[${this.gamePrefix}][빠른매칭] 매칭 성공! 게임 시작 (${room.players.length}명)`
    );

    // 역할 할당 (게임별로 다름 - 추상 메서드)
    this.assignRoles(room);

    // 게임 상태 변경
    room.status = "playing";

    // 게임 시작 알림
    this.io.to(room.roomId).emit(`${this.gamePrefix}:gameStart`, {
      roomId: this.QUICK_MATCH_ROOM,
      roomData: room,
    });

    console.log(`[${this.gamePrefix}][빠른매칭] 게임 시작 완료`);
  }

  // =====================================================================
  // 추상 메서드 (게임별 구현 필수!)
  // =====================================================================

  /**
   * 역할 할당 (게임별로 구현)
   *
   * @example
   * // 오목: 흑돌/백돌
   * assignRoles(room: ServerRoom): void {
   *   room.players[0].side = 1; // 흑돌
   *   room.players[1].side = 2; // 백돌
   * }
   *
   * @example
   * // 핑퐁: 왼쪽/오른쪽
   * assignRoles(room: ServerRoom): void {
   *   room.players[0].side = "left";
   *   room.players[1].side = "right";
   * }
   */
  protected abstract assignRoles(room: ServerRoom): void;

  // =====================================================================
  // 유틸리티
  // =====================================================================

  /**
   * 현재 대기 중인 플레이어 수
   */
  protected getWaitingPlayersCount(): number {
    const room = this.rooms.get(this.QUICK_MATCH_ROOM);
    return room ? room.players.length : 0;
  }

  /**
   * 빠른 매칭 방 삭제
   */
  protected clearQuickMatchRoom(): void {
    this.rooms.delete(this.QUICK_MATCH_ROOM);
    console.log(`[${this.gamePrefix}][빠른매칭] 방 삭제`);
  }
}
