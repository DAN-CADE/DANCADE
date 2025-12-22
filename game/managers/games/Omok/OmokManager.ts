// game/managers/games/Omok/OmokManager.ts
import { BaseGameManager } from "@/game/managers/base/BaseGameManager";
import { GptManager } from "@/game/managers/global/gpt/GptManager";
import { OmokCallbacks, OmokState, Threat } from "@/game/types/realOmok";

export class OmokManager extends BaseGameManager<OmokState, OmokCallbacks> {
  private gptManager: GptManager;

  constructor(scene: Phaser.Scene, size: number, callbacks: OmokCallbacks) {
    super(
      scene,
      {
        board: Array.from({ length: size }, () => Array(size).fill(0)),
        size: size,
      },
      callbacks
    );
    this.gptManager = new GptManager();
  }

  // --- BaseGameManager 구현 ---

  public setGameObjects(): void {
    // 초기화 시 필요한 오브젝트 설정이 있다면 여기에 작성
  }

  public resetGame(newSize?: number): void {
    const size = newSize || this.gameState.size;
    this.gameState = {
      board: Array.from({ length: size }, () => Array(size).fill(0)),
      size: size,
      lastMove: undefined,
    };
  }

  // --- AI 및 로직 핵심 ---

  public async getNextMove(
    threats: Threat[] = []
  ): Promise<{ row: number; col: number }> {
    try {
      // 1. GPT에게 물어보기
      const result = await this.gptManager.getResponse("OMOK", {
        board: this.gameState.board,
        threats: threats,
        lastMove: this.gameState.lastMove,
      });

      // 2. 위기 상황(상대방 3목/4목) 체크
      const urgentDefend = threats.find((t) => t.priority <= 2);

      // 3. GPT 응답 검증 및 지능 보정
      if (
        result &&
        this.isWithinBoard(result.row, result.col) &&
        this.gameState.board[result.row][result.col] === 0
      ) {
        // 위기인데 GPT가 딴청 피우면 강제로 수비 좌표 리턴
        if (
          urgentDefend &&
          (result.row !== urgentDefend.row || result.col !== urgentDefend.col)
        ) {
          console.warn(
            `[지능 보정] GPT가 위협을 무시하여 강제 수비합니다: (${urgentDefend.row}, ${urgentDefend.col})`
          );
          return { row: urgentDefend.row, col: urgentDefend.col };
        }
        return result;
      }

      // 4. GPT가 멍청한 답을 주면 위협 리스트 중 최우선 순위 선택
      if (threats.length > 0) {
        return { row: threats[0].row, col: threats[0].col };
      }

      return { row: -1, col: -1 };
    } catch (error) {
      console.error("[AI Error] GPT 호출 실패:", error);
      // 에러 발생 시 최우선 위협 반환, 없으면 -1
      if (threats.length > 0) {
        return { row: threats[0].row, col: threats[0].col };
      }
      return { row: -1, col: -1 };
    }
  }

  public placeStone(row: number, col: number, color: number): boolean {
    if (!this.isWithinBoard(row, col)) return false;
    if (this.gameState.board[row][col] !== 0) return false;

    this.gameState.board[row][col] = color;
    this.gameState.lastMove = { row, col };

    // Scene에 돌을 그리라고 알림
    this.callCallback("onMove", row, col, color);

    // 승리 체크
    if (this.checkWin(row, col, color)) {
      this.callCallback("onWin", color);
    }

    return true;
  }

  public getThreats(color: number): Threat[] {
    const threats: Threat[] = [];
    const opponent = color === 1 ? 2 : 1;
    const size = this.gameState.size;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (this.gameState.board[r][c] === 0) {
          const opMax = this.getMaxContinuous(r, c, opponent);
          const myMax = this.getMaxContinuous(r, c, color);

          if (myMax >= 5) {
            threats.push({ row: r, col: c, type: "WIN", priority: 0 });
          } else if (opMax >= 5) {
            threats.push({
              row: r,
              col: c,
              type: "MUST_DEFEND_4",
              priority: 1,
            });
          } else if (opMax >= 4) {
            // 상대 돌 3개 나란히 있을 때 (priority 2)
            threats.push({ row: r, col: c, type: "DEFEND_3", priority: 2 });
          } else if (myMax === 4) {
            threats.push({ row: r, col: c, type: "ATTACK_4", priority: 3 });
          }
        }
      }
    }

    // 위기 상황이면 위기 리스트만, 아니면 전체를 정렬해서 20개까지 전달 (GPT 판단 근거 제공)
    const urgent = threats.filter((t) => t.priority <= 2);
    if (urgent.length > 0) {
      return urgent.sort((a, b) => a.priority - b.priority);
    }

    return threats.sort((a, b) => a.priority - b.priority).slice(0, 20);
  }

  // --- 유틸리티 private 함수들 (this.gameState.board 참조) ---

  private getMaxContinuous(r: number, c: number, color: number): number {
    const directions: [number, number][] = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ];
    let max = 0;
    for (const [dr, dc] of directions) {
      const count =
        1 +
        this.countInDirection(r, c, dr, dc, color) +
        this.countInDirection(r, c, -dr, -dc, color);
      max = Math.max(max, count);
    }
    return max;
  }

  private countInDirection(
    r: number,
    c: number,
    dr: number,
    dc: number,
    color: number
  ): number {
    let count = 0;
    let nr = r + dr;
    let nc = c + dc;
    while (
      this.isWithinBoard(nr, nc) &&
      this.gameState.board[nr][nc] === color
    ) {
      count++;
      nr += dr;
      nc += dc;
    }
    return count;
  }

  public checkWin(row: number, col: number, color: number): boolean {
    const directions: [number, number][] = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ];
    for (const [dr, dc] of directions) {
      const count =
        1 +
        this.countInDirection(row, col, dr, dc, color) +
        this.countInDirection(row, col, -dr, -dc, color);
      if (count >= 5) return true;
    }
    return false;
  }

  public checkForbidden(
    row: number,
    col: number,
    color: number
  ): { can: boolean; reason?: string } {
    if (!this.isWithinBoard(row, col)) return { can: false };
    if (this.gameState.board[row][col] !== 0) return { can: false };

    if (color === 1) {
      // 흑돌 금수 규칙
      if (this.isOverline(row, col, color))
        return { can: false, reason: "장목 금수" };
      if (this.isDoubleThree(row, col, color))
        return { can: false, reason: "3-3 금수" };
      if (this.isDoubleFour(row, col, color))
        return { can: false, reason: "4-4 금수" };
    }
    return { can: true };
  }

  // --- 금수 상세 로직 ---
  private isDoubleThree(r: number, c: number, color: number): boolean {
    let openThreeCount = 0;
    const directions: [number, number][] = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ];
    for (const [dr, dc] of directions) {
      if (this.isOpenThree(r, c, dr, dc, color)) openThreeCount++;
    }
    return openThreeCount >= 2;
  }

  private isOpenThree(
    r: number,
    c: number,
    dr: number,
    dc: number,
    color: number
  ): boolean {
    const count =
      1 +
      this.countInDirection(r, c, dr, dc, color) +
      this.countInDirection(r, c, -dr, -dc, color);
    if (count !== 3) return false;

    const forwardCount = this.countInDirection(r, c, dr, dc, color);
    const headR = r + (forwardCount + 1) * dr;
    const headC = c + (forwardCount + 1) * dc;

    const backwardCount = this.countInDirection(r, c, -dr, -dc, color);
    const tailR = r - (backwardCount + 1) * dr;
    const tailC = c - (backwardCount + 1) * dc;

    return (
      this.isWithinBoard(headR, headC) &&
      this.gameState.board[headR][headC] === 0 &&
      this.isWithinBoard(tailR, tailC) &&
      this.gameState.board[tailR][tailC] === 0
    );
  }

  private isDoubleFour(r: number, c: number, color: number): boolean {
    let fourCount = 0;
    const directions: [number, number][] = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ];
    for (const [dr, dc] of directions) {
      const count =
        1 +
        this.countInDirection(r, c, dr, dc, color) +
        this.countInDirection(r, c, -dr, -dc, color);
      if (count === 4) fourCount++;
    }
    return fourCount >= 2;
  }

  private isOverline(r: number, c: number, color: number): boolean {
    const directions: [number, number][] = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ];
    for (const [dr, dc] of directions) {
      if (
        1 +
          this.countInDirection(r, c, dr, dc, color) +
          this.countInDirection(r, c, -dr, -dc, color) >
        5
      )
        return true;
    }
    return false;
  }

  private isWithinBoard(r: number, c: number): boolean {
    return (
      r >= 0 && r < this.gameState.size && c >= 0 && c < this.gameState.size
    );
  }

  public getBoardState(): number[][] {
    return this.gameState.board;
  }
}
