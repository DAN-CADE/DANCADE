import {
  OmokMode,
  OmokSide,
  OmokSideType,
  OmokMoveData,
  Point,
} from "@/game/types/omok";
import { BaseOnlineUIManager } from "@/game/managers/base/multiplayer/ui/BaseOnlineUIManager";
import { BaseGameScene } from "@/game/scenes/base/BaseGameScene";
import { OmokManager } from "@/game/managers/games/omok/core/OmokManager";
import { OmokBoardManager } from "@/game/managers/games/omok/board/OmokBoardManager";
import { OmokUIManager } from "@/game/managers/games/omok/ui/OmokUIManager";
import { OmokRoomManager } from "@/game/managers/games/omok/network/room/OmokRoomManager";
import { OmokNetworkManager } from "@/game/managers/games/omok/network/OmokNetworkManager";
import { OmokGameAbortedDialog } from "@/game/managers/games/omok/ui/OmokGameAbortedDialog";
import { OmokAIManager } from "@/game/managers/games/omok/core/OmokAIManager";
import { OmokGameFlowManager } from "@/game/managers/games/omok/flow/OmokGameFlowManager";
import { OMOK_CONFIG } from "@/game/types/omok/omok.constants";
import { GameNetworkCallbacks } from "@/game/types/multiplayer/network.types";
import { RoomUIEvent } from "@/game/types/common/common.network.types";
import { AiGameOverHandler } from "@/handlers/ai/AiGameOverHandler.js";

interface IAiGameOverHandler {
  handle(winner: OmokSideType): Promise<void>;
}

export class OmokScene extends BaseGameScene {
  constructor() {
    super({ key: "OmokScene" });
  }

  create() {
    super.create();
    console.log("오목 씬 테스트 - 초기화 완료");
  }

  // =====================================================================
  // 매니저 인스턴스
  // =====================================================================

  private flow!: OmokGameFlowManager;

  private managers!: {
    omok: OmokManager;
    board: OmokBoardManager;
    ui: OmokUIManager;
    room: OmokRoomManager;
    network: OmokNetworkManager;
    onlineUI: BaseOnlineUIManager;
    abortDialog: OmokGameAbortedDialog;
    ai: OmokAIManager;
    aiHandler: IAiGameOverHandler;
  };

  // =====================================================================
  // BaseGameScene 구현
  // =====================================================================

  protected loadAssets(): void {}

  protected setupScene(): void {
    this.cameras.main.setBackgroundColor(OMOK_CONFIG.COLORS.BOARD);
  }

  protected createGameObjects(): void {
    this.managers.board.renderBoard();
  }

  protected onGameReady(): void {
    this.showModeSelection(OmokSide.BLACK);
    this.setupEventListeners();
    this.setupInputHandler();
    this.setupRematchCallbacks();
  }

  protected initManagers(): void {
    this.flow = new OmokGameFlowManager(this);
    
    const network = this.createNetworkManager();
    const omok = this.createOmokManager();

    this.managers = {
      network,
      ai: new OmokAIManager(),
      ui: new OmokUIManager(this),
      onlineUI: new BaseOnlineUIManager(this, OMOK_CONFIG.UI_CONFIG),
      omok,
      board: new OmokBoardManager(this, omok),
      room: this.createRoomManager(network),
      abortDialog: new OmokGameAbortedDialog(this),
      aiHandler: new AiGameOverHandler(this, "omok"),
    };
  }

  // =====================================================================
  // 매니저 팩토리 메서드
  // =====================================================================

  private createNetworkManager(): OmokNetworkManager {
    const callbacks: GameNetworkCallbacks<OmokMoveData, OmokSideType> = {
      onWaiting: (message) => this.handleWaitingForMatch(message),
      onRoleAssigned: (role, roomId) => this.handleRoleAssignment(role, roomId),
      onOpponentAction: (action) => this.handleOpponentMove(action),
      onGameOver: (winner) => this.handleGameEnd?.(winner),
      onWin: (winner) => this.handleGameEnd?.(winner),
    };
    return new OmokNetworkManager(callbacks);
  }

  private createOmokManager(): OmokManager {
    const { SIZE } = OMOK_CONFIG.BOARD_STYLE.BOARD;
    return new OmokManager(this, SIZE, {
      onWin: (winner) => this.handleGameEnd(winner),
      onMove: (point: Point, side, moveNumber) =>
        this.managers.board.renderStoneAtGrid(point, side, moveNumber),
      onForbidden: (reason) => this.managers.ui.showForbiddenMessage(reason),
    });
  }

  private createRoomManager(network: OmokNetworkManager): OmokRoomManager {
    const socket = network.getSocket();
    const manager = new OmokRoomManager(this, socket);

    manager.setOnError((message) => {
      this.managers.ui!.showForbiddenMessage(message);
    });

    manager.setOnGameAborted((reason, leavingPlayer) => {
      this.handleGameAborted(reason, leavingPlayer);
    });

    manager.setOnGameStart(() => {
      console.log("[OmokScene] 게임 시작 이벤트 수신");
      this.waitForSideAssignmentAndStart(0);
    });

    return manager;
  }

  private waitForSideAssignmentAndStart(attempts: number): void {
    if (this.flow.onlineState.isSideAssigned) {
      this.startOnlineGame();
    } else if (attempts < 5) {
      this.time.delayedCall(100, () => this.waitForSideAssignmentAndStart(attempts + 1));
    } else {
      console.error("[OmokScene] 색상 할당 실패로 게임을 시작할 수 없습니다.");
    }
  }

  // =====================================================================
  // 메뉴 UI
  // =====================================================================

  private showModeSelection(mySide: OmokSideType): void {
    this.managers.ui.showModeSelection((mode) => {
      switch (mode) {
        case OmokMode.SINGLE:
          this.startSingleGame(mySide);
          break;
        case OmokMode.LOCAL:
          this.startLocalGame(mode, mySide);
          break;
        case OmokMode.ONLINE:
          this.showOnlineMenu();
          break;
        default:
          this.exitToMainScene();
      }
    });
  }

  private showOnlineMenu(): void {
    this.flow.gameState.mode = OmokMode.ONLINE;
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

  private async startQuickMatch(): Promise<void> {
    if (!this.managers.network!.isConnected()) {
      this.managers.ui!.showForbiddenMessage("서버 연결 실패. 다시 시도해주세요.");
      return;
    }

    this.managers.onlineUI!.hideOnlineMenu();

    try {
      await this.managers.network!.joinMatch();
      this.managers.ui!.showWaitingMessage("빠른 매칭 중...");
    } catch (error) {
      console.error("[오목] 빠른 매칭 실패:", error);
      this.managers.ui!.showForbiddenMessage("매칭 요청 실패. 다시 시도해주세요.");
    }
  }

  private showCreateRoomDialog(): void {
    this.events.emit(RoomUIEvent.CREATE_ROOM);
  }

  private showRoomList(): void {
    this.managers.room!.requestRoomList();
    this.managers.room!.renderRoomList();
  }

  // =====================================================================
  // 게임 시작
  // =====================================================================

  private startLocalGame(mode: OmokMode, mySide: OmokSideType): void {
    const firstTurn = this.flow.startLocalGame(mode, mySide);
    this.setupGame(mode, mySide, firstTurn);
  }

  private startSingleGame(mySide: OmokSideType): void {
    const firstTurn = this.flow.startSingleGame(mySide);
    this.setupGame(OmokMode.SINGLE, mySide, firstTurn);

    if (mySide === OmokSide.WHITE) {
      this.executeAiTurn();
    }
  }

  private startOnlineGame(): void {
    if (!this.flow.canStartOnlineGame()) {
      console.warn("[OmokScene] 시작 조건 미충족");
      return;
    }

    this.managers.room!.cleanup();
    this.setupGame(OmokMode.ONLINE, this.flow.mySide, OmokSide.BLACK);
  }

  private setupGame(mode: OmokMode, mySide: OmokSideType, firstTurn: OmokSideType): void {
    if (mode === OmokMode.ONLINE) {
      this.managers.room!.cleanup();
    }

    this.flow.setupGame(mode, mySide, firstTurn);
    this.managers.omok!.resetGame();
    this.managers.board!.clear();
    this.managers.board!.renderBoard();
    this.managers.ui!.createPlayerProfiles(mode, mySide);
    this.managers.ui!.updateTurnUI(this.flow.getCurrentTurn());
    this.managers.board!.updateForbiddenMarkers(this.flow.getCurrentTurn(), true);
  }

  // =====================================================================
  // 네트워크 이벤트 핸들러
  // =====================================================================

  private handleWaitingForMatch(message: string): void {
    console.log("[OmokScene] 매칭 대기:", message);
    this.managers.ui!.showWaitingMessage(message);
  }

  private handleRoleAssignment(side: OmokSideType, roomId?: string): void {
    console.log("[OmokScene] 색깔 할당:", side, roomId);
    this.flow.handleRoleAssignment(side, roomId);

    if (roomId) {
      this.managers.network!.setRoomId(roomId);
    }

    const sideName = side === OmokSide.BLACK ? "흑돌 (선공)" : "백돌 (후공)";
    this.managers.ui!.showWaitingMessage(`당신은 ${sideName}입니다!`);
  }

  private handleOpponentMove(action: OmokMoveData): void {
    if (!this.flow.isOnlineMode) return;

    const point: Point = { row: action.row, col: action.col };
    const success = this.managers.omok!.placeStone(point, action.side);

    if (success) {
      this.managers.board!.renderStoneAtGrid(point, action.side, action.moveNumber ?? 0);
      this.advanceGameStep(point);
    } else {
      console.error("[오목] 상대방의 유효하지 않은 수:", action);
    }
  }

  private handleGameAborted(reason: string, leavingPlayer: string): void {
    this.flow.endGame();
    this.showGameAbortedDialog(reason, leavingPlayer);
  }

  // =====================================================================
  // 게임 종료
  // =====================================================================

  protected handleGameEnd(winner: OmokSideType): void {
    if (!this.flow.isGameStarted) return;

    this.flow.endGame();
    this.managers.board!.displayMoveSequence();

    if (this.flow.isOnlineMode) {
      console.log(`[OmokScene] 게임 종료 - 승자: ${winner}`);
      this.managers.network!.notifyGameOver(winner);
    } else if (this.flow.isSingleMode) {
      this.managers.aiHandler.handle(winner);
    }

    const winnerName = this.flow.getWinnerName(winner);
    this.managers.ui!.showEndGameUI(
      winnerName,
      () => this.restartGame(),
      () => this.returnToModeSelection()
    );
  }

  private showGameAbortedDialog(reason: string, leavingPlayer: string): void {
    this.managers.room!.cleanup();
    this.managers.ui!.clear();
    this.managers.abortDialog!.show(reason, leavingPlayer, () => this.exitToMainMenu());
  }

  // =====================================================================
  // 입력 처리
  // =====================================================================

  private setupInputHandler(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handlePlayerInput(pointer);
    });
  }

  private handlePlayerInput(pointer: Phaser.Input.Pointer): void {
    if (!this.isInputValid()) return;

    const point = this.managers.board!.getGridIndex({ x: pointer.x, y: pointer.y });
    if (!this.flow.isValidPosition(point)) return;
    if (!this.checkForbiddenMove(point.row, point.col)) return;

    const currentMoveNumber = this.managers.omok!.getGameState().moves.length + 1;
    this.placeStoneAndAdvance(point, currentMoveNumber);
  }

  private isInputValid(): boolean {
    if (!this.flow.canAcceptInput(this.managers.ai!.isAiThinking())) {
      return false;
    }

    if (this.flow.isOnlineMode) {
      const result = this.flow.canPlayOnlineTurn();
      if (!result.can) {
        this.managers.ui!.showForbiddenMessage(result.message!);
        return false;
      }
    }

    return true;
  }

  private checkForbiddenMove(row: number, col: number): boolean {
    const forbiddenCheck = this.managers.omok!.checkForbidden(
      { row, col },
      this.flow.getCurrentTurn()
    );

    if (!forbiddenCheck.can) {
      this.cameras.main.shake(200, 0.005);
      return false;
    }

    return true;
  }

  private placeStoneAndAdvance(point: Point, moveNumber: number): void {
    const currentTurn = this.flow.getCurrentTurn();
    
    if (this.managers.omok!.placeStone(point, currentTurn)) {
      this.managers.board!.renderStoneAtGrid(point, currentTurn, moveNumber);

      if (this.flow.isOnlineMode) {
        this.managers.network!.sendMove(point, this.flow.mySide);
      }

      this.advanceGameStep(point);
    }
  }

  // =====================================================================
  // 게임 진행
  // =====================================================================

  private advanceGameStep(point: Point): void {
    const currentTurn = this.flow.getCurrentTurn();
    
    if (this.managers.omok!.checkWin(point, currentTurn)) {
      this.handleGameEnd(currentTurn);
      return;
    }

    this.flow.switchTurn();
    this.managers.ui!.updateTurnUI(this.flow.getCurrentTurn());
    this.managers.board!.updateForbiddenMarkers(this.flow.getCurrentTurn(), this.flow.isGameStarted);

    if (this.flow.shouldExecuteAiTurn()) {
      this.executeAiTurn();
    }
  }

  // =====================================================================
  // AI 로직
  // =====================================================================

  private executeAiTurn(): void {
    if (!this.flow.isGameStarted || this.managers.ai!.isAiThinking()) {
      return;
    }

    const currentTurn = this.flow.getCurrentTurn();
    const threats = this.managers.omok!.getThreats(currentTurn);
    const board = this.managers.omok!.board;

    this.managers.ai!.executeAiTurn(
      board,
      threats || [],
      undefined,
      (row, col) => this.flow.isValidPosition({ row, col }),
      (result) => this.handleAiTurnResult(result, currentTurn)
    );
  }

  private handleAiTurnResult(
    result: { success: boolean; move: Point | null },
    currentTurn: OmokSideType
  ): void {
    if (!this.flow.isGameStarted) return;

    if (!result.success || !result.move || result.move.row === -1) {
      console.error("[AI] 유효한 수를 찾지 못함");
      return;
    }

    const movePoint = result.move;
    const nextMoveNumber = this.managers.omok!.getGameState().moves.length + 1;

    if (this.managers.omok!.placeStone(movePoint, currentTurn)) {
      this.managers.board!.renderStoneAtGrid(movePoint, currentTurn, nextMoveNumber);
      this.advanceGameStep(movePoint);
    }
  }

  // =====================================================================
  // 재대결 (Rematch)
  // =====================================================================

  protected setupRematchCallbacks(): void {
    console.log("[OmokScene] 재대결 콜백 등록");

    this.managers.room.setOnRematchRequested((requester) => {
      this.handleRematchRequest(requester);
    });

    this.managers.room.setOnRematchAccepted((accepter) => {
      console.log(`[OmokScene] ${accepter}님이 재대결 수락`);
      this.managers.ui?.showWaitingMessage("게임을 시작합니다...");
    });

    this.managers.room.setOnRematchDeclined((decliner) => {
      console.log(`[OmokScene] ${decliner}님이 재대결 거절`);
      alert(`${decliner}님이 재대결을 거절했습니다.`);
      this.managers.ui?.clear();
      this.showOnlineMenu();
    });

    this.managers.room.setOnRematchStart(() => {
      console.log("[OmokScene] 재대결 시작!");
      this.handleRematchStart();
    });
  }

  private handleRematchRequest(requester: string): void {
    setTimeout(() => {
      const result = window.confirm(
        `${requester}님이 재대결을 요청했습니다.\n수락하시겠습니까?`
      );

      const rawId = this.flow.currentRoomId || this.managers.network?.getRoomId();
      const roomId = rawId ?? undefined;

      if (result) {
        console.log("[OmokScene] 재대결 수락");
        this.managers.room.acceptRematch(roomId);
      } else {
        console.log("[OmokScene] 재대결 거절");
        this.managers.room.declineRematch(roomId);
      }
    }, 100);
  }

  private handleRematchStart(): void {
    console.log("[OmokScene] 재대결 시작!");
    this.resetAllManagers();
    this.managers.board?.renderBoard();
    this.flow.resetForRestart();
    this.managers.ui?.clear();
  }

  // =====================================================================
  // 재시작 및 네비게이션
  // =====================================================================

  protected restartGame(): void {
    const mode = this.flow.gameState.mode;

    if (mode === OmokMode.ONLINE) {
      console.log("[OmokScene] 재대결 요청 전송");
      this.restartOnlineGame();
      this.managers.ui!.showWaitingMessage("상대방의 응답을 기다리는 중...");
    } else if (mode === OmokMode.SINGLE) {
      const mySide = this.flow.gameState.userSide || OmokSide.BLACK;
      this.resetAllManagers();
      this.managers.board?.renderBoard();
      this.flow.resetForRestart();
      this.startSingleGame(mySide);
    } else if (mode === OmokMode.LOCAL) {
      const mySide = this.flow.gameState.userSide || OmokSide.BLACK;
      this.resetAllManagers();
      this.managers.board?.renderBoard();
      this.flow.resetForRestart();
      this.startLocalGame(mode, mySide);
    }
  }

  protected restartOnlineGame(): void {
    const roomId = this.flow.currentRoomId || this.managers.network?.getRoomId();

    if (!roomId) {
      console.warn("[OmokScene] 방 ID 없음 - 온라인 메뉴로");
      this.showOnlineMenu();
      return;
    }

    console.log(`[OmokScene] 재대결 요청: ${roomId}`);
    this.managers.ui?.clear();
    this.managers.room?.requestRematch(roomId);
    this.managers.ui?.showWaitingMessage("상대방의 응답을 기다리는 중...");
  }

  private returnToModeSelection(): void {
    this.resetAllManagers();
    this.flow.resetAllState();
    this.scene.restart();
  }

  private exitToMainScene(): void {
    this.scene.start("MainScene");
  }

  private exitToMainMenu(): void {
    this.resetAllManagers();
    this.exitToMainScene();
  }

  private resetAllManagers(): void {
    this.managers.board?.clear();
    this.managers.ui?.clear();
    this.managers.omok?.resetGame();
    this.managers.room?.cleanup();
    this.managers.ai?.cleanup();
  }

  // =====================================================================
  // 이벤트 리스너 및 생명주기
  // =====================================================================

  private setupEventListeners(): void {
    this.events.on("room:exit", () => {
      console.log("[OmokScene] room:exit 이벤트 받음 - 온라인 메뉴 표시");
      this.showOnlineMenu();
    });
  }

  public get myColor(): number {
    return this.flow.mySide;
  }

  shutdown(): void {
    this.managers.abortDialog?.clear();
    this.managers.network?.cleanup();
    this.managers.onlineUI?.cleanup();
    this.managers.room?.cleanup();
    this.managers.ai?.cleanup();
    super.shutdown();
  }
}
