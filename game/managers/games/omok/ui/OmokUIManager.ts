import { OmokModeSelectionRenderer } from "@/game/managers/games/omok/ui/renderers/OmokModeSelectionRenderer";
import { OmokPlayerProfileRenderer } from "@/game/managers/games/omok/ui/renderers/OmokPlayerProfileRenderer";
import { OmokMessageRenderer } from "@/game/managers/games/omok/ui/renderers/OmokMessageRenderer";
import { OmokEndGameRenderer } from "@/game/managers/games/omok/ui/renderers/OmokEndGameRenderer";
import { OmokMode, OmokSideType } from "@/game/types/omok";

export class OmokUIManager {
  private modeSelectionRenderer: OmokModeSelectionRenderer;
  private profileRenderer: OmokPlayerProfileRenderer;
  private messageRenderer: OmokMessageRenderer;
  private endGameRenderer: OmokEndGameRenderer;

  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.modeSelectionRenderer = new OmokModeSelectionRenderer(scene);
    this.profileRenderer = new OmokPlayerProfileRenderer(scene);
    this.messageRenderer = new OmokMessageRenderer(scene);
    this.endGameRenderer = new OmokEndGameRenderer(scene);
  }

  // =====================================================================
  // =====================================================================

  public clear(): void {
    this.modeSelectionRenderer.cleanup();
    this.profileRenderer.clear();
    this.messageRenderer.clear();
  }

  // =====================================================================
  // =====================================================================

  public showModeSelection(onSelect: (mode: OmokMode) => void): void {
    this.modeSelectionRenderer.show(onSelect);
  }

  // =====================================================================
  // =====================================================================

  public createPlayerProfiles(mode: OmokMode, mySide: OmokSideType): void {
    this.profileRenderer.render(mode, mySide);
  }

  public updateTurnUI(currentTurn: OmokSideType): void {
    this.profileRenderer.updateTurn(currentTurn);
  }

  // =====================================================================
  // =====================================================================

  public showForbiddenMessage(message: string): void {
    this.messageRenderer.showForbiddenMessage(message);
  }

  public showWaitingMessage(message: string): void {
    this.messageRenderer.showWaitingMessage(message);
  }

  // =====================================================================
  // =====================================================================

  public showEndGameUI(
    winner: string,
    onRestart: () => void,
    onExit: () => void
  ): void {
    this.endGameRenderer.show(winner, onRestart, onExit);
  }
}
