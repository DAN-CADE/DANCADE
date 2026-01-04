import { OMOK_CONFIG, STAR_POINTS } from "@/game/types/omok";

export class OmokBoardRenderer {
  private scene: Phaser.Scene;
  private boardOffsetX: number;
  private boardOffsetY: number;
  private graphics: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, boardOffsetX: number, boardOffsetY: number) {
    this.scene = scene;
    this.boardOffsetX = boardOffsetX;
    this.boardOffsetY = boardOffsetY;
  }

  // =====================================================================
  // =====================================================================

  public clear(): void {
    this.graphics?.clear();
  }

  // =====================================================================
  // =====================================================================

  public render(): void {
    this.prepareGraphics();

    const totalSize = this.getBoardTotalSize();

    this.drawLines(totalSize);
    this.drawStarPoints();
  }

  public updateOffsets(offsetX: number, offsetY: number): void {
    this.boardOffsetX = offsetX;
    this.boardOffsetY = offsetY;
  }

  // =====================================================================
  // =====================================================================

  private prepareGraphics(): void {
    if (!this.graphics) {
      this.graphics = this.scene.add.graphics();
    }

    this.graphics.clear();

    const { WIDTH, COLOR, ALPHA } = OMOK_CONFIG.BOARD_STYLE.LINE;
    const { BOARD: depth } = OMOK_CONFIG.DEPTH;
    this.graphics.lineStyle(WIDTH, COLOR, ALPHA).setDepth(depth);
  }

  private getBoardTotalSize(): number {
    const { SIZE, CELL_SIZE } = OMOK_CONFIG.BOARD_STYLE.BOARD;

    return (SIZE - 1) * CELL_SIZE;
  }

  private drawLines(totalSize: number): void {
    if (!this.graphics) return;

    const { SIZE, CELL_SIZE } = OMOK_CONFIG.BOARD_STYLE.BOARD;

    for (let i = 0; i < SIZE; i++) {
      const pos = i * CELL_SIZE;

      this.graphics.lineBetween(
        this.boardOffsetX, // x1
        this.boardOffsetY + pos, // y1
        this.boardOffsetX + totalSize, // x2
        this.boardOffsetY + pos // y2
      );

      this.graphics.lineBetween(
        this.boardOffsetX + pos, // x1
        this.boardOffsetY, // y1
        this.boardOffsetX + pos, // x2
        this.boardOffsetY + totalSize // y2
      );
    }
  }

  private drawStarPoints(): void {
    if (!this.graphics) return;

    const { RADIUS, COLOR } = OMOK_CONFIG.BOARD_STYLE.STAR_POINT;
    const { CELL_SIZE } = OMOK_CONFIG.BOARD_STYLE.BOARD;

    this.graphics.fillStyle(COLOR, 1);

    for (const { row, col } of STAR_POINTS) {
      const x = this.boardOffsetX + col * CELL_SIZE;
      const y = this.boardOffsetY + row * CELL_SIZE;

      this.graphics.fillCircle(x, y, RADIUS);
    }
  }
}
