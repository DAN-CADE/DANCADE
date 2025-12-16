// game/scenes/PingPongScene.ts
import {
  PINGPONG_CONFIG,
  PingPongPaddle,
  PingPongBall,
  PingPongGameState,
  PingPongInputState,
} from "@/game/types/realPingPong";
import { PingPongGameManager } from "@/game/managers/games/pingpong/PingPongGameManager";
import { PingPongUIManager } from "@/game/managers/games/pingpong/PingPongUIManager";
import { PingPongInputManager } from "@/game/managers/games/pingpong/PingPongInputManager";
import { PingPongEffectsManager } from "@/game/managers/games/pingpong/PingPongEffectsManager";

/**
 * Real Ping Pong 게임 씬
 * 매니저들을 조합하여 게임을 구성
 */
export class PingPongScene extends Phaser.Scene {
  // Managers
  private gameManager!: PingPongGameManager;
  private uiManager!: PingPongUIManager;
  private inputManager!: PingPongInputManager;
  private effectsManager!: PingPongEffectsManager;

  // Game Objects
  private playerPaddle!: PingPongPaddle;
  private aiPaddle!: PingPongPaddle;
  private ball!: PingPongBall;
  private board!: Phaser.GameObjects.Image;

  // Game State
  private gameState!: PingPongGameState;
  private inputState!: PingPongInputState;

  // Color Selection
  private playerPaddleColorIndex: number =
    PINGPONG_CONFIG.DEFAULT_PLAYER_PADDLE_COLOR;
  private aiPaddleColorIndex: number = PINGPONG_CONFIG.DEFAULT_AI_PADDLE_COLOR;

  // Constants
  private readonly ASSET_PATH = "/assets/ping-pong/arts/";

  constructor() {
    super({ key: "PingPongScene" });
  }

  preload() {
    this.loadAssets();
  }

  create() {
    this.scale.resize(800, 600);
    this.setupScene();
    this.initGameState();
    this.initManagers();
    this.createGameObjects();

    this.uiManager.showStartMenu();
  }

  update(time: number, delta: number) {
    this.inputManager.update();

    // 플레이어 패들 이동
    const moveDirection = this.inputManager.getPlayerMoveDirection();
    if (moveDirection) {
      this.gameManager.movePlayerPaddle(moveDirection, delta / 1000);
    }

    this.gameManager.update(delta / 1000);
  }

  shutdown() {
    this.inputManager.cleanup();
    this.uiManager.cleanup();
  }

  /**
   * 에셋 로드
   */
  private loadAssets(): void {
    this.load.image("pingpong_ball", `${this.ASSET_PATH}Ball.png`);
    this.load.image("pingpong_ball_motion", `${this.ASSET_PATH}BallMotion.png`);
    this.load.image("pingpong_board", `${this.ASSET_PATH}Board.png`);
    this.load.image("pingpong_player", `${this.ASSET_PATH}Player.png`);
    this.load.image("pingpong_computer", `${this.ASSET_PATH}Computer.png`);
    this.load.image("pingpong_scorebar", `${this.ASSET_PATH}ScoreBar.png`);
    this.load.image(
      "ball_blue",
      "/assets/game/kenney_puzzle-pack/png/ballBlue.png"
    );
  }

  /**
   * 씬 기본 설정
   */
  private setupScene(): void {
    this.cameras.main.setBackgroundColor(PINGPONG_CONFIG.BACKGROUND_COLOR);
  }

  /**
   * 게임 상태 초기화
   */
  private initGameState(): void {
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
   * 매니저 초기화
   */
  private initManagers(): void {
    // UI Manager
    this.uiManager = new PingPongUIManager(this);

    // Effects Manager
    this.effectsManager = new PingPongEffectsManager(this);

    // Game Manager
    this.gameManager = new PingPongGameManager(this, this.gameState, {
      onScoreUpdate: (playerScore, aiScore) => {
        this.uiManager.updateScore(playerScore, aiScore);
      },
      onGameOver: (isPlayerWin) => {
        this.handleGameOver(isPlayerWin);
      },
      onPointScored: (scorer) => {
        this.effectsManager.createScoreEffect(
          scorer,
          this.uiManager["playerScoreText"]!,
          this.uiManager["aiScoreText"]!
        );
      },
      onNetHit: (x, y) => {
        this.effectsManager.createNetHitEffect(x, y);
      },
    });

    // Input Manager
    this.inputManager = new PingPongInputManager(
      this,
      this.gameState,
      this.inputState,
      {
        onSpacePress: () => this.handleSpacePress(),
        onColorSelect: (direction) => this.handleColorSelect(direction),
        onServeAdjust: (direction) => this.handleServeAdjust(direction),
      }
    );
  }

  /**
   * 게임 오브젝트 생성
   */
  private createGameObjects(): void {
    this.createBoard();
    this.createNet();
    this.createPaddles();
    this.createBall();
    this.uiManager.createGameUI();

    this.gameManager.setGameObjects(
      this.playerPaddle,
      this.aiPaddle,
      this.ball,
      this.board
    );
  }

  /**
   * 탁구대 생성
   */
  private createBoard(): void {
    const originalBoard = this.add.image(
      PINGPONG_CONFIG.GAME_WIDTH / 2,
      PINGPONG_CONFIG.GAME_HEIGHT / 2,
      "pingpong_board"
    );
    originalBoard.setVisible(false);

    const scaleX = PINGPONG_CONFIG.GAME_WIDTH / originalBoard.width;
    const scaleY =
      (PINGPONG_CONFIG.GAME_HEIGHT - PINGPONG_CONFIG.BOARD_UI_SPACE) /
      originalBoard.height;
    const scale = Math.min(scaleX, scaleY) * PINGPONG_CONFIG.BOARD_SCALE_MARGIN;

    const boardWidth = originalBoard.width * scale;
    const boardHeight = originalBoard.height * scale;
    const centerX = PINGPONG_CONFIG.GAME_WIDTH / 2;
    const centerY = PINGPONG_CONFIG.GAME_HEIGHT / 2;

    const tableGraphics = this.add.graphics();

    // 그림자
    tableGraphics.fillStyle(0x4db396, 0.3);
    tableGraphics.fillRoundedRect(
      centerX - boardWidth / 2 + 4,
      centerY - boardHeight / 2 + 4,
      boardWidth,
      boardHeight,
      15
    );

    // 메인 테이블
    tableGraphics.fillStyle(PINGPONG_CONFIG.TABLE_COLOR);
    tableGraphics.fillRoundedRect(
      centerX - boardWidth / 2,
      centerY - boardHeight / 2,
      boardWidth,
      boardHeight,
      15
    );

    // 경계선
    tableGraphics.lineStyle(3, 0xffffff, 0.9);
    tableGraphics.strokeRoundedRect(
      centerX - boardWidth / 2,
      centerY - boardHeight / 2,
      boardWidth,
      boardHeight,
      15
    );

    // 중앙선
    tableGraphics.lineStyle(3, 0xffffff, 0.6);
    const startY = centerY - boardHeight / 2 + 20;
    const endY = centerY + boardHeight / 2 - 20;

    for (let y = startY; y < endY; y += 15) {
      tableGraphics.lineBetween(centerX, y, centerX, Math.min(y + 8, endY));
    }

    tableGraphics.setDepth(-1);

    this.board = originalBoard;
    this.board.setScale(scale);
  }

  /**
   * 네트 생성
   */
  private createNet(): void {
    const boardBounds = this.board.getBounds();
    const netX = PINGPONG_CONFIG.GAME_WIDTH / 2;
    const tableY = boardBounds.centerY;
    const netHeight = PINGPONG_CONFIG.NET_HEIGHT;

    const netGraphics = this.add.graphics();
    netGraphics.fillStyle(0x666666, 1);
    netGraphics.fillRect(netX - 2, tableY - netHeight - 5, 4, netHeight + 10);
  }

  /**
   * 패들 생성
   */
  private createPaddles(): void {
    const boardBounds = this.board.getBounds();
    const paddleScale = Math.min(
      PINGPONG_CONFIG.PADDLE_SCALE,
      (boardBounds.height * PINGPONG_CONFIG.PADDLE_SIZE_RATIO) / 100
    );

    // 플레이어 패들
    const playerX = boardBounds.left + PINGPONG_CONFIG.BOARD_PADDLE_MARGIN;
    const playerY = PINGPONG_CONFIG.GAME_HEIGHT / 2;
    const playerSprite = this.add.image(playerX, playerY, "pingpong_player");
    playerSprite.setScale(paddleScale);
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

    // AI 패들
    const aiX = boardBounds.right - PINGPONG_CONFIG.BOARD_PADDLE_MARGIN;
    const aiY = PINGPONG_CONFIG.GAME_HEIGHT / 2;
    const aiSprite = this.add.image(aiX, aiY, "pingpong_computer");
    aiSprite.setScale(paddleScale);
    aiSprite.setFlipX(true);
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
  private createBall(): void {
    const ballX = PINGPONG_CONFIG.GAME_WIDTH / 2;
    const ballY = PINGPONG_CONFIG.GAME_HEIGHT / 2;

    const ballSprite = this.add.image(ballX, ballY, "pingpong_ball");
    ballSprite.setScale(PINGPONG_CONFIG.BALL_SCALE);

    this.ball = {
      x: ballX,
      y: ballY,
      radius: (ballSprite.width * PINGPONG_CONFIG.BALL_SCALE) / 2,
      velocityX: 0,
      velocityY: 0,
      speed: PINGPONG_CONFIG.BALL_INITIAL_SPEED,
      sprite: ballSprite,
      motionSprite: undefined,
    };
  }

  /**
   * 스페이스 키 처리
   */
  private handleSpacePress(): void {
    switch (this.gameState.gameMode) {
      case "menu":
        this.showColorSelection();
        break;
      case "colorSelect":
        this.startGame();
        break;
      case "playing":
        if (
          this.gameState.isPreparingServe ||
          (!this.gameState.isPlaying &&
            this.gameState.servingPlayer === "player")
        ) {
          this.gameManager.serve();
        }
        break;
    }
  }

  /**
   * 색상 선택 처리
   */
  private handleColorSelect(direction: "left" | "right"): void {
    this.playerPaddleColorIndex = direction === "left" ? 0 : 1;
    this.uiManager.updateColorPreview(this.playerPaddleColorIndex);
  }

  /**
   * 서브 위치 조정
   */
  private handleServeAdjust(direction: "up" | "down"): void {
    const adjustment = direction === "up" ? -2 : 2;
    const newY = this.ball.y + adjustment;
    this.gameManager.adjustServePosition(newY);
  }

  /**
   * 색상 선택 화면 표시
   */
  private showColorSelection(): void {
    this.gameState.gameMode = "colorSelect";
    this.children.removeAll();
    this.createBoard();
    this.uiManager.showColorSelection(this.playerPaddleColorIndex);
  }

  /**
   * 게임 시작
   */
  private startGame(): void {
    this.gameState.gameMode = "playing";
    this.aiPaddleColorIndex = this.playerPaddleColorIndex === 0 ? 1 : 0;

    this.children.removeAll();
    this.createGameObjects();
    this.uiManager.showGameUI();

    this.gameManager.resetScores();
    this.gameManager.prepareServe();
  }

  /**
   * 게임 오버 처리
   */
  private handleGameOver(isPlayerWin: boolean): void {
    this.uiManager.showGameOverScreen(
      isPlayerWin,
      this.gameState.playerScore,
      this.gameState.aiScore,
      () => this.restartGame()
    );

    // 스페이스 키로도 재시작
    this.inputManager.registerRestartListener(() => this.restartGame());
  }

  /**
   * 게임 재시작
   */
  private restartGame(): void {
    this.children.removeAll();
    this.gameManager.reset();
    this.createGameObjects();
    this.uiManager.showGameUI();
    this.gameManager.prepareServe();
  }
}
