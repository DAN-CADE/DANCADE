// game/managers/games/Omok/utils/OmokCoordinateConverter.ts
import { OMOK_CONFIG } from "@/game/types/omok";

/**
 * 좌표 정보
 */
export interface Coordinate {
  x: number;
  y: number;
}

export interface GridPosition {
  row: number;
  col: number;
}

/**
 * OmokCoordinateConverter
 * - 그리드 좌표 ↔ 월드 좌표 변환만 담당
 * - 오프셋 계산 및 관리
 */
export class OmokCoordinateConverter {
  private boardOffsetX = 0;
  private boardOffsetY = 0;

  constructor(sceneWidth: number, sceneHeight: number) {
    this.calculateOffsets(sceneWidth, sceneHeight);
  }

  // =====================================================================
  // Public API
  // =====================================================================

  /**
   * 오프셋 계산
   */
  public calculateOffsets(sceneWidth: number, sceneHeight: number): void {
    const boardTotalSize = this.getBoardTotalSize();

    this.boardOffsetX = (sceneWidth - boardTotalSize) / 2;
    this.boardOffsetY = (sceneHeight - boardTotalSize) / 2;
  }

  /**
   * 그리드 좌표 → 월드 좌표
   * @param row - 행 (0~14)
   * @param col - 열 (0~14)
   * @returns 월드 좌표 {x, y}
   */
  public gridToWorld(row: number, col: number): Coordinate {
    return {
      x: this.boardOffsetX + col * OMOK_CONFIG.CELL_SIZE,
      y: this.boardOffsetY + row * OMOK_CONFIG.CELL_SIZE,
    };
  }

  /**
   * 월드 좌표 → 그리드 좌표
   * @param x - 월드 x 좌표
   * @param y - 월드 y 좌표
   * @returns 그리드 좌표 {row, col}
   */
  public worldToGrid(x: number, y: number): GridPosition {
    return {
      col: Math.round((x - this.boardOffsetX) / OMOK_CONFIG.CELL_SIZE),
      row: Math.round((y - this.boardOffsetY) / OMOK_CONFIG.CELL_SIZE),
    };
  }

  /**
   * 보드 오프셋 반환
   */
  public getOffsets(): { offsetX: number; offsetY: number } {
    return {
      offsetX: this.boardOffsetX,
      offsetY: this.boardOffsetY,
    };
  }

  /**
   * 보드 X 오프셋 반환
   */
  public getOffsetX(): number {
    return this.boardOffsetX;
  }

  /**
   * 보드 Y 오프셋 반환
   */
  public getOffsetY(): number {
    return this.boardOffsetY;
  }

  // =====================================================================
  // Private 헬퍼
  // =====================================================================

  /**
   * 보드 전체 크기 계산
   */
  private getBoardTotalSize(): number {
    return (OMOK_CONFIG.BOARD_SIZE - 1) * OMOK_CONFIG.CELL_SIZE;
  }
}
