import {
  PINGPONG_CONFIG,
  PingPongPaddle,
  PingPongBall,
  PingPongGameState,
  PingPongInputState,
} from "@/game/types/realPingPong";

/**
 * Real Ping Pong 게임 씬
 * 실제 탁구 에셋을 사용한 리얼한 탁구 게임
 */
export class RealPingPongScene extends Phaser.Scene {
  // 게임 오브젝트들
  private playerPaddle!: PingPongPaddle;
  private aiPaddle!: PingPongPaddle;
  private ball!: PingPongBall;
  private gameState!: PingPongGameState;
  private inputState!: PingPongInputState;

  // 배경 요소들
  private board!: Phaser.GameObjects.Image;
  private scoreBar!: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;

  // UI 요소들
  private playerScoreText!: Phaser.GameObjects.Text;
  private aiScoreText!: Phaser.GameObjects.Text;
  private gameStatusText!: Phaser.GameObjects.Text;

  // 상태 텍스트 순환
  private statusMessages: string[] = [
    "11점을 먼저 따는 사람이 승리!",
    "2점 차이로 이기면 승리!",
    "최대한 빠르게 쳐보세요!",
    "↑↓: 조작 | SPACE: 서브",
  ];
  private currentStatusIndex: number = 0;
  private statusTimer!: Phaser.Time.TimerEvent;

  // 키보드 입력
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  // AI 타이머
  private aiReactionTimer: number = 0;

  // 점수 처리 플래그 (중복 방지용)
  private scoringInProgress: boolean = false;

  // 패들 색상 선택
  private playerPaddleColorIndex: number =
    PINGPONG_CONFIG.DEFAULT_PLAYER_PADDLE_COLOR;
  private aiPaddleColorIndex: number = PINGPONG_CONFIG.DEFAULT_AI_PADDLE_COLOR;

  // 색상 선택 UI
  private colorSelectionMode: boolean = false;
  private colorSelectionText!: Phaser.GameObjects.Text;
  private colorPreviewPaddles: Phaser.GameObjects.Image[] = [];

  constructor() {
    super({ key: "RealPingPongScene" });
  }

  /**
   * 에셋 로드
   */
  preload() {
    const basePath = "/assets/ping-pong/arts/";

    // 탁구 에셋 로드
    this.load.image("pingpong_ball", `${basePath}Ball.png`);
    this.load.image("pingpong_ball_motion", `${basePath}BallMotion.png`);
    this.load.image("pingpong_board", `${basePath}Board.png`);

    // 벽돌깨기 공 에셋 로드
    this.load.image(
      "ball_blue",
      "/assets/game/kenney_puzzle-pack/png/ballBlue.png"
    );
    this.load.image("pingpong_player", `${basePath}Player.png`);
    this.load.image("pingpong_computer", `${basePath}Computer.png`);
    this.load.image("pingpong_scorebar", `${basePath}ScoreBar.png`);

    // 로딩 완료 확인
    this.load.on("complete", () => {
      console.log("Real Ping Pong assets loaded successfully!");
    });
  }

  /**
   * 게임 초기화
   */
  create() {
    // 배경색 설정 (탁구장 느낌)
    this.cameras.main.setBackgroundColor(PINGPONG_CONFIG.BACKGROUND_COLOR);

    // 게임 상태 초기화
    this.initGameState();

    // 게임 오브젝트 생성
    this.createBoard();
    this.createPaddles();
    this.createBall();
    this.createUI();

    // 점수를 확실히 0으로 설정
    this.resetScores();

    // 한 번 더 점수 텍스트 강제 설정
    this.time.delayedCall(100, () => {
      this.playerScoreText.setText("0");
      this.aiScoreText.setText("0");
      console.log("점수 텍스트 강제 초기화 완료");
    });

    // 입력 설정
    this.setupInput();

    // 시작 메뉴 표시
    this.showStartMenu();
  }

  /**
   * 점수 리셋
   */
  private resetScores() {
    this.gameState.playerScore = 0;
    this.gameState.aiScore = 0;
    console.log(
      "점수 리셋됨 - Player:",
      this.gameState.playerScore,
      "AI:",
      this.gameState.aiScore
    );
    if (this.playerScoreText) {
      this.playerScoreText.setText("0");
    }
    if (this.aiScoreText) {
      this.aiScoreText.setText("0");
    }
  }

  /**
   * 게임 상태 초기화
   */
  private initGameState() {
    this.gameState = {
      playerScore: 0,
      aiScore: 0,
      isPlaying: false,
      isPaused: false,
      servingPlayer: "player",
      gameMode: "menu",
      isPreparingServe: false,
    };

    this.inputState = {
      upPressed: false,
      downPressed: false,
      spacePressed: false,
    };
  }

  /**
   * 탁구대 생성
   */
  private createBoard() {
    // 원본 이미지 로드 (보이지 않게)
    const originalBoard = this.add.image(
      PINGPONG_CONFIG.GAME_WIDTH / 2,
      PINGPONG_CONFIG.GAME_HEIGHT / 2,
      "pingpong_board"
    );
    originalBoard.setVisible(false);

    // 화면 크기에 맞게 동적 스케일링 계산
    const scaleX = PINGPONG_CONFIG.GAME_WIDTH / originalBoard.width;
    const scaleY =
      (PINGPONG_CONFIG.GAME_HEIGHT - PINGPONG_CONFIG.BOARD_UI_SPACE) /
      originalBoard.height; // UI 공간 제외
    const scale = Math.min(scaleX, scaleY) * PINGPONG_CONFIG.BOARD_SCALE_MARGIN; // 여백 적용

    const boardWidth = originalBoard.width * scale;
    const boardHeight = originalBoard.height * scale;

    // 세련된 탁구대 그리기
    const tableGraphics = this.add.graphics();

    // 테이블 그림자 (귀여운 깊이감)
    tableGraphics.fillStyle(0x4db396, 0.3);
    tableGraphics.fillRoundedRect(
      PINGPONG_CONFIG.GAME_WIDTH / 2 - boardWidth / 2 + 4,
      PINGPONG_CONFIG.GAME_HEIGHT / 2 - boardHeight / 2 + 4,
      boardWidth,
      boardHeight,
      15
    );

    // 메인 테이블 (밝은 민트)
    tableGraphics.fillStyle(PINGPONG_CONFIG.TABLE_COLOR);
    tableGraphics.fillRoundedRect(
      PINGPONG_CONFIG.GAME_WIDTH / 2 - boardWidth / 2,
      PINGPONG_CONFIG.GAME_HEIGHT / 2 - boardHeight / 2,
      boardWidth,
      boardHeight,
      15 // 더 둥근 모서리
    );

    // 세련된 경계선 (더 부드러운 색상)
    tableGraphics.lineStyle(3, 0xffffff, 0.9);
    tableGraphics.strokeRoundedRect(
      PINGPONG_CONFIG.GAME_WIDTH / 2 - boardWidth / 2,
      PINGPONG_CONFIG.GAME_HEIGHT / 2 - boardHeight / 2,
      boardWidth,
      boardHeight,
      15
    );

    // 귀여운 점선 중앙선
    tableGraphics.lineStyle(3, 0xffffff, 0.6);
    const centerX = PINGPONG_CONFIG.GAME_WIDTH / 2;
    const startY = PINGPONG_CONFIG.GAME_HEIGHT / 2 - boardHeight / 2 + 20;
    const endY = PINGPONG_CONFIG.GAME_HEIGHT / 2 + boardHeight / 2 - 20;

    // 점선 패턴으로 그리기
    for (let y = startY; y < endY; y += 15) {
      tableGraphics.lineBetween(centerX, y, centerX, Math.min(y + 8, endY));
    }

    // board 참조를 원본 이미지로 유지 (getBounds 호환성 위해)
    this.board = originalBoard;
    this.board.setScale(scale);

    // 탁구대 그래픽스를 배경으로 배치
    tableGraphics.setDepth(-1);

    // 네트 시각적 표시
    this.createNet();
  }

  /**
   * 네트 생성 (간단한 버전 - 흰색 선 없음)
   */
  private createNet() {
    const boardBounds = this.board.getBounds();
    const netX = PINGPONG_CONFIG.GAME_WIDTH / 2;
    const tableY = boardBounds.centerY;
    const netHeight = PINGPONG_CONFIG.NET_HEIGHT;

    // 간단한 네트 - 기둥만
    const netGraphics = this.add.graphics();
    netGraphics.fillStyle(0x666666, 1);
    netGraphics.fillRect(netX - 2, tableY - netHeight - 5, 4, netHeight + 10);
  }

  /**
   * 패들 생성
   */
  private createPaddles() {
    // 탁구대 실제 경계 계산
    const boardBounds = this.board.getBounds();
    const paddleScale = Math.min(
      PINGPONG_CONFIG.PADDLE_SCALE,
      (boardBounds.height * PINGPONG_CONFIG.PADDLE_SIZE_RATIO) / 100
    ); // 패들 크기를 탁구대 대비 15%

    // 플레이어 패들 (왼쪽)
    const playerX = boardBounds.left + PINGPONG_CONFIG.BOARD_PADDLE_MARGIN;
    const playerY = PINGPONG_CONFIG.GAME_HEIGHT / 2;

    const playerSprite = this.add.image(playerX, playerY, "pingpong_player");
    playerSprite.setScale(paddleScale);
    // 플레이어 패들 색상 적용
    playerSprite.setTint(
      PINGPONG_CONFIG.PADDLE_COLORS[this.playerPaddleColorIndex].color
    );

    this.playerPaddle = {
      x: playerX,
      y: playerY,
      width: playerSprite.width * paddleScale,
      height: playerSprite.height * paddleScale,
      speed: PINGPONG_CONFIG.PADDLE_SPEED,
      sprite: playerSprite,
    };

    // AI 패들 (오른쪽)
    const aiX = boardBounds.right - PINGPONG_CONFIG.BOARD_PADDLE_MARGIN;
    const aiY = PINGPONG_CONFIG.GAME_HEIGHT / 2;

    const aiSprite = this.add.image(aiX, aiY, "pingpong_computer");
    aiSprite.setScale(paddleScale);
    aiSprite.setFlipX(true);
    // AI 패들 색상 적용
    aiSprite.setTint(
      PINGPONG_CONFIG.PADDLE_COLORS[this.aiPaddleColorIndex].color
    );

    this.aiPaddle = {
      x: aiX,
      y: aiY,
      width: aiSprite.width * paddleScale,
      height: aiSprite.height * paddleScale,
      speed: PINGPONG_CONFIG.AI_SPEED,
      sprite: aiSprite,
    };
  }

  /**
   * 볼 생성
   */
  private createBall() {
    const ballX = PINGPONG_CONFIG.GAME_WIDTH / 2;
    const ballY = PINGPONG_CONFIG.GAME_HEIGHT / 2;

    // 탁구공 에셋 사용
    const ballSprite = this.add.image(ballX, ballY, "pingpong_ball");
    ballSprite.setScale(PINGPONG_CONFIG.BALL_SCALE);
    // 원래 탁구공 색상 사용

    this.ball = {
      x: ballX,
      y: ballY,
      radius: (ballSprite.width * PINGPONG_CONFIG.BALL_SCALE) / 2,
      velocityX: 0,
      velocityY: 0,
      speed: PINGPONG_CONFIG.BALL_INITIAL_SPEED,
      sprite: ballSprite,
      motionSprite: undefined, // 모션 트레일 제거
    };
  }

  /**
   * UI 생성
   */
  private createUI() {
    // 점수판 이미지를 숨기고 깔끔한 UI만 사용
    // this.scoreBar = this.add.image(
    //   PINGPONG_CONFIG.GAME_WIDTH / 2,
    //   50,
    //   "pingpong_scorebar"
    // );

    // 세련된 점수판 배경 생성
    const scoreBarBg = this.add.graphics();

    // 그라데이션 효과를 위한 레이어
    scoreBarBg.fillStyle(0x1a1a1a, 0.9);
    scoreBarBg.fillRoundedRect(
      PINGPONG_CONFIG.GAME_WIDTH / 2 - (PINGPONG_CONFIG.GAME_WIDTH * 0.8) / 2,
      20,
      PINGPONG_CONFIG.GAME_WIDTH * 0.8,
      60,
      10
    );

    // 네온 테두리
    scoreBarBg.lineStyle(2, 0x00ffaa, 0.8);
    scoreBarBg.strokeRoundedRect(
      PINGPONG_CONFIG.GAME_WIDTH / 2 - (PINGPONG_CONFIG.GAME_WIDTH * 0.8) / 2,
      20,
      PINGPONG_CONFIG.GAME_WIDTH * 0.8,
      60,
      10
    );

    // 내부 하이라이트
    scoreBarBg.lineStyle(1, 0x00ff88, 0.3);
    scoreBarBg.strokeRoundedRect(
      PINGPONG_CONFIG.GAME_WIDTH / 2 -
        (PINGPONG_CONFIG.GAME_WIDTH * 0.8) / 2 +
        4,
      24,
      PINGPONG_CONFIG.GAME_WIDTH * 0.8 - 8,
      52,
      8
    );

    // scoreBar 참조를 Graphics로 설정 (호환성을 위해)
    this.scoreBar = scoreBarBg as unknown as Phaser.GameObjects.Rectangle;

    // 점수판 안쪽에 맞춰진 세련된 점수 표시
    // 플레이어 레이블 (네온 그린)
    const playerLabel = this.add
      .text(PINGPONG_CONFIG.GAME_WIDTH / 2 - 80, 35, "PLAYER", {
        fontFamily: '"Press Start 2P"',
        fontSize: "10px",
        color: "#00ff88",
      })
      .setOrigin(0.5);
    playerLabel.setStroke("#00aa55", 2);

    // AI 레이블 (네온 오렌지)
    const aiLabel = this.add
      .text(PINGPONG_CONFIG.GAME_WIDTH / 2 + 80, 35, "COMPUTER", {
        fontFamily: '"Press Start 2P"',
        fontSize: "10px",
        color: "#ff8844",
      })
      .setOrigin(0.5);
    aiLabel.setStroke("#cc4400", 2);

    // 점수 텍스트 (임팩트 있는 네온 스타일)
    this.playerScoreText = this.add
      .text(PINGPONG_CONFIG.GAME_WIDTH / 2 - 80, 55, "0", {
        fontFamily: '"Press Start 2P"',
        fontSize: "24px",
        color: "#00ffdd",
      })
      .setOrigin(0.5);
    this.playerScoreText.setStroke("#00aa99", 3);
    this.playerScoreText.setShadow(0, 0, "#00ffdd", 8);

    this.aiScoreText = this.add
      .text(PINGPONG_CONFIG.GAME_WIDTH / 2 + 80, 55, "0", {
        fontFamily: '"Press Start 2P"',
        fontSize: "24px",
        color: "#ffaa44",
      })
      .setOrigin(0.5);
    this.aiScoreText.setStroke("#cc6600", 3);
    this.aiScoreText.setShadow(0, 0, "#ffaa44", 8);

    // 게임 상태 텍스트 (읽기 쉬운 폰트)
    this.gameStatusText = this.add
      .text(
        PINGPONG_CONFIG.GAME_WIDTH / 2,
        PINGPONG_CONFIG.GAME_HEIGHT - PINGPONG_CONFIG.STATUS_Y_OFFSET,
        "11점을 먼저 따는 사람이 승리! | ↑↓: 조작 | SPACE: 서브",
        {
          fontFamily: "Arial, sans-serif",
          fontSize: "16px",
          color: "#ffffff",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5);

    // 깔끔한 배경만 사용 (글로우/stroke 제거)
    const statusBg = this.add.graphics();
    statusBg.fillStyle(0x000000, 0.8);
    statusBg.fillRoundedRect(
      PINGPONG_CONFIG.GAME_WIDTH / 2 - 280,
      PINGPONG_CONFIG.GAME_HEIGHT - PINGPONG_CONFIG.STATUS_Y_OFFSET - 18,
      560,
      36,
      8
    );
    statusBg.lineStyle(1, 0x00ffaa, 0.6);
    statusBg.strokeRoundedRect(
      PINGPONG_CONFIG.GAME_WIDTH / 2 - 280,
      PINGPONG_CONFIG.GAME_HEIGHT - PINGPONG_CONFIG.STATUS_Y_OFFSET - 18,
      560,
      36,
      8
    );
    statusBg.setDepth(-1);

    // 상태 텍스트 순환 타이머 시작
    this.startStatusTextRotation();
  }

  /**
   * 상태 텍스트 순환 시작
   */
  private startStatusTextRotation() {
    this.statusTimer = this.time.addEvent({
      delay: 3000, // 3초마다 변경
      callback: this.rotateStatusText,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * 상태 텍스트 순환
   */
  private rotateStatusText() {
    // 항상 순환 (게임 중에도)
    this.currentStatusIndex =
      (this.currentStatusIndex + 1) % this.statusMessages.length;
    this.gameStatusText.setText(this.statusMessages[this.currentStatusIndex]);
  }

  /**
   * 입력 설정
   */
  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
  }

  /**
   * 서브 준비
   */
  private prepareServe() {
    this.gameState.isPlaying = false;
    this.scoringInProgress = false; // 점수 처리 플래그 리셋

    // 플레이어 표시 (첫 게임 시작 시에만)
    if (this.gameState.playerScore === 0 && this.gameState.aiScore === 0) {
      this.showPlayerIndicators();
    }

    // 볼을 서빙 플레이어 쪽으로 위치
    if (this.gameState.servingPlayer === "player") {
      this.ball.x = this.playerPaddle.x + 50;
      this.gameState.isPreparingServe = true;
      this.gameStatusText.setText("↑↓: 서브 위치 조정 | SPACE: 서브!");
    } else {
      this.ball.x = this.aiPaddle.x - 50;
      this.gameStatusText.setText("AI 서브 준비중...");

      // AI 자동 서브
      this.time.delayedCall(PINGPONG_CONFIG.SERVE_DELAY, () => {
        this.serve();
      });
    }

    this.ball.y = PINGPONG_CONFIG.GAME_HEIGHT / 2;
    this.ball.velocityX = 0;
    this.ball.velocityY = 0;

    this.updateBallSprites();
  }

  /**
   * 서브 실행
   */
  private serve() {
    this.gameState.isPlaying = true;
    this.gameState.isPreparingServe = false;

    // 서브 방향 설정
    const direction = this.gameState.servingPlayer === "player" ? 1 : -1;
    const angle = (Math.random() - 0.5) * 0.3; // 약간의 각도 변화

    this.ball.velocityX = Math.cos(angle) * this.ball.speed * direction;
    this.ball.velocityY = Math.sin(angle) * this.ball.speed;
  }

  /**
   * 매 프레임 업데이트
   */
  update(time: number, delta: number) {
    this.handleInput();

    // 게임이 진행 중이 아니면 물리 업데이트 중지
    if (
      this.gameState.gameMode !== "playing" ||
      !this.gameState.isPlaying ||
      this.gameState.isPaused
    ) {
      return;
    }

    const deltaSeconds = delta / 1000;

    this.updatePlayerPaddle(deltaSeconds);
    this.updateAIPaddle(deltaSeconds);
    this.updateBall(deltaSeconds);
    this.checkCollisions();
    this.checkScore();
  }
  /**
   * 입력 처리
   */
  private handleInput() {
    this.inputState.upPressed = this.cursors.up.isDown;
    this.inputState.downPressed = this.cursors.down.isDown;

    // 스페이스 키 처리
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      if (this.gameState.gameMode === "menu") {
        // 시작 메뉴에서 색상 선택으로 이동
        this.showColorSelection();
      } else if (this.gameState.gameMode === "colorSelect") {
        // 색상 선택 완료, 게임 시작
        this.startGame();
      } else if (this.gameState.gameMode === "playing") {
        if (this.gameState.isPreparingServe) {
          // 서브 준비 상태: 위치 조정 또는 서브
          this.serve();
        } else if (
          !this.gameState.isPlaying &&
          this.gameState.servingPlayer === "player"
        ) {
          // 플레이어 서브 (서브 준비 상태가 아닐 때)
          this.serve();
        }
      }
    }

    // 색상 선택 모드에서 좌우 화살표 처리
    if (this.gameState.gameMode === "colorSelect") {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
        this.playerPaddleColorIndex = 0; // 빨강
        this.updateColorPreview();
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
        this.playerPaddleColorIndex = 1; // 파랑
        this.updateColorPreview();
      }
    }

    // 서브 준비 상태에서 볼과 패들 위치 조정
    if (
      this.gameState.isPreparingServe &&
      this.gameState.servingPlayer === "player"
    ) {
      const minY = 200; // 테이블 위쪽 경계
      const maxY = 400; // 테이블 아래쪽 경계

      if (this.cursors.up.isDown) {
        const newY = Math.max(minY, this.ball.y - 2);
        this.ball.y = newY;
        this.playerPaddle.y = newY; // 패들도 함께 움직임
        this.updateBallSprites();
        // 패들 스프라이트 업데이트
        if (this.playerPaddle.sprite) {
          this.playerPaddle.sprite.setPosition(
            this.playerPaddle.x,
            this.playerPaddle.y
          );
        }
      } else if (this.cursors.down.isDown) {
        const newY = Math.min(maxY, this.ball.y + 2);
        this.ball.y = newY;
        this.playerPaddle.y = newY; // 패들도 함께 움직임
        this.updateBallSprites();
        // 패들 스프라이트 업데이트
        if (this.playerPaddle.sprite) {
          this.playerPaddle.sprite.setPosition(
            this.playerPaddle.x,
            this.playerPaddle.y
          );
        }
      }
    }
  }

  /**
   * 플레이어 패들 업데이트
   */
  private updatePlayerPaddle(deltaSeconds: number) {
    if (this.inputState.upPressed) {
      this.playerPaddle.y -= this.playerPaddle.speed * deltaSeconds;
    }
    if (this.inputState.downPressed) {
      this.playerPaddle.y += this.playerPaddle.speed * deltaSeconds;
    }

    // 경계 체크
    const halfHeight = this.playerPaddle.height / 2;
    this.playerPaddle.y = Phaser.Math.Clamp(
      this.playerPaddle.y,
      halfHeight + PINGPONG_CONFIG.BOARD_UI_SPACE, // 점수판 아래
      PINGPONG_CONFIG.GAME_HEIGHT - halfHeight - 50
    );

    // 스프라이트 위치 업데이트
    if (this.playerPaddle.sprite) {
      this.playerPaddle.sprite.setPosition(
        this.playerPaddle.x,
        this.playerPaddle.y
      );
    }
  }

  /**
   * AI 패들 업데이트
   */
  private updateAIPaddle(deltaSeconds: number) {
    // AI 반응 지연 시뮬레이션
    this.aiReactionTimer += deltaSeconds;

    if (this.aiReactionTimer >= PINGPONG_CONFIG.AI_REACTION_DELAY) {
      const paddleCenter = this.aiPaddle.y;
      const ballY = this.ball.y;

      // 볼이 AI 쪽으로 오고 있을 때만 반응
      if (this.ball.velocityX > 0) {
        const diff = ballY - paddleCenter;

        if (Math.abs(diff) > PINGPONG_CONFIG.AI_MOVE_THRESHOLD) {
          const moveDirection = diff > 0 ? 1 : -1;
          this.aiPaddle.y += moveDirection * this.aiPaddle.speed * deltaSeconds;
        }
      }

      this.aiReactionTimer = 0;
    }

    // 경계 체크
    const halfHeight = this.aiPaddle.height / 2;
    this.aiPaddle.y = Phaser.Math.Clamp(
      this.aiPaddle.y,
      halfHeight + PINGPONG_CONFIG.BOARD_UI_SPACE,
      PINGPONG_CONFIG.GAME_HEIGHT - halfHeight - 50
    );

    // 스프라이트 위치 업데이트
    if (this.aiPaddle.sprite) {
      this.aiPaddle.sprite.setPosition(this.aiPaddle.x, this.aiPaddle.y);
    }
  }

  /**
   * 볼 업데이트
   */
  private updateBall(deltaSeconds: number) {
    this.ball.x += this.ball.velocityX * deltaSeconds;
    this.ball.y += this.ball.velocityY * deltaSeconds;

    // 탁구대 경계 계산
    const boardBounds = this.board.getBounds();
    const topBound = boardBounds.top + PINGPONG_CONFIG.BOARD_BOUNDARY_OFFSET;
    const bottomBound =
      boardBounds.bottom - PINGPONG_CONFIG.BOARD_BOUNDARY_OFFSET;

    // 위아래 테이블 경계 충돌
    if (
      this.ball.y <= topBound + this.ball.radius ||
      this.ball.y >= bottomBound - this.ball.radius
    ) {
      this.ball.velocityY *= -PINGPONG_CONFIG.TABLE_ENERGY_LOSS; // 탁구대에 맞으면 약간의 에너지 손실
      this.ball.y = Phaser.Math.Clamp(
        this.ball.y,
        topBound + this.ball.radius,
        bottomBound - this.ball.radius
      );
    }

    // 네트 충돌 체크 (중앙 부근)
    this.checkNetCollision();

    this.updateBallSprites();
  }

  /**
   * 네트 충돌 체크
   */
  private checkNetCollision() {
    const netX = PINGPONG_CONFIG.GAME_WIDTH / 2;
    const boardBounds = this.board.getBounds();

    // 네트는 탁구대 중앙에 있고, 테이블 표면에서 약간 위로 올라옴
    const tableY = boardBounds.centerY;
    const netHeight = PINGPONG_CONFIG.NET_HEIGHT; // 네트 높이 (픽셀)
    const netTopY = tableY - netHeight;

    // 볼이 중앙선을 지나가려 할 때만 체크
    const prevX =
      this.ball.x -
      this.ball.velocityX * PINGPONG_CONFIG.BALL_PREVIOUS_FRAME_TIME; // 이전 프레임 위치 추정
    const crossingNet =
      (prevX < netX && this.ball.x >= netX) ||
      (prevX > netX && this.ball.x <= netX);

    if (crossingNet) {
      // 볼이 네트 높이보다 낮은 위치에 있고, 테이블 표면보다 위에 있으면 충돌
      // (즉, 볼이 테이블과 네트 사이의 공간에 있을 때만 충돌)
      if (this.ball.y > netTopY && this.ball.y < tableY + this.ball.radius) {
        // 네트에 맞으면 반대 방향으로 튕겨냄
        this.ball.velocityX *= -PINGPONG_CONFIG.NET_COLLISION_REDUCTION; // 속도 감소하며 반사
        this.ball.velocityY += PINGPONG_CONFIG.NET_BOUNCE_ADDITION; // 약간 아래로

        // 네트 히트 효과
        this.createNetHitEffect(netX, netTopY);

        // 볼을 네트에서 약간 떨어뜨림
        this.ball.x = prevX > netX ? netX + 15 : netX - 15;
      }
    }
  }

  /**
   * 네트 히트 효과
   */
  private createNetHitEffect(x: number, y: number) {
    // 간단한 파티클 효과
    for (let i = 0; i < 5; i++) {
      const particle = this.add.circle(x, y, 2, PINGPONG_CONFIG.PARTICLE_COLOR);

      this.tweens.add({
        targets: particle,
        x: x + (Math.random() - 0.5) * PINGPONG_CONFIG.FLASH_RADIUS,
        y: y + Math.random() * 30,
        alpha: 0,
        duration: 500,
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * 볼 스프라이트 업데이트
   */
  private updateBallSprites() {
    if (this.ball.sprite) {
      this.ball.sprite.setPosition(this.ball.x, this.ball.y);

      // 볼 회전 효과
      const rotationSpeed =
        Math.sqrt(this.ball.velocityX ** 2 + this.ball.velocityY ** 2) * 0.01;
      this.ball.sprite.rotation += rotationSpeed;
    }

    // 모션 트레일 제거됨
  }

  /**
   * 충돌 체크
   */
  private checkCollisions() {
    // 플레이어 패들 충돌
    if (this.checkPaddleBallCollision(this.playerPaddle)) {
      this.handlePaddleHit(this.playerPaddle);
    }

    // AI 패들 충돌
    if (this.checkPaddleBallCollision(this.aiPaddle)) {
      this.handlePaddleHit(this.aiPaddle);
    }
  }

  /**
   * 패들과 볼 충돌 체크
   */
  private checkPaddleBallCollision(paddle: PingPongPaddle): boolean {
    const ballLeft = this.ball.x - this.ball.radius;
    const ballRight = this.ball.x + this.ball.radius;
    const ballTop = this.ball.y - this.ball.radius;
    const ballBottom = this.ball.y + this.ball.radius;

    const paddleLeft = paddle.x - paddle.width / 2;
    const paddleRight = paddle.x + paddle.width / 2;
    const paddleTop = paddle.y - paddle.height / 2;
    const paddleBottom = paddle.y + paddle.height / 2;

    return (
      ballRight > paddleLeft &&
      ballLeft < paddleRight &&
      ballBottom > paddleTop &&
      ballTop < paddleBottom
    );
  }

  /**
   * 패들 히트 처리
   */
  private handlePaddleHit(paddle: PingPongPaddle) {
    // 탁구 특유의 스핀 효과 계산
    const relativeIntersectY = (this.ball.y - paddle.y) / (paddle.height / 2);
    const normalizedRelativeIntersectionY = Phaser.Math.Clamp(
      relativeIntersectY,
      -1,
      1
    );
    const bounceAngle =
      normalizedRelativeIntersectionY * PINGPONG_CONFIG.MAX_BOUNCE_ANGLE; // 최대 60도

    // 속도 증가 (최대 속도 제한)
    if (this.ball.speed < PINGPONG_CONFIG.BALL_MAX_SPEED) {
      this.ball.speed += PINGPONG_CONFIG.BALL_SPEED_INCREASE;
    }

    // 새로운 방향 계산
    const direction = paddle === this.playerPaddle ? 1 : -1;
    this.ball.velocityX = Math.cos(bounceAngle) * this.ball.speed * direction;
    this.ball.velocityY = Math.sin(bounceAngle) * this.ball.speed;

    // 볼이 패들 안에 끼이지 않도록 위치 조정
    if (paddle === this.playerPaddle) {
      this.ball.x = paddle.x + paddle.width / 2 + this.ball.radius;
    } else {
      this.ball.x = paddle.x - paddle.width / 2 - this.ball.radius;
    }
  }

  /**
   * 점수 체크
   */
  private checkScore() {
    // 이미 점수 처리 중이면 중복 실행 방지
    if (this.scoringInProgress) {
      return;
    }

    if (this.ball.x < -this.ball.radius) {
      // AI 득점
      this.scoringInProgress = true;
      this.gameState.isPlaying = false; // 즉시 게임 중단
      this.gameState.aiScore++;
      console.log(
        "AI 득점! 현재 점수 - Player:",
        this.gameState.playerScore,
        "AI:",
        this.gameState.aiScore
      );
      // 점수 텍스트를 확실하게 업데이트
      const scoreText = this.gameState.aiScore.toString();
      this.aiScoreText.setText(scoreText);
      console.log("AI 점수 텍스트 설정:", scoreText);
      this.gameState.servingPlayer = "ai"; // 득점한 AI가 다음 서브
      this.handlePoint("ai");
    } else if (this.ball.x > PINGPONG_CONFIG.GAME_WIDTH + this.ball.radius) {
      // 플레이어 득점
      this.scoringInProgress = true;
      this.gameState.isPlaying = false; // 즉시 게임 중단
      this.gameState.playerScore++;
      console.log(
        "플레이어 득점! 현재 점수 - Player:",
        this.gameState.playerScore,
        "AI:",
        this.gameState.aiScore
      );
      // 점수 텍스트를 확실하게 업데이트
      const scoreText = this.gameState.playerScore.toString();
      this.playerScoreText.setText(scoreText);
      console.log("플레이어 점수 텍스트 설정:", scoreText);
      this.gameState.servingPlayer = "player"; // 득점한 플레이어가 다음 서브
      this.handlePoint("player");
    }
  }

  /**
   * 득점 처리
   */
  private handlePoint(scorer: "player" | "ai") {
    // 득점 애니메이션
    this.createScoreEffect(scorer);

    // 승리 조건 체크 (실제 탁구 규칙: 11점 먼저 + 2점 차이)
    const playerScore = this.gameState.playerScore;
    const aiScore = this.gameState.aiScore;
    const scoreDiff = Math.abs(playerScore - aiScore);

    const hasWinner =
      (playerScore >= PINGPONG_CONFIG.WINNING_SCORE &&
        scoreDiff >= PINGPONG_CONFIG.WINNING_MARGIN) ||
      (aiScore >= PINGPONG_CONFIG.WINNING_SCORE &&
        scoreDiff >= PINGPONG_CONFIG.WINNING_MARGIN);

    if (hasWinner) {
      this.gameOver();
    } else {
      // 듀스 상황에서도 텍스트는 계속 순환

      // 볼 속도 리셋
      this.ball.speed = PINGPONG_CONFIG.BALL_INITIAL_SPEED;

      // 새 라운드 준비
      this.time.delayedCall(PINGPONG_CONFIG.POINT_DELAY, () => {
        this.prepareServe();
      });
    }
  }

  /**
   * 득점 효과 생성
   */
  private createScoreEffect(scorer: "player" | "ai") {
    const isPlayerScore = scorer === "player";
    const targetText = isPlayerScore ? this.playerScoreText : this.aiScoreText;
    const scoreColor = isPlayerScore ? "#4a90e2" : "#e74c3c";

    // 점수 텍스트 펄스 애니메이션
    this.tweens.add({
      targets: targetText,
      scaleX: PINGPONG_CONFIG.SCORE_PULSE_SCALE,
      scaleY: PINGPONG_CONFIG.SCORE_PULSE_SCALE,
      duration: PINGPONG_CONFIG.SCORE_PULSE_DURATION,
      yoyo: true,
      ease: "Back.easeOut",
    });

    // "+1" 팝업 텍스트 (텍스트 위치에서 나타남)
    const scoreX = targetText.x;
    const scoreY = targetText.y;

    const pointPopup = this.add
      .text(scoreX, scoreY - 20, "+1", {
        fontSize: PINGPONG_CONFIG.POPUP_FONT_SIZE,
        color: scoreColor,
        fontFamily: "Arial Black, Arial, sans-serif",
        stroke: "#ffffff",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // 팝업 애니메이션
    this.tweens.add({
      targets: pointPopup,
      y: scoreY - PINGPONG_CONFIG.POPUP_RISE_DISTANCE,
      alpha: 0,
      scale: 1.5,
      duration: PINGPONG_CONFIG.POPUP_DURATION,
      ease: "Power3.easeOut",
      onComplete: () => {
        pointPopup.destroy();
      },
    });

    // 간단한 플래시 효과
    const flash = this.add.circle(
      scoreX,
      scoreY,
      PINGPONG_CONFIG.FLASH_RADIUS,
      parseInt(scoreColor.replace("#", "0x")),
      0.3
    );

    this.tweens.add({
      targets: flash,
      scale: PINGPONG_CONFIG.FLASH_SCALE,
      alpha: 0,
      duration: PINGPONG_CONFIG.FLASH_DURATION,
      ease: "Power2.easeOut",
      onComplete: () => {
        flash.destroy();
      },
    });
  }

  /**
   * 게임 오버
   */
  private gameOver() {
    this.gameState.isPlaying = false;

    const winner =
      this.gameState.playerScore >= PINGPONG_CONFIG.WINNING_SCORE
        ? "YOU WIN!"
        : "GAME OVER";

    const isPlayerWin =
      this.gameState.playerScore >= PINGPONG_CONFIG.WINNING_SCORE;

    // 반투명 오버레이
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
    overlay.setDepth(10);

    // 승리/패배 텍스트 (벽돌깨기 스타일)
    const resultText = this.add
      .text(400, 200, winner, {
        fontFamily: '"Press Start 2P"',
        fontSize: "36px",
        color: isPlayerWin ? "#2ecc71" : "#e74c3c",
      })
      .setOrigin(0.5)
      .setDepth(11);

    // 애니메이션 효과
    if (isPlayerWin) {
      // 승리시 반짝임
      this.tweens.add({
        targets: resultText,
        scale: 1.1,
        duration: 300,
        yoyo: true,
        repeat: -1,
      });
    } else {
      // 패배시 점멸
      this.tweens.add({
        targets: resultText,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }

    // 최종 점수 표시
    this.add
      .text(400, 280, `PLAYER`, {
        fontFamily: '"Press Start 2P"',
        fontSize: "14px",
        color: "#95a5a6",
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.add
      .text(
        400,
        320,
        `${this.gameState.playerScore} - ${this.gameState.aiScore}`,
        {
          fontFamily: '"Press Start 2P"',
          fontSize: "32px",
          color: "#ffffff",
        }
      )
      .setOrigin(0.5)
      .setDepth(11);

    this.add
      .text(400, 360, `COMPUTER`, {
        fontFamily: '"Press Start 2P"',
        fontSize: "14px",
        color: "#95a5a6",
      })
      .setOrigin(0.5)
      .setDepth(11);

    // 재시작 버튼 (벽돌깨기 스타일)
    this.createRestartButton(11);
  }

  private createRestartButton(depth: number = 0) {
    const buttonStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: "14px",
      color: "#333333",
    };

    // 다시 시작 버튼
    const restartBtnBg = this.add
      .rectangle(400, 440, 200, 60, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth);

    this.add
      .text(400, 440, "RETRY", buttonStyle)
      .setOrigin(0.5)
      .setDepth(depth);

    restartBtnBg.on("pointerover", () => {
      restartBtnBg.setFillStyle(0xe0e0e0);
      restartBtnBg.setScale(1.05);
    });

    restartBtnBg.on("pointerout", () => {
      restartBtnBg.setFillStyle(0xffffff);
      restartBtnBg.setScale(1);
    });

    restartBtnBg.on("pointerdown", () => {
      this.restartGame();
    });

    // 스페이스키로도 재시작 가능
    const restartHandler = () => {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.input.keyboard?.off("keydown-SPACE", restartHandler);
        this.restartGame();
      }
    };

    this.input.keyboard?.on("keydown-SPACE", restartHandler);
  }

  /**
   * 게임 재시작
   */
  private restartGame() {
    // 게임 상태 리셋
    this.resetScores();
    this.gameState.isPlaying = false;
    this.gameState.isPaused = false;
    this.gameState.servingPlayer = "player";

    // 패들 위치 리셋
    this.playerPaddle.y = PINGPONG_CONFIG.GAME_HEIGHT / 2;
    this.aiPaddle.y = PINGPONG_CONFIG.GAME_HEIGHT / 2;

    if (this.playerPaddle.sprite) {
      this.playerPaddle.sprite.setPosition(
        this.playerPaddle.x,
        this.playerPaddle.y
      );
    }
    if (this.aiPaddle.sprite) {
      this.aiPaddle.sprite.setPosition(this.aiPaddle.x, this.aiPaddle.y);
    }

    // 볼 속도 리셋
    this.ball.speed = PINGPONG_CONFIG.BALL_INITIAL_SPEED;

    // 서브 준비
    this.prepareServe();
  }

  /**
   * 시작 메뉴 표시
   */
  private showStartMenu() {
    // 기존 UI 숨기기
    this.hideGameUI();

    // 제목 (벽돌깨기 스타일)
    const titleText = this.add
      .text(PINGPONG_CONFIG.GAME_WIDTH / 2, 150, "PING PONG", {
        fontFamily: '"Press Start 2P"',
        fontSize: "48px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // 시작 안내 (벽돌깨기 스타일)
    const startText = this.add
      .text(PINGPONG_CONFIG.GAME_WIDTH / 2, 380, "PRESS SPACE TO START", {
        fontFamily: '"Press Start 2P"',
        fontSize: "16px",
        color: "#ffff00",
      })
      .setOrigin(0.5);

    // 깜빡임 효과
    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.colorSelectionText = titleText; // 임시로 저장
  }

  /**
   * 색상 선택 화면 표시
   */
  private showColorSelection() {
    this.gameState.gameMode = "colorSelect";

    // 기존 메뉴 텍스트 제거
    this.children.removeAll();

    // 배경 다시 생성
    this.createBoard();

    // 제목
    this.add
      .text(PINGPONG_CONFIG.GAME_WIDTH / 2, 150, "패들 색상을 선택하세요", {
        fontSize: "32px",
        color: "#ffffff",
        fontFamily: "Arial Black, Arial, sans-serif",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // 색상 옵션 표시
    const redPaddle = this.add.image(250, 300, "pingpong_player");
    redPaddle.setScale(0.8);
    redPaddle.setTint(PINGPONG_CONFIG.PADDLE_COLORS[0].color);

    const bluePaddle = this.add.image(550, 300, "pingpong_player");
    bluePaddle.setScale(0.8);
    bluePaddle.setTint(PINGPONG_CONFIG.PADDLE_COLORS[1].color);

    // 라벨
    this.add
      .text(250, 380, "", {
        fontSize: "24px",
        color: "#ff2020",
        fontFamily: "Arial Black, Arial, sans-serif",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.add
      .text(550, 380, "", {
        fontSize: "24px",
        color: "#0066ff",
        fontFamily: "Arial Black, Arial, sans-serif",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // 선택 안내
    this.add
      .text(
        PINGPONG_CONFIG.GAME_WIDTH / 2,
        450,
        "← → 키로 선택, SPACE로 확인",
        {
          fontSize: "18px",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
        }
      )
      .setOrigin(0.5);

    this.colorPreviewPaddles = [redPaddle, bluePaddle];
    this.updateColorPreview();
  }

  /**
   * 색상 선택 미리보기 업데이트
   */
  private updateColorPreview() {
    // 모든 패들의 스케일을 기본으로 리셋하고 투명도 조정
    this.colorPreviewPaddles.forEach((paddle, index) => {
      paddle.setScale(0.8);
      paddle.setAlpha(index === this.playerPaddleColorIndex ? 1.0 : 0.5);
    });

    // 선택된 패들 강조
    if (this.colorPreviewPaddles[this.playerPaddleColorIndex]) {
      this.colorPreviewPaddles[this.playerPaddleColorIndex].setScale(1.2);

      // 선택된 색상 표시
      const colorIndex = this.playerPaddleColorIndex;
      console.log(`선택된 패들 색상 인덱스: ${colorIndex}`);
    }
  }

  /**
   * 게임 시작
   */
  private startGame() {
    this.gameState.gameMode = "playing";

    // AI 패들 색상을 플레이어 반대 색상으로 설정
    this.aiPaddleColorIndex = this.playerPaddleColorIndex === 0 ? 1 : 0;

    // 화면 정리
    this.children.removeAll();

    // 게임 오브젝트 다시 생성
    this.createBoard();
    this.createPaddles();
    this.createBall();
    this.createUI();

    // 점수 리셋
    this.resetScores();

    // 게임 UI 표시
    this.showGameUI();

    // 서브 준비
    this.prepareServe();
  }

  /**
   * 게임 UI 숨기기
   */
  private hideGameUI() {
    if (this.playerScoreText) this.playerScoreText.setVisible(false);
    if (this.aiScoreText) this.aiScoreText.setVisible(false);
    if (this.gameStatusText) this.gameStatusText.setVisible(false);
    if (this.scoreBar) this.scoreBar.setVisible(false);
  }

  /**
   * 게임 UI 표시
   */
  private showGameUI() {
    if (this.playerScoreText) this.playerScoreText.setVisible(true);
    if (this.aiScoreText) this.aiScoreText.setVisible(true);
    if (this.gameStatusText) this.gameStatusText.setVisible(true);
    if (this.scoreBar) this.scoreBar.setVisible(true);
  }
  /**
   * 플레이어 위치 표시 - 현대적 게이밍 스타일
   */
  private showPlayerIndicators() {
    // 플레이어 UI 패널 (왼쪽)
    const playerPanel = this.add.graphics();
    playerPanel.fillStyle(0x00ff88, 0.8); // 네온 그린
    playerPanel.fillRoundedRect(
      this.playerPaddle.x - 50,
      this.playerPaddle.y - 100,
      100,
      35,
      8
    );
    playerPanel.lineStyle(2, 0x00ffaa, 1);
    playerPanel.strokeRoundedRect(
      this.playerPaddle.x - 50,
      this.playerPaddle.y - 100,
      100,
      35,
      8
    );

    const playerText = this.add
      .text(this.playerPaddle.x, this.playerPaddle.y - 82, "PLAYER 1", {
        fontSize: "14px",
        color: "#000000",
        fontFamily: "Arial, sans-serif",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // AI UI 패널 (오른쪽)
    const aiPanel = this.add.graphics();
    aiPanel.fillStyle(0xff4466, 0.8); // 네온 핑크
    aiPanel.fillRoundedRect(
      this.aiPaddle.x - 50,
      this.aiPaddle.y - 100,
      100,
      35,
      8
    );
    aiPanel.lineStyle(2, 0xff6688, 1);
    aiPanel.strokeRoundedRect(
      this.aiPaddle.x - 50,
      this.aiPaddle.y - 100,
      100,
      35,
      8
    );

    const aiText = this.add
      .text(this.aiPaddle.x, this.aiPaddle.y - 82, "COMPUTER", {
        fontSize: "14px",
        color: "#000000",
        fontFamily: "Arial, sans-serif",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // 현대적인 화살표 (광선 효과)
    const playerBeam = this.add.graphics();
    playerBeam.lineStyle(3, 0x00ff88, 0.8);
    playerBeam.lineBetween(
      this.playerPaddle.x,
      this.playerPaddle.y - 65,
      this.playerPaddle.x,
      this.playerPaddle.y - 40
    );

    const aiBeam = this.add.graphics();
    aiBeam.lineStyle(3, 0xff4466, 0.8);
    aiBeam.lineBetween(
      this.aiPaddle.x,
      this.aiPaddle.y - 65,
      this.aiPaddle.x,
      this.aiPaddle.y - 40
    );

    // 패들에 글로우 효과
    const playerGlow = this.add.circle(
      this.playerPaddle.x,
      this.playerPaddle.y,
      40,
      0x00ff88,
      0.2
    );
    const aiGlow = this.add.circle(
      this.aiPaddle.x,
      this.aiPaddle.y,
      40,
      0xff4466,
      0.2
    );

    // 3초 후 부드럽게 사라지게 하기
    const elements = [
      playerPanel,
      playerText,
      aiPanel,
      aiText,
      playerBeam,
      aiBeam,
      playerGlow,
      aiGlow,
    ];

    this.time.delayedCall(3000, () => {
      // 모든 브리딩 애니메이션 중지
      this.tweens.killTweensOf(elements);

      // 부드럽게 페이드 아웃
      this.tweens.add({
        targets: elements,
        alpha: 0,
        duration: 500,
        ease: "Power2.easeIn",
        onComplete: () => {
          elements.forEach((element) => element.destroy());
        },
      });
    });

    // 부드러운 페이드 인 효과
    elements.forEach((element) => {
      element.setAlpha(0);
      this.tweens.add({
        targets: element,
        alpha: element === playerGlow || element === aiGlow ? 0.2 : 1,
        duration: 500,
        ease: "Power2.easeOut",
      });
    });

    // 페이드 인 완료 후 브리딩 애니메이션 시작 (0.6초 딜레이)
    this.time.delayedCall(600, () => {
      // 브리딩 애니메이션 - 투명해졌다가 진해지는 효과
      this.tweens.add({
        targets: [playerPanel, aiPanel],
        alpha: 0.6,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      this.tweens.add({
        targets: [playerText, aiText],
        alpha: 0.8,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      this.tweens.add({
        targets: [playerBeam, aiBeam],
        alpha: 0.5,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      // 글로우 브리딩 효과 (크기와 투명도 동시에)
      this.tweens.add({
        targets: [playerGlow, aiGlow],
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0.1,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }
}
