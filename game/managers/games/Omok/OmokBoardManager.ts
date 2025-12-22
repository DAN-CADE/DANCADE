// game/managers/games/Omok/OmokBoardManager.ts
import { BaseGameManager } from "@/game/managers/base/BaseGameManager";
import { OmokManager } from "./OmokManager";
import { OMOK_CONFIG, OmokBoardState } from "@/game/types/realOmok";

export class OmokBoardManager extends BaseGameManager<OmokBoardState> {
  private boardOffsetX: number = 0;
  private boardOffsetY: number = 0;
  private omokManager: OmokManager;

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
    this.calculateOffsets();
  }

  // 1. 초기 오프셋 계산
  public calculateOffsets(): void {
    const { width, height } = this.scene.scale;
    const boardTotalSize = (OMOK_CONFIG.BOARD_SIZE - 1) * OMOK_CONFIG.CELL_SIZE;
    this.boardOffsetX = (width - boardTotalSize) / 2;
    this.boardOffsetY = (height - boardTotalSize) / 2;
  }

  // 2. BaseGameManager 추상 메서드 구현: 바둑판 그리기
  public setGameObjects(): void {
    const graphics = this.scene.add.graphics().lineStyle(2, 0x000000, 0.8);
    const totalSize = (OMOK_CONFIG.BOARD_SIZE - 1) * OMOK_CONFIG.CELL_SIZE;

    // 가로선 그리기
    for (let i = 0; i < OMOK_CONFIG.BOARD_SIZE; i++) {
      const pos = i * OMOK_CONFIG.CELL_SIZE;
      graphics.lineBetween(
        this.boardOffsetX,
        this.boardOffsetY + pos,
        this.boardOffsetX + totalSize,
        this.boardOffsetY + pos
      );
    }

    // 세로선 그리기
    for (let i = 0; i < OMOK_CONFIG.BOARD_SIZE; i++) {
      const pos = i * OMOK_CONFIG.CELL_SIZE;
      graphics.lineBetween(
        this.boardOffsetX + pos,
        this.boardOffsetY,
        this.boardOffsetX + pos,
        this.boardOffsetY + totalSize
      );
    }

    // 화점 그리기 (선택사항)
    this.drawStarPoints(graphics);
  }

  // 화점(星) 그리기 - 오목판 기준점
  private drawStarPoints(graphics: Phaser.GameObjects.Graphics): void {
    const starPoints = [
      [3, 3],
      [3, 11],
      [11, 3],
      [11, 11],
      [7, 7],
    ];

    graphics.fillStyle(0x000000, 1);
    for (const [row, col] of starPoints) {
      const { x, y } = this.gridToWorld(row, col);
      graphics.fillCircle(x, y, 4);
    }
  }

  // 3. 돌 렌더링
  public renderStone(row: number, col: number, turn: number): void {
    const { x, y } = this.gridToWorld(row, col);
    const color =
      turn === 1 ? OMOK_CONFIG.COLORS.BLACK : OMOK_CONFIG.COLORS.WHITE;
    const textColor = turn === 1 ? "#ffffff" : "#000000";

    this.gameState.moveCount++;

    // 돌 그리기
    this.scene.add
      .circle(x, y, OMOK_CONFIG.STONE_RADIUS, color)
      .setStrokeStyle(1, 0x888888)
      .setDepth(OMOK_CONFIG.DEPTH.STONE);

    // 수순 텍스트 (처음엔 숨김)
    const numText = this.scene.add
      .text(x, y, this.gameState.moveCount.toString(), {
        fontSize: "18px",
        color: textColor,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(OMOK_CONFIG.DEPTH.STONE + 1)
      .setVisible(false);

    this.gameState.stoneNumbers.push(numText);
  }

  // 4. 금수 마커 업데이트 (최적화: 흑돌 턴일 때만)
  public updateForbiddenMarkers(
    currentTurn: number,
    isGameStarted: boolean
  ): void {
    // 기존 마커 제거
    this.gameState.forbiddenMarkers.forEach((marker) => marker.destroy());
    this.gameState.forbiddenMarkers = [];

    // 흑돌(1) 턴이고 게임이 시작된 경우만 금수 체크
    if (currentTurn !== 1 || !isGameStarted) return;

    const board = this.omokManager.getBoardState();
    if (!board || board.length === 0) return;

    // 빈 칸만 체크하여 성능 최적화
    for (let r = 0; r < OMOK_CONFIG.BOARD_SIZE; r++) {
      if (!board[r]) continue;
      for (let c = 0; c < OMOK_CONFIG.BOARD_SIZE; c++) {
        if (board[r][c] !== 0) continue;

        const check = this.omokManager.checkForbidden(r, c, 1);
        if (!check.can) {
          const { x, y } = this.gridToWorld(r, c);
          const marker = this.scene.add
            .text(x, y, "✕", {
              fontSize: "20px",
              color: "#ff3333",
              fontStyle: "bold",
            })
            .setOrigin(0.5)
            .setDepth(OMOK_CONFIG.DEPTH.BOARD + 1)
            .setAlpha(0.6);

          this.gameState.forbiddenMarkers.push(marker);
        }
      }
    }
  }

  // 5. 게임 리셋
  public resetGame(): void {
    this.gameState.stoneNumbers.forEach((n) => n.destroy());
    this.gameState.forbiddenMarkers.forEach((m) => m.destroy());
    this.gameState.stoneNumbers = [];
    this.gameState.forbiddenMarkers = [];
    this.gameState.moveCount = 0;
  }

  // 6. 좌표 변환 유틸리티
  public gridToWorld(row: number, col: number): { x: number; y: number } {
    return {
      x: this.boardOffsetX + col * OMOK_CONFIG.CELL_SIZE,
      y: this.boardOffsetY + row * OMOK_CONFIG.CELL_SIZE,
    };
  }

  public worldToGrid(x: number, y: number): { row: number; col: number } {
    return {
      col: Math.round((x - this.boardOffsetX) / OMOK_CONFIG.CELL_SIZE),
      row: Math.round((y - this.boardOffsetY) / OMOK_CONFIG.CELL_SIZE),
    };
  }

  // 복기용 숫자 보이기
  public showMoveNumbers(): void {
    this.gameState.stoneNumbers.forEach((txt) => {
      txt.setVisible(true);
      txt.setColor("#ffcc00");
      txt.setShadow(2, 2, "#000000", 2);
    });
  }
}
