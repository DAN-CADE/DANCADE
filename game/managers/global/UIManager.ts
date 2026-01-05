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

  private choseongUIContainer!: Phaser.GameObjects.Container;
  private choseongQuizText!: Phaser.GameObjects.Text;
  private choseongInputDisplay!: Phaser.GameObjects.Text;
  private choseongHintText!: Phaser.GameObjects.Text; // 힌트 텍스트
  private cursorDisplay!: Phaser.GameObjects.Text;    // 깜빡이는 커서
  private cursorTimer: Phaser.Time.TimerEvent | null = null; // 커서 타이머
  private hiddenInput!: HTMLInputElement; // 한글 입력을 위한 실제 입력창
  private currentChoseongAnswer: string = "";
  private currentChoseongInput: string = "";

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

  // 초성 게임
  public createConsonantQuizUI() {
    this.choseongUIContainer = this.scene.add.container(0, 0).setDepth(10000).setVisible(false);

    const panelWidth = 320;
    const panelHeight = 300; // 힌트 공간을 위해 높이 약간 추가

    // 1. 패널 및 배경
    const panelBg = this.scene.add.rectangle(0, -panelHeight / 2 - 20, panelWidth, panelHeight, 0x2c3e50, 0.95)
      .setStrokeStyle(3, 0xffffff).setInteractive();
    const tail = this.scene.add.rectangle(0, -25, 20, 20, 0x2c3e50).setAngle(45).setStrokeStyle(3, 0xffffff);

    // 2. 문제 초성
    this.choseongQuizText = this.scene.add.text(0, -panelHeight + 50, "", {
      fontSize: '42px', fontStyle: 'bold', color: '#f1c40f'
    }).setOrigin(0.5);

    // 3. 힌트 텍스트 (추가됨)
    this.choseongHintText = this.scene.add.text(0, -panelHeight + 95, "", {
      fontSize: '16px', color: '#bdc3c7', fontStyle: 'italic'
    }).setOrigin(0.5);

    // 4. 입력창 영역
    const inputBg = this.scene.add.rectangle(0, -130, 240, 50, 0x34495e)
      .setStrokeStyle(2, 0x7f8c8d).setInteractive({ useHandCursor: true });

    // 중앙 정렬을 위해 x를 0으로, setOrigin을 0.5로 설정
    this.choseongInputDisplay = this.scene.add.text(0, -130, "", {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(0.5); 

    // 커서는 텍스트의 바로 오른쪽에서 시작하도록 설정 (origin은 0, 0.5 유지)
    this.cursorDisplay = this.scene.add.text(0, -130, "|", {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(0, 0.5).setVisible(false);

    // 6. 확인 버튼
    const submitBtnBg = this.scene.add.rectangle(0, -60, 110, 45, 0x27ae60).setInteractive({ useHandCursor: true });
    const submitBtnText = this.scene.add.text(0, -60, "정답 확인", { fontSize: '18px', fontStyle: 'bold' }).setOrigin(0.5);
    submitBtnBg.on('pointerdown', () => this.handleConsonantQuizSubmit());

    // 7. 닫기 버튼
    const closeBtn = this.scene.add.text(panelWidth/2 - 20, -panelHeight - 10, "✕", { fontSize: '22px' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.hideConsonantQuizUI());

    this.choseongUIContainer.add([
      tail, panelBg, this.choseongQuizText, this.choseongHintText, 
      inputBg, this.choseongInputDisplay, this.cursorDisplay, 
      submitBtnBg, submitBtnText, closeBtn
    ]);

    this.setupKoreanInput(inputBg);
  }

  private setupKoreanInput(inputBg: Phaser.GameObjects.Rectangle) {
    this.hiddenInput = document.createElement('input');
    this.hiddenInput.type = 'text';
    // 스타일은 이전 답변과 동일하게 유지 (화면 밖 고정)
    Object.assign(this.hiddenInput.style, {
      position: 'fixed', top: '-100px', left: '0', width: '1px', height: '1px', opacity: '0'
    });
    document.body.appendChild(this.hiddenInput);

    inputBg.on('pointerdown', () => {
      this.hiddenInput.focus();
      this.startCursorBlink();
    });

    this.hiddenInput.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value;
      this.currentChoseongInput = val;
      this.choseongInputDisplay.setText(val);
      
      // 핵심 로직: 중앙 정렬된 텍스트의 끝 지점으로 커서 이동
      // 텍스트가 중앙(0)에 있으므로, 끝 지점은 (너비 / 2)입니다.
      const textWidth = this.choseongInputDisplay.width;
      const newCursorX = (textWidth / 2) + 2; // 약간의 간격(2px) 추가
      
      this.cursorDisplay.setX(newCursorX);
    });

    this.hiddenInput.addEventListener('blur', () => this.stopCursorBlink());
  }

  // 커서 깜빡임 타이머 시작
  private startCursorBlink() {
    this.stopCursorBlink(); // 기존 타이머 중복 방지
    this.cursorDisplay.setVisible(true);
    this.cursorTimer = this.scene.time.addEvent({
      delay: 500,
      callback: () => { this.cursorDisplay.setVisible(!this.cursorDisplay.visible); },
      loop: true
    });
  }

  private stopCursorBlink() {
    if (this.cursorTimer) {
      this.cursorTimer.remove();
      this.cursorTimer = null;
    }
    this.cursorDisplay.setVisible(false);
  }

  // NPC 객체와 문제(quiz), 정답(answer)을 인자로 받습니다.
  public showConsonantQuizUI(npc: any, quiz: string, answer: string, hint: string) {
    this.currentNpc = npc;
    this.isPlaying = true;
    this.currentChoseongAnswer = answer;
    this.currentChoseongInput = "";
    this.hiddenInput.value = "";
    
    this.choseongQuizText.setText(quiz);
    this.choseongHintText.setText(`힌트: ${hint}`); // 힌트 표시
    this.choseongInputDisplay.setText("");
    
    // 커서 초기 위치 설정
    this.cursorDisplay.setX(0).setVisible(false);

    const target = npc.getContainer();
    const targetY = target.y - (target.displayHeight / 2) - 10;
    this.choseongUIContainer.setPosition(target.x, targetY).setVisible(true).setAlpha(1);
  }

  public hideConsonantQuizUI() {
    this.isPlaying = false;
    this.choseongUIContainer.setVisible(false);
    
    // 1. Input 값 초기화 및 포커스 해제
    this.hiddenInput.value = "";
    this.hiddenInput.blur(); 

    // 2. 중요: 게임 화면(Canvas)으로 포커스 강제 이동
    // 이 코드가 있어야 캐릭터 움직임(방향키/WASD)이 다시 작동합니다.
    if (this.scene.game.canvas) {
      this.scene.game.canvas.focus();
    }

    // 3. Phaser 키보드 입력이 비활성화 되어있을 경우를 대비해 다시 활성화
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.enabled = true;
    }
  }

  public handleConsonantQuizSubmit() {
    if (this.currentChoseongInput === this.currentChoseongAnswer) {
      this.stopCursorBlink();
      this.choseongQuizText.setText("정답! 🎉");
      this.scene.time.delayedCall(1500, () => this.hideConsonantQuizUI());
    } else {
      this.scene.cameras.main.shake(200, 0.005);
      this.currentChoseongInput = "";
      this.hiddenInput.value = "";
      this.choseongInputDisplay.setText("");
      
      // 커서 위치를 다시 중앙(0)으로 리셋
      this.cursorDisplay.setX(0); 
      this.hiddenInput.focus();
    }
  }
}