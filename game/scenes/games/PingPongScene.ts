// game/scenes/games/PingPongScene.ts

import { BaseGameScene } from "@/game/scenes/base";
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
 */
export class PingPongScene extends BaseGameScene {
  // ✅ BaseGameScene 상속
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

  private readonly ASSET_PATH = "/assets/ping-pong/arts/";

  constructor() {
    super({ key: "PingPongScene" });
  }

  // ✅ BaseGameScene의 abstract 메서드 구현
  protected loadAssets(): void {
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

  // 매개변수 타입을 'string'으로 지정해야 에러가 나지 않습니다.
  protected centerViewport(backgroundColor: string = "#2c2c2c"): void {
    const { width: screenWidth, height: screenHeight } = this.scale;

    // 1. 브라우저 캔버스 배경색 설정 (뷰포트 바깥 영역)
    if (this.game && this.game.canvas) {
      this.game.canvas.style.backgroundColor = backgroundColor;
    }

    // 2. Phaser 카메라 배경색 설정 (뷰포트 안쪽 영역)
    this.cameras.main.setBackgroundColor(backgroundColor);

    // 3. 뷰포트 위치와 크기 설정 (중앙 정렬)
    this.cameras.main.setViewport(
      (screenWidth - this.GAME_WIDTH) / 2,
      (screenHeight - this.GAME_HEIGHT) / 2,
      this.GAME_WIDTH,
      this.GAME_HEIGHT
    );
  }

  protected setupScene(): void {
    this.centerViewport(PINGPONG_CONFIG.BACKGROUND_COLOR);
    this.initGameState();
  }

  protected initManagers(): void {
    this.uiManager = new PingPongUIManager(this);
    this.effectsManager = new PingPongEffectsManager(this);

    this.gameManager = new PingPongGameManager(this, this.gameState, {
      onScoreUpdate: (playerScore, aiScore) => {
        this.uiManager.updateScore(playerScore, aiScore);
      },
      onGameOver: (isPlayerWin) => {
        this.handleGameEnd(isPlayerWin ? "win" : "lose");
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

  protected createGameObjects(): void {
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

  protected onGameReady(): void {
    this.uiManager.showStartMenu();
  }

  protected handleGameEnd(result: string): void {
    const isPlayerWin = result === "win";
    this.uiManager.showGameOverScreen(
      isPlayerWin,
      this.gameState.playerScore,
      this.gameState.aiScore,
      () => this.restartGame()
    );

    this.inputManager.registerRestartListener(() => this.restartGame());
  }

  protected restartGame(): void {
    this.children.removeAll();
    this.gameManager.resetGame();
    this.createGameObjects();
    this.uiManager.showGameUI();
    this.gameManager.prepareServe();
  }

  protected cleanupManagers(): void {
    this.inputManager.cleanup();
    this.uiManager.cleanup();
  }

  // ✅ update: 게임 로직 실행 (BaseGameScene 생명주기와 독립적)
  update(time: number, delta: number) {
    this.inputManager.update();

    const moveDirection = this.inputManager.getPlayerMoveDirection();
    if (moveDirection) {
      this.gameManager.movePlayerPaddle(moveDirection, delta / 1000);
    }

    this.gameManager.update(delta / 1000);
  }

  // ============================================================
  // 게임 상태 & 이벤트
  // ============================================================

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

  private handleColorSelect(direction: "left" | "right"): void {
    this.playerPaddleColorIndex = direction === "left" ? 0 : 1;
    this.uiManager.updateColorPreview(this.playerPaddleColorIndex);
  }

  private handleServeAdjust(direction: "up" | "down"): void {
    const adjustment = direction === "up" ? -2 : 2;
    const newY = this.ball.y + adjustment;
    this.gameManager.adjustServePosition(newY);
  }

  private showColorSelection(): void {
    this.gameState.gameMode = "colorSelect";
    this.children.removeAll();
    this.createBoard();
    this.uiManager.showColorSelection(this.playerPaddleColorIndex);
  }

  private startGame(): void {
    this.gameState.gameMode = "playing";
    this.aiPaddleColorIndex = this.playerPaddleColorIndex === 0 ? 1 : 0;

    this.children.removeAll();
    this.createGameObjects();
    this.uiManager.showGameUI();

    this.gameManager.resetScores();
    this.gameManager.prepareServe();
  }

  // ============================================================
  // 게임 오브젝트 생성 메서드들
  // ============================================================

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

    tableGraphics.fillStyle(0x4db396, 0.3);
    tableGraphics.fillRoundedRect(
      centerX - boardWidth / 2 + 4,
      centerY - boardHeight / 2 + 4,
      boardWidth,
      boardHeight,
      15
    );

    tableGraphics.fillStyle(PINGPONG_CONFIG.TABLE_COLOR);
    tableGraphics.fillRoundedRect(
      centerX - boardWidth / 2,
      centerY - boardHeight / 2,
      boardWidth,
      boardHeight,
      15
    );

    tableGraphics.lineStyle(3, 0xffffff, 0.9);
    tableGraphics.strokeRoundedRect(
      centerX - boardWidth / 2,
      centerY - boardHeight / 2,
      boardWidth,
      boardHeight,
      15
    );

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

  private createNet(): void {
    const boardBounds = this.board.getBounds();
    const netX = PINGPONG_CONFIG.GAME_WIDTH / 2;
    const tableY = boardBounds.centerY;
    const netHeight = PINGPONG_CONFIG.NET_HEIGHT;

    const netGraphics = this.add.graphics();
    netGraphics.fillStyle(0x666666, 1);
    netGraphics.fillRect(netX - 2, tableY - netHeight - 5, 4, netHeight + 10);
  }

  private createPaddles(): void {
    const boardBounds = this.board.getBounds();
    const paddleScale = Math.min(
      PINGPONG_CONFIG.PADDLE_SCALE,
      (boardBounds.height * PINGPONG_CONFIG.PADDLE_SIZE_RATIO) / 100
    );

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
}
