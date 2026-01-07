import {
  RoomListResponse,
  RoomNetworkCallbacks,
} from "@/game/types/multiplayer/network.types";
import { RoomData } from "@/game/types/omok";
import { Socket } from "socket.io-client";

export abstract class BaseRoomNetworkManager {
  protected socket: Socket;
  protected gamePrefix: string;
  protected roomList: RoomData[] = [];
  protected currentRoomId: string | null = null;
  protected callbacks: RoomNetworkCallbacks = {};

  private registeredEvents: string[] = [];

  constructor(socket: Socket, gamePrefix: string) {
    this.socket = socket;
    this.gamePrefix = gamePrefix;
    this.setupSocketHandlers();
  }

  // =====================================================================
  // =====================================================================

  protected on(event: string, callback: (...args: any[]) => void): void {
    const fullEventName = `${this.gamePrefix}:${event}`;
    this.socket.on(fullEventName, callback);
    this.registeredEvents.push(fullEventName);
  }

  // =====================================================================
  // =====================================================================

  public clear(): void {
    this.registeredEvents.forEach((eventName) => {
      this.socket.off(eventName);
    });
    this.registeredEvents = [];

    this.callbacks = {};

    console.log(`[${this.gamePrefix}Network] 리소스 정리 완료`);
  }

  // =====================================================================
  // =====================================================================

  protected setupSocketHandlers(): void {
    this.on("roomListUpdate", (data: RoomListResponse) => {
      if (Array.isArray(data)) {
        this.roomList = data;
      } else if (data?.rooms) {
        this.roomList = data.rooms;
      }
      this.callbacks.onRoomListUpdate?.(this.roomList);
    });

    this.on("roomCreated", (data: { roomId: string; roomData: RoomData }) => {
      this.currentRoomId = data.roomId;
      this.callbacks.onRoomCreated?.(data.roomId, data.roomData);
    });

    this.on("joinSuccess", (data: { roomData: RoomData }) => {
      this.currentRoomId = data.roomData.roomId;
      this.callbacks.onJoinSuccess?.(data.roomData);
    });

    this.on("joinError", (data: { message: string }) => {
      this.callbacks.onJoinError?.(data.message);
    });

    this.on("playerJoined", (data: { roomData: RoomData }) => {
      this.callbacks.onPlayerJoined?.(data.roomData);
    });

    this.on("playerLeft", (data: { roomData: RoomData; username: string }) => {
      this.callbacks.onPlayerLeft?.(data.roomData, data.username);
    });

    this.on("leftRoom", (data: { roomId: string }) => {
      this.currentRoomId = null;
      this.callbacks.onLeftRoom?.(data.roomId);
    });

    this.on("playerReady", (data: { roomData: RoomData }) => {
      this.callbacks.onPlayerReady?.(data.roomData);
    });

    this.on("gameStart", () => {
      this.callbacks.onGameStart?.();
    });

    this.on(
      "gameAborted",
      (data: { reason: string; leavingPlayer: string }) => {
        this.callbacks.onGameAborted?.(data.reason, data.leavingPlayer);
      }
    );

    this.on("hostChanged", (data: { roomData: RoomData }) => {
      this.callbacks.onHostChanged?.(data.roomData);
    });

    this.on("error", (data: { message: string }) => {
      this.callbacks.onError?.(data.message);
    });

    // 재대결 관련

    this.on("rematchRequested", (data: { requester: string }) => {
      this.callbacks.onRematchRequested?.(data.requester);
    });

    this.on("rematchAccepted", (data: { accepter: string }) => {
      this.callbacks.onRematchAccepted?.(data.accepter);
    });

    this.on("rematchDeclined", (data: { decliner: string }) => {
      this.callbacks.onRematchDeclined?.(data.decliner);
    });

    this.on("rematchStart", () => {
      this.callbacks.onRematchStart?.();
    });
  }

  // =====================================================================
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

    console.log(`[${this.gamePrefix}RoomNetwork] 방 생성:`, payload);
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

  public requestRematch(manualRoomId?: string): void {
    const targetId = manualRoomId || this.currentRoomId;

    if (!targetId) {
      console.warn(
        `[${this.gamePrefix}RoomNetwork] 방 ID 없음 - 재대결 요청 실패`
      );
      return;
    }

    console.log(`[${this.gamePrefix}RoomNetwork] 재대결 요청 전송`);
    this.socket.emit(`${this.gamePrefix}:requestRematch`, {
      // roomId: this.currentRoomId,
      roomId: targetId,
    });
  }

  public setOnRematchRequested(callback: (requester: string) => void): void {
    this.callbacks.onRematchRequested = callback;
  }

  public setOnRematchAccepted(callback: (accepter: string) => void): void {
    this.callbacks.onRematchAccepted = callback;
  }

  public setOnRematchDeclined(callback: (decliner: string) => void): void {
    this.callbacks.onRematchDeclined = callback;
  }

  public setOnRematchStart(callback: () => void): void {
    this.callbacks.onRematchStart = callback;
  }

  // =====================================================================
  // =====================================================================

  public acceptRematch(manualRoomId?: string): void {
    const targetId = manualRoomId || this.currentRoomId;
    if (!targetId) {
      console.warn(
        `[${this.gamePrefix}RoomNetwork] 방 ID 없음 - 재대결 수락 실패`
      );
      return;
    }
    this.socket.emit(`${this.gamePrefix}:acceptRematch`, { roomId: targetId });
  }

  public declineRematch(manualRoomId?: string): void {
    const targetId = manualRoomId || this.currentRoomId;

    if (!this.currentRoomId) {
      console.warn(
        `[${this.gamePrefix}RoomNetwork] 방 ID 없음 - 재대결 거절 실패`
      );
      return;
    }

    console.log(`[${this.gamePrefix}RoomNetwork] 재대결 거절: ${targetId}`);
    this.socket.emit(`${this.gamePrefix}:declineRematch`, {
      // roomId: this.currentRoomId,
      roomId: targetId,
    });
  }

  // =====================================================================
  // =====================================================================

  public getRoomList(): RoomData[] {
    if (!Array.isArray(this.roomList)) {
      console.warn(
        `[${this.gamePrefix}RoomNetwork] roomList가 배열이 아님, 빈 배열 반환`
      );
      return [];
    }
    return this.roomList;
  }

  public getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }
}
