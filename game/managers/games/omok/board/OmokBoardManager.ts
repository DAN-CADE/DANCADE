// game/managers/games/Omok/OmokBoardManager.ts
import { BaseGameManager } from "@/game/managers/base/BaseGameManager";
import type { OmokManager } from "@/game/managers/games/omok/core/OmokManager";
import type { OmokBoardState } from "@/game/types/omok";
import { OmokBoardRenderer } from "@/game/managers/games/omok/board/renderers/OmokBoardRenderer";
import { OmokStoneRenderer } from "@/game/managers/games/omok/board/renderers/OmokStoneRenderer";
import { OmokForbiddenMarkerRenderer } from "@/game/managers/games/omok/board/renderers/OmokForbiddenMarkerRenderer";
import { OmokCoordinateConverter } from "@/game/managers/games/omok/board/utils/OmokCoordinateConverter";

/**
 * OmokBoardManager
 * - 오목 보드 관리의 중재자 역할
 * - 실제 렌더링은 각 렌더러에 위임
 * - 좌표 변환은 컨버터에 위임
 */
export class OmokBoardManager extends BaseGameManager<OmokBoardState> {
  private omokManager: OmokManager;

  // 렌더러들
  private boardRenderer: OmokBoardRenderer;
  private stoneRenderer: OmokStoneRenderer;
  private forbiddenMarkerRenderer: OmokForbiddenMarkerRenderer;

  // 좌표 변환기
  private coordinateConverter: OmokCoordinateConverter;

  constructor(scene: Phaser.Scene, omokManager: OmokManager) {
    super(
      scene,
      {
        stoneNumbers: [],
        forbiddenMarkers: [],
        moveCount: 0,
      },
      {}
    );

    this.omokManager = omokManager;

    // 좌표 변환기 초기화
    const { width, height } = this.scene.scale;
    this.coordinateConverter = new OmokCoordinateConverter(width, height);

    // 렌더러 초기화
    const { offsetX, offsetY } = this.coordinateConverter.getOffsets();
    this.boardRenderer = new OmokBoardRenderer(scene, offsetX, offsetY);
    this.stoneRenderer = new OmokStoneRenderer(scene);
    this.forbiddenMarkerRenderer = new OmokForbiddenMarkerRenderer(
      scene,
      omokManager
    );
  }

  // =====================================================================
  // 보드 렌더링
  // =====================================================================

  /**
   * 바둑판 렌더링
   */
  public renderBoard(): void {
    this.setGameObjects();
  }

  /**
   * 바둑판 그리기 (BaseGameManager 구현)
   */
  public setGameObjects(): void {
    this.boardRenderer.render();
  }

  // =====================================================================
  // 돌 렌더링
  // =====================================================================

  /**
   * 돌 렌더링
   * @param row - 행 (0~14)
   * @param col - 열 (0~14)
   * @param turn - 턴 (1: 흑, 2: 백)
   */
  public renderStone(row: number, col: number, turn: number): void {
    const { x, y } = this.coordinateConverter.gridToWorld(row, col);
    this.stoneRenderer.renderStone(x, y, turn);

    // 상태 동기화
    this.syncGameState();
  }

  /**
   * 복기용 수순 번호 표시
   */
  public showMoveNumbers(): void {
    this.stoneRenderer.showMoveNumbers();
  }

  // =====================================================================
  // 금수 마커
  // =====================================================================

  /**
   * 금수 마커 업데이트
   * @param currentTurn - 현재 턴
   * @param isGameStarted - 게임 시작 여부
   */
  public updateForbiddenMarkers(
    currentTurn: number,
    isGameStarted: boolean
  ): void {
    this.forbiddenMarkerRenderer.update(
      currentTurn,
      isGameStarted,
      (row, col) => this.coordinateConverter.gridToWorld(row, col)
    );

    // 상태 동기화
    this.syncGameState();
  }

  // =====================================================================
  // 좌표 변환
  // =====================================================================

  /**
   * 오프셋 재계산 (화면 크기 변경 시)
   */
  public calculateOffsets(): void {
    const { width, height } = this.scene.scale;
    this.coordinateConverter.calculateOffsets(width, height);

    // 보드 렌더러 오프셋 업데이트
    const { offsetX, offsetY } = this.coordinateConverter.getOffsets();
    this.boardRenderer.updateOffsets(offsetX, offsetY);
  }

  /**
   * 그리드 좌표 → 월드 좌표
   */
  public gridToWorld(row: number, col: number): { x: number; y: number } {
    return this.coordinateConverter.gridToWorld(row, col);
  }

  /**
   * 월드 좌표 → 그리드 좌표
   */
  public worldToGrid(x: number, y: number): { row: number; col: number } {
    return this.coordinateConverter.worldToGrid(x, y);
  }

  // =====================================================================
  // 게임 리셋
  // =====================================================================

  /**
   * 게임 리셋
   */
  public resetGame(): void {
    this.stoneRenderer.reset();
    this.forbiddenMarkerRenderer.clear();

    // 상태 초기화
    this.gameState.stoneNumbers = [];
    this.gameState.forbiddenMarkers = [];
    this.gameState.moveCount = 0;

    console.log("[OmokBoardManager] 보드 UI 초기화 완료");
  }

  // =====================================================================
  // 상태 동기화
  // =====================================================================

  /**
   * 렌더러 상태를 gameState에 동기화
   * (기존 코드와의 호환성 유지)
   */
  private syncGameState(): void {
    this.gameState.stoneNumbers = this.stoneRenderer.getStoneNumbers();
    this.gameState.forbiddenMarkers = this.forbiddenMarkerRenderer.getMarkers();
    this.gameState.moveCount = this.stoneRenderer.getMoveCount();
  }
}
