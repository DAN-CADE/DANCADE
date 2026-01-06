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
import { OMOK_CONFIG } from "@/game/types/omok/omok.constants";
import { GameNetworkCallbacks } from "@/game/types/multiplayer/network.types";
import { gameState, onlineState } from "@/game/types/omok/omok.types";
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
  // =====================================================================

  private gameState: gameState = {
    isStarted: false,
    currentTurn: OmokSide.BLACK,
    mode: OmokMode.NONE,
    userSide: OmokSide.BLACK,
  };

  private onlineState: onlineState = {
    mySide: OmokSide.NONE as OmokSideType,
    isSideAssigned: false,
    currentRoomId: null as string | null,
  };

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
  // =====================================================================

  // BaseGameScene 필수 구현
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

    this.managers.room.setOnRematchRequested((requester) => {
      this.handleRematchRequest(requester);
    });

    this.managers.room.setOnRematchAccepted((accepter) => {
      console.log(`${accepter}님이 재대결을 수락했습니다.`);
    });

    this.managers.room.setOnRematchDeclined((decliner) => {
      alert(`${decliner}님이 재대결을 거절했습니다.`);
      this.showOnlineMenu();
    });

    this.managers.room.setOnRematchStart(() => {
      this.handleRematchStart();
    });
  }

  // =====================================================================
  // =====================================================================

  protected initManagers(): void {
    const network = this.createNetworkManager();
    const omok = this.createOmokManager();

    this.managers = {
      network: network,
      ai: new OmokAIManager(),
      ui: new OmokUIManager(this),
      onlineUI: new BaseOnlineUIManager(this, OMOK_CONFIG.UI_CONFIG),
      omok: omok,
      board: new OmokBoardManager(this, omok),
      room: this.createRoomManager(network),
      abortDialog: new OmokGameAbortedDialog(this),
      aiHandler: new AiGameOverHandler(this, "omok"),
    };

    // this.setupNetworkListeners();
    // this.setupRoomCallbacks();
    this.setupRematchCallbacks();
  }

  // =====================================================================
  // =====================================================================

  // 네트워크 통신을 담당하고 있는 OmokNetworkManager 생성하고 초기화
  // 서버와의 소켓 통신(매칭, 상대방 수 수신 등)에 필요한 콜백들을 정의
  private createNetworkManager(): OmokNetworkManager {
    // 서버 이벤트가 발생했을 때 Scene에서 실행할 행동 정의
    const callbacks: GameNetworkCallbacks<OmokMoveData, OmokSideType> = {
      // 서버로부터 매칭 대기 메시지를 받았을 때
      onWaiting: (message) => this.handleWaitingForMatch(message),

      // 서버에서 방 번호와 내 역할(흑/백)을 할당받았을 때
      onRoleAssigned: (role, roomId) => this.handleRoleAssignment(role, roomId),

      // 상대방이 돌을 두어 서버가 좌표 데이터를 보내줬을 때
      onOpponentAction: (action) => this.handleOpponentMove(action),

      // 게임 종료 또는 승리 판정 결과가 서버로부터 왔을 때
      onGameOver: (winner) => this.handleGameEnd?.(winner),
      onWin: (winner) => this.handleGameEnd?.(winner),
    };

    // 정의된 콜백을 들고 있는 네트워크 매니저를 생성하여 반환함
    const manager = new OmokNetworkManager(callbacks);
    return manager;
  }

  // 게임의 핵심 룰을 담당하는 OmokManager 생성
  // 오목판 상태 관리 및 승패 로직에 필요한 콜백 정의
  private createOmokManager(): OmokManager {
    // 오목판 사이즈 가져옴
    const { SIZE } = OMOK_CONFIG.BOARD_STYLE.BOARD;

    // OmokManager에 전달할 콜백과 함께 인스턴스 생성
    return new OmokManager(this, SIZE, {
      // 매니저가 승리 조건을 만족하는 수를 발견했을 때
      onWin: (winner) => this.handleGameEnd(winner),

      // 유효한 위치에 돌이 놓였을 때, 실제로 오목판에 돌을 렌더링하도록
      onMove: (point: Point, side, moveNumber) =>
        this.managers.board.renderStoneAtGrid(point, side, moveNumber),

      // 흑돌 3-3 등 금수 규칙에 어긋났을 때 UI 매니저를 통해 경고 메시지 표시
      onForbidden: (reason) => this.managers.ui.showForbiddenMessage(reason),
    });
  }

  private createRoomManager(network: OmokNetworkManager): OmokRoomManager {
    // 얘는 BaseNetworkManager의 getSocket 메서드를 사용할 수 있습니다
    // (OmokNetworkManager -> BaseGameNetworkManager 상속,
    // BaseGameNetworkManager -> BaseNetworkManager를 상속받아서)
    // 그래서 네트워크 매니저에 소켓을 받고,
    const socket = network.getSocket();
    // 소켓을 넘겨주며 roomManager 생성
    const manager = new OmokRoomManager(this, socket);

    // 부모 BaseRoomManager의 setOnError, setOnGameAborted, setOnGameStart를 호출
    manager.setOnError((message) => {
      this.managers.ui!.showForbiddenMessage(message);
    });

    manager.setOnGameAborted((reason, leavingPlayer) => {
      this.handleGameAborted(reason, leavingPlayer);
    });

    manager.setOnGameStart(() => {
      console.log("[OmokScene] 게임 시작 이벤트 수신");

      // 색상이 할당될 때까지 최대 0.5초간 체크하며 대기 (재귀적 체크)
      const checkAndStart = (attempts: number) => {
        if (this.onlineState.isSideAssigned) {
          this.startOnlineGame();
        } else if (attempts < 5) {
          // 아직 할당 전이면 100ms 뒤에 다시 시도
          this.time.delayedCall(100, () => checkAndStart(attempts + 1));
        } else {
          console.error(
            "[OmokScene] 색상 할당 실패로 게임을 시작할 수 없습니다."
          );
        }
      };

      checkAndStart(0);
    });

    return manager;
  }

  // =====================================================================
  // =====================================================================

  // 메뉴 모드 선택 (싱글 / 로컬 / 온라인 / 나가기)
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

  // =====================================================================
  // =====================================================================

  // BaseOnlineUIManager의 showOnlineMenu에 가 실행됨
  // (각 콜백 함수 -> showOnlineMenu(options: OnlineMenuOptions) 에서
  // options로 들어감)
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

  private async startQuickMatch(): Promise<void> {
    // BaseNetworkManager의 isConnected 메서드 실행하여 소켓 연결 됐는지 확인
    if (!this.managers.network!.isConnected()) {
      this.managers.ui!.showForbiddenMessage(
        "서버 연결 실패. 다시 시도해주세요."
      );
      return;
    }

    // 온라인 메뉴 숨기기
    this.managers.onlineUI!.hideOnlineMenu();

    // 비동기 매칭 요청 및 결과 피드백
    // OmokUIManager 내 showWaitingMessage, showForbiddenMessage 실행
    // 다시 OmokMessageRenderer에서 메세지를 받아 생성
    // => Scene -> OmokUIManager -> OmokMessageRenderer
    try {
      // 서버에 매칭 패킷 전송
      // BaseGameNetworkManager의 joinMatch 실행
      await this.managers.network!.joinMatch();

      // 성공 시 대기 메시지 표시
      this.managers.ui!.showWaitingMessage("빠른 매칭 중...");
    } catch (error) {
      console.error("[오목] 빠른 매칭 실패:", error);

      // 실패 시 경고 메시지 표시
      this.managers.ui!.showForbiddenMessage(
        "매칭 요청 실패. 다시 시도해주세요."
      );
    }
  }

  // 방 만들기
  private showCreateRoomDialog(): void {
    // this.managers.onlineUI!.hideOnlineMenu();
    this.events.emit(RoomUIEvent.CREATE_ROOM);
  }

  private showRoomList(): void {
    // this.managers.onlineUI!.hideOnlineMenu();

    // 데이터 요청: NetworkManager를 통해 서버에 최신 방 목록 패킷 송신 (gamePrefix: "omok" 사용)
    this.managers.room!.requestRoomList();

    // NetworkManager가 보유한 현재 방 리스트(RoomData[])를 가져옴
    // UI Manager에게 전달하여 실제 캔버스에 방 리스트를 생성
    this.managers.room!.renderRoomList();
  }

  // 모드 선택 (뒤로가기)
  private returnToModeSelection(): void {
    this.resetAllManagers();

    this.onlineState.mySide = OmokSide.NONE;
    this.onlineState.isSideAssigned = false;
    this.onlineState.currentRoomId = null;

    this.gameState.mode = OmokMode.NONE;
    this.gameState.isStarted = false;
    this.gameState.currentTurn = OmokSide.BLACK;

    this.scene.restart();
  }

  private exitToMainScene(): void {
    this.scene.start("MainScene");
  }

  private exitToMainMenu(): void {
    this.resetAllManagers();
    this.exitToMainScene();
  }

  // =====================================================================
  // =====================================================================

  private startLocalGame(mode: OmokMode, mySide: OmokSideType): void {
    const firstTurn = Math.random() < 0.5 ? OmokSide.BLACK : OmokSide.WHITE;
    this.setupGame(mode, mySide, firstTurn);
  }

  private startSingleGame(mySide: OmokSideType): void {
    this.setupGame(OmokMode.SINGLE, mySide, OmokSide.BLACK);

    // 내가 백이면 AI가 바로 시작
    if (mySide === OmokSide.WHITE) {
      this.executeAiTurn();
    }
  }

  private startOnlineGame(): void {
    if (!this.onlineState.isSideAssigned || this.gameState.isStarted) {
      console.warn("[OmokScene] 시작 조건 미충족");
      return;
    }

    this.managers.room!.cleanup();
    this.setupGame(OmokMode.ONLINE, this.onlineState.mySide, OmokSide.BLACK);
  }

  // =====================================================================
  // =====================================================================

  private handleWaitingForMatch(message: string) {
    console.log("[OmokScene] 매칭 대기:", message);
    this.managers.ui!.showWaitingMessage(message);
  }

  private handleRoleAssignment(side: OmokSideType, roomId?: string) {
    console.log("[OmokScene] 색깔 할당:", side, roomId);

    this.onlineState.mySide = side;
    this.onlineState.isSideAssigned = true;

    if (roomId) {
      this.managers.network!.setRoomId(roomId);
    }

    const sideName = side === OmokSide.BLACK ? "흑돌 (선공)" : "백돌 (후공)";
    this.managers.ui!.showWaitingMessage(`당신은 ${sideName}입니다!`);

    // this.time.delayedCall(1000, () => {
    //   this.managers.ui!.clear();
    //   if (this.onlineState.isSideAssigned && !this.gameState.isStarted) {
    //     this.startOnlineGame();
    //   }
    // });
  }

  private handleOpponentMove(action: OmokMoveData) {
    if (this.gameState.mode !== OmokMode.ONLINE) return;

    // 좌표를 Point 객체로 생성
    const point: Point = { row: action.row, col: action.col };

    // 돌 놓기
    const success = this.managers.omok!.placeStone(point, action.side);

    if (success) {
      // 화면에 돌 렌더링 (생성한 point 객체 전달)
      this.managers.board!.renderStoneAtGrid(
        point,
        action.side,
        action.moveNumber ?? 0
      );

      this.advanceGameStep(point);
    } else {
      console.error("[오목] 상대방의 유효하지 않은 수:", action);
    }
  }

  // private handleGameStart() {}

  private handleGameAborted(reason: string, leavingPlayer: string): void {
    this.gameState.isStarted = false;
    this.showGameAbortedDialog(reason, leavingPlayer);
  }

  protected handleGameEnd(winner: OmokSideType) {
    if (!this.gameState.isStarted) return;

    this.gameState.isStarted = false;

    // 종료 후 수순 보여주기
    this.managers.board!.displayMoveSequence();

    if (this.gameState.mode === OmokMode.ONLINE) {
      console.log(`[OmokScene] 게임 종료 - 승자: ${winner}`);
      this.managers.network!.notifyGameOver(winner);
    } else if (this.gameState.mode === OmokMode.SINGLE) {
      this.managers.aiHandler.handle(winner);
    }

    const winnerName = this.getWinnerName(winner);

    this.managers.ui!.showEndGameUI(
      winnerName,
      () => this.restartGame(),
      () => this.returnToModeSelection()
    );
  }

  private getWinnerName(winner: number): string {
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

  // =====================================================================
  // =====================================================================

  protected setupRematchCallbacks(): void {
    console.log("[OmokScene] 재대결 콜백 등록");

    // 1. 재대결 요청 받음
    // 1. 재대결 요청 받음 (상대방 화면)
    this.managers.room.setOnRematchRequested((requester) => {
      this.handleRematchRequest(requester);
    });

    // 2. 상대방이 수락함
    this.managers.room.setOnRematchAccepted((accepter) => {
      console.log(`[OmokScene] ${accepter}님이 재대결 수락`);
      this.managers.ui?.showWaitingMessage("게임을 시작합니다...");
    });

    // 3. 상대방이 거절함
    this.managers.room.setOnRematchDeclined((decliner) => {
      console.log(`[OmokScene] ${decliner}님이 재대결 거절`);
      alert(`${decliner}님이 재대결을 거절했습니다.`);

      // UI 정리하고 온라인 메뉴로
      this.managers.ui?.clear();
      this.showOnlineMenu();
    });

    // 4. 재대결 시작 (양쪽 모두 수락)
    this.managers.room.setOnRematchStart(() => {
      console.log("[OmokScene] 재대결 시작!");
      this.handleRematchStart();
    });
  }

  private handleRematchRequest(requester: string): void {
    // 1. 렌더링 루프 방해 방지 및 동기적 confirm 호출을 위한 지연
    setTimeout(() => {
      const result = window.confirm(
        `${requester}님이 재대결을 요청했습니다.\n수락하시겠습니까?`
      );

      // 2. ID 확보 및 타입 변환 (null -> undefined)
      const rawId =
        this.onlineState.currentRoomId || this.managers.network?.getRoomId();
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

    // 게임 상태 초기화
    this.resetAllManagers();
    this.managers.board?.renderBoard();

    this.gameState.isStarted = false;
    this.gameState.currentTurn = OmokSide.BLACK;

    // UI 정리
    this.managers.ui?.clear();
  }

  // =====================================================================
  // =====================================================================

  // 클릭된 위치(x, y) 좌표가 pointer 객체에 담기고
  // 그걸 handlePlayerInput에 넘김
  private setupInputHandler(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handlePlayerInput(pointer);
    });
  }

  private handlePlayerInput(pointer: Phaser.Input.Pointer): void {
    if (!this.isInputValid()) return;

    // 인자 전달 방식 확인 (객체 형태 {x, y})
    const point = this.managers.board!.getGridIndex({
      x: pointer.x,
      y: pointer.y,
    });

    if (!this.isValidPosition(point)) return;
    if (!this.checkForbiddenMove(point.row, point.col)) return;

    // 현재 수(moveNumber) 계산
    const currentMoveNumber =
      this.managers.omok!.getGameState().moves.length + 1;

    // 인자 개수 맞춰서 호출
    this.placeStoneAndAdvance(point, currentMoveNumber);
  }

  private isInputValid(): boolean {
    // 게임이 시작되지 않았거나 AI가 생각중일 때
    if (!this.canAcceptInput()) {
      return false;
    }

    // 온라인 전용:
    if (this.gameState.mode === OmokMode.ONLINE && !this.canPlayOnlineTurn()) {
      return false;
    }

    return true;
  }

  private canAcceptInput(): boolean {
    return this.gameState.isStarted && !this.managers.ai!.isAiThinking();
  }

  private canPlayOnlineTurn(): boolean {
    if (!this.onlineState.isSideAssigned) {
      this.managers.ui!.showForbiddenMessage("색깔 할당 대기 중...");
      return false;
    }

    if (this.gameState.currentTurn !== this.onlineState.mySide) {
      this.managers.ui!.showForbiddenMessage("상대방의 턴입니다.");
      return false;
    }

    return true;
  }

  // =====================================================================
  // =====================================================================

  private isValidPosition(point: Point): boolean {
    const { row, col } = point;
    return (
      row >= 0 &&
      row < OMOK_CONFIG.BOARD_STYLE.BOARD.SIZE &&
      col >= 0 &&
      col < OMOK_CONFIG.BOARD_STYLE.BOARD.SIZE
    );
  }

  private checkForbiddenMove(row: number, col: number): boolean {
    const forbiddenCheck = this.managers.omok!.checkForbidden(
      { row, col },
      this.gameState.currentTurn
    );

    if (!forbiddenCheck.can) {
      this.cameras.main.shake(200, 0.005);
      return false;
    }

    return true;
  }

  private placeStoneAndAdvance(point: Point, moveNumber: number): void {
    if (this.managers.omok!.placeStone(point, this.gameState.currentTurn)) {
      this.managers.board!.renderStoneAtGrid(
        point,
        this.gameState.currentTurn,
        moveNumber
      );

      if (this.gameState.mode === OmokMode.ONLINE) {
        this.managers.network!.sendMove(point, this.onlineState.mySide);
      }

      this.advanceGameStep(point);
    }
  }

  // =====================================================================
  // =====================================================================

  private advanceGameStep(point: Point): void {
    if (this.managers.omok!.checkWin(point, this.gameState.currentTurn)) {
      this.handleGameEnd(this.gameState.currentTurn);
      return;
    }

    this.switchTurn();

    if (this.shouldExecuteAiTurn()) {
      this.executeAiTurn();
    }
  }

  private switchTurn(): void {
    this.gameState.currentTurn = this.gameState.currentTurn === 1 ? 2 : 1;

    this.managers.ui!.updateTurnUI(this.gameState.currentTurn);
    this.managers.board!.updateForbiddenMarkers(
      this.gameState.currentTurn,
      this.gameState.isStarted
    );
  }

  // =====================================================================
  // =====================================================================

  private shouldExecuteAiTurn(): boolean {
    return (
      this.gameState.mode === OmokMode.SINGLE &&
      this.gameState.currentTurn === OmokSide.WHITE
    );
  }

  private executeAiTurn(): void {
    if (!this.gameState.isStarted || this.managers.ai!.isAiThinking()) {
      return;
    }

    const currentTurn = this.gameState.currentTurn;
    const threats = this.managers.omok!.getThreats(currentTurn);
    const board = this.managers.omok!.board;
    const lastMove = undefined;

    this.managers.ai!.executeAiTurn(
      board,
      threats || [],
      lastMove,
      (row, col) => this.isValidPosition({ row, col }),
      (result) => this.handleAiTurnResult(result, currentTurn)
    );
  }

  private handleAiTurnResult(
    result: { success: boolean; move: Point | null },
    currentTurn: OmokSideType
  ): void {
    if (!this.gameState.isStarted) return;

    // AI가 수를 찾지 못한 경우 예외 처리
    if (!result.success || !result.move || result.move.row === -1) {
      console.error("[AI] 유효한 수를 찾지 못함");
      return;
    }

    // AI가 결정한 좌표 (이미 {row, col} 형태)
    const movePoint = result.move;

    // 현재 수(moveNumber) 계산
    const nextMoveNumber = this.managers.omok!.getGameState().moves.length + 1;

    // 로직상 돌 놓기
    if (this.managers.omok!.placeStone(movePoint, currentTurn)) {
      // 화면에 돌 그리기
      this.managers.board!.renderStoneAtGrid(
        movePoint,
        currentTurn,
        nextMoveNumber
      );

      this.advanceGameStep(movePoint);
    }
  }

  // =====================================================================
  // =====================================================================

  private showGameAbortedDialog(reason: string, leavingPlayer: string): void {
    this.managers.room!.cleanup();
    this.managers.ui!.clear();

    this.managers.abortDialog!.show(reason, leavingPlayer, () => {
      this.exitToMainMenu();
    });
  }

  // =====================================================================
  // =====================================================================

  public get myColor(): number {
    return this.onlineState.mySide;
  }

  // =====================================================================
  // =====================================================================

  // protected restartGame(): void {
  //   const mode = this.gameState.mode;
  //   const mySide = this.onlineState.mySide || OmokSide.BLACK;

  //   this.resetAllManagers();
  //   this.managers.board?.renderBoard();

  //   this.gameState.isStarted = false;
  //   this.gameState.currentTurn = 1;

  //   if (mode === OmokMode.ONLINE) {
  //     this.onlineState.mySide = 0;
  //     this.onlineState.isSideAssigned = false;
  //     // this.onlineState.currentRoomId = null;

  //     this.restartOnlineGame();
  //   }

  //   if (mode === OmokMode.SINGLE) {
  //     this.startSingleGame(mySide);
  //   } else if (mode === OmokMode.LOCAL) {
  //     this.startLocalGame(mode, mySide);
  //   } else if (mode === OmokMode.ONLINE) {
  //     // this.showOnlineMenu();
  //     this.startOnlineGame();
  //   } else {
  //     this.scene.restart();
  //   }
  // }
  protected restartGame(): void {
    const mode = this.gameState.mode;

    if (mode === OmokMode.ONLINE) {
      // 온라인 모드: 재대결 요청
      console.log("[OmokScene] 재대결 요청 전송");
      // this.managers.room.requestRematch();

      this.restartOnlineGame();

      // 대기 메시지 표시
      this.managers.ui!.showWaitingMessage("상대방의 응답을 기다리는 중...");
    } else if (mode === OmokMode.SINGLE) {
      // 싱글 모드
      const mySide = this.gameState.userSide || OmokSide.BLACK;
      this.resetAllManagers();
      this.managers.board?.renderBoard();
      this.gameState.isStarted = false;
      this.gameState.currentTurn = 1;
      this.startSingleGame(mySide);
    } else if (mode === OmokMode.LOCAL) {
      // 로컬 모드
      const mySide = this.gameState.userSide || OmokSide.BLACK;
      this.resetAllManagers();
      this.managers.board?.renderBoard();
      this.gameState.isStarted = false;
      this.gameState.currentTurn = 1;
      this.startLocalGame(mode, mySide);
    }
  }

  protected restartOnlineGame(): void {
    console.log("DEBUG: currentRoomId =", this.onlineState.currentRoomId);
    console.log(
      "DEBUG: NetworkManager Id =",
      this.managers.network?.getRoomId()
    );

    const roomId =
      this.onlineState.currentRoomId || this.managers.network?.getRoomId();

    if (!roomId) {
      console.warn("[OmokScene] 방 ID 없음 - 온라인 메뉴로");
      this.showOnlineMenu();
      return;
    }

    console.log(`[OmokScene] 재대결 요청: ${roomId}`);

    // ✅ UI 먼저 정리
    this.managers.ui?.clear();

    // 재대결 요청
    this.managers.room?.requestRematch(roomId);

    // 대기 메시지 표시 (온라인 메뉴 대신)
    this.managers.ui?.showWaitingMessage("상대방의 응답을 기다리는 중...");
  }

  private resetAllManagers(): void {
    this.managers.board?.clear();
    this.managers.ui?.clear();
    this.managers.omok?.resetGame();
    this.managers.room?.cleanup();
    this.managers.ai?.cleanup();
  }

  // =====================================================================
  // =====================================================================

  private setupGame(
    mode: OmokMode,
    mySide: OmokSideType,
    firstTurn: OmokSideType
  ) {
    // 방 대기실 UI 정리 (BaseRoomManager의 cleanup 사용)
    if (mode === OmokMode.ONLINE) {
      this.managers.room!.cleanup();
    }

    // 게임 상태 설정
    this.gameState.mode = mode;
    this.gameState.currentTurn = firstTurn;
    this.gameState.isStarted = true;

    this.managers.omok!.resetGame();

    // 보드 초기화
    this.managers.board!.clear();
    this.managers.board!.renderBoard();

    // 게임 UI 생성 (OmokUIManager의 메서드들)
    this.managers.ui!.createPlayerProfiles(mode, mySide);
    this.managers.ui!.updateTurnUI(this.gameState.currentTurn);

    // 금수 마커 표시
    this.managers.board!.updateForbiddenMarkers(
      this.gameState.currentTurn,
      true
    );
  }

  private setupEventListeners(): void {
    // 방에서 나가기/뒤로가기 → 온라인 메뉴 표시
    this.events.on("room:exit", () => {
      console.log("[OmokScene] room:exit 이벤트 받음 - 온라인 메뉴 표시");
      this.showOnlineMenu();
    });
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
