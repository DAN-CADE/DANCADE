// game/scenes/OmokScene.ts
// ---------------------------------------------------------------------
// OmokManager (두뇌/규칙): 보드 배열 데이터 관리, 승리 판정, 금수(3-3 등) 체크, AI 위협 계산. (데이터와 로직 담당)
// OmokBoardManager (바둑판): 화면에 바둑판 선 그리기, 돌(Circle) 그리기, X 마커 그리기. (그래픽 담당)
// OmokUIManager (인터페이스): 승리 메시지, 모드 선택 버튼, 플레이어 프로필 UI. (사용자 UI 담당)
// OmokScene (총괄 지휘): 마우스 입력을 받아 매니저들에게 일을 시킴.
// ---------------------------------------------------------------------

import { BaseGameScene } from "@/game/scenes/base/BaseGameScene";
import { OmokManager } from "@/game/managers/games/Omok/OmokManager";
import { GptManager } from "@/game/managers/global/gpt/GptManager";
import { OMOK_CONFIG, OmokMode } from "@/game/types/realOmok";
import { OmokBoardManager } from "@/game/managers/games/Omok/OmokBoardManager";
import { OmokUIManager } from "@/game/managers/games/Omok/OmokUIManger";

export class OmokScene extends BaseGameScene {
  private isGameStarted = false;
  private isAiThinking = false; // AI 턴 중 중복 입력 방지
  private currentTurn = 1;
  private currentMode = OmokMode.NONE;

  private omokManager!: OmokManager;
  private gptManager!: GptManager;
  private boardManager!: OmokBoardManager;
  private uiManager!: OmokUIManager;

  constructor() {
    super("OmokScene");
  }

  // ----------------------- BaseGameScene 필수 구현

  protected loadAssets(): void {}

  protected initManagers(): void {
    this.gptManager = new GptManager();
    this.uiManager = new OmokUIManager(this);

    this.omokManager = new OmokManager(this, OMOK_CONFIG.BOARD_SIZE, {
      onWin: (winner) => this.handleGameEnd(winner),
      onMove: (row, col, color) =>
        this.boardManager.renderStone(row, col, color),
      onForbidden: (reason) => this.uiManager.showForbiddenMessage(reason),
    });

    this.boardManager = new OmokBoardManager(this, this.omokManager);
  }

  protected setupScene(): void {
    this.cameras.main.setBackgroundColor(OMOK_CONFIG.COLORS.BOARD);
  }

  protected createGameObjects(): void {
    this.boardManager.setGameObjects();
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) =>
      // p: Phaser.Input.Pointer -> 클릭한 위치 정보 (x, y 좌표)
      this.handleInput(p)
    );
  }

  protected onGameReady(): void {
    // 모드 선택 화면 표시
    this.uiManager.showModeSelection((mode) => this.startSelectedMode(mode));
  }

  // ----------------------- 핵심 게임 흐름

  private startSelectedMode(mode: OmokMode): void {
    this.currentMode = mode;
    this.currentTurn = Math.random() < 0.5 ? 1 : 2;
    this.isGameStarted = true;
    this.isAiThinking = false;

    this.uiManager.createPlayerProfiles(mode);
    this.uiManager.updateTurnUI(this.currentTurn);

    this.boardManager.updateForbiddenMarkers(
      this.currentTurn,
      this.isGameStarted
    );

    // AI가 선공이면 첫 수 두기
    if (this.currentMode === OmokMode.SINGLE && this.currentTurn === 2) {
      this.makeAiMove();
    }
  }

  private handleInput(pointer: Phaser.Input.Pointer): void {
    // 게임이 시작되지 않았거나 AI가 생각 중이면 무시
    if (!this.isGameStarted || this.isAiThinking) return;

    const { row, col } = this.boardManager.worldToGrid(pointer.x, pointer.y);

    // 보드 범위 체크
    if (
      row < 0 ||
      row >= OMOK_CONFIG.BOARD_SIZE ||
      col < 0 ||
      col >= OMOK_CONFIG.BOARD_SIZE
    ) {
      return;
    }

    // 금수 체크
    const check = this.omokManager.checkForbidden(row, col, this.currentTurn);
    if (!check.can) {
      this.uiManager.showForbiddenMessage(check.reason || "둘 수 없는 곳");
      this.cameras.main.shake(200, 0.005);
      return;
    }

    // 돌 놓기
    if (this.omokManager.placeStone(row, col, this.currentTurn)) {
      this.boardManager.renderStone(row, col, this.currentTurn);
      this.processGameStep(row, col);
    }
  }

  private processGameStep(row: number, col: number): void {
    // 승리 체크
    if (this.omokManager.checkWin(row, col, this.currentTurn)) {
      this.handleGameEnd(this.currentTurn);
      return;
    }

    // 턴 교대
    this.currentTurn = this.currentTurn === 1 ? 2 : 1;
    this.uiManager.updateTurnUI(this.currentTurn);
    this.boardManager.updateForbiddenMarkers(
      this.currentTurn,
      this.isGameStarted
    );

    // AI 턴이면 AI 수 두기
    if (this.currentMode === OmokMode.SINGLE && this.currentTurn === 2) {
      this.makeAiMove();
    }
  }

  protected handleGameEnd(winner: number): void {
    this.isGameStarted = false;
    this.isAiThinking = false;
    this.boardManager.showMoveNumbers();

    const winnerName =
      this.currentMode === OmokMode.SINGLE
        ? winner === 1
          ? "흑돌(나)"
          : "백돌(GPT)"
        : winner === 1
        ? "흑돌"
        : "백돌";

    this.uiManager.showEndGameUI(
      winnerName,
      () => {
        // 다시하기
        this.boardManager.resetGame();
        this.uiManager.resetGame();
        this.omokManager.resetGame();
        this.scene.restart();
      },
      () => {
        // 홈으로
        this.boardManager.resetGame();
        this.uiManager.resetGame();
        this.omokManager.resetGame();
        this.scene.start("MainScene");
      }
    );
  }

  private async makeAiMove(): Promise<void> {
    if (!this.isGameStarted || this.isAiThinking) return;

    this.isAiThinking = true; // AI 턴 시작
    const currentTurn = this.currentTurn;
    const currentThreats = this.omokManager.getThreats(currentTurn);

    try {
      // GPT에게 다음 수 요청
      const move = await this.omokManager.getNextMove(currentThreats || []);

      // 500ms 딜레이로 자연스러운 AI 턴 구현
      this.time.delayedCall(500, () => {
        // 게임이 종료되었으면 중단
        if (!this.isGameStarted) {
          this.isAiThinking = false;
          return;
        }

        // AI가 유효한 수를 반환하지 못한 경우
        if (!move || move.row === -1 || move.col === -1) {
          console.warn("[AI Warning] 유효한 수를 찾지 못해 랜덤 수를 둡니다.");
          this.makeRandomMove();
          this.isAiThinking = false;
          return;
        }

        const board = this.omokManager.getBoardState();
        let finalRow = move.row;
        let finalCol = move.col;

        // AI가 제안한 위치가 유효한지 재검증
        if (!board || !board[finalRow] || board[finalRow][finalCol] !== 0) {
          console.warn(
            `[AI Warning] AI가 잘못된 위치(${finalRow}, ${finalCol})를 제안했습니다.`
          );

          // 위협 위치가 있으면 그곳에 두기
          if (currentThreats && currentThreats.length > 0) {
            finalRow = currentThreats[0].row;
            finalCol = currentThreats[0].col;
          } else {
            this.makeRandomMove();
            this.isAiThinking = false;
            return;
          }
        }

        // 돌 놓기
        if (this.omokManager.placeStone(finalRow, finalCol, currentTurn)) {
          this.boardManager.renderStone(finalRow, finalCol, currentTurn);
          this.processGameStep(finalRow, finalCol);
        }

        this.isAiThinking = false; // AI 턴 종료
      });
    } catch (error) {
      console.error("[AI Error] AI 수 계산 중 에러 발생:", error);
      this.uiManager.showForbiddenMessage("AI 오류 발생, 랜덤 수를 둡니다.");
      this.makeRandomMove();
      this.isAiThinking = false;
    }
  }

  private makeRandomMove(): void {
    const board = this.omokManager.getBoardState();
    if (!board) {
      this.isAiThinking = false;
      return;
    }

    // 빈 칸 찾기
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        if (board[r][c] === 0) emptyCells.push({ r, c });
      }
    }

    // 랜덤 위치에 돌 놓기
    if (emptyCells.length > 0) {
      const move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      if (this.omokManager.placeStone(move.r, move.c, 2)) {
        this.boardManager.renderStone(move.r, move.c, 2);
        this.processGameStep(move.r, move.c);
      }
    }
  }

  protected restartGame(): void {
    this.boardManager.resetGame();
    this.uiManager.resetGame();
    this.omokManager.resetGame();
    this.scene.restart();
  }
}
