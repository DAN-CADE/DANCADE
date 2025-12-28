// game/managers/games/Omok/renderers/OmokBoardRenderer.ts
import { OMOK_CONFIG, STAR_POINTS } from "@/game/types/omok";

/**
 * OmokBoardRenderer
 * - 바둑판 렌더링만 담당
 * - 선, 화점 등 기본 보드 요소 그리기
 */
export class OmokBoardRenderer {
  private scene: Phaser.Scene;
  private boardOffsetX: number;
  private boardOffsetY: number;

  // UI 스타일 상수
  private readonly STYLE = {
    BOARD_LINE: { width: 2, color: 0x000000, alpha: 0.8 },
    STAR_POINT: { radius: 4, color: 0x000000 },
  } as const;

  constructor(scene: Phaser.Scene, boardOffsetX: number, boardOffsetY: number) {
    this.scene = scene;
    this.boardOffsetX = boardOffsetX;
    this.boardOffsetY = boardOffsetY;
  }

  // =====================================================================
  // Public API
  // =====================================================================

  /**
   * 바둑판 렌더링
   */
  public render(): void {
    const graphics = this.createGraphics();
    const totalSize = this.getBoardTotalSize();

    this.drawLines(graphics, totalSize);
    this.drawStarPoints(graphics);
  }

  /**
   * 오프셋 업데이트
   */
  public updateOffsets(offsetX: number, offsetY: number): void {
    this.boardOffsetX = offsetX;
    this.boardOffsetY = offsetY;
  }

  // =====================================================================
  // 렌더링 로직
  // =====================================================================

  /**
   * 그래픽 객체 생성
   */
  private createGraphics(): Phaser.GameObjects.Graphics {
    const { width, color, alpha } = this.STYLE.BOARD_LINE;
    return this.scene.add
      .graphics()
      .lineStyle(width, color, alpha)
      .setDepth(OMOK_CONFIG.DEPTH.BOARD);
  }

  /**
   * 보드 전체 크기 계산
   */
  private getBoardTotalSize(): number {
    return (OMOK_CONFIG.BOARD_SIZE - 1) * OMOK_CONFIG.CELL_SIZE;
  }

  /**
   * 선 그리기 (가로 + 세로)
   */
  private drawLines(
    graphics: Phaser.GameObjects.Graphics,
    totalSize: number
  ): void {
    // 가로선
    for (let i = 0; i < OMOK_CONFIG.BOARD_SIZE; i++) {
      const pos = i * OMOK_CONFIG.CELL_SIZE;
      graphics.lineBetween(
        this.boardOffsetX,
        this.boardOffsetY + pos,
        this.boardOffsetX + totalSize,
        this.boardOffsetY + pos
      );
    }

    // 세로선
    for (let i = 0; i < OMOK_CONFIG.BOARD_SIZE; i++) {
      const pos = i * OMOK_CONFIG.CELL_SIZE;
      graphics.lineBetween(
        this.boardOffsetX + pos,
        this.boardOffsetY,
        this.boardOffsetX + pos,
        this.boardOffsetY + totalSize
      );
    }
  }

  /**
   * 화점 그리기
   */
  private drawStarPoints(graphics: Phaser.GameObjects.Graphics): void {
    const { radius, color } = this.STYLE.STAR_POINT;
    graphics.fillStyle(color, 1);

    for (const { row, col } of STAR_POINTS) {
      const x = this.boardOffsetX + col * OMOK_CONFIG.CELL_SIZE;
      const y = this.boardOffsetY + row * OMOK_CONFIG.CELL_SIZE;
      graphics.fillCircle(x, y, radius);
    }
  }
}
