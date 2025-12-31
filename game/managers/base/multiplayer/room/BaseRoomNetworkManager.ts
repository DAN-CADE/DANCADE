// game/managers/base/multiplayer/room/BaseRoomNetworkManager.ts (수정 버전)

import { Socket } from "socket.io-client";
import type {
  RoomData,
  RoomNetworkCallbacks,
} from "@/game/types/multiplayer/room.types";

/**
 * BaseRoomNetworkManager
 * - 모든 게임의 방 시스템 네트워크 로직 공통화
 * - 게임별 차이는 gamePrefix만으로 해결
 */
export class BaseRoomNetworkManager {
  protected socket: Socket;
  protected gamePrefix: string;
  protected roomList: RoomData[] = []; // ⭐ 반드시 배열로 초기화
  protected currentRoomId: string | null = null;
  protected callbacks: RoomNetworkCallbacks = {};

  constructor(socket: Socket, gamePrefix: string) {
    this.socket = socket;
    this.gamePrefix = gamePrefix;
    this.setupSocketHandlers();
  }

  // =====================================================================
  // 소켓 핸들러 설정
  // =====================================================================

  protected setupSocketHandlers(): void {
    const prefix = this.gamePrefix;

    // ⭐ 방 목록 업데이트 (안전한 처리)
    this.socket.on(`${prefix}:roomListUpdate`, (data: any) => {
      console.log(`[${prefix}RoomNetwork] 방 목록 수신:`, data);

      // ⭐ 서버 응답 형태 확인 및 처리
      if (Array.isArray(data)) {
        // 배열로 직접 받은 경우
        this.roomList = data;
        this.callbacks.onRoomListUpdate?.(data);
      } else if (data && Array.isArray(data.rooms)) {
        // { rooms: [...] } 형태로 받은 경우
        this.roomList = data.rooms;
        this.callbacks.onRoomListUpdate?.(data.rooms);
      } else {
        // 예상치 못한 형태
        console.error(`[${prefix}RoomNetwork] 잘못된 방 목록 형태:`, data);
        this.roomList = [];
        this.callbacks.onRoomListUpdate?.([]);
      }
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

    // ⭐ 내가 방을 나감
    this.socket.on(`${prefix}:leftRoom`, (data: { roomId: string }) => {
      console.log(`[${prefix}RoomNetwork] 방 퇴장 완료:`, data.roomId);
      this.currentRoomId = null;
      this.callbacks.onLeftRoom?.(data.roomId);
    });

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
  // 네트워크 액션
  // =====================================================================

  public requestRoomList(): void {
    console.log(`[${this.gamePrefix}RoomNetwork] 방 목록 요청`);
    this.socket.emit(`${this.gamePrefix}:getRoomList`);
  }

  public createRoom(
    roomName: string,
    userId: string,
    username: string,
    userUUID: string,
    isPrivate?: boolean,
    password?: string,
    options?: { isPrivate?: boolean; password?: string }
  ): void {
    const payload = {
      roomName,
      userId,
      username,
      userUUID,
      isPrivate: isPrivate || options?.isPrivate || false,
      password: password || options?.password || "",
    };

    console.log(`🚀 [${this.gamePrefix}RoomNetwork] 방 생성:`, payload);
    this.socket.emit(`${this.gamePrefix}:createRoom`, payload);
  }

  public joinRoom(
    roomId: string,
    userId: string,
    username: string,
    userUUID: string,
    password?: string
  ): void {
    const payload = {
      roomId,
      userId,
      username,
      userUUID,
      password,
    };

    this.socket.emit(`${this.gamePrefix}:joinRoom`, payload);
  }

  public leaveRoom(): void {
    if (this.currentRoomId) {
      const payload = { roomId: this.currentRoomId };
      this.socket.emit(`${this.gamePrefix}:leaveRoom`, payload);
      this.currentRoomId = null;
    }
  }

  public toggleReady(): void {
    if (this.currentRoomId) {
      const payload = { roomId: this.currentRoomId };
      this.socket.emit(`${this.gamePrefix}:toggleReady`, payload);
    }
  }

  public startGame(): void {
    if (this.currentRoomId) {
      const payload = { roomId: this.currentRoomId };
      this.socket.emit(`${this.gamePrefix}:startGame`, payload);
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

  public setOnLeftRoom(callback: (roomId: string) => void): void {
    this.callbacks.onLeftRoom = callback;
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
  // Getters (⭐ 안전한 처리)
  // =====================================================================

  public getRoomList(): RoomData[] {
    // ⭐ 항상 배열 반환 보장
    if (!Array.isArray(this.roomList)) {
      console.warn(
        `[${this.gamePrefix}RoomNetwork] roomList가 배열이 아님! 빈 배열 반환`
      );
      return [];
    }
    return this.roomList;
  }

  public getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

  // =====================================================================
  // 정리
  // =====================================================================

  public cleanup(): void {
    const events = [
      "roomListUpdate",
      "roomCreated",
      "joinSuccess",
      "joinError",
      "playerJoined",
      "playerLeft",
      "leftRoom", // ⭐ 추가
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
