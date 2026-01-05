import { NETWORK_CONFIG } from "@/game/config/network";
import { io, ManagerOptions, Socket, SocketOptions } from "socket.io-client";

type SocketInitOptions = Partial<ManagerOptions & SocketOptions>;

interface CommonResponse {
  success: boolean;
  message?: string;
}

export abstract class BaseNetworkManager {
  protected socket!: Socket;
  protected roomId: string | null;
  protected socketInitialized = false;

  constructor(roomId: string | null = null) {
    this.roomId = roomId;
  }

  // =====================================================================
  // =====================================================================

  public initializeSocket(
    socketUrl?: string,
    options?: SocketInitOptions
  ): void {
    if (this.isSocketInitialized()) {
      console.warn("[NetworkManager] 소켓이 이미 초기화되었습니다.");
      return;
    }

    const url = socketUrl || NETWORK_CONFIG.SOCKET_URL;

    const defaultOptions: SocketInitOptions = {
      ...NETWORK_CONFIG.DEFAULT_OPTIONS,
      ...options,
    };

    console.log("[NetworkManager] 소켓 연결 시작:", url);

    this.socket = io(url, defaultOptions);

    this.setupBaseHandlers();
    this.setSocketInitialized(true);
    // this.socketInitialized = true;
    this.setupGameHandlers();
  }

  private setupBaseHandlers() {
    this.socket.on("connect", () => {
      console.log("[NetworkManager] 소켓 연결 성공:", this.socket.id);
      this.onConneted();
    });
    this.socket.on("disconnect", (reason) => {
      console.log("[NexworkManager] 소켓 연결 해제:", reason);
      this.onDisconnected(reason);
    });
    this.socket.on("error", (err) => {
      console.error("[NetworkManager] 소켓 에러:", err);
      this.onError(err);
    });
  }

  // =====================================================================
  // =====================================================================

  public isSocketInitialized(): boolean {
    return this.socketInitialized;
  }

  public setSocketInitialized(value: boolean): void {
    this.socketInitialized = value;
  }

  public getSocketId(): string | undefined {
    return this.socket?.id;
  }

  public getSocket(): Socket {
    return this.socket;
  }

  // =====================================================================
  // =====================================================================

  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  public async waitForConnection(timeout: number = 5000): Promise<boolean> {
    if (this.isConnected()) return true;

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.socket.off("connect", onConnect);
        resolve(false);
      }, timeout);

      const onConnect = () => {
        clearTimeout(timer);
        resolve(true);
      };

      this.socket.once("connect", onConnect);
    });
  }

  // =====================================================================
  // =====================================================================

  protected safeOnTyped<TPayload>(
    event: string,
    handler: (data: TPayload) => void
  ): void {
    if (!this.socket) {
      console.warn(`[NetworkManager] 소켓 객체가 존재하지 않음, ${event}`);
      return;
    }

    if (!this.isSocketInitialized()) {
      console.warn(`[NetworkManager] 소켓이 초기화되지 않음, ${event}`);
      return;
    }

    this.socket.off(event);
    this.socket.on(event, (data: TPayload) => {
      try {
        handler(data);
      } catch (err) {
        console.error(`[NetworkManager] 핸들러 에러 (${event}):`, err);
      }
    });
  }

  protected safeEmitWithAck<TPayload, TResponse extends CommonResponse>(
    event: string,
    payload: TPayload,
    timeout: number = 5000
  ): Promise<TResponse> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        reject(new Error(`[NetworkManager] 소켓 미연결: ${event}`));
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error(`[NetworkManager] 타임아웃: ${event}`));
      }, timeout);

      // try {
      //   this.socket.emit(event, payload, (response: TResponse) => {
      //     clearTimeout(timer);
      //     resolve(response);
      //   });
      // } catch (err) {
      //   clearTimeout(timer);
      //   reject(err);
      // }

      this.socket.emit(event, payload, (response: TResponse) => {
        clearTimeout(timer);

        if (response?.success) {
          resolve(response);
        } else {
          const errorMsg = response?.message || `서버 응답 에러: ${event}`;
          reject(new Error(`[NetworkManager] ${errorMsg}`));
        }
      });
    });
  }

  protected safeEmit(event: string, data?: unknown): boolean {
    if (!this.isConnected()) {
      console.error(new Error(`[NetworkManager] 소켓 미연결: ${event}`));
      return false;
    }

    // try {
    //   this.socket.emit(event, data);
    //   return true;
    // } catch (error) {
    //   console.error(`[NetworkManager] emit 실패 (${event}):`, error);
    //   return false;
    // }

    this.socket.emit(event, data);
    return true;
  }

  // protected emitWithRoom(
  //   event: string,
  //   data: Record<string, unknown> = {}
  // ): boolean {
  //   return this.safeEmit(event, { ...data, roomId: this.getRoomId() });
  // }

  // protected safeOn (event: string, handler: (...args: any[]) => void): void {
  //   this.socket.off(event);
  //   this.socket.on(event, handler)
  // }

  protected safeOff(
    event: string,
    handler?: (...args: unknown[]) => void
  ): void {
    if (!this.socket) return;

    if (handler) {
      this.socket.off(event, handler);
    } else {
      this.socket.off(event);
    }
  }

  // =====================================================================
  // =====================================================================

  public leaveRoom(leaveEvent: string) {
    // if (this.roomId && this.isConnected()) {
    //   this.safeEmit(leaveEvent, { roomId: this.roomId });
    //   this.roomId = null;
    // }

    const currentRoomId = this.getRoomId();
    if (currentRoomId && this.isConnected()) {
      this.safeEmit(leaveEvent, { roomId: currentRoomId });
      this.setRoomId(null);
      console.log(`[NetworkManager] ${currentRoomId}번 방 퇴장 처리`);
    }
  }

  public getRoomId(): string | null {
    return this.roomId;
  }

  public setRoomId(roomId: string | null): void {
    this.roomId = roomId;
  }

  // =====================================================================
  // =====================================================================

  protected onConneted(): void {}

  protected onDisconnected(_reason: string): void {
    void _reason;
  }

  protected onError(_err: unknown): void {
    void _err;
  }

  // =====================================================================
  // =====================================================================

  protected abstract setupGameHandlers(): void;
  // protected abstract setupGameHandler (): void;

  // protected abstract cleanup (): void;
}
