// game/managers/global/UIManager.ts
// 통합 UI 매니저 - 개별 UI 매니저들을 조합

import { MainScene } from "@/game/scenes/core/MainScene";
import { AvatarManager } from "./AvatarManager";
import { NoticeUIManager } from "./ui/NoticeUIManager";
import { RPSGameUIManager, Choice } from "./ui/RPSGameUIManager";
import { ChoseongUIManager } from "./ui/ChoseongUIManager";
import { RankingUIManager } from "./ui/RankingUIManager";

export { Choice } from "./ui/RPSGameUIManager";

export class UIManager {
  private scene: MainScene;

  // 개별 UI 매니저들
  private noticeUI: NoticeUIManager;
  private rpsGameUI: RPSGameUIManager;
  private choseongUI: ChoseongUIManager;
  private rankingUI: RankingUIManager;

  constructor(scene: MainScene) {
    this.scene = scene;

    // UI 매니저 초기화
    this.noticeUI = new NoticeUIManager(scene);
    this.rpsGameUI = new RPSGameUIManager(scene);
    this.choseongUI = new ChoseongUIManager(scene);
    this.rankingUI = new RankingUIManager(scene);
  }

  // ============================================================
  // 공지 UI
  // ============================================================

  public showNotice(message: string, duration?: number): void {
    this.noticeUI.showNotice(message, duration);
  }

  // ============================================================
  // 가위바위보 게임 UI
  // ============================================================

  public createGameUI(): void {
    this.rpsGameUI.create();
  }

  public showGameUI(npc: AvatarManager): void {
    this.rpsGameUI.show(npc);
  }

  public hideGameUI(): void {
    this.rpsGameUI.hide();
  }

  public showSpeechBubble(
    target: AvatarManager,
    message: string,
    duration?: number
  ): Phaser.GameObjects.Container {
    return this.rpsGameUI.showSpeechBubble(target, message, duration);
  }

  // ============================================================
  // 초성 퀴즈 UI
  // ============================================================

  public createConsonantQuizUI(): void {
    this.choseongUI.create();
  }

  public showConsonantQuizUI(
    npc: AvatarManager,
    quiz: string,
    answer: string,
    hint: string
  ): void {
    this.choseongUI.show(npc, quiz, answer, hint);
  }

  public hideConsonantQuizUI(): void {
    this.choseongUI.hide();
  }

  // ============================================================
  // 랭킹보드 UI
  // ============================================================

  public createRankingBoardUI(): void {
    this.rankingUI.create();
  }

  public async showRankingBoardUI(gameType?: string): Promise<void> {
    await this.rankingUI.show(gameType);
  }

  public hideRankingBoardUI(): void {
    this.rankingUI.hide();
  }

  // ============================================================
  // 모달 (기존 유지)
  // ============================================================

  public openModal(title: string, message: string): void {
    this.scene.physics.world.pause();

    this.scene.scene.launch("ModalScene", {
      title: title,
      content: message,
      onClose: () => {
        this.scene.physics.world.resume();
      },
    });
  }
}
