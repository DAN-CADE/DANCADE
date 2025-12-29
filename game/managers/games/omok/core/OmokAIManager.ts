// game/managers/games/Omok/OmokAIManager.ts
import { GptManager } from "@/game/managers/global/gpt/GptManager";
import type { Threat } from "@/game/types/omok";

/**
 * 수 정보
 */
interface MovePosition {
  row: number;
  col: number;
}

/**
 * OmokAIManager
 * - AI 관련 로직만 담당
 * - GPT 통신, 수 검증, 폴백 처리
 */
export class OmokAIManager {
  private gptManager: GptManager;

  // AI 상수
  private readonly AI_CONFIG = {
    MIN_THREAT_PRIORITY: 2, // 긴급 위협 우선순위
    MAX_THREAT_COUNT: 20, // GPT에 전달할 최대 위협 개수
  } as const;

  constructor() {
    this.gptManager = new GptManager();
  }

  // =====================================================================
  // Public API
  // =====================================================================

  /**
   * AI의 다음 수 결정
   * @param board - 현재 보드 상태
   * @param threats - 위협 목록
   * @param lastMove - 마지막 수
   * @param isWithinBoard - 보드 범위 체크 함수
   * @returns 선택된 좌표
   */
  public async getNextMove(
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
      return this.getFallbackMove(threats);
    }
  }

  /**
   * 랜덤 수 선택 (최후의 폴백)
   * @param board - 현재 보드 상태
   * @returns 랜덤 빈 칸 또는 null
   */
  public getRandomMove(board: number[][]): MovePosition | null {
    const emptyCells = this.getEmptyCells(board);
    if (emptyCells.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    return emptyCells[randomIndex];
  }

  // =====================================================================
  // GPT 통신
  // =====================================================================

  /**
   * GPT에게 수 요청
   */
  private async requestGptMove(
    board: number[][],
    threats: Threat[],
    lastMove: MovePosition | undefined
  ): Promise<MovePosition | null> {
    // 위협 개수 제한
    const limitedThreats = threats.slice(0, this.AI_CONFIG.MAX_THREAT_COUNT);

    const result = await this.gptManager.getResponse("OMOK", {
      board,
      threats: limitedThreats,
      lastMove,
    });

    return result;
  }

  // =====================================================================
  // 위협 분석
  // =====================================================================

  /**
   * 긴급 위협 찾기 (우선순위 2 이하)
   */
  private findUrgentThreat(threats: Threat[]): Threat | undefined {
    return threats.find(
      (t) => t.priority <= this.AI_CONFIG.MIN_THREAT_PRIORITY
    );
  }

  // =====================================================================
  // 수 검증
  // =====================================================================

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
    console.warn("[AI Fallback] GPT 수 무효, 위협 기반 수 선택");
    return this.getFallbackMove(threats);
  }

  /**
   * 수가 유효한지 확인
   */
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

  /**
   * 두 위치가 같은지 확인
   */
  private isSamePosition(pos1: MovePosition, pos2: MovePosition): boolean {
    return pos1.row === pos2.row && pos1.col === pos2.col;
  }

  // =====================================================================
  // 폴백 전략
  // =====================================================================

  /**
   * 폴백 수 (위협 리스트 중 최우선 또는 -1)
   */
  private getFallbackMove(threats: Threat[]): MovePosition {
    if (threats.length > 0) {
      const topThreat = threats[0];
      console.log(
        `[AI Fallback] 최우선 위협 선택: (${topThreat.row}, ${topThreat.col})`
      );
      return { row: topThreat.row, col: topThreat.col };
    }

    console.warn("[AI Fallback] 위협 없음, 무효 수 반환");
    return { row: -1, col: -1 };
  }

  /**
   * 빈 칸 목록 반환
   */
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

  // =====================================================================
  // 정리
  // =====================================================================

  /**
   * GPT 매니저 정리
   */
  public cleanup(): void {
    // GptManager에 cleanup 메서드가 있다면 호출
    console.log("[OmokAI] AI 매니저 정리 완료");
  }
}
