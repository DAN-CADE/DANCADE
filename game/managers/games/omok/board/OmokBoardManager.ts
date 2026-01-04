import { OmokManager } from "@/game/managers/games/omok/core/OmokManager";
import { OmokBoardRenderer } from "@/game/managers/games/omok/board/renderers/OmokBoardRenderer";
import { OmokStoneRenderer } from "@/game/managers/games/omok/board/renderers/OmokStoneRenderer";
import { OmokForbiddenMarkerRenderer } from "@/game/managers/games/omok/board/renderers/OmokForbiddenMarkerRenderer";
import { OmokCoordinateConverter } from "@/game/managers/games/omok/board/utils/OmokCoordinateConverter";
import { Coordinate, OmokSideType, Point } from "@/game/types/omok";

export class OmokBoardManager {
  private scene: Phaser.Scene;
  private omokManager: OmokManager;

  private boardRenderer: OmokBoardRenderer;
  private stoneRenderer: OmokStoneRenderer;
  private forbiddenMarkerRenderer: OmokForbiddenMarkerRenderer;
  private coordinateConverter: OmokCoordinateConverter;

  constructor(scene: Phaser.Scene, omokManager: OmokManager) {
    this.scene = scene;
    this.omokManager = omokManager;

    const { width, height } = scene.scale;
    this.coordinateConverter = new OmokCoordinateConverter(width, height);

    const { offsetX, offsetY } = this.coordinateConverter.getOffsets();
    this.boardRenderer = new OmokBoardRenderer(scene, offsetX, offsetY);
    this.stoneRenderer = new OmokStoneRenderer(scene);
    this.forbiddenMarkerRenderer = new OmokForbiddenMarkerRenderer(
      scene,
      omokManager
    );
  }

  // =====================================================================
  // =====================================================================

  public clear(): void {
    this.stoneRenderer.clear();
    this.forbiddenMarkerRenderer.clear();
  }

  // =====================================================================
  // =====================================================================

  public renderBoard(): void {
    this.boardRenderer.render();
  }

  public renderStoneAtGrid(
    point: Point,
    turn: OmokSideType,
    moveNumber: number
  ): void {
    const coordinate = this.getPixelCoordinate(point);
    this.stoneRenderer.renderStone(coordinate, turn, moveNumber);
  }

  public displayMoveSequence(): void {
    this.stoneRenderer.showMoveNumbers();
  }

  // =====================================================================
  // =====================================================================

  public updateForbiddenMarkers(
    currentTurn: OmokSideType,
    isGameStarted: boolean
  ): void {
    this.forbiddenMarkerRenderer.renderForbiddenMarkers(
      currentTurn,
      isGameStarted,
      (point) => this.getPixelCoordinate(point)
    );
  }

  // =====================================================================
  // =====================================================================

  public updateLayout(width: number, height: number): void {
    this.coordinateConverter.calculateOffsets(width, height);

    const { offsetX, offsetY } = this.coordinateConverter.getOffsets();
    this.boardRenderer.updateOffsets(offsetX, offsetY);
    this.boardRenderer.render();
  }

  // =====================================================================
  // =====================================================================

  public getPixelCoordinate(point: Point): Coordinate {
    return this.coordinateConverter.toScreenPosition(point);
  }

  public getGridIndex(coordinate: Coordinate): Point {
    return this.coordinateConverter.toBoardPoint(coordinate);
  }
}
