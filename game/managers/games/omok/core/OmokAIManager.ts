// game/managers/games/omok/core/OmokAIManager.ts (최종 수정)

import { GptManager } from "@/game/managers/global/gpt/GptManager";
import type { Threat } from "@/game/types/omok";

interface MovePosition {
  row: number;
  col: number;
}

interface AiTurnResult {
  success: boolean;
  move: MovePosition | null;
  fromGpt: boolean;
  error?: string;
}

export class OmokAIManager {
  private gptManager: GptManager;
  private isThinking: boolean = false;

  private readonly AI_CONFIG = {
    MIN_THREAT_PRIORITY: 2,
    MAX_THREAT_COUNT: 20,
    THINKING_DELAY: 500,
  } as const;

  constructor() {
    this.gptManager = new GptManager();
  }

  public isAiThinking(): boolean {
    return this.isThinking;
  }

  private setThinking(thinking: boolean): void {
    this.isThinking = thinking;
  }

  /**
   * AI 턴 실행
   */
  public async executeAiTurn(
    board: number[][],
    threats: Threat[],
    lastMove: MovePosition | undefined,
    isWithinBoard: (row: number, col: number) => boolean,
    onMoveReady: (result: AiTurnResult) => void
  ): Promise<void> {
    if (this.isThinking) {
      console.warn("[AI] 이미 생각 중입니다");
      return;
    }

    this.setThinking(true);

    try {
      // 1. AI 수 계산
      const move = await this.getNextMove(
        board,
        threats,
        lastMove,
        isWithinBoard
      );

      // ⭐ move가 -1이면 강제 랜덤 선택
      let finalMove = move;
      if (move.row === -1) {
        console.warn("[AI 긴급 보정] 무효한 수(-1) → 강제 랜덤 선택");
        const randomMove = this.getRandomMove(board);
        finalMove = randomMove || { row: -1, col: -1 };
      }

      // 2. AI 고민 연출
      await this.delay(this.AI_CONFIG.THINKING_DELAY);

      // 3. 결과 반환
      const result: AiTurnResult = {
        success: finalMove.row !== -1,
        move: finalMove,
        fromGpt: move.row !== -1 && finalMove === move,
      };

      onMoveReady(result);
    } catch (error) {
      console.error("[AI Error] 턴 실행 실패:", error);

      // 폴백: 랜덤 수
      const randomMove = this.getRandomMove(board);
      const result: AiTurnResult = {
        success: randomMove !== null,
        move: randomMove || { row: -1, col: -1 },
        fromGpt: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      };

      onMoveReady(result);
    } finally {
      this.setThinking(false);
    }
  }

  /**
   * AI의 다음 수 결정
   */
  private async getNextMove(
    board: number[][],
    threats: Threat[],
    lastMove: MovePosition | undefined,
    isWithinBoard: (row: number, col: number) => boolean
  ): Promise<MovePosition> {
    try {
      // 1. GPT에게 수 요청
      const gptMove = await this.requestGptMove(board, threats, lastMove);

      // 2. 긴급 위협 확인
      const urgentThreat = this.findUrgentThreat(threats);

      // 3. GPT 응답 검증 및 보정
      return this.validateAndCorrectMove(
        gptMove,
        urgentThreat,
        threats,
        board,
        isWithinBoard
      );
    } catch (error) {
      console.error("[AI Error] GPT 호출 실패:", error);
      return this.getFallbackMove(threats, board);
    }
  }

  private async requestGptMove(
    board: number[][],
    threats: Threat[],
    lastMove: MovePosition | undefined
  ): Promise<MovePosition | null> {
    const limitedThreats = threats.slice(0, this.AI_CONFIG.MAX_THREAT_COUNT);

    const result = await this.gptManager.getResponse("OMOK", {
      board,
      threats: limitedThreats,
      lastMove,
    });

    return result;
  }

  private findUrgentThreat(threats: Threat[]): Threat | undefined {
    return threats.find(
      (t) => t.priority <= this.AI_CONFIG.MIN_THREAT_PRIORITY
    );
  }

  /**
   * GPT 수 검증 및 보정
   */
  private validateAndCorrectMove(
    gptMove: MovePosition | null,
    urgentThreat: Threat | undefined,
    threats: Threat[],
    board: number[][],
    isWithinBoard: (row: number, col: number) => boolean
  ): MovePosition {
    // GPT 수가 유효한 경우
    if (this.isValidMove(gptMove, board, isWithinBoard)) {
      // 긴급 상황인데 GPT가 무시했다면 강제 수비
      if (urgentThreat && !this.isSamePosition(gptMove!, urgentThreat)) {
        console.warn(
          `[지능 보정] GPT가 위협 무시 → 강제 수비: (${urgentThreat.row}, ${urgentThreat.col})`
        );
        return { row: urgentThreat.row, col: urgentThreat.col };
      }
      return gptMove!;
    }

    // GPT 수가 무효한 경우 폴백
    console.warn("[AI Fallback] GPT 수 무효, 폴백 수 선택");
    return this.getFallbackMove(threats, board);
  }

  private isValidMove(
    move: MovePosition | null,
    board: number[][],
    isWithinBoard: (row: number, col: number) => boolean
  ): move is MovePosition {
    return (
      move !== null &&
      isWithinBoard(move.row, move.col) &&
      board[move.row][move.col] === 0
    );
  }

  private isSamePosition(pos1: MovePosition, pos2: MovePosition): boolean {
    return pos1.row === pos2.row && pos1.col === pos2.col;
  }

  /**
   * 폴백 수 (⭐ 수정: board 인자 추가, 랜덤 선택 추가)
   */
  private getFallbackMove(threats: Threat[], board: number[][]): MovePosition {
    // 1. 위협이 있으면 최우선 위협 선택
    if (threats.length > 0) {
      const topThreat = threats[0];
      console.log(
        `[AI Fallback] 최우선 위협 선택: (${topThreat.row}, ${topThreat.col})`
      );
      return { row: topThreat.row, col: topThreat.col };
    }

    // ⭐ 2. 위협이 없으면 랜덤 선택!
    console.warn("[AI Fallback] 위협 없음, 랜덤 수 선택");
    const randomMove = this.getRandomMove(board);

    if (randomMove) {
      console.log(
        `[AI Fallback] 랜덤 수: (${randomMove.row}, ${randomMove.col})`
      );
      return randomMove;
    }

    // 3. 정말 막다른 상황 (보드 가득 참)
    console.error("[AI Fallback] 둘 곳이 없음!");
    return { row: -1, col: -1 };
  }

  public getRandomMove(board: number[][]): MovePosition | null {
    const emptyCells = this.getEmptyCells(board);
    if (emptyCells.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    return emptyCells[randomIndex];
  }

  private getEmptyCells(board: number[][]): MovePosition[] {
    const emptyCells: MovePosition[] = [];

    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        if (board[r][c] === 0) {
          emptyCells.push({ row: r, col: c });
        }
      }
    }

    return emptyCells;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public cleanup(): void {
    this.setThinking(false);
    console.log("[OmokAI] AI 매니저 정리 완료");
  }
}
