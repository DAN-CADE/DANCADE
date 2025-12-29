// game/managers/games/Omok/OmokUIManager.ts
import { BaseGameManager } from "@/game/managers/base/BaseGameManager";
import { OmokModeSelectionRenderer } from "@/game/managers/games/omok/ui/OmokModeSelectionRenderer";
import { OmokPlayerProfileRenderer } from "@/game/managers/games/omok/ui/OmokPlayerProfileRenderer";
import { OmokMessageRenderer } from "@/game/managers/games/omok/ui/OmokMessageRenderer";
import { OmokEndGameRenderer } from "@/game/managers/games/omok/ui/OmokEndGameRenderer";
import type { OmokUIState, OmokMode } from "@/game/types/omok";

/**
 * OmokUIManager
 * - UI 렌더러들을 조합하여 관리
 * - 실제 렌더링은 각 렌더러에 위임
 */
export class OmokUIManager extends BaseGameManager<OmokUIState> {
  // 렌더러들
  private modeSelectionRenderer: OmokModeSelectionRenderer;
  private profileRenderer: OmokPlayerProfileRenderer;
  private messageRenderer: OmokMessageRenderer;
  private endGameRenderer: OmokEndGameRenderer;

  constructor(scene: Phaser.Scene) {
    super(scene, {
      modeSelectionContainer: undefined,
      forbiddenText: undefined,
    });

    // 렌더러 초기화
    this.modeSelectionRenderer = new OmokModeSelectionRenderer(scene);
    this.profileRenderer = new OmokPlayerProfileRenderer(scene);
    this.messageRenderer = new OmokMessageRenderer(scene);
    this.endGameRenderer = new OmokEndGameRenderer(scene);
  }

  // =====================================================================
  // BaseGameManager 구현
  // =====================================================================

  public setGameObjects(): void {
    // UI 매니저는 게임 오브젝트를 직접 설정하지 않음
  }

  public resetGame(): void {
    this.modeSelectionRenderer.clear();
    this.profileRenderer.clearProfiles();
    this.messageRenderer.clearMessage();
    this.endGameRenderer.clear();

    // 레거시 상태 초기화
    this.gameState.modeSelectionContainer = undefined;
    this.gameState.forbiddenText = undefined;
  }

  // =====================================================================
  // 모드 선택
  // =====================================================================

  /**
   * 모드 선택 UI 표시
   * @param onSelect - 모드 선택 콜백
   */
  public showModeSelection(onSelect: (mode: OmokMode) => void): void {
    this.modeSelectionRenderer.show(onSelect);
  }

  // =====================================================================
  // 플레이어 프로필
  // =====================================================================

  /**
   * 플레이어 프로필 생성
   * @param mode - 게임 모드
   * @param myColor - 온라인 모드일 때 내 돌 색깔
   */
  public createPlayerProfiles(mode: OmokMode, myColor?: number): void {
    this.profileRenderer.createProfiles(mode, myColor);
  }

  /**
   * 턴 UI 업데이트
   * @param currentTurn - 현재 턴 (1: 흑, 2: 백)
   */
  public updateTurnUI(currentTurn: number): void {
    this.profileRenderer.updateTurn(currentTurn);
  }

  // =====================================================================
  // 메시지
  // =====================================================================

  /**
   * 금수 메시지 표시
   * @param message - 표시할 메시지
   */
  public showForbiddenMessage(message: string): void {
    this.messageRenderer.showForbiddenMessage(message);
  }

  /**
   * 대기 메시지 표시
   * @param message - 표시할 메시지
   */
  public showWaitingMessage(message: string): void {
    this.messageRenderer.showWaitingMessage(message);
  }

  /**
   * 메시지 제거
   */
  public clearMessage(): void {
    this.messageRenderer.clearMessage();
  }

  /**
   * 대기 메시지 숨김 (레거시 호환)
   */
  public hideWaitingMessage(): void {
    this.messageRenderer.clearMessage();
  }

  // =====================================================================
  // 게임 종료
  // =====================================================================

  /**
   * 게임 종료 UI 표시
   * @param winnerName - 승자 이름
   * @param onRestart - 재시작 콜백
   * @param onExit - 나가기 콜백
   */
  public showEndGameUI(
    winnerName: string,
    onRestart: () => void,
    onExit: () => void
  ): void {
    this.endGameRenderer.show(winnerName, onRestart, onExit);
  }

  // =====================================================================
  // 정리
  // =====================================================================

  /**
   * 모든 UI 정리
   */
  public cleanup(): void {
    this.resetGame();
    console.log("[OmokUIManager] UI 정리 완료");
  }
}
