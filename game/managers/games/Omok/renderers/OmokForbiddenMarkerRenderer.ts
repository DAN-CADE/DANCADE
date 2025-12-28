// game/managers/games/Omok/renderers/OmokForbiddenMarkerRenderer.ts
import { OMOK_CONFIG } from "@/game/types/omok";
import type { OmokManager } from "../OmokManager";

/**
 * OmokForbiddenMarkerRenderer
 * - 금수 위치 마커 렌더링만 담당
 */
export class OmokForbiddenMarkerRenderer {
  private scene: Phaser.Scene;
  private omokManager: OmokManager;
  private markers: Phaser.GameObjects.Text[] = [];

  // UI 스타일 상수
  private readonly STYLE = {
    FORBIDDEN_MARKER: { size: "20px", color: "#ff3333", alpha: 0.6 },
  } as const;

  constructor(scene: Phaser.Scene, omokManager: OmokManager) {
    this.scene = scene;
    this.omokManager = omokManager;
  }

  // =====================================================================
  // Public API
  // =====================================================================

  /**
   * 금수 마커 업데이트
   * @param currentTurn - 현재 턴
   * @param isGameStarted - 게임 시작 여부
   * @param gridToWorld - 그리드→월드 좌표 변환 함수
   */
  public update(
    currentTurn: number,
    isGameStarted: boolean,
    gridToWorld: (row: number, col: number) => { x: number; y: number }
  ): void {
    this.clear();

    // 흑돌 턴이고 게임 시작된 경우만 표시
    if (!this.shouldShow(currentTurn, isGameStarted)) {
      return;
    }

    this.render(gridToWorld);
  }

  /**
   * 금수 마커 전체 제거
   */
  public clear(): void {
    this.markers.forEach((marker) => marker.destroy());
    this.markers = [];
  }

  /**
   * 마커 배열 반환
   */
  public getMarkers(): Phaser.GameObjects.Text[] {
    return this.markers;
  }

  // =====================================================================
  // Private 로직
  // =====================================================================

  /**
   * 금수 마커를 표시할지 결정
   */
  private shouldShow(currentTurn: number, isGameStarted: boolean): boolean {
    return currentTurn === 1 && isGameStarted;
  }

  /**
   * 금수 마커 렌더링
   */
  private render(
    gridToWorld: (row: number, col: number) => { x: number; y: number }
  ): void {
    const board = this.omokManager.getBoardState();
    if (!board || board.length === 0) return;

    for (let r = 0; r < OMOK_CONFIG.BOARD_SIZE; r++) {
      if (!board[r]) continue;

      for (let c = 0; c < OMOK_CONFIG.BOARD_SIZE; c++) {
        if (board[r][c] === 0) {
          this.checkAndMark(r, c, gridToWorld);
        }
      }
    }
  }

  /**
   * 금수 위치 체크 및 마킹
   */
  private checkAndMark(
    row: number,
    col: number,
    gridToWorld: (row: number, col: number) => { x: number; y: number }
  ): void {
    const check = this.omokManager.checkForbidden(row, col, 1);

    if (!check.can) {
      this.createMarker(row, col, gridToWorld);
    }
  }

  /**
   * 금수 마커 생성
   */
  private createMarker(
    row: number,
    col: number,
    gridToWorld: (row: number, col: number) => { x: number; y: number }
  ): void {
    const { x, y } = gridToWorld(row, col);
    const { size, color, alpha } = this.STYLE.FORBIDDEN_MARKER;

    const marker = this.scene.add
      .text(x, y, "✕", {
        fontSize: size,
        color: color,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(OMOK_CONFIG.DEPTH.BOARD + 1)
      .setAlpha(alpha);

    this.markers.push(marker);
  }
}
