import { OmokScene } from "@/game/scenes/games/OmokScene";
import { OmokMode, OmokSide, OmokSideType, Point } from "@/game/types/omok";
import { OMOK_CONFIG } from "@/game/types/omok/omok.constants";

/**
 * 게임 상태 인터페이스
 */
export interface OmokGameState {
  isStarted: boolean;
  currentTurn: OmokSideType;
  mode: OmokMode;
  userSide: OmokSideType;
}

/**
 * 온라인 상태 인터페이스
 */
export interface OmokOnlineState {
  mySide: OmokSideType;
  isSideAssigned: boolean;
  currentRoomId: string | null;
}

/**
 * OmokGameFlowManager
 *
 * 오목 게임의 흐름 제어를 담당:
 * - 게임 모드 선택 및 시작
 * - 턴 전환
 * - 게임 종료 처리
 * - 재시작 로직
 */
export class OmokGameFlowManager {
  private scene: OmokScene;

  public gameState: OmokGameState = {
    isStarted: false,
    currentTurn: OmokSide.BLACK,
    mode: OmokMode.NONE,
    userSide: OmokSide.BLACK,
  };

  public onlineState: OmokOnlineState = {
    mySide: OmokSide.NONE as OmokSideType,
    isSideAssigned: false,
    currentRoomId: null,
  };

  constructor(scene: OmokScene) {
    this.scene = scene;
  }

  // =====================================================================
  // 게임 시작 메서드들
  // =====================================================================

  /**
   * 로컬 대전 시작
   */
  startLocalGame(mode: OmokMode, mySide: OmokSideType): OmokSideType {
    const firstTurn = Math.random() < 0.5 ? OmokSide.BLACK : OmokSide.WHITE;
    return firstTurn;
  }

  /**
   * 싱글 플레이 시작 (vs AI)
   */
  startSingleGame(mySide: OmokSideType): OmokSideType {
    return OmokSide.BLACK; // AI 게임은 항상 흑돌 선공
  }

  /**
   * 온라인 게임 시작 가능 여부 확인
   */
  canStartOnlineGame(): boolean {
    return this.onlineState.isSideAssigned && !this.gameState.isStarted;
  }

  /**
   * 게임 설정 초기화
   */
  setupGame(
    mode: OmokMode,
    mySide: OmokSideType,
    firstTurn: OmokSideType
  ): void {
    this.gameState.mode = mode;
    this.gameState.currentTurn = firstTurn;
    this.gameState.isStarted = true;
    this.gameState.userSide = mySide;
  }

  // =====================================================================
  // 턴 관리
  // =====================================================================

  /**
   * 턴 전환
   */
  switchTurn(): void {
    this.gameState.currentTurn = this.gameState.currentTurn === 1 ? 2 : 1;
  }

  /**
   * 현재 턴 반환
   */
  getCurrentTurn(): OmokSideType {
    return this.gameState.currentTurn;
  }

  /**
   * AI 턴 실행 여부 확인
   */
  shouldExecuteAiTurn(): boolean {
    return (
      this.gameState.mode === OmokMode.SINGLE &&
      this.gameState.currentTurn === OmokSide.WHITE
    );
  }

  // =====================================================================
  // 입력 유효성 검사
  // =====================================================================

  /**
   * 입력 수용 가능 여부 (게임 시작됨 & AI 대기 아님)
   */
  canAcceptInput(isAiThinking: boolean): boolean {
    return this.gameState.isStarted && !isAiThinking;
  }

  /**
   * 온라인 턴 진행 가능 여부
   */
  canPlayOnlineTurn(): { can: boolean; message?: string } {
    if (!this.onlineState.isSideAssigned) {
      return { can: false, message: "색깔 할당 대기 중..." };
    }

    if (this.gameState.currentTurn !== this.onlineState.mySide) {
      return { can: false, message: "상대방의 턴입니다." };
    }

    return { can: true };
  }

  /**
   * 좌표 유효성 검사
   */
  isValidPosition(point: Point): boolean {
    const { row, col } = point;
    const size = OMOK_CONFIG.BOARD_STYLE.BOARD.SIZE;
    return row >= 0 && row < size && col >= 0 && col < size;
  }

  // =====================================================================
  // 온라인 상태 관리
  // =====================================================================

  /**
   * 역할(색상) 할당 처리
   */
  handleRoleAssignment(side: OmokSideType, roomId?: string): void {
    this.onlineState.mySide = side;
    this.onlineState.isSideAssigned = true;

    if (roomId) {
      this.onlineState.currentRoomId = roomId;
    }
  }

  /**
   * 온라인 상태 초기화
   */
  resetOnlineState(): void {
    this.onlineState.mySide = OmokSide.NONE;
    this.onlineState.isSideAssigned = false;
    this.onlineState.currentRoomId = null;
  }

  // =====================================================================
  // 게임 종료 및 재시작
  // =====================================================================

  /**
   * 게임 종료 처리
   */
  endGame(): void {
    this.gameState.isStarted = false;
  }

  /**
   * 승자 이름 반환
   */
  getWinnerName(winner: OmokSideType): string {
    switch (this.gameState.mode) {
      case OmokMode.SINGLE:
        return winner === OmokSide.BLACK ? "나" : "GPT";

      case OmokMode.LOCAL:
        return winner === OmokSide.BLACK ? "플레이어1" : "플레이어2";

      case OmokMode.ONLINE:
        return winner === this.onlineState.mySide ? "나" : "상대";

      default:
        return "알 수 없음";
    }
  }

  /**
   * 전체 상태 초기화 (모드 선택으로 돌아갈 때)
   */
  resetAllState(): void {
    this.resetOnlineState();

    this.gameState.mode = OmokMode.NONE;
    this.gameState.isStarted = false;
    this.gameState.currentTurn = OmokSide.BLACK;
  }

  /**
   * 재시작을 위한 상태 초기화
   */
  resetForRestart(): void {
    this.gameState.isStarted = false;
    this.gameState.currentTurn = OmokSide.BLACK;
  }

  // =====================================================================
  // Getter / Setter
  // =====================================================================

  get isOnlineMode(): boolean {
    return this.gameState.mode === OmokMode.ONLINE;
  }

  get isSingleMode(): boolean {
    return this.gameState.mode === OmokMode.SINGLE;
  }

  get isLocalMode(): boolean {
    return this.gameState.mode === OmokMode.LOCAL;
  }

  get isGameStarted(): boolean {
    return this.gameState.isStarted;
  }

  get mySide(): OmokSideType {
    return this.onlineState.mySide;
  }

  get currentRoomId(): string | null {
    return this.onlineState.currentRoomId;
  }
}
