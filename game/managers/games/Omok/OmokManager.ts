// game/managers/games/Omok/OmokManager.ts
import { BaseGameManager } from "@/game/managers/base/BaseGameManager";
import { OmokAIManager } from "./OmokAIManager";
import {
  type OmokCallbacks,
  type OmokState,
  type Threat,
  DIRECTIONS,
} from "@/game/types/omok";

/**
 * OmokManager
 * - 오목 게임 로직 관리 (승리 판정, 금수 체크)
 * - AI 로직은 OmokAIManager에 위임
 * - UI와 분리된 순수 비즈니스 로직
 */
export class OmokManager extends BaseGameManager<OmokState, OmokCallbacks> {
  private aiManager: OmokAIManager;

  // 게임 규칙 상수
  private readonly GAME_RULES = {
    WIN_COUNT: 5, // 승리 조건 (5개 연속)
    OVERLINE_LIMIT: 5, // 장목 제한
    MIN_THREAT_PRIORITY: 2, // 긴급 위협 우선순위
    MAX_THREAT_COUNT: 20, // GPT에 전달할 최대 위협 개수
  } as const;

  constructor(scene: Phaser.Scene, size: number, callbacks: OmokCallbacks) {
    super(
      scene,
      {
        board: Array.from({ length: size }, () => Array(size).fill(0)),
        size: size,
      },
      callbacks
    );
    this.aiManager = new OmokAIManager();
  }

  // =====================================================================
  // BaseGameManager 구현
  // =====================================================================

  public setGameObjects(): void {
    // 게임 오브젝트 초기화 (필요시 구현)
  }

  /**
   * 보드만 초기화 (게임 상태 유지)
   */
  public resetBoard(): void {
    const size = this.gameState.size;
    this.gameState.board = Array.from({ length: size }, () =>
      Array(size).fill(0)
    );
    this.gameState.lastMove = undefined;
    console.log("[OmokManager] 보드 초기화 완료");
  }

  /**
   * 게임 전체 초기화 (보드 크기 변경 가능)
   */
  public resetGame(newSize?: number): void {
    const size = newSize || this.gameState.size;
    this.gameState = {
      board: Array.from({ length: size }, () => Array(size).fill(0)),
      size: size,
      lastMove: undefined,
    };
    console.log(`[OmokManager] 게임 초기화 완료 (크기: ${size})`);
  }

  // =====================================================================
  // AI 위임
  // =====================================================================

  /**
   * AI의 다음 수 결정 (AI 매니저에 위임)
   */
  public async getNextMove(
    threats: Threat[] = []
  ): Promise<{ row: number; col: number }> {
    return this.aiManager.getNextMove(
      this.gameState.board,
      threats,
      this.gameState.lastMove,
      (r, c) => this.isWithinBoard(r, c)
    );
  }

  /**
   * 랜덤 수 선택 (AI 매니저에 위임)
   */
  public getRandomMove(): { row: number; col: number } | null {
    return this.aiManager.getRandomMove(this.gameState.board);
  }

  // =====================================================================
  // 게임 로직
  // =====================================================================

  /**
   * 돌 놓기
   * @returns 성공 여부
   */
  public placeStone(row: number, col: number, color: number): boolean {
    if (!this.canPlaceStone(row, col)) return false;

    this.gameState.board[row][col] = color;
    this.gameState.lastMove = { row, col };

    // Scene에 돌 렌더링 요청
    this.callCallback("onMove", row, col, color);

    // 승리 체크
    if (this.checkWin(row, col, color)) {
      this.callCallback("onWin", color);
    }

    return true;
  }

  /**
   * 해당 위치에 돌을 놓을 수 있는지 확인
   */
  private canPlaceStone(row: number, col: number): boolean {
    return this.isWithinBoard(row, col) && this.gameState.board[row][col] === 0;
  }

  /**
   * 승리 체크
   */
  public checkWin(row: number, col: number, color: number): boolean {
    for (const [dr, dc] of DIRECTIONS) {
      const count = this.countStones(row, col, dr, dc, color);
      if (count >= this.GAME_RULES.WIN_COUNT) return true;
    }
    return false;
  }

  // =====================================================================
  // 연속 돌 계산
  // =====================================================================

  /**
   * 특정 방향으로 연속된 돌 개수 계산
   */
  private countStones(
    row: number,
    col: number,
    dr: number,
    dc: number,
    color: number
  ): number {
    return (
      1 +
      this.countInDirection(row, col, dr, dc, color) +
      this.countInDirection(row, col, -dr, -dc, color)
    );
  }

  /**
   * 한 방향으로 연속된 돌 개수 세기
   */
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

  // =====================================================================
  // 위협 분석
  // =====================================================================

  /**
   * 위협 목록 생성
   */
  public getThreats(color: number): Threat[] {
    const threats: Threat[] = [];
    const opponent = this.getOpponent(color);

    for (let r = 0; r < this.gameState.size; r++) {
      for (let c = 0; c < this.gameState.size; c++) {
        if (this.gameState.board[r][c] === 0) {
          const threat = this.analyzeThreat(r, c, color, opponent);
          if (threat) threats.push(threat);
        }
      }
    }

    return this.sortAndLimitThreats(threats);
  }

  /**
   * 상대 색깔 반환
   */
  private getOpponent(color: number): number {
    return color === 1 ? 2 : 1;
  }

  /**
   * 특정 위치의 위협 분석
   */
  private analyzeThreat(
    r: number,
    c: number,
    myColor: number,
    opponentColor: number
  ): Threat | null {
    const myMax = this.getMaxContinuous(r, c, myColor);
    const opMax = this.getMaxContinuous(r, c, opponentColor);

    // 승리 가능
    if (myMax >= 5) {
      return { row: r, col: c, type: "WIN", priority: 0 };
    }

    // 상대 승리 막기 (최우선)
    if (opMax >= 5) {
      return { row: r, col: c, type: "MUST_DEFEND_4", priority: 1 };
    }

    // 상대 4개 막기
    if (opMax >= 4) {
      return { row: r, col: c, type: "DEFEND_3", priority: 2 };
    }

    // 나의 4개 만들기
    if (myMax === 4) {
      return { row: r, col: c, type: "ATTACK_4", priority: 3 };
    }

    return null;
  }

  /**
   * 위협 정렬 및 제한
   */
  private sortAndLimitThreats(threats: Threat[]): Threat[] {
    // 긴급 위협만 반환
    const urgent = threats.filter(
      (t) => t.priority <= this.GAME_RULES.MIN_THREAT_PRIORITY
    );
    if (urgent.length > 0) {
      return urgent.sort((a, b) => a.priority - b.priority);
    }

    // 전체 위협을 정렬하여 상위 N개만 반환
    return threats
      .sort((a, b) => a.priority - b.priority)
      .slice(0, this.GAME_RULES.MAX_THREAT_COUNT);
  }

  /**
   * 최대 연속 개수 계산
   */
  private getMaxContinuous(r: number, c: number, color: number): number {
    let max = 0;

    for (const [dr, dc] of DIRECTIONS) {
      const count = this.countStones(r, c, dr, dc, color);
      max = Math.max(max, count);
    }

    return max;
  }

  // =====================================================================
  // 금수 체크
  // =====================================================================

  /**
   * 금수 체크
   */
  public checkForbidden(
    row: number,
    col: number,
    color: number
  ): { can: boolean; reason?: string } {
    if (!this.canPlaceStone(row, col)) {
      return { can: false };
    }

    // 백돌은 금수 없음
    if (color !== 1) {
      return { can: true };
    }

    // 흑돌 금수 규칙 체크
    return this.checkBlackForbidden(row, col, color);
  }

  /**
   * 흑돌 금수 체크
   */
  private checkBlackForbidden(
    row: number,
    col: number,
    color: number
  ): { can: boolean; reason?: string } {
    if (this.isOverline(row, col, color)) {
      return { can: false, reason: "장목 금수" };
    }

    if (this.isDoubleThree(row, col, color)) {
      return { can: false, reason: "3-3 금수" };
    }

    if (this.isDoubleFour(row, col, color)) {
      return { can: false, reason: "4-4 금수" };
    }

    return { can: true };
  }

  /**
   * 3-3 금수 체크
   */
  private isDoubleThree(r: number, c: number, color: number): boolean {
    let openThreeCount = 0;

    for (const [dr, dc] of DIRECTIONS) {
      if (this.isOpenThree(r, c, dr, dc, color)) {
        openThreeCount++;
      }
    }

    return openThreeCount >= 2;
  }

  /**
   * 열린 3 체크
   */
  private isOpenThree(
    r: number,
    c: number,
    dr: number,
    dc: number,
    color: number
  ): boolean {
    const count = this.countStones(r, c, dr, dc, color);
    if (count !== 3) return false;

    const forwardCount = this.countInDirection(r, c, dr, dc, color);
    const backwardCount = this.countInDirection(r, c, -dr, -dc, color);

    const headR = r + (forwardCount + 1) * dr;
    const headC = c + (forwardCount + 1) * dc;
    const tailR = r - (backwardCount + 1) * dr;
    const tailC = c - (backwardCount + 1) * dc;

    return (
      this.isWithinBoard(headR, headC) &&
      this.gameState.board[headR][headC] === 0 &&
      this.isWithinBoard(tailR, tailC) &&
      this.gameState.board[tailR][tailC] === 0
    );
  }

  /**
   * 4-4 금수 체크
   */
  private isDoubleFour(r: number, c: number, color: number): boolean {
    let fourCount = 0;

    for (const [dr, dc] of DIRECTIONS) {
      const count = this.countStones(r, c, dr, dc, color);
      if (count === 4) {
        fourCount++;
      }
    }

    return fourCount >= 2;
  }

  /**
   * 장목 금수 체크
   */
  private isOverline(r: number, c: number, color: number): boolean {
    for (const [dr, dc] of DIRECTIONS) {
      const count = this.countStones(r, c, dr, dc, color);
      if (count > this.GAME_RULES.OVERLINE_LIMIT) {
        return true;
      }
    }
    return false;
  }

  // =====================================================================
  // 유틸리티
  // =====================================================================

  /**
   * 보드 범위 체크
   */
  private isWithinBoard(r: number, c: number): boolean {
    return (
      r >= 0 && r < this.gameState.size && c >= 0 && c < this.gameState.size
    );
  }

  /**
   * 보드 상태 반환
   */
  public getBoardState(): number[][] {
    return this.gameState.board;
  }

  // =====================================================================
  // 정리
  // =====================================================================

  /**
   * AI 매니저 정리
   */
  public cleanup(): void {
    this.aiManager.cleanup();
  }
}
