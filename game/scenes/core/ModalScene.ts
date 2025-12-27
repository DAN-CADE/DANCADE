import Phaser from 'phaser';

interface ModalData {
  title: string;
  content: string;
  onClose?: () => void;
}

export class ModalScene extends Phaser.Scene {
  constructor() {
    super('ModalScene');
  }

  create(data: ModalData) {
    const { width, height } = this.scale;

    // 1. 배경 어둡게 처리 (Overlay)
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.6);
    overlay.setOrigin(0);

    // 2. 모달 박스
    const modalWidth = 400;
    const modalHeight = 250;
    const dialogBox = this.add.rectangle(width / 2, height / 2, modalWidth, modalHeight, 0xffffff);
    dialogBox.setStrokeStyle(4, 0x999999);

    // 3. 텍스트 표시
    const title = this.add.text(width / 2, height / 2 - 80, data.title, {
      fontSize: '24px',
      color: '#000'
    }).setOrigin(0.5);

    const content = this.add.text(width / 2, height / 2, data.content, {
      fontSize: '18px',
      color: '#333',
      wordWrap: { width: modalWidth - 40 }
    }).setOrigin(0.5);

    // 4. 닫기 안내
    const hint = this.add.text(width / 2, height / 2 + 80, 'ESC를 눌러 닫기', {
      fontSize: '14px',
      color: '#888'
    }).setOrigin(0.5);

    // 5. ESC 키 입력 시 닫기
    this.input.keyboard?.once('keydown-ESC', () => {
      if (data.onClose) data.onClose();
      this.scene.stop(); // 모달 씬 종료
    });
  }
}