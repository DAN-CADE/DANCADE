import { COMMON_COLORS, TEXT_STYLE } from "@/game/types/common/ui.constants";
import {
  OmokMode,
  OmokSide,
  OmokSideType,
  PlayerInfoUI,
} from "@/game/types/omok";
import { OMOK_CONFIG, PROFILE_LAYOUT } from "@/game/types/omok/omok.constants";
import { PlayerInfo, PlayerProfileUI } from "@/game/types/omok/omok.ui.types";

export class OmokPlayerProfileRenderer {
  private scene: Phaser.Scene;
  private playerInfoUI: PlayerInfoUI = {};

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // =====================================================================
  // =====================================================================

  public clear(): void {
    this.playerInfoUI.me?.container.destroy();
    this.playerInfoUI.opponent?.container.destroy();
    this.playerInfoUI = {};
  }

  // =====================================================================
  // =====================================================================
  /**
   * 전체 프로필 UI 초기화 및 렌더링
   */
  // =====================================================================
  // =====================================================================

  public render(mode: OmokMode, mySide?: OmokSideType): void {
    this.clear();

    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const bottomY = height - PROFILE_LAYOUT.BOTTOM_Y_OFFSET;

    const playerData = this.getPlayerDataByMode(mode, mySide);
    if (!playerData) return;

    this.playerInfoUI.opponent = this.buildProfileUI(
      playerData.opponent,
      centerX,
      PROFILE_LAYOUT.TOP_Y
    );
    this.playerInfoUI.me = this.buildProfileUI(playerData.me, centerX, bottomY);
  }

  // =====================================================================
  // =====================================================================
  /**
   * 턴 상태에 따른 UI 하이라이트 업데이트
   */
  // =====================================================================
  // =====================================================================

  public updateTurn(currentTurn: OmokSideType): void {
    const meActive = this.shouldHighlightMe(currentTurn);

    this.updateProfileState(this.playerInfoUI.me, meActive);
    this.updateProfileState(this.playerInfoUI.opponent, !meActive);
  }

  // =====================================================================
  // =====================================================================

  public getPlayerDataByMode(
    mode: OmokMode,
    mySide?: OmokSideType
  ): { me: PlayerInfo; opponent: PlayerInfo } | null {
    const BLACK = OMOK_CONFIG.COLORS.BLACK;
    const WHITE = OMOK_CONFIG.COLORS.WHITE;

    switch (mode) {
      case OmokMode.SINGLE:
        return {
          me: { name: "나", stoneColor: BLACK, side: OmokSide.BLACK },
          opponent: {
            name: "GPT (AI)",
            stoneColor: WHITE,
            side: OmokSide.WHITE,
          },
        };

      case OmokMode.LOCAL:
        return {
          me: { name: "Player 2", stoneColor: WHITE, side: OmokSide.WHITE },
          opponent: {
            name: "Player 1",
            stoneColor: BLACK,
            side: OmokSide.BLACK,
          },
        };

      case OmokMode.ONLINE:
        if (!mySide) return null;
        const isMeBlack = mySide === OmokSide.BLACK;
        return {
          me: {
            name: `나 (${isMeBlack ? "흑" : "백"})`,
            stoneColor: isMeBlack ? BLACK : WHITE,
            side: mySide,
          },
          opponent: {
            name: `상대 (${isMeBlack ? "백" : "흑"})`,
            stoneColor: isMeBlack ? WHITE : BLACK,
            side: isMeBlack ? OmokSide.WHITE : OmokSide.BLACK,
          },
        };
      default:
        return null;
    }
  }

  // =====================================================================
  // =====================================================================

  private buildProfileUI(
    info: PlayerInfo,
    x: number,
    y: number
  ): PlayerProfileUI {
    const container = this.scene.add
      .container(x, y)
      .setDepth(OMOK_CONFIG.DEPTH.UI);

    const bg = this.createBackground();
    const nameTxt = this.scene.add.text(-170, -15, info.name, {
      ...TEXT_STYLE.NORMAL,
      fontStyle: "bold",
    });

    const statusTxt = this.scene.add.text(-170, 12, "준비 중...", {
      ...TEXT_STYLE.SMALL,
      color: COMMON_COLORS.TEXT_SECONDARY,
    });

    const { stoneIcon, stoneContainer } = this.createStoneElements(
      info.stoneColor
    );

    container.add([bg, nameTxt, statusTxt, stoneContainer]);

    return { container, bg, nameTxt, statusTxt, stoneIcon, side: info.side };
  }

  private createBackground(): Phaser.GameObjects.Graphics {
    const { WIDTH, HEIGHT, BORDER_RADIUS } = PROFILE_LAYOUT;
    const graphics = this.scene.add.graphics();

    graphics.fillStyle(COMMON_COLORS.NEUTRAL, 0.9);
    graphics.fillRoundedRect(
      -WIDTH / 2,
      -HEIGHT / 2,
      WIDTH,
      HEIGHT,
      BORDER_RADIUS
    );
    graphics.lineStyle(2, 0xffffff, 0.2);
    graphics.strokeRoundedRect(
      -WIDTH / 2,
      -HEIGHT / 2,
      WIDTH,
      HEIGHT,
      BORDER_RADIUS
    );

    return graphics;
  }

  private createStoneElements(stoneColor: number) {
    const { STONE_RADIUS, STONE_BG_RADIUS } = PROFILE_LAYOUT;

    const stoneBg = this.scene.add.circle(
      150,
      0,
      STONE_BG_RADIUS,
      0xffffff,
      0.3
    );
    const stoneIcon = this.scene.add.circle(150, 0, STONE_RADIUS, stoneColor);
    const stoneContainer = this.scene.add.container(0, 0, [stoneBg, stoneIcon]);

    return { stoneIcon, stoneContainer };
  }

  // =====================================================================
  // =====================================================================

  private updateProfileState(
    profile: PlayerProfileUI | undefined,
    active: boolean
  ): void {
    if (!profile) return;

    const alpha = active ? 1 : 0.5;
    const scale = active ? 1.05 : 1;

    this.scene.tweens.add({
      targets: profile.container,
      scale: scale,
      alpha: alpha,
      duration: 200,
      ease: "Power2",
    });

    if (active) {
      profile.statusTxt.setText("THINKING...");
      profile.statusTxt.setColor(OMOK_CONFIG.COLORS.GOLD);
    } else {
      profile.statusTxt.setText("WAITING");
      profile.statusTxt.setColor(COMMON_COLORS.TEXT_SECONDARY);
    }
  }

  private shouldHighlightMe(currentTurn: OmokSideType): boolean {
    return this.playerInfoUI.me?.side === currentTurn;
  }
}
