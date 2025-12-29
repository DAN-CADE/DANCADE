// src/game/managers/UIManager.ts
import { MainScene } from "@/game/scenes/core/MainScene";
import { AvatarManager } from "./AvatarManager";

export type Choice = 'rock' | 'paper' | 'scissors';

export class UIManager {
  private scene: MainScene;
  private gameUIContainer!: Phaser.GameObjects.Container;
  private resultText!: Phaser.GameObjects.Text;
  private isPlaying: boolean = false;
  private currentNpc: AvatarManager | null = null;

  constructor(scene: MainScene) {
    this.scene = scene;
  }

  public showNotice(message: string) {
    const width = this.scene.cameras.main.width;
    const height = 50; // 공지바 높이
    
    // 1. 컨테이너 생성
    // setScrollFactor(0)을 주어 카메라가 이동해도 화면 상단에 고정되게 합니다.
    const noticeContainer = this.scene.add.container(0, -height);
    noticeContainer.setDepth(20000); // 다른 UI(말풍선 등)보다 더 위에 표시되도록 높은 값 설정
    noticeContainer.setScrollFactor(0); // [핵심] 화면 고정

    // 2. 배경 (Rectangle이 Graphics보다 관리가 편리할 수 있어 교체 제안드립니다)
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.8)
        .setOrigin(0, 0);
    
    // 3. 텍스트
    const text = this.scene.add.text(width / 2, height / 2, message, {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'Arial'
    }).setOrigin(0.5);

    noticeContainer.add([bg, text]);

    // 4. 애니메이션 등장 (슬라이드 다운)
    this.scene.tweens.add({
      targets: noticeContainer,
      y: 0, // 화면 최상단(0)으로 내려옴
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // 3초 대기 후 사라짐
        this.scene.time.delayedCall(3000, () => {
          // 이미 씬이 변경되었거나 파괴되었을 경우를 대비한 안전장치
          if (!this.scene || !noticeContainer.active) return;

          this.scene.tweens.add({
            targets: noticeContainer,
            y: -height, // 다시 화면 바깥 위로 올라감
            duration: 500,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                noticeContainer.destroy();
            }
          });
        });
      }
    });
}

  /**
   * 가위바위보 UI 초기 생성
   */
  public createGameUI() {
    this.gameUIContainer = this.scene.add.container(0, 0).setDepth(10000).setVisible(false);

    const panelWidth = 320;
    const panelHeight = 220;

    // 패널 배경
    const panelBg = this.scene.add.rectangle(0, -panelHeight / 2 - 20, panelWidth, panelHeight, 0x2c3e50, 0.95)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive();

    // 말풍선 꼬리
    const tail = this.scene.add.rectangle(0, -25, 20, 20, 0x2c3e50).setAngle(45).setStrokeStyle(3, 0xffffff);

    this.resultText = this.scene.add.text(0, -panelHeight + 20, "준비됐어?", {
      fontSize: '20px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    const choices: Choice[] = ['rock', 'paper', 'scissors'];
    const emojis = { rock: '✊', paper: '✋', scissors: '✌️' };

    const buttons = choices.map((choice, index) => {
      const xPos = -90 + (index * 90);
      const yPos = -75;

      const btnBg = this.scene.add.rectangle(xPos, yPos, 80, 80, 0x34495e)
        .setStrokeStyle(2, 0x7f8c8d)
        .setInteractive({ useHandCursor: true });

      const btnIcon = this.scene.add.text(xPos, yPos, emojis[choice], { fontSize: '30px' }).setOrigin(0.5);

      btnBg.on('pointerdown', () => {
        this.handlePlayGame(choice)
        this.hideGameUI();
      });
      
      
      return [btnBg, btnIcon];
    }).flat();

    const closeBtn = this.scene.add.text(panelWidth/2 - 20, -panelHeight - 10, "✕", { fontSize: '22px' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.hideGameUI());

    this.gameUIContainer.add([tail, panelBg, this.resultText, ...buttons, closeBtn]);
  }

  /**
   * 말풍선 띄우기
   */
  public showSpeechBubble(target: AvatarManager, message: string, duration: number = 3000) {
    const npc = target.getContainer();
    const x = npc.x;
    const y = npc.y - (npc.displayHeight / 2) - 20;

    const padding = 12;
    const arrowHeight = 12;
    const text = this.scene.add.text(0, 0, message, {
      fontFamily: 'Arial', fontSize: '14px', color: '#000', align: 'center', wordWrap: { width: 160 }
    });

    const b = text.getBounds();
    const width = b.width + (padding * 2);
    const height = b.height + (padding * 2);
    const bubbleX = -width / 2;
    const bubbleY = -height - arrowHeight;

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xffffff, 1).lineStyle(2, 0x000000, 1);
    graphics.fillRoundedRect(bubbleX, bubbleY, width, height, 10);
    graphics.strokeRoundedRect(bubbleX, bubbleY, width, height, 10);
    graphics.beginPath().moveTo(-8, -arrowHeight).lineTo(0, 0).lineTo(8, -arrowHeight).closePath().fillPath().strokePath();

    text.setPosition(bubbleX + padding, bubbleY + padding);
    const container = this.scene.add.container(x, y, [graphics, text]).setDepth(100);

    if (duration > 0) {
      this.scene.time.delayedCall(duration, () => container.destroy());
    }
    return container;
  }

  /**
   * 모달 열기 (간단 버전)
   */
  public openModal(title: string, message: string) {
    console.log(`Modal: [${title}] ${message}`);
    (this.scene as any).openModal?.(title, message);

    // 메인 물리 엔진 멈춤
    this.scene.physics.world.pause();

    // ModalScene을 실행하고 데이터 전달
    this.scene.scene.launch('ModalScene', {
      title: title,
      content: message,
      onClose: () => {
        // 모달이 닫힐 때 실행될 콜백
        this.scene.physics.world.resume();
      }
    });
  }

  /**
   * 게임 UI 표시
   */
  public showGameUI(npc: AvatarManager) {
    this.currentNpc = npc;
    this.isPlaying = true;
    const target = npc.getContainer();
    const targetY = target.y - (target.displayHeight / 2) - 10;
    this.gameUIContainer.setPosition(target.x, targetY).setVisible(true).setAlpha(1);
    this.resultText.setText("가위 바위 보!");
  }

  public hideGameUI() {
    this.isPlaying = false;
    this.gameUIContainer.setVisible(false);
  }

  private handlePlayGame(playerChoice: Choice) {
    const options: Choice[] = ['rock', 'paper', 'scissors'];
    const npcChoice = options[Math.floor(Math.random() * 3)];
    const win = (playerChoice === 'rock' && npcChoice === 'scissors') || 
                (playerChoice === 'paper' && npcChoice === 'rock') || 
                (playerChoice === 'scissors' && npcChoice === 'paper');

    const result = playerChoice === npcChoice ? "비겼어!" : (win ? "네가 이겼어!" : "내가 이겼다!");
    this.resultText.setText(`나:${npcChoice}\n${result}`);

    if (this.currentNpc) {
      this.showSpeechBubble(this.currentNpc, `${npcChoice}! ${result}`, 2000);
    }
  }
}