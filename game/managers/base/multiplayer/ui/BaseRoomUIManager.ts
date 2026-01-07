import { Socket } from "socket.io-client";
import { BaseUIManager } from "../../BaseUIManager";
import { UI_DEPTH } from "@/game/types/common/ui.constants";
import { RoomUIConfig } from "@/game/types/common/ui.types";
import { RoomData } from "@/game/types/multiplayer/room.types";
import { ButtonSizeKey } from "@/game/types/common/ui.types";

/**
 * BaseRoomUIManager
 * - 방 UI 렌더링의 공통 구조 제공
 * - 디자인 시스템(ButtonSizeKey)을 준수하여 UI 일관성 유지
 */
export abstract class BaseRoomUIManager extends BaseUIManager {
  protected socket: Socket;
  protected config: RoomUIConfig;
  protected currentScreen: "menu" | "list" | "waiting" = "menu";

  // 기본 버튼 사이즈 정의 (시스템 공통 설정 준수)
  private readonly DEFAULT_BUTTON_SIZE: ButtonSizeKey = "MEDIUM";

  constructor(scene: Phaser.Scene, socket: Socket, config: RoomUIConfig) {
    super(scene);
    this.socket = socket;
    this.config = config;
  }

  // =====================================================================
  // BaseUIManager 필수 구현 및 정리
  // =====================================================================

  public createGameUI(): void {}

  public cleanup(): void {
    const list = this.scene.children.list as Phaser.GameObjects.Image[];

    const targets = list.filter((child) => child.depth >= UI_DEPTH.UI - 5);

    targets.forEach((child) => child.destroy());
    this.currentScreen = "menu";
  }

  // =====================================================================
  // 방 목록 UI
  // =====================================================================

  public renderRoomList(rooms: RoomData[]): void {
    this.cleanup();
    this.currentScreen = "list";

    const { width, height } = this.scene.scale;
    const centerX = width / 2;

    this.createPanel(
      centerX,
      height / 2,
      this.config.layout.panelWidth,
      this.config.layout.panelHeight
    );
    this.createText(centerX, 120, "ROOM LIST", this.config.textStyle.title);

    if (!Array.isArray(rooms) || rooms.length === 0) {
      const msg = Array.isArray(rooms)
        ? "생성된 방이 없습니다."
        : "목록을 불러올 수 없습니다.";
      this.createText(centerX, height / 2, msg, {
        color: this.config.colors.subText,
      });
    } else {
      this.renderRoomCards(rooms, centerX);
    }

    this.createBackButton(centerX, height - 120);
  }

  protected renderRoomCards(rooms: RoomData[], centerX: number): void {
    const { roomCardSpacing } = this.config.layout;
    let yPos = 220;

    rooms.forEach((room) => {
      const lockIcon = room.isPrivate ? "🔒 " : "";
      const roomInfo = `${lockIcon}${room.roomName}\n방장: ${room.hostUsername} | ${room.playerCount}/${room.maxPlayers}명`;

      this.createCommonButton(
        centerX,
        yPos,
        roomInfo,
        () => {
          this.emit("joinRoomRequested", room.roomId, room.isPrivate);
        },
        {
          size: this.DEFAULT_BUTTON_SIZE,
          color: this.config.colors.cardInactive,
          textColor: "#ffffff",
          fontSize: "14px",
        }
      ).setDepth(UI_DEPTH.UI);

      yPos += roomCardSpacing;
    });
  }

  // =====================================================================
  // 대기실 UI
  // =====================================================================

  public renderWaitingRoom(roomData: RoomData): void {
    this.cleanup();
    this.currentScreen = "waiting";

    const { width, height } = this.scene.scale;
    const centerX = width / 2;

    this.createPanel(centerX, height / 2, this.config.layout.panelWidth, 750);
    this.createText(
      centerX,
      120,
      roomData.roomName,
      this.config.textStyle.title
    );

    this.renderPlayerCards(roomData, centerX);
    this.renderWaitingRoomButtons(roomData, centerX, height);
  }

  protected renderWaitingRoomButtons(
    roomData: RoomData,
    centerX: number,
    height: number
  ): void {
    const isHost = this.socket.id === roomData.hostSocketId;
    const btnY = height - 180;

    if (isHost) {
      const allReady = this.checkAllPlayersReady(roomData);

      this.createCommonButton(
        centerX,
        btnY,
        allReady ? "START GAME" : "WAITING...",
        () => {
          if (allReady) this.emit("startGameRequested");
        },
        {
          size: this.DEFAULT_BUTTON_SIZE,
          color: this.config.colors.primary,
          textColor: "#ffffff",
        }
      )
        .setAlpha(allReady ? 1 : 0.5)
        .setDepth(UI_DEPTH.UI);
    } else {
      const me = roomData.players?.find((p) => p.socketId === this.socket.id);
      const isMeReady = me?.isReady;

      this.createCommonButton(
        centerX,
        btnY,
        isMeReady ? "CANCEL READY" : "READY",
        () => {
          this.emit("toggleReadyRequested");
        },
        {
          size: this.DEFAULT_BUTTON_SIZE,
          color: isMeReady
            ? this.config.colors.danger
            : this.config.colors.primary,
          textColor: "#ffffff",
        }
      ).setDepth(UI_DEPTH.UI);
    }

    // EXIT 버튼
    this.createCommonButton(
      centerX,
      height - 90,
      "EXIT",
      () => this.emit("leaveRoomRequested"),
      {
        size: "SMALL",
        color: 0x333333,
        textColor: "#ffffff",
      }
    ).setDepth(UI_DEPTH.UI);
  }

  // =====================================================================
  // 공통 UI 요소 및 유틸리티
  // =====================================================================

  protected createPanel(
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    this.scene.add
      .rectangle(x, y, width, height, this.config.colors.panel, 0.95)
      .setStrokeStyle(4, 0xffffff, 0.1)
      .setDepth(UI_DEPTH.UI - 1);
  }

  protected createText(
    x: number,
    y: number,
    text: string,
    style: object = {}
  ): Phaser.GameObjects.Text {
    return this.scene.add
      .text(x, y, text, { ...this.config.textStyle.normal, ...style })
      .setOrigin(0.5)
      .setDepth(UI_DEPTH.UI);
  }

  protected createBackButton(x: number, y: number): void {
    this.createCommonButton(x, y, "BACK", () => this.emit("backRequested"), {
      size: "SMALL",
      color: this.config.colors.danger,
      textColor: "#ffffff",
    }).setDepth(UI_DEPTH.UI);
  }

  private checkAllPlayersReady(roomData: RoomData): boolean {
    if (!roomData.players || roomData.players.length < 2) return false;
    return roomData.players
      .filter((p) => p.socketId !== roomData.hostSocketId)
      .every((p) => p.isReady);
  }

  public getCurrentScreen(): string {
    return this.currentScreen;
  }

  protected emit(eventName: string, ...args: unknown[]): void {
    this.scene.events.emit(`roomUI:${eventName}`, ...args);
  }

  protected renderPlayerCards(roomData: RoomData, centerX: number): void {
    const { playerCardHeight, playerCardSpacing } = this.config.layout;
    let yPos = 250;

    roomData.players?.forEach((player) => {
      const isHost = player.socketId === roomData.hostSocketId;
      const isMe = player.socketId === this.socket.id;

      // 플레이어 카드 배경
      this.scene.add
        .rectangle(
          centerX,
          yPos,
          500,
          playerCardHeight,
          isMe ? this.config.colors.cardActive : this.config.colors.cardInactive
        )
        .setDepth(UI_DEPTH.UI);

      // 이름
      this.createText(centerX - 220, yPos, player.username, {
        fontSize: "24px",
      }).setOrigin(0, 0.5);

      // 상태
      const isReady = player.isReady;
      let statusText = isReady ? "READY" : "WAITING";
      if (isHost) statusText = "HOST 👑";

      this.createText(centerX + 220, yPos, statusText, {
        color: isReady ? this.config.colors.gold : "#ffffff",
      }).setOrigin(1, 0.5);

      yPos += playerCardSpacing;
    });
  }

  // =====================================================================
  // =====================================================================

  public showCreateRoomPrompt(): {
    roomName: string;
    isPrivate: boolean;
    password?: string;
  } | null {
    const roomName = prompt("방 제목을 입력하세요:");
    if (!roomName || roomName.trim() === "") {
      return null;
    }

    const isPrivate = confirm("비공개 방으로 만드시겠습니까?");
    let password: string | undefined;

    if (isPrivate) {
      const input = prompt("비밀번호를 입력하세요 (4~20자)");
      if (!input || input.length < 4 || input.length > 20) {
        alert("비밀번호는 4~20자여야 합니다.");
        return null;
      }
      password = input;
    }

    return { roomName, isPrivate, password };
  }
  public showJoinPasswordPrompt(): string | null {
    const password = prompt("비밀번호를 입력하세요:");
    return password;
  }
}
