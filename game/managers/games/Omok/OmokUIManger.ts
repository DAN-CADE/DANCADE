// game/managers/games/Omok/OmokUIManager.ts
import { BaseGameManager } from "@/game/managers/base/BaseGameManager";
import {
  OMOK_CONFIG,
  OmokMode,
  OmokUIState,
  PlayerInfoUI,
  PlayerProfile,
} from "@/game/types/realOmok";

export class OmokUIManager extends BaseGameManager<OmokUIState> {
  private playerInfoUI: PlayerInfoUI = {};

  constructor(scene: Phaser.Scene) {
    super(
      scene,
      {
        modeSelectionContainer: undefined,
        forbiddenText: undefined,
      },
      {}
    );
  }

  // 필수 구현: 초기 UI 설정
  setGameObjects(): void {
    // UI는 동적으로 생성되므로 초기 설정 불필요
  }

  resetGame(): void {
    // 모드 선택 컨테이너 정리
    if (this.gameState.modeSelectionContainer) {
      this.gameState.modeSelectionContainer.destroy();
      this.gameState.modeSelectionContainer = undefined;
    }

    // 금수 메시지 정리
    if (this.gameState.forbiddenText) {
      this.gameState.forbiddenText.destroy();
      this.gameState.forbiddenText = undefined;
    }

    // 플레이어 정보 UI 정리
    this.playerInfoUI = {};
  }

  // 1. 모드 선택 화면 표시
  public showModeSelection(onSelect: (mode: OmokMode) => void): void {
    const { width, height } = this.scene.scale;

    const titleText = this.scene.add
      .text(0, -120, "오목 대전", {
        fontSize: "48px",
        color: "#ffffff",
        stroke: "#000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const createBtn = (
      y: number,
      label: string,
      mode: OmokMode
    ): Phaser.GameObjects.GameObject[] => {
      const bg = this.scene.add
        .rectangle(0, y, 320, 80, 0x000000, 0.8)
        .setStrokeStyle(2, 0xffffff);

      const txt = this.scene.add
        .text(0, y, label, { fontSize: "26px", color: "#ffffff" })
        .setOrigin(0.5);

      bg.setInteractive({ useHandCursor: true })
        .on("pointerover", () => {
          bg.setFillStyle(0x333333, 0.9);
          bg.setStrokeStyle(3, OMOK_CONFIG.COLORS.HIGHLIGHT);
        })
        .on("pointerout", () => {
          bg.setFillStyle(0x000000, 0.8);
          bg.setStrokeStyle(2, 0xffffff);
        })
        .on("pointerdown", () => {
          this.gameState.modeSelectionContainer?.destroy();
          this.gameState.modeSelectionContainer = undefined;
          onSelect(mode);
        });

      return [bg, txt];
    };

    this.gameState.modeSelectionContainer = this.scene.add
      .container(width / 2, height / 2, [
        titleText,
        ...createBtn(0, "혼자하기 (VS AI)", OmokMode.SINGLE),
        ...createBtn(100, "둘이하기 (Local)", OmokMode.LOCAL),
      ])
      .setDepth(OMOK_CONFIG.DEPTH.UI);
  }

  // 2. 플레이어 프로필 생성
  public createPlayerProfiles(currentMode: OmokMode): void {
    const { width, height } = this.scene.scale;
    const opponentName = currentMode === OmokMode.SINGLE ? "GPT" : "상대방";

    this.playerInfoUI.opponent = this.addPlayerProfile(
      width / 2,
      80,
      opponentName,
      OMOK_CONFIG.COLORS.WHITE
    );
    this.playerInfoUI.me = this.addPlayerProfile(
      width / 2,
      height - 80,
      "나",
      OMOK_CONFIG.COLORS.BLACK
    );
  }

  private addPlayerProfile(
    x: number,
    y: number,
    name: string,
    stoneColor: number
  ): PlayerProfile {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add
      .rectangle(0, 0, 350, 100, 0x000000, 0.6)
      .setStrokeStyle(2, 0xffffff);

    const nameTxt = this.scene.add.text(-150, -20, name, {
      fontSize: "18px",
      color: "#ffffff",
    });

    const stoneIndicator = this.scene.add
      .circle(140, 0, 18, stoneColor)
      .setStrokeStyle(1, 0x888888);

    const statusTxt = this.scene.add.text(-150, 15, "대기 중", {
      fontSize: "16px",
      color: "#aaaaaa",
    });

    container.add([bg, nameTxt, stoneIndicator, statusTxt]);
    container.setDepth(OMOK_CONFIG.DEPTH.UI);

    return { bg, statusTxt };
  }

  // 3. 턴 업데이트
  public updateTurnUI(currentTurn: number): void {
    if (!this.playerInfoUI.me || !this.playerInfoUI.opponent) return;

    const isMyTurn = currentTurn === 1;

    // 내 프로필 업데이트
    this.playerInfoUI.me.bg.setStrokeStyle(
      isMyTurn ? 4 : 2,
      isMyTurn ? OMOK_CONFIG.COLORS.HIGHLIGHT : 0xffffff
    );
    this.playerInfoUI.me.statusTxt
      .setText(isMyTurn ? "내 차례!" : "대기 중")
      .setColor(isMyTurn ? "#ffcc00" : "#aaaaaa");

    // 상대 프로필 업데이트
    this.playerInfoUI.opponent.bg.setStrokeStyle(
      !isMyTurn ? 4 : 2,
      !isMyTurn ? OMOK_CONFIG.COLORS.HIGHLIGHT : 0xffffff
    );
    this.playerInfoUI.opponent.statusTxt
      .setText(!isMyTurn ? "상대방 차례..." : "대기 중")
      .setColor(isMyTurn ? "#ffcc00" : "#aaaaaa");
  }

  // 4. 금수 메시지
  public showForbiddenMessage(reason: string): void {
    // 기존 메시지가 있으면 제거
    if (this.gameState.forbiddenText) {
      this.gameState.forbiddenText.destroy();
    }

    this.gameState.forbiddenText = this.scene.add
      .text(
        this.scene.scale.width / 2,
        this.scene.scale.height / 2,
        `⚠️ ${reason}`,
        {
          fontSize: "28px",
          color: OMOK_CONFIG.COLORS.FORBIDDEN,
          backgroundColor: "#000000aa",
          padding: { x: 20, y: 10 },
        }
      )
      .setOrigin(0.5)
      .setDepth(OMOK_CONFIG.DEPTH.MESSAGE);

    // 1.5초 후 자동 제거
    this.scene.time.delayedCall(1500, () => {
      if (this.gameState.forbiddenText) {
        this.gameState.forbiddenText.destroy();
        this.gameState.forbiddenText = undefined;
      }
    });
  }

  // 5. 게임 종료 UI
  public showEndGameUI(
    winnerName: string,
    onRestart: () => void,
    onHome: () => void
  ): void {
    const { width, height } = this.scene.scale;

    // 결과 텍스트
    this.scene.add
      .text(width / 2, 150, `🏆 ${winnerName} 승리!`, {
        fontSize: "52px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(OMOK_CONFIG.DEPTH.MESSAGE);

    // 버튼 배치
    this.createStyledBtn(
      width / 2 - 120,
      height - 100,
      "🔄 다시하기",
      onRestart
    );
    this.createStyledBtn(width / 2 + 120, height - 100, "🏠 홈으로", onHome);
  }

  private createStyledBtn(
    x: number,
    y: number,
    label: string,
    callback: () => void
  ): void {
    const container = this.scene.add.container(x, y);
    const bg = this.scene.add.graphics();

    const drawBg = (color: number) => {
      bg.clear()
        .fillStyle(color, 0.9)
        .fillRoundedRect(-100, -30, 200, 60, 20)
        .lineStyle(2, 0xffffff)
        .strokeRoundedRect(-100, -30, 200, 60, 20);
    };

    drawBg(0x222222);

    const txt = this.scene.add
      .text(0, 0, label, { fontSize: "22px", color: "#ffffff" })
      .setOrigin(0.5);

    container
      .setInteractive(
        new Phaser.Geom.Rectangle(-100, -30, 200, 60),
        Phaser.Geom.Rectangle.Contains
      )
      .on("pointerover", () => {
        drawBg(0x444444);
        container.setScale(1.05);
      })
      .on("pointerout", () => {
        drawBg(0x222222);
        container.setScale(1.0);
      })
      .on("pointerdown", () => {
        drawBg(0x666666);
        callback();
      });

    container.add([bg, txt]);
    container.setDepth(OMOK_CONFIG.DEPTH.MESSAGE);
  }
}
