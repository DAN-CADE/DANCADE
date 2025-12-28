// game/managers/games/Omok/ui/OmokPlayerProfileRenderer.ts
import {
  OMOK_CONFIG,
  OmokMode,
  type PlayerProfile,
  type PlayerInfoUI,
} from "@/game/types/omok";

/**
 * 플레이어 정보
 */
interface PlayerInfo {
  name: string;
  stoneColor: number;
}

/**
 * OmokPlayerProfileRenderer
 * - 플레이어 프로필 UI 렌더링만 담당
 */
export class OmokPlayerProfileRenderer {
  private scene: Phaser.Scene;
  private playerInfoUI: PlayerInfoUI = {};

  // 레이아웃 상수
  private readonly LAYOUT = {
    WIDTH: 400,
    HEIGHT: 80,
    BORDER_RADIUS: 15,
    STONE_RADIUS: 18,
    STONE_BG_RADIUS: 22,
    TOP_Y: 60,
    BOTTOM_Y_OFFSET: 60,
  } as const;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // =====================================================================
  // Public API
  // =====================================================================

  /**
   * 플레이어 프로필 생성
   * @param mode - 게임 모드
   * @param myColor - 온라인 모드일 때 내 돌 색깔
   */
  public createProfiles(mode: OmokMode, myColor?: number): void {
    this.clearProfiles();

    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const bottomY = height - this.LAYOUT.BOTTOM_Y_OFFSET;

    if (mode === OmokMode.SINGLE) {
      this.createSingleModeProfiles(centerX, bottomY);
    } else if (mode === OmokMode.LOCAL) {
      this.createLocalModeProfiles(centerX, bottomY);
    } else if (mode === OmokMode.ONLINE) {
      if (!myColor || myColor === 0) {
        console.error("[ProfileRenderer] myColor가 없거나 0입니다");
        return;
      }
      this.createOnlineModeProfiles(centerX, bottomY, myColor);
    }
  }

  /**
   * 턴 UI 업데이트
   * @param currentTurn - 현재 턴 (1: 흑, 2: 백)
   */
  public updateTurn(currentTurn: number): void {
    const meActive = this.shouldHighlightMe(currentTurn);
    const opponentActive = !meActive;

    this.updateProfileState(this.playerInfoUI.me, meActive);
    this.updateProfileState(this.playerInfoUI.opponent, opponentActive);
  }

  /**
   * 프로필 정리
   */
  public clearProfiles(): void {
    this.destroyProfile(this.playerInfoUI.me);
    this.destroyProfile(this.playerInfoUI.opponent);
    this.playerInfoUI = {};
  }

  // =====================================================================
  // 모드별 프로필 생성
  // =====================================================================

  /**
   * 싱글 모드 프로필 생성
   */
  private createSingleModeProfiles(centerX: number, bottomY: number): void {
    this.playerInfoUI.opponent = this.createProfile(
      { name: "GPT", stoneColor: OMOK_CONFIG.COLORS.WHITE },
      centerX,
      this.LAYOUT.TOP_Y
    );

    this.playerInfoUI.me = this.createProfile(
      { name: "나", stoneColor: OMOK_CONFIG.COLORS.BLACK },
      centerX,
      bottomY
    );
  }

  /**
   * 로컬 모드 프로필 생성
   */
  private createLocalModeProfiles(centerX: number, bottomY: number): void {
    this.playerInfoUI.opponent = this.createProfile(
      { name: "플레이어1", stoneColor: OMOK_CONFIG.COLORS.BLACK },
      centerX,
      this.LAYOUT.TOP_Y
    );

    this.playerInfoUI.me = this.createProfile(
      { name: "플레이어2", stoneColor: OMOK_CONFIG.COLORS.WHITE },
      centerX,
      bottomY
    );
  }

  /**
   * 온라인 모드 프로필 생성
   */
  private createOnlineModeProfiles(
    centerX: number,
    bottomY: number,
    myColor: number
  ): void {
    // 상대 프로필 (상단)
    const opponentColor = myColor === 1 ? 2 : 1;
    const opponentColorName = opponentColor === 1 ? "흑돌" : "백돌";
    const opponentStoneColor =
      opponentColor === 1 ? OMOK_CONFIG.COLORS.BLACK : OMOK_CONFIG.COLORS.WHITE;

    this.playerInfoUI.opponent = this.createProfile(
      { name: `상대 (${opponentColorName})`, stoneColor: opponentStoneColor },
      centerX,
      this.LAYOUT.TOP_Y
    );

    // 내 프로필 (하단)
    const myColorName = myColor === 1 ? "흑돌" : "백돌";
    const myStoneColor =
      myColor === 1 ? OMOK_CONFIG.COLORS.BLACK : OMOK_CONFIG.COLORS.WHITE;

    this.playerInfoUI.me = this.createProfile(
      { name: `나 (${myColorName})`, stoneColor: myStoneColor },
      centerX,
      bottomY
    );
  }

  // =====================================================================
  // 프로필 생성 및 관리
  // =====================================================================

  /**
   * 개별 프로필 생성
   */
  private createProfile(info: PlayerInfo, x: number, y: number): PlayerProfile {
    const container = this.scene.add
      .container(x, y)
      .setDepth(OMOK_CONFIG.DEPTH.UI);

    // 배경
    const bg = this.createBackground();
    container.add(bg);

    // 이름
    const nameTxt = this.scene.add.text(-170, -15, info.name, {
      ...OMOK_CONFIG.TEXT_STYLE.NORMAL,
      fontStyle: "bold",
    });
    container.add(nameTxt);

    // 상태 텍스트
    const statusTxt = this.scene.add.text(-170, 12, "준비 중...", {
      ...OMOK_CONFIG.TEXT_STYLE.SMALL,
      color: OMOK_CONFIG.COLORS.SUB_TEXT,
    });
    container.add(statusTxt);

    // 돌
    const stone = this.createStone(info.stoneColor);
    container.add(stone);

    return { bg, statusTxt, color: info.stoneColor };
  }

  /**
   * 배경 생성
   */
  private createBackground(): Phaser.GameObjects.Graphics {
    const { WIDTH, HEIGHT, BORDER_RADIUS } = this.LAYOUT;

    const bg = this.scene.add.graphics();
    bg.fillStyle(OMOK_CONFIG.COLORS.PROFILE_BG, 0.9);
    bg.fillRoundedRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT, BORDER_RADIUS);
    bg.lineStyle(2, 0xffffff, 0.2);
    bg.strokeRoundedRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT, BORDER_RADIUS);

    return bg;
  }

  /**
   * 돌 생성
   */
  private createStone(stoneColor: number): Phaser.GameObjects.Container {
    const { STONE_RADIUS, STONE_BG_RADIUS } = this.LAYOUT;

    const stoneBg = this.scene.add.circle(
      150,
      0,
      STONE_BG_RADIUS,
      0xffffff,
      0.3
    );
    const stone = this.scene.add.circle(150, 0, STONE_RADIUS, stoneColor);

    return this.scene.add.container(0, 0, [stoneBg, stone]);
  }

  /**
   * 프로필 상태 업데이트
   */
  private updateProfileState(
    profile: PlayerProfile | undefined,
    active: boolean
  ): void {
    if (!profile) return;

    const alpha = active ? 1 : 0.5;
    const scale = active ? 1.05 : 1;

    profile.bg.setAlpha(alpha);
    profile.bg.setScale(scale);

    if (active) {
      profile.statusTxt.setText("내 차례!");
      profile.statusTxt.setColor(OMOK_CONFIG.COLORS.GOLD);
    } else {
      profile.statusTxt.setText("대기 중...");
      profile.statusTxt.setColor(OMOK_CONFIG.COLORS.SUB_TEXT);
    }
  }

  /**
   * 내 프로필을 하이라이트할지 결정
   */
  private shouldHighlightMe(currentTurn: number): boolean {
    // 내 프로필의 돌 색깔과 현재 턴이 같으면 내 차례
    if (!this.playerInfoUI.me) return false;

    const myColor = this.playerInfoUI.me.color;
    return (
      myColor ===
      (currentTurn === 1 ? OMOK_CONFIG.COLORS.BLACK : OMOK_CONFIG.COLORS.WHITE)
    );
  }

  /**
   * 프로필 제거
   */
  private destroyProfile(profile: PlayerProfile | undefined): void {
    if (!profile) return;

    const container = profile.bg.parentContainer;
    container?.destroy();
  }
}
