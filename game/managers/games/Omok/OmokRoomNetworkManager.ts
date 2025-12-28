// game/managers/games/Omok/OmokRoomNetworkManager.ts
import { Socket } from "socket.io-client";
import { OmokEvent, OmokEventPayload, type RoomData } from "@/game/types/omok";

/**
 * OmokRoomNetworkManager
 * - 방 관련 네트워크 통신만 담당
 * - 소켓 이벤트 송수신, 상태 관리
 * - UI 렌더링은 하지 않음
 */
export class OmokRoomNetworkManager {
  private socket: Socket;
  private roomList: RoomData[] = [];
  private currentRoomId: string | null = null;

  // 콜백들
  private callbacks = {
    onRoomListUpdate: null as ((rooms: RoomData[]) => void) | null,
    onRoomCreated: null as
      | ((roomId: string, roomData: RoomData) => void)
      | null,
    onJoinSuccess: null as ((roomData: RoomData) => void) | null,
    onJoinError: null as ((message: string) => void) | null,
    onPlayerJoined: null as ((roomData: RoomData) => void) | null,
    onPlayerLeft: null as
      | ((roomData: RoomData, username: string) => void)
      | null,
    onPlayerReady: null as ((roomData: RoomData) => void) | null,
    onGameStart: null as (() => void) | null,
    onGameAborted: null as
      | ((reason: string, leavingPlayer: string) => void)
      | null,
    onHostChanged: null as ((roomData: RoomData) => void) | null,
    onError: null as ((message: string) => void) | null,
  };

  constructor(socket: Socket) {
    this.socket = socket;
    this.setupSocketHandlers();
  }

  // =====================================================================
  // 소켓 핸들러 설정
  // =====================================================================

  private setupSocketHandlers(): void {
    const s = this.socket;

    // 방 목록 업데이트
    s.on(
      OmokEvent.ROOM_LIST_UPDATE,
      (rooms: OmokEventPayload<typeof OmokEvent.ROOM_LIST_UPDATE>) => {
        this.roomList = rooms;
        this.callbacks.onRoomListUpdate?.(rooms);
      }
    );

    // 방 생성 성공
    s.on(
      OmokEvent.ROOM_CREATED,
      (data: OmokEventPayload<typeof OmokEvent.ROOM_CREATED>) => {
        this.currentRoomId = data.roomId;
        this.callbacks.onRoomCreated?.(data.roomId, data.roomData);
      }
    );

    // 방 입장 성공
    s.on(
      OmokEvent.JOIN_SUCCESS,
      (data: OmokEventPayload<typeof OmokEvent.JOIN_SUCCESS>) => {
        this.currentRoomId = data.roomData.roomId;
        this.callbacks.onJoinSuccess?.(data.roomData);
      }
    );

    // 방 입장 실패
    s.on(
      OmokEvent.JOIN_ERROR,
      (data: OmokEventPayload<typeof OmokEvent.JOIN_ERROR>) => {
        this.callbacks.onJoinError?.(data.message);
      }
    );

    // 플레이어 입장
    s.on(
      OmokEvent.PLAYER_JOINED,
      (data: OmokEventPayload<typeof OmokEvent.PLAYER_JOINED>) => {
        this.callbacks.onPlayerJoined?.(data.roomData);
      }
    );

    // 플레이어 퇴장
    s.on(
      OmokEvent.PLAYER_LEFT,
      (data: OmokEventPayload<typeof OmokEvent.PLAYER_LEFT>) => {
        this.callbacks.onPlayerLeft?.(data.roomData, data.username);
      }
    );

    // 플레이어 준비
    s.on(
      OmokEvent.PLAYER_READY,
      (data: OmokEventPayload<typeof OmokEvent.PLAYER_READY>) => {
        this.callbacks.onPlayerReady?.(data.roomData);
      }
    );

    // 게임 시작
    s.on(
      OmokEvent.GAME_START,
      (data: OmokEventPayload<typeof OmokEvent.GAME_START>) => {
        console.log("🎮 [OmokRoomNetwork] 게임 시작 이벤트 받음:", data);
        this.callbacks.onGameStart?.();
      }
    );

    // 게임 중단
    s.on(
      OmokEvent.GAME_ABORTED,
      (data: OmokEventPayload<typeof OmokEvent.GAME_ABORTED>) => {
        console.log("[OmokRoomNetwork] 게임 중단:", data);
        this.callbacks.onGameAborted?.(data.reason, data.leavingPlayer);
      }
    );

    // 방장 변경
    s.on(
      OmokEvent.HOST_CHANGED,
      (data: OmokEventPayload<typeof OmokEvent.HOST_CHANGED>) => {
        console.log("[OmokRoomNetwork] 방장 변경:", data);
        this.callbacks.onHostChanged?.(data.roomData);
      }
    );

    // 에러
    s.on(OmokEvent.ERROR, (data: OmokEventPayload<typeof OmokEvent.ERROR>) => {
      console.error("[OmokRoomNetwork] 에러:", data.message);
      this.callbacks.onError?.(data.message);
    });
  }

  // =====================================================================
  // 네트워크 액션 (소켓 emit)
  // =====================================================================

  /**
   * 방 목록 요청
   */
  public requestRoomList(): void {
    this.socket.emit(OmokEvent.GET_ROOM_LIST);
  }

  /**
   * 방 생성
   */
  public createRoom(roomName: string, username: string): void {
    const payload: OmokEventPayload<typeof OmokEvent.CREATE_ROOM> = {
      roomName,
      username,
    };
    console.log("🚀 [OmokRoomNetwork] 방 생성:", payload);
    this.socket.emit(OmokEvent.CREATE_ROOM, payload);
  }

  /**
   * 방 입장
   */
  public joinRoom(roomId: string, username: string): void {
    const payload: OmokEventPayload<typeof OmokEvent.JOIN_ROOM> = {
      roomId,
      username,
    };
    this.socket.emit(OmokEvent.JOIN_ROOM, payload);
  }

  /**
   * 방 나가기
   */
  public leaveRoom(): void {
    if (this.currentRoomId) {
      const payload: OmokEventPayload<typeof OmokEvent.LEAVE_ROOM> = {
        roomId: this.currentRoomId,
      };
      this.socket.emit(OmokEvent.LEAVE_ROOM, payload);
      this.currentRoomId = null;
    }
  }

  /**
   * 준비 상태 토글
   */
  public toggleReady(): void {
    if (this.currentRoomId) {
      const payload: OmokEventPayload<typeof OmokEvent.TOGGLE_READY> = {
        roomId: this.currentRoomId,
      };
      this.socket.emit(OmokEvent.TOGGLE_READY, payload);
    }
  }

  /**
   * 게임 시작 (호스트만)
   */
  public startGame(): void {
    if (this.currentRoomId) {
      const payload: OmokEventPayload<typeof OmokEvent.START_GAME> = {
        roomId: this.currentRoomId,
      };
      this.socket.emit(OmokEvent.START_GAME, payload);
    }
  }

  // =====================================================================
  // 콜백 등록
  // =====================================================================

  public setOnRoomListUpdate(callback: (rooms: RoomData[]) => void): void {
    this.callbacks.onRoomListUpdate = callback;
  }

  public setOnRoomCreated(
    callback: (roomId: string, roomData: RoomData) => void
  ): void {
    this.callbacks.onRoomCreated = callback;
  }

  public setOnJoinSuccess(callback: (roomData: RoomData) => void): void {
    this.callbacks.onJoinSuccess = callback;
  }

  public setOnJoinError(callback: (message: string) => void): void {
    this.callbacks.onJoinError = callback;
  }

  public setOnPlayerJoined(callback: (roomData: RoomData) => void): void {
    this.callbacks.onPlayerJoined = callback;
  }

  public setOnPlayerLeft(
    callback: (roomData: RoomData, username: string) => void
  ): void {
    this.callbacks.onPlayerLeft = callback;
  }

  public setOnPlayerReady(callback: (roomData: RoomData) => void): void {
    this.callbacks.onPlayerReady = callback;
  }

  public setOnGameStart(callback: () => void): void {
    this.callbacks.onGameStart = callback;
  }

  public setOnGameAborted(
    callback: (reason: string, leavingPlayer: string) => void
  ): void {
    this.callbacks.onGameAborted = callback;
  }

  public setOnHostChanged(callback: (roomData: RoomData) => void): void {
    this.callbacks.onHostChanged = callback;
  }

  public setOnError(callback: (message: string) => void): void {
    this.callbacks.onError = callback;
  }

  // =====================================================================
  // Getters
  // =====================================================================

  public getRoomList(): RoomData[] {
    return this.roomList;
  }

  public getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

  // =====================================================================
  // 정리
  // =====================================================================

  public cleanup(): void {
    Object.values(OmokEvent).forEach((evt) => this.socket.off(evt as string));
  }
}
