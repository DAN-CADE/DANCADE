// game/managers/games/omok/core/OmokAIManager.ts

import { GptManager } from "@/game/managers/global/gpt/GptManager";
import type {
  Threat,
  Point,
  AiConfig,
  AiTurnResult,
} from "@/game/types/omok/omok.types";

// 매직 넘버 방지를 위한 상수
const INVALID_POINT: Point = { row: -1, col: -1 };

export class OmokAIManager {
  private gptManager: GptManager;
  private isThinking: boolean = false;

  private readonly AI_CONFIG: AiConfig = {
    MIN_THREAT_PRIORITY: 2,
    MAX_THREAT_COUNT: 20,
    THINKING_DELAY: 500,
  } as const;

  constructor() {
    this.gptManager = new GptManager();
  }

  // =====================================================================
  // =====================================================================

  public isAiThinking(): boolean {
    return this.isThinking;
  }

  private setThinking(thinking: boolean): void {
    this.isThinking = thinking;
  }

  // =====================================================================
  // =====================================================================

  /**
   * AI 턴 실행 메인 메서드
   */
  public async executeAiTurn(
    board: number[][],
    threats: Threat[],
    lastMove: Point | undefined,
    isWithinBoard: (row: number, col: number) => boolean,
    onMoveReady: (result: AiTurnResult) => void
  ): Promise<void> {
    if (this.isThinking) return;
    this.setThinking(true);

    try {
      // 1. 최적의 수 계산 (GPT + 로컬 보정)
      const move = await this.getNextMove(
        board,
        threats,
        lastMove,
        isWithinBoard
      );

      // 2. 최종 결정된 수가 무효할 경우 중심부 가중치 기반 랜덤 수 선택
      let finalMove: Point = move;
      if (move.row === INVALID_POINT.row) {
        console.warn("[AI] 유효 수 없음 -> 중심부 가중치 랜덤 선택");
        finalMove = this.getWeightedRandomMove(board) || INVALID_POINT;
      }

      // 3. 딜레이
      await this.delay(this.AI_CONFIG.THINKING_DELAY);

      // 4. 콜백 반환
      onMoveReady({
        success: finalMove.row !== INVALID_POINT.row,
        move: finalMove,
        fromGpt:
          move.row !== INVALID_POINT.row &&
          this.isSamePosition(finalMove, move),
      });
    } catch (error) {
      console.error("[AI Error] 실시간 처리 실패:", error);
      const fallback = this.getWeightedRandomMove(board) || INVALID_POINT;
      onMoveReady({
        success: fallback.row !== INVALID_POINT.row,
        move: fallback,
        fromGpt: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    } finally {
      this.setThinking(false);
    }
  }

  /**
   * 전략적 다음 수 결정
   */
  public async getNextMove(
    board: number[][],
    threats: Threat[],
    lastMove: Point | undefined,
    isWithinBoard: (row: number, col: number) => boolean
  ): Promise<Point> {
    try {
      // 1. GPT 응답 시도
      const gptMove = await this.requestGptMove(board, threats, lastMove);
      const urgentThreat = this.findUrgentThreat(threats);

      // 2. 검증 및 수비 보정
      if (this.isValidMove(gptMove, board, isWithinBoard)) {
        if (urgentThreat && !this.isSamePosition(gptMove!, urgentThreat)) {
          return { row: urgentThreat.row, col: urgentThreat.col };
        }
        return gptMove!;
      }

      // 3. GPT 실패 시 폴백 (위협 방어 우선 -> 없으면 중심부 가중치)
      return this.getFallbackMove(threats, board);
    } catch (error) {
      console.log(error);
      return this.getFallbackMove(threats, board);
    }
  }

  /**
   * 중심부 가중치 기반 랜덤 수 선택
   * 보드 중앙에 가까울수록 선택될 확률이 높음
   */
  public getWeightedRandomMove(board: number[][]): Point | null {
    const emptyCells = this.getEmptyCells(board);
    if (emptyCells.length === 0) return null;

    const center = Math.floor(board.length / 2);

    // 각 빈 칸에 대해 중심부와의 거리에 따른 가중치 부여 (거리가 멀수록 가중치 감소)
    const weightedList = emptyCells.map((cell) => {
      const distance = Math.sqrt(
        Math.pow(cell.row - center, 2) + Math.pow(cell.col - center, 2)
      );
      const weight = Math.max(1, 20 - distance); // 중앙에 가까울수록 큰 가중치
      return { cell, weight };
    });

    const totalWeight = weightedList.reduce(
      (sum, item) => sum + item.weight,
      0
    );
    let random = Math.random() * totalWeight;

    for (const item of weightedList) {
      if (random < item.weight) return item.cell;
      random -= item.weight;
    }

    return emptyCells[0];
  }

  private getFallbackMove(threats: Threat[], board: number[][]): Point {
    if (threats.length > 0) {
      return { row: threats[0].row, col: threats[0].col };
    }
    return this.getWeightedRandomMove(board) || INVALID_POINT;
  }

  private async requestGptMove(
    board: number[][],
    threats: Threat[],
    lastMove: Point | undefined
  ): Promise<Point | null> {
    return await this.gptManager.getResponse("OMOK", {
      board,
      threats: threats.slice(0, this.AI_CONFIG.MAX_THREAT_COUNT),
      lastMove,
    });
  }

  private findUrgentThreat(threats: Threat[]): Threat | undefined {
    return threats.find(
      (t) => t.priority <= this.AI_CONFIG.MIN_THREAT_PRIORITY
    );
  }

  private isValidMove(
    move: Point | null,
    board: number[][],
    isWithinBoard: (r: number, c: number) => boolean
  ): move is Point {
    return (
      move !== null &&
      isWithinBoard(move.row, move.col) &&
      board[move.row][move.col] === 0
    );
  }

  private isSamePosition(p1: Point, p2: Point): boolean {
    return p1.row === p2.row && p1.col === p2.col;
  }

  private getEmptyCells(board: number[][]): Point[] {
    const empty: Point[] = [];
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        if (board[r][c] === 0) empty.push({ row: r, col: c });
      }
    }
    return empty;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public cleanup(): void {
    this.setThinking(false);
  }
}
