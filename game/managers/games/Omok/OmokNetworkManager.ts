// game/managers/games/Omok/OmokNetworkManager.ts
import { BaseNetworkManager } from "@/game/managers/base/BaseNetworkManager";
import {
  OmokEvent,
  OmokEventPayload,
  type OmokMoveData,
} from "@/game/types/omok";

/**
 * OmokNetworkManager 콜백 인터페이스
 */
interface OmokNetworkCallbacks extends Record<string, unknown> {
  onWaiting?: (message: string) => void;
  onColorAssigned: (color: number, roomId: string) => void;
  onOpponentMove: (data: OmokMoveData) => void;
  onGameStart?: (data: OmokEventPayload<typeof OmokEvent.GAME_START>) => void;
}

/**
 * OmokNetworkManager
 * - 오목 게임 네트워크 통신 전담
 * - BaseNetworkManager의 타입 안전 메서드 활용
 * - 중복 에러 처리 제거
 */
export class OmokNetworkManager extends BaseNetworkManager<unknown> {
  constructor(scene: Phaser.Scene, callbacks: OmokNetworkCallbacks) {
    super(scene, {}, null);
    this.callbacks = callbacks;
  }

  // =====================================================================
  // 소켓 핸들러 설정
  // =====================================================================

  protected setupGameHandlers(): void {
    if (!this.socket) {
      console.warn("[OmokNetwork] 소켓이 초기화되지 않았습니다.");
      return;
    }

    this.registerWaitingHandler();
    this.registerColorAssignedHandler();
    this.registerOpponentMoveHandler();
    this.registerGameStartHandler();
  }

  /**
   * 매칭 대기 핸들러
   */
  private registerWaitingHandler(): void {
    this.safeOnTyped<OmokEventPayload<typeof OmokEvent.WAITING>>(
      OmokEvent.WAITING,
      (data) => {
        console.log("[OmokNetwork] 매칭 대기:", data.message);
        this.callCallback("onWaiting", data.message);
      }
    );
  }

  /**
   * 색깔 할당 핸들러
   */
  private registerColorAssignedHandler(): void {
    this.safeOnTyped<OmokEventPayload<typeof OmokEvent.ASSIGNED>>(
      OmokEvent.ASSIGNED,
      (data) => {
        console.log("[OmokNetwork] 색깔 할당:", data);

        // roomId 설정
        if (data.roomId) {
          this.setRoomId(data.roomId);
        }

        this.callCallback("onColorAssigned", data.color, data.roomId);
      }
    );
  }

  /**
   * 상대방 수 핸들러
   */
  private registerOpponentMoveHandler(): void {
    this.safeOnTyped<OmokEventPayload<typeof OmokEvent.MOVED>>(
      OmokEvent.MOVED,
      (data) => {
        // 내 수는 무시
        if (data.socketId !== this.socket.id) {
          console.log("[OmokNetwork] 상대방 수:", data);
          this.callCallback("onOpponentMove", data);
        }
      }
    );
  }

  /**
   * 게임 시작 핸들러
   */
  private registerGameStartHandler(): void {
    this.safeOnTyped<OmokEventPayload<typeof OmokEvent.GAME_START>>(
      OmokEvent.GAME_START,
      (data) => {
        console.log("🎮 [OmokNetwork] 게임 시작:", data);
        this.callCallback("onGameStart", data);
      }
    );
  }

  // =====================================================================
  // 게임 액션 (개선된 에러 처리)
  // =====================================================================

  /**
   * 빠른 매칭 참가
   * @throws {Error} 소켓 미연결 시
   */
  public joinMatch(): void {
    this.validateConnection();

    if (!this.safeEmit(OmokEvent.QUICK_MATCH)) {
      throw new Error("빠른 매칭 요청 실패");
    }

    console.log("[OmokNetwork] 빠른 매칭 요청 성공");
  }

  /**
   * 수 전송
   * @param row - 행
   * @param col - 열
   * @param color - 돌 색깔
   * @returns 성공 여부와 에러 메시지
   */
  public sendMove(
    row: number,
    col: number,
    color: number
  ): { success: boolean; error?: string } {
    try {
      // 유효성 검증
      this.validateRoomAndConnection();
      this.validateMoveData(row, col, color);

      // 페이로드 생성 및 전송
      const payload = this.createMovePayload(row, col, color);
      this.emitMove(payload);

      return { success: true };
    } catch (error) {
      return this.handleError(error, "수 전송");
    }
  }

  /**
   * 게임 종료 알림
   * @param winner - 승자 (1: 흑, 2: 백)
   * @returns 성공 여부와 에러 메시지
   */
  public notifyGameOver(winner: number): { success: boolean; error?: string } {
    try {
      // 유효성 검증
      this.validateRoomAndConnection();
      this.validateWinner(winner);

      // 페이로드 생성 및 전송
      const payload = this.createGameOverPayload(winner);
      this.emitGameOver(payload);

      return { success: true };
    } catch (error) {
      return this.handleError(error, "게임 종료 알림");
    }
  }

  // =====================================================================
  // 유효성 검증 헬퍼
  // =====================================================================

  /**
   * 소켓 연결 검증
   * @throws {Error} 소켓 미연결 시
   */
  private validateConnection(): void {
    if (!this.isConnected()) {
      throw new Error("소켓이 연결되지 않았습니다");
    }
  }

  /**
   * 방 입장 및 소켓 연결 검증
   * @throws {Error} 방 미입장 또는 소켓 미연결 시
   */
  private validateRoomAndConnection(): void {
    if (!this.roomId) {
      throw new Error("방에 입장하지 않았습니다");
    }
    this.validateConnection();
  }

  /**
   * 수 데이터 검증
   * @throws {Error} 유효하지 않은 좌표 시
   */
  private validateMoveData(row: number, col: number, color: number): void {
    if (row < 0 || col < 0) {
      throw new Error("유효하지 않은 좌표입니다");
    }
    if (color !== 1 && color !== 2) {
      throw new Error("유효하지 않은 돌 색깔입니다");
    }
  }

  /**
   * 승자 데이터 검증
   * @throws {Error} 유효하지 않은 승자 값
   */
  private validateWinner(winner: number): void {
    if (winner !== 1 && winner !== 2) {
      throw new Error("유효하지 않은 승자 값입니다");
    }
  }

  // =====================================================================
  // 페이로드 생성 헬퍼
  // =====================================================================

  /**
   * 수 전송 페이로드 생성
   */
  private createMovePayload(
    row: number,
    col: number,
    color: number
  ): OmokEventPayload<typeof OmokEvent.MOVE> {
    return {
      roomId: this.roomId!,
      row,
      col,
      color,
      socketId: this.socket.id,
    };
  }

  /**
   * 게임 종료 페이로드 생성
   */
  private createGameOverPayload(
    winner: number
  ): OmokEventPayload<typeof OmokEvent.GAME_OVER> {
    return {
      roomId: this.roomId!,
      winner,
    };
  }

  // =====================================================================
  // 이벤트 발송 헬퍼
  // =====================================================================

  /**
   * 수 전송 이벤트 발송
   */
  private emitMove(payload: OmokEventPayload<typeof OmokEvent.MOVE>): void {
    console.log("[OmokNetwork] 수 전송:", payload);
    this.safeEmit(OmokEvent.MOVE, payload);
  }

  /**
   * 게임 종료 이벤트 발송
   */
  private emitGameOver(
    payload: OmokEventPayload<typeof OmokEvent.GAME_OVER>
  ): void {
    console.log("[OmokNetwork] 게임 종료:", payload);
    this.safeEmit(OmokEvent.GAME_OVER, payload);
  }

  // =====================================================================
  // 에러 처리 헬퍼
  // =====================================================================

  /**
   * 통합 에러 처리
   * @param error - 발생한 에러
   * @param action - 수행하던 작업
   * @returns 에러 응답 객체
   */
  private handleError(
    error: unknown,
    action: string
  ): { success: false; error: string } {
    const errorMsg = error instanceof Error ? error.message : "알 수 없는 에러";
    console.error(`[OmokNetwork] ${action} 실패:`, errorMsg);

    return {
      success: false,
      error: errorMsg,
    };
  }

  // =====================================================================
  // 정리
  // =====================================================================

  public cleanup(): void {
    if (this.socket) {
      // 등록된 모든 이벤트 제거
      this.safeOff(OmokEvent.WAITING);
      this.safeOff(OmokEvent.ASSIGNED);
      this.safeOff(OmokEvent.MOVED);
      this.safeOff(OmokEvent.GAME_START);
    }

    console.log("[OmokNetwork] 정리 완료");
  }

  // =====================================================================
  // BaseGameManager 추상 메서드 구현
  // =====================================================================

  setGameObjects(): void {
    // 네트워크 매니저는 게임 오브젝트를 관리하지 않음
  }

  resetGame(): void {
    // 네트워크 매니저는 게임 리셋을 관리하지 않음
  }
}
