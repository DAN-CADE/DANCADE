import { COMMON_COLORS } from "@/game/types/common/ui.constants";
import {
  Coordinate,
  OMOK_CONFIG,
  OmokSide,
  OmokSideType,
} from "@/game/types/omok";
import { StoneInfo } from "@/game/types/omok";

export class OmokStoneRenderer {
  private scene: Phaser.Scene;
  private stones: Phaser.GameObjects.Arc[] = [];
  private stoneNumbers: Phaser.GameObjects.Text[] = [];

  private readonly STYLES: Record<OmokSideType, StoneInfo> = {
    [OmokSide.BLACK]: { stoneColor: COMMON_COLORS.BLACK, textColor: "#ffffff" },
    [OmokSide.WHITE]: { stoneColor: COMMON_COLORS.WHITE, textColor: "#000000" },
    [OmokSide.NONE]: { stoneColor: 0, textColor: "transparent" },
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // =====================================================================
  // =====================================================================

  public clear(): void {
    this.clearRenderedObjects();
  }

  // =====================================================================
  // =====================================================================

  public renderStone(
    coordinate: Coordinate,
    turn: OmokSideType,
    moveNumber: number
  ): void {
    const stoneInfo = this.STYLES[turn];

    this.createStoneCircle(coordinate, stoneInfo.stoneColor);
    this.createMoveNumber(coordinate, moveNumber, stoneInfo.textColor);
  }

  public showMoveNumbers(): void {
    const { HIGHLIGHT_COLOR } = OMOK_CONFIG.BOARD_STYLE.MOVE_NUMBER;

    this.stoneNumbers.forEach((txt) => {
      txt.setVisible(true);
      txt.setColor(HIGHLIGHT_COLOR);
      txt.setShadow(2, 2, "#000000", 2);
    });
  }

  // =====================================================================
  // =====================================================================

  private createStoneCircle(coordinate: Coordinate, color: number): void {
    const { BORDER_WIDTH, BORDER_COLOR, RADIUS } =
      OMOK_CONFIG.BOARD_STYLE.STONE;
    const { STONE: depth } = OMOK_CONFIG.DEPTH;
    const { x, y } = coordinate;

    const stone = this.scene.add
      .circle(x, y, RADIUS, color)
      .setStrokeStyle(BORDER_WIDTH, BORDER_COLOR)
      .setDepth(depth);

    this.stones.push(stone);
  }

  private createMoveNumber(
    coordinate: Coordinate,
    moveNumber: number,
    textColor: string
  ): void {
    const { SIZE } = OMOK_CONFIG.BOARD_STYLE.MOVE_NUMBER;
    const { x, y } = coordinate;
    const { STONE_NUMBER: depth } = OMOK_CONFIG.DEPTH;

    const numText = this.scene.add
      .text(x, y, moveNumber.toString(), {
        fontSize: SIZE,
        color: textColor,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(depth)
      .setVisible(false);

    this.stoneNumbers.push(numText);
  }

  // =====================================================================
  // =====================================================================

  private clearRenderedObjects(): void {
    this.stones.forEach((stone) => stone.destroy());
    this.stoneNumbers.forEach((stoneNumber) => stoneNumber.destroy());

    this.stones = [];
    this.stoneNumbers = [];
  }
}
