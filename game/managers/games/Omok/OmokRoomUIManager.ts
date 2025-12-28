// game/managers/games/Omok/OmokRoomUIManager.ts
import { Socket } from "socket.io-client";
import { OMOK_CONFIG, type RoomData } from "@/game/types/omok";
import { ButtonFactory } from "@/utils/ButtonFactory";

/**
 * OmokRoomUIManager
 * - 방 관련 UI 렌더링만 담당
 * - 네트워크 통신은 하지 않음 (데이터를 받아서 표시만)
 */
export class OmokRoomUIManager {
  private scene: Phaser.Scene;
  private socket: Socket;
  private readonly UI_DEPTH = OMOK_CONFIG.DEPTH.ROOM_UI;

  private currentScreen: "menu" | "create" | "list" | "waiting" = "menu";

  // UI 레이아웃 상수
  private readonly LAYOUT = {
    PANEL: {
      WIDTH: 600,
      HEIGHT: 700,
    },
    ROOM_CARD: {
      WIDTH: 500,
      HEIGHT: 70,
      SPACING: 80,
      START_Y: 220,
    },
    WAITING_ROOM: {
      PANEL_HEIGHT: 750,
      PLAYER_CARD_SPACING: 100,
      PLAYER_CARD_START_Y: 250,
      BUTTON_Y: -180,
      EXIT_BUTTON_Y: -90,
    },
  } as const;

  constructor(scene: Phaser.Scene, socket: Socket) {
    this.scene = scene;
    this.socket = socket;
  }

  // =====================================================================
  // 방 목록 UI
  // =====================================================================

  /**
   * 방 목록 UI 렌더링
   */
  public renderRoomList(rooms: RoomData[]): void {
    this.clearUI();
    this.currentScreen = "list";

    const { width, height } = this.scene.scale;
    const centerX = width / 2;

    // 배경 패널
    this.createPanel(
      centerX,
      height / 2,
      this.LAYOUT.PANEL.WIDTH,
      this.LAYOUT.PANEL.HEIGHT
    );

    // 타이틀
    this.createText(centerX, 120, "ROOM LIST", OMOK_CONFIG.TEXT_STYLE.SUBTITLE);

    // 방 목록
    this.renderRoomCards(rooms, centerX);

    // 방이 없을 때
    if (rooms.length === 0) {
      this.createText(centerX, height / 2, "생성된 방이 없습니다.", {
        color: OMOK_CONFIG.COLORS.SUB_TEXT,
      });
    }

    // 뒤로가기 버튼
    this.createBackButton(centerX, height - 120);
  }

  /**
   * 방 카드 렌더링
   */
  private renderRoomCards(rooms: RoomData[], centerX: number): void {
    let yPos = this.LAYOUT.ROOM_CARD.START_Y;

    rooms.forEach((room) => {
      const roomInfo = `${room.roomName}\n방장: ${room.hostUsername} | ${room.playerCount}/${room.maxPlayers}명`;

      const btn = ButtonFactory.createButton(
        this.scene,
        centerX,
        yPos,
        roomInfo,
        () => {
          // 버튼 클릭은 외부에서 처리 (네트워크 매니저 호출)
          this.emit("joinRoomRequested", room.roomId);
        },
        {
          width: this.LAYOUT.ROOM_CARD.WIDTH,
          height: this.LAYOUT.ROOM_CARD.HEIGHT,
          color: 0x2c3e50,
          textColor: "#ffffff",
          fontSize: "14px",
        }
      );
      btn.setDepth(this.UI_DEPTH);
      yPos += this.LAYOUT.ROOM_CARD.SPACING;
    });
  }

  // =====================================================================
  // 대기실 UI
  // =====================================================================

  /**
   * 대기실 UI 렌더링
   */
  public renderWaitingRoom(roomData: RoomData): void {
    this.clearUI();
    this.currentScreen = "waiting";

    const { width, height } = this.scene.scale;
    const centerX = width / 2;

    // 배경 패널
    this.createPanel(
      centerX,
      height / 2,
      this.LAYOUT.PANEL.WIDTH,
      this.LAYOUT.WAITING_ROOM.PANEL_HEIGHT
    );

    // 방 제목
    this.createText(
      centerX,
      120,
      roomData.roomName,
      OMOK_CONFIG.TEXT_STYLE.TITLE
    );

    // 플레이어 목록
    this.renderPlayerCards(roomData, centerX);

    // 버튼들
    this.renderWaitingRoomButtons(roomData, centerX, height);
  }

  /**
   * 플레이어 카드 렌더링
   */
  private renderPlayerCards(roomData: RoomData, centerX: number): void {
    roomData.players?.forEach((player, index) => {
      const isHost = player.socketId === roomData.hostSocketId;
      const isMe = player.socketId === this.socket.id;
      const yPos =
        this.LAYOUT.WAITING_ROOM.PLAYER_CARD_START_Y +
        index * this.LAYOUT.WAITING_ROOM.PLAYER_CARD_SPACING;

      // 플레이어 카드 배경
      this.scene.add
        .rectangle(
          centerX,
          yPos,
          500,
          80,
          isMe
            ? OMOK_CONFIG.COLORS.CARD_ACTIVE
            : OMOK_CONFIG.COLORS.CARD_INACTIVE
        )
        .setDepth(this.UI_DEPTH);

      // 이름
      this.createText(centerX - 220, yPos, player.username, {
        fontSize: "24px",
      }).setOrigin(0, 0.5);

      // 상태
      const isReady = (player as any).isReady;
      let statusText = isReady ? "READY" : "WAITING";
      if (isHost) statusText = "HOST 👑";

      this.createText(centerX + 220, yPos, statusText, {
        color: isReady ? OMOK_CONFIG.COLORS.GOLD : "#ffffff",
      }).setOrigin(1, 0.5);
    });
  }

  /**
   * 대기실 버튼 렌더링
   */
  private renderWaitingRoomButtons(
    roomData: RoomData,
    centerX: number,
    height: number
  ): void {
    const isHost = this.socket.id === roomData.hostSocketId;
    const btnY = height + this.LAYOUT.WAITING_ROOM.BUTTON_Y;

    if (isHost) {
      // 호스트: 게임 시작 버튼
      const startBtn = ButtonFactory.createButton(
        this.scene,
        centerX,
        btnY,
        "START GAME",
        () => this.emit("startGameRequested"),
        { width: 350, color: OMOK_CONFIG.COLORS.PRIMARY, textColor: "#ffffff" }
      );
      startBtn.setDepth(this.UI_DEPTH);
    } else {
      // 일반 플레이어: 준비 버튼
      const me = roomData.players?.find((p) => p.socketId === this.socket.id);
      const myReadyStatus = (me as any)?.isReady;

      const readyBtn = ButtonFactory.createButton(
        this.scene,
        centerX,
        btnY,
        myReadyStatus ? "CANCEL READY" : "READY",
        () => this.emit("toggleReadyRequested"),
        {
          width: 350,
          color: myReadyStatus
            ? OMOK_CONFIG.COLORS.DANGER
            : OMOK_CONFIG.COLORS.PRIMARY,
          textColor: "#ffffff",
        }
      );
      readyBtn.setDepth(this.UI_DEPTH);
    }

    // 나가기 버튼
    const exitBtn = ButtonFactory.createButton(
      this.scene,
      centerX,
      height + this.LAYOUT.WAITING_ROOM.EXIT_BUTTON_Y,
      "EXIT",
      () => this.emit("leaveRoomRequested"),
      { width: 200, height: 60, color: 0x333333, textColor: "#ffffff" }
    );
    exitBtn.setDepth(this.UI_DEPTH);
  }

  // =====================================================================
  // 방 생성 프롬프트
  // =====================================================================

  /**
   * 방 생성 프롬프트 표시
   */
  public showCreateRoomPrompt(): string | null {
    const roomName = prompt("방 제목을 입력하세요");

    // 취소 또는 빈 문자열이면 null 반환
    if (!roomName || roomName.trim() === "") {
      return null;
    }

    return roomName;
  }

  // =====================================================================
  // 공통 UI 요소
  // =====================================================================

  /**
   * 패널 생성
   */
  private createPanel(
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    this.scene.add
      .rectangle(x, y, width, height, OMOK_CONFIG.COLORS.PANEL, 0.95)
      .setStrokeStyle(4, 0xffffff, 0.1)
      .setDepth(this.UI_DEPTH - 1);
  }

  /**
   * 텍스트 생성
   */
  private createText(
    x: number,
    y: number,
    text: string,
    style: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}
  ): Phaser.GameObjects.Text {
    return this.scene.add
      .text(x, y, text, {
        ...OMOK_CONFIG.TEXT_STYLE.NORMAL,
        ...style,
      })
      .setOrigin(0.5)
      .setDepth(this.UI_DEPTH);
  }

  /**
   * 뒤로가기 버튼 생성
   */
  private createBackButton(x: number, y: number): void {
    const backBtn = ButtonFactory.createButton(
      this.scene,
      x,
      y,
      "BACK",
      () => this.emit("backRequested"),
      {
        width: 200,
        height: 60,
        color: OMOK_CONFIG.COLORS.DANGER,
        textColor: "#ffffff",
      }
    );
    backBtn.setDepth(this.UI_DEPTH);
  }

  // =====================================================================
  // 유틸리티
  // =====================================================================

  /**
   * UI 전체 정리
   */
  public clearUI(): void {
    const targets = this.scene.children.list.filter(
      (child: any) => child.depth >= this.UI_DEPTH - 1
    );
    targets.forEach((child) => child.destroy());
  }

  /**
   * 현재 화면 상태 반환
   */
  public getCurrentScreen(): string {
    return this.currentScreen;
  }

  /**
   * 이벤트 발생 (Scene에서 처리)
   */
  private emit(eventName: string, ...args: any[]): void {
    this.scene.events.emit(`omokRoomUI:${eventName}`, ...args);
  }
}
