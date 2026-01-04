import { OmokManager } from "@/game/managers/games/omok/core/OmokManager";
import {
  OmokSideType,
  OmokSide,
  Point,
  Coordinate,
  OMOK_CONFIG,
} from "@/game/types/omok";

export class OmokForbiddenMarkerRenderer {
  private scene: Phaser.Scene;
  private omokManager: OmokManager;
  private markers: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, omokManager: OmokManager) {
    this.scene = scene;
    this.omokManager = omokManager;
  }

  // =====================================================================
  // =====================================================================

  public clear(): void {
    this.markers.forEach((marker) => marker.destroy());
    this.markers = [];
  }

  // =====================================================================
  // =====================================================================

  private shouldShow(
    currentTurn: OmokSideType,
    isGameStarted: boolean
  ): boolean {
    return currentTurn === OmokSide.BLACK && isGameStarted;
  }

  public renderForbiddenMarkers(
    currentTurn: OmokSideType,
    isGameStarted: boolean,
    gridToWorld: (point: Point) => Coordinate
  ): void {
    this.clear();

    if (!this.shouldShow(currentTurn, isGameStarted)) return;

    const board = this.omokManager.board;
    const size = this.omokManager.size;
    if (!board) return;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (board[row][col] === OmokSide.NONE) {
          const point = { row, col };
          const { can } = this.omokManager.checkForbidden(
            point,
            OmokSide.BLACK
          );

          if (!can) {
            const coordinate = gridToWorld(point);
            this.createMarker(coordinate);
          }
        }
      }
    }
  }

  private createMarker(coordinate: Coordinate): void {
    const { x, y } = coordinate;
    const { SIZE, COLOR, ALPHA } = OMOK_CONFIG.BOARD_STYLE.FORBIDDEN;
    const depth = OMOK_CONFIG.DEPTH.FORBIDDEN_MARKER + 1;

    const marker = this.scene.add
      .text(x, y, "x", {
        fontSize: SIZE,
        color: COLOR,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(depth)
      .setAlpha(ALPHA);

    this.markers.push(marker);
  }
}
