// game/managers/global/ui/RankingUIManager.ts
// 랭킹보드 UI 관리

import Phaser from "phaser";
import { getRankings } from "@/lib/supabase/ranking";

interface RankingItem {
  users: { nickname: string };
  score: number;
}

export class RankingUIManager {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private listGroup!: Phaser.GameObjects.Group;
  private currentGameType: string = "omok";

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 랭킹보드 UI 생성
   */
  public create(): void {
    const { width, height } = this.scene.scale;

    this.listGroup = this.scene.add.group();
    this.container = this.scene.add
      .container(width / 2, height / 2)
      .setDepth(20000)
      .setVisible(false)
      .setScrollFactor(0);

    const panelWidth = 400;
    const panelHeight = 500;

    // 배경
    const panelBg = this.scene.add
      .rectangle(0, 0, panelWidth, panelHeight, 0x2c3e50, 0.95)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive();

    // 타이틀
    const title = this.scene.add
      .text(0, -panelHeight / 2 + 30, "🏆 HALL OF FAME", {
        fontSize: "28px",
        fontStyle: "bold",
        color: "#f1c40f",
      })
      .setOrigin(0.5);

    // 탭 생성
    const tabY = -panelHeight / 2 + 80;
    const tabGap = 125;

    const tabOmok = this.createTab(-tabGap, tabY, "오목", "omok");
    const tabBrick = this.createTab(0, tabY, "블록깨기", "brick-breaker");
    const tabPing = this.createTab(tabGap, tabY, "핑퐁", "ping-pong");

    // 닫기 버튼
    const closeBtn = this.scene.add
      .text(panelWidth / 2 - 25, -panelHeight / 2 + 25, "✕", {
        fontSize: "28px",
        color: "#ffffff",
        backgroundColor: "#e74c3c",
        padding: { x: 10, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive(
        new Phaser.Geom.Rectangle(0, 0, 110, 40),
        Phaser.Geom.Rectangle.Contains
      )
      .setScrollFactor(0);

    closeBtn.on("pointerdown", () => closeBtn.setAlpha(0.7));
    closeBtn.on("pointerup", () => {
      closeBtn.setAlpha(1);
      this.hide();
    });

    this.container.add([
      panelBg,
      title,
      tabOmok.bg,
      tabOmok.text,
      tabBrick.bg,
      tabBrick.text,
      tabPing.bg,
      tabPing.text,
      closeBtn,
    ]);
  }

  /**
   * 탭 생성 헬퍼
   */
  private createTab(
    x: number,
    y: number,
    label: string,
    gameType: string
  ): { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } {
    const tabW = 110;
    const tabH = 40;

    const bg = this.scene.add
      .rectangle(x, y, tabW, tabH, 0x34495e)
      .setInteractive(
        new Phaser.Geom.Rectangle(0, 0, tabW, tabH),
        Phaser.Geom.Rectangle.Contains
      )
      .setScrollFactor(0);

    const text = this.scene.add
      .text(x, y, label, { fontSize: "16px", color: "#ffffff" })
      .setOrigin(0.5);

    bg.on("pointerdown", () => bg.setAlpha(0.7));
    bg.on("pointerup", () => {
      bg.setAlpha(1);
      this.show(gameType);
    });
    bg.on("pointerover", () => bg.setFillStyle(0x546e7a));
    bg.on("pointerout", () => bg.setFillStyle(0x34495e));

    return { bg, text };
  }

  /**
   * UI 표시
   */
  public async show(gameType: string = "omok"): Promise<void> {
    const { width, height } = this.scene.scale;
    this.container.setPosition(width / 2, height / 2);
    this.container.setVisible(true);
    this.currentGameType = gameType;

    await this.refreshList(gameType);
  }

  /**
   * UI 숨기기
   */
  public hide(): void {
    this.container.setVisible(false);
    if (this.scene.game.canvas) {
      this.scene.game.canvas.focus();
    }
  }

  /**
   * 랭킹 리스트 갱신
   */
  private async refreshList(gameType: string): Promise<void> {
    this.listGroup.clear(true, true);

    try {
      const data = await getRankings(gameType);

      if (!data || data.length === 0) {
        const noData = this.scene.add
          .text(0, 0, "데이터가 없습니다.", { fontSize: "18px" })
          .setOrigin(0.5);
        this.container.add(noData);
        this.listGroup.add(noData);
        return;
      }

      data.forEach((item: RankingItem, index: number) => {
        const yPos = -80 + index * 40;
        const rankColor = this.getRankColor(index);

        const rankTxt = this.scene.add
          .text(-150, yPos, `${index + 1}`, {
            fontSize: "20px",
            color: rankColor,
            fontStyle: "bold",
          })
          .setOrigin(0.5);

        const nameTxt = this.scene.add
          .text(-20, yPos, item.users.nickname, {
            fontSize: "18px",
            color: "#ffffff",
          })
          .setOrigin(0.5);

        const scoreTxt = this.scene.add
          .text(130, yPos, `${item.score}`, {
            fontSize: "18px",
            color: "#2ecc71",
            fontStyle: "bold",
          })
          .setOrigin(0.5);

        this.container.add([rankTxt, nameTxt, scoreTxt]);
        this.listGroup.addMultiple([rankTxt, nameTxt, scoreTxt]);
      });
    } catch (err) {
      console.error("랭킹 로드 에러:", err);
    }
  }

  /**
   * 순위별 색상 반환
   */
  private getRankColor(index: number): string {
    switch (index) {
      case 0:
        return "#f1c40f"; // 금
      case 1:
        return "#bdc3c7"; // 은
      case 2:
        return "#e67e22"; // 동
      default:
        return "#ffffff";
    }
  }
}
