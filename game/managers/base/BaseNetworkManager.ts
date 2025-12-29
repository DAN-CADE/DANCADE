// game/managers/base/BaseNetworkManager.ts
import { io, Socket } from "socket.io-client";
import { BaseGameManager } from "@/game/managers/base/BaseGameManager";
import { NETWORK_CONFIG } from "@/game/config/network";

interface SocketInitOptions {
  transports?: string[];
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

/**
 * BaseNetworkManager
 * - 소켓 연결 및 통신 관리
 * - 게임별 네트워크 로직의 기반 클래스
 * - UI 로직은 포함하지 않음 (BaseOnlineUIManager로 분리)
 */
export abstract class BaseNetworkManager<
  TState
> extends BaseGameManager<TState> {
  protected socket: Socket;
  protected roomId: string | null;
  protected socketInitialized = false;

  constructor(
    scene: Phaser.Scene,
    gameState: TState,
    roomId: string | null = null
  ) {
    super(scene, gameState, {});
    this.roomId = roomId;
  }

  // =====================================================================
  // 소켓 초기화
  // =====================================================================

  /**
   * Socket.IO 클라이언트 초기화
   * - 모든 게임에서 공통으로 사용
   * @param socketUrl - 소켓 서버 URL
   * @param options - 추가 소켓 옵션 (선택)
   */
  public initializeSocket(
    socketUrl?: string,
    options?: SocketInitOptions
  ): void {
    if (this.socketInitialized) {
      console.warn("[NetworkManager] 소켓이 이미 초기화되었습니다.");
      return;
    }

    // 기본 URL 사용
    const url = socketUrl || NETWORK_CONFIG.SOCKET_URL;

    const defaultOptions: SocketInitOptions = {
      ...NETWORK_CONFIG.DEFAULT_OPTIONS, // 기본 옵션 사용
      ...options,
    };

    console.log("[NetworkManager] 소켓 연결 시작:", url);

    this.socket = io(url, defaultOptions);

    this.setupBaseHandlers();
    this.socketInitialized = true;
    this.setupGameHandlers();
  }

  /**
   * 기본 소켓 이벤트 핸들러 설정
   */
  private setupBaseHandlers(): void {
    this.socket.on("connect", () => {
      console.log("[NetworkManager] 소켓 연결 성공:", this.socket.id);
      this.onConnected();
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("[NetworkManager] 소켓 연결 해제:", reason);
      this.onDisconnected(reason);
    });

    this.socket.on("error", (err: unknown) => {
      console.error("[NetworkManager] 소켓 에러:", err);
      this.onError(err);
    });
  }

  // =====================================================================
  // 연결 상태 관리
  // =====================================================================

  /**
   * 소켓 초기화 여부 확인
   */
  public isSocketInitialized(): boolean {
    return this.socketInitialized;
  }

  /**
   * 소켓 연결 상태 확인
   */
  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * 연결 대기 (타임아웃 포함)
   * @param timeout - 타임아웃 시간 (ms)
   * @returns 연결 성공 여부
   */
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

  /**
   * Socket 객체 반환 (다른 매니저에서 사용)
   */
  public getSocket(): Socket {
    return this.socket;
  }

  // =====================================================================
  // ✅ 타입 안전 통신 메서드 (새로 추가)
  // =====================================================================

  /**
   * 타입 안전 이벤트 리스닝
   * @param event - 이벤트 이름
   * @param handler - 타입이 지정된 핸들러
   */
  protected safeOnTyped<TPayload>(
    event: string,
    handler: (data: TPayload) => void
  ): void {
    if (!this.socket) {
      console.warn(`[NetworkManager] 소켓이 초기화되지 않음: ${event}`);
      return;
    }

    // 기존 리스너 제거 후 등록
    this.socket.off(event);
    this.socket.on(event, (data: TPayload) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[NetworkManager] 핸들러 에러 (${event}):`, error);
      }
    });
  }

  /**
   * 타입 안전 이벤트 발송 (ACK 지원)
   * @param event - 이벤트 이름
   * @param payload - 타입이 지정된 페이로드
   * @param timeout - 타임아웃 시간
   * @returns ACK 응답
   */
  protected safeEmitWithAck<TPayload, TResponse = void>(
    event: string,
    payload: TPayload,
    timeout: number = 5000
  ): Promise<TResponse> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        reject(new Error(`소켓 미연결: ${event}`));
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error(`타임아웃: ${event}`));
      }, timeout);

      try {
        this.socket.emit(event, payload, (response: TResponse) => {
          clearTimeout(timer);
          resolve(response);
        });
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  // =====================================================================
  // 기존 안전한 통신 메서드 (하위 호환성 유지)
  // =====================================================================

  /**
   * 안전한 emit (연결 상태 체크 + 에러 처리)
   * @param event - 이벤트 이름
   * @param data - 전송할 데이터
   * @returns 성공 여부
   */
  protected safeEmit(event: string, data?: any): boolean {
    if (!this.isConnected()) {
      console.error(`[NetworkManager] 소켓 미연결: ${event}`);
      return false;
    }

    try {
      this.socket.emit(event, data);
      return true;
    } catch (error) {
      console.error(`[NetworkManager] emit 실패 (${event}):`, error);
      return false;
    }
  }

  /**
   * roomId를 자동으로 포함하는 emit
   * @param event - 이벤트 이름
   * @param data - 전송할 데이터
   * @returns 성공 여부
   */
  protected emitWithRoom(
    event: string,
    data: Record<string, unknown> = {}
  ): boolean {
    return this.safeEmit(event, { ...data, roomId: this.roomId });
  }

  /**
   * 안전한 이벤트 리스너 등록 (중복 방지)
   * @param event - 이벤트 이름
   * @param handler - 핸들러 함수
   */
  protected safeOn(event: string, handler: (...args: any[]) => void): void {
    this.socket.off(event); // 기존 리스너 제거
    this.socket.on(event, handler);
  }

  /**
   * 이벤트 리스너 제거
   * @param event - 이벤트 이름
   * @param handler - 핸들러 함수 (선택)
   */
  protected safeOff(event: string, handler?: (...args: any[]) => void): void {
    if (handler) {
      this.socket.off(event, handler);
    } else {
      this.socket.off(event);
    }
  }

  // =====================================================================
  // 방 관리
  // =====================================================================

  /**
   * 방 나가기
   * @param leaveEvent - 방 나가기 이벤트 이름 (기본: "room:leave")
   */
  public leaveRoom(leaveEvent: string = "room:leave"): void {
    if (this.roomId && this.isConnected()) {
      this.safeEmit(leaveEvent, { roomId: this.roomId });
      this.roomId = null;
    }
  }

  /**
   * 현재 방 ID 반환
   */
  public getRoomId(): string | null {
    return this.roomId;
  }

  /**
   * 방 ID 설정
   */
  protected setRoomId(roomId: string | null): void {
    this.roomId = roomId;
  }

  // =====================================================================
  // 생명주기 훅 (자식 클래스에서 오버라이드 가능)
  // =====================================================================

  /**
   * 연결 성공 시 호출
   */
  protected onConnected(): void {
    // 자식 클래스에서 필요시 구현
  }

  /**
   * 연결 해제 시 호출
   */
  protected onDisconnected(reason: string): void {
    // 자식 클래스에서 필요시 구현
  }

  /**
   * 에러 발생 시 호출
   */
  protected onError(error: unknown): void {
    // 자식 클래스에서 필요시 구현
  }

  // =====================================================================
  // 추상 메서드 (자식 클래스에서 반드시 구현)
  // =====================================================================

  /**
   * 게임별 소켓 핸들러 설정
   */
  protected abstract setupGameHandlers(): void;

  /**
   * 정리 작업
   */
  public abstract cleanup(): void;
}
