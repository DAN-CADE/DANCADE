import { BaseGameManager } from "@/game/managers/base/BaseGameManager";
import {
  type OmokState,
  type Threat,
  OmokCallbacks,
  DIRECTIONS,
  GAME_RULES,
  OmokSideType,
  THREAT_TYPE,
  THREAT_PRIORITY,
  Point,
  OmokSide,
} from "@/game/types/omok";
import { OmokAIManager } from "@/game/managers/games/omok/core/OmokAIManager";

export class OmokManager extends BaseGameManager<OmokState, OmokCallbacks> {
  private aiManager: OmokAIManager;

  constructor(scene: Phaser.Scene, size: number, callbacks: OmokCallbacks) {
    super(
      scene,
      {
        board: OmokManager.createEmptyBoard(size),
        size: size,
        moves: [],
        lastMove: undefined,
      },
      callbacks
    );
    this.aiManager = new OmokAIManager();
  }

  // =====================================================================
  // =====================================================================

  public setGameObjects(): void {}

  public resetGame(): void {
    this.gameState.board = OmokManager.createEmptyBoard(this.size);
    this.gameState.lastMove = undefined;
    this.gameState.moves = [];

    console.log("[OmokManager] 게임 초기화 완료");
  }

  // =====================================================================
  // =====================================================================

  public placeStone(point: Point, side: OmokSideType): boolean {
    // 기본적인 위치 및 중복 배치 확인
    if (!this.canPlaceStone(point)) return false;

    // 금수 체크
    const forbiddenCheck = this.checkForbidden(point, side);
    if (!forbiddenCheck.can) {
      this.callCallback(
        "onForbidden",
        forbiddenCheck.reason || "둘 수 없는 곳입니다."
      );
      return false;
    }

    // 돌 놓기
    const board = this.board;
    const { row, col } = point;

    board[row][col] = side;
    this.gameState.lastMove = point;

    this.gameState.moves.push({ point, side });

    this.callCallback("onMove", point, side, this.gameState.moves.length);

    if (this.checkWin(point, side)) {
      this.callCallback("onWin", side);
    }

    return true;
  }

  private canPlaceStone(point: Point): boolean {
    const { row, col } = point;
    const board = this.board;
    return this.isWithinBoard(point) && board[row][col] === 0;
  }

  // =====================================================================
  // =====================================================================

  public async requestAiMove(threats: Threat[] = []): Promise<Point> {
    console.log("[OmokManager] AI에게 다음 수를 요청");

    return this.aiManager.getNextMove(
      this.gameState.board,
      threats,
      this.gameState.lastMove,
      (row, col) => this.isWithinBoard({ row, col })
    );
  }

  public requestAiRandomMove(): Point | null {
    return this.aiManager.getWeightedRandomMove(this.gameState.board);
  }

  // =====================================================================
  // =====================================================================

  public checkWin(point: Point, side: OmokSideType): boolean {
    for (const [dr, dc] of DIRECTIONS) {
      const count = this.countStones(point, dr, dc, side);

      if (side === OmokSide.BLACK) {
        if (count === GAME_RULES.WIN_COUNT) {
          return true;
        }
      } else {
        if (count >= GAME_RULES.WIN_COUNT) {
          return true;
        }
      }
    }
    return false;
  }

  public checkForbidden(
    point: Point,
    side: OmokSideType
  ): {
    can: boolean;
    reason?: string;
  } {
    if (!this.canPlaceStone(point)) {
      return { can: false };
    }
    if (side !== OmokSide.BLACK) {
      return { can: true };
    }

    return this.checkBlackForbidden(point, side);
  }

  private checkBlackForbidden(
    point: Point,
    side: OmokSideType
  ): {
    can: boolean;
    reason?: string;
  } {
    // 임시로 수를 놓아보고 금수인지 판단
    this.board[point.row][point.col] = side;

    const isOver = this.isOverline(point, side);
    const is33 = this.isDoubleThree(point, side);
    const is44 = this.isDoubleFour(point, side);

    // 보드 상태 원상 복구
    this.board[point.row][point.col] = 0;

    if (isOver) {
      return { can: false, reason: "장목 금수" };
    }
    if (is33) {
      return { can: false, reason: "3-3 금수" };
    }
    if (is44) {
      return { can: false, reason: "4-4 금수" };
    }

    return { can: true };
  }

  // =====================================================================
  // =====================================================================

  private analyzeThreat(
    point: Point,
    mySide: OmokSideType,
    opponentSide: OmokSideType
  ): Threat | null {
    const myMax = this.getMaxContinuous(point, mySide);
    const opMax = this.getMaxContinuous(point, opponentSide);

    const { row, col } = point;

    if (myMax >= GAME_RULES.WIN_COUNT) {
      return {
        row: row,
        col: col,
        type: THREAT_TYPE.WIN,
        priority: THREAT_PRIORITY.WIN,
      };
    }

    if (opMax >= GAME_RULES.WIN_COUNT) {
      return {
        row: row,
        col: col,
        type: THREAT_TYPE.MUST_DEFEND,
        priority: THREAT_PRIORITY.MUST_DEFEND,
      };
    }

    if (opMax >= GAME_RULES.MUST_BLOCK_COUNT) {
      return {
        row: row,
        col: col,
        type: THREAT_TYPE.DEFEND_3,
        priority: THREAT_PRIORITY.ATTACK_4,
      };
    }

    if (myMax === GAME_RULES.MUST_BLOCK_COUNT) {
      return {
        row: row,
        col: col,
        type: THREAT_TYPE.ATTACK_4,
        priority: THREAT_PRIORITY.DEFEND_3,
      };
    }

    return null;
  }

  private countStones(
    point: Point,
    rowDir: number,
    colDir: number,
    side: OmokSideType
  ): number {
    return (
      1 +
      this.countInDirection(point, rowDir, colDir, side) +
      this.countInDirection(point, -rowDir, -colDir, side)
    );
  }

  private countInDirection(
    point: Point,
    rowStep: number,
    colStep: number,
    side: OmokSideType
  ): number {
    const { row, col } = point;
    const board = this.board;

    let count = 0;

    let nextRow = row + rowStep;
    let nextCol = col + colStep;

    while (
      this.isWithinBoard({ row: nextRow, col: nextCol }) &&
      board[nextRow][nextCol] === side
    ) {
      count++;
      nextRow += rowStep;
      nextCol += colStep;
    }

    return count;
  }

  // =====================================================================
  // =====================================================================

  public getThreats(side: OmokSideType): Threat[] {
    const threats: Threat[] = [];
    const opponent = this.getOpponent(side);

    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.gameState.board[row][col] === 0) {
          const threat = this.analyzeThreat({ row, col }, side, opponent);
          if (threat) threats.push(threat);
        }
      }
    }

    return this.sortAndLimitThreats(threats);
  }

  private getOpponent(side: OmokSideType): OmokSideType {
    return side === OmokSide.BLACK ? OmokSide.WHITE : OmokSide.BLACK;
  }

  private sortAndLimitThreats(threats: Threat[]): Threat[] {
    const urgent = threats.filter(
      (t) => t.priority <= GAME_RULES.MIN_THREAT_PRIORITY
    );
    if (urgent.length > 0) {
      return urgent.sort((a, b) => a.priority - b.priority);
    }

    return threats
      .sort((a, b) => a.priority - b.priority)
      .slice(0, GAME_RULES.MAX_THREAT_COUNT);
  }

  // =====================================================================
  // =====================================================================

  private getMaxContinuous(point: Point, mySide: OmokSideType) {
    let max = 0;

    for (const [dr, dc] of DIRECTIONS) {
      const count = this.countStones(point, dr, dc, mySide);
      max = Math.max(max, count);
    }

    return max;
  }

  // =====================================================================
  // =====================================================================

  private isOverline(point: Point, side: OmokSideType): boolean {
    for (const [dr, dc] of DIRECTIONS) {
      const count = this.countStones(point, dr, dc, side);
      if (count > GAME_RULES.OVERLINE_LIMIT) {
        return true;
      }
    }
    return false;
  }

  private isDoubleThree(point: Point, side: OmokSideType): boolean {
    let openThreeCount = 0;

    for (const [dr, dc] of DIRECTIONS) {
      if (this.isOpenThree(point, dr, dc, side)) {
        openThreeCount++;
      }
    }
    return openThreeCount >= 2;
  }

  private isOpenThree(
    point: Point,
    dr: number,
    dc: number,
    side: OmokSideType
  ) {
    const count = this.countStones(point, dr, dc, side);
    const { row, col } = point;
    const board = this.board;

    if (count !== 3) return false;

    const forwardCount = this.countInDirection(point, dr, dc, side);
    const backwardCount = this.countInDirection(point, -dr, -dc, side);

    const headR = row + (forwardCount + 1) * dr;
    const headC = col + (forwardCount + 1) * dc;
    const tailR = row - (backwardCount + 1) * dr;
    const tailC = col - (backwardCount + 1) * dc;

    return (
      this.isWithinBoard({ row: headR, col: headC }) &&
      board[headR][headC] === 0 &&
      this.isWithinBoard({ row: tailR, col: tailC }) &&
      board[tailR][tailC] === 0
    );
  }

  private isDoubleFour(point: Point, side: OmokSideType): boolean {
    let fourCount = 0;

    for (const [dr, dc] of DIRECTIONS) {
      const count = this.countStones(point, dr, dc, side);
      if (count === 4) {
        fourCount++;
      }
    }

    return fourCount >= 2;
  }

  // =====================================================================
  // =====================================================================

  private isWithinBoard(point: Point): boolean {
    const { row, col } = point;

    const isRowValid = row >= 0 && row < this.size;
    const isColValid = col >= 0 && col < this.size;

    return isRowValid && isColValid;
  }

  public get board(): number[][] {
    return this.gameState.board;
  }

  public get size(): number {
    return this.gameState.size;
  }

  private static createEmptyBoard(size: number): number[][] {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }
}
