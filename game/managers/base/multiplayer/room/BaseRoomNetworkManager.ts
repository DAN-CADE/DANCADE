// game/managers/base/multiplayer/room/BaseRoomNetworkManager.ts

import { Socket } from "socket.io-client";
import type {
  RoomData,
  RoomNetworkCallbacks,
} from "@/game/types/multiplayer/room.types";

/**
 * BaseRoomNetworkManager
 * - 모든 게임의 방 시스템 네트워크 로직 공통화
 * - 게임별 차이는 gamePrefix만으로 해결
 * - 오목의 OmokRoomNetworkManager를 기반으로 완전 일반화
 */
export class BaseRoomNetworkManager {
  protected socket: Socket;
  protected gamePrefix: string;
  protected roomList: RoomData[] = [];
  protected currentRoomId: string | null = null;
  protected callbacks: RoomNetworkCallbacks = {};

  /**
   * @param socket - Socket.IO 클라이언트
   * @param gamePrefix - 게임 타입 ("omok", "pingpong" 등)
   */
  constructor(socket: Socket, gamePrefix: string) {
    this.socket = socket;
    this.gamePrefix = gamePrefix;
    this.setupSocketHandlers();
  }

  // =====================================================================
  // 소켓 핸들러 설정 (완전 공통)
  // =====================================================================

  protected setupSocketHandlers(): void {
    const prefix = this.gamePrefix;

    // 방 목록 업데이트
    this.socket.on(`${prefix}:roomListUpdate`, (rooms: RoomData[]) => {
      this.roomList = rooms;
      this.callbacks.onRoomListUpdate?.(rooms);
    });

    // 방 생성 성공
    this.socket.on(
      `${prefix}:roomCreated`,
      (data: { roomId: string; roomData: RoomData }) => {
        this.currentRoomId = data.roomId;
        this.callbacks.onRoomCreated?.(data.roomId, data.roomData);
      }
    );

    // 방 입장 성공
    this.socket.on(`${prefix}:joinSuccess`, (data: { roomData: RoomData }) => {
      this.currentRoomId = data.roomData.roomId;
      this.callbacks.onJoinSuccess?.(data.roomData);
    });

    // 방 입장 실패
    this.socket.on(`${prefix}:joinError`, (data: { message: string }) => {
      this.callbacks.onJoinError?.(data.message);
    });

    // 플레이어 입장
    this.socket.on(`${prefix}:playerJoined`, (data: { roomData: RoomData }) => {
      this.callbacks.onPlayerJoined?.(data.roomData);
    });

    // 플레이어 퇴장
    this.socket.on(
      `${prefix}:playerLeft`,
      (data: { roomData: RoomData; username: string }) => {
        this.callbacks.onPlayerLeft?.(data.roomData, data.username);
      }
    );

    // 플레이어 준비
    this.socket.on(`${prefix}:playerReady`, (data: { roomData: RoomData }) => {
      this.callbacks.onPlayerReady?.(data.roomData);
    });

    // 게임 시작
    this.socket.on(`${prefix}:gameStart`, () => {
      console.log(`🎮 [${prefix}RoomNetwork] 게임 시작 이벤트 받음`);
      this.callbacks.onGameStart?.();
    });

    // 게임 중단
    this.socket.on(
      `${prefix}:gameAborted`,
      (data: { reason: string; leavingPlayer: string }) => {
        console.log(`[${prefix}RoomNetwork] 게임 중단:`, data);
        this.callbacks.onGameAborted?.(data.reason, data.leavingPlayer);
      }
    );

    // 방장 변경
    this.socket.on(`${prefix}:hostChanged`, (data: { roomData: RoomData }) => {
      console.log(`[${prefix}RoomNetwork] 방장 변경:`, data);
      this.callbacks.onHostChanged?.(data.roomData);
    });

    // 에러
    this.socket.on(`${prefix}:error`, (data: { message: string }) => {
      console.error(`[${prefix}RoomNetwork] 에러:`, data.message);
      this.callbacks.onError?.(data.message);
    });
  }

  // =====================================================================
  // 네트워크 액션 (완전 공통)
  // =====================================================================

  /**
   * 방 목록 요청
   */
  public requestRoomList(): void {
    this.socket.emit(`${this.gamePrefix}:getRoomList`);
  }

  /**
   * 방 생성
   */
  public createRoom(
    roomName: string,
    username: string,
    options?: { isPrivate?: boolean; password?: string }
  ): void {
    const payload = {
      roomName,
      username,
      isPrivate: options?.isPrivate || false,
      password: options?.password || "",
    };

    console.log(`🚀 [${this.gamePrefix}RoomNetwork] 방 생성:`, payload);
    this.socket.emit(`${this.gamePrefix}:createRoom`, payload);
  }

  /**
   * 방 입장
   */
  public joinRoom(roomId: string, username: string, password?: string): void {
    const payload = { roomId, username, password };
    this.socket.emit(`${this.gamePrefix}:joinRoom`, payload);
  }

  /**
   * 방 나가기
   */
  public leaveRoom(): void {
    if (this.currentRoomId) {
      const payload = { roomId: this.currentRoomId };
      this.socket.emit(`${this.gamePrefix}:leaveRoom`, payload);
      this.currentRoomId = null;
    }
  }

  /**
   * 준비 상태 토글
   */
  public toggleReady(): void {
    if (this.currentRoomId) {
      const payload = { roomId: this.currentRoomId };
      this.socket.emit(`${this.gamePrefix}:toggleReady`, payload);
    }
  }

  /**
   * 게임 시작 (호스트만)
   */
  public startGame(): void {
    if (this.currentRoomId) {
      const payload = { roomId: this.currentRoomId };
      this.socket.emit(`${this.gamePrefix}:startGame`, payload);
    }
  }

  // =====================================================================
  // 콜백 등록 (완전 공통)
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
  // Getters (완전 공통)
  // =====================================================================

  public getRoomList(): RoomData[] {
    return this.roomList;
  }

  public getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

  // =====================================================================
  // 정리 (완전 공통)
  // =====================================================================

  public cleanup(): void {
    const events = [
      "roomListUpdate",
      "roomCreated",
      "joinSuccess",
      "joinError",
      "playerJoined",
      "playerLeft",
      "playerReady",
      "gameStart",
      "gameAborted",
      "hostChanged",
      "error",
    ];

    events.forEach((event) => {
      this.socket.off(`${this.gamePrefix}:${event}`);
    });
  }
}
