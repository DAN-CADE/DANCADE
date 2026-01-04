import { OMOK_CONFIG } from "@/game/types/omok";
import { Coordinate, Point } from "@/game/types/omok/omok.types";

export class OmokCoordinateConverter {
  private boardOffsetX = 0;
  private boardOffsetY = 0;

  constructor(sceneWidth: number, sceneHeight: number) {
    this.calculateOffsets(sceneWidth, sceneHeight);
  }

  // =====================================================================
  // =====================================================================

  public calculateOffsets(sceneWidth: number, sceneHeight: number): void {
    const boardTotalSize = this.getBoardTotalSize();

    this.boardOffsetX = (sceneWidth - boardTotalSize) / 2;
    this.boardOffsetY = (sceneHeight - boardTotalSize) / 2;
  }

  public toScreenPosition(point: Point): Coordinate {
    const { CELL_SIZE } = OMOK_CONFIG.BOARD_STYLE.BOARD;

    return {
      x: this.boardOffsetX + point.col * CELL_SIZE,
      y: this.boardOffsetY + point.row * CELL_SIZE,
    };
  }

  public toBoardPoint(coordinate: Coordinate): Point {
    const { CELL_SIZE, SIZE } = OMOK_CONFIG.BOARD_STYLE.BOARD;

    let col = Math.round((coordinate.x - this.boardOffsetX) / CELL_SIZE);
    let row = Math.round((coordinate.y - this.boardOffsetY) / CELL_SIZE);

    col = Math.max(0, Math.min(SIZE - 1, col));
    row = Math.max(0, Math.min(SIZE - 1, row));

    return {
      col,
      row,
    };
  }

  // =====================================================================
  // =====================================================================

  public getOffsets(): { offsetX: number; offsetY: number } {
    return {
      offsetX: this.boardOffsetX,
      offsetY: this.boardOffsetY,
    };
  }

  public getBoardTotalSize(): number {
    const { SIZE, CELL_SIZE } = OMOK_CONFIG.BOARD_STYLE.BOARD;
    return (SIZE - 1) * CELL_SIZE;
  }
}
