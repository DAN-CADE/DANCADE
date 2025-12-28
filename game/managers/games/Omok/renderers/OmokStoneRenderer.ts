// game/managers/games/Omok/renderers/OmokStoneRenderer.ts
import { OMOK_CONFIG } from "@/game/types/omok";

/**
 * 돌 정보
 */
interface StoneInfo {
  stoneColor: number;
  textColor: string;
}

/**
 * OmokStoneRenderer
 * - 돌과 수순 번호 렌더링만 담당
 */
export class OmokStoneRenderer {
  private scene: Phaser.Scene;
  private stoneNumbers: Phaser.GameObjects.Text[] = [];
  private moveCount = 0;

  // UI 스타일 상수
  private readonly STYLE = {
    STONE_BORDER: { width: 1, color: 0x888888 },
    MOVE_NUMBER: { size: "18px", highlightColor: "#ffcc00" },
  } as const;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // =====================================================================
  // Public API
  // =====================================================================

  /**
   * 돌 렌더링
   * @param x - 월드 x 좌표
   * @param y - 월드 y 좌표
   * @param turn - 턴 (1: 흑, 2: 백)
   */
  public renderStone(x: number, y: number, turn: number): void {
    const stoneInfo = this.getStoneInfo(turn);

    this.moveCount++;

    this.createStoneCircle(x, y, stoneInfo.stoneColor);
    this.createMoveNumber(x, y, stoneInfo.textColor);
  }

  /**
   * 수순 번호 표시
   */
  public showMoveNumbers(): void {
    const { highlightColor } = this.STYLE.MOVE_NUMBER;

    this.stoneNumbers.forEach((txt) => {
      txt.setVisible(true);
      txt.setColor(highlightColor);
      txt.setShadow(2, 2, "#000000", 2);
    });
  }

  /**
   * 리셋
   */
  public reset(): void {
    this.destroyStoneNumbers();
    this.moveCount = 0;
  }

  /**
   * 수순 번호 배열 반환
   */
  public getStoneNumbers(): Phaser.GameObjects.Text[] {
    return this.stoneNumbers;
  }

  /**
   * 현재 수 개수 반환
   */
  public getMoveCount(): number {
    return this.moveCount;
  }

  // =====================================================================
  // Private 렌더링 로직
  // =====================================================================

  /**
   * 돌 정보 결정 (색상, 텍스트 색상)
   */
  private getStoneInfo(turn: number): StoneInfo {
    return turn === 1
      ? {
          stoneColor: OMOK_CONFIG.COLORS.BLACK,
          textColor: "#ffffff",
        }
      : {
          stoneColor: OMOK_CONFIG.COLORS.WHITE,
          textColor: "#000000",
        };
  }

  /**
   * 돌 원 생성
   */
  private createStoneCircle(x: number, y: number, color: number): void {
    const { width, color: borderColor } = this.STYLE.STONE_BORDER;

    this.scene.add
      .circle(x, y, OMOK_CONFIG.STONE_RADIUS, color)
      .setStrokeStyle(width, borderColor)
      .setDepth(OMOK_CONFIG.DEPTH.STONE);
  }

  /**
   * 수순 번호 텍스트 생성 (처음엔 숨김)
   */
  private createMoveNumber(x: number, y: number, textColor: string): void {
    const { size } = this.STYLE.MOVE_NUMBER;

    const numText = this.scene.add
      .text(x, y, this.moveCount.toString(), {
        fontSize: size,
        color: textColor,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(OMOK_CONFIG.DEPTH.STONE + 1)
      .setVisible(false);

    this.stoneNumbers.push(numText);
  }

  /**
   * 수순 번호 제거
   */
  private destroyStoneNumbers(): void {
    this.stoneNumbers.forEach((n) => n.destroy());
    this.stoneNumbers = [];
  }
}
