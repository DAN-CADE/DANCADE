// game/scenes/OmokScene.ts (완전 수정 버전)

import { BaseGameScene } from "@/game/scenes/base/BaseGameScene";
import { OmokManager } from "@/game/managers/games/omok/core/OmokManager";
import { OmokBoardManager } from "@/game/managers/games/omok/board/OmokBoardManager";
import { OmokUIManager } from "@/game/managers/games/omok/ui/OmokUIManager";
import { OmokRoomManager } from "@/game/managers/games/omok/network/room/OmokRoomManager";
import { OmokNetworkManager } from "@/game/managers/games/omok/network/OmokNetworkManager";

// 분리된 타입 import
import { OMOK_CONFIG, OmokMode, type OmokMoveData } from "@/game/types/omok";
import { OmokGameAbortedDialog } from "@/game/managers/games/omok/ui/OmokGameAbortedDialog";
import { OmokAIManager } from "@/game/managers/games/omok/core/OmokAIManager";
import { BaseRoomUIManager } from "@/game/managers/base/multiplayer";

/**
 * OmokScene - 오목 게임 씬
 *
 * 책임:
 * - 게임 생명주기 관리
 * - 플레이어 입력 처리
 * - 게임 모드별 흐름 제어
 * - 매니저 간 조율
 */
export class OmokScene extends BaseGameScene {
  // =====================================================================
  // 게임 상태
  // =====================================================================
  private gameState = {
    isStarted: false,
    currentTurn: 1, // 1(흑) 또는 2(백)
    mode: OmokMode.NONE,
  };

  // =====================================================================
  // 온라인 멀티플레이 상태
  // =====================================================================
  private onlineState = {
    myColor: 0, // 0: 미할당, 1: 흑돌, 2: 백돌
    isColorAssigned: false,
    currentRoomId: null as string | null,
  };

  // =====================================================================
  // 매니저들
  // =====================================================================
  private managers = {
    omok: null as OmokManager | null,
    board: null as OmokBoardManager | null,
    ui: null as OmokUIManager | null,
    room: null as OmokRoomManager | null,
    network: null as OmokNetworkManager | null,
    onlineUI: null as BaseOnlineUIManager | null,
    abortDialog: null as OmokGameAbortedDialog | null,
    ai: null as OmokAIManager | null,
    roomUI: null as BaseRoomUIManager | null,
  };

  constructor() {
    super("OmokScene");
  }

  // =====================================================================
  // Public Getters (UI 매니저에서 접근용)
  // =====================================================================

  /**
   * 내 돌 색깔 반환 (UI 매니저에서 사용)
   */
  public get myColor(): number {
    return this.onlineState.myColor;
  }

  // =====================================================================
  // BaseGameScene 라이프사이클
  // =====================================================================

  protected loadAssets(): void {
    // 추후 이미지/사운드 로드 시 사용
  }

  // ⭐ Phaser 생명주기 메서드 추가
  preload(): void {
    console.log("🎮 [OmokScene] preload() 시작");
    this.loadAssets();
  }

  // ⭐ Phaser 생명주기 메서드 추가
  create(): void {
    console.log("🎮 [OmokScene] create() 시작");

    this.setupScene();
    this.initManagers();
    this.createGameObjects();

    // ⭐ 채팅 숨김 (게임 씬이므로)
    console.log("🎮 [OmokScene] 채팅 숨김 호출");
    this.hideChat();

    this.onGameReady();
  }

  protected initManagers(): void {
    // 네트워크 매니저 (가장 먼저 초기화)
    this.managers.network = this.createNetworkManager();

    // AI 매니저
    this.managers.ai = new OmokAIManager();

    // UI 매니저들
    this.managers.ui = new OmokUIManager(this);
    this.managers.onlineUI = new BaseOnlineUIManager(this);

    // 게임 로직 매니저
    this.managers.omok = this.createOmokManager();

    // 보드 매니저
    this.managers.board = new OmokBoardManager(this, this.managers.omok);

    // 방 매니저
    this.managers.room = this.createRoomManager();

    // 게임 중단 다이얼로그
    this.managers.abortDialog = new OmokGameAbortedDialog(this);

    // 이벤트 리스너 등록
    this.setupEventListeners();
  }

  protected setupScene(): void {
    this.cameras.main.setBackgroundColor(OMOK_CONFIG.COLORS.BOARD);
  }

  protected createGameObjects(): void {
    this.managers.board!.setGameObjects();
    this.setupInputHandler();
  }

  protected onGameReady(): void {
    this.showModeSelection();
  }

  // =====================================================================
  // 매니저 생성 헬퍼
  // =====================================================================

  /**
   * 네트워크 매니저 생성 및 초기화
   */
  private createNetworkManager(): OmokNetworkManager {
    const manager = new OmokNetworkManager(this, {
      onWaiting: (message) => this.handleWaitingForMatch(message),
      onColorAssigned: (color, roomId) =>
        this.handleColorAssignment(color, roomId),
      onOpponentMove: (data) => this.handleOpponentMove(data),
    });

    if (!manager.isSocketInitialized()) {
      manager.initializeSocket();
    }

    return manager;
  }

  /**
   * 오목 로직 매니저 생성
   */
  private createOmokManager(): OmokManager {
    return new OmokManager(this, OMOK_CONFIG.BOARD_SIZE, {
      onWin: (winner) => this.handleGameEnd(winner),
      onMove: (row, col, color) =>
        this.managers.board!.renderStone(row, col, color),
      onForbidden: (reason) => this.managers.ui!.showForbiddenMessage(reason),
    });
  }

  /**
   * 방 매니저 생성 및 콜백 설정
   */
  private createRoomManager(): OmokRoomManager {
    const manager = new OmokRoomManager(
      this,
      this.managers.network!.getSocket()
    );

    manager.setOnError((message) => {
      console.error("[OmokScene] 방 에러:", message);
      this.managers.ui!.showForbiddenMessage(message);
    });

    manager.setOnGameAborted((reason, leavingPlayer) => {
      console.warn("[OmokScene] 게임 중단:", reason, leavingPlayer);
      this.handleGameAborted(reason, leavingPlayer);
    });

    manager.setOnGameStart(() => {
      if (this.onlineState.isColorAssigned) {
        this.startOnlineGame();
      }
    });

    return manager;
  }

  /**
   * 입력 핸들러 설정
   */
  private setupInputHandler(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handlePlayerInput(pointer);
    });
  }

  // =====================================================================
  // 게임 모드 선택
  // =====================================================================

  /**
   * 모드 선택 화면 표시
   */
  private showModeSelection(): void {
    this.managers.ui!.showModeSelection((mode) => {
      if (mode === OmokMode.NONE) {
        // EXIT 처리
        this.exitToMainScene();
        return;
      }

      if (mode === OmokMode.ONLINE) {
        this.showOnlineMenu();
      } else {
        this.startLocalGame(mode);
      }
    });
  }

  // =====================================================================
  // 로컬 게임 (싱글/로컬 모드)
  // =====================================================================

  /**
   * 로컬 게임 시작 (싱글 AI 또는 2인 대전)
   */
  private startLocalGame(mode: OmokMode): void {
    this.gameState.mode = mode;
    this.gameState.currentTurn = Math.random() < 0.5 ? 1 : 2;
    this.gameState.isStarted = true;

    this.managers.ui!.createPlayerProfiles(mode);
    this.managers.ui!.updateTurnUI(this.gameState.currentTurn);
    this.managers.board!.updateForbiddenMarkers(
      this.gameState.currentTurn,
      this.gameState.isStarted
    );

    // AI 모드이고 AI가 선공이면 AI가 먼저 수를 둠
    if (mode === OmokMode.SINGLE && this.gameState.currentTurn === 2) {
      this.executeAiTurn();
    }
  }

  // =====================================================================
  // 온라인 게임
  // =====================================================================

  /**
   * 온라인 메뉴 표시
   */
  private showOnlineMenu(): void {
    this.gameState.mode = OmokMode.ONLINE;

    this.managers.onlineUI!.showOnlineMenu({
      onQuickJoin: () => this.startQuickMatch(),
      onCreateRoom: () => this.showCreateRoomDialog(),
      onShowList: () => this.showRoomList(),
      onBack: () => this.returnToModeSelection(),
      onMainMove: () => this.exitToMainScene(),
      colors: {
        primary: OMOK_CONFIG.COLORS.PRIMARY,
        secondary: OMOK_CONFIG.COLORS.SECONDARY,
        panel: OMOK_CONFIG.COLORS.PANEL,
      },
    });
  }

  /**
   * 빠른 매칭 시작
   */
  private startQuickMatch(): void {
    if (!this.managers.network!.isConnected()) {
      this.managers.ui!.showForbiddenMessage(
        "서버 연결 실패. 다시 시도해주세요."
      );
      return;
    }

    this.managers.onlineUI!.hideOnlineMenu();

    try {
      this.managers.network!.joinMatch();
      this.managers.ui!.showWaitingMessage("빠른 매칭 중...");
    } catch (error) {
      console.error("[오목] 빠른 매칭 실패:", error);
      this.managers.ui!.showForbiddenMessage(
        "매칭 요청 실패. 다시 시도해주세요."
      );
    }
  }

  /**
   * 방 생성 다이얼로그 표시
   */
  private showCreateRoomDialog(): void {
    this.managers.onlineUI!.hideOnlineMenu();

    this.events.emit("roomUI:createRoomRequested");
  }

  /**
   * 방 목록 표시
   */
  private showRoomList(): void {
    this.managers.onlineUI!.hideOnlineMenu();
    this.managers.room!.requestRoomList();
    this.managers.room!.renderRoomList();
  }

  /**
   * 모드 선택으로 돌아가기
   */
  private returnToModeSelection(): void {
    // 게임 상태 초기화
    this.resetAllManagers();

    // 온라인 상태 초기화
    this.onlineState.myColor = 0;
    this.onlineState.isColorAssigned = false;
    this.onlineState.currentRoomId = null;

    // 게임 상태 초기화
    this.gameState.mode = OmokMode.NONE;
    this.gameState.isStarted = false;
    this.gameState.currentTurn = 1;

    // 씬 재시작 (자동으로 모드 선택 화면 표시)
    this.scene.restart();
  }

  /**
   * 온라인 게임 시작
   */
  private startOnlineGame(): void {
    if (!this.onlineState.isColorAssigned || this.gameState.isStarted) {
      console.warn("[OmokScene] 게임 시작 조건 미충족", {
        isColorAssigned: this.onlineState.isColorAssigned,
        isStarted: this.gameState.isStarted,
      });
      return;
    }

    this.gameState.isStarted = true;
    this.gameState.currentTurn = 1;
    this.gameState.mode = OmokMode.ONLINE;

    // 보드 초기화
    this.managers.omok!.resetBoard();
    this.managers.board!.resetGame();
    this.managers.board!.renderBoard();
    this.managers.board!.updateForbiddenMarkers(1, true);

    // UI 초기화
    this.managers.room!.clearUI();
    this.managers.ui!.createPlayerProfiles(
      OmokMode.ONLINE,
      this.onlineState.myColor
    );
    this.managers.ui!.updateTurnUI(this.gameState.currentTurn);
  }

  // =====================================================================
  // 네트워크 이벤트 핸들러
  // =====================================================================

  /**
   * 매칭 대기 처리
   */
  private handleWaitingForMatch(message: string): void {
    console.log("[OmokScene] 매칭 대기:", message);
    this.managers.ui!.showWaitingMessage(message);
  }

  /**
   * 색깔 할당 처리
   */
  private handleColorAssignment(color: number, roomId?: string): void {
    console.log("[OmokScene] 색깔 할당:", color, roomId);

    this.onlineState.myColor = color;
    this.onlineState.isColorAssigned = true;

    if (roomId) {
      this.managers.network!.setRoomId(roomId);
    }

    const colorName = color === 1 ? "흑돌 (선공)" : "백돌 (후공)";
    this.managers.ui!.showWaitingMessage(`당신은 ${colorName}입니다!`);

    // 1초 후 게임 시작
    this.time.delayedCall(1000, () => {
      this.managers.ui!.hideWaitingMessage();
      if (this.onlineState.isColorAssigned && !this.gameState.isStarted) {
        this.startOnlineGame();
      }
    });
  }

  /**
   * 상대방 수 처리
   */
  private handleOpponentMove(data: OmokMoveData): void {
    if (this.gameState.mode !== OmokMode.ONLINE) return;

    const success = this.managers.omok!.placeStone(
      data.row,
      data.col,
      data.color
    );
    if (success) {
      this.managers.board!.renderStone(data.row, data.col, data.color);
      this.advanceGameStep(data.row, data.col);
    } else {
      console.error("[오목] 상대방의 유효하지 않은 수:", data);
    }
  }

  /**
   * 게임 중단 처리
   */
  private handleGameAborted(reason: string, leavingPlayer: string): void {
    this.gameState.isStarted = false;
    this.showGameAbortedDialog(reason, leavingPlayer);
  }

  // =====================================================================
  // 플레이어 입력 처리
  // =====================================================================

  /**
   * 플레이어 클릭 처리
   */
  private handlePlayerInput(pointer: Phaser.Input.Pointer): void {
    // 기본 가드
    if (!this.canAcceptInput()) return;

    // 온라인 모드 전용 체크
    if (this.gameState.mode === OmokMode.ONLINE && !this.canPlayOnlineTurn()) {
      return;
    }

    // 좌표 변환 및 유효성 검증
    const { row, col } = this.managers.board!.worldToGrid(pointer.x, pointer.y);
    if (!this.isValidPosition(row, col)) return;

    // 금수 체크
    if (!this.checkForbiddenMove(row, col)) return;

    // 돌 배치
    this.placeStoneAndAdvance(row, col);
  }

  /**
   * 입력 가능 여부 확인
   */
  private canAcceptInput(): boolean {
    return this.gameState.isStarted && !this.managers.ai!.isAiThinking();
  }

  /**
   * 온라인 턴 플레이 가능 여부 확인
   */
  private canPlayOnlineTurn(): boolean {
    if (!this.onlineState.isColorAssigned) {
      this.managers.ui!.showForbiddenMessage("색깔 할당 대기 중...");
      return false;
    }

    if (this.gameState.currentTurn !== this.onlineState.myColor) {
      this.managers.ui!.showForbiddenMessage("상대방의 턴입니다.");
      return false;
    }

    return true;
  }

  /**
   * 좌표 유효성 검증
   */
  private isValidPosition(row: number, col: number): boolean {
    return (
      row >= 0 &&
      row < OMOK_CONFIG.BOARD_SIZE &&
      col >= 0 &&
      col < OMOK_CONFIG.BOARD_SIZE
    );
  }

  /**
   * 금수 체크
   */
  private checkForbiddenMove(row: number, col: number): boolean {
    const forbiddenCheck = this.managers.omok!.checkForbidden(
      row,
      col,
      this.gameState.currentTurn
    );

    if (!forbiddenCheck.can) {
      this.managers.ui!.showForbiddenMessage(
        forbiddenCheck.reason || "둘 수 없는 곳"
      );
      this.cameras.main.shake(200, 0.005);
      return false;
    }

    return true;
  }

  /**
   * 돌 배치 및 게임 진행
   */
  private placeStoneAndAdvance(row: number, col: number): void {
    if (this.managers.omok!.placeStone(row, col, this.gameState.currentTurn)) {
      this.managers.board!.renderStone(row, col, this.gameState.currentTurn);

      // 온라인 모드일 경우 서버에 수 전송
      if (this.gameState.mode === OmokMode.ONLINE) {
        this.managers.network!.sendMove(row, col, this.onlineState.myColor);
      }

      this.advanceGameStep(row, col);
    }
  }

  // =====================================================================
  // 게임 진행 로직
  // =====================================================================

  /**
   * 게임 단계 진행 (승리 체크 → 턴 전환 → AI 실행)
   */
  private advanceGameStep(row: number, col: number): void {
    // 승리 체크
    if (this.managers.omok!.checkWin(row, col, this.gameState.currentTurn)) {
      this.handleGameEnd(this.gameState.currentTurn);
      return;
    }

    // 턴 전환
    this.switchTurn();

    // AI 턴이면 AI 실행
    if (this.shouldExecuteAiTurn()) {
      this.executeAiTurn();
    }
  }

  /**
   * 턴 전환
   */
  private switchTurn(): void {
    this.gameState.currentTurn = this.gameState.currentTurn === 1 ? 2 : 1;

    this.managers.ui!.updateTurnUI(this.gameState.currentTurn);
    this.managers.board!.updateForbiddenMarkers(
      this.gameState.currentTurn,
      this.gameState.isStarted
    );
  }

  /**
   * AI 턴 실행 여부
   */
  private shouldExecuteAiTurn(): boolean {
    return (
      this.gameState.mode === OmokMode.SINGLE &&
      this.gameState.currentTurn === 2
    );
  }

  // =====================================================================
  // AI 로직
  // =====================================================================

  /**
   * AI 수 실행
   */
  private executeAiTurn(): void {
    if (!this.gameState.isStarted || this.managers.ai!.isAiThinking()) {
      return;
    }

    const currentTurn = this.gameState.currentTurn;
    const threats = this.managers.omok!.getThreats(currentTurn);
    const board = this.managers.omok!.getBoardState();
    const lastMove = undefined;

    this.managers.ai!.executeAiTurn(
      board,
      threats || [],
      lastMove,
      (row, col) => this.isValidPosition(row, col),
      (result) => this.handleAiTurnResult(result, currentTurn)
    );
  }

  /**
   * AI 턴 결과 처리
   */
  private handleAiTurnResult(
    result: { success: boolean; move: { row: number; col: number } | null },
    currentTurn: number
  ): void {
    if (!this.gameState.isStarted) {
      return;
    }

    if (!result.success || !result.move || result.move.row === -1) {
      console.error("[AI] 유효한 수를 찾지 못함");
      return;
    }

    const { row, col } = result.move;

    // AI 수 실행
    if (this.managers.omok!.placeStone(row, col, currentTurn)) {
      this.managers.board!.renderStone(row, col, currentTurn);
      this.advanceGameStep(row, col);
    }
  }

  // =====================================================================
  // 게임 종료
  // =====================================================================

  /**
   * 게임 종료 처리
   */
  protected handleGameEnd(winner: number): void {
    this.gameState.isStarted = false;

    this.managers.board!.showMoveNumbers();

    // ⭐ 온라인 모드일 때 서버에 게임 종료 알림
    if (this.gameState.mode === OmokMode.ONLINE) {
      console.log(`🏆 [OmokScene] 게임 종료 - 승자: ${winner}`);
      this.managers.network!.notifyGameOver(winner);
    }

    const winnerName = this.getWinnerName(winner);

    this.managers.ui!.showEndGameUI(
      winnerName,
      () => this.restartGame(),
      () => this.returnToModeSelection()
    );
  }

  /**
   * 승자 이름 결정
   */
  private getWinnerName(winner: number): string {
    if (this.gameState.mode === OmokMode.SINGLE) {
      return winner === 1 ? "나" : "GPT";
    } else if (this.gameState.mode === OmokMode.LOCAL) {
      return winner === 1 ? "플레이어1" : "플레이어2";
    } else if (this.gameState.mode === OmokMode.ONLINE) {
      return winner === this.onlineState.myColor ? "나" : "상대";
    }
    return "알 수 없음";
  }

  /**
   * 게임 중단 다이얼로그 표시
   */
  private showGameAbortedDialog(reason: string, leavingPlayer: string): void {
    this.managers.room!.clearUI();
    this.managers.ui!.hideWaitingMessage();

    this.managers.abortDialog!.show(reason, leavingPlayer, () => {
      this.exitToMainMenu();
    });
  }

  // =====================================================================
  // 씬 전환
  // =====================================================================

  /**
   * 메인 씬으로 이동
   */
  private exitToMainScene(): void {
    this.scene.start("MainScene");
  }

  /**
   * 메인 메뉴로 이동
   */
  private exitToMainMenu(): void {
    this.resetAllManagers();
    this.exitToMainScene();
  }

  /**
   * 게임 재시작
   */
  protected restartGame(): void {
    const previousMode = this.gameState.mode;

    this.resetAllManagers();
    this.managers.board?.renderBoard();

    this.gameState.isStarted = false;
    this.gameState.currentTurn = 1;

    if (previousMode === OmokMode.ONLINE) {
      this.onlineState.myColor = 0;
      this.onlineState.isColorAssigned = false;
      this.onlineState.currentRoomId = null;
    }

    if (previousMode === OmokMode.SINGLE || previousMode === OmokMode.LOCAL) {
      this.startLocalGame(previousMode);
    } else if (previousMode === OmokMode.ONLINE) {
      this.showOnlineMenu();
    } else {
      this.scene.restart();
    }
  }

  /**
   * 모든 매니저 초기화
   */
  private resetAllManagers(): void {
    this.managers.board?.resetGame();
    this.managers.ui?.resetGame();
    this.managers.omok?.resetGame();
    this.managers.room?.cleanup();
    this.managers.ai?.cleanup();
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // 방에서 나가기/뒤로가기 → 온라인 메뉴 표시
    this.events.on("room:exit", () => {
      console.log("[OmokScene] room:exit 이벤트 받음 - 온라인 메뉴 표시");
      this.showOnlineMenu();
    });
  }

  // =====================================================================
  // 씬 종료
  // =====================================================================

  /**
   * 씬 종료 시 정리
   */
  shutdown(): void {
    this.managers.abortDialog?.clear();
    this.managers.network?.cleanup();
    this.managers.onlineUI?.cleanup();
    this.managers.room?.cleanup();
    this.managers.ai?.cleanup();
    super.shutdown();
  }
}
