// game/managers/global/ui/NoticeUIManager.ts
// 공지 UI 관리

import Phaser from "phaser";

export class NoticeUIManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 화면 상단에 공지 메시지 표시
   * @param message 표시할 메시지
   * @param duration 표시 시간 (기본 3000ms)
   */
  public showNotice(message: string, duration: number = 3000): void {
    const width = this.scene.cameras.main.width;
    const height = 50;

    // 컨테이너 생성 (화면 상단 바깥에서 시작)
    const noticeContainer = this.scene.add.container(0, -height);
    noticeContainer.setDepth(20000);
    noticeContainer.setScrollFactor(0);

    // 배경
    const bg = this.scene.add
      .rectangle(0, 0, width, height, 0x000000, 0.8)
      .setOrigin(0, 0);

    // 텍스트
    const text = this.scene.add
      .text(width / 2, height / 2, message, {
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    noticeContainer.add([bg, text]);

    // 슬라이드 다운 애니메이션
    this.scene.tweens.add({
      targets: noticeContainer,
      y: 0,
      duration: 500,
      ease: "Cubic.easeOut",
      onComplete: () => {
        // 대기 후 슬라이드 업
        this.scene.time.delayedCall(duration, () => {
          if (!this.scene || !noticeContainer.active) return;

          this.scene.tweens.add({
            targets: noticeContainer,
            y: -height,
            duration: 500,
            ease: "Cubic.easeIn",
            onComplete: () => {
              noticeContainer.destroy();
            },
          });
        });
      },
    });
  }
}
